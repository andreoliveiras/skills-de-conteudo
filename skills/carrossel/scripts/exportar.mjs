#!/usr/bin/env node
// Exporta cada slide de um carrossel HTML como PNG 1080x1350 (formato de feed do Instagram).
//
// Uso:
//   node exportar.mjs carrossel.html [pasta-de-saida] [--seletor ".slide"] [--escala 1]
//
// Cada elemento que casar com o seletor (padrão: .slide) vira um arquivo slide-01.png, slide-02.png...
// Requer o pacote "playwright" instalado na pasta de trabalho (npm i playwright).
// Usa o Chromium do Playwright; se ele não estiver baixado, tenta o Google Chrome instalado no computador.

import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';

const LARGURA = 1080;
const ALTURA = 1350;

function lerArgumentos(argv) {
  const posicionais = [];
  const opcoes = { seletor: '.slide', escala: 1 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--seletor') opcoes.seletor = argv[++i];
    else if (argv[i] === '--escala') opcoes.escala = Number(argv[++i]) || 1;
    else posicionais.push(argv[i]);
  }
  return { arquivo: posicionais[0], saida: posicionais[1] || 'out', ...opcoes };
}

const { arquivo, saida, seletor, escala } = lerArgumentos(process.argv.slice(2));

if (!arquivo) {
  console.error('Uso: node exportar.mjs carrossel.html [pasta-de-saida] [--seletor ".slide"] [--escala 1]');
  process.exit(1);
}
if (!existsSync(arquivo)) {
  console.error(`Arquivo não encontrado: ${arquivo}`);
  process.exit(1);
}

// O Playwright é procurado primeiro na pasta de onde você roda o comando (onde você fez npm i playwright),
// e só depois ao lado deste script.
let chromium;
try {
  let alvo = 'playwright';
  try {
    alvo = pathToFileURL(createRequire(join(process.cwd(), 'x.js')).resolve('playwright')).href;
  } catch { /* cai no import padrão */ }
  const modulo = await import(alvo);
  chromium = modulo.chromium ?? modulo.default.chromium;
} catch {
  console.error('O pacote "playwright" não está instalado aqui.');
  console.error('Rode na pasta de trabalho:  npm i playwright && npx playwright install chromium');
  process.exit(1);
}

async function abrirNavegador() {
  try {
    return await chromium.launch();
  } catch {
    // Chromium do Playwright não baixado: tenta o Chrome do sistema.
    try {
      return await chromium.launch({ channel: 'chrome' });
    } catch (erro) {
      console.error('Não consegui abrir um navegador.');
      console.error(String(erro.message).split('\n')[0]);
      console.error('Rode:  npx playwright install chromium   (ou instale o Google Chrome)');
      process.exit(1);
    }
  }
}

const navegador = await abrirNavegador();
const pagina = await navegador.newPage({
  viewport: { width: LARGURA, height: ALTURA },
  deviceScaleFactor: escala,
});

await pagina.goto(pathToFileURL(resolve(arquivo)).href, { waitUntil: 'networkidle' });
await pagina.evaluate(() => document.fonts.ready);

const slides = await pagina.locator(seletor).all();
if (slides.length === 0) {
  console.error(`Nenhum elemento encontrado com o seletor "${seletor}".`);
  await navegador.close();
  process.exit(1);
}

const pastaSaida = resolve(saida);
mkdirSync(pastaSaida, { recursive: true });

for (let i = 0; i < slides.length; i++) {
  const nome = `slide-${String(i + 1).padStart(2, '0')}.png`;
  await slides[i].screenshot({ path: join(pastaSaida, nome) });
  console.log(`ok  ${nome}`);
}

await navegador.close();
console.log(`\n${slides.length} slide(s) exportado(s) em ${pastaSaida}`);
