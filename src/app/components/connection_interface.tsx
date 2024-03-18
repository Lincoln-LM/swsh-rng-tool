import { useId, useState } from "react";
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
  const [ipAddress, setIpAddress] = useState('');
  const [updateInterval, setUpdateInterval] = useState(0 as NodeJS.Timeout | number);
  const buttonColorClass = isConnected ? "bg-red-500 active:bg-red-600 hover:bg-red-600" : "bg-blue-500 active:bg-blue-600 hover:bg-blue-600";
  const id = useId();
  function onClick() {
    if (isConnected) {
      clearInterval(updateInterval);
      onDisconnect();
      setIsConnected(false);
    } else {
      API.connect(ipAddress)
        .then((response) => {
          if (response.ok) {
            setIsConnected(true);
            onConnect().then(() => setUpdateInterval(setInterval(updateCallback, 100)));
          }
        }
        );
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