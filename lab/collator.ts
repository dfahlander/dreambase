

const RANGE_START = 0x20;
const RANGE_END = 0x2200;
const RANGE_LENGTH = this.RANGE_END - this.RANGE_START;

/** Makes a unicode string sortable according to given collator.
 * This code was tested in jsfiddle (prior to rewriting it as a typescript class)
 * Usage:
 *  let c = new Collator(new Intl.Collator(undefined, {sensitivity: 'base'}));
 *  let keyToStore = c.getCollatedString("OriginalKey");
 * Now keyToStore will have an ordinal sort order that corresponds to OriginalKey's collated sort order.
 *
 * Features:
 *  * Output strings are sortable in sort order according to given collator.
 *  * Output strings are comparable according to given collator (if sensitivity = 'base', case will not matter)
 * 
 * Caveats:
 *  * Supports entire unicode range but only makes correct sortings and case comparings of the range 0x0020 - 0x2200.
 *  * Will ignore unicode "combining" chars no matter what the Collator options are.
 *  * Will not sort numeric strings in numeric order no matter if that option was turned on in given collator.
 *  * Constructor is CPU intensive. Takes about 90ms to execute due to an internal sorting of an array.
 */
class Collator {
    collator: Intl.Collator;
    table: {[key:string]:string};

    constructor (collator : Intl.Collator) {
        this.collator = collator;
        const comparer = collator.compare.bind(collator);

        function isCombiningChar(chCode) {
            return ((chCode >= 0x300 && chCode < 0x370) ||
                (chCode >= 0x1ab0 && chCode < 0x1b00) ||
                (chCode >= 0x1dc0 && chCode < 0x1e00) ||
                (chCode >= 0x20d0 && chCode < 0x2100));
        }

        const a = new Array(RANGE_LENGTH);
        for (let i=0;i<RANGE_LENGTH;++i)
            a[i] = String.fromCharCode(i+RANGE_START);

        // Sort. Will take about 90 ms.
        a.sort(comparer);

        const table = this.table = {};
        let pos = RANGE_START, lastChar = a[0];
        for (let i=0;i<RANGE_LENGTH;++i) {
            let ch = a[i];
            if (comparer(ch, lastChar)) ++pos;
            if (isCombiningChar(ch.charCodeAt(0))) {
                table[ch] = '';
                continue;
            }
            table[ch] = String.fromCharCode(pos);
            lastChar = ch;
        }
    }

    getCollatedString (str) {
        const table = this.table;
        let result = '';
        for (let i=0, l=str.length; i<l; ++i) {
            result += (table[str[i]] || str[i]);
        }
        return result;
    }
}

/* How to implement in Dexie:

    1. Make generic support for computed indexes.
    2. Make specific support for collations using an addon dexie-collate.js

    Generic support for computed indexes
    ====================================

    Use cases for generic computed indexes:
        * Collation support (of course)
        * Emulate compound indexes (apply to primary keys as well?)
        * Non-sparse indexes (should be required for noneOf() and notEqual())
        * Indexing of booleans (using non-sparse indexes)
        * Encryption (here we're actually talking about a combo of computed indexes and computed properties with getter/setter)
        * Full-text indexes (Convert string using split+lunr and multiEntry)
        * Not async (no promise support). Why? Would lead to complex bugs. For example people may want to use the Encryption api in the
          browser that will fire off the indexeddb transaction.
          Side-note: We might (in dreambase server) want to support indexes that copies a value from a foreign references item (tenant_id/tid),
          but we should build specific support for that if so. Not in this API (I think). Will be able to do more performant if so.
          And maybe that is not even needed.

    Syntax: 

        db.version(1).stores({
            friends: 'id:uuid, firstName:ic, lastName:ic, isBestFriend:toString'
        }).computedIndexes({
            uuid: (id) => id || new Random() * 1000000,
            ic: () => { // Returning a callback makes it possible to encapsulate initialization code.
                let collator = new Collator(new Intl.Collator(undefined, {sensitivity: 'base'}));
                return x => collator.getCollatedString(x)
            },
            toString: x => x ? x.toString() : "undefined"
        });

    Specific support for collations (via addon). This is the addon that will have the Collator class in it and store

    Syntax:

        db.version(1).stores({
            friends: 'id, firstName:localeIgnoreCase, lastName:localeIgnoreCase
        });

    Above sample will utilze the built-in localeIgnoreCase index type. If used, addon will store the props
    of the localeIgnoreCase Collator so that next time database is opened and user has changed browser language, it will not instanciate
    it from the current language but from the options stored in a meta table.

        db.version(1).stores({
            friends: 'id, name:swedishOrderIgnoreCase'
        }).collations({
            swedishOrderIgnoreCase: new Intl.Collator('se', {sensitivity: 'base'})
        });

*/
