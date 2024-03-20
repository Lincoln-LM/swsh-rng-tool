import { GimmickSpec } from "./components/results";

// TODO: move this
export interface Spawner {
    position: number[],
    spawnRadius: number,
    despawnRadius: number,
    gimmickSpecs: GimmickSpec[],
    encounterSlotTables: any[],
}

export namespace API {
    export async function connect(ip: string) {
        return await fetch("/api/connect", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip: ip,
            })
        });
    }

    export async function disconnect() {
        return await fetch("/api/disconnect");
    }

    export async function rngState() {
        return new BigUint64Array(await (await fetch("/api/rng-state")).arrayBuffer());
    }

    export async function tidsid() {
        return (await (await fetch("/api/tidsid")).json()) as number;
    }
    export async function charms(): Promise<{
        hasShinyCharm: boolean,
        hasMarkCharm: boolean
    }> {
        return await (await fetch("/api/charms")).json();
    }

    export async function currentWeather() {
        return (await (await fetch("/api/current-weather")).json()) as number;
    }

    export async function loadedSpawners() {
        return (await (await fetch("/api/loaded-spawners")).json()) as Spawner[];
    }
    export async function playerPosition(): Promise<{
        x: number,
        y: number,
        z: number,
        yaw: number,
    }> {
        return (await (await fetch("/api/player-position")).json());
    }
}