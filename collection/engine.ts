import {extend} from './utils';
import {IQuery} from './iengine';

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
        return this._down(query, x => result.push(x), {_as: 'arrayOrStream'})
        .then(a => a || result);
        // If inner engine gave us an array, our given callback was never called and we
        // inner engine already returned the whole result as an array.
        // Above code will handle both possible scenarios.
    }

    count (query: IQuery) {
        assert (!this._as);
        let result = 0;
        return this._down(query, ()=>++result, {_as: 'countOrStream'})
        .then (count => isNaN(count) ? result : count); 
    }

    keys (query: IQuery, onNext: StreamCallback) {
        return this._down(query, onNext, {_result: 'keys'});
    }

    primaryKeys (query: IQuery, onNext: StreamCallback) {
        return this._down(query, onNext, {_result: 'primaryKeys'});
    }

    test(query: IQuery, values) {
        return new QueryTester(values)[query.op](query.down, query.data); 
    }

    // Expressions
    abstract above(
        query: IQuery,
        onNext: StreamCallback,
        value: {keyPath: string, value: any});

    abstract aboveOrEqual(
        query: IQuery,
        onNext: StreamCallback,
        value: {keyPath: string, value: any});

    abstract equalsIgnoreCase(
        query: IQuery,
        onNext: StreamCallback,
        value: {keyPath: string, value: string});        

    abstract equalsAnyOfIgnoreCase(
        query: IQuery,
        onNext: StreamCallback,
        value: {keyPath: string, values: string[]});

    // ...


    abstract list (query: null, onNext: StreamCallback, uri: string) : Promise<any>;

    // But don't have limit implemented in base! This is a template!
    limit (query: IQuery, onNext: StreamCallback, limit: number) {
        return this._down(
            query,
            x => limit-- > 0 ? onNext(x) : this._cancelToken.cancel(),
            {_as: 'stream'});
    }

    abstract offset (query: IQuery, onNext: StreamCallback, offset: number);
    
    map (query: IQuery, onNext: StreamCallback, mapperFn: (any)=>any) {
        if (this._result && this._result !== 'values') {
            // Our caller expects us to deliver something else than values (keys or primary keys)
            // Ignore the mapping of values and let user get the keys or primary keys instead 'as is'.
            return this._down(query, onNext);
        }
        if (this._as === 'countOrStream')
            // End user only needs to count. Mapping of no need.
            return this._down(query, onNext);

        // Now we know that caller expects mapped values. Either as a stream or as an array.
        // Let's do it.
        // Need to create a promise here, because we are doing own async stuff (mapperFn MAY return a promise!) 
        return new Promise ((resolve, reject) => {
            let numAsyncMappersRunning = 0,
                mainPromiseResolved = false;
            this._down(query, x => {
                let mapped = mapperFn(x);
                if (mapped && typeof mapped.then === 'function') {
                    ++numAsyncMappersRunning;
                    mapped.then(res => {
                        if (!this._cancelToken.cancelled) onNext(res);
                        if (!--numAsyncMappersRunning && mainPromiseResolved) resolve();
                    }).catch(ex => {
                        reject(ex);
                    });
                } else {
                    onNext(mapped);
                }
            }).then (a => {
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
}
