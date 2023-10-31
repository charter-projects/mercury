const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const replace = require('@rollup/plugin-replace');
const bundleSize = require('rollup-plugin-bundle-size');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');

const NODE_ENV = process.env['NODE_ENV'] || 'development';
const output = {
  format: 'iife',
  sourcemap: NODE_ENV === 'development',
  // This will minify the wrapper code generated by rollup.
  compact: false,
  freeze: false,
  strict: false,
};
const uglifyOptions = {
  compress: {
    loops: false,
    keep_fargs: false,
    unsafe: true,
    pure_getters: true,
    keep_classnames: true
  },
};
const plugins = [
  resolve(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    ['import \'es6-promise/dist/es6-promise.auto\'']: (process.env.PATCH_PROMISE_POLYFILL === 'true' && process.env.MERCURYJS_ENGINE === 'jsc') ?
      'import \'es6-promise/dist/es6-promise.auto\';' : '',
    delimiters: ['', ''],
    preventAssignment: false
  }),
  bundleSize(),
];

module.exports = [
  {
    input: 'src/index.ts',
    output: Object.assign({ file: 'dist/main.js' }, output),
    plugins: [
      ...plugins,
      typescript(),
      NODE_ENV === 'development' ? null : terser(uglifyOptions),
    ],
    context: 'global'
  },
];
