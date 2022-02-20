import { unimplemented } from '/contracts/contractUtils';
// "Spiralize Matrix"

// Given an array of array of numbers representing a 2D matrix, return the
// elements of that matrix in clockwise spiral order.

// Example: The spiral order of

// [1, 2, 3, 4]
// [5, 6, 7, 8]
// [9, 10, 11, 12]

// is [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
export function SpiralMatrix(ns:NS,data:any):number|string[]|undefined{

    ns.print(`${JSON.stringify(data)} type:${typeof data}`)
    const numberArray: number[][] = data
    const output: number[] = []
    let state = 0
    while (numberArray.length> 0)
    {
        switch(state%4){
        case 0: //top
            output.push(...numberArray.shift())
            break;
        case 1: //right
            for (let row = 0; row < numberArray.length; row++) {
                output.push(numberArray[row].pop())
            }
            break;
        case 2: //bottom
            output.push(...(numberArray.pop().reverse()))
            break;
        case 3: //left
            for (let row = numberArray.length-1; row>= 0 ; row--) {
                output.push(numberArray[row].shift())
            }
            break;
    }
        state++
    }
    //may have undefined entries which we can remove.
    ns.tprintf(`SpiralMatrix Result: ${JSON.stringify(output.filter(x=> x))}`)
    return JSON.stringify(output.filter(x=> x))
}

// "Array Jumping Game"

// You are given an array of integers where each element represents the
// maximum possible jump distance from that position. For example, if you
// are at position i and your maximum jump length is n, then you can jump
// to any position from i to i+n.

// Assuming you are initially positioned at the start of the array, determine
// whether you are able to reach the last index of the array.
export function ArrayJump(ns:NS,data:any):number|string[]|undefined{return unimplemented(data)}

// "Merge Overlapping Intervals"

// Given an array of intervals, merge all overlapping intervals. An interval
// is an array with two numbers, where the first number is always less than
// the second (e.g. [1, 5]).

// The intervals must be returned in ASCENDING order.

// Example:
// [[1, 3], [8, 10], [2, 6], [10, 16]]
// merges into [[1, 6], [8, 16]]
export function MergeOverlapping(ns:NS,data:any):number|string[]|undefined{return unimplemented(data)}