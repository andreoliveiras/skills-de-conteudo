import type { Cena, Palavra, Tempos } from './tipos';

/* Sem narração não há tempo medido: estima pela fala, no ritmo de quem fala rápido
   em reel (2,9 palavras por segundo). scripts/checar.mjs usa as mesmas regras. */
export const PALAVRAS_POR_SEGUNDO = 2.9;
export const CENA_MINIMA = 1.8;
export const CTA_MINIMO = 3.0;
/** segundos que o último quadro (o CTA) fica na tela depois da última palavra */
export const CAUDA = 1.2;

export const separarPalavras = (fala: string) => fala.trim().split(/\s+/).filter(Boolean);

export const estimarTempos = (cenas: Cena[]): Tempos => {
  const palavras: Palavra[] = [];
  const blocos: Tempos['cenas'] = [];
  let t = 0;
  cenas.forEach((cena, i) => {
    const ps = separarPalavras(cena.fala);
    const minimo = cena.tipo === 'cta' ? CTA_MINIMO : CENA_MINIMA;
    const dur = cena.duracao ?? Math.max(minimo, ps.length / PALAVRAS_POR_SEGUNDO + 0.35);
    // distribui as palavras pelo tamanho (palavra longa demora mais para ser dita)
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

/* Com narração, o arquivo palavras.json já traz o fim do áudio; aqui só se
   garante que o CTA fique um pouco na tela depois da última palavra. */
export const comCauda = (tempos: Tempos): Tempos => {
  const cenas = tempos.cenas.map((c) => ({ ...c }));
  const duracao = tempos.duracao + CAUDA;
  if (cenas.length) cenas[cenas.length - 1].fim = duracao;
  return { ...tempos, cenas, duracao };
};

/* Agrupa as palavras em linhas curtas de legenda: até 3 palavras, quebrando
   onde há pontuação. Cada linha some quando a próxima começa. */
export type Linha = { palavras: (Palavra & { indice: number })[]; inicio: number; fim: number };

export const montarLinhas = (palavras: Palavra[], maximo = 3): Linha[] => {
  const linhas: Linha[] = [];
  let atual: Linha['palavras'] = [];
  const fechar = () => {
    if (!atual.length) return;
    linhas.push({ palavras: atual, inicio: atual[0].inicio, fim: atual[atual.length - 1].fim });
    atual = [];
  };
  palavras.forEach((p, indice) => {
    if (atual.length && atual[0].cena !== p.cena) fechar();
    atual.push({ ...p, indice });
    if (atual.length >= maximo || /[.,!?;:…]$/.test(p.texto)) fechar();
  });
  fechar();
  // a linha fica até a próxima começar (no máximo 0,6 s depois da última palavra)
  linhas.forEach((l, i) => {
    const prox = linhas[i + 1];
    l.fim = prox ? Math.min(prox.inicio, l.fim + 0.6) : l.fim + 0.6;
  });
  return linhas;
};
