/* Carrega as fontes do Google Fonts por CSS, sem dependência extra.
   Se não houver internet ou a família não existir, o render segue com a fonte
   do sistema (nunca trava por causa de fonte). Use "sistema" para não baixar nada. */
import React, { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

export const pilhaSans = (f: string) =>
  f === 'sistema'
    ? '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    : `"${f}", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

export const pilhaSerif = (f: string) =>
  f === 'sistema' ? 'Georgia, "Times New Roman", serif' : `"${f}", Georgia, "Times New Roman", serif`;

const urlDe = (familia: string, eixos: string) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia).replace(/%20/g, '+')}:${eixos}&display=block`;

const injetar = (href: string) =>
  new Promise<void>((ok) => {
    if (document.querySelector(`link[href="${href}"]`)) return ok();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = () => ok();
    l.onerror = () => ok(); // família inexistente ou sem internet: segue com a do sistema
    document.head.appendChild(l);
  });

const esperar = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

export const Fontes: React.FC<{ fonte: string; fonteItalica: string; children: React.ReactNode }> = ({
  fonte,
  fonteItalica,
  children,
}) => {
  const [handle] = useState(() => delayRender('carregando fontes'));
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const tarefas: Promise<unknown>[] = [];
    if (fonte !== 'sistema') {
      tarefas.push(
        injetar(urlDe(fonte, 'wght@400;700;900')).then(() =>
          Promise.all([
            document.fonts.load(`900 80px "${fonte}"`),
            document.fonts.load(`700 80px "${fonte}"`),
            document.fonts.load(`400 80px "${fonte}"`),
          ]),
        ),
      );
    }
    if (fonteItalica !== 'sistema') {
      tarefas.push(
        injetar(urlDe(fonteItalica, 'ital@0;1')).then(() =>
          document.fonts.load(`italic 400 80px "${fonteItalica}"`),
        ),
      );
    }
    Promise.race([Promise.all(tarefas).catch(() => undefined), esperar(8000)]).then(() => {
      setPronto(true);
      continueRender(handle);
    });
  }, [fonte, fonteItalica, handle]);

  return pronto ? <>{children}</> : null;
};
