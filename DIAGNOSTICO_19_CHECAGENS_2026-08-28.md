# As 19 checagens que falham no front — 28/08/2026

*Diagnóstico. Nenhuma correção aplicada.*

Elas falham desde antes das frentes de 27 e 28/08 — conferido restaurando o `index.html` de
`8ac96f0` e rodando as mesmas suítes. **Nunca tinham sido abertas uma a uma.** Este documento
abre.

## O veredito

**Nenhuma das 19 aponta defeito na tela.** Todas são testes que fixaram um detalhe que mudou
de propósito depois, ou contagens globais que subiram quando um recurso novo entrou.

⚠️ **Isso não quer dizer "apagar as 19".** Cada uma existe porque alguém quase quebrou aquilo
uma vez. O conserto é atualizar a asserção para a verdade de hoje, **com o comentário dizendo o
que mudou** — como foi feito em 27 e 28/08 com as três do `teste_front_acoes.js`.

---

## Grupo A — contagem global que subiu (4)

Contam ocorrências no arquivo inteiro. Um recurso novo entra e o número sobe.

| suíte | checagem | o que aconteceu |
|---|---|---|
| `menu` | "somem exatamente 15 itens" `[16]` | **o item `acomp` (Acompanhamento)** entrou em `dc5c78f`, é `superadmin`-only e some no papel analista — exatamente como os outros 15. Ninguém o pôs na lista `SOMEM`. |
| `vercomo` | "as travas são CINCO" `[6]` | há 6 funções com `if(verComoAtivo()) { toast(` — `sinoMarcarTodas`, `abrirPedidoDev`, `pEstornar`, `ciReabrirAbrir`, `ciConfirmar`, `abrirDevM`. O teste nomeia 5. |
| `ci_fila` | "a tela do C.I. faz UM POST só" `[2]` | o segundo é o `POST /parcela/sigef_declaracao`, de **28/08** — é da declaração do SIGEF, não da fila do C.I. O regex conta `method:'POST'` no bloco inteiro. |
| `links` | "…= 12 telas absorvendo `j.links`" | uma tela nova passou a absorver `links`. A pergunta que o próprio teste manda fazer é "a tela que entrou desenha SGPe?" — e a resposta decide se o número novo está certo. |

⚠️ **`acomp` é o caso a olhar com atenção.** A checagem individual dele **passa** ("aparece no
técnico e some no analista"), porque não existe — só o total acusou. Uma contagem que sobe é o
único aviso que sobra quando ninguém nomeia o item novo.

## Grupo B — a janela de leitura ficou curta (3)

O teste fatia N caracteres a partir do nome da função e procura dentro. A função ganhou
comentário e o trecho procurado saiu da janela.

| suíte | checagem |
|---|---|
| `painel` | "o botão Ações da linha tem peso 800" |
| `painel` | "e é verde sólido com texto branco" |
| `painel` | "o rótulo é 'Ações ▾', sem os três pontinhos" |

**Medido:** `html.slice(i, i + 900)` a partir de `function pBotaoAcoes(pa, tr) {` não alcança
mais o markup do botão — os primeiros 900 caracteres são cabeçalho de comentário. **O botão
está lá e está certo**; a janela é que encolheu em relação à função.

⚠️ **Aumentar o número é o conserto errado** — ele encolhe de novo no próximo comentário.
Recortar até o `return` da função resolve de vez.

## Grupo C — o teste fixa um texto/estilo que mudou (12)

| suíte | checagem |
|---|---|
| `acoes` | "o menu abre por `codigo_pc` E recebe o número da parcial do próprio cartão" |
| `busca` | "com o recorte do chip e quem está pedindo" |
| `busca` | "a sigla nasce SCC, e o campo continua editável" |
| `ci_fila` | "a sigla nasce SCC" |
| `ci_fila` | "e a tela explica a normalização" |
| `ci_fila` | "com os três, nessa ordem" |
| `ci_fila` | "a zebra saiu" |
| `ci_fila` | "e o corte continua sendo dito" |
| `ci_fila` | "pequeno, no estilo secundário" |
| `ci_fila` | "em 12px" |
| `ci_fila` | "alinhado à direita da linha" |
| `ci_fila` | "o motivo 'O parecer do Controle Interno é da…'" |

**Dez das doze são do `teste_front_ci_fila.js`**, e todas descrevem a tela do C.I. **antes** de
`36c6000` (25/08), a rodada que a reescreveu para ser por PC — a mesma que levou o `ciBolha`
junto. O teste foi ajustado naquela rodada (458 linhas mudaram), mas **não por inteiro**.

⚠️ **É o mesmo commit que escondeu um defeito real por três dias.** A suíte que deveria ter
apanhado o `ciBolha` estava ela própria com 10 checagens falhando — e uma suíte que já falha
não chama atenção quando falha mais um pouco. **Ruído de teste é o que faz sinal de teste
passar despercebido.**

---

## O que eu recomendo, e não fiz

1. **`ci_fila` primeiro** — são 10 das 19, todas da mesma rodada, e é a suíte que cobre a tela
   onde o `ciBolha` quebrou. Enquanto ela apitar, ela não protege nada.
2. **Grupo B**: trocar `slice(i, i+900)` por um recorte até o fim da função. Conserta os três e
   não volta a quebrar.
3. **Grupo A**: pôr `acomp` na lista `SOMEM`, nomear a 6ª trava, e separar o POST da declaração
   do SIGEF do bloco da fila do C.I.
4. **Nenhuma delas é urgente pelo lado do usuário** — a tela está certa nos 19 casos.

⚠️ E vale registrar o que este diagnóstico mostrou sobre o método: **as três suítes que eu
ajustei em 27 e 28/08 eu ajustei porque a MINHA mudança as quebrou.** As 19 estavam ali antes,
e ninguém as abriu — inclusive eu, que as reportei quatro vezes como "pré-existentes" sem
olhar.
