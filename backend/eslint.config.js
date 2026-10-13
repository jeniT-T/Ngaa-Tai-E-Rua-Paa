// ESLint for the Express backend (CommonJS, Node 20).
// Run with: npm run lint   (CI runs the same command on every push and pull request)
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'uploads/', 'target/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // `const { password_hash, ...safeUser } = user` is how we strip a field
      // before sending a user to the browser, so an unused sibling is fine.
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // Jest injects describe/test/expect/jest as globals in the test files.
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
