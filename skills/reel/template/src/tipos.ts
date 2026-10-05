/* O formato do cenas.json. É o único arquivo que muda de um reel para outro:
   o código da composição fica igual. */

export type Cores = {
  /** cor do fundo */
  fundo: string;
  /** cor do texto principal */
  texto: string;
  /** cor de destaque: palavra marcada, números, CTA */
  destaque: string;
  /** texto secundário (subtítulos, rótulos) */
  suave: string;
  /** cor do texto escrito em cima da cor de destaque (o bloco do CTA) */
  sobreDestaque: string;
};

type Base = {
  /** o que é dito nessa cena. Vira narração e legenda palavra por palavra. */
  fala: string;
  /** segundos. Só vale quando NÃO há narração; com narração, quem manda é o áudio. */
  duracao?: number;
};

export type CenaGancho = Base & { tipo: 'gancho'; titulo: string; destaque?: string };
export type CenaTitulo = Base & { tipo: 'titulo'; titulo: string; subtitulo?: string; destaque?: string };
export type CenaLista = Base & { tipo: 'lista'; titulo?: string; itens: string[] };
export type CenaNumero = Base & {
  tipo: 'numero';
  de?: number;
  ate: number;
  prefixo?: string;
  sufixo?: string;
  rotulo?: string;
  decimais?: number;
};
export type CenaAntesDepois = Base & {
  tipo: 'antes-depois';
  antes: string;
  depois: string;
  rotuloAntes?: string;
  rotuloDepois?: string;
};
export type CenaCta = Base & { tipo: 'cta'; palavra: string; chamada?: string; promessa?: string };

export type Cena = CenaGancho | CenaTitulo | CenaLista | CenaNumero | CenaAntesDepois | CenaCta;

export type Palavra = { texto: string; inicio: number; fim: number; cena: number };
export type Tempos = {
  palavras: Palavra[];
  cenas: { inicio: number; fim: number }[];
  duracao: number;
};

export type ReelProps = {
  cores?: Partial<Cores>;
  /** família do Google Fonts para o texto forte, ou "sistema" */
  fonte?: string;
  /** família do Google Fonts para as palavras em itálico, ou "sistema" */
  fonteItalica?: string;
  /** false desliga a legenda palavra por palavra */
  legenda?: boolean;
  /** arquivo em public/, gerado por scripts/narrar.mjs */
  narracao?: string | null;
  /** arquivo em public/ com o tempo de cada palavra, gerado por scripts/narrar.mjs */
  palavras?: string | null;
  /** arquivo em public/, preparado por scripts/mixar.mjs */
  trilha?: string | null;
  /** volume da trilha de 0 a 1 (padrão: 0,3 com narração, 0,8 sem) */
  volumeTrilha?: number;
  cenas: Cena[];
  /** preenchido sozinho pelo calculateMetadata; não escreva no JSON */
  tempos?: Tempos;
};

export const CORES_PADRAO: Cores = {
  fundo: '#0E0F12',
  texto: '#F4F4F2',
  destaque: '#FFC94A',
  suave: '#9A9CA3',
  sobreDestaque: '#0E0F12',
};
