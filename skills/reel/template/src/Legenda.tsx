/* Legenda palavra por palavra no centro da tela. As palavras alternam entre
   peso forte e itálico serifado, que é o visual dos reels que seguram a leitura.
   Cada palavra só aparece quando é dita, com um pequeno "pulo" de entrada,
   e a linha se recentraliza a cada palavra nova. */
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Cores } from './tipos';
import type { Linha } from './tempo';
import { pilhaSans, pilhaSerif } from './fontes';

const limpar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

export const Legenda: React.FC<{
  linhas: Linha[];
  cores: Cores;
  fonte: string;
  fonteItalica: string;
  /** palavras (de qualquer cena) que saem na cor de destaque */
  destaques: string[];
  /** cenas em que a legenda fica escondida (o CTA e o gancho já mostram o texto) */
  cenasSemLegenda: number[];
}> = ({ linhas, cores, fonte, fonteItalica, destaques, cenasSemLegenda }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const linha = linhas.find((l) => t >= l.inicio && t < l.fim);
  if (!linha || cenasSemLegenda.includes(linha.palavras[0].cena)) return null;
  const marcadas = new Set(destaques.flatMap((d) => d.split(/\s+/)).map(limpar).filter(Boolean));

  return (
    <AbsoluteFill style={{ top: 1180, height: 340, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          columnGap: 26,
          rowGap: 0,
          maxWidth: 900,
          lineHeight: 1.08,
          textShadow: '0 4px 24px rgba(0,0,0,.45)',
        }}
      >
        {linha.palavras.filter((p) => t >= p.inicio).map((p) => {
          const italica = p.indice % 2 === 1;
          const entrada = interpolate(t - p.inicio, [0, 0.12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cor = marcadas.has(limpar(p.texto)) ? cores.destaque : cores.texto;
          return (
            <span
              key={p.indice}
              style={{
                opacity: entrada,
                transform: `translateY(${(1 - entrada) * 18}px) scale(${0.92 + 0.08 * entrada})`,
                display: 'inline-block',
                color: cor,
                fontFamily: italica ? pilhaSerif(fonteItalica) : pilhaSans(fonte),
                fontStyle: italica ? 'italic' : 'normal',
                fontWeight: italica ? 400 : 900,
                fontSize: italica ? 100 : 86,
                letterSpacing: italica ? '-0.01em' : '-0.03em',
              }}
            >
              {p.texto}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
