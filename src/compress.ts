import * as pako from "pako";

export function deflate(text: string): string {
    const uint8Array = pako.deflate(text);
    // String.fromCharCode(...uint8Array) と書くとスタックオーバーフローしたので
    // その対策として一つずつ操作する
    let data = "";
    for (const uint8 of uint8Array) {
        data += String.fromCharCode(uint8);
    }
    return encodeURIComponent(btoa(data.toString()));
}

export function inflate(deflated: string): string {
    const uint8Array = Uint8Array.from(Array.from(atob(decodeURIComponent(deflated))).map((c) => c.charCodeAt(0)));
    return pako.inflate(uint8Array, { to: "string" });
}
