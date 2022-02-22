import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {

    const startupFiles = ns.ls("home","/startup/")
    if(startupFiles.length>0){
        startupFiles.forEach(file =>{
            ns.tprintf(`INFO starting ${file}`)
            ns.exec(file,"home");
        })
    }

    const autorunFiles = ns.ls("home","/autorun/")
    if(autorunFiles.length>0){
        autorunFiles.forEach(file =>{
            ns.tprintf(`INFO starting ${file}`)
            ns.exec(file,"home");
        })
    }
}