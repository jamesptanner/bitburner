import { NS } from '@ns';
import { is2DArray } from '/shared/utils';
import { logging } from '/shared/logging';
// "Minimum Path Sum in a Triangle"

// You are given a 2D array of numbers (array of array of numbers) that represents a
// triangle (the first array has one element, and each array has one more element than
// the one before it, forming a triangle). Find the minimum path sum from the top to the
// bottom of the triangle. In each step of the path, you may only move to adjacent
// numbers in the row below.
export function MinTrianglePath(ns: NS, data: unknown): number | string[] | undefined {

    if (is2DArray<number>(data, (val: unknown): val is number => { return typeof val === 'number' })) {
        const numberArray: number[][] = data;

        for (let row = 1; row < numberArray.length; row++) {
            for (let col = 0; col < numberArray[row].length; col++) {

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
        logging.info(`${JSON.stringify(numberArray)}`)
        logging.success(`MinPath: ${Math.min(...numberArray[numberArray.length - 1])}`)

        return Math.min(...numberArray[numberArray.length - 1]);
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Unique Paths in a Grid I"

// You are given an array with two numbers: [m, n]. These numbers represent a
// m x n grid. Assume you are initially positioned in the top-left corner of that
// grid and that you are trying to reach the bottom-right corner. On each step,
// you may only move down or to the right.

// Determine how many unique paths there are from start to finish.
export function UniquePath1(ns: NS, data: unknown): number | string[] | undefined {

    if (Array.isArray(data) && data.every(v => typeof v === 'number')) {
        const maxX: number = data[0]
        const maxY: number = data[1]

        const map: number[][] = []

        for (let x = 0; x < maxX; x++) {
            map[x] = []
            for (let y = 0; y < maxY; y++) {
                if (x === 0 || y === 0) {
                    map[x][y] = 1
                }
                else {
                    map[x][y] = map[x - 1][y] + map[x][y - 1];
                }
            }
        }
        logging.success(`paths: ${map[maxX - 1][maxY - 1]}`)
        return map[maxX - 1][maxY - 1]
    }
    throw new Error("Unexpected data types Unable to solve contract.");

}


// "Unique Paths in a Grid II"

// You are given a 2D array of numbers (array of array of numbers) representing
// a grid. The 2D array contains 1’s and 0’s, where 1 represents an obstacle and
// 0 represents a free space.

// Assume you are initially positioned in top-left corner of that grid and that you
// are trying to reach the bottom-right corner. In each step, you may only move down
// or to the right. Furthermore, you cannot move onto spaces which have obstacles.

// Determine how many unique paths there are from start to finish.
export function UniquePath2(ns: NS, data: unknown): number | string[] | undefined {
    if (is2DArray<number>(data, (val: unknown): val is number => { return typeof val === 'number' })) {

        const maxX: number = data.length
        const maxY: number = data[0].length

        const map: number[][] = data

        for (let x = 0; x < maxX; x++) {
            for (let y = 0; y < maxY; y++) {
                if (map[x][y] === 1) {
                    map[x][y] = 0
                }
                else {
                    if (x === 0 && y === 0) {
                        map[x][y] = 1
                    }
                    else if (x === 0 || y === 0) {
                        if (x > 0) {
                            map[x][y] = map[x - 1][y] === 0 ? 0 : 1
                        }
                        else if (y > 0) {
                            map[x][y] = map[x][y - 1] === 0 ? 0 : 1
                        }
                    }
                    else {
                        map[x][y] = map[x - 1][y] + map[x][y - 1];
                    }
                }
            }
        }
        logging.info(`${JSON.stringify(map)} type:${typeof data}`)
        logging.success(`paths with obstacles : ${map[maxX - 1][maxY - 1]}`)
        return map[maxX - 1][maxY - 1]
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}


export function ShortestPath(ns: NS, data: unknown): number | string[] | undefined {
    type node = {
        position: {
            x: number,
            y: number
        }
        minDist: number
        minDistDir: 'N'|'S'|'E'|'W'|'1'|'U'
        obstacle:boolean
    }

    if (is2DArray<number>(data, (val: unknown): val is number => { return typeof val === 'number' })) {

        const maxX: number = data.length
        const maxY: number = data[0].length

        const originalMap: number[][] = data
        const nodes: node[] = []
        const processedNodes: node [][] = new Array<node[]>(maxX)
        const firstNode:node = {
            position: {
                x : 0,
                y : 0
            },
            minDist: 0,
            obstacle: originalMap[0][0] ===1,
            minDistDir: 'U'
        
            
        }
        nodes.push(firstNode)

        while(nodes.length>0){
            const node = nodes.pop() as node

            processedNodes[node.position.x][node.position.y] = node
            let north = processedNodes[node.position.x][node.position.y-1] 
            let south = processedNodes[node.position.x][node.position.y+1] 
            let east = processedNodes[node.position.x+1][node.position.y] 
            let west = processedNodes[node.position.x-1][node.position.y] 

            if(north===undefined && node.position.y - 1 >= 0){
                north = {
                    position: {
                        x: node.position.x,
                        y: node.position.y - 1
                    },
                    minDist: 0,
                    obstacle: originalMap[node.position.x][node.position.y - 1] ===1,
                    minDistDir: 'U'
                    
                    
                }
            }

            if(south===undefined && node.position.y + 1 <= maxY){
                south = {
                    position: {
                        x: node.position.x,
                        y: node.position.y + 1
                    },
                    minDist: 0,
                    obstacle: originalMap[node.position.x][node.position.y + 1] ===1,
                    minDistDir: 'U'
                
                    
                }
            }

            if(west === undefined && node.position.x - 1 >=0){
                west = {
                    position: {
                        x: node.position.x-1,
                        y: node.position.y 
                    },
                    minDist: 0,
                    obstacle: originalMap[node.position.x-1][node.position.y] ===1,
                    minDistDir: 'U'
                
                    
                }
            }
            
            if(east === undefined && node.position.x + 1 >=maxX){
                east = {
                    position: {
                        x: node.position.x+1,
                        y: node.position.y 
                    },
                    minDist: 0,
                    obstacle: originalMap[node.position.x+1][node.position.y] ===1,
                    minDistDir: 'U'
                
                    
                }
            }
        }


        logging.info(`${JSON.stringify(originalMap)} type:${typeof data}`)
        logging.info(`paths with obstacles : ${originalMap[maxX - 1][maxY - 1]}`)
        // return map[maxX - 1][maxY - 1]
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}


export function colorGraph(ns: NS, data: unknown): number | string[] | undefined {
    if (Array.isArray(data) && typeof data[0] === 'number' && is2DArray<number>(data[1], (val: unknown): val is number => { return typeof val === 'number' })) {
        const nodeCount = data[0] 
        const edges = (data[1] ).sort((a,b)=>{ return a[0] - b[0] })
        const out = new Array(nodeCount)
        out.fill(-1,0)
        //start with vertex 0 
        out[0] = 0
        logging.info(`${edges}`)
        let count = 0
        while(out.some(v =>{return v === -1})&&count < 10){
            for (let index = 0; index < out.length; index++) {
                const matchingEdges = edges.filter(v =>{return v[0]=== index})
                if(out[index]===-1){
                    //do we have a value for any of the opposite?
                    const usableEdges = matchingEdges.filter(v=>{return v[1]!==-1})
                    if(usableEdges.length>=1) 
                    { 
                        out[index] = out[usableEdges[0][1]] === 1 ? 0 : 1
                    }
                    else {
                        continue;
                    }
                }

                if(matchingEdges.some(edge =>{ return out[index] === out[edge[1]] }))
                {
                    return []
                    throw new Error("Going to clash."); 
                }
                matchingEdges.forEach(edge =>{ out[edge[1]] = (out[index] === 1) ? 0:1 })
                logging.info(`i:${index} out: ${out}`)
            }
            count++
        }
        logging.success(`out: ${out}`)
        return out
    }
throw new Error("Unexpected data types Unable to solve contract.");
}