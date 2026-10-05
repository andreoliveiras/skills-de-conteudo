# reel

Skill de Claude Code que entrega um reel vertical 1080x1920 **pronto em MP4**: gancho, roteiro
cena a cena, narração, trilha e render local com [Remotion](https://www.remotion.dev).

Você pede "faz um reel sobre X para o meu perfil de Y", o Claude faz 6 perguntas rápidas,
escreve o roteiro, monta as cenas (título, lista numerada, número animado, antes/depois e o
"Comenta PALAVRA" no fim), sincroniza a legenda palavra por palavra e renderiza no seu
computador.

- **Narração opcional** com a sua chave do ElevenLabs (vai no `.env`, nunca no chat).
  Sem chave, o reel sai com legenda animada e trilha, sem voz.
- **Trilha opcional**: a sua música ou de biblioteca livre (YouTube Audio Library, Pixabay
  Music). A música abaixa sozinha quando há voz.
- **Cores e fontes** configuráveis no `cenas.json`. Nenhuma marca embutida.

## Precisa de

- Node 18 ou mais novo
- ffmpeg (opcional, para nivelar o volume da trilha)
- ~600 MB livres para o Remotion, instalado uma vez

## O que tem aqui

```
reel/
├── SKILL.md              instruções que o Claude segue
├── .env.exemplo          onde vai a chave do ElevenLabs
├── exemplos/
│   └── cenas.exemplo.json
├── scripts/
│   ├── narrar.mjs        narração com tempo por palavra (tem modo --simular)
│   ├── mixar.mjs         prepara a trilha (ffmpeg opcional)
│   ├── checar.mjs        checklist: contraste, ritmo, gancho, CTA
│   └── _comum.mjs
└── template/             projeto Remotion copiado para ~/reels-estudio
    ├── package.json      versões fixas
    ├── remotion.config.ts
    ├── cenas.json        exemplo
    └── src/              composição dirigida pelo cenas.json
```

## Limites

O reel é tipográfico: não usa filmagem, imagem nem avatar. Não clona voz, não escolhe música
e não publica no Instagram.

Licença MIT.
