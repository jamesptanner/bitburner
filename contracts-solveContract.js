function asString(val) {
    if (typeof val === "string")
        return val;
    return String(val);
}
function asNumber(val) {
    if (typeof val === "number")
        return val;
    return NaN;
}
function is2DArray(val, elementGuard) {
    return Array.isArray(val) && val.every((va) => Array.isArray(va) && va.every(elementGuard));
}

// "Find Largest Prime Factor"
// Given a number, find its largest prime factor. A prime factor
// is a factor that is a prime number.
function largestPrimeFactor(ns, data) {
    if (typeof data === 'number') {
        ns.print(`${JSON.stringify(data)} type:${typeof data}`);
        let num = data;
        let factor = 2;
        do {
            while (num % factor == 0) {
                num = num / factor;
            }
            factor++;
        } while (factor != num);
        ns.tprintf(`largest factor = ${factor}`);
        return factor;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Subarray with Maximum Sum"
// Given an array of integers, find the contiguous subarray (containing
// at least one number) which has the largest sum and return that sum.
function MaxSubArray(ns, data) {
    if (Array.isArray(data) && data.every(val => { return typeof val === 'number'; })) {
        const numberArray = data;
        ns.print(`${numberArray}`);
        let subArray = [];
        let subArrayTotal = -Infinity;
        for (let start = 0; start < numberArray.length; start++) {
            for (let length = 1; length <= numberArray.length - start; length++) {
                const testSubArray = numberArray.slice(start, start + length);
                const testSubArrayTotal = testSubArray.reduce((prev, curr) => { return prev + curr; });
                ns.print(`${testSubArray}: ${testSubArrayTotal}`);
                if (testSubArrayTotal > subArrayTotal) {
                    subArray = testSubArray;
                    subArrayTotal = testSubArrayTotal;
                }
            }
        }
        ns.tprintf(`Best: ${subArray}: ${subArrayTotal}`);
        return subArrayTotal;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Total Ways to Sum"
// Given a number, how many different ways can that number be written as
// a sum of at least two positive integers?
function TotalSums(ns, data) {
    if (typeof data === 'number') {
        const value = data;
        // An array to store a partition
        const sums = new Array(value + 1);
        sums[0] = 1;
        sums.fill(0, 1);
        for (let i = 1; i < value; ++i) {
            for (let j = i; j <= value; ++j) {
                sums[j] += sums[j - i];
            }
        }
        //ns.tprintf(`${partitions}`)
        ns.tprintf(`total Sums: ${sums[value]}`);
        ns.tprintf(`total Sums: ${sums}`);
        return sums[value];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Spiralize Matrix"
// Given an array of array of numbers representing a 2D matrix, return the
// elements of that matrix in clockwise spiral order.
// Example: The spiral order of
// [1, 2, 3, 4]
// [5, 6, 7, 8]
// [9, 10, 11, 12]
// is [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
function SpiralMatrix(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        ns.print(`${JSON.stringify(data)} type:${typeof data}`);
        const numberArray = data;
        const output = [];
        let state = 0;
        while (numberArray.length > 0) {
            switch (state % 4) {
                case 0: //top
                    {
                        const row = numberArray.shift();
                        if (row) {
                            output.push(...row);
                        }
                        break;
                    }
                case 1: //right
                    {
                        for (let row = 0; row < numberArray.length; row++) {
                            const val = numberArray[row].pop();
                            if (val) {
                                output.push(val);
                            }
                        }
                        break;
                    }
                case 2: //bottom
                    {
                        const row = numberArray.pop();
                        if (row) {
                            output.push(...(row.reverse()));
                        }
                        break;
                    }
                case 3: //left
                    {
                        for (let row = numberArray.length - 1; row >= 0; row--) {
                            const val = numberArray[row].shift();
                            if (val) {
                                output.push(val);
                            }
                        }
                        break;
                    }
            }
            state++;
        }
        //may have undefined entries which we can remove.
        ns.tprintf(`SpiralMatrix Result: ${JSON.stringify(output.filter(x => x))}`);
        return output.filter(x => x).map(x => x.toString());
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Array Jumping Game"
// You are given an array of integers where each element represents the
// maximum possible jump distance from that position. For example, if you
// are at position i and your maximum jump length is n, then you can jump
// to any position from i to i+n.
// Assuming you are initially positioned at the start of the array, determine
// whether you are able to reach the last index of the array.
function ArrayJump(ns, data) {
    if (Array.isArray(data) && data.every(val => typeof val === 'number')) {
        ns.print(`${JSON.stringify(data)} type:${typeof data}`);
        const numberArray = data;
        const result = checkPosition(ns, numberArray, 0);
        ns.tprintf(`${result}`);
        if (result) {
            return 1;
        }
        return 0;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
function checkPosition(ns, array, pos) {
    ns.print(`${array}: checking position ${pos}`);
    if (pos == array.length - 1)
        return true;
    for (let jumpDist = 1; jumpDist <= array[pos]; jumpDist++) {
        ns.print(`Jumping ${jumpDist}`);
        if (checkPosition(ns, array, pos + jumpDist)) {
            return true;
        }
    }
    return false;
}
// "Merge Overlapping Intervals"
// Given an array of intervals, merge all overlapping intervals. An interval
// is an array with two numbers, where the first number is always less than
// the second (e.g. [1, 5]).
// The intervals must be returned in ASCENDING order.
// Example:
// [[1, 3], [8, 10], [2, 6], [10, 16]]
// merges into [[1, 6], [8, 16]]
function MergeOverlapping(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        const numberArray = data;
        numberArray.sort((a, b) => a[0] - b[0]);
        ns.print(`${JSON.stringify(numberArray)}`);
        for (let i = 0; i < numberArray.length - 1; i++) {
            if (numberArray[i][1] >= numberArray[i + 1][0]) {
                const newElement = [numberArray[i][0], Math.max(numberArray[i + 1][1], numberArray[i][1])];
                numberArray.splice(i, 2, newElement);
                ns.print(`${JSON.stringify(numberArray)}`);
                i--;
            }
        }
        ns.tprintf(`${JSON.stringify((numberArray.length != 1) ? numberArray : numberArray[0])}`);
        return [JSON.stringify((numberArray.length != 1) ? numberArray : numberArray[0])];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Generate IP Addresses"
// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.
// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.
// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
function GenerateIPAddresses(ns, data) {
    ns.print(`${JSON.stringify(data)} type:${typeof data}`);
    const baseAddress = asString(data);
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)$/;
    const validAddresses = [];
    const expectedLength = baseAddress.length + 3;
    for (let octalSize1 = 1; octalSize1 <= 3; octalSize1++) {
        for (let octalSize2 = 1; octalSize2 <= 3; octalSize2++) {
            for (let octalSize3 = 1; octalSize3 <= 3; octalSize3++) {
                for (let octalSize4 = 1; octalSize4 <= 3; octalSize4++) {
                    let addressCopy = baseAddress;
                    let addrString = "";
                    addrString = parseInt(addressCopy.substring(0, octalSize1)) + ".";
                    addressCopy = addressCopy.slice(octalSize1);
                    addrString = addrString + parseInt(addressCopy.substring(0, octalSize2)) + ".";
                    addressCopy = addressCopy.slice(octalSize2);
                    addrString = addrString + parseInt(addressCopy.substring(0, octalSize3)) + ".";
                    addressCopy = addressCopy.slice(octalSize3);
                    addrString = addrString + parseInt(addressCopy.substring(0, octalSize4));
                    addressCopy = addressCopy.slice(octalSize4);
                    if (addressCopy.length > 0) {
                        //ns.tprintf("ERROR invalid addr, leftover numbers")
                        continue;
                    }
                    ns.print(`addr: ${addrString}, leftover string: ${addressCopy}`);
                    if (addrString.length != expectedLength) {
                        ns.print("ERROR invalid addr, probably leading zeros.");
                        continue;
                    }
                    if (ipv4Regex.test(addrString)) {
                        ns.print(`INFO valid address ${addrString}`);
                        validAddresses.push(addrString);
                    }
                    else {
                        ns.print(`ERROR invalid address ${addrString}`);
                    }
                }
            }
        }
    }
    ns.tprintf(`INFO Valid Addresses ${validAddresses.filter((v, i, self) => {
        return self.indexOf(v) === i;
    })}`);
    return validAddresses.filter((v, i, self) => {
        return self.indexOf(v) === i;
    });
}
// "Sanitize Parentheses in Expression"
// Given a string with parentheses and letters, remove the minimum number of invalid
// parentheses in order to validate the string. If there are multiple minimal ways
// to validate the string, provide all of the possible results.
// The answer should be provided as an array of strings. If it is impossible to validate
// the string, the result should be an array with only an empty string.
// Examples:
// ()())() -> [()()(), (())()]
// (a)())() -> [(a)()(), (a())()]
// )( -> [“”]
function SanitizeParentheses(ns, data) {
    ns.print(`${JSON.stringify(data)} type:${typeof data}`);
    const parentheses = asString(data);
    function isValid(parens) {
        ns.print(`Testing ${parens}`);
        let opens = 0;
        for (let index = 0; index < parens.length; index++) {
            if (parens.charAt(index) === "(") {
                opens++;
            }
            else if (parens.charAt(index) === ")") {
                opens--;
            }
            if (opens < 0) {
                return false;
            }
        }
        if (opens === 0) {
            ns.print("👍");
        }
        return opens === 0;
    }
    function removeChar(str, depth, ans) {
        for (let index = 0, strcpy = str; index < str.length; index++, strcpy = str) {
            strcpy = strcpy.substring(0, index) + strcpy.substring(index + 1);
            if (depth === 0) {
                if (isValid(strcpy)) {
                    ans.push(strcpy);
                }
            }
            else {
                removeChar(strcpy, depth - 1, ans);
            }
        }
    }
    const answers = [];
    if (isValid(parentheses)) {
        answers.push(parentheses);
    }
    let n = 0;
    while (answers.length == 0) {
        ns.print(`at depth ${n}`);
        if (n === parentheses.length) {
            answers.push("");
        }
        else {
            removeChar(parentheses, n, answers);
        }
        n++;
    }
    ns.tprintf(`${JSON.stringify(answers.filter((v, i, self) => {
        return self.indexOf(v) === i;
    }))}`);
    return answers.filter((v, i, self) => {
        return self.indexOf(v) === i;
    });
}
// "Find All Valid Math Expressions"
// You are given a string which contains only digits between 0 and 9 as well as a target
// number. Return all possible ways you can add the +, -, and * operators to the string
// of digits such that it evaluates to the target number.
// The answer should be provided as an array of strings containing the valid expressions.
// NOTE: Numbers in an expression cannot have leading 0’s
// Examples:
// Input: digits = “123”, target = 6
// Output: [1+2+3, 1*2*3]
// Input: digits = “105”, target = 5
// Output: [1*0+5, 10-5]
function FindValidMathExpressions(ns, data) {
    function helper(res, path, num, target, pos, evaluated, multed) {
        if (pos === num.length) {
            if (target === evaluated) {
                res.push(path);
            }
            return;
        }
        for (let i = pos; i < num.length; ++i) {
            if (i != pos && num[pos] == "0") {
                break;
            }
            const cur = parseInt(num.substring(pos, i + 1));
            if (pos === 0) {
                helper(res, path + cur, num, target, i + 1, cur, cur);
            }
            else {
                helper(res, path + "+" + cur, num, target, i + 1, evaluated + cur, cur);
                helper(res, path + "-" + cur, num, target, i + 1, evaluated - cur, -cur);
                helper(res, path + "*" + cur, num, target, i + 1, evaluated - multed + multed * cur, multed * cur);
            }
        }
    }
    if (Array.isArray(data)) {
        const num = asString(data[0]);
        const target = asNumber(data[1]);
        if (num == null || num.length === 0) {
            return [];
        }
        const result = [];
        helper(result, "", num, target, 0, 0, 0);
        ns.tprintf(`${Array.from(result)}`);
        return result;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Algorithmic Stock Trader I"
// Determine the maximum possible profit you can earn using at most one
// transaction (i.e. you can buy an sell the stock once). If no profit
// can be made, then the answer should be 0. Note that you must buy the stock
// before you can sell it.
const isNumberArray = function (val) {
    return (Array.isArray(val) &&
        val.every((v) => {
            return typeof v === "number";
        }));
};
function StockTrader1(ns, data) {
    if (isNumberArray(data)) {
        const stocks = data;
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
function StockTrader2(ns, data) {
    if (isNumberArray(data)) {
        const stocks = data;
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
function StockTrader3(ns, data) {
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
function StockTrader4(ns, data) {
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

// "Minimum Path Sum in a Triangle"
// You are given a 2D array of numbers (array of array of numbers) that represents a
// triangle (the first array has one element, and each array has one more element than
// the one before it, forming a triangle). Find the minimum path sum from the top to the
// bottom of the triangle. In each step of the path, you may only move to adjacent
// numbers in the row below.
function MinTrianglePath(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        const numberArray = data;
        for (let row = 1; row < numberArray.length; row++) {
            for (let col = 0; col < numberArray[row].length; col++) {
                if (col === 0) {
                    numberArray[row][col] += numberArray[row - 1][col];
                }
                else if (col === numberArray[row].length - 1) {
                    numberArray[row][col] += numberArray[row - 1][col - 1];
                }
                else {
                    numberArray[row][col] += Math.min(numberArray[row - 1][col], numberArray[row - 1][col - 1]);
                }
            }
        }
        ns.print(`${JSON.stringify(numberArray)}`);
        // return unimplemented(data) 
        ns.tprintf(`MinPath: ${Math.min(...numberArray[numberArray.length - 1])}`);
        return Math.min(...numberArray[numberArray.length - 1]);
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Unique Paths in a Grid I"
// You are given an array with two numbers: [m, n]. These numbers represent a
// m x n grid. Assume you are initially positioned in the top-left corner of that
// grid and that you are trying to reach the bottom-right corner. On each step,
// you may only move down or to the right.
// Determine how many unique paths there are from start to finish.
function UniquePath1(ns, data) {
    if (Array.isArray(data) && data.every(v => typeof v === 'number')) {
        const maxX = data[0];
        const maxY = data[1];
        const map = [];
        for (let x = 0; x < maxX; x++) {
            map[x] = [];
            for (let y = 0; y < maxY; y++) {
                if (x == 0 || y == 0) {
                    map[x][y] = 1;
                }
                else {
                    map[x][y] = map[x - 1][y] + map[x][y - 1];
                }
            }
        }
        ns.tprintf(`paths: ${map[maxX - 1][maxY - 1]}`);
        return map[maxX - 1][maxY - 1];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Unique Paths in a Grid II"
// You are given a 2D array of numbers (array of array of numbers) representing
// a grid. The 2D array contains 1’s and 0’s, where 1 represents an obstacle and
// 0 represents a free space.
// Assume you are initially positioned in top-left corner of that grid and that you
// are trying to reach the bottom-right corner. In each step, you may only move down
// or to the right. Furthermore, you cannot move onto spaces which have obstacles.
// Determine how many unique paths there are from start to finish.
function UniquePath2(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        const maxX = data.length;
        const maxY = data[0].length;
        const map = data;
        for (let x = 0; x < maxX; x++) {
            for (let y = 0; y < maxY; y++) {
                if (map[x][y] == 1) {
                    map[x][y] = 0;
                }
                else {
                    if (x == 0 && y == 0) {
                        map[x][y] = 1;
                    }
                    else if (x == 0 || y == 0) {
                        if (x > 0) {
                            map[x][y] = map[x - 1][y] == 0 ? 0 : 1;
                        }
                        else if (y > 0) {
                            map[x][y] = map[x][y - 1] == 0 ? 0 : 1;
                        }
                    }
                    else {
                        map[x][y] = map[x - 1][y] + map[x][y - 1];
                    }
                }
            }
        }
        ns.print(`${JSON.stringify(map)} type:${typeof data}`);
        ns.tprintf(`paths with obstacles : ${map[maxX - 1][maxY - 1]}`);
        return map[maxX - 1][maxY - 1];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

const solveContractPath = "/contracts/solveContract.js";
const processors = new Map([
    ["Find Largest Prime Factor", largestPrimeFactor],
    ["Subarray with Maximum Sum", MaxSubArray],
    ["Total Ways to Sum", TotalSums],
    ["Spiralize Matrix", SpiralMatrix],
    ["Array Jumping Game", ArrayJump],
    ["Merge Overlapping Intervals", MergeOverlapping],
    ["Generate IP Addresses", GenerateIPAddresses],
    ["Algorithmic Stock Trader I", StockTrader1],
    ["Algorithmic Stock Trader II", StockTrader2],
    ["Algorithmic Stock Trader III", StockTrader3],
    ["Algorithmic Stock Trader IV", StockTrader4],
    ["Minimum Path Sum in a Triangle", MinTrianglePath],
    ["Unique Paths in a Grid I", UniquePath1],
    ["Unique Paths in a Grid II", UniquePath2],
    ["Sanitize Parentheses in Expression", SanitizeParentheses],
    ["Find All Valid Math Expressions", FindValidMathExpressions], //Strings
]);
async function main(ns) {
    const usage = `solveContract.ts USAGE: ${solveContractPath} <contract filename> <host>`;
    if (ns.args.length != 2) {
        ns.tprintf(`Invalid number of arguments`);
        ns.tprintf(usage);
        ns.exit();
    }
    const filename = asString(ns.args[0]);
    const host = asString(ns.args[1]);
    if (!ns.serverExists(host)) {
        ns.tprintf(`Invalid server: ${host}`);
        ns.tprintf(usage);
        ns.exit();
    }
    if (!ns.codingcontract.getContractType(filename, host)) {
        ns.tprintf(`Invalid file ${host}:${filename}`);
        ns.tprintf(usage);
        ns.exit();
    }
    const type = ns.codingcontract.getContractType(filename, host);
    const data = ns.codingcontract.getData(filename, host);
    const answer = processors.get(type)?.(ns, data);
    if (answer !== undefined) {
        const result = ns.codingcontract.attempt(answer, filename, host, { returnReward: true });
        if (result === "") {
            ns.toast(`Failed Contract: ${host}.${filename} - '${type}'`, "error");
            ns.tprintf(`Failed Contract: ${host}.${filename} - '${type}'`);
            const failed = {
                answer: answer,
                type: type,
                data: data
            };
            await ns.write("failedContracts.txt", failed + "\n", "a");
        }
        else {
            ns.toast(`${result}`, "success");
            ns.tprintf(`${result}`);
        }
    }
    else {
        ns.toast(`unable to process contract: ${host}.${filename} - '${type}'`, "warning");
        // ns.tprintf(`${ns.codingcontract.getDescription(filename,host)}\n\n`)
    }
}

export { main, solveContractPath };
