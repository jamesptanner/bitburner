
import { IDBPDatabase, wrap } from "idb"

const open = async function (dbName: string, dbVersion:number, createDB: (event: IDBVersionChangeEvent) => void): Promise<IDBPDatabase> {
    return new Promise<IDBPDatabase>((resolve, reject) => {
        const eval2 = eval
        const win: Window = eval2('window')
        const loggingDBRequest = win.indexedDB.open(dbName, dbVersion)

        loggingDBRequest.onsuccess = event => {
            const target = event.target as IDBRequest<IDBDatabase>
            resolve(wrap(target.result))
        }
        loggingDBRequest.onerror = event => {
            const target = event.target as IDBRequest<IDBDatabase>
            reject(`Unable to open loggingdb: ${target.error}`)
        }

        loggingDBRequest.onupgradeneeded = event => {
            createDB(event)
        }
    })
}

const DB = {
    open: open
}

export { DB } 