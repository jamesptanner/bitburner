import { NS } from '@ns'
import { asString } from '/utils/utils';
import { largestPrimeFactor, TotalSums, MaxSubArray } from '/contracts/solvers/MathContracts';
import { SpiralMatrix, MergeOverlapping, ArrayJump } from '/contracts/solvers/ArrayContracts';
import { GenerateIPAddresses, FindValidMathExpressions, SanitizeParentheses } from '/contracts/solvers/StringContracts';
import { StockTrader1, StockTrader2, StockTrader3, StockTrader4 } from '/contracts/solvers/StockContracts';
import { MinTrianglePath, UniquePath1, UniquePath2 } from '/contracts/solvers/PathContracts';

export const solveContractPath = "/contracts/solveContract.js";

interface ContractFunction {
    (ns:NS, data: any): (number | string[] | undefined)
}

interface FailedContract {
    type:string
    data: any
    answer:number | string[]
}

const processors = new Map<string, ContractFunction>([
    ["Find Largest Prime Factor", largestPrimeFactor],              //Maths     DONE
    ["Subarray with Maximum Sum", MaxSubArray],                     //Maths     DONE
    ["Total Ways to Sum", TotalSums],                               //Maths     DONE
    ["Spiralize Matrix", SpiralMatrix],                             //Arrays    DONE
    ["Array Jumping Game", ArrayJump],                              //Arrays    DONE
    ["Merge Overlapping Intervals", MergeOverlapping],              //Arrays    UNTESTED
    ["Generate IP Addresses", GenerateIPAddresses],                 //Strings   DONE
    ["Algorithmic Stock Trader I", StockTrader1],                   //Stocks    DONE
    ["Algorithmic Stock Trader II", StockTrader2],                  //Stocks    DONE
    ["Algorithmic Stock Trader III", StockTrader3],                 //Stocks    DONE
    ["Algorithmic Stock Trader IV", StockTrader4],                  //Stocks    DONE
    ["Minimum Path Sum in a Triangle", MinTrianglePath],            //Paths     DONE
    ["Unique Paths in a Grid I", UniquePath1],                      //Paths     DONE
    ["Unique Paths in a Grid II", UniquePath2],                     //Paths     DONE
    ["Sanitize Parentheses in Expression", SanitizeParentheses],    //Strings
    ["Find All Valid Math Expressions", FindValidMathExpressions],  //Strings

])

export async function main(ns: NS): Promise<void> {
    const usage = `solveContract.ts USAGE: ${solveContractPath} <contract filename> <host>`;
    if (ns.args.length != 2) {
        ns.tprintf(`Invalid number of arguments`)
        ns.tprintf(usage)
        ns.exit()
    }

    const filename: string = asString(ns.args[0])
    const host: string = asString(ns.args[1])

    if (!ns.serverExists(host)) {
        ns.tprintf(`Invalid server: ${host}`)
        ns.tprintf(usage)
        ns.exit()
    }

    if (!ns.codingcontract.getDescription(filename, host)) {
        ns.tprintf(`Invalid file ${host}:${filename}`)
        ns.tprintf(usage)
        ns.exit()
    }

    const type = ns.codingcontract.getContractType(filename,host);
    const data = ns.codingcontract.getData(filename,host)

    const answer = processors.get(type)?.(ns,data);
    if (answer !== undefined) {
        const result = ns.codingcontract.attempt(answer, filename, host,{returnReward:true})
        if (result === "") {
            ns.toast(`Failed Contract: ${host}.${filename} - '${type}'`,"error")
            ns.tprintf(`Failed Contract: ${host}.${filename} - '${type}'`)
            const failed:FailedContract = {
                answer: answer,
                type: type,
                data: data
            }
            
            await ns.write("failedContracts.txt",failed+"\n","a")
        }
        else {
            ns.toast(`${result}`,"success")
        }
    }
    else {
        ns.toast(`unable to process contract: ${host}.${filename} - '${type}'`,"warning")
        // ns.tprintf(`${ns.codingcontract.getDescription(filename,host)}\n\n`)
    }
}