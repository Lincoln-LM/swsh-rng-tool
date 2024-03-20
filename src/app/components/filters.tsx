import { useId } from "react";
import Multiselect from 'multiselect-react-dropdown'
import { GENDERS, MARKS, NATURES, SHININESS } from "../resources";

export interface Filters {
    ivMin: number[],
    ivMax: number[],
    abilities: number,
    shininess: number,
    slots: number,
    natures: number,
    marks: number[],
    genders: number,
    scales: number,
}

const NATURE_OPTIONS = NATURES.map((n, i) => ({ name: n, id: i }));
const ABILITY_OPTIONS = [
    { name: "Ability 1", id: 1 },
    { name: "Ability 2", id: 2 },
];
const SHININESS_OPTIONS = SHININESS.map((s, i) => ({ name: s, id: i }));
const MARK_OPTIONS = MARKS.map((m, i) => ({ name: m, id: i })).filter(m => m.name !== "");
const GENDER_OPTIONS = GENDERS.map((g, i) => ({ name: g, id: i })).filter(g => g.name !== "-");
const SCALE_OPTIONS = [
    { name: "1-254", id: 0 },
    { name: "255", id: 1 },
    { name: "0", id: 2 },
]

const constructBitField = (a: number, b: any) => a | (1 << b.id);
const constructBitFieldArray = (a: number[], b: any) => {
    a[b.id >> 5] |= (1 << (b.id & 31));
    return a;
};

export function FiltersInterface(
    {
        filters,
        setFilters
    }: {
        filters: Filters,
        setFilters: (filters: Filters) => void
    }
) {
    const id = useId();
    function updateIvMin(e: any, i: number) {
        const newFilters = { ...filters };
        newFilters.ivMin[i] = parseInt(e.target.value);
        setFilters(newFilters);
    }
    function updateIvMax(e: any, i: number) {
        const newFilters = { ...filters };
        newFilters.ivMax[i] = parseInt(e.target.value);
        setFilters(newFilters);
    }
    return (
        <div className="p-4 w-full flex flex-col gap-2">
            <label className="text-lg font-bold" htmlFor={id}>Filters</label>
            <div id={id} className="flex flex-col md:flex-row w-full justify-evenly">
                <label className="font-bold gap-2 md:w-1/2">
                    IVs:
                    <div className="flex flex-row p-2 gap-2 w-full justify-evenly font-normal">
                        <div className="flex flex-col gap-y-4">
                            <label className="p-2 h-10">HP</label>
                            <label className="p-2 h-10">Atk</label>
                            <label className="p-2 h-10">Def</label>
                            <label className="p-2 h-10">SpA</label>
                            <label className="p-2 h-10">SpD</label>
                            <label className="p-2 h-10">Spe</label>
                        </div>
                        <div className="flex flex-col gap-y-4">
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMin[0]} onChange={(e) => { updateIvMin(e, 0) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMin[1]} onChange={(e) => { updateIvMin(e, 1) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMin[2]} onChange={(e) => { updateIvMin(e, 2) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMin[3]} onChange={(e) => { updateIvMin(e, 3) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMin[4]} onChange={(e) => { updateIvMin(e, 4) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMin[5]} onChange={(e) => { updateIvMin(e, 5) }} />
                        </div>
                        <div className="flex flex-col gap-y-4">
                            <label className="p-2 h-10">~</label>
                            <label className="p-2 h-10">~</label>
                            <label className="p-2 h-10">~</label>
                            <label className="p-2 h-10">~</label>
                            <label className="p-2 h-10">~</label>
                            <label className="p-2 h-10">~</label>
                        </div>
                        <div className="flex flex-col gap-y-4">
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMax[0]} onChange={(e) => { updateIvMax(e, 0) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMax[1]} onChange={(e) => { updateIvMax(e, 1) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMax[2]} onChange={(e) => { updateIvMax(e, 2) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMax[3]} onChange={(e) => { updateIvMax(e, 3) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMax[4]} onChange={(e) => { updateIvMax(e, 4) }} />
                            <input className="text-black w-16 h-10 p-2 rounded text-center" type="number" min="0" max="31" value={filters.ivMax[5]} onChange={(e) => { updateIvMax(e, 5) }} />
                        </div>
                    </div>
                </label>
                <label className="font-bold gap-2 md:w-1/2">
                    Other:
                    <div className="flex flex-col p-2 font-normal gap-y-4">
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Abilities:
                            <Multiselect
                                className="text-black"
                                options={ABILITY_OPTIONS}
                                onSelect={(list) => { setFilters({ ...filters, abilities: list.reduce(constructBitField, 0) }) }}
                                onRemove={(list) => { setFilters({ ...filters, abilities: list.reduce(constructBitField, 0) }) }}
                                displayValue="name"
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Shininess:
                            <Multiselect
                                className="text-black"
                                options={SHININESS_OPTIONS}
                                onSelect={(list) => { setFilters({ ...filters, shininess: list.reduce(constructBitField, 0) }) }}
                                onRemove={(list) => { setFilters({ ...filters, shininess: list.reduce(constructBitField, 0) }) }}
                                displayValue="name"
                            />
                        </label>
                        {/* <label className="flex flex-col md:flex-row items-center gap-2">
                            Slots:
                            <Multiselect
                                className="text-black"
                                options={SLOTS_OPTIONS}
                                displayValue="name"
                            />
                        </label> */}
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Natures:
                            <Multiselect
                                className="text-black"
                                options={NATURE_OPTIONS}
                                onSelect={(list) => { setFilters({ ...filters, natures: list.reduce(constructBitField, 0) }) }}
                                onRemove={(list) => { setFilters({ ...filters, natures: list.reduce(constructBitField, 0) }) }}
                                displayValue="name"
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Marks:
                            <Multiselect
                                className="text-black w-full h-full"
                                options={MARK_OPTIONS}
                                onSelect={(list) => { setFilters({ ...filters, marks: list.reduce(constructBitFieldArray, [0, 0]) }) }}
                                onRemove={(list) => { setFilters({ ...filters, marks: list.reduce(constructBitFieldArray, [0, 0]) }) }}
                                displayValue="name"
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Genders:
                            <Multiselect
                                className="text-black"
                                options={GENDER_OPTIONS}
                                onSelect={(list) => { setFilters({ ...filters, genders: list.reduce(constructBitField, 0) }) }}
                                onRemove={(list) => { setFilters({ ...filters, genders: list.reduce(constructBitField, 0) }) }}
                                displayValue="name"
                            />
                        </label>
                        <label className="flex flex-col md:flex-row items-center gap-2">
                            Scales:
                            <Multiselect
                                className="text-black"
                                options={SCALE_OPTIONS}
                                onSelect={(list) => { setFilters({ ...filters, scales: list.reduce(constructBitField, 0) }) }}
                                onRemove={(list) => { setFilters({ ...filters, scales: list.reduce(constructBitField, 0) }) }}
                                displayValue="name"
                            />
                        </label>
                    </div>
                </label>
            </div>
        </div>
    )
}