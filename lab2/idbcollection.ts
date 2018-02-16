import {ICursor, CursorSubscriber, Executor} from './common';
import {Expression, IDBQuery} from './idbquery';
import {canonicalize} from './exec';
declare var wrap;


// The Core Function:
function iterate (resolve, reject, idxOrStore, range, keysOnly, dir, unique, onNext) {
    let req = keysOnly && 'openKeyCursor' in idxOrStore ?
        idxOrStore.openKeyCursor(range, dir + unique) :
        idxOrStore.openCursor(range, dir + unique);

    req.onsuccess = wrap(ev => {
        let cursor = ev.target.result; 
        if (!cursor || onNext(cursor) === true) resolve();
    }, reject);

    req.onerror = wrap(ev => reject(ev.target.error));
}

class IDBCollection {
    exec (query: IDBQuery, onNext: CursorSubscriber) {
        // Prestage:
        // 1. Caninicalize expr to array of <array of and-expressions>
        //    Top-level array items will execute in parallell (OR algorithm)
        //    Each inner array item will be tried to execute through compound indexes.
        //    Special treatment: If all indexes are same (no matter AND or OR), treat it as a valid low-level expression
        //    and don't canonicalize it out.
        //    OrderBy: If one Top-level item only and compound indexes exists, use that.
        //             Else, execute all and sort manually.
        if (!query.expr) return this._iterate(); // TODO: fixthis!
        let canonicalized: Expression[][] = canonicalize(query.expr, []);

        // Will Need: SameKeyExpressionCursor: Unify AND:ed or OR:ed expressions between same keyPaths.
        //              Union: where name='Hillary' OR name='hillary'
        //              Intersection: where age>=20 AND age <= 25
        //              Mix: where (age>=20 AND age <= 25) OR (age>=30 AND age <=35)


        // Execution:
        // 1. Translate expr to different cases:
        //    A: Pure range query. Just do trans._promise(... ... iterate(...)) 
        //    B: An algorithm query.
        //       1. Select a lowerBound and upperBound based on the query.
        //       2. Rewrite onNext using an AlgorithmCursor.
        //       3. iterate.
        //    C: (equals AND equals AND ...) AND range/algorithm expression:
        //       1. Find possible compound indexes to use. '['+join('+')+']'. Choose one.
        //       2. If algorithm, select lowerBound/upperBound based on the query,
        //          translate those bounds to compound bounds.
        //       3. Rewrite onNext using CompoundCursor + eventually AlgorithmCursor on top.
        //       4. iterate.
        //    D: An AND / orderBy expression:
        //       1. Find possible compound indexes to use. '['+join('+')+']'. Choose one.(Could launch in parallell and choose the shortest)
        //       2. Split expression in all but the last one (left), and the last one (right). Reorder may have taken place in respect to available compound indexes.
        //       3. Do unique keysOnly query on leftmost expression => Promise<key[]>
        //          Notice: leftmost expression may be algorithm or another AND expression. That's ok! 
        //       4. Translate leftmost expression to N equals expressions based on unique key matches above.
        //       5. Launch: coll.where('a').equals(compound[0]).where('b').equals(compound[1]).where(rightExpr)
        //
        //    E: A keysOnly unique query of AND expression (possibly executed from D)
        //       1. Find possible compound indexes to use. Choose one.
        //       2.

        /* Exemplifiera:

            age > 80 AND name.startsWith('A') AND lastName.startsWith('B')
            
            Databas:
                Adam Bengtsson, 83
                Angur Buttler, 84
                Alice Brinander, 81
            Indexes:
                [age+name+lastName]

            Körning:
                1. Välj [age+name+lastName] indexet (enda som finns)
                2.  Left:  age > 80 AND name.startsWith('A')
                    Right: lastName.startsWith('B')
                3. (age > 80 AND name.startwWith('A')).uniqueKeys() -->
                   3.1) Välj [age+name] indexet (virtuellt)
                   3.2) Left: age > 80, Right: name.startsWith('A')
                   3.3) (age > 80).uniqueKeys() --> [81, 83, 84]
                   3.5) age=81 AND name.startsWith('A')
                            Alice
                        age=83 AND name.startsWith('A')
                            Adam
                        age=84 AND name.startsWith('A')
                            Angur

                        Adam is winner --> emit("Adam"), continue() --> end.
                        Alice next --> continue() --> end.
                        Angur --> continue() --> end.
                4. 
        */  
    }

}