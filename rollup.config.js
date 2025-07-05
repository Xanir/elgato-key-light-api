import typescript from '@rollup/plugin-typescript';

export default {
  input: 'code/backend/src/main.ts',
  output: {
    file: 'dist/backend.js',
    format: 'es'
  },
  plugins: [
    typescript({
      tsconfig: "code/backend/tsconfig.json"
    })
  ]
};