import { NS } from "@ns";
import { asNumber, asString } from "shared/utils";
import { Logging } from "/shared/logging";
// "Generate IP Addresses"

// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.

// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.

// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
export function GenerateIPAddresses(
  ns: NS,
  data: unknown,
  logging: Logging
): string[] {
  logging.info(`${JSON.stringify(data)} type:${typeof data}`);
  const baseAddress: string = asString(data);
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)$/;
  const validAddresses: string[] = [];
  const expectedLength = baseAddress.length + 3;
  for (let octalSize1 = 1; octalSize1 <= 3; octalSize1++) {
    for (let octalSize2 = 1; octalSize2 <= 3; octalSize2++) {
      for (let octalSize3 = 1; octalSize3 <= 3; octalSize3++) {
        for (let octalSize4 = 1; octalSize4 <= 3; octalSize4++) {
          let addressCopy = baseAddress;
          let addrString = "";
          addrString = parseInt(addressCopy.substring(0, octalSize1)) + ".";
          addressCopy = addressCopy.slice(octalSize1);
          addrString =
            addrString + parseInt(addressCopy.substring(0, octalSize2)) + ".";
          addressCopy = addressCopy.slice(octalSize2);
          addrString =
            addrString + parseInt(addressCopy.substring(0, octalSize3)) + ".";
          addressCopy = addressCopy.slice(octalSize3);
          addrString =
            addrString + parseInt(addressCopy.substring(0, octalSize4));
          addressCopy = addressCopy.slice(octalSize4);

          if (addressCopy.length > 0) {
            logging.error("invalid addr, leftover numbers");
            continue;
          }
          logging.info(`addr: ${addrString}, leftover string: ${addressCopy}`);
          if (addrString.length !== expectedLength) {
            logging.error("invalid addr, probably leading zeros.");
            continue;
          }
          if (ipv4Regex.test(addrString)) {
            logging.info(`valid address ${addrString}`);
            validAddresses.push(addrString);
          } else {
            logging.error(`invalid address ${addrString}`);
          }
        }
      }
    }
  }
  logging.success(
    `Valid Addresses ${validAddresses.filter((v, i, self) => {
      return self.indexOf(v) === i;
    })}`,
  );
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
export function SanitizeParentheses(
  ns: NS,
  data: unknown,
  logging: Logging
):  string[] {
  logging.info(`${JSON.stringify(data)} type:${typeof data}`);
  const parentheses: string = asString(data);

  function isValid(parens: string): boolean {
    let opens = 0;
    for (let index = 0; index < parens.length; index++) {
      if (parens.charAt(index) === "(") {
        opens++;
      } else if (parens.charAt(index) === ")") {
        opens--;
      }
      if (opens < 0) {
        return false;
      }
    }
    if (opens === 0) {
      logging.info(`👍 ${parens}`);
    }
    return opens === 0;
  }

  const queue = [parentheses]
  const tested = new Set();
  tested.add(parentheses);
  let found = false;
  const solutions = []
  while(queue.length>0){
    const expression = queue.shift();
    if(!expression) continue;

    if (isValid(expression)){
      solutions.push(expression);
      found = true;
    }
    if (found) continue;

    for (let i = 0; i < expression.length; i++) {
      if (expression.charAt(i) !== '(' &&  expression.charAt(i) !== ')'){
        continue;
      }
      const stripped = expression.slice(0,i) + expression.slice(i+1);
      if (!tested.has(stripped)){
        queue.push(stripped);
        tested.add(stripped);
      }
    }
  }
  return solutions;
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
export function FindValidMathExpressions(
  ns: NS,
  data: unknown,
  logging: Logging
): string[] {
  function helper(
    res: string[],
    path: string,
    num: string,
    target: number,
    pos: number,
    evaluated: number,
    multed: number,
  ) {
    if (pos === num.length) {
      if (target === evaluated) {
        res.push(path);
      }
      return;
    }
    for (let i = pos; i < num.length; ++i) {
      if (i !== pos && num[pos] === "0") {
        break;
      }
      const cur = parseInt(num.substring(pos, i + 1));
      if (pos === 0) {
        helper(res, path + cur, num, target, i + 1, cur, cur);
      } else {
        helper(res, path + "+" + cur, num, target, i + 1, evaluated + cur, cur);
        helper(
          res,
          path + "-" + cur,
          num,
          target,
          i + 1,
          evaluated - cur,
          -cur,
        );
        helper(
          res,
          path + "*" + cur,
          num,
          target,
          i + 1,
          evaluated - multed + multed * cur,
          multed * cur,
        );
      }
    }
  }

  if (Array.isArray(data)) {
    const num = asString(data[0]);
    const target = asNumber(data[1]);

    if (num === null || num.length === 0) {
      return [];
    }
    const result: string[] = [];
    helper(result, "", num, target, 0, 0, 0);

    logging.success(`${Array.from<string>(result)}`);
    return result;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

// You are given the following encoded binary String:
// '01010101000'
// Treat it as a Hammingcode with 1 'possible' error on an random Index.
// Find the 'possible' wrong bit, fix it and extract the decimal value, which is hidden inside the string.

// Note: The length of the binary string is dynamic, but it's encoding/decoding is following Hammings 'rule'
// Note 2: Index 0 is an 'overall' parity bit. Watch the Hammingcode-video from 3Blue1Brown for more information
// Note 3: There's a ~55% chance for an altered Bit. So... MAYBE there is an altered Bit 😉
// Extranote for automation: return the decimal value as a string
export function HammingBtoI(
  ns: NS,
  data: unknown,
  logging: Logging
): string {
  const bin2Dec = function (bin: string): number {
    return parseInt(bin, 2);
  };

  if (typeof data === "string") {
    const binary = data;
    const bits: number[] = [];
    for (const c of binary) {
      bits.push(c === "1" ? 1 : 0);
    }
    const err = bits
      .map((v, i) => {
        return v > 0 ? i : 0;
      })
      .reduce((p, c) => {
        return p ^ c;
      });
    if (err > 0) {
      logging.info(`error at ${err}`);
      bits[err] = bits[err] === 1 ? 0 : 1;
    } else {
      logging.info("no error detected.");
    }
    for (let bit = bits.length - 1; bit >= 0; bit--) {
      if ((bit & (bit - 1)) === 0) {
        bits.splice(bit, 1);
      }
    }
    logging.info(`remaining bits: ${bits.join("")}`);

    const integer = bin2Dec(bits.join(""));
    logging.success(`integer value: ${integer}`);
    return `${integer}`;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

// You are given the following decimal Value:
// 1084208828266
// Convert it into a binary string and encode it as a 'Hamming-Code'. eg:
// Value 8 will result into binary '1000', which will be encoded with the pattern 'pppdpddd', where p is a paritybit and d a databit,
// or '10101' (Value 21) will result into (pppdpdddpd) '1001101011'.

// NOTE: You need an parity Bit on Index 0 as an 'overall'-paritybit.
// NOTE 2: You should watch the HammingCode-video from 3Blue1Brown, which explains the 'rule' of encoding, including the first Index parity-bit mentioned on the first note.

// Now the only one rule for this encoding:
// It's not allowed to add additional leading '0's to the binary value
// That means, the binary value has to be encoded as it is
export function HammingItoB(
  ns: NS,
  data: unknown,
  logging: Logging
): string {

  const decToBin = function (dec: number): number[] {
    const bin = [];
    while (dec > 0) {
      bin.push(dec % 2);
      dec = Math.floor(dec / 2);
    }
    return bin;
  };
  if (typeof data === "number") {
    const decimal = data;
    logging.info(`converting: ${decimal}`);

    //convert decimal to binary
    const bin = decToBin(decimal).reverse();
    logging.info(`convert to binary: ${bin.join("")}`);
    //calculate number of parity bits
    const controlBitsIndex: number[] = [];
    let i = 1;
    while ((bin.length + controlBitsIndex.length) / i >= 1) {
      controlBitsIndex.push(i);
      i *= 2;
    }

    // bin.splice(0, 0, 2);
    controlBitsIndex.forEach((i) => {
      bin.splice(i-1, 0, 0);
    });
    logging.info(`inserted parity: ${bin.join("")}`);

    controlBitsIndex.forEach((i) => {
      logging.info(`calculating parity ${i}`);
      bin[i-1] = bin
        .filter((v, index) => {
         // logging.info(`${index} & ${i} == ${index & i}`);
          return (i & index) !== 0;
        })
        .reduce((prev, curr, index) => {
          return prev ^ (index & i) ? curr : 0;
        }, 0);
      logging.info(`${i} parity: ${bin[i-1]}`);
      logging.info(`bin update: ${bin.join("")}`);
    });

    logging.info(`calulating parity 0`);
    const bit0Parity = bin.reduce((prev, curr) => {
      return prev ^ curr;
    });
    bin.unshift(bit0Parity);
    logging.info(`0 parity: ${bin[0]}`);
    logging.success(`with parity: ${bin.join("")}`);
    return bin.join("");
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

export function runLengthEncoding(
  ns: NS,
  data: unknown,
  logging: Logging
): string {
  if (typeof data === "string") {
    const dataArray = [...data];
    logging.info(data);

    type pairs = {
      char: string;
      count: number;
    };
    const rlPairs = dataArray.reduce<pairs[]>((prev, curr) => {
      if (prev.length === 0 || curr !== prev[prev.length - 1].char) {
        prev.push({ char: curr, count: 1 });
        return prev;
      } else {
        prev[prev.length - 1] = {
          char: curr,
          count: prev[prev.length - 1].count + 1,
        };
        return prev;
      }
    }, []);
    logging.info(`${JSON.stringify(rlPairs)}`);
    let retData = "";
    while (rlPairs.length > 0) {
      if (rlPairs[0].count > 9) {
        retData = `${retData}9${rlPairs[0].char}`;
        rlPairs[0].count = rlPairs[0].count - 9;
      } else {
        retData = `${retData}${rlPairs[0].count}${rlPairs[0].char}`;
        rlPairs.splice(0, 1);
      }
    }
    logging.success(retData);
    return retData;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}



// Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. 
// In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII 
// digit from 1 to 9, followed by the chunk data, which is either:

//  1. Exactly L characters, which are to be copied directly into the uncompressed data.
//  2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: 
// each of the L output characters is a copy of the character X places before it in the uncompressed data.

// For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new 
// chunk. The two chunk types alternate, starting with type 1, and the final chunk may be of either type.

//  You are given the following LZ-encoded string:
//        9r4B6MHlqE08Jl6fIAmZ5988D20szFy1693Hqq23H45961A593J85
//  Decode it and output the original string.

//  Example: decoding '5aaabb450723abb' chunk-by-chunk
//        5aaabb            ->   aaabb
//        5aaabb45          ->   aaabbaaab
//        5aaabb450         ->   aaabbaaab
//        5aaabb45072       ->   aaabbaaababababa
//        5aaabb450723abb   ->   aaabbaaababababaabb
export function lzDecompression(
  ns: NS,
  data: unknown,
  logging: Logging
): string {
  if (typeof data === "string") {
    logging.info(data);
    const datArr = [...data];
    let ret = "";
    let state = 0;
    while (datArr.length > 0) {
      switch(state%2){
        case 0:
          {
          const count = parseInt(datArr.shift()!);
          logging.info(`direct ${count}`)
          ret += datArr.splice(0,count).join("");
          break;
          }
        case 1:
          {
          let count = parseInt(datArr.shift()!);
          if (count ==0) {logging.info(`skip copy`); break;}
          const pos = parseInt(datArr.shift()!);
          logging.info(`copy ${count} from ${pos}`);


          // for (let index = ret.length-1-pos; index < ret.length-1-pos+count; index++){
          //   ret += ret[index]; 
          // }

            while(count>0){
              ret += ret[ret.length-pos];
              count--;
            }
          break;
          }
      }
      logging.info(ret);
      state++;
    }
    logging.success(ret);
    return ret;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

/**
 * Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ,
 *  data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, 
 * which is either:  
  
 1. Exactly L characters, which are to be copied directly into the uncompressed data.  
 2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: each of the L output characters 
 is a copy of the character X places before it in the uncompressed data.  
  
 For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. The two chunk types 
 alternate, starting with type 1, and the final chunk may be of either type.  
  
 You are given the following input string:  
           FLI48bcpSVUW55551VUW555655655Wo655655WoT655WoT655WoTRoTRojRoTRojRoTOoTRojRoTYe  
 Encode it using Lempel-Ziv encoding with the minimum possible output length.  
  
 Examples (some have other possible encodings of minimal length):  
           abracadabra        ->     7abracad47  
           mississippi        ->     4miss433ppi  
           aAAaAAaAaAA        ->     3aAA53035  
           2718281828         ->     627182844  
           abcdefghijk        ->     9abcdefghi02jk  
           aaaaaaaaaaaa       ->     3aaa91  
           aaaaaaaaaaaaa      ->     1a91031  
           aaaaaaaaaaaaaa     ->     1a91041
 * @param ns 
 * @param data 
 * @param logging 
 * @returns 
 */
export function lzCompression(
  ns: NS,
  data: unknown,
  logging: Logging
): string {
  if (typeof data === "string") {
    const ret = "";
    

    logging.info(`${data} -> ${ret}`);
    return ret;
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

function mod(n: number, m:number):number {
  return ((n % m) + m) % m;
}

export function caesarEncrypt(ns: NS, data: unknown, logging: Logging) : string {
  const [plaintext, shift] = data as [string, number];

  var cipherText = "";
  for(let index = 0; index < plaintext.length; index++) {
    cipherText += plaintext[index] !== " " ? String.fromCharCode(mod((plaintext.toUpperCase().charCodeAt(index)-65-shift), 26) + 65) : " ";
  }
  logging.info(`"${cipherText}"`);

  return cipherText;
}

export function VigenereCipher(ns: NS, data: unknown, logging: Logging) : string {
  const [plaintext, keyword] = data as string[];

  var response = ""
  for (let index = 0; index < plaintext.length; index++) {
    response += String.fromCharCode(((plaintext.toUpperCase().charCodeAt(index)-65) + ((keyword.toUpperCase().charCodeAt(index % keyword.length)-65)))%26 + 65).toUpperCase();
  }
  logging.info(`"${response}"`);
  return response;
}