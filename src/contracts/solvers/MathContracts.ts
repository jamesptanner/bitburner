import { NS } from '@ns'
// "Find Largest Prime Factor"

// Given a number, find its largest prime factor. A prime factor
// is a factor that is a prime number.
export function largestPrimeFactor(ns: NS, data: unknown): number | string[] | undefined {
    if (typeof data === 'number') {
        ns.print(`${JSON.stringify(data)} type:${typeof data}`)
        let num: number = data
        let factor = 2
        do {
            while (num % factor == 0) {
                num = num / factor
            }
            factor++
        } while (factor != num)
        ns.tprintf(`largest factor = ${factor}`)

        return factor
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Subarray with Maximum Sum"

// Given an array of integers, find the contiguous subarray (containing
// at least one number) which has the largest sum and return that sum.
export function MaxSubArray(ns: NS, data: unknown): number | string[] | undefined {
    if (Array.isArray(data) && data.every(val => { typeof val === 'number' })) {
        const numberArray: number[] = data
        ns.print(`${numberArray}`)

        let subArray: number[] = []
        let subArrayTotal = -Infinity
        for (let start = 0; start < numberArray.length; start++) {
            for (let length = 1; length <= numberArray.length - start; length++) {
                const testSubArray = numberArray.slice(start, start + length)

                const testSubArrayTotal = testSubArray.reduce((prev, curr) => { return prev + curr })
                ns.print(`${testSubArray}: ${testSubArrayTotal}`)

                if (testSubArrayTotal > subArrayTotal) {
                    subArray = testSubArray;
                    subArrayTotal = testSubArrayTotal
                }
            }

        }
        ns.tprintf(`Best: ${subArray}: ${subArrayTotal}`)
        return subArrayTotal
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Total Ways to Sum"

// Given a number, how many different ways can that number be written as
// a sum of at least two positive integers?
export function TotalSums(ns: NS, data: unknown): number | string[] | undefined {
    if (typeof data === 'number') {
        const value: number = data;
        // An array to store a partition
        const sums = new Array(value + 1);

        sums[0] = 1;
        sums.fill(0, 1)
        for (let i = 1; i < value; ++i) {
            for (let j = i; j <= value; ++j) {
                sums[j] += sums[j - i]
            }
        }

        //ns.tprintf(`${partitions}`)
        ns.tprintf(`total Sums: ${sums[value]}`)
        ns.tprintf(`total Sums: ${sums}`)

        return sums[value]
    }
    throw new Error("Unexpected data types Unable to solve contract.");

}

