import { NS } from '@ns'
import { asString } from '/shared/utils';
import { largestPrimeFactor, TotalSums, MaxSubArray, TotalSums2 } from '/contracts/solvers/MathContracts';
import { SpiralMatrix, MergeOverlapping, ArrayJump, ArrayJump2 } from '/contracts/solvers/ArrayContracts';
import { GenerateIPAddresses, FindValidMathExpressions, SanitizeParentheses,HammingBtoI,HammingItoB } from '/contracts/solvers/StringContracts';
import { StockTrader1, StockTrader2, StockTrader3, StockTrader4 } from '/contracts/solvers/StockContracts';
import { MinTrianglePath, UniquePath1, UniquePath2 } from '/contracts/solvers/PathContracts';
import { unsolveableContractPath } from './unsolveableContract';
import { error, initLogging } from '/shared/logging';

export const solveContractPath = "/contracts/solveContract.js";

interface ContractFunction {
  (ns: NS, data: unknown): number | string[] | undefined;
}

interface FailedContract {
  type: string;
  data: unknown;
  answer: number | string[];
}

const processors = new Map<string, ContractFunction>([
    ["Find Largest Prime Factor", largestPrimeFactor],              //Maths     DONE
    ["Subarray with Maximum Sum", MaxSubArray],                     //Maths     DONE
    ["Total Ways to Sum", TotalSums],                               //Maths     DONE
    ["Total Ways to Sum II", TotalSums2],                           //Maths     DONE
    ["Spiralize Matrix", SpiralMatrix],                             //Arrays    DONE
    ["Array Jumping Game", ArrayJump],                              //Arrays    DONE
    ["Array Jumping Game II", ArrayJump2],                          //Arrays    DONE
    ["Merge Overlapping Intervals", MergeOverlapping],              //Arrays    DONE
    ["Generate IP Addresses", GenerateIPAddresses],                 //Strings   DONE
    ["Algorithmic Stock Trader I", StockTrader1],                   //Stocks    DONE
    ["Algorithmic Stock Trader II", StockTrader2],                  //Stocks    DONE
    ["Algorithmic Stock Trader III", StockTrader3],                 //Stocks    DONE
    ["Algorithmic Stock Trader IV", StockTrader4],                  //Stocks    DONE
    ["Minimum Path Sum in a Triangle", MinTrianglePath],            //Paths     DONE
    ["Unique Paths in a Grid I", UniquePath1],                      //Paths     DONE
    ["Unique Paths in a Grid II", UniquePath2],                     //Paths     DONE
    ["Sanitize Parentheses in Expression", SanitizeParentheses],    //Strings   DONE
    ["Find All Valid Math Expressions", FindValidMathExpressions],  //Strings   DONE
    ["HammingCodes: Encoded Binary to Integer",HammingBtoI],        //Strings
    ["HammingCodes: Integer to encoded Binary",HammingItoB],        //Strings

])

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const usage = `solveContract.ts USAGE: ${solveContractPath} <contract filename> <host>`;
    if (ns.args.length != 2) {
        ns.tprintf(`Invalid number of arguments`)
        ns.tprintf(usage)
        ns.exit()
    }

    const filename: string = asString(ns.args[0])
    const host: string = asString(ns.args[1])

    if (!ns.codingcontract.getContractType(filename, host)) {
        ns.tprintf(`Invalid file ${host}:${filename}`)
        ns.tprintf(usage)
        ns.exit()
    }

    const type = ns.codingcontract.getContractType(filename,host);
    const data = ns.codingcontract.getData(filename,host)
    try {
        const answer = processors.get(type)?.(ns,data);
        if (answer !== undefined) {
            const result = ns.codingcontract.attempt(answer, filename, host,{returnReward:true})
            if (result === "") {
                ns.toast(`Failed Contract: ${host}.${filename} - '${type}'`,"error")
                ns.spawn(unsolveableContractPath,1,"--file",filename,"--host",host)

            }
            else {
                ns.toast(`${result}`,"success")
                ns.tprintf(`${result}`)
                await ns.write("solvedContracts.txt",[type,data,answer,"\n"],'a')
            }
        }
        else {
            ns.toast(`unable to process contract: ${host}.${filename} - '${type}'`,"warning")
            ns.spawn(unsolveableContractPath,1,"--file",filename,"--host",host)
            // ns.tprintf(`${ns.codingcontract.getDescription(filename,host)}\n\n`)
        }
    }
    catch(e:unknown){
        if(typeof e === "string"){
            error(e,true)
        }
        else if (e instanceof Error){
            error(e.message,true)
        }
    }
}