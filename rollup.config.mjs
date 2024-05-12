import * as fs from 'fs';
import glob from "glob"
import * as path from 'path'
import typescript from '@rollup/plugin-typescript';
// import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

/**
 * @type {import('rollup').RollupOptions}
 */
const config = [
];

function genConfig(file) {
    if (/main\s*\(\s*ns\s*:\s*NS\s*\)\s*/.test(fs.readFileSync(file, { encoding: 'utf8' }))) {
        console.log(file)
        //create list of additiona watch directories.
        const includes = ["src/shared/**","src/lib/**"]
        includes.push(`${path.dirname(file)}/**`)
        addApp(file,includes);
    }
}
function genJSConfig(file) {
    
    if (/main\(ns\)/.test(fs.readFileSync(file, { encoding: 'utf8' }))) {
        console.log(file)
        //create list of additiona watch directories.
        const includes = ["src/shared/**","src/lib/**"]
        includes.push(`${path.dirname(file)}/**`)
        config.push({
            input: file,
            output: {
                file: file.replace('src/', 'bundle/').replace('.ts', '.js').replace('.jsx','.js'),
                format: 'es',
                sourcemap: "inline",
                interop: 'esModule',
            },
            plugins: [
                commonjs(),
            ],
            watch: {
                include: includes,
            },
            // treeshake: 'smallest'
        });
    }
}


glob.sync(`src/**/*.*ts*`,).filter(path=>{return path.indexOf(".test.")===-1}).forEach(path => genConfig(path))
glob.sync(`src/**/*.*js*`,).filter(path=>{return path.indexOf(".test.")===-1}).forEach(path => genJSConfig(path))


function addApp(path,includes) {
    config.push({
        input: path,
        output: {
            file: path.replace('src/', 'bundle/').replace('.ts', '.js').replace('.jsx','.js'),
            format: 'es',
            sourcemap: "inline",
            interop: 'esModule',
        },
        plugins: [
            commonjs(),
            // nodeResolve(),
            typescript(),
        ],
        watch: {
            include: includes,
        },
        // treeshake: 'smallest'
    });
}
export default config;