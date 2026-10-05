#!/usr/bin/env node
/* Checklist antes (e depois) do render. Erro impede o render; aviso é para olhar.
 *
 *   node checar.mjs [--projeto <pasta>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { lerArgs, pastaProjeto, lerCenas, validar, estimarTempos, contraste, CORES_PADRAO } from './_comum.mjs';

const args = lerArgs();
const projeto = pastaProjeto(args);
const { dados } = lerCenas(projeto);

const erros = validar(dados);
const avisos = [];
const ok = [];

if (!erros.length) {
  const cores = { ...CORES_PADRAO, ...(dados.cores ?? {}) };

  // 1. contraste (WCAG: 4,5 para texto; 3 para texto grande secundário)
  const pares = [
    ['texto', 'fundo', 4.5, 'legenda e títulos'],
    ['destaque', 'fundo', 3, 'palavra em destaque e números'],
    ['sobreDestaque', 'destaque', 4.5, 'palavra do CTA dentro do bloco'],
    ['suave', 'fundo', 3, 'subtítulos e rótulos'],
  ];
  for (const [a, b, min, uso] of pares) {
    const c = contraste(cores[a], cores[b]);
    if (c === null) avisos.push(`Contraste ${a}/${b}: cor fora do formato #rrggbb, não deu para medir.`);
    else if (c < min) erros.push(`Contraste baixo em ${uso}: ${a} sobre ${b} = ${c.toFixed(1)}:1 (mínimo ${min}:1).`);
    else ok.push(`contraste ${a}/${b} ${c.toFixed(1)}:1`);
  }

  // 2. tempos: da narração, se houver; se não, estimados
  let tempos = null;
  if (dados.palavras) {
    const p = path.join(projeto, 'public', dados.palavras);
    if (!fs.existsSync(p)) erros.push(`"palavras" aponta para public/${dados.palavras}, que não existe. Rode narrar.mjs ou ponha null.`);
    else {
      tempos = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (tempos.cenas.length !== dados.cenas.length) erros.push('palavras.json tem número de cenas diferente do cenas.json: a fala mudou depois da narração. Rode narrar.mjs de novo.');
    }
  }
  if (dados.narracao && !fs.existsSync(path.join(projeto, 'public', dados.narracao))) erros.push(`"narracao" aponta para public/${dados.narracao}, que não existe.`);
  if (dados.trilha && !fs.existsSync(path.join(projeto, 'public', dados.trilha))) erros.push(`"trilha" aponta para public/${dados.trilha}, que não existe.`);
  const medido = Boolean(tempos);
  tempos = tempos ?? estimarTempos(dados.cenas);
  const rotulo = medido ? 'medido na narração' : 'estimado pela fala';
  const total = tempos.duracao + (medido ? 1.2 : 0);

  if (total < 20 || total > 45) avisos.push(`Duração total ${total.toFixed(1)} s (${rotulo}). O alvo é de 20 a 45 s.`);
  else ok.push(`duração ${total.toFixed(1)} s (${rotulo})`);

  const g = tempos.cenas[0];
  if (g.fim - g.inicio > 2.6) avisos.push(`O gancho dura ${(g.fim - g.inicio).toFixed(1)} s. Corte para caber em ~2 s (até 6 ou 7 palavras).`);
  else ok.push(`gancho em ${(g.fim - g.inicio).toFixed(1)} s`);

  tempos.cenas.forEach((c, i) => {
    const d = c.fim - c.inicio;
    if (d > 6.5 && dados.cenas[i].tipo !== 'lista') avisos.push(`Cena ${i + 1} (${dados.cenas[i].tipo}) dura ${d.toFixed(1)} s: divida em duas para nada ficar parado.`);
  });
  for (let i = 1; i < tempos.palavras.length; i++) {
    const vao = tempos.palavras[i].inicio - tempos.palavras[i - 1].fim;
    if (vao > 1.5) avisos.push(`Pausa de ${vao.toFixed(1)} s antes de "${tempos.palavras[i].texto}": a tela fica sem legenda nesse trecho.`);
  }

  // 3. CTA no fim
  const ultima = dados.cenas[dados.cenas.length - 1];
  if (ultima.tipo !== 'cta') erros.push('A última cena precisa ser do tipo "cta" (a chamada final com a PALAVRA).');
  else if (!ultima.fala.toLowerCase().includes(ultima.palavra.toLowerCase())) avisos.push(`A fala do CTA não diz a palavra "${ultima.palavra}". Diga em voz alta o que a pessoa deve comentar.`);
  else ok.push(`CTA no fim: ${ultima.chamada ?? 'Comenta'} ${ultima.palavra.toUpperCase()}`);

  // 4. textos que estouram a tela
  dados.cenas.forEach((c, i) => {
    if (c.titulo && c.titulo.length > 60) avisos.push(`Cena ${i + 1}: título com ${c.titulo.length} caracteres pode passar de 4 linhas (ideal até 50).`);
    (c.itens ?? []).forEach((it) => { if (it.length > 34) avisos.push(`Cena ${i + 1}: item "${it}" é longo (ideal até 30 caracteres).`); });
    if (c.tipo === 'lista' && c.itens?.length > 5) avisos.push(`Cena ${i + 1}: mais de 5 itens não cabe bem na tela.`);
    if (c.tipo === 'cta' && c.palavra.length > 9) avisos.push(`Cena ${i + 1}: palavra do CTA com mais de 9 letras pode não caber numa linha.`);
  });
  if (!dados.narracao) avisos.push('Sem narração: o reel sai só com legenda animada e trilha.');
  if (!dados.trilha) avisos.push('Sem trilha.');
}

ok.forEach((m) => console.log(`✓ ${m}`));
avisos.forEach((m) => console.log(`! ${m}`));
erros.forEach((m) => console.log(`✖ ${m}`));
console.log(erros.length ? `\n${erros.length} erro(s): corrija antes de renderizar.` : '\nPronto para renderizar.');
process.exit(erros.length ? 1 : 0);
