import { unimplemented } from '/contracts/contractUtils';
// "Generate IP Addresses"

// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.

// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.

// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
export function GenerateIPAddresses(ns:NS,data:any):number|string[]|undefined{

    ns.print(`${JSON.stringify(data)} type:${typeof data}`)
    const baseAddress: string = data
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const validAddresses: string[] = []
    for (let octalSize1 = 1; octalSize1 <= 3; octalSize1++) {
    for (let octalSize2 = 1; octalSize2 <= 3; octalSize2++) {
    for (let octalSize3 = 1; octalSize3 <= 3; octalSize3++) {
    for (let octalSize4 = 1; octalSize4 <= 3; octalSize4++) {
        let addressCopy = baseAddress
        let addrString = ""
        addrString = addressCopy.substring(0,octalSize1) + "."
        addressCopy = addressCopy.slice(octalSize1)
        addrString = addrString + addressCopy.substring(0,octalSize2) + "."
        addressCopy = addressCopy.slice(octalSize2)
        addrString = addrString + addressCopy.substring(0,octalSize3) + "."
        addressCopy = addressCopy.slice(octalSize3)
        addrString = addrString + addressCopy.substring(0,octalSize4) 
        addressCopy = addressCopy.slice(octalSize4)

        ns.print(`addr: ${addrString}, leftover string: ${addressCopy}`)
        if(addressCopy.length> 0){
            ns.print("invalid addr, leftover numbers")
            continue
        }
        if (ipv4Regex.test(addrString)){
            ns.print(`INFO valid address ${addrString}`)
            validAddresses.push(addrString)
        }
        else {
            ns.print(`ERROR invalid address ${addrString}`)
        }
    }
    }
    }
    }
    ns.tprintf(`INFO Valid Addresses ${validAddresses}`)
    return validAddresses;
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
export function SanitizeParentheses(ns:NS,data:any):number|string[]|undefined{return unimplemented(data)}

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
export function FindValidMathExpressions(ns:NS,data:any):number|string[]|undefined{return unimplemented(data)}
