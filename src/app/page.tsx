'use client';
import { useRef, useState } from "react";
import { API, Spawner, SpawnerList } from "./api";
import { ConnectionInterface } from "./components/connection_interface";
import { InfoInterface, Settings } from "./components/settings";
import { FiltersInterface, Filters } from "./components/filters";
import { ResultsInterface } from "./components/results";
import { Xoroshiro, loadModule } from "./wasm"

export default function Home() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [rngAdvance, setRngAdvance] = useState(0);
    const [initialRngState, setInitialRngState] = useState(new BigUint64Array(2));
    const [rngPointer, setRngPointer] = useState(null as Xoroshiro | null);
    const [fullSpawnerList, setFullSpawnerList] = useState({ gimmickSpawners: [], encountSpawners: [] } as SpawnerList);
    const [spawner, setSpawner] = useState<Spawner | null>(null);
    const rngPointerRef = useRef<Xoroshiro | null>();
    const loadedSpawnersRef = useRef<Spawner[]>();
    const spawnerRef = useRef<Spawner | null>();
    const spawnerCanvasRef = useRef<HTMLCanvasElement>(null);
    rngPointerRef.current = rngPointer;
    spawnerRef.current = spawner;

    const [settings, setSettings] = useState<Settings>({
        minAdvance: 0,
        totalAdvances: 100,
        npcCount: 0,
        flyCalibration: 0,
        rainCalibration: 0,
        tidsid: 0,
        hasShinyCharm: false,
        hasMarkCharm: false,
        weather: 0,
        encounterType: 0,
    })

    const loadedSpawners = settings.encounterType === 0 ? fullSpawnerList.gimmickSpawners : fullSpawnerList.encountSpawners;
    loadedSpawnersRef.current = loadedSpawners;
    if (spawner == null && loadedSpawners.length > 0) {
        setSpawner(loadedSpawners[0]);
    }
    const updateSpawners = async () => setFullSpawnerList(await API.loadedSpawners());
    const [filters, setFilters] = useState<Filters>(
        {
            ivMin: [0, 0, 0, 0, 0, 0],
            ivMax: [31, 31, 31, 31, 31, 31],
            abilities: 0,
            shininess: 0,
            slots: 0,
            natures: 0,
            marks: [0, 0],
            genders: 0,
            scales: 0
        })

    if (!isLoaded) {
        loadModule().then(() => setIsLoaded(true));
        return null;
    }
    async function onConnect() {
        const rngState = await API.rngState();
        if (rngPointerRef.current) {
            const offset = rngPointerRef.current.update(rngState);
            if (offset < 1000000) {
                setRngAdvance((old) => old + offset);
            }
            else {
                setRngAdvance(0);
                setInitialRngState(rngState);
                setRngPointer(new Xoroshiro(rngState));
            }
        }
        else {
            setRngAdvance(0);
            setInitialRngState(rngState);
            setRngPointer(new Xoroshiro(rngState));
        }
        const tidsid = await API.tidsid();
        const charms = await API.charms();
        setSettings((settings) => {
            return {
                ...settings,
                tidsid: tidsid,
                hasMarkCharm: charms.hasMarkCharm,
                hasShinyCharm: charms.hasShinyCharm
            };
        })
        await updateSpawners();
    }
    async function onDisconnect() {

    }
    async function updateCallback() {
        const state = await API.rngState();
        if (rngPointerRef.current) {
            const offset = rngPointerRef.current.update(state);
            setRngAdvance((old) => old + offset);
        }
        const weather = await API.currentWeather();
        setSettings((settings) => {
            return { ...settings, weather };
        })
        if (spawnerCanvasRef.current && loadedSpawnersRef.current) {
            const ctx = spawnerCanvasRef.current.getContext("2d");
            if (ctx) {
                const playerPosition = await API.playerPosition();
                const center = { x: spawnerCanvasRef.current.width / 2, y: spawnerCanvasRef.current.height / 2 };
                const scale = spawnerCanvasRef.current.width / 15000;
                ctx.clearRect(0, 0, spawnerCanvasRef.current.width, spawnerCanvasRef.current.height);
                ctx.strokeStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.moveTo(center.x, center.y - 6);
                ctx.lineTo(center.x - 4, center.y + 6);
                ctx.lineTo(center.x + 4, center.y + 6);
                ctx.closePath();
                ctx.stroke();
                ctx.closePath();
                for (const spawner of loadedSpawnersRef.current) {
                    const isSelected = spawner === spawnerRef.current;
                    ctx.strokeStyle = isSelected ? "#FFFFFF" : "#FFFFFF20"
                    ctx.beginPath();
                    const spawnerPosition = {
                        x: (spawner.position[0] - playerPosition.x) * scale,
                        y: (spawner.position[2] - playerPosition.z) * scale,
                    };
                    const relativePosition = {
                        x: spawnerPosition.x * Math.cos(playerPosition.yaw) - spawnerPosition.y * Math.sin(playerPosition.yaw) + center.x,
                        y: spawnerPosition.x * Math.sin(playerPosition.yaw) + spawnerPosition.y * Math.cos(playerPosition.yaw) + center.y,
                    }
                    ctx.moveTo(center.x, center.y);
                    ctx.lineTo(relativePosition.x, relativePosition.y);
                    ctx.stroke();
                    ctx.closePath();
                    ctx.strokeStyle = "#FFFFFF"
                    ctx.beginPath();
                    ctx.arc(relativePosition.x, relativePosition.y, 5, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.closePath();
                    ctx.strokeStyle = isSelected ? "#FF8080" : "#FF808020"
                    ctx.beginPath();
                    ctx.arc(relativePosition.x, relativePosition.y, spawner.despawnRadius * scale, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.closePath();
                    ctx.strokeStyle = isSelected ? "#80FF80" : "#80FF8020"
                    ctx.beginPath();
                    ctx.arc(relativePosition.x, relativePosition.y, spawner.spawnRadius * scale, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }

    return (
        <main className="w-full h-screen flex flex-col gap-4 p-4">
            <ConnectionInterface onConnect={onConnect} updateCallback={updateCallback} onDisconnect={onDisconnect} />
            <InfoInterface weather={settings.weather} setSpawner={setSpawner} updateSpawners={updateSpawners} loadedSpawners={loadedSpawners} spawnerCanvasRef={spawnerCanvasRef} rngAdvance={rngAdvance} settings={settings} setSettings={setSettings} />
            <FiltersInterface filters={filters} setFilters={setFilters} />
            <ResultsInterface gimmickSpec={spawner?.gimmickSpecs[settings.weather]} encounterTable={spawner?.encounterSlotTables[settings.weather]} initialRngState={initialRngState} filters={filters} settings={settings} />
        </main>
    );
}
