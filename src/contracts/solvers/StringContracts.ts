import { NS } from '@ns';
import { stringify } from 'querystring';
import { asNumber, asString } from "/shared/utils";
// "Generate IP Addresses"

// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.

// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.

// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
export function GenerateIPAddresses(ns: NS, data: unknown): number | string[] | undefined {
  ns.print(`${JSON.stringify(data)} type:${typeof data}`);
  const baseAddress: string = asString(data);
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)$/;
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
          } else {
            ns.print(`ERROR invalid address ${addrString}`);
          }
        }
      }
    }
  }
  ns.print(
    `INFO Valid Addresses ${validAddresses.filter((v, i, self) => {
      return self.indexOf(v) === i;
    })}`
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
export function SanitizeParentheses(ns: NS, data: unknown): number | string[] | undefined {
  ns.print(`${JSON.stringify(data)} type:${typeof data}`);
  const parentheses: string = asString(data);

  function isValid(parens: string): boolean {
    ns.print(`Testing ${parens}`);
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
      ns.print("👍");
    }
    return opens === 0;
  }

  function removeChar(str: string, depth: number, ans: string[]) {
    for (let index = 0, strcpy = str; index < str.length; index++, strcpy = str) {
      strcpy = strcpy.substring(0, index) + strcpy.substring(index + 1);
      if (depth === 0) {
        if (isValid(strcpy)) {
          ans.push(strcpy);
        }
      } else {
        removeChar(strcpy, depth - 1, ans);
      }
    }
  }

  const answers: string[] = [];

  if (isValid(parentheses)) {
    answers.push(parentheses);
  }
  let n = 0;
  while (answers.length == 0) {
    ns.print(`at depth ${n}`);
    if (n === parentheses.length) {
      answers.push("");
    } else {
      removeChar(parentheses, n, answers);
    }
    n++;
  }

  ns.print(
    `${JSON.stringify(
      answers.filter((v, i, self) => {
        return self.indexOf(v) === i;
      })
    )}`
  );
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
export function FindValidMathExpressions(ns: NS, data: unknown): number | string[] | undefined {
  function helper(res: string[], path: string, num: string, target: number, pos: number, evaluated: number, multed: number) {
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
      } else {
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
    const result: string[] = [];
    helper(result, "", num, target, 0, 0, 0);

    ns.print(`${Array.from<string>(result)}`);
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
export function HammingBtoI(ns: NS, data: unknown): number | string[] | undefined {
  const bin2Dec = function (bin: string): number { 
    return parseInt(bin,2)
  }

  if (typeof data === 'string') {
    const binary = data
    const bits: number[] = []
    for (const c of binary) {
      bits.push(c==='1'?1:0)
    }
    const err = bits.map((v, i) => { return v > 0 ? i : 0 }).reduce((p, c) => { return p ^ c })
    if (err > 0) {
      ns.print(`error at ${err}`)
      bits[err]  = (bits[err] === 1)? 0 :1
    }
    else {
      ns.print('no error detected.')
    }
    for (let bit = bits.length - 1; bit >= 0; bit--){
      if ((bit & (bit - 1)) === 0) {
        bits.splice(bit,1)
      }
    }
    ns.print(`remaining bits: ${bits.join('')}`)

    const integer = bin2Dec(bits.join(''))
    ns.print(`integer value: ${integer}`)
    return [`${integer}`]
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
export function HammingItoB(ns: NS, data: unknown): number | string[] | undefined {
  
  const decToBin = function (dec: number): number[] { 
    const bin = []
    while (dec > 0) {
      bin.push(dec % 2)
      dec = Math.floor(dec / 2)
    }
    return bin
  }
  if(typeof data === 'number'){
    const decimal = data
    ns.tprint(`converting: ${decimal}`)

    //convert decimal to binary
    const bin = decToBin(decimal)
    ns.tprint(`convert to binary: ${bin.join('')}`)
    //calculate number of parity bits 
    const controlBitsIndex: number[] = []
    let i = 1
    while ((bin.length + controlBitsIndex.length) / i >= 1) {
      controlBitsIndex.push(i)
      i *= 2
    }

    bin.splice(0,0,0)
    controlBitsIndex.forEach(i => {
      bin.splice(i,0,0)
    })
    ns.tprint(`inserted parity: ${bin.join('')}`)

    controlBitsIndex.forEach(i => {
      // ns.tprint(`calculating parity ${i}`)
      bin[i] = bin.filter((v,index)=>{
        // ns.tprintf(`${index} & ${i} == ${index&i}`)
        return (i & index) !== 0
      }).reduce((prev, curr, index) => {return prev ^ (index & i) ? curr : 0},0)
      // ns.tprint(`${i} parity: ${bin[i]}`)
      // ns.tprint(`bin update: ${bin.join('')}`)
    })

    // ns.tprint(`calulating parity 0`)
    bin[0] = bin.reduce((prev, curr) => { return prev ^ curr })
    // ns.tprint(`0 parity: ${bin[0]}`)
    ns.tprint(`with parity: ${bin.join('')}`)
   return [bin.join('')]
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

export function runLengthEncoding(ns: NS, data: unknown): number | string[] | undefined {
  if (typeof data === 'string') {
    const dataArray = [...data]
    ns.print(data)

    type pairs = {
      char:string
      count:number
    }
    const rlPairs = dataArray.reduce<pairs[]>((prev,curr)=>{
      if(prev.length===0 || curr !== prev[prev.length-1].char){
        prev.push({char:curr, count:1})
        return prev
      }
      else {
        prev[prev.length-1] = {char:curr,count:prev[prev.length-1].count+1}
        return prev
      }
    },[])
    ns.print(rlPairs)
    let retData = ""
    while (rlPairs.length > 0){
      if(rlPairs[0].count > 9){
        retData = `${retData}9${rlPairs[0].char}`
        rlPairs[0].count = rlPairs[0].count-9
      }
      else{
        retData = `${retData}${rlPairs[0].count}${rlPairs[0].char}`
        rlPairs.splice(0,1)
      } 
    }
    ns.print(retData)
    return [retData]
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

export function lzDecompression(ns: NS, data: unknown): number | string[] | undefined {
  if (typeof data === 'string') {
    ns.print(data)
    const datArr = [...data]
    let ret = ""
    while (datArr.length > 0){
      //copy
      const count = parseInt(datArr.splice(0,1)[0])
      if(count !== 0)
      {
        ret = ret + datArr.splice(0,count).join('')
        if (datArr.length === 0) {
          break
        }
      }
      //ref
      const count2 = parseInt(datArr.splice(0,1)[0])
      if(count !==0){
        const pos = parseInt(datArr.splice(0,1)[0])
        for(let i = 0; i < count2;  i++){
          ret = ret + ret[ret.length - pos-1]
        }
      }
    }
    ns.print(ret)
    // return [ret]
  }
  throw new Error("Unexpected data types Unable to solve contract.");
}

export function lzCompression(ns: NS, data: unknown): number | string[] | undefined {
  if (typeof data === 'string') {
    const ret = ""
    ns.tprint(`${data} -> ${ret}`)
    // return [ret]
  }
  throw new Error("Unexpected data types Unable to solve contract."); 
}