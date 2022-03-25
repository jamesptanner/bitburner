import * as fs from 'fs';
import glob from "glob"
import * as path from 'path'
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
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
        const includes = ["src/shared/**"]
        includes.push(`${path.dirname(file)}/**`)
        addApp(file,includes);
    }
}


glob.sync(`src/**/*.*ts`,).forEach(path => genConfig(path))


function addApp(path,includes) {
    config.push({
        input: path,
        output: {
            file: path.replace('src/', 'dist/public/').replace('.ts', '.js'),
            format: 'esm',
            sourcemap: false,
            interop: 'esModule',
        },
        plugins: [
            commonjs(),
            nodeResolve(),
            typescript(),
        ],
        watch: {
            include: includes,
        },
        treeshake: 'smallest'
    });
}
export default config;