import { WASI } from "@wasmer/wasi";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
import { WasmFs } from "@wasmer/wasmfs";
import { OverworldSpec, GimmickSpec, EncounterSlotTable } from './components/results';
import { Settings } from "./components/settings";
import { Filters } from "./components/filters";

interface Library {
    deleteBytes(address: number): void;
    allocateBytes(size: number): number;

    xoroshiro(rngState: number): number;
    xoroshiroUpdate(rng: number, rngState: number): number;

    generateSlots(settings: number, filters: number, slotTable: number, rng: number): number;
    generateGimmicks(settings: number, filters: number, gimmickSpec: number, rng: number): number;
}

let wasmfs: WasmFs;
let wasi: WASI;
let memory: WebAssembly.Memory;
let wasmModule: WebAssembly.Module;
let instance: WebAssembly.Instance;
let wasmExports: Library;

export async function loadModule() {
    wasmfs = new WasmFs();
    wasi = new WASI({
        bindings: {
            ...wasiBindings,
            fs: wasmfs.fs
        }
    });
    wasmModule = await WebAssembly.compileStreaming(fetch(process.env.NODE_ENV == "production" ? "static/wasm/main.wasm" : '/wasm/main.wasm'));
    const { wasi_snapshot_preview1 } = wasi.getImports(wasmModule);
    memory = new WebAssembly.Memory({ initial: 2 });
    wasi.setMemory(memory);
    const env = { memory };
    instance = await WebAssembly.instantiate(wasmModule, { env, wasi_snapshot_preview1 });
    wasmExports = instance.exports as unknown as Library;
}

export class Pointer {
    static deallocator = new FinalizationRegistry((address: number) => {
        wasmExports.deleteBytes(address);
    })

    address: number;

    constructor(address: number) {
        this.address = address;
        Pointer.deallocator.register(this, address);
    }

    writeArrayBuffer(array: ArrayBuffer) {
        new Uint8Array(memory.buffer).set(new Uint8Array(array), this.address);
    }
    viewBytes(size: number) {
        return new Uint8Array(memory.buffer, this.address, size);
    }
    readString() {
        const fullArray = new Uint8Array(memory.buffer, this.address);
        return new TextDecoder().decode(fullArray.slice(0, fullArray.indexOf(0)));
    }

    static allocate(size: number): Pointer {
        const address = wasmExports.allocateBytes(size);
        return new Pointer(address);
    }
    static allocateArrayBuffer(array: ArrayBuffer): Pointer {
        const result = Pointer.allocate(array.byteLength);
        result.writeArrayBuffer(array);
        return result;
    }
    static allocateString(string: string) {
        return Pointer.allocateArrayBuffer(new TextEncoder().encode(string + "\0"));
    }
    static allocateJSON(obj: any) {
        return Pointer.allocateString(JSON.stringify(obj));
    }
}

export class Xoroshiro extends Pointer {
    constructor(rngState: BigUint64Array) {
        super(wasmExports.xoroshiro(Pointer.allocateArrayBuffer(rngState.buffer).address));
    }
    update(rngState: BigUint64Array) {
        return wasmExports.xoroshiroUpdate(this.address, Pointer.allocateArrayBuffer(rngState.buffer).address);
    }
}

export namespace Overworld {
    export function generateSlots(settings: Settings, filters: Filters, slotTable: EncounterSlotTable, initialRngState: BigUint64Array): OverworldSpec[] {
        return JSON.parse(new Pointer(wasmExports.generateSlots(
            Pointer.allocateJSON(settings).address,
            Pointer.allocateJSON(filters).address,
            Pointer.allocateJSON(slotTable).address,
            Pointer.allocateArrayBuffer(initialRngState.buffer).address
        )).readString());
    }
    export function generateGimmicks(settings: Settings, filters: Filters, gimmickSpec: GimmickSpec, initialRngState: BigUint64Array): OverworldSpec[] {
        return JSON.parse(new Pointer(wasmExports.generateGimmicks(
            Pointer.allocateJSON(settings).address,
            Pointer.allocateJSON(filters).address,
            Pointer.allocateJSON(gimmickSpec).address,
            Pointer.allocateArrayBuffer(initialRngState.buffer).address
        )).readString());
    }
}