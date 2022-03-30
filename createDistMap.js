const fs = require('fs')
const glob = require('glob')

const sourceDir = 'dist/public'
const packageDir = 'dist/package'

fs.mkdir('dist/package',function(){})

const fileMap = {}
glob.sync(`${sourceDir}/**/*.js`).forEach(path =>{
    if(path !== `${sourceDir}/bootstrap.js`){
        const genName = path.replace(`${sourceDir}/`,'').replaceAll("/","-",)
        fileMap[genName] = path.replace(sourceDir,'').substring(1)
        fs.copyFile(path,`${packageDir}/${genName}`,function(){})
    }
    else{
        fs.copyFile(path,`${packageDir}/bootstrap.js`,function(){})

    }
})
fs.writeFileSync(`${packageDir}/map.txt`,JSON.stringify(fileMap))