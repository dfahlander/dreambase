
export function wrap (fn) {
    return fn;
}

export var PSD = {};

export function fill (array: any[], value, start: number, end: number) {
    for (let i=start; i<end; ++i) {
        array[i] = value;
    }
}
