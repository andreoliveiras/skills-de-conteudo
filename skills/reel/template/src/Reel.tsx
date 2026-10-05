import React, { useMemo } from 'react';
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CORES_PADRAO, type Cores, type ReelProps } from './tipos';
import { estimarTempos, montarLinhas } from './tempo';
import { Fontes } from './fontes';
import { Legenda } from './Legenda';
import { CenaVisual } from './cenas';

/** fundo com um brilho suave da cor de destaque que passeia devagar */
const Fundo: React.FC<{ cores: Cores }> = ({ cores }) => {
  const frame = useCurrentFrame();
  const x = 50 + 22 * Math.sin(frame / 90);
  const y = 32 + 10 * Math.cos(frame / 120);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: cores.fundo,
        backgroundImage: `radial-gradient(circle at ${x}% ${y}%, color-mix(in srgb, ${cores.destaque} 16%, transparent), transparent 58%)`,
      }}
    />
  );
};

export const Reel: React.FC<ReelProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const cores: Cores = { ...CORES_PADRAO, ...(props.cores ?? {}) };
  const fonte = props.fonte ?? 'Inter';
  const fonteItalica = props.fonteItalica ?? 'Instrument Serif';
  const tempos = props.tempos ?? estimarTempos(props.cenas);
  const linhas = useMemo(() => montarLinhas(tempos.palavras), [tempos]);
  const destaques = props.cenas.flatMap((c) => ('destaque' in c && c.destaque ? [c.destaque] : []));
  // sem legenda repetida: no CTA, e em cena cujo título já é a própria fala (o gancho, quase sempre)
  const so = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const cenasSemLegenda = props.cenas.flatMap((c, i) =>
    c.tipo === 'cta' || ('titulo' in c && c.titulo && so(c.titulo) === so(c.fala)) ? [i] : [],
  );
  const temNarracao = Boolean(props.narracao);
  const volumeBase = props.volumeTrilha ?? (temNarracao ? 0.3 : 0.8);
  const totalSeg = durationInFrames / fps;

  // ducking simples: a trilha cai para metade quando há voz, e sobe nas pausas
  const volumeTrilha = (f: number) => {
    const t = f / fps;
    const fade = Math.min(
      interpolate(t, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
      interpolate(t, [totalSeg - 1.2, totalSeg], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    );
    if (!temNarracao) return volumeBase * fade;
    let dist = Infinity;
    for (const p of tempos.palavras) {
      const d = t < p.inicio - 0.15 ? p.inicio - 0.15 - t : t > p.fim + 0.35 ? t - p.fim - 0.35 : 0;
      if (d < dist) dist = d;
      if (dist === 0) break;
    }
    const abre = Math.min(1, dist / 0.3);
    return volumeBase * (0.5 + 0.5 * abre) * fade;
  };

  return (
    <AbsoluteFill>
      <Fundo cores={cores} />
      <Fontes fonte={fonte} fonteItalica={fonteItalica}>
        {props.cenas.map((cena, i) => {
          const b = tempos.cenas[i];
          const from = Math.round(b.inicio * fps);
          const dur = Math.max(1, Math.round(b.fim * fps) - from);
          return (
            <Sequence key={i} from={from} durationInFrames={dur} name={`${i + 1}. ${cena.tipo}`}>
              <CenaVisual cena={cena} cores={cores} fonte={fonte} fonteItalica={fonteItalica} duracao={dur / fps} />
            </Sequence>
          );
        })}
        {props.legenda !== false && (
          <Legenda
            linhas={linhas}
            cores={cores}
            fonte={fonte}
            fonteItalica={fonteItalica}
            destaques={destaques}
            cenasSemLegenda={cenasSemLegenda}
          />
        )}
      </Fontes>
      {props.narracao && <Html5Audio src={staticFile(props.narracao)} />}
      {props.trilha && <Html5Audio src={staticFile(props.trilha)} loop volume={volumeTrilha} />}
    </AbsoluteFill>
  );
};
