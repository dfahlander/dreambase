import Collection from './collection';
import WhereClause from './whereclause';

interface Expression<T, TPrimaryKey> extends Collection<T, TPrimaryKey> {
    or (key : string) : WhereClause<T, TPrimaryKey>;
}

/*abstract class Expression<T,Key> extends Collection<T, Key> {
    lvalue: Expression<T, Key> | string;
    rvalue: any;

    constructor (parent, lvalue, op, rvalue) {
        super (parent, op);
        this.lvalue = lvalue;
        this.rvalue = rvalue;
    }

    or (key) {
        return new WhereClause(this, key, 'or');
    } 
    
    where (key) {
        return new WhereClause(this, key, 'and');
    }
}*/


export default Expression;
