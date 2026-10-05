#!/usr/bin/env node
/* Gera a narração do reel com a ElevenLabs e o tempo de cada palavra.
 *
 *   node narrar.mjs --simular              # não chama a API: valida o cenas.json e mostra o custo
 *   node narrar.mjs                        # gera public/narracao.mp3 e public/palavras.json
 *   node narrar.mjs --voz <voice_id>       # escolhe a voz (ou ELEVENLABS_VOICE_ID no .env)
 *   node narrar.mjs --velocidade 1.08      # 0.7 a 1.2 (padrão 1.0)
 *   node narrar.mjs --vozes                # lista as vozes da sua conta
 *   node narrar.mjs --vozes-pt             # busca vozes em português do Brasil na biblioteca pública
 *   --projeto <pasta>                      # pasta do reel (padrão: a pasta atual)
 *
 * A chave vem de ELEVENLABS_API_KEY (ambiente ou .env da pasta do reel) e nunca é impressa.
 * O texto inteiro vai numa chamada só, para a fala sair contínua, sem frase picada;
 * os tempos por caractere que a API devolve viram o tempo de cada palavra e de cada cena. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { lerArgs, pastaProjeto, lerCenas, salvarCenas, lerSegredo, validar } from './_comum.mjs';

const API = 'https://api.elevenlabs.io';
// "Sarah": voz pré-pronta, presente em toda conta, fala português pelo modelo multilíngue.
// O sotaque não é nativo: para pt-BR de verdade, escolha uma voz com --vozes-pt.
const VOZ_PADRAO = 'EXAVITQu4vr4xnSDxMaL';
const MODELO_PADRAO = 'eleven_multilingual_v2';

const args = lerArgs();
const projeto = pastaProjeto(args);

const falhar = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };

const chaveOuFalha = () => {
  const k = lerSegredo('ELEVENLABS_API_KEY', projeto);
  if (!k) falhar('Sem ELEVENLABS_API_KEY no ambiente nem no .env da pasta do reel. Sem chave, o reel sai sem voz (só legenda e trilha).');
  return k;
};

const pedir = async (url, init = {}) => {
  const r = await fetch(url, init);
  if (!r.ok) {
    const corpo = (await r.text()).slice(0, 300);
    const dica = r.status === 401 ? ' (chave inválida ou sem permissão)' : r.status === 404 ? ' (voz não encontrada: vozes da biblioteca precisam ser adicionadas à sua conta antes)' : '';
    falhar(`ElevenLabs respondeu ${r.status}${dica}: ${corpo}`);
  }
  return r;
};

if (args.vozes) {
  const r = await pedir(`${API}/v1/voices`, { headers: { 'xi-api-key': chaveOuFalha() } });
  const { voices } = await r.json();
  for (const v of voices) {
    const l = v.labels ?? {};
    console.log(`${v.voice_id}  ${v.name}  [${v.category}] ${[l.gender, l.accent, l.language].filter(Boolean).join(', ')}`);
  }
  process.exit(0);
}

if (args['vozes-pt']) {
  const q = new URLSearchParams({ page_size: '20', language: 'pt', accent: 'brazilian', sort: 'trending' });
  const r = await pedir(`${API}/v1/shared-voices?${q}`, { headers: { 'xi-api-key': chaveOuFalha() } });
  const { voices } = await r.json();
  if (!voices?.length) console.log('Nenhuma voz encontrada com esse filtro.');
  for (const v of voices ?? []) {
    console.log(`${v.voice_id}  ${v.name}  (${[v.gender, v.age, v.accent].filter(Boolean).join(', ')})  ${String(v.description ?? '').slice(0, 70)}`);
  }
  console.log('\nPara usar uma delas: adicione a voz à sua conta na Voice Library do site (botão "Add to my voices")');
  console.log('e passe o id com --voz <id> ou ELEVENLABS_VOICE_ID no .env.');
  process.exit(0);
}

// ---------- narração ----------
const { arq, dados } = lerCenas(projeto);
const erros = validar(dados);
if (erros.length) falhar(`cenas.json com problema:\n  - ${erros.join('\n  - ')}`);

const falas = dados.cenas.map((c) => c.fala.trim().replace(/\s+/g, ' '));
const texto = falas.join(' ');
const voz = (typeof args.voz === 'string' && args.voz) || lerSegredo('ELEVENLABS_VOICE_ID', projeto) || VOZ_PADRAO;
const modelo = (typeof args.modelo === 'string' && args.modelo) || MODELO_PADRAO;
const velocidade = args.velocidade ? Number(args.velocidade) : 1.0;
if (!(velocidade >= 0.7 && velocidade <= 1.2)) falhar('--velocidade vai de 0.7 a 1.2.');
const hash = crypto.createHash('sha1').update([voz, modelo, velocidade, texto].join('|')).digest('hex').slice(0, 12);

const nPalavras = texto.split(' ').length;
if (args.simular) {
  const temChave = Boolean(lerSegredo('ELEVENLABS_API_KEY', projeto));
  console.log('Simulação (nada foi enviado à ElevenLabs):');
  console.log(`  cenas: ${dados.cenas.length}`);
  console.log(`  palavras: ${nPalavras}  (≈ ${(nPalavras / 2.9).toFixed(0)} s de fala)`);
  console.log(`  caracteres: ${texto.length}  (≈ créditos que a geração consome)`);
  console.log(`  voz: ${voz}${voz === VOZ_PADRAO ? ' (padrão, sotaque não nativo)' : ''}  modelo: ${modelo}  velocidade: ${velocidade}`);
  console.log(`  chave ElevenLabs: ${temChave ? 'encontrada' : 'NÃO encontrada (o reel sairia sem voz)'}`);
  console.log(`  sairia em: ${path.join(projeto, 'public/narracao.mp3')} e public/palavras.json`);
  process.exit(0);
}

const publico = path.join(projeto, 'public');
fs.mkdirSync(publico, { recursive: true });
const arqAudio = path.join(publico, 'narracao.mp3');
const arqPalavras = path.join(publico, 'palavras.json');

if (fs.existsSync(arqAudio) && fs.existsSync(arqPalavras) && !args.refazer) {
  try {
    if (JSON.parse(fs.readFileSync(arqPalavras, 'utf8')).hash === hash) {
      console.log('Narração já gerada para este texto e esta voz (nenhum crédito gasto). Use --refazer para gerar outra tomada.');
      process.exit(0);
    }
  } catch { /* gera de novo */ }
}

