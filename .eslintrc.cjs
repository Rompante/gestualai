module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // API backend (Node) — sem React, com globais de Node.
      files: ['server/**/*.js'],
      env: { node: true, browser: false },
      extends: ['eslint:recommended'],
      rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$|^req$|^res$' }],
      },
    },
  ],
}
