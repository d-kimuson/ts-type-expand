/** @type {const} */
export const jsRules = {
  'no-console': 'warn',
  'import/order': [
    'error',
    {
      groups: [
        'builtin',
        'external',
        'type',
        'internal',
        'parent',
        'index',
        'sibling',
        'object',
        'unknown',
      ],
      pathGroups: [
        {
          pattern: '~/**',
          group: 'internal',
          position: 'before',
        },
      ],
      alphabetize: {
        order: 'asc',
      },
      'newlines-between': 'never',
    },
  ],
}

/** @type {const} */
export const tsRules = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      args: 'after-used',
    },
  ],
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': true,
      'ts-nocheck': 'allow-with-description',
      'ts-check': false,
      minimumDescriptionLength: 1,
    },
  ],
  '@typescript-eslint/prefer-ts-expect-error': 'error',
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/no-explicit-any': ['error'],
  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  '@typescript-eslint/method-signature-style': ['error', 'property'],
  '@typescript-eslint/prefer-for-of': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'error',
  '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
}
