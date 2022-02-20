import { unimplemented } from '/contracts/contractUtils';
// "Minimum Path Sum in a Triangle"

// You are given a 2D array of numbers (array of array of numbers) that represents a
// triangle (the first array has one element, and each array has one more element than
// the one before it, forming a triangle). Find the minimum path sum from the top to the
// bottom of the triangle. In each step of the path, you may only move to adjacent
// numbers in the row below.
export function MinTrianglePath(ns: NS, data: any): number | string[] | undefined {
    ns.tprintf(`${JSON.stringify(data)} type:${typeof data}`);
    const numberArray = data;

    for (let row = 1; row < numberArray.length; row++) {
        for (let col = 1; col < numberArray[row].length; col++) {

            if (col === 0) {
                numberArray[row][col] += numberArray[row - 1][col]
            }
            else if (col === numberArray[row].length - 1) {
                numberArray[row][col] += numberArray[row - 1][col - 1]
            }
            else {
                numberArray[row][col] += Math.min(numberArray[row - 1][col], numberArray[row - 1][col - 1])
            }
        }
    }
    return Math.min(...numberArray[numberArray.length - 1]);
}

// "Unique Paths in a Grid I"

// You are given an array with two numbers: [m, n]. These numbers represent a
// m x n grid. Assume you are initially positioned in the top-left corner of that
// grid and that you are trying to reach the bottom-right corner. On each step,
// you may only move down or to the right.

// Determine how many unique paths there are from start to finish.
export function UniquePath1(ns: NS, data: any): number | string[] | undefined {
    ns.tprintf(`${JSON.stringify(data)} type:${typeof data}`)
    const maxX: number = data[0]
    const maxY: number = data[1]

    const map: number[][] = []

    for (let x = 0; x < maxX; x++) {
        map[x] = []
        for (let y = 0; y < maxY; y++) {
            if (x == 0 || y == 0) {
                map[x][y] = 1
            }
            map[x][y] = map[x - 1][y] + map[x][y - 1];
        }
    }
    ns.tprintf(`paths: ${map[maxX - 1][maxY - 1]}`)
    return map[maxX - 1][maxY - 1]
}


// "Unique Paths in a Grid II"

// You are given a 2D array of numbers (array of array of numbers) representing
// a grid. The 2D array contains 1’s and 0’s, where 1 represents an obstacle and
// 0 represents a free space.

// Assume you are initially positioned in top-left corner of that grid and that you
// are trying to reach the bottom-right corner. In each step, you may only move down
// or to the right. Furthermore, you cannot move onto spaces which have obstacles.

// Determine how many unique paths there are from start to finish.
export function UniquePath2(ns: NS, data: any): number | string[] | undefined { return unimplemented(data) }
