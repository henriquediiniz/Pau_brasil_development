import nextVitals from 'eslint-config-next/core-web-vitals'

// ESLint 9 (flat config). Substitui .eslintrc.json/.eslintignore; o `next lint` saiu no Next 16.
const config = [
  ...nextVitals,
  {
    // Regras novas do React Compiler (eslint-config-next 16) entram como aviso por enquanto:
    // o código existente segue padrões que funcionam (buscar dados num effect, "ref com o
    // valor mais recente", Date.now() para "há X dias"). Converter é rodada própria —
    // a barra lateral do portal (static-components) é a primeira candidata.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'public/**', 'next-env.d.ts'],
  },
]

export default config
