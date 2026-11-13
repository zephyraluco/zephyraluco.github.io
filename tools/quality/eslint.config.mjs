// @ts-check
import tsParser from '@typescript-eslint/parser'
import eslintPluginAstro from 'eslint-plugin-astro'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.astro'],
    processor: 'astro/client-side-ts',
    languageOptions: { parserOptions: { parser: tsParser } }
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser }
  },
  // Ignore files
  {
    ignores: ['public/scripts/*', 'scripts/*', '.astro/', 'src/env.d.ts'],
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
    }
  }
])
