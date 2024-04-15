import { NS } from "@ns";
import { Logging } from "/shared/logging";

export const monitorMarketPath = "/stockMarket/monitorMarket.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  const symbols = ns.stock.getSymbols();
  const has4s = ns.stock.has4SData() && ns.stock.has4SDataTIXAPI();

  if (!ns.stock.has4SDataTIXAPI()) {
    logging.error("Dont have TIX API access", true);
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    symbols.forEach((sym) => {
      logging.sendMetric(`stock.${sym}.price`, ns.stock.getPrice(sym));
      logging.sendMetric(`stock.${sym}.askprice`, ns.stock.getAskPrice(sym));
      logging.sendMetric(`stock.${sym}.bidprice`, ns.stock.getBidPrice(sym));
      if (has4s) {
        logging.sendMetric(`stock.${sym}.forcast`, ns.stock.getForecast(sym));
        logging.sendMetric(
          `stock.${sym}.volatility`,
          ns.stock.getVolatility(sym),
        );
      }
    });
    await ns.asleep(48000);
  }
}
