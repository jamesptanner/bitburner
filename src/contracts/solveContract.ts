import { NS } from "@ns";
import { unsolveableContractPath } from "/contracts/unsolveableContract";
import {
  ArrayJump,
  ArrayJump2,
  MergeOverlapping,
  SpiralMatrix,
} from "/contracts/solvers/ArrayContracts";
import {
  largestPrimeFactor,
  MaxSubArray,
  TotalSums,
  TotalSums2,
} from "/contracts/solvers/MathContracts";
import {
  colorGraph,
  MinTrianglePath,
  UniquePath1,
  UniquePath2,
} from "/contracts/solvers/PathContracts";
import {
  StockTrader1,
  StockTrader2,
  StockTrader3,
  StockTrader4,
} from "/contracts/solvers/StockContracts";
import {
  FindValidMathExpressions,
  GenerateIPAddresses,
  HammingBtoI,
  runLengthEncoding,
  SanitizeParentheses,
} from "/contracts/solvers/StringContracts";

import { asString } from "/shared/utils";
import { lzDecompression } from "/contracts/solvers/StringContracts";
import { Logging } from "/shared/logging";

export const solveContractPath = "/contracts/solveContract.js";

interface ContractFunction {
  (ns: NS, data: unknown): number | string[] | undefined;
}

const processors = new Map<string, ContractFunction>([
  ["Find Largest Prime Factor", largestPrimeFactor], //Maths     DONE
  ["Subarray with Maximum Sum", MaxSubArray], //Maths     DONE
  ["Total Ways to Sum", TotalSums], //Maths     DONE
  ["Total Ways to Sum II", TotalSums2], //Maths     DONE
  ["Spiralize Matrix", SpiralMatrix], //Arrays    DONE
  ["Array Jumping Game", ArrayJump], //Arrays    DONE
  ["Array Jumping Game II", ArrayJump2], //Arrays    DONE
  ["Merge Overlapping Intervals", MergeOverlapping], //Arrays    DONE
  ["Generate IP Addresses", GenerateIPAddresses], //Strings   DONE
  ["Algorithmic Stock Trader I", StockTrader1], //Stocks    DONE
  ["Algorithmic Stock Trader II", StockTrader2], //Stocks    DONE
  ["Algorithmic Stock Trader III", StockTrader3], //Stocks    DONE
  ["Algorithmic Stock Trader IV", StockTrader4], //Stocks    DONE
  ["Minimum Path Sum in a Triangle", MinTrianglePath], //Paths     DONE
  ["Unique Paths in a Grid I", UniquePath1], //Paths     DONE
  ["Unique Paths in a Grid II", UniquePath2], //Paths     DONE
  ["Sanitize Parentheses in Expression", SanitizeParentheses], //Strings   DONE
  ["Find All Valid Math Expressions", FindValidMathExpressions], //Strings   DONE
  ["HammingCodes: Encoded Binary to Integer", HammingBtoI], //Strings   DONE
  // ["HammingCodes: Integer to encoded Binary",HammingItoB],        //Strings
  ["Compression I: RLE Compression", runLengthEncoding], //Strings   DONE
  //["Compression II: LZ Decompression",lzDecompression],           //Strings
  // ["Compression III: LZ Compression",lzCompression],              //Strings
  ["Proper 2-Coloring of a Graph", colorGraph], //Paths    DONE
]);

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  const usage = `solveContract.ts USAGE: ${solveContractPath} <contract filename> <host>`;
  if (ns.args.length !== 2) {
    logging.error(`Invalid number of arguments`);
    logging.info(usage);
    ns.exit();
  }

  const filename: string = asString(ns.args[0]);
  const host: string = asString(ns.args[1]);

  if (!ns.fileExists(filename, host)) {
    logging.warning("contract missing.");
    ns.exit();
  }

  if (!ns.codingcontract.getContractType(filename, host)) {
    logging.error(`Invalid file ${host}:${filename}`);
    logging.info(usage);
    ns.exit();
  }

  const type = ns.codingcontract.getContractType(filename, host);
  const data = ns.codingcontract.getData(filename, host);

  logging.info(`${filename} : ${host} : ${type} : ${data}`);
  try {
    const answer = processors.get(type)?.(ns, data);
    if (answer !== undefined) {
      const result = ns.codingcontract.attempt(answer, filename, host);
      if (result === "") {
        logging.error(`Failed Contract: ${host}.${filename} - '${type}'`, true);
        ns.spawn(
          unsolveableContractPath,
          1,
          "--file",
          filename,
          "--host",
          host,
        );
      } else {
        logging.success(`${result}`, true);
        await ns.write(
          "solvedContracts.txt",
          JSON.stringify([type, data, answer, "\n"]),
          "a",
        );
      }
    } else {
      logging.warning(
        `unable to process contract: ${host}.${filename} - '${type}'`,
        true,
      );
      ns.spawn(unsolveableContractPath, 1, "--file", filename, "--host", host);
    }
  } catch (e: unknown) {
    if (typeof e === "string") {
      logging.error(e, true);
    } else if (e instanceof Error) {
      logging.error(e.message, true);
    }
  }
}
