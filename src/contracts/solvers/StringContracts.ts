import { unimplemented } from '/contracts/contractUtils';
// "Generate IP Addresses"

// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.

// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.

// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
export function GenerateIPAddresses(data:any):number|string[]|undefined{return unimplemented(data)}

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
export function SanitizeParentheses(data:any):number|string[]|undefined{return unimplemented(data)}

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
export function FindValidMathExpressions(data:any):number|string[]|undefined{return unimplemented(data)}
