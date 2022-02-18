import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const autorunFiles = ns.ls("home","/autorun/")
    if(autorunFiles.length>0){
        autorunFiles.forEach(file =>{
            ns.tprintf(`INFO starting ${file}`)
            ns.exec(file,"home");
        })
    }
}