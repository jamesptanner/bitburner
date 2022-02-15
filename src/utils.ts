export function asString(val: any): string | null{
    if (typeof val === "string") return val;
    return null;
}