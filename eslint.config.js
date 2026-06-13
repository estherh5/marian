// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    // Generated data and build output are not linted.
    ignores: ['dist/**', 'src/app/stocks.ts', 'src/app/symbols.ts'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.html'],
    // templateRecommended enforces Angular template best practices. The opt-in
    // templateAccessibility set is intentionally omitted so linting does not
    // force changes to the app's established interaction design.
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
