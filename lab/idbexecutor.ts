import {IQuery} from '../collection/iquery';
import {QueryExecutor, StreamCallback} from '../collection/query-executor';

class IDBExecutor extends QueryExecutor {

    uri (query: null, onNext: StreamCallback, uri: string) : Promise<any> {
        // 1. Sök upp tabellen som namnges av uri.
        // Basera IDBCursor style beroende på (this._result)
        // Använd getAll / getAllKeys om this._as är "arrayOrStream"
        // Gör count om this._as är "countOrStream"

        // TODO: Ändra _as till separata flaggor igen:
        //  _requireStream: true
        //  _preferArray: true
        //  _preferCount: true
        // Lägg in _offset som enskild parameter. Hantera i "uri"
        // Lägg in _limit som enskild parameter. Hantera i "uri"
        // 
    }

    equalsIgnoreCase (
        query: IQuery,
        onNext: StreamCallback,
        value: {keyPath: string, value: string})
    {        
        //...
    }  
}