import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  dest: 'dist/array-repeat.js',
  format: 'iife', //common javascript,
  moduleName: 'array-repeat',
  plugins: [ babel() ] //run babel
}
