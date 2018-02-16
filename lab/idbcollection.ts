import {ICollection} from '../collection/icollection';
/* This is an experiment thought - 
    to not let a Collection be a JSON-serializable query, but directly implement 
    the engine on Collection itself. It would very much mimic Observables but where
    'subscribe' is named 'exec' and where exec takes not just an onNext but also
    an options object. (onError and onComplete is handled by the returned Promise instead)-

    Downside with this solution is that it is not possible to JSON-serialize the query.
    Also to execute a JSON query to this kind of Collection, one would have to traverse to the
    top levels of the query and call corresponding methods on it. With other words, it is not
    very tailored for remoting. Maybe though, that  
*/

type Exec<T> = (onNext: (T)=>any, options: IOptions) => Promise<T[] | number>; 

interface IOptions {
    as?: 'stream' | 'arrayOrStream' | 'countOrStream';
    result?: 'values' | 'keys' | 'primaryKeys' | 'cursor';
}

class Options {
    as: 'stream' | 'arrayOrStream' | 'countOrStream';
    result: 'values' | 'keys' | 'primaryKeys' | 'cursor';
    constructor (options: IOptions, extendedOptions?: IOptions) {
        this.as = options.as || 'stream';
        this.result = options.result || 'values';
        if (extendedOptions) {
            if (extendedOptions.as) this.as = extendedOptions.as;
            if (extendedOptions.result) this.result = extendedOptions.result;
        }
    } 
}

class IdbCollection<T,TPrimaryKey> implements ICollection<T,TPrimaryKey> {
    _exec: Exec<any>;
    constructor (exec: Exec<any>) {
        this._exec = exec;
    }
    exec (onNext: (T)=>any, options: IOptions, overridedOptions?: IOptions) {
        return this._exec(onNext, new Options(options, overridedOptions));
    }

    eachKey (onNextKey: (any)=>any) {
        return this.exec (onNextKey, {as: 'stream', result: 'keys'});
    }

    eachPrimaryKey (onNextKey: (TPrimaryKey) => any) {
        return this.mapPrimaryKeys().each(onNextKey);
    }

    mapPrimaryKeys () {
        return new IdbCollection<TPrimaryKey, TPrimaryKey>( (onNext, options) => {
            return this.exec(onNext, options, {result: 'primaryKeys'});
        });
    }

    each (onNext: (T)=>any) {
        return this.exec(onNext, {as: 'stream'});
    }

    toArray() {
       const result:any[] = [];
       return this.exec(x=>result.push(x), {as: 'arrayOrStream'})
       .then(a => a || result);
    }
}