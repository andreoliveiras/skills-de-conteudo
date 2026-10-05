# Skills de Conteúdo para o Claude

5 skills que transformam o Claude no seu time de conteúdo do Instagram.

Você descreve o que quer, o Claude faz a entrevista, escreve e entrega o material pronto: reel em MP4, carrossel em PNG, legenda, auditoria de perfil e respostas para os comentários.

## As 5 skills

| Skill | O que entrega |
|---|---|
| **`reel`** | Gancho, cenas, narração e trilha, renderizado em MP4 no seu computador com Remotion. A narração é opcional e usa a sua chave do ElevenLabs. |
| **`carrossel`** | Carrossel da capa ao último slide: copy slide a slide, HTML e PNGs em 1080x1350 prontos para postar. |
| **`legenda`** | Legenda com a primeira linha pensada para o que aparece antes do "mais", corpo fácil de ler, um CTA só e hashtags de nicho. Vem com 3 opções de primeira linha. |
| **`perfil`** | Auditoria do perfil com nota de 0 a 10 em sete critérios, bio reescrita em 3 versões e as 3 mudanças de maior impacto, em ordem. |
| **`comentarios`** | Classifica cada comentário (pediu o material, dúvida, elogio, objeção, hater, spam) e escreve a resposta pública e a DM, em tabela e CSV para copiar. |

Servem para qualquer nicho. Nenhuma tem marca, cliente ou dado embutido.

## Instalar

Escolha um dos três caminhos.

### 1. Claude Code com o instalador de skills (mais rápido)

Pré-requisito: Node 18 ou mais novo. No terminal:

```bash
npx skills add andreoliveiras/skills-de-conteudo
```

Para instalar para todos os seus projetos (global), acrescente `-g`:

```bash
npx skills add andreoliveiras/skills-de-conteudo -g
```

Para só ver o que o repositório oferece, sem instalar nada: `npx skills add andreoliveiras/skills-de-conteudo -l`. Para instalar uma skill específica: `-s carrossel`.

Se o instalador der qualquer erro, use o caminho 2, que sempre funciona.

### 2. Manual (funciona em qualquer computador)

Precisa do Git. No terminal:

```bash
git clone https://github.com/andreoliveiras/skills-de-conteudo
mkdir -p ~/.claude/skills
cp -r skills-de-conteudo/skills/* ~/.claude/skills/
```

Isso deixa as 5 skills disponíveis em todos os projetos do Claude Code. Para usar só em um projeto, copie para a pasta `.claude/skills/` dentro dele.

Sem Git: no GitHub, clique em **Code > Download ZIP**, descompacte e copie o conteúdo da pasta `skills/` para `~/.claude/skills/`.

Depois, reinicie o Claude Code.

### 3. Claude no navegador ou no aplicativo desktop

1. Baixe o repositório (**Code > Download ZIP**) e descompacte.
2. Dentro da pasta `skills/`, escolha a skill que quer (por exemplo `legenda`) e compacte **a pasta dela** em um arquivo `.zip`. A pasta da skill deve ficar na raiz do zip, com o `SKILL.md` dentro.
3. No Claude, abra **Configurações > Capacidades > Skills** e suba o `.zip`.
4. Repita para cada skill.

Atenção: `legenda`, `perfil` e `comentarios` funcionam bem assim, só com conversa. `carrossel` e `reel` geram arquivos (PNG e MP4) rodando programas no seu computador, então **precisam do Claude Code**. `reel` não funciona no navegador. No `carrossel` pelo navegador você ainda recebe toda a copy slide a slide, mas não a exportação em PNG.

## Como usar

É conversa. Abra o Claude Code (ou o Claude) e peça em português. Alguns exemplos:

| Skill | Exemplo de pedido |
|---|---|
| `reel` | `Cria um reel de 30 segundos sobre os 3 erros de quem começa a vender no Instagram. Meu público são nutricionistas.` |
| `carrossel` | `Faz um carrossel de 8 slides ensinando o passo a passo de como gravar um vídeo bom com o celular. CTA: comentar CONTEUDO.` |
| `legenda` | `Escreve a legenda desse carrossel. Quero que o pessoal comente GUIA.` |
| `perfil` | `Audita meu perfil. Minha bio é: "..." Meu link leva para: "..." Meus últimos 9 posts são sobre: ...` |
| `comentarios` | `Responde esses comentários do meu último reel. Quem comentou GUIA recebe o link por DM: [cola os comentários aqui]` |

O Claude pode fazer perguntas antes de começar (nicho, público, objetivo). Responda de uma vez só que ele segue.

### Sobre a skill `comentarios`

Ela **escreve** as respostas públicas e as DMs, em tabela e CSV. Ela **não envia** nada. Disparar DM automaticamente para quem comenta exige uma automação conectada à API do Instagram, que é outra ferramenta e não faz parte deste repositório. Sem automação, você copia as respostas e posta à mão.

## Pré-requisitos

- **Claude Code** para `reel` e `carrossel`; as outras três rodam em qualquer versão do Claude.
- **Node 18 ou mais novo** para `reel` e `carrossel` (confira com `node -v`).
- **Playwright**, para o `carrossel` exportar os PNGs. A skill instala na pasta do carrossel: `npm i playwright`. Se você já tem o Google Chrome, não precisa baixar outro navegador; senão, rode `npx playwright install chromium` (cerca de 150 MB).
- **ffmpeg** (opcional): ajuda o `reel` a tratar áudio e vídeo. No Mac: `brew install ffmpeg`.
- **Chave do ElevenLabs** (opcional): só para o `reel` gerar narração com voz. Sem a chave, o reel sai com legendas, cenas e trilha.

Nenhuma chave vai para o repositório. Se uma skill pedir uma chave, ela fica só no seu computador.

## O que tem dentro

```
skills/
  reel/          gancho, cenas, narração, trilha e render em MP4
  carrossel/     SKILL.md, templates/carrossel.html, scripts/exportar.mjs
  legenda/       SKILL.md
  perfil/        SKILL.md
  comentarios/   SKILL.md
```

Cada skill é uma pasta com um `SKILL.md`: texto em português que o Claude lê e segue. Abra, leia e mude o que quiser. Está tudo aberto.

---

Feito pela TAOS AI · [@andreoliveira.ai](https://www.instagram.com/andreoliveira.ai/)

Licença [MIT](LICENSE): use, modifique e distribua. Se melhorar, manda o PR.
