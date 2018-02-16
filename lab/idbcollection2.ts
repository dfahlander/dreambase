/*
Tanken här är att onNext kommer med en cursor istället för bara value.
gör man .mapPrimaryKeys() så är cursorns value primaryKey.

Då måste man alltså alltid provida en cursor. Hur gör man lämpligen det?

Algoritmer typ anyOf(), equalsIgnoreCase(), withinRanges() etc, skulle behöva skapa en egen
proxy-cursor vid iterationens början.
    get value() { return _cursor.value; }
    get key() { return _cursor.key; }
    get primaryKey() { return _cursor.primaryKey; }
    continue() { Här sker det mesta av algoritmen. }
    continue(key) { return _cursor.continue(key); }
    advance(offset) { default implementation gör this.continue() offset antal gånger. Ranges kan ev optimeras.}

Efter en orderBy som fått sortera om allt i minnet. Jobba mot in-memory array.

Ett compound query med commonWalk:
    continue() { Här implementeras helt enkelt common walken! }
    continue(key) { throw. Behövs inte i interfacet. }
*/

/* Återanvända compound indexes som vanliga indexes:

   Use Case:
    1. Använda som ett enstaka index och ignorera sub-indexes.
       ['firstName', 'lastName']. db.friends.where('firstName').equalsIgnoreCase('david')
    2. Använda som ett slutindex där de första värderna är låsta till exakta nycklar
       ['firstName', 'lastName']. db.friends.where({firstName: 'David'}).where('lastName').equalsIgnoreCase('fahlander')
    3. Kombination av ovan:
       ['firstName', 'middleName', 'lastName']
       db.friends.where({firstName: 'David'}).where('middleName').equalsIgnoreCase('the dude')
*/
var indexByName : {[idxName:string] : {keyPath}};

function addCompoundVirtualIndex(compoundKeyPath : string[]) {
    let preKey =
    compoundKeyPath.forEach((keyPath, i) => {

    });
}

class CompoundVirtualIndex {

}

function cmp(a,b) {
    return indexedDB.cmp(a,b);
}

// The following interface is compatible with IDBCursor and IDBCursorWithValue.
export interface ICursor {
    readonly direction: string;
    readonly key: any;
    readonly primaryKey: any;
    readonly value?: any;
    advance(count: number): void;
    continue(key?: any): void;
}

// The following interface supports both ICursor and the onNext() method that
// should be invoked from an onsuccess event handler of an openCursor() request, surrounded
// by wrap() with try/catch, or it could be passed as the onNext argument to constructor of
// another CursorProxy.
export interface ICursorSubscriber {
    onNext(cursor: ICursor) : true | undefined;
}

export interface ICursorSubject extends ICursor, ICursorSubscriber {}

const CursorPrototypeDescriptors = {
    value: {get(){ return this._cursor.value; }},
    key: {get(){ return this._cursor.key; }},
    primaryKey: {get(){ return this._cursor.primaryKey; }},
    direction: {get(){ return this._cursor.direction; }},
    continue: {value: function (key?) {
        return this._cursor.continue(key);
    }},
    advance: {value: function (count: number) {
        const _onNext = this.onNext;
        if (count > 1) this.onNext = function () {
            if (--count === 1) this.onNext = _onNext;
            this.continue();
        }
        this.continue();
    }}
};

Object.defineProperties(CompoundVirtualIndexCursor.prototype, CursorPrototypeDescriptors);
function CompoundVirtualIndexCursor (parentKeys: any[], numTrails: number, onNext) : void {
    this._cursor = null;

    const offset = parentKeys.length;
    var reverse = false;
    var unique = false; 
    const totalKeys = offset + 1 + numTrails;
    const prefilled = new Array(totalKeys);

    // Prefill a key to continue to from continue()
    for (let i=0; i<offset; ++i)
        prefilled[i] = parentKeys[i];

    this.onNext = (cursor: ICursor) => {
        if (!this._cursor) {
            // Init:
            this._cursor = cursor;
            reverse = cursor.direction.indexOf('prev') === 0;
            unique = cursor.direction.indexOf('unique') > 0;
        }
        let currentKey = cursor.key;
        for (let i=0; i<offset; ++i) {
            const diff = cmp(currentKey[i], parentKeys[i]);
            if (diff === 0) continue; // Check next or finally forward onNext()
            if (reverse ? (diff < 0) : (diff > 0)) return true;
            cursor.continue(); // Not yet reached the key. Continue to it.
            return;
        }
        return onNext(this);
    }

    this.continue = function (key?) {
        if (key !== undefined) {
            // TODO: translate from simple key to compound key. Direction may affect.

        }
        // key is undefined:
        if (unique) {
            if (numTrails === 0) {
                // No trailing keys. Just continue as normal.
                return this._cursor.continue();
            } else {
                prefilled[offset] = this._cursor.key[offset];
                for (let i = offset+1; i < totalKeys; ++i) {
                    prefilled[i] = reverse ? -Infinity : [[]];
                }
                return this._cursor.continue(prefilled);
            }
        }
        // Normal case:
        // If only have parentKeys, just continue.
        // If only have trailing keys, also just continue.
        // If have both parent and trailing keys, also just continue.
        this._cursor.continue();
    }
}

// Just testing to typescript-instanciate a CompoundVirtualIndexCursor:
export const TCompoundVirtualIndexCursor = (CompoundVirtualIndexCursor as any) as
    new(parentKeys: any[], numTrails: number, onNext)=>ICursorSubject;
//new TCompoundVirtualIndexCursor(new IDBCursor(), [], 0, ()=>{})
// /Just testing ...


/* TODO:
    * Alla algoritmer som CursorProxies istället.
    * CommonWalkCursor
    * Hur göra compound query?
        1. Har ett expression: X1 and X2
        2. Hittar index [X1+X2]
        3. new Collection({exec: ()=> {
                let uniqueKeys = await X1.uniqueKeys(); // Använder CompoundVirtualIndexCursor internt.
                if (uniqueKeys.length > MAX_PARALLELLS) return ALTERNATE_SOLUTION;
                // Conceptuellt CommonWalk:
                let cursors = uniqueKeys.map(key => new CompoundVirtualIndexCursor(idx.openCursor(range(key.concat(-Infinity), key.concat([]))))
                cursors.sort(c => c.key.slice(offset))
                cursors[0].continue()
                const cursor = new CommonWalkCursor ();
    * OrCursor. Hur funka? Vad är "key"? 

                
      
*/

// De cursors som kommer in här är CompoundVirtualIndexCursors med samma keypaths (olika parentPaths)
function CommonWalkCursor (cursors: ICursor[], comparer, reverse, unique) {
    cursors.sort(comparer); // Vem ansvarig för invertering av comparer?

    this.continue = function (key?) {
        if (key === undefined) {
            cursors[0].continue();
        } else {
            // Hur hantera detta?
            // 1. Leta keys i cursors. Om inte hittar, launcha om samtliga cursurs till 
        }
    }
    
    this
}

