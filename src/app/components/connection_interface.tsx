import { useId, useRef, useState } from "react";
import { API } from "../api";

export function ConnectionInterface(
  {
    onConnect,
    updateCallback,
    onDisconnect,
  }: {
    onConnect: () => Promise<void>,
    updateCallback: () => Promise<void>,
    onDisconnect: () => Promise<void>
  }
) {
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;
  const [ipAddress, setIpAddress] = useState('');
  const [updatePromise, setUpdatePromise] = useState(null as Promise<void> | null);
  const buttonColorClass = isConnected ? "bg-red-500 active:bg-red-600 hover:bg-red-600" : "bg-blue-500 active:bg-blue-600 hover:bg-blue-600";
  const id = useId();
  function onClick() {
    if (isConnected) {
      setIsConnected(false);
      updatePromise?.then(() => {
        onDisconnect();
        API.disconnect();
      })
    } else {
      setUpdatePromise(API.connect(ipAddress)
        .then(async (response) => {
          if (response.ok) {
            setIsConnected(true);
            isConnectedRef.current = true;
            await onConnect();
            while (isConnectedRef.current) {
              await updateCallback();
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }
        ));
    }
  }
  return (
    <div className="p-4 w-full flex flex-col gap-2">
      <label className="text-lg font-bold" htmlFor={id}>IP Address</label>
      <div id={id} className="flex w-full">
        <input onChange={(e) => setIpAddress(e.target.value)} className="w-6/12 p-2 border border-gray-300 rounded text-black" type="text" placeholder="Enter IP Address" />
        <button onClick={onClick} className={buttonColorClass + ' text-white p-2 px-4 rounded w-6/12'}>{isConnected ? "Disconnect" : "Connect"}</button>
      </div>
    </div>
  )
}