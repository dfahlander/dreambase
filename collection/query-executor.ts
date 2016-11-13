import {extend} from './utils';
import {
    IQuery,
    IExecuteQuery,
    ILimitQuery
} from './iquery';

export interface ICancelToken {
    cancelled: boolean;
    cancel();
} 

export class CancelToken implements ICancelToken {
    cancelled: boolean;
    cancel() {
        this.cancelled = true;
    }
}

export interface IQueryExecutorOptions {
    _as?: 'stream' | 'arrayOrStream' | 'countOrStream';
    _result?: 'values' | 'keys' | 'primaryKeys';
    _cancelToken?: ICancelToken;
}

function assert(x) { if (!x) throw new Error ("Assert error");}

export type StreamCallback = (x) => any;

export abstract class QueryExecutor implements IQueryExecutorOptions {
    _cancelToken: ICancelToken;
    _as?: 'stream' | 'arrayOrStream' | 'countOrStream';
    _result?: 'values' | 'keys' | 'primaryKeys';

    constructor (optionsToInherit?:IQueryExecutorOptions, optionsToOverride?:IQueryExecutorOptions) {
        if (optionsToInherit) {
            extend(this, optionsToInherit);
            if (optionsToOverride) extend(this, optionsToOverride);
        } else {
            this._cancelToken = new CancelToken();
        }
    }     
    _down(query : IQuery, onNext: StreamCallback, overridedOptions?:IQueryExecutorOptions) {
        return new (this.constructor as new (options,overridedOptions)=>QueryExecutor)
            (this, overridedOptions)[query.op](query.down, onNext, query.data);
    }
    each (query: IQuery, onNext: StreamCallback) {
        return this._down(query, onNext, {_as: 'stream'});
    }
    toArray (query: IQuery) {
        assert(!this._as);
        const result:any[] = [];
        return this._down(query, x => result.push(x), {_as: 'arrayOrStream'}).then(a => {
            // If inner engine gave us an array, our given callback was never called and we
            // inner engine already returned the whole result as an array.
            // Handle both possible scenarios
            return a || result;
        });
    }

    abstract uri (query : IQuery, onNext: StreamCallback, uri: string) : Promise<any>;

    // But don't have limit implemented in base! This is a template!
    limit (query: IQuery, onNext: StreamCallback, limit: number) {
        return this._down(
            query,
            x => limit-- > 0 ? onNext(x) : this._cancelToken.cancel(),
            {_as: 'stream'});
    }

    abstract offset (query: IQuery, onNext: StreamCallback, offset: number);
    
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
            this[query.op](query.down, ct, flags, x => {
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
        return this[query.op](query.down, ct, (flags ^ ~(Flags.PrimaryKeys | Flags.Values) | Flags.Keys), onNext);
    }

    primaryKeys (query, ct, flags, onNext) {
        return this[query.op](query.down, ct, (flags ^ ~(Flags.Keys | Flags.Values) | Flags.PrimaryKeys), onNext);        
    }
    
}


/*export enum Flags {
    Values = 1,
    Keys = 2,
    PrimaryKeys = 4,
    Unique = 8,
    Reverse = 16,
    MustEnumerate = 32,
    WantsArray = 64,
    WantsCount = 128
}*/

// BORT NEDAN!:
export abstract class QueryExecutionEngine {

    // This is how to invoke the engine on a query:
    public static executeQuery(query: IQuery, onNext: Function, engine: QueryExecutionEngine) {
    	let ct = new CancelToken();
        return engine[query.op](query.down, ct, Flags.Values, onNext);
    }

    /** The only must-implement method. The rest is "polyfilled". You can override any other method that
     * make sense to override for optimization.
     * 
     * This method should do the following:
     * 1. Inspect provided flags. Enumerate the correct data based on flags:
     *      * Flags.Values : Enumerate values of the collection.
     *      * Flags.PrimaryKeys : Enumerate primary keys of the collection. If don't have, just throw Error.
     *      * Flags.Keys : Enumerate the keys being indexed. If don't have, throw Error.
     * 
     * 2. Loop through the entire collection. Between each iteration, inspect whether given cancelToken
     *    is not cancelled. If it is, resolve promise (DONT reject due to a cancellation here!). For
     *    each record you iterate call given onNext function with its value.
     * 
     * 3. When done looping through the entire collection, resolve the returned Promise with undefined (!)
     * 
     * Optionally, if flag WantsArray is set, but NOT MustEnumerate, you may return a Promise that 
     * resolves with the entire collection as an array instead.
     */
    abstract enumerate (query : IExecuteQuery, ct: ICancelToken, flags: Flags, onNext: Function) : Promise<any>;
    
    limit (query, ct, flags, onNext, limit: number) {
        return this[query.op](query.down, ct, flags | Flags.MustEnumerate,
            x => limit-- > 0 ? onNext(x) : ct.cancel(), query.data);
    }
    
    offset (query, ct, flags, onNext, offset: number) {
        return this[query.op](query.down, ct, flags | Flags.MustEnumerate,
            x => --offset < 0 && onNext(x), query.data);
    }

    toArray (query, ct, flags, onNext) {
        let a : any[] = [];
        return this[query.op](query.down, ct, flags | Flags.WantsArray, x => a.push(x), query.data).then(_a => {
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
            this[query.op](query.down, ct, flags, x => {
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
        return this[query.op](query.down, ct, (flags ^ ~(Flags.PrimaryKeys | Flags.Values) | Flags.Keys), onNext);
    }

    primaryKeys (query, ct, flags, onNext) {
        return this[query.op](query.down, ct, (flags ^ ~(Flags.Keys | Flags.Values) | Flags.PrimaryKeys), onNext);        
    }
    
}
