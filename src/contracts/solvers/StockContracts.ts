// "Algorithmic Stock Trader I"

// You are given an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.

import { NS } from '@ns'
// Determine the maximum possible profit you can earn using at most one
// transaction (i.e. you can buy an sell the stock once). If no profit
// can be made, then the answer should be 0. Note that you must buy the stock
// before you can sell it.

const isNumberArray = function (val: unknown): val is number[] {
  return (
    Array.isArray(val) &&
    val.every((v) => {
      typeof v === "number";
    })
  );
};

export function StockTrader1(ns: NS, data: unknown): number | string[] | undefined {
  if (isNumberArray(data)) {
    const stocks: number[] = data;
    let bestProfit = 0;
    let maxCur = 0;
    for (let i = 1; i < stocks.length; ++i) {
      maxCur = Math.max(0, (maxCur += stocks[i] - stocks[i - 1]));
      bestProfit = Math.max(bestProfit, maxCur);
    }

    ns.tprintf(`Stock1 Best profit: ${bestProfit}`);

    return bestProfit > 0 ? bestProfit : 0;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

// "Algorithmic Stock Trader II"

// You are given an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.

// Determine the maximum possible profit you can earn using as many transactions
// as you’d like. A transaction is defined as buying and then selling one
// share of the stock. Note that you cannot engage in multiple transactions at
// once. In other words, you must sell the stock before you buy it again. If no
// profit can be made, then the answer should be 0.
export function StockTrader2(ns: NS, data: unknown): number | string[] | undefined {
  if (isNumberArray(data)) {
    const stocks: number[] = data;
    let profit = 0;

    for (let i = 1; i < stocks.length; ++i) {
      profit += Math.max(0, stocks[i] - stocks[i - 1]);
    }
    ns.tprintf(`Stock2 Best profit: ${profit}`);

    return profit > 0 ? profit : 0;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

// "Algorithmic Stock Trader III"

// You are given an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.

// Determine the maximum possible profit you can earn using at most two
// transactions. A transaction is defined as buying and then selling one share
// of the stock. Note that you cannot engage in multiple transactions at once.
// In other words, you must sell the stock before you buy it again. If no profit
// can be made, then the answer should be 0.
export function StockTrader3(ns: NS, data: unknown): number | string[] | undefined {
  if (isNumberArray(data)) {
    let hold1 = Number.MIN_SAFE_INTEGER;
    let hold2 = Number.MIN_SAFE_INTEGER;
    let release1 = 0;
    let release2 = 0;
    for (let _i = 0, data_1 = data; _i < data_1.length; _i++) {
      const price = data_1[_i];
      release2 = Math.max(release2, hold2 + price);
      hold2 = Math.max(hold2, release1 - price);
      release1 = Math.max(release1, hold1 + price);
      hold1 = Math.max(hold1, price * -1);
    }
    return release2;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

// "Algorithmic Stock Trader IV"

// You are given an array with two elements. The first element is an integer k.
// The second element is an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.

// Determine the maximum possible profit you can earn using at most k transactions.
// A transaction is defined as buying and then selling one share of the stock.
// Note that you cannot engage in multiple transactions at once. In other words,
// you must sell the stock before you can buy it. If no profit can be made, then
// the answer should be 0.
export function StockTrader4(ns: NS, data: unknown): number | string[] | undefined {
  if (Array.isArray(data) && typeof data[0] === "number" && isNumberArray(data[1])) {
    const k = data[0];
    const prices = data[1];
    const len = prices.length;
    if (len < 2) {
      return 0;
    }
    if (k > len / 2) {
      let res = 0;
      for (let i = 1; i < len; ++i) {
        res += Math.max(prices[i] - prices[i - 1], 0);
      }
      return res;
    }
    const hold = [];
    const release = [];
    hold.length = k + 1;
    release.length = k + 1;
    for (let i = 0; i <= k; ++i) {
      hold[i] = Number.MIN_SAFE_INTEGER;
      release[i] = 0;
    }
    let cur;
    for (let i = 0; i < len; ++i) {
      cur = prices[i];
      for (let j = k; j > 0; --j) {
        release[j] = Math.max(release[j], hold[j] + cur);
        hold[j] = Math.max(hold[j], release[j - 1] - cur);
      }
    }
    return release[k];
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}
