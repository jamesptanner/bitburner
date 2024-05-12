import { copyFile, writeFileSync, mkdirSync } from 'fs'
import pkg from 'glob';
const { sync } = pkg;

const sourceDir = 'dist/bundle'
const packageDir = 'dist/package'

mkdirSync(packageDir)

const fileMap = {}
sync(`${sourceDir}/**/*.js`).forEach(path =>{
    if(path !== `${sourceDir}/bootstrap.js`){
        const genName = path.replace(`${sourceDir}/`,'').replaceAll("/","-",)
        fileMap[genName] = path.replace(sourceDir,'').substring(1)
        copyFile(path,`${packageDir}/${genName}`)
    }
    else{
        copyFile(path,`${packageDir}/bootstrap.js`)

    }
})
writeFileSync(`${packageDir}/map.txt`,JSON.stringify(fileMap))