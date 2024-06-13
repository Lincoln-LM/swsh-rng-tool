import { memo, useId, useRef, useState } from "react"
import { Settings } from "./settings";
import { Filters } from "./filters";
import { Overworld } from "../wasm"
import { GENDERS, MARKS, NATURES, SHININESS, SPECIES } from "../resources";

export interface GimmickSpec {
    species: number,
    form: number,
    level: number,
    shininess: number,
    nature: number,
    gender: number,
    ability: number,
    item: number,
    ivs: number[],
}
export interface EncounterSlot {
    species: number,
    form: number,
    weight: number,
}
export interface EncounterSlotTable {
    minLevel: number,
    maxLevel: number,
    slots: EncounterSlot[];
}
export interface OverworldSpec {
    species: number,
    form: number,
    level: number,
    shininess: number,
    nature: number,
    gender: number,
    ability: number,
    heldItem: number,
    guaranteedIvs: number,
    ivs: number[],
    mark: number,
    brilliantLevel: number,
    fixedSeed: number,
    scale: number,
    ec: number,
    pid: number,

    advance: number,
}
const ResultBody = memo(
    function ResultBody({ results }: { results: JSX.Element[] }) {
        return (
            <tbody>{results}</tbody>
        )
    }
);

export function ResultsInterface(
    {
        initialRngState,
        settings,
        filters,
        gimmickSpec,
        encounterTable,
    }: {
        initialRngState: BigUint64Array,
        settings: Settings
        filters: Filters
        gimmickSpec: GimmickSpec | undefined
        encounterTable: EncounterSlotTable | undefined
    }) {
    const isGimmick = settings.encounterType == 0;
    const [currentResults, setCurrentResults] = useState<JSX.Element[]>([]);
    const id = useId();
    const tableRef = useRef<HTMLTableElement | null>(null);
    function generate() {
        if (tableRef.current && (gimmickSpec || encounterTable)) {
            const results = [];
            if ((isGimmick && !gimmickSpec) || (!isGimmick && !encounterTable)) {
                return;
            }
            const rawResults = isGimmick ? Overworld.generateGimmicks(
                settings,
                filters,
                gimmickSpec as GimmickSpec,
                initialRngState
            ) : Overworld.generateSlots(settings, filters, encounterTable as EncounterSlotTable, initialRngState);
            for (const result of rawResults) {
                results.push(
                    <tr>
                        <td>{result.advance}</td>
                        <td>{SPECIES[result.species]}{result.form !== 0 ? '-' + result.form : ''}</td>
                        <td>{result.level}</td>
                        <td>{SHININESS[result.shininess]}</td>
                        <td>{NATURES[result.nature]}</td>
                        <td>{GENDERS[result.gender]}</td>
                        <td>{result.ability}</td>
                        <td>{result.heldItem}</td>
                        <td>{result.ivs.join("/")}</td>
                        <td>{result.mark == -1 ? "None" : MARKS[result.mark]}</td>
                        <td hidden={isGimmick}>{result.brilliantLevel}</td>
                    </tr>
                )
            }
            setCurrentResults(results);
        }
    }
    return (
        <div className="p-4 w-full flex flex-col gap-2 min-h-1/4 h-1/4">
            <label className="text-lg font-bold" htmlFor={id}>Results</label>
            <div id={id} className="flex flex-col w-full h-full">
                <button onClick={generate} className='bg-blue-500 active:bg-blue-600 hover:bg-blue-600 text-white p-2 px-4 rounded w-full'>Generate</button>
                <div className="w-full overflow-auto min-h-full">
                    <table ref={tableRef} className="w-full p-2">
                        <thead className="border-b border-gray-300 sticky top-0">
                            <tr>
                                <th>Advance</th>
                                <th>Species</th>
                                <th>Level</th>
                                <th>Shininess</th>
                                <th>Nature</th>
                                <th>Gender</th>
                                <th>Ability</th>
                                <th>Item</th>
                                <th>IVs</th>
                                <th>Mark</th>
                                <th hidden={isGimmick}>Brilliant Level</th>
                            </tr>
                        </thead>
                        <ResultBody results={currentResults} />
                    </table>
                </div>
            </div>
        </div>
    )
}

