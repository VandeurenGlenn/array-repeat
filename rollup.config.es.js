import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  dest: 'dist/array-repeat.es.js',
  format: 'es',
  plugins: [ babel() ] //run babel
}
