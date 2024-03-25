
interface UpgradeFunc {
  upgrade(db :IDBDatabase, oldVersion: number) : void;
}

const OpenIDB = function (dbName: string, version: number, upgradeFunc: UpgradeFunc) :Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const dbOpenRequest = indexedDB.open(dbName, version);
    dbOpenRequest.onerror = (event) =>{
      reject(dbOpenRequest.error);
    };
    dbOpenRequest.onsuccess = (event)=>{
      resolve(dbOpenRequest.result);
    };
    if(upgradeFunc){
        dbOpenRequest.onupgradeneeded = function(this: IDBOpenDBRequest, event:IDBVersionChangeEvent){
          upgradeFunc.upgrade(this.result,event.oldVersion);
          resolve(this.result);
      };
    }
  });
}


export {OpenIDB}