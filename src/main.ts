import { App } from './infrastructure/web/App';

async function main() {
  try {
    const app = new App();
    await app.start();
  } catch (error) {
    console.error('Error iniciando la aplicación:', error);
    process.exit(1);
  }
}

main();