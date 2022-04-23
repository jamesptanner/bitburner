import { NS } from '@ns'
import { initLogging, sendMetric } from '/shared/logging';
import { error } from './../shared/logging';

export const monitorMarketPath = "/stockMarket/monitorMarket.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const symbols = ns.stock.getSymbols()
    const has4s = ns.getPlayer().has4SDataTixApi

    if(!ns.getPlayer().hasTixApiAccess){
        error("Dont have TIX API access",true)
    }
    while (true) {

        symbols.forEach(sym => {
            sendMetric(`stock.${sym}.price`, ns.stock.getPrice(sym))
            sendMetric(`stock.${sym}.askprice`, ns.stock.getAskPrice(sym))
            sendMetric(`stock.${sym}.bidprice`, ns.stock.getBidPrice(sym))
            if (has4s) {
                sendMetric(`stock.${sym}.forcast`, ns.stock.getForecast(sym))
                sendMetric(`stock.${sym}.volatility`, ns.stock.getVolatility(sym))
            }
        })
        await ns.sleep(48000)
    }
}