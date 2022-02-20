import { unimplemented } from '/contracts/contractUtils';
// "Find Largest Prime Factor"

// Given a number, find its largest prime factor. A prime factor
// is a factor that is a prime number.
export function largestPrimeFactor(ns:NS,data:any):number|string[]|undefined{
    ns.tprintf(`${JSON.stringify(data)} type:${typeof data}`)
    let num: number = data
    let factor = 2
    do{
        while(num % factor == 0){
            num = num / factor
        }
        factor++
    }while(factor != num)
    ns.tprintf(`largest factor = ${factor}`)

    return factor
}

// "Subarray with Maximum Sum"

// Given an array of integers, find the contiguous subarray (containing
// at least one number) which has the largest sum and return that sum.
export function MaxSubArray(ns:NS,data:any):number|string[]|undefined{
    ns.print(`${JSON.stringify(data)} type:${typeof data}`)
    const numberArray: number[] = data
    ns.print(`${numberArray}`)

    let subArray: number[] = []
    let subArrayTotal = -Infinity
    for (let start = 0; start < numberArray.length; start++) {
        for (let length = 1; length < numberArray.length-start; length++) {
            const testSubArray = numberArray.slice(start,start+length)

            const testSubArrayTotal = testSubArray.reduce((prev,curr) =>{return prev+curr})
            ns.print(`${testSubArray}: ${testSubArrayTotal}`)
            
            if(testSubArrayTotal> subArrayTotal){
                subArray = testSubArray;
                subArrayTotal = testSubArrayTotal
            }
        }

    }
    ns.tprintf(`Best: ${subArray}: ${subArrayTotal}`)
    return subArrayTotal

}

// "Total Ways to Sum"

// Given a number, how many different ways can that number be written as
// a sum of at least two positive integers?
export function TotalSums(ns:NS,data:any):number|string[]|undefined{return unimplemented(data)}