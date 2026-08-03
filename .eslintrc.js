module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:jsdoc/recommended',
    'plugin:prettier/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Requiere documentación JSDoc en funciones, clases y métodos.
    'jsdoc/require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: true,
        FunctionExpression: true,
      },
      contexts: ['TSMethodSignature', 'TSFunctionDeclaration']
    }],
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns-description': 'off',
    // Agrega líneas en blanco entre declaraciones para mejorar la legibilidad.
    'padding-line-between-statements': 'off',
    '@typescript-eslint/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: ['function', 'class', 'interface', 'type'] },
      { blankLine: 'always', prev: ['function', 'class', 'interface', 'type'], next: '*' },
    ],
  },
};