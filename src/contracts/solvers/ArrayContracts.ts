import { NS } from '@ns';
import { is2DArray } from '/shared/utils';
import { logging } from '/shared/logging';
// "Spiralize Matrix"

// Given an array of array of numbers representing a 2D matrix, return the
// elements of that matrix in clockwise spiral order.

// Example: The spiral order of

// [1, 2, 3, 4]
// [5, 6, 7, 8]
// [9, 10, 11, 12]

// is [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
export function SpiralMatrix(ns: NS, data: unknown): number | string[] | undefined {
    if (is2DArray<number>(data, (val): val is number => { return typeof val === 'number' })) {
        logging.info(`${JSON.stringify(data)} type:${typeof data}`)
        const numberArray: number[][] = data
        const output: number[] = []
        let state = 0
        while (numberArray.length > 0) {
            switch (state % 4) {
                case 0: //top
                    {
                        const row = numberArray.shift()
                        if (row) {
                            output.push(...row)
                        }
                        break;
                    }
                case 1: //right
                    {
                        for (let row = 0; row < numberArray.length; row++) {
                            const val = numberArray[row].pop()
                            if (val) {
                                output.push(val)
                            }
                        }
                        break;
                    }
                case 2: //bottom
                    {
                        const row = numberArray.pop()
                        if (row) {
                            output.push(...(row.reverse()))
                        }
                        break;
                    }
                case 3: //left
                    {
                        for (let row = numberArray.length - 1; row >= 0; row--) {
                            const val = numberArray[row].shift()
                            if (val) {
                                output.push(val)
                            }
                        }
                        break;
                    }
            }
            state++
        }
        //may have undefined entries which we can remove.
        logging.success(`SpiralMatrix Result: ${JSON.stringify(output.filter(x => x))}`)
        return output.filter(x => x).map<string>(x => x.toString())
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Array Jumping Game"

// You are given an array of integers where each element represents the
// maximum possible jump distance from that position. For example, if you
// are at position i and your maximum jump length is n, then you can jump
// to any position from i to i+n.

// Assuming you are initially positioned at the start of the array, determine
// whether you are able to reach the last index of the array.
export function ArrayJump(ns: NS, data: unknown): number | string[] | undefined {
    if(Array.isArray(data) && data.every(val => typeof val === 'number')){
        logging.info(`${JSON.stringify(data)} type:${typeof data}`)
    const numberArray: number[] = data

    const result = checkPosition(ns, numberArray, 0,0)
    logging.success(`${result}`)
    if (result) {
        return 1
    }
    return 0
}
throw new Error("Unexpected data types Unable to solve contract.");
}

// "Array Jumping Game II"

// You are given the following array of integers:

// 4,3,7,5

// Each element in the array represents your MAXIMUM jump length at that position. 
// This means that if you are at position i and your maximum jump length is n, you 
// can jump to any position from i to i+n.

// Assuming you are initially positioned at the start of the array, determine the 
// minimum number of jumps to reach the end of the array.

// If it's impossible to reach the end, then the answer should be 0.
export function ArrayJump2(ns: NS, data: unknown): number | string[] | undefined {
    if(Array.isArray(data) && data.every(val => typeof val === 'number')){
    logging.info(`${JSON.stringify(data)} type:${typeof data}`)
    const numberArray: number[] = data

    const [result, minHops]= checkPosition(ns, numberArray, 0,0)
    logging.success(`${result}`)
    if (result) {
        return minHops
    }
    return 0
}
throw new Error("Unexpected data types Unable to solve contract.");
}

function checkPosition(ns: NS, array: number[], pos: number,depth:number): [boolean,number] {
    //logging.info(`${array}: checking position ${pos}`)
    if (pos === array.length - 1) return [true,depth]
    let minHops = array.length
    let ret = false;
    for (let jumpDist = 1; jumpDist <= array[pos]; jumpDist++) {
        //logging.info(`Jumping ${jumpDist}`)
        const [reachedEnd, hops] = checkPosition(ns, array, pos + jumpDist,depth+1)
        if (reachedEnd) {
            minHops = Math.min(minHops,hops)
            ret = true
        }
    }
    if(minHops === depth) logging.success(`${[ret,minHops]}`);
    return [ret,minHops];
}

// "Merge Overlapping Intervals"

// Given an array of intervals, merge all overlapping intervals. An interval
// is an array with two numbers, where the first number is always less than
// the second (e.g. [1, 5]).

// The intervals must be returned in ASCENDING order.

// Example:
// [[1, 3], [8, 10], [2, 6], [10, 16]]
// merges into [[1, 6], [8, 16]]
export function MergeOverlapping(ns: NS, data: unknown): number | string[] | undefined {
    if (is2DArray<number>(data, (val): val is number => { return typeof val === 'number' })) {
        const numberArray: number[][] = data

        numberArray.sort((a, b) => a[0] - b[0])
        logging.info(`${JSON.stringify(numberArray)}`)

        for (let i = 0; i < numberArray.length - 1; i++) {
            if (numberArray[i][1] >= numberArray[i + 1][0]) {
                const newElement = [numberArray[i][0], Math.max(numberArray[i + 1][1], numberArray[i][1])]
                numberArray.splice(i, 2, newElement)
                logging.info(`${JSON.stringify(numberArray)}`)
                i--
            }
        }

        logging.success(`${JSON.stringify((numberArray.length !== 1) ? numberArray : numberArray[0])}`)
        return [JSON.stringify((numberArray.length !== 1) ? numberArray : numberArray[0])]
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}