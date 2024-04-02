import { NS } from '@ns';
import { error } from '/shared/logging';
import { initLogging, sendMetric } from '/shared/logging';

export const monitorMarketPath = "/stockMarket/monitorMarket.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const symbols = ns.stock.getSymbols()
    const has4s = ns.stock.has4SData()

    if(!ns.stock.has4SDataTIXAPI()){
        error("Dont have TIX API access",true)
    }
    // eslint-disable-next-line no-constant-condition
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
        await ns.asleep(48000)
    }
}