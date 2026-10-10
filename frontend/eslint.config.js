import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // These two are stricter-than-classic React rules. Our data-fetching
      // hooks (useArrivalAccess, useGuestBookingAccess, useMyActiveBooking,
      // useBookingAvailability, useGenericGuestAccess, ArrivalGuideView)
      // deliberately reset state at the top of an effect and are tested by
      // hand, so rewriting them to satisfy the rule risks behaviour changes.
      // Revisit when there's time for a proper refactor.
      'react-hooks/set-state-in-effect': 'off',
      // Context files legitimately export both a Provider and its hook.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
