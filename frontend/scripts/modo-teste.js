// Sobe o app no navegador em MODO DE TESTE: sem backend, com dados de exemplo (src/services/mock-api.ts).
// Uso: npm run mock (na raiz ou na pasta frontend). Funciona em Windows, macOS e Linux.
const { spawn } = require('child_process');

const filho = spawn('npx', ['expo', 'start', '--web', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_MOCK: '1' },
});

filho.on('exit', (codigo) => process.exit(codigo ?? 0));
