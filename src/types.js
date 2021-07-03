let shared = ``;
let client = ``;
let natives = ``;
let server = ``;

export function getSharedTypes() {
    return shared;
}

export function getClientTypes() {
    return client;
}

export function getNativeTypes() {
    return natives;
}

export function getServerTypes() {
    return server;
}

export async function fetchTypes() {
    const sharedResult = await fetch("https://raw.githubusercontent.com/altmp/altv-types/master/shared/index.d.ts");
    shared = await sharedResult.text();
    shared = shared.replace('declare module "alt-shared"', "namespace alt-shared");

    const clientResult = await fetch("https://raw.githubusercontent.com/altmp/altv-types/master/client/index.d.ts");
    client = await clientResult.text();
    client = client.replace('declare module "alt-client"', "namespace alt");

    const nativesResult = await fetch("https://raw.githubusercontent.com/altmp/altv-types/master/natives/index.d.ts");
    natives = await nativesResult.text();
    natives = natives.replace('declare module "natives"', "namespace native");

    const serverResult = await fetch("https://raw.githubusercontent.com/altmp/altv-types/master/server/index.d.ts");
    server = await serverResult.text();
    server = server.replace('declare module "alt-server"', "namespace alt");
}
