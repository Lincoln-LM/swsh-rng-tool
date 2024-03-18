'use client';
import { useRef, useState } from "react";
import { API } from "./api";
import { ConnectionInterface } from "./components/connection_interface";
import { Settings } from "./components/settings";
import { Xoroshiro, loadModule } from "./wasm"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [rngAdvance, setRngAdvance] = useState(0);
  const [initialRngState, setInitialRngState] = useState(new BigUint64Array(2));
  const [rngPointer, setRngPointer] = useState(null as Xoroshiro | null);
  const rngPointerRef = useRef<Xoroshiro | null>();
  rngPointerRef.current = rngPointer;

  if (!isLoaded) {
    loadModule().then(() => setIsLoaded(true));
    return null;
  }
  async function onConnect() {
    const rngState = await API.rngState();
    setInitialRngState(rngState);
    setRngPointer(new Xoroshiro(rngState));
  }
  async function onDisconnect() {

  }
  async function updateCallback() {
    const state = await API.rngState();
    if (rngPointerRef.current) {
      const offset = rngPointerRef.current.update(state);
      setRngAdvance((old) => old + offset);
    }
  }

  return (
    <main className="w-full h-screen flex flex-col gap-4 p-4">
      <ConnectionInterface onConnect={onConnect} updateCallback={updateCallback} onDisconnect={onDisconnect} />
      <Settings rngAdvance={rngAdvance} />
    </main>
  );
}
