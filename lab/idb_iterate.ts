import {ICursor, ICursorSubscriber, ICursorSubject, TCompoundVirtualIndexCursor} from './idbcollection2';

declare var wrap;
declare var PSD;
declare var tempIdbStore; // Like tempTransaction but with idbStore provided.

interface IExpression {
    l: string | IExpression;
    op: string;
    r: any;
}

interface IDBCollectionOptions {
    mode?: 'readonly' | 'readwrite';
    writeLocked?: boolean | string;
    tableName: string;
    //rangeGen: ()=>IDBKeyRange,
    //index?: string;
    expr: IExpression;
    dir?: 'next' | 'prev';
    unique?: '' | 'unique';
    keysOnly?: boolean;
}

type Subscriber = (ICursor)=>true | undefined;
type Executor = (onNext: Subscriber, context) => Promise<any>;

class IdbCollection {
    _ctx;
    _exec: Executor;

    constructor (context, exec: Executor) {
        this._ctx = context;
        this._exec = exec;
    }

    _child(extendedProps?, executor?: Executor) {
        if (arguments.length === 1 && typeof extendedProps === 'function')
            return new IdbCollection(this._ctx, extendedProps as Executor);
        Object.setPrototypeOf(extendedProps, this._ctx);
        return new IdbCollection(extendedProps, executor || this._exec);
    }
    
    exec(onNext: Subscriber) {
        return this._exec(onNext, this._ctx);
    }
    sameSame() {
        return this._child((onNext, options) => this._exec(onNext, options));
    }
    proxyCurse() {
        return this._child((onNext, options) => {
            let upCursor = new TCompoundVirtualIndexCursor([], 0, onNext);
            this._exec(cursor => upCursor.onNext(cursor), options);
        });
    }

    unique() {
        return this._child({unique: true});
    }
    whereEquals(idxName, value) {
        return this._child(this._ctx.expr ?
            {l: this._ctx.expr, op: 'and', r: {l: idxName, op: 'equals', r: value}} :
            {l: idxName, op: 'equals', r: value});
        /*return this._ctx.index ?
            // Find compound index:
            this._child({index: idxName}, 
                (onNext, options) => {
                    return Promise.resolve();
                }) :
            // Find first matching index:
            this._child({index: idxName, rangeGen: ()=>IDBKeyRange.only(value)}) // TODO: Stora expression istället. Behöver kunna göra både IDBKeyRange och testa det!
            */
    }
}


// This function is rather complete actually! It would be the new basis for normal
// database queries. On top of the provided cursor, we can build our own algorithms,
// utilize compound indexes for nested expressions etc
// BUT! TODO:
// * Instead of relying on index and rangeGen, rely on x (expression)
// * Make it possible to execute an expression: new Collection(ctx) (already possible then!)
function createObjectStoreCollection (db: IDBDatabase, tableName: string) {
    return new IdbCollection({table: tableName}, (onNext, options) => { // But this could be in the prototype (exec method) instead!
        let {
            mode = 'readonly',
            writeLocked,
            tableName,
            //rangeGen,
            //index,
            expr,
            dir = 'next',
            unique = '',
            keysOnly = false
        } = options;

        var indexes; // Some kind of table about which indexes that are available

        {
            onNext,
            index,
            range
        } = interpretExpression (expr, indexes)

        function iterate (resolve, reject, idbstore: IDBObjectStore) {
            let idxOrStore: IDBIndex = (index ? idbstore.index(index) : idbstore) as IDBIndex;
            let req = keysOnly && 'openKeyCursor' in idxOrStore ?
                idxOrStore.openKeyCursor(rangeGen(), dir + unique) :
                idxOrStore.openCursor(rangeGen(), dir + unique);

            req.onsuccess = wrap(ev => {
                onNext(ev.target.result);
            }, reject);

            req.onerror = wrap(ev => reject(ev.target.error));
        }

        let trans = PSD.trans && PSD.trans.db === db ? PSD.trans : null;
        return trans ?
            trans._idbindex(tableName, mode, iterate, writeLocked) :
            tempIdbStore(tableName, mode, iterate, writeLocked);
    });
}
