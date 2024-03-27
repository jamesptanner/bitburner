
interface UpgradeFunc {
  upgrade(db :IDBDatabase, oldVersion: number) : void;
}

const OpenIDB = function (dbName: string, version: number, upgradeFunc: UpgradeFunc) :Promise<IDBPDatabase> {
  return new Promise<IDBPDatabase>((resolve, reject) => {
    const dbOpenRequest = indexedDB.open(dbName, version);
    dbOpenRequest.onerror = (event) =>{
      reject(dbOpenRequest.error);
    };
    dbOpenRequest.onsuccess = function(event){
      resolve(new IDBPDatabase(this.result));
    };
    if(upgradeFunc){
        dbOpenRequest.onupgradeneeded = function(this: IDBOpenDBRequest, event:IDBVersionChangeEvent){
          upgradeFunc.upgrade(this.result,event.oldVersion);
          resolve(new IDBPDatabase(this.result));
      };
    }
  });
}

const wrapIDBRequest = function<T>(request: IDBRequest<T>) : Promise<T>{
  return new Promise((resolve, reject) => {
    request.onerror = function(ev: Event){
      reject(this.error);
    };
    request.onsuccess = function(ev: Event){
      resolve(this.result);
    };
  });
}

class IDBPTransaction {

  private tx : IDBTransaction;
  private objectStore;

  constructor(tx: IDBTransaction, name: string){
    this.tx = tx;
    this.objectStore = tx.objectStore(name);
  }

  public abort() {
    this.tx.abort();
  }
  public commit() {
    this.tx.commit();
  }

  public add(value: any, key?: IDBValidKey | undefined) : Promise<IDBValidKey> {
    const retKey = this.objectStore.add(value,key);
    return wrapIDBRequest<IDBValidKey>(retKey);
  }

  public clear() : Promise<undefined>{
    const retKey = this.objectStore.clear();
    return wrapIDBRequest(retKey);
  }

  public count(query?: IDBValidKey | IDBKeyRange | undefined) : Promise<number> {
    const retKey = this.objectStore.count(query)

    return wrapIDBRequest<number>(retKey);
  }

  public createIndex(name: string, keyPath: string | Iterable<string>, options?: IDBIndexParameters): IDBPIndex {
    const retIndex = this.objectStore.createIndex(name, keyPath, options);
    return new IDBPIndex(retIndex);
  }

  public delete(query: IDBValidKey | IDBKeyRange) : Promise<undefined> {
    const retKey  = this.objectStore.delete(query);
    return wrapIDBRequest<undefined>(retKey);
  }

  public deleteIndex(name: string) : void{
    this.objectStore.deleteIndex(name);
  }

  public get(query: IDBValidKey | IDBKeyRange) : Promise<any> {
    const retObj = this.objectStore.get(query);
    return wrapIDBRequest<any>(retObj);
  }

  public getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number) : Promise<any[]> {
    const retObj = this.objectStore.getAll();   
    return wrapIDBRequest<any[]>(retObj);
  }

  public getAllKeys(query?: IDBValidKey | IDBKeyRange | null | undefined, count?: number | undefined) : Promise<IDBValidKey[]> {
    const retObj = this.objectStore.getAllKeys(query, count);
    return wrapIDBRequest(retObj);
  }

  public getKeys(query: IDBValidKey | IDBKeyRange) : Promise<IDBValidKey | undefined> {
    const retObj = this.objectStore.getKey(query);
    return wrapIDBRequest(retObj);
  }

  public put(value: any, key?: IDBValidKey | undefined) : Promise<IDBValidKey> {
    const retObj = this.objectStore.put(value,key);
    return wrapIDBRequest(retObj);
  }

  public index(name: string) : IDBPIndex {
    const retObj = this.objectStore.index(name);
    return new IDBPIndex(retObj);
  }

  public openCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) : Promise<IDBCursorWithValue | null> {
    const retObj = this.objectStore.openCursor(query,direction);
    return wrapIDBRequest(retObj);
  }

  public openKeyCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) : Promise<IDBCursor | null>{
    const retObj = this.objectStore.openKeyCursor(query,direction);
    return wrapIDBRequest(retObj);
  }
  

}

