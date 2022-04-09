
const open = async function (dbName: string, dbVersion:number, createDB: (event: IDBVersionChangeEvent) => void): Promise<IDBDatabase> {
    return Promise<IDBDatabase>((resolve, reject) => {
        const eval2 = eval
        const win: Window = eval2('window')
        const loggingDBRequest = win.indexedDB.open(dbName, dbVersion)

        loggingDBRequest.onsuccess = event => {
            resolve(event.target.result)
        }
        loggingDBRequest.onerror = event => {
            reject(`Unable to open loggingdb: ${event.target.code}`)
        }

        loggingDBRequest.onupgradeneeded = event => {
            createDB(event)
        }
    })
}

const runTransaction = async function (db:IDBDatabase,tables:string[], mode:IDBTransactionMode, callback: (tranaction:IDBTransaction) => void): Promise<void> {
    return Promise((resolve, reject) => {
        const transaction: IDBTransaction = db.transaction(tables,mode)
        transaction.oncomplete = resolve
        transaction.onerror = reject
        callback(transaction)
        transaction.commit()
    })
}

const DB = {
    open: open,
    runTransaction: runTransaction
}

export { DB } 