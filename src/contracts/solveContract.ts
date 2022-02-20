import { NS } from '@ns'
import { asString } from '/utils/utils';
import { largestPrimeFactor, TotalSums, MaxSubArray } from '/contracts/solvers/MathContracts';
import { SpiralMatrix, MergeOverlapping, ArrayJump } from '/contracts/solvers/ArrayContracts';
import { GenerateIPAddresses, FindValidMathExpressions, SanitizeParentheses } from '/contracts/solvers/StringContracts';
import { StockTrader1, StockTrader2, StockTrader3, StockTrader4 } from '/contracts/solvers/StockContracts';
import { MinTrianglePath, UniquePath1, UniquePath2 } from '/contracts/solvers/PathContracts';

export const solveContractPath = "/contracts/solveContract.js";

interface ContractFunction {
    (data: any): (number | string[] | undefined)
}
interface ContractProcessor {
    contractType: string
    contractFunction: ContractFunction
}

const processors = new Map<string, ContractFunction>([
    ["Find Largest Prime Factor", largestPrimeFactor],              //Maths
    ["Subarray with Maximum Sum", MaxSubArray],                     //Maths
    ["Total Ways to Sum", TotalSums],                               //Maths
    ["Spiralize Matrix", SpiralMatrix],                             //Arrays
    ["Array Jumping Game", ArrayJump],                              //Arrays
    ["Merge Overlapping Intervals", MergeOverlapping],              //Arrays
    ["Generate IP Addresses", GenerateIPAddresses],                 //Strings
    ["Algorithmic Stock Trader I", StockTrader1],                   //Stocks
    ["Algorithmic Stock Trader II", StockTrader2],                  //Stocks
    ["Algorithmic Stock Trader III", StockTrader3],                 //Stocks
    ["Algorithmic Stock Trader IV", StockTrader4],                  //Stocks
    ["Minimum Path Sum in a Triangle", MinTrianglePath],            //Paths
    ["Unique Paths in a Grid I", UniquePath1],                      //Paths
    ["Unique Paths in a Grid II", UniquePath2],                     //Paths
    ["Sanitize Parentheses in Expression", SanitizeParentheses],    //Strings
    ["Find All Valid Math Expressions", FindValidMathExpressions],  //Strings

])



export async function main(ns: NS): Promise<void> {

    const usage = `solveContract.ts USAGE: ${solveContractPath} <contract filename> <host> <contract type> <contract data>`;
    if (ns.args.length != 4) {
        ns.tprintf(`Invalid number of arguments`)
        ns.tprintf(usage)
        ns.exit()
    }

    const filename: string = asString(ns.args[0])
    const host: string = asString(ns.args[1])
    const type: string = asString(ns.args[2])
    const data: string[] | number = JSON.parse(asString(ns.args[3]))

    if (!ns.serverExists(host)) {
        ns.tprintf(`Invalid server: ${host}`)
        ns.tprintf(usage)
        ns.exit()
    }

    if (!ns.fileExists(filename, host)) {
        ns.tprintf(`Invalid file ${filename}`)
        ns.tprintf(usage)
        ns.exit()
    }

    const answer = processors.get(type)?.(data);
    if (answer) {
        if (!ns.codingcontract.attempt(answer, filename, host)) {
            alert(`Failed Contract: ${host}.${filename}`)
        }
    }
    else {
        ns.tprintf(`unable to process contract: ${host}.${filename} - ${type}`)
    }
}