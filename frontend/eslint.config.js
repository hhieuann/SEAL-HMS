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
      // Ships as an error in eslint-plugin-react-hooks v6, which bundles the React Compiler
      // rules. Every remaining hit is a page loading its data with
      // `useEffect(() => { load(); }, [])`, or a timer/polling interval — correct React, but
      // the compiler ruleset would rather see fetching moved to a data layer (React Query,
      // router loaders). This project deliberately has no such layer, so these are tracked
      // as tech debt (warnings) instead of blocking the lint gate.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