class IDBPDatabase {
  private db : IDBDatabase;

  constructor(db: IDBDatabase){
   this.db = db;
  }

  public close(): void {
    this.db.close();
  };

  public createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore{
    return this.db.createObjectStore(name, options);
  }

  public deleteObjectStore(name: string): void{
    this.db.deleteObjectStore(name);
  }

  public transaction(storeNames: string, mode?: IDBTransactionMode, options?: IDBTransactionOptions): IDBPTransaction{
    return new IDBPTransaction(this.db.transaction(storeNames, mode, options),storeNames)

  }
}
class IDBPIndex {
  private index : IDBIndex;

  constructor(index: IDBIndex){
    this.index = index;
  }

  public count(query?: IDBValidKey | IDBKeyRange | undefined) : Promise<number> {
    const retKey = this.index.count(query)

    return wrapIDBRequest<number>(retKey);
  }
  public get(query: IDBValidKey | IDBKeyRange) : Promise<any> {
    const retObj = this.index.get(query);
    return wrapIDBRequest<any>(retObj);
  }

  public getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number) : Promise<any[]> {
    const retObj = this.index.getAll();   
    return wrapIDBRequest<any[]>(retObj);
  }

  public getAllKeys(query?: IDBValidKey | IDBKeyRange | null | undefined, count?: number | undefined) : Promise<IDBValidKey[]> {
    const retObj = this.index.getAllKeys(query, count);
    return wrapIDBRequest(retObj);
  }

  public getKeys(query: IDBValidKey | IDBKeyRange) : Promise<IDBValidKey | undefined> {
    const retObj = this.index.getKey(query);
    return wrapIDBRequest(retObj);
  }

  public openCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) : Promise<IDBPCursorWithValue | null> {
    const retObj = this.index.openCursor(query,direction);
    return new Promise((resolve, reject) => {
      retObj.onerror = function(ev: Event){
        reject(this.error);
      };
      retObj.onsuccess = function(ev: Event){
        resolve(this.result ? new IDBPCursorWithValue(this.result) : null);
      };
    });
  }

  public openKeyCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) : Promise<IDBPCursor | null>{
    const retObj = this.index.openKeyCursor(query,direction);
    return new Promise((resolve, reject) => {
      retObj.onerror = function(ev: Event){
        reject(this.error);
      };
      retObj.onsuccess = function(ev: Event){
        resolve(this.result ? new IDBPCursor(this.result) : null);
      };
    });
  }
}

class IDBPCursor {

  readonly cursor: IDBCursor;

  constructor(cursor: IDBCursor){
    this.cursor = cursor;
  }

  public advance(count: number){
    this.cursor.advance(count);
  }

  public continue(key?: IDBValidKey | undefined){
    this.cursor.continue(key);
  }

  public continuePrimaryKey(key: IDBValidKey, primaryKey: IDBValidKey){
    this.cursor.continuePrimaryKey(key,primaryKey);
  }

  public delete() : Promise<undefined> {
    const req = this.cursor.delete();
    return wrapIDBRequest(req);

  }
  public update(value: any) : Promise<IDBValidKey> {
    const req = this.cursor.update(value);
    return wrapIDBRequest(req);
  }

  get primaryKey() : IDBValidKey {
    return this.cursor.primaryKey;
  }
}
class IDBPCursorWithValue extends IDBPCursor {
  constructor(cursor: IDBCursorWithValue){
    super(cursor);
  }

  public get value() : any {
    return (this.cursor as IDBCursorWithValue).value;
  }
}


export {OpenIDB, IDBPDatabase, IDBPCursor, IDBPCursorWithValue, IDBPIndex, IDBPTransaction}