import { randomUUID } from "crypto"


enum Level{
    Error,
    Warning,
    Info,
    success
} 

const LOGGING_PORT = 1
const loggingTrace = ""
const initializedLogging = false

export const initLogging = function(ns:NS, scriptName?:string){
    ns.getPortHandle(LOGGING_PORT)
    initializedLogging = true
    loggingTrace = randomUUID()
}

export const sendMetric = function(){
    if(!initializedLogging){
        
    }
}

export const log = function(level:Level, msg: string, toast? :boolean|null){

}