import { useId, useState } from "react";
import { GENDERS, NATURES, SPECIES, WEATHERS } from "../resources";
import { Spawner } from "../api";

export interface Settings {
    minAdvance: number,
    totalAdvances: number,
    npcCount: number,
    flyCalibration: number,
    rainCalibration: number,
    doRotationRand: boolean,
    tidsid: number,
    hasShinyCharm: boolean,
    hasMarkCharm: boolean,
    weather: number,
    encounterType: number,
}

export function InfoInterface(
    {
        rngAdvance,
        settings,
        setSettings,
        spawnerCanvasRef,
        loadedSpawners,
        setSpawner,
        updateSpawners,
        weather,
    }: {
        rngAdvance: number,
        settings: Settings,
        setSettings: (settings: Settings | ((prevSettings: Settings) => Settings)) => void,
        spawnerCanvasRef: React.RefObject<HTMLCanvasElement>,
        loadedSpawners: Spawner[],
        setSpawner: (spawner: Spawner | null) => void,
        updateSpawners: () => Promise<void>,
        weather: number
    }
) {
    const id = useId();
    const [selectedSpawner, setSelectedSpawner] = useState(0);
    const [minAsCurrent, setMinAsCurrent] = useState(false);
    if (minAsCurrent) {
        setSettings((settings) => {
            settings.minAdvance = rngAdvance;
            return settings;
        });
    }

    function spawnerSummary() {
        if (loadedSpawners.length === 0) {
            return "N/A";
        }
        const spawner = loadedSpawners[selectedSpawner];
        if (settings.encounterType === 0) {
            const gimmick = spawner.gimmickSpecs[weather];
            return (
                <div className="flex flex-row text-lg gap-2">
                    <span>{SPECIES[gimmick.species]}{gimmick.form !== 0 ? "-" + gimmick.form : ""}</span>
                    <span>Level {gimmick.level}</span>
                    {gimmick.shininess !== 0 ? <span>Shiny Locked</span> : null}
                    {gimmick.nature !== 25 ? <span>Nature {NATURES[gimmick.nature]}</span> : null}
                    {gimmick.gender !== 0 ? <span>Gender {GENDERS[gimmick.gender]}</span> : null}
                    {gimmick.ability !== 0 ? <span>Ability {gimmick.ability}</span> : null}
                    {gimmick.item !== 0 ? <span>Item {gimmick.item}</span> : null}
                    {gimmick.ivs[0] !== -1 ? <span>Guaranteed IVs {~gimmick.ivs[0]}</span> : null}
                </div>
            )
        } else {
            const encounter_table = spawner.encounterSlotTables[weather];
            return (
                <div className="flex flex-col text-lg gap-2">
                    <span>Level Range: {encounter_table.minLevel}-{encounter_table.maxLevel}</span>
                    {encounter_table.slots.filter((slot) => slot.weight > 0).map((slot) => (
                        <div className="flex flex-row text-lg gap-2">
                            <span>{SPECIES[slot.species]}{slot.form !== 0 ? "-" + slot.form : ""}</span>
                            <span>Chance: {slot.weight}%</span>
                        </div>
                    ))}
                </div>
            )
        }
    }

    return (
        <div className="p-4 w-full flex flex-col gap-2">
            <label className="text-lg font-bold" htmlFor={id}>Info</label>
            <div id={id} className="flex flex-col md:flex-row w-full justify-evenly">
                <label className="font-bold gap-2">
                    Game:
                    <div className="p-2 font-normal flex flex-col items-center gap-2">
                        <span className="flex flex-col items-center">Advance: {rngAdvance}</span>
                        <span className="flex flex-col items-center">Weather: {WEATHERS[settings.weather]}</span>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Encounter Type:
                            <select onChange={(e) => {
                                setSettings((settings) => {
                                    settings.encounterType = parseInt(e.target.value);
                                    return settings;
                                });
                                updateSpawners();
                            }} className="rounded text-black w-full h-8 p-2">
                                <option value="0">Gimmick</option>
                                <option value="1">Symbol</option>
                            </select>
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Spawner:
                            <select onChange={(e) => {
                                const spawnerIdx = parseInt(e.target.value);
                                setSelectedSpawner(spawnerIdx);
                                setSpawner(loadedSpawners[spawnerIdx]);
                            }} className="rounded text-black w-full h-8 p-2" value={selectedSpawner}>
                                {loadedSpawners.map((spawner, index) => <option key={index} value={index}>{`${spawner.position[0].toFixed(2)}, ${spawner.position[1].toFixed(2)}, ${spawner.position[2].toFixed(2)}`}</option>)}
                            </select>
                        </label>
                        <canvas ref={spawnerCanvasRef} width={200} height={200}></canvas>
                    </div>
                    <label>
                        Summary:
                        <div className="p-2 font-normal">{spawnerSummary()}</div>
                    </label>
                </label>
                <label className="font-bold">
                    Settings:
                    <div className="flex flex-col w-full p-2 font-normal gap-y-4">
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Min As Current:
                            <input
                                type="checkbox" className="w-8 h-8 p-2 border border-gray-300 rounded text-black" checked={minAsCurrent} onChange={(e) => setMinAsCurrent(e.target.checked)}
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Min Advance:
                            <input
                                type="number"
                                min={0}
                                className="w-32 h-8 p-2 border border-gray-300 rounded text-black"
                                value={settings.minAdvance}
                                onChange={(e) => setSettings({ ...settings, minAdvance: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Total Advances:
                            <input
                                type="number"
                                min={0}
                                className="w-32 h-8 p-2 border border-gray-300 rounded text-black"
                                value={settings.totalAdvances}
                                onChange={(e) => setSettings({ ...settings, totalAdvances: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            NPC Count:
                            <input
                                type="number"
                                min={0}
                                className="w-32 h-8 p-2 border border-gray-300 rounded text-black"
                                value={settings.npcCount}
                                onChange={(e) => setSettings({ ...settings, npcCount: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Fly Calibration:
                            <input
                                type="number"
                                min={0}
                                className="w-32 h-8 p-2 border border-gray-300 rounded text-black"
                                value={settings.flyCalibration}
                                onChange={(e) => setSettings({ ...settings, flyCalibration: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Rain Calibration:
                            <input
                                type="number"
                                min={0}
                                className="w-32 h-8 p-2 border border-gray-300 rounded text-black"
                                value={settings.rainCalibration}
                                onChange={(e) => setSettings({ ...settings, rainCalibration: parseInt(e.target.value) })}
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Do Rotation Rand:
                            <input
                                type="checkbox" className="w-8 h-8 p-2 border border-gray-300 rounded text-black" checked={settings.doRotationRand} onChange={(e) => setSettings({ ...settings, doRotationRand: e.target.checked })}
                            />
                        </label>
                    </div>
                </label>
            </div>
        </div>
    )
}