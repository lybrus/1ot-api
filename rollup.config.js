import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/bundle.cjs.js',
            format: 'cjs'
        },
        {
            file: 'dist/bundle.esm.js',
            format: 'esm'
        }
    ],
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        commonjs(),
        resolve({ browser: false })
    ]
}
