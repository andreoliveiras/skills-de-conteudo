import React from 'react';
import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { Reel } from './Reel';
import type { ReelProps, Tempos } from './tipos';
import { comCauda, estimarTempos } from './tempo';
import exemplo from '../cenas.json';

const FPS = 30;

/* A duração sai das cenas: do áudio da narração (palavras.json), ou da estimativa
   pela fala quando o reel não tem voz. */
const calcular: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  let tempos: Tempos;
  if (props.palavras) {
    const r = await fetch(staticFile(props.palavras));
    if (!r.ok) throw new Error(`Não achei public/${props.palavras}. Rode scripts/narrar.mjs de novo.`);
    tempos = comCauda((await r.json()) as Tempos);
    if (tempos.cenas.length !== props.cenas.length) {
      throw new Error('O palavras.json é de outra versão do cenas.json (número de cenas diferente). Rode scripts/narrar.mjs de novo.');
    }
  } else {
    tempos = estimarTempos(props.cenas);
  }
  return { durationInFrames: Math.ceil(tempos.duracao * FPS), props: { ...props, tempos } };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={FPS * 10}
    defaultProps={exemplo as unknown as ReelProps}
    calculateMetadata={calcular}
  />
);
