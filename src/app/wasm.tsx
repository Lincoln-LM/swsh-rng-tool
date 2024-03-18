import { WASI } from "@wasmer/wasi";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
import { WasmFs } from "@wasmer/wasmfs";
import { inherits } from "util";

interface Library {
    deleteBytes(address: number): void;
    allocateBytes(size: number): number;

    xoroshiro(rngState: number): number;
    xoroshiroUpdate(rng: number, rngState: number): number;
}

let wasmfs: WasmFs;
let wasi: WASI;
let memory: WebAssembly.Memory;
let wasm_module: WebAssembly.Module;
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
    wasm_module = await WebAssembly.compileStreaming(fetch(process.env.NODE_ENV == "production" ? "static/wasm/main.wasm" : '/wasm/main.wasm'));
    const { wasi_snapshot_preview1 } = wasi.getImports(wasm_module);
    memory = new WebAssembly.Memory({ initial: 2 });
    wasi.setMemory(memory);
    const env = { memory };
    instance = await WebAssembly.instantiate(wasm_module, { env, wasi_snapshot_preview1 });
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
}

export class Xoroshiro extends Pointer {
    constructor(rngState: BigUint64Array) {
        super(wasmExports.xoroshiro(Pointer.allocateArrayBuffer(rngState.buffer).address));
    }
    update(rngState: BigUint64Array) {
        return wasmExports.xoroshiroUpdate(this.address, Pointer.allocateArrayBuffer(rngState.buffer).address);
    }
}