export function addMaps<K, V>(a: Map<K, V>, b: Map<K, V>, mutateFirst: boolean = false) {
    if (mutateFirst === false) {
        a = new Map<K, V>(a);
    }

    b.forEach((v, k) => {
        if (a.has(k) === false) {
            a.set(k, v);
        }
    });
    return a;
}