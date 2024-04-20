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
  caesarEncrypt,
  FindValidMathExpressions,
  GenerateIPAddresses,
  HammingBtoI,
  HammingItoB,
  runLengthEncoding,
  SanitizeParentheses,
  lzCompression,
  lzDecompression,
  VigenereCipher
} from "/contracts/solvers/StringContracts";

import { asString } from "/shared/utils";
import { Logging } from "/shared/logging";

export const solveContractPath = "/contracts/solveContract.js";

interface ContractFunction {
  (ns: NS, data: any, logging: Logging): number | string | any[];
}

const processors = new Map<string, ContractFunction>([
  ["Find Largest Prime Factor", largestPrimeFactor],
  ["Subarray with Maximum Sum", MaxSubArray],
  ["Total Ways to Sum", TotalSums],
  ["Total Ways to Sum II", TotalSums2],
  ["Spiralize Matrix", SpiralMatrix],
  ["Array Jumping Game", ArrayJump],
  ["Array Jumping Game II", ArrayJump2],
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
  ["Find All Valid Math Expressions", FindValidMathExpressions],
  ["HammingCodes: Encoded Binary to Integer", HammingBtoI],
  ["HammingCodes: Integer to Encoded Binary",HammingItoB],
  ["Compression I: RLE Compression", runLengthEncoding],
  ["Compression II: LZ Decompression",lzDecompression],
  ["Compression III: LZ Compression",lzCompression],
  ["Proper 2-Coloring of a Graph", colorGraph],
  ["Encryption I: Caesar Cipher", caesarEncrypt],
  ["Encryption II: Vigenère Cipher", VigenereCipher]
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
    const answer = processors.get(type)?.(ns, data,logging);
    if (answer !== undefined) {
      const result = ns.codingcontract.attempt(answer, filename, host);
      if (result === "") {
        ns.tail();
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
        //logging.success(`${result}`, true);
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
    ns.tail();
    if (typeof e === "string") {
      logging.error(e, true);
    } else if (e instanceof Error) {
      logging.error(e.message, true);
    }
  }
}
