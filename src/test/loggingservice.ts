import { NS } from '@ns'
import { log,Level,initLogging } from './../shared/logging';

export const loggingservicePath ="/test/loggingservice.js";

export async function main(ns : NS) : Promise<void> {
    initLogging(ns)
    log(Level.Error,`This is a message at ${Date.now().toLocaleString()}`)
}