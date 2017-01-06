import babel from 'rollup-plugin-babel';

export default {
  entry: '.tmp/index.js',
  dest: 'dist/array-repeat.js',
  format: 'iife', // common javascript,
  moduleName: 'ArrayRepeat',
  plugins: [babel({
      babelrc: false,
      plugins: ['transform-async-to-generator', 'external-helpers']
  })] // run babel
};
