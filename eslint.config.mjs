import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const sharedTypeScriptRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
}

export default [
  // Next.js rules — apps/web only
  ...compat.extends('next/core-web-vitals', 'next/typescript').map((config) => ({
    ...config,
    files: ['apps/web/**/*.{ts,tsx}'],
  })),

  // TypeScript rules — all packages
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    plugins: { '@typescript-eslint': tseslint },
    languageOptions: { parser: tsparser },
    rules: sharedTypeScriptRules,
  },

  // TypeScript rules — apps/web (merged on top of Next.js rules)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: sharedTypeScriptRules,
  },

  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
    ],
  },
]
