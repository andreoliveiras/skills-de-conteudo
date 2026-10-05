/* Funções usadas pelos três scripts. Node puro, sem dependência. */
import fs from 'node:fs';
import path from 'node:path';

export const TIPOS = ['gancho', 'titulo', 'lista', 'numero', 'antes-depois', 'cta'];

/** lê --chave valor e --flag da linha de comando */
export const lerArgs = (argv = process.argv.slice(2)) => {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x.startsWith('--')) {
      const nome = x.slice(2);
      const prox = argv[i + 1];
      if (prox !== undefined && !prox.startsWith('--')) { a[nome] = prox; i++; } else a[nome] = true;
    } else a._.push(x);
  }
  return a;
};

export const pastaProjeto = (args) => path.resolve(typeof args.projeto === 'string' ? args.projeto : process.cwd());

export const lerCenas = (projeto) => {
  const arq = path.join(projeto, 'cenas.json');
  if (!fs.existsSync(arq)) throw new Error(`Não achei ${arq}. Rode o script de dentro da pasta do reel ou use --projeto <pasta>.`);
  try {
    return { arq, dados: JSON.parse(fs.readFileSync(arq, 'utf8')) };
  } catch (e) {
    throw new Error(`cenas.json não é um JSON válido: ${e.message}`);
  }
};

export const salvarCenas = (arq, dados) => fs.writeFileSync(arq, JSON.stringify(dados, null, 2) + '\n');

/** Lê uma variável do ambiente ou de um .env (na pasta do reel ou na atual). Nunca imprime o valor. */
export const lerSegredo = (nome, projeto) => {
  if (process.env[nome]) return process.env[nome].trim();
  for (const dir of [projeto, process.cwd()]) {
    const env = path.join(dir, '.env');
    if (!fs.existsSync(env)) continue;
    const linha = fs.readFileSync(env, 'utf8').split('\n').find((l) => l.trim().startsWith(`${nome}=`));
    if (linha) {
      const v = linha.slice(linha.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
      if (v) return v;
    }
  }
  return null;
};

const texto = (v) => typeof v === 'string' && v.trim().length > 0;

/** Erros que impedem o render. Devolve lista vazia quando está tudo certo. */
export const validar = (d) => {
  const erros = [];
  if (!d || typeof d !== 'object') return ['O arquivo precisa ser um objeto JSON.'];
  if (!Array.isArray(d.cenas) || d.cenas.length === 0) return ['Falta a lista "cenas" (com pelo menos uma cena).'];
  d.cenas.forEach((c, i) => {
    const n = `Cena ${i + 1}`;
    if (!TIPOS.includes(c.tipo)) erros.push(`${n}: tipo "${c.tipo}" não existe. Use um destes: ${TIPOS.join(', ')}.`);
    if (!texto(c.fala)) erros.push(`${n}: falta "fala" (o texto dito nessa cena).`);
    if (c.duracao !== undefined && !(typeof c.duracao === 'number' && c.duracao > 0)) erros.push(`${n}: "duracao" precisa ser número de segundos.`);
    if ((c.tipo === 'gancho' || c.tipo === 'titulo') && !texto(c.titulo)) erros.push(`${n}: falta "titulo".`);
    if (c.tipo === 'lista' && (!Array.isArray(c.itens) || c.itens.length < 2 || !c.itens.every(texto))) erros.push(`${n}: "itens" precisa ter pelo menos 2 textos.`);
    if (c.tipo === 'numero' && typeof c.ate !== 'number') erros.push(`${n}: "ate" precisa ser número.`);
    if (c.tipo === 'antes-depois' && !(texto(c.antes) && texto(c.depois))) erros.push(`${n}: faltam "antes" e "depois".`);
    if (c.tipo === 'cta' && !texto(c.palavra)) erros.push(`${n}: falta "palavra" (a palavra-chave que a pessoa comenta).`);
  });
  if (d.volumeTrilha !== undefined && !(typeof d.volumeTrilha === 'number' && d.volumeTrilha >= 0 && d.volumeTrilha <= 1)) erros.push('"volumeTrilha" vai de 0 a 1.');
  return erros;
};

/* Mesma estimativa de template/src/tempo.ts (para reel sem narração). */
export const estimarTempos = (cenas) => {
  const palavras = [];
  const blocos = [];
  let t = 0;
  cenas.forEach((cena, i) => {
    const ps = cena.fala.trim().split(/\s+/).filter(Boolean);
    const minimo = cena.tipo === 'cta' ? 3.0 : 1.8;
    const dur = cena.duracao ?? Math.max(minimo, ps.length / 2.9 + 0.35);
    const pesos = ps.map((p) => p.length + 2);
    const soma = pesos.reduce((a, b) => a + b, 0) || 1;
    const util = Math.max(0.5, dur - 0.35);
    let cursor = t + 0.1;
    ps.forEach((p, k) => {
      const d = (pesos[k] / soma) * util;
      palavras.push({ texto: p, inicio: cursor, fim: cursor + d * 0.92, cena: i });
      cursor += d;
    });
    blocos.push({ inicio: t, fim: t + dur });
    t += dur;
  });
  return { palavras, cenas: blocos, duracao: t };
};

/** contraste WCAG entre duas cores hex; null se alguma não for hex */
export const contraste = (a, b) => {
  const lum = (hex) => {
    let h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const la = lum(a);
  const lb = lum(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export const CORES_PADRAO = { fundo: '#0E0F12', texto: '#F4F4F2', destaque: '#FFC94A', suave: '#9A9CA3', sobreDestaque: '#0E0F12' };
