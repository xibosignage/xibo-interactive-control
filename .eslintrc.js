module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['google'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    indent: ['error', 2, {SwitchCase: 1}],
    'quote-props': ['warn', 'as-needed'],
    'dot-location': ['warn', 'property'],
    'linebreak-style': [0, 'error', 'windows'],
  },
};