const r = await pedir(`${API}/v1/text-to-speech/${encodeURIComponent(voz)}/with-timestamps?output_format=mp3_44100_128`, {
  method: 'POST',
  headers: { 'xi-api-key': chaveOuFalha(), 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: texto,
    model_id: modelo,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true, speed: velocidade },
  }),
});
const resp = await r.json();
const al = resp.alignment ?? resp.normalized_alignment;
if (!resp.audio_base64 || !al?.characters?.length) falhar('A resposta veio sem áudio ou sem tempos por caractere.');

// limites de cada cena dentro do texto corrido
const inicioCena = [];
let pos = 0;
falas.forEach((f) => { inicioCena.push(pos); pos += f.length + 1; });
const cenaDoChar = (i) => { let c = 0; while (c + 1 < inicioCena.length && i >= inicioCena[c + 1]) c++; return c; };

// caracteres → palavras (os índices batem com `texto` porque usamos o alinhamento original)
const palavras = [];
let atual = null;
al.characters.forEach((ch, i) => {
  if (/\s/.test(ch)) { if (atual) { palavras.push(atual); atual = null; } return; }
  const ini = al.character_start_times_seconds[i];
  const fim = al.character_end_times_seconds[i];
  if (!atual) atual = { texto: ch, inicio: ini, fim, cena: cenaDoChar(i) };
  else { atual.texto += ch; atual.fim = fim; }
});
if (atual) palavras.push(atual);

const duracao = Math.max(...al.character_end_times_seconds) + 0.25;
const cenas = dados.cenas.map((_, i) => {
  const primeira = palavras.find((p) => p.cena === i);
  return { inicio: i === 0 ? 0 : Math.max(0, (primeira?.inicio ?? 0) - 0.08) };
});
cenas.forEach((c, i) => { c.fim = i + 1 < cenas.length ? cenas[i + 1].inicio : duracao; });

const arred = (n) => Math.round(n * 1000) / 1000;
fs.writeFileSync(arqAudio, Buffer.from(resp.audio_base64, 'base64'));
fs.writeFileSync(arqPalavras, JSON.stringify({
  hash, voz, modelo,
  duracao: arred(duracao),
  cenas: cenas.map((c) => ({ inicio: arred(c.inicio), fim: arred(c.fim) })),
  palavras: palavras.map((p) => ({ ...p, inicio: arred(p.inicio), fim: arred(p.fim) })),
}, null, 1));

dados.narracao = 'narracao.mp3';
dados.palavras = 'palavras.json';
salvarCenas(arq, dados);

console.log(`Narração pronta: ${duracao.toFixed(1)} s, ${palavras.length} palavras, ${texto.length} caracteres.`);
cenas.forEach((c, i) => console.log(`  cena ${i + 1} (${dados.cenas[i].tipo}): ${c.inicio.toFixed(2)} → ${c.fim.toFixed(2)} s`));
console.log('cenas.json atualizado (narracao e palavras).');
