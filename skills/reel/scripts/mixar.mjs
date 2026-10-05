#!/usr/bin/env node
/* Prepara a trilha: corta no tamanho do reel, nivela o volume e põe fade.
 *
 *   node mixar.mjs <musica.mp3>              # grava public/trilha.mp3 e liga no cenas.json
 *   node mixar.mjs <musica.mp3> --inicio 12  # começa a música no segundo 12
 *   node mixar.mjs --remover                 # tira a trilha do reel
 *   --projeto <pasta>                        # pasta do reel (padrão: a pasta atual)
 *
 * Com ffmpeg instalado, a música é nivelada (loudnorm) para que qualquer MP3 fique
 * no mesmo volume sob a voz. Sem ffmpeg, o arquivo é copiado como está.
 * O ducking (a música baixar quando há fala) acontece no próprio render, na composição.
 *
 * Use só música que você tem direito de usar: a sua, ou de biblioteca livre
 * (YouTube Audio Library, Pixabay Music) respeitando a licença de cada faixa. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerArgs, pastaProjeto, lerCenas, salvarCenas, validar, estimarTempos } from './_comum.mjs';

const args = lerArgs();
const projeto = pastaProjeto(args);
const falhar = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };

const { arq, dados } = lerCenas(projeto);

if (args.remover) {
  dados.trilha = null;
  salvarCenas(arq, dados);
  console.log('Trilha removida do cenas.json.');
  process.exit(0);
}

const erros = validar(dados);
if (erros.length) falhar(`cenas.json com problema:\n  - ${erros.join('\n  - ')}`);

const origem = args._[0] ? path.resolve(args._[0]) : null;
if (!origem || !fs.existsSync(origem)) falhar('Passe o caminho do MP3: node mixar.mjs <musica.mp3>');

// duração do reel: da narração, se houver; se não, a estimativa pela fala
let duracao;
const arqPalavras = dados.palavras ? path.join(projeto, 'public', dados.palavras) : null;
if (arqPalavras && fs.existsSync(arqPalavras)) duracao = JSON.parse(fs.readFileSync(arqPalavras, 'utf8')).duracao + 1.2;
else duracao = estimarTempos(dados.cenas).duracao;
duracao = Math.ceil(duracao * 10) / 10 + 0.5;

const destino = path.join(projeto, 'public', 'trilha.mp3');
fs.mkdirSync(path.dirname(destino), { recursive: true });
const temFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;

if (temFfmpeg) {
  const inicio = args.inicio ? Number(args.inicio) : 0;
  const fadeOut = Math.max(0, duracao - 1.5).toFixed(2);
  const r = spawnSync('ffmpeg', [
    '-v', 'error', '-y',
    '-stream_loop', '-1', '-ss', String(inicio), '-i', origem,
    '-t', String(duracao), '-vn',
    '-af', `loudnorm=I=-20:TP=-2:LRA=11,afade=t=in:d=0.4,afade=t=out:st=${fadeOut}:d=1.5`,
    '-ar', '44100', '-ac', '2', '-b:a', '192k', destino,
  ], { encoding: 'utf8' });
  if (r.status !== 0) falhar(`ffmpeg falhou: ${(r.stderr || '').slice(0, 300)}`);
  console.log(`Trilha pronta: ${destino} (${duracao.toFixed(1)} s, volume nivelado, fade de entrada e saída).`);
} else {
  fs.copyFileSync(origem, destino);
  console.log(`ffmpeg não encontrado: copiei a música como está para ${destino}.`);
  console.log('O volume vai depender de como a faixa foi masterizada; ajuste "volumeTrilha" no cenas.json se ficar alto.');
}

dados.trilha = 'trilha.mp3';
salvarCenas(arq, dados);
console.log('cenas.json atualizado (trilha). No render, a música baixa sozinha quando há voz.');
