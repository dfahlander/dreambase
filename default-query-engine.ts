import {
    IQuery,
    IEnumerateQuery,
    ILimitQuery
} from './query';

export interface CancelToken {
    cancelled: boolean;
    cancel();
}

export enum Flags {
    Values = 1,
    Keys = 2,
    PrimaryKeys = 4,
    Unique = 8,
    Reverse = 16,
    MustEnumerate = 32,
    PreferArray = 64
}

export abstract class DefaultQueryEngine {

    abstract enumerate (onNext, query : IEnumerateQuery) : Promise<any>;
    
    limit (query, ct, flags, onNext, limit: number) {
        return this[query.op](query.parent, ct, flags | Flags.MustEnumerate,
            x => limit-- > 0 ? onNext(x) : ct.cancel(), query.data);
    }
    
    offset (query, ct, flags, onNext, offset: number) {
        return this[query.op](query.parent, ct, flags | Flags.MustEnumerate,
            x => --offset < 0 && onNext(x), query.data);
    }

    toArray (query, ct, flags, onNext) {
        let a : any[] = [];
        return this[query.op](query.parent, ct, flags | Flags.PreferArray, x => a.push(x), query.data).then(_a => {
            // If inner engine gave us an array, our given callback was never called and we
            // inner engine already returned the whole result as an array.
            return _a || a;
        });
    }

    map (query, ct, flags, onNext, mapperFn) {
        if ((flags & Flags.Values) == 0) {
            // Our caller expects us to deliver something else than values (keys or primary keys)
            // This conflicts with the use of map
            throw new Error ("Cannot enumerate keys or primaryKeys on a mapped Collection (an Enumerable)");
        }
        // Need to create a promise here, because we are doing own async stuff (mapperFn MAY return a promise!) 
        return new Promise ((resolve, reject) => {
            let numAsyncMappersRunning = 0,
                mainPromiseResolved = false;
            this[query.op](query.parent, ct, flags, x => {
                let mapped = mapperFn(x);
                if (mapped && typeof mapped.then === 'function') {
                    ++numAsyncMappersRunning;
                    mapped.then(res => {
                        if (!ct.cancelled) onNext(res);
                        if (!--numAsyncMappersRunning && mainPromiseResolved) resolve();
                    }).catch(ex => {
                        reject(ex);
                    });
                } else {
                    onNext(mapped);
                }
            }, query.data).then (a => {
                if (a) {
                    // Inner engine returned the result as an array.
                    // This means our callback above was never called.
                    // Do the mapping now instead.
                    Promise.all(a.map(mapperFn))
                        .then(resolve, reject);
                } else {
                    // Final iteration done, but we may have outstanding asyncMappers running.
                    // Must wait for them also.
                    mainPromiseResolved = true;
                    if (numAsyncMappersRunning === 0) resolve();
                    // If there are outstanding mappers, they will resolve now when
                    // the last one completes.
                }
            }).catch(reject);
        });
    }

    keys (query, ct, flags, onNext) {
        return this[query.op](query.parent, ct, (flags ^ ~(Flags.PrimaryKeys | Flags.Values) | Flags.Keys), onNext);
    }

    primaryKeys (query, ct, flags, onNext) {
        return this[query.op](query.parent, ct, (flags ^ ~(Flags.Keys | Flags.Values) | Flags.PrimaryKeys), onNext);        
    }
    
}

