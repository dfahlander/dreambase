import { extend } from './utils';
export class CancelToken {
    cancel() {
        this.cancelled = true;
    }
}
function assert(x) { if (!x)
    throw new Error("Assert error"); }
export class QueryExecutor {
    constructor(optionsToInherit, optionsToOverride) {
        if (optionsToInherit) {
            extend(this, optionsToInherit);
            if (optionsToOverride)
                extend(this, optionsToOverride);
        }
        else {
            this._cancelToken = new CancelToken();
        }
    }
    _down(query, onNext, overridedOptions) {
        return new this.constructor(this, overridedOptions)[query.op](query.down, onNext, query.data);
    }
    each(query, onNext) {
        return this._down(query, onNext, { _as: 'stream' });
    }
    toArray(query) {
        assert(!this._as);
        const result = [];
        return this._down(query, x => result.push(x), { _as: 'arrayOrStream' })
            .then(a => a || result);
        // If inner engine gave us an array, our given callback was never called and we
        // inner engine already returned the whole result as an array.
        // Above code will handle both possible scenarios.
    }
    count(query) {
        assert(!this._as);
        let result = 0;
        return this._down(query, () => ++result, { _as: 'countOrStream' })
            .then(count => isNaN(count) ? result : count);
    }
    keys(query, onNext) {
        return this._down(query, onNext, { _result: 'keys' });
    }
    primaryKeys(query, ct, flags, onNext) {
        return this._down(query, onNext, { _result: 'primaryKeys' });
    }
    // But don't have limit implemented in base! This is a template!
    limit(query, onNext, limit) {
        return this._down(query, x => limit-- > 0 ? onNext(x) : this._cancelToken.cancel(), { _as: 'stream' });
    }
    map(query, onNext, mapperFn) {
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
        return new Promise((resolve, reject) => {
            let numAsyncMappersRunning = 0, mainPromiseResolved = false;
            this._down(query, x => {
                let mapped = mapperFn(x);
                if (mapped && typeof mapped.then === 'function') {
                    ++numAsyncMappersRunning;
                    mapped.then(res => {
                        if (!this._cancelToken.cancelled)
                            onNext(res);
                        if (!--numAsyncMappersRunning && mainPromiseResolved)
                            resolve();
                    }).catch(ex => {
                        reject(ex);
                    });
                }
                else {
                    onNext(mapped);
                }
            }).then(a => {
                if (a) {
                    // Inner engine returned the result as an array.
                    // This means our callback above was never called.
                    // Do the mapping now instead.
                    Promise.all(a.map(mapperFn))
                        .then(resolve, reject);
                }
                else {
                    // Final iteration done, but we may have outstanding asyncMappers running.
                    // Must wait for them also.
                    mainPromiseResolved = true;
                    if (numAsyncMappersRunning === 0)
                        resolve();
                }
            }).catch(reject);
        });
    }
}
