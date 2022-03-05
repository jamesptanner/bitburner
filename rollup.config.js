import * as fs from 'fs';
import glob from "glob"
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

const config = [
];

function genConfig(file) {
    console.log(file)
    if (/main\s*\(\s*ns\s*:\s*NS\s*\)\s*/.test(fs.readFileSync(file, { encoding: 'utf8' }))) {
        addApp(file);
    }
    else {
        console.log(`Skipping ${file}`)
    }
}


glob.sync(`src/**/*.*ts`,).forEach(path => genConfig(path))


function addApp(path) {
    config.push({
        input: path,
        output: {
            file: path.replace('src/', 'dist/public/').replace('.ts', '.js'),
            format: 'esm',
            sourcemap: false,
        },
        plugins: [
            typescript(),
            nodeResolve()
        ],
        watch: {
            include: 'src/**'
        },
        treeshake: 'recommended'
    });
}
export default config;