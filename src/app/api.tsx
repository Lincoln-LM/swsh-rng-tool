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

    export async function rngState() {
        return new BigUint64Array(await (await fetch("/api/rng-state")).arrayBuffer());
    }
}