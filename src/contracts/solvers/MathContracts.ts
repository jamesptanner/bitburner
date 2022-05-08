import { NS } from '@ns'
import { logging } from '/shared/logging'
// "Find Largest Prime Factor"

// Given a number, find its largest prime factor. A prime factor
// is a factor that is a prime number.
export function largestPrimeFactor(ns: NS, data: unknown): number | string[] | undefined {
    if (typeof data === 'number') {
        logging.info(`${JSON.stringify(data)} type:${typeof data}`)
        let num: number = data
        let factor = 2
        do {
            while (num % factor == 0) {
                num = num / factor
            }
            factor++
        } while (factor != num)
        logging.success(`largest factor = ${factor}`)

        return factor
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Subarray with Maximum Sum"

// Given an array of integers, find the contiguous subarray (containing
// at least one number) which has the largest sum and return that sum.
export function MaxSubArray(ns: NS, data: unknown): number | string[] | undefined {
    if (Array.isArray(data) && data.every(val => { return typeof val === 'number' })) {
        const numberArray: number[] = data
        logging.info(`${numberArray}`)

        let subArray: number[] = []
        let subArrayTotal = -Infinity
        for (let start = 0; start < numberArray.length; start++) {
            for (let length = 1; length <= numberArray.length - start; length++) {
                const testSubArray = numberArray.slice(start, start + length)

                const testSubArrayTotal = testSubArray.reduce((prev, curr) => { return prev + curr })
                logging.info(`${testSubArray}: ${testSubArrayTotal}`)

                if (testSubArrayTotal > subArrayTotal) {
                    subArray = testSubArray;
                    subArrayTotal = testSubArrayTotal
                }
            }

        }
        logging.success(`Best: ${subArray}: ${subArrayTotal}`)
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
        logging.success(`total Sums: ${sums[value]}`)

        return sums[value]
    }
    throw new Error("Unexpected data types Unable to solve contract.");

}

// "Total Ways to Sum"

//How many different distinct ways can the number 31 be written as a sum of integers contained in the set:
// [2,3,4,5,6,8,9,10]?

// You may use each integer in the set zero or more times.
export function TotalSums2(ns: NS, data: unknown): number | string[] | undefined {
    if (Array.isArray(data) &&
      typeof data[0] === 'number' &&
      Array.isArray(data[1]) &&
      data[1].every(val => { return typeof val === 'number' })) {
        const set: number[] = data[1];
        const value = data[0]
        logging.info(`total Sums2: target ${value}, set:${set.join()}`)
        

        // An array to store a partition
        const sums = new Array(value + 1);
        sums.fill(0, 0)
        sums[0] = 1

        for (let i =0; i <= sums.length; ++i) {
            for(let j = set[i]; j<= value;j++){
                sums[j] += sums[j-set[i]]
            }
        }

        logging.info(`${partitions}`)
        logging.success(`total Sums: ${sums[value]}`)
        logging.success(`total Sums: ${sums}`)

        return sums[value]
    }
    throw new Error("Unexpected data types Unable to solve contract.");

}