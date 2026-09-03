# SIGPC-GT — ESTADO EM 03/09/2026

Cole no início do chat novo. Este arquivo é o que basta para retomar.

> ⚠️ **O QUE ESTÁ ABAIXO DA LINHA "HISTÓRICO" É DE 17/08/2026 e ficou para trás.** Ele descreve
> o Estoque de TRs e a faixa de avisos daquela semana, e continua útil como registro do que se
> mediu — **não como estado**. O estado é este bloco.

---

## ▶ O ESTADO DE AGORA — leia isto primeiro

**Duas escritas em produção em 02–03/09**, as duas no `sigpc-api`: a **primeira invalidação
real** (`2021PC002840`) e a **limpeza do lixo de teste** (ids 2544 e 2545 de `parcela_historico`).
Nada mais foi gravado. **O sistema está ABERTO** e os dois interruptores continuam desligados.

**Testes em 03/09:** **26 suítes · 2.476 checagens · 0 falhas** neste repositório ·
`sigpc-api` **27 · 2.199 · 1** — a falha é a `teste_sgpe_portal.js`, **anterior a esta sessão**
(medida no commit `3a30e42` do `sigpc-api`, não re-executada aqui).

---

## 1. A PC INVALIDADA — nasceu em 02/09, e é a frente que atravessa

**O resíduo de carga agora SAI DAS CONTAGENS SEM SAIR DA TABELA.** Quatro colunas novas em
`prestacoes_contas`: `invalidada`, `invalidada_em`, `invalidada_por`, `motivo_invalidacao`.

| | |
|---|---|
| a regra | **`sigpc-api/lib/invalidada.js`** — uma cópia só, aplicada em **28 pontos** |
| as rotas | `POST /pc/:codigo_pc/invalidar` · `POST /pc/:codigo_pc/desinvalidar` |
| quem pode | **superadmin e coordenador** (perfil lido do BANCO pelo `usuario_id`) |
| o motivo | obrigatório, **mínimo 15 caracteres** — a régua do estorno, não os 10 da correção |
| o caso zero | `2021PC002840`, TR `2021TR002375` — nasceu com `processo_pc = '-1'` e não existe no SIGEF |

### Os quatro pontos que não podem ser esquecidos

1. **Invalidar NÃO zera `baixada`.** O par `baixada = true AND invalidada = true` é **legítimo**.
   Zerar seria estorno com outro nome — inventaria um evento que não houve e devolveria a PC à
   fila como trabalho pendente. **É por isso que toda contagem de baixadas precisa do filtro.**
2. **O `lib/pc-nova.js` precisa do filtro INVERTIDO** (`TODAS_INCLUSIVE_INVALIDADAS`). Sem
   enxergar a invalidada, **o cadastro recria exatamente a PC que acabou de sair de circulação**
   — e a nova nasce sem a marca. **A duplicidade tem de ver o que a contagem não vê.**
3. **A produtividade cumulativa usa `ativaAte`**, não `ativa`:
   `(invalidada = false OR invalidada_em > $corte)`. Com o filtro simples, um relatório de julho
   gerado hoje perderia PCs que valiam naquela data — **o passado mudaria**.
4. **O estorno não servia**, e isso foi medido antes de desenhar: ele é por parcela, exige
   `baixada = true`, e `estornada = true` nem sai da contagem do `resumo_tr`.

### 🔴 O que atravessa para a próxima sessão

**A invalidação NÃO EXISTE NA TELA.** Medido: **zero** ocorrências de `invalidada` no
`index.html`. As rotas estão no ar e a primeira PC já foi invalidada pelo servidor — falta o
caminho na tela, e **onde ele mora é decisão do Richard** (quem invalida é superadmin ou
coordenador; o motivo de 15 caracteres é obrigatório e vai gravado).

---

## 2. O ANEL DO C.I. — cinco linhas, e duas das três antigas mentiam

O painel **"Suas PCs no Controle Interno"** deixou de ser três barras e virou **um anel só, com
cinco linhas e o total no miolo**:

| linha | o que mede |
|---|---|
| **Aguardando análise no C.I.** | encaminhadas e ainda na fila, sem retorno |
| **Declarada por você** | encerradas antes de o sistema receber a devolutiva; a confiabilidade vem da declaração |
| **C.I. de acordo** | decisão de acordo **gravada** por técnico do Controle Interno |
| **Reaberta pelo C.I.** | voltaram pelo SGPe depois do encerramento; a baixa e o encaminhamento seguem valendo |
| **Voltou com ressalvas** | devolvidas com ressalva, aguardando providência sua |

**Por que mudou, com número:**
- a antiga "C.I. de acordo" era `ci_situacao = 'encerrado'` e nada mais. Das **1.584** encerradas,
  **só 7** têm decisão do C.I. registrada — as outras **1.577** vieram do UPDATE em massa de
  16/08 (`executar_16_08.js` FRENTE 3). A escolha de 16/08 estava certa; **o rótulo é que
  afirmava um acordo que ninguém deu**. Por isso a linha "Declarada por você" existe.
- a antiga "Voltou com ressalvas" engolia a **reabertura pelo SGPe**, que é outra coisa: a
  reaberta voltou porque o processo tramitou, não porque o C.I. discordou. **157 de 161** caíam ali.

⚠️ **A unidade é a PARCELA**, como a fila do C.I. desde 26/08. Medido antes de escrever: das
**1.988** parcelas no ciclo, **zero** têm PCs em `ci_situacao` diferentes — a parcela é homogênea
e a contagem não precisa de regra de desempate.

⚠️ **O servidor manda as cinco prontas** (`ci_l1..ci_l5`, `ci_total`). **A tela não soma nada** —
foi a tela ter conta própria que criou as divergências que o levantamento de 02/09 achou.

---

## 3. O BOTÃO "FONTE" — padrão novo, vale para todo painel e todo gráfico

Estreou no anel do C.I. (`dashCiFonte`, `DASH_CI_FONTE`) e **vale daqui para a frente**. Ele abre
um bloco que diz, por número: **de onde vem · a unidade · a tabela · o filtro · e o que NÃO conta**.

**Não é enfeite:** foi tentar escrever a fonte de cada barra que revelou que duas das três
mentiam. **Número que ninguém consegue conferir é número em que ninguém pode confiar.**

⚠️ O texto mora **colado** em `DASH_CI_LINHAS`, na mesma ordem e nas mesmas cores — solto no
HTML ele fica velho (a lição do `ciBolha`).
⚠️ O estado mora no **próprio elemento** (`data-aberto` no botão), nunca em `sessionStorage` —
ordem do Richard. **Mas sobrevive à repintura:** `renderDashCi` roda a cada 60 s, e sem ler o
valor do elemento antigo o bloco fecharia sozinho no meio da leitura.

---

## 4. A SUÍTE DA TELA — 15 checagens desatualizadas, ZERO defeitos

Commit `90dc92c`. **Nenhuma das 15 apontava problema no `index.html`**: as frentes mudaram de
propósito entre 26 e 31/08 e era o teste que continuava medindo a tela anterior.

| arquivo | falhas | o que estava velho |
|---|---|---|
| `teste_front_ci` | 6 | duas **fatias fixas** que encolheram; o ícone virou chave de `AC_ICONES` e a cor, de `AC_CORES` |
| `teste_front_painel` | 5 | a fatia do `pBotaoAcoes`; `padding:9px 14px` e ícone de **30px** desde 30/08 |
| `teste_front_links` | 1 | **13** telas absorvem `j.links`, não 12 — a Acompanhamento entrou |
| `teste_front_menu` | 1 | **17** itens somem no papel analista — `transf` e `acomp` nasceram só-superadmin |
| `teste_front_vercomo` | 1 | as travas do modo são **SEIS** — a sexta é o `ciReabrirAbrir` |
| `teste_front_busca` | 1 | a fila do C.I. paginou: `pagina` e `tamanho` no mesmo `URLSearchParams` |

⚠️ **A causa de 11 das 15 foi a mesma: `html.slice(i, i + N)`.** A janela do grupo "Fluxo da
análise" tinha 2.600 e cortava o item do C.I. ao meio; a da `renderPlan` tinha 9.000 e a função
hoje tem **19.883**; a do `pBotaoAcoes` tinha 900 e parava dentro de um comentário. **As três
passaram a terminar num marco do próprio código.** Ver a **armadilha 30**.

⚠️ **`transf` e `acomp` também entraram na `GUARDA_REAL`** do `teste_front_menu` — sem isso elas
ficavam de fora da conferência item a item, que é a razão de aquela seção existir.

---

## 5. O QUE APRENDEMOS E FICOU ESCRITO — armadilhas 29 a 32

| # | a regra |
|---|---|
| **29** | a PC invalidada sai da contagem sem sair da tabela, e a regra é **uma cópia só** |
| **30** | **teste com fatia fixa mente quando o código cresce** — terminar num marco, nunca num número |
| **31** | **`process.exitCode`, nunca `process.exit()`**, em script que termina em `ROLLBACK` |
| **32** | **foto tirada no meio da rodada mede o próprio lixo do teste** |

**A 32 aconteceu comigo nesta sessão:** reportei **3 linhas** na trilha da TR `2021TR002375`
quando eram **1**. As outras duas (ids 2544 e 2545) eram do teste que estava rodando **naquele
instante**. Depois da limpeza, a trilha voltou ao que sempre foi: 1 linha, id 701, `processo_pc`,
de 14/08. **Número de conferência se mede com a rodada parada e o lixo já removido** — antes de
começar, ou depois de limpar. Nunca no meio.

---

## 6. ▶ O QUE OLHAR AO ABRIR O NAVEGADOR

Nada do que segue foi clicado por uma pessoa.

- [ ] **O anel do C.I.** — cinco linhas, uma volta só, total no miolo, rótulos dizendo o que a
      linha mede.
- [ ] **O botão "Fonte"** — abre e fecha; uma linha por fatia, mesma ordem e mesma cor.
      ⚠️ **Deixar aberto e esperar um minuto:** o painel se repinta a cada 60 s e o bloco tem de
      continuar aberto.
- [ ] **A tela Transferir prestações de contas** (31/08–01/09) — as duas abas, o Histórico, o
      desfazer, a pílula do Estoque e o termo de repasse.
- [ ] **O modal de ciência do repasse** e o aviso no sino, nas duas perspectivas. O repasse
      **desfeito** aparece no Histórico e **não cobra ciência**.
- [ ] **"Meus pedidos" dizendo onde o pedido nasce** (03/09).
- [ ] **O que ficou de 16–17/08 e nunca foi aberto:** a tela Estoque de TRs inteira, a etiqueta
      de reserva sem invadir o SGPe MÃE (`2022TR001511` e `2023TR000582`), a faixa de avisos no
      Dashboard e as logos da governança em 48 px. **A lista ponto a ponto está no HISTÓRICO,
      abaixo.**

⚠️ **E continua em aberto o `isMeuTR`**, que erra em 5 analistas (ids 19, 22, 23, 40 e 51): o
botão "Ver" não aparece nas TRs deles no Estoque. **Não corrigido de propósito** — o conserto
certo é no `sigpc-api`, e é decisão do Richard. Detalhe no HISTÓRICO.

---
---

# HISTÓRICO — o arquivo como estava em 17/08/2026
## ▶ 17/08/2026, 00h–01h30 — O FECHAMENTO

**Três commits nesta madrugada, todos de TELA. Nada foi gravado no banco.** As seções abaixo
descrevem esse trabalho e estão marcadas "16/08" porque é a sessão a que pertencem — a
publicação é que atravessou a meia-noite.

| commit | o que é | onde está descrito |
|---|---|---|
| `18a8e1e` `6130178` | as larguras finais do Estoque | *A tela Estoque de TRs* |
| `72d2d13` | **regressão:** a etiqueta de reserva vazava por cima do SGPe MÃE | *O DEFEITO QUE O RICHARD ACHOU* |
| `2f151f6` → `cbaf55c` | a **faixa de avisos** no Dashboard — errada, depois certa | *A FAIXA DE AVISOS* |

**Testes medidos em 17/08:** **18 suítes · 1.033 checagens · 0 falhas** neste repositório
(a suíte nova é a `teste_front_faixa.js`, 43). No `sigpc-api`: **19 · 949 · 0**.

### 🔴 O que atravessa para a próxima sessão — os dois itens

1. ✅ **O aviso id 6 FOI GRAVADO** em 17/08, às 09h54 — texto curto (233 → **179** caracteres)
   e o `fim` estendido de 18/08 para **31/08**, na mesma transação. **A faixa que passa na tela
   é essa**, e ela fica no ar até o dia 31 inteiro. Detalhe no `SESSAO.md` do `sigpc-api`.
2. **O `isMeuTR` erra em 5 analistas** — o botão "Ver" some no Estoque para os ids 19, 22, 23,
   40 e 51. **Não corrigido de propósito:** o conserto certo é no servidor
   (`MAX(analista_id)` no `resumo_tr`), e mata o `MAPA_PLAN_EST` desta tela. Detalhe na seção
   *ACHADO NA MESMA FUNÇÃO*, mais abaixo.

⚠️ **A tela Estoque continua NÃO ABERTA no navegador.** A lista do que olhar está em
*▶ O QUE OLHAR AO ABRIR O ESTOQUE* — e agora ela tem mais dois pontos: a **faixa no Dashboard**
(rolando, abaixo da Estrutura de Governança, com o rodapé vazio) e as **logos em 48 px**.

---

## ✅ O ESTADO EM 16–17/08/2026 — histórico

> ⚠️ **ESTE ARQUIVO ESTAVA DESATUALIZADO.** A seção "A NUMERAÇÃO DAS PARCIAIS: ONDE PARAMOS",
> mais abaixo, abre dizendo que nada foi gravado e que falta o Richard responder se o SIGEF
> permite duas parcelas no mesmo processo SGPe. **As duas coisas mudaram**: a pergunta foi
> respondida (**SIM** — 113 pares, 78 TRs, 465 PCs) e a renumeração **foi gravada** em 211 TRs.
> A seção fica como registro do que se mediu, não como estado. **O estado é este bloco.**

### A tela Estoque de TRs — ajustada em 16/08/2026

| | |
|---|---|
| cabeçalho | faixa **54 → 62 px** · logo do Estado **40 → 48 px** · caixa branca **220 → 240 px** |
| ícone de pessoas | entrou **antes** do ponto verde de "N usuários online" |
| tabela | **BAIXADAS e ANALISTA saíram** — 9 colunas viraram 7 |
| larguras | TR 14% · SGPe MÃE 20% · **Entidade 32%** · PCs 7% · NLs 7% · Status 10% · Ações 10% |
| entidade | **quebra em mais de uma linha** — o maior nome do acervo tem 81 caracteres |
| cabeçalho da tabela | centralizado; **as células não** |

⚠️ **O QUE FAZ O NOWRAP VALER É O `table-layout:fixed`, NÃO A LARGURA.** Percentual em
`<col>` é sugestão: sem o `fixed`, o navegador estica a coluna que o conteúdo exigir e a TR
quebra em duas linhas **mesmo com o `white-space:nowrap` escrito**. Por isso ele mora na
classe **`.tbl-est`**, e não no seletor `table{}` — que é global e vale para dezenas de
tabelas, inclusive o relatório CGE, que depende da largura automática. Há teste que falha se
o `fixed` vazar para o seletor global.

⚠️ **BAIXADAS e ANALISTA saíram porque a TR SOME desta tela quando é assumida** — as duas só
sabiam mostrar zero e travessão. Mas `t.baixadas` e `analista_nome` **continuam sendo lidos**:
é deles que saem o `statusDerivado` e o "esta TR é minha". Tirar a coluna não podia tirar o
cálculo, e há teste para isso.

⚠️ **O `colspan` acompanhou** — 9 → 7 em cinco lugares (carregando, erro, vazio, separador de
grupo). Um `colspan` que não acompanha **não dá erro**: as linhas apenas deixam de ocupar a
tabela toda.

⚠️ **A COLUNA STATUS FICOU — decisão do Richard, 16/08.** E com ela a conta das larguras não
fechava: ele passou TR 14 · SGPe 20 · **Entidade 42** · PCs 7 · NLs 7 · Ações 10, que somam
100% para **seis** colunas. Com o Status são **sete**.

**Os 10% do Status saíram da ENTIDADE**, pela regra de desempate que ele mesmo escreveu na
primeira mensagem: *"se faltar espaço, tira da ENTIDADE"*. Cinco das seis larguras dele estão
**intactas**; a entidade é a única que absorveu — 42% → **32%**. Há teste que fixa os cinco
números e a conta `42 − Status = Entidade`, para não derivarem depois.

⚠️ **E os 10 pontos a menos NÃO escondem nome nenhum.** Com a quebra ligada, a largura decide
quantas **linhas** o nome ocupa, não se ele aparece: o maior do acervo (81 caracteres) sai em
**2 linhas** tanto em 1920 quanto em 1366. Foi o `nowrap` com reticências que escondia — e
esse saiu.

A alternativa registrada, se um dia a entidade precisar de mais: **Status 8% e Ações 9%**
devolvem 3 pontos a ela. Os dois cabem — a maior etiqueta é "Diligência" e o maior botão é
"Assumir".

⚠️ **Um comentário meu dentro do template literal quebrou o arquivo** — armadilha 10, de novo,
e no mesmo dia em que ela aparece três vezes no `SESSAO.md` do `sigpc-api`. Escrevi crases em
volta de `0` num comentário HTML que mora dentro de uma `` `...` ``. O `node --check` pegou.

**Testes: 17 suítes · 977 passaram · 0 falharam**, incluindo a nova `teste_front_estoque.js`
(32 checagens).

⚠️ **O `teste_front_menu.js` quebrou por motivo falso e vale como lição:** ele recorta 1.600
caracteres a partir de `id="onlineBox"` e procura o rótulo lá dentro. O `path` do SVG novo
empurrou o rótulo para fora do recorte, e **três testes falharam sem que nada tivesse sumido
da tela**. Recorte de tamanho fixo sobre marcação que cresce mede o tamanho do bloco, não o
conteúdo dele. A janela foi para 2.800.

**Nada disso foi clicado por uma pessoa.** O mockup fiel está em `MOCKUP_ESTOQUE_AB.html`
(não versionado), com o logo real e as cinco maiores entidades do acervo.

### ⚠️ O DEFEITO QUE O RICHARD ACHOU ABRINDO A TELA — e é regressão dos ajustes

**A etiqueta "⏳ Aguardando aprovação — Fulano" transbordava por cima da coluna SGPe MÃE e
tapava o link do processo.** Visto na `2022TR001511`.

**A causa é o `table-layout:fixed`.** A etiqueta mora na célula da TR e era
`display:inline-block` com `white-space:nowrap` **no atributo `style`**. Enquanto a tabela
tinha largura automática, a coluna esticava para caber e ninguém via problema. Com o `fixed`
a coluna passou a ter **14% fixos** — e conteúdo `nowrap` que não cabe **não quebra e não é
cortado: ele vaza para fora da célula**, por cima da coluna vizinha.

**Medido:** a etiqueta tem 32 caracteres no caso real e **41** no pior (`— você  ✕ cancelar`).
A 9,5 px isso passa de 215 px, e os 14% dão ~196 px num conteúdo de 1400. **Nunca coube.**

**A correção:** o `nowrap` saiu da **célula** e foi para o **código da TR**. A célula pode ter
mais de uma linha; a etiqueta virou `display:block` e quebra dentro da própria coluna.

⚠️ **`display` e `white-space` foram para a classe `.est-reserva`, e NÃO ficaram no `style`:
estilo inline vence classe, e foi exatamente um inline que causou o defeito.** Há dois testes
que falham se voltarem para lá.

⚠️ **A lição, e ela vale para o resto da tela:** `table-layout:fixed` não é só sobre larguras
— ele tira da coluna a licença de esticar. **Toda célula que hospeda conteúdo de tamanho
variável precisa poder quebrar**, ou vaza por cima da vizinha sem erro nenhum. A da TR era a
única com esse caso, porque é a única que hospeda duas coisas.

**Sobre o nome:** o Richard leu "Silvana"; a reserva daquela TR é da **Juliana** (id 45).
**Não existe Silvana no cadastro** — conferido. O nome na etiqueta está certo.

### ▶ O QUE OLHAR AO ABRIR O ESTOQUE — a lista do Richard

O que os 38 testes **não** conseguem provar, porque nenhum deles desenha um pixel:

- [ ] **A TR não quebra em duas linhas.** É o ponto do `table-layout:fixed`. Se quebrar, a
      classe `.tbl-est` não pegou na tabela.
- [ ] **O SGPe MÃE também não.** O maior do acervo é `ADR05  00001022/2017`, com **dois
      espaços** depois do ADR05 — 20 caracteres. Procure uma TR de 2017.
- [ ] **A entidade aparece inteira**, em duas linhas quando o nome é longo. As maiores estão
      na `2024TR000906` (Diomicio Freitas / Pestalozzi de Criciúma) e na `2021TR002236`
      (APADAVIX de Xanxerê) — 81 caracteres cada.
- [ ] **A linha fica mais alta** onde a entidade quebra. É o preço, e é proposital.
- [ ] **O cabeçalho está centralizado e as células não.** TR, SGPe e entidade à esquerda;
      PCs e NLs no centro.
- [ ] **Não há mais coluna Baixadas nem Analista** — e a etiqueta de Status continua.
- [ ] **O separador de bloco** (`Livre — 788 TRs`) atravessa a tabela inteira. Se ele parar
      no meio, o `colspan` ficou para trás.
- [ ] **A faixa verde do topo está mais alta e o brasão maior**, sem encostar na borda
      arredondada da caixa branca.
- [ ] **O ícone de pessoas** aparece **antes** do ponto verde, no "N usuários online".
- [ ] **Numa janela estreita**, passe o mouse na entidade: o `title` continua lá.

- [ ] **A etiqueta de reserva não invade o SGPe MÃE.** Só duas TRs a têm hoje:
      **`2022TR001511`** (Juliana) e **`2023TR000582`** (Rafael). Ela tem de ficar em linha
      própria abaixo da TR, dentro da coluna.

⚠️ **Se o "Assumir" ficar apertado**, é a coluna Ações em 10% — e a saída registrada é
Status 8% + Ações 9%, que devolvem 3 pontos à entidade.

### A FAIXA DE AVISOS — a MESMA faixa, só que em outro lugar (16/08/2026)

| tela | onde |
|---|---|
| **Dashboard** | logo abaixo da **Estrutura de Governança**. **Rola igual.** O rodapé fica vazio. |
| demais telas | no **rodapé**, como sempre foi |

Altura **30 → 40 px**, corpo **12 → 13 px**. Mesma cor, mesma etiqueta **URGENTE**, mesmo
carrossel.

⚠️ **A PRIMEIRA VERSÃO DISTO ESTAVA ERRADA**, e fica registrado: eu fiz um **bloco parado**
com o texto inteiro, quebrando em linhas. O Richard corrigiu — **é a mesma faixa rolando, só
muda a posição.** O que a rolagem custa em legibilidade era problema meu, não dele.

⚠️ **A MARCAÇÃO É MONTADA UMA VEZ SÓ.** As duas posições saem da mesma função e da mesma
string; a única diferença permitida é a classe **`.faixa-dash`**, que acrescenta canto
arredondado e respiro — porque ali a faixa mora *dentro* do conteúdo, não colada na borda da
janela. **Há teste que compara as duas marcações caractere a caractere** e falha se elas
divergirem em qualquer outra coisa. Uma segunda montagem divergiria da primeira no dia em que
alguém mexesse numa e esquecesse a outra — foi o defeito dos dois ramos do cartão da parcial
(armadilha 19).

⚠️ **`.faixa-dash` só pode mexer em POSIÇÃO.** Cor, altura e animação vêm da `.faixa`, que é
uma só. Há teste que falha se ela ganhar `background`, `height` ou `animation` próprios.

⚠️ **NO DASHBOARD O RODAPÉ FICA VAZIO, de propósito.** As duas ao mesmo tempo seriam o mesmo
recado duas vezes na mesma tela, um passando por baixo do outro.

⚠️ **A `irDash` chama `faixaPintar()` DE NOVO, depois do `innerHTML`.** O `ativarMenu('dash')`
já chamou `faixaTela('inicial')` lá em cima, mas naquele instante o `#faixaBloco` **ainda não
existia** — o BODY só é reescrito depois. Sem a segunda chamada a faixa nasce vazia no
Dashboard e só aparece na recarga de 5 minutos. Há teste que compara as posições das duas
chamadas no arquivo.

**Suíte nova `teste_front_faixa.js` — 43 checagens**, e ela **executa a `faixaPintar` de
verdade** num DOM de mentira, em vez de casar texto do arquivo.
⚠️ **Para isso ela troca `let`/`const` de topo por `var`**: declaração léxica não vira
propriedade do contexto do `vm`, e o teste não conseguiria nem ler nem escrever `_faixas`.

### As logos da governança, e o botão da produtividade (16/08/2026)

**Logos: 30 → 48 px**, e a opacidade de `.55` para `.7` no mesmo movimento — **uma logo maior
e igualmente apagada só fica maior e apagada**. O `grayscale` fica: são quatro marcas de órgãos
diferentes, e em cor elas brigariam entre si e com o verde do sistema; a cor volta no *hover*,
uma de cada vez.

**O botão do Dashboard virou "SUA PRODUTIVIDADE"** (era "Produtividade (NL)"). O título da
tela, que também dizia "(NL)", ficou **"Produtividade"** — sem o "sua", porque o coordenador e
o superadmin veem a tela de todo mundo, não a deles.
⚠️ **O "(NL)" contradizia a regra do sistema:** a unidade de produtividade é a **PC baixada**
(CGE nº 727/2025), não a NL.

⚠️ **UM TESTE DO MENU QUEBROU POR CASAR A REDAÇÃO** — ele procurava a string
`Produtividade (NL)` para provar que o botão existia. Nada tinha sumido: só o nome mudou.
Passou a medir o **caminho** (`onclick="irProd()"` + `</button>`), e o rótulo é conferido num
lugar só. **É a lição 8 do dia acontecendo de novo.**

### ✅ O aviso id 6 — GRAVADO em 17/08/2026, às 09h54

**É o texto que passa na faixa agora.** `atualizar_aviso_id6.js --gravar`, no `sigpc-api`, com
as **9 conferências** passando depois da escrita, na mesma transação.

| coluna | antes | depois |
|---|---|---|
| `texto` | 233 caracteres | **179** — saíram 54 |
| `fim` | `2026-08-18` | **`2026-08-31`** |

Os primeiros **178 caracteres são idênticos**: saiu a cauda *": há orientações sobre o que
verificar e como proceder."* e entrou *"."*. **Não mudaram** `inicio` (17/08), `escopo`
(`urgente`), `ativo`, `grupo` nem `ordem` — trocar o texto e o prazo não pode mudar **quem** vê.

⚠️ **O `fim` é INCLUSIVO** — `lib/faixa.js` filtra `fim >= HOJE_BR`. A faixa passa o dia **31
inteiro** e some em **01/09**.

⚠️ **Vai por script e não por `psql`**: o texto tem travessão, acento e cedilha, e o parâmetro
`$1` do `pg` entrega a string byte a byte. Colar SQL com acento no terminal do Windows é como
se perde um "ç" sem ninguém ver.

⚠️ **O texto novo tem 179 caracteres e a faixa do Dashboard ROLA** — ela não precisa caber na
tela, e por isso encurtar não era sobre espaço, era sobre o recado. **Nada na tela mudou por
causa disto**; quem quiser conferir, é só abrir e ler o que passa.

### ⚠️ ACHADO NA MESMA FUNÇÃO, **NÃO CORRIGIDO** — o `isMeuTR` erra em 5 analistas

O `renderEst` decide se a TR é sua comparando **NOME**, com um mapa próprio no `index.html`
(`MAPA_PLAN_EST`). É a **mesma tabela de nomes curtos** que estava quebrada no
`sigpc-api/lib/assumir.js`, com **as mesmas três chaves mortas** — `Sandra Rocha`,
`Ana Claudia` e `Ana Leticia` são o nome CURTO, e a chave é o `U.nome`, que é o completo.

**Consequência:** para a Sandra Rocha (19), a Ana Claudia (22), a Ana Letícia (23), a Goreti
(40) e a Janaína (51), `meuNomePlan` sai errado e **`isMeuTR` devolve `false` nas TRs delas** —
o botão **"Ver" não aparece**, sai um travessão. Só se vê com o filtro fora de "Livre".

⚠️ **NÃO foi corrigido, e o motivo é que o conserto certo não é copiar o mapa arrumado.**
É a **armadilha 1**: comparar por `analista_id`, nunca por nome. Mas o
`GET /prestacoes_contas/resumo_tr` **não devolve `analista_id`** — só `MAX(analista_nome)`.
Fazer certo é mexer na rota do servidor, e isso é frente nova, não o defeito que o Richard
relatou.

**As duas saídas, para quando ele decidir:**
1. **Certa:** acrescentar `MAX(analista_id)` ao `resumo_tr` e trocar `isMeuTR` por comparação
   de id. Mata o `MAPA_PLAN_EST` inteiro — a tela deixa de ter opinião sobre nome.
2. **Paliativa:** arrumar as três chaves do `MAPA_PLAN_EST` como se fez no servidor. Resolve
   hoje e deixa a segunda cópia da mesma tabela viva, para divergir de novo depois.

### A tabela `estoque` — medida, e NÃO mexida

⚠️ **Ordem do Richard em 16/08: não mexer.** Ela continua no banco com 4.476 linhas. O que
segue é medição, para quando a decisão vier.

**Esta tela não depende dela.** O `index.html` faz fetch em **63 rotas**, e nenhuma é
`/estoque`, `/contadores` ou `/planilha_analista` — o Estoque de TRs lê
`GET /prestacoes_contas/resumo_tr`.

⚠️ **A função `carregarContadores()` do `index.html` NÃO chama a rota `/contadores`**, apesar
do nome: ela conta por `GET /prestacoes_contas?limit=1`, quatro vezes. Quem for procurar a
dependência pelo nome da função vai achar que existe uma e não existe.

O detalhe das oito rotas do servidor que tocam a tabela — inclusive a única com `LEFT JOIN`,
que é a que quebraria de verdade — está no `SESSAO.md` do `sigpc-api`, seção 3-B.

---

## ▶▶ 16/08 — A NUMERAÇÃO DAS PARCIAIS: ONDE PARAMOS

> ⚠️ **SEÇÃO HISTÓRICA — o estado dela está superado.** Ver o bloco acima. A pergunta do SIGEF
> foi respondida (**SIM**) e a renumeração foi gravada em 211 TRs.

**Nada foi gravado nesta frente** *(verdade quando isto foi escrito, de manhã)*. Um backup foi
criado; o `renumerar_sigef.js` NUNCA rodou com `--gravar`. Tudo abaixo é medição.

### A cadeia causal — o diagnóstico MUDOU no meio do dia

A auditoria culpou a migração. A medição aponta outra coisa:

```
migração         carregou o `Parcial` da CGE, CORRETO — 8.998 PCs
recarga 05/08    APAGOU 5.716 números e trocou 77   ← o estrago
renumeração      preencheu as lacunas pela ordem de `parcela_seq`
   13/08         ← é DAQUI que vem o padrão de 87,5% que a auditoria mediu
```

⚠️ **A prova:** o `_backup_baixada_20260805` (foto de ANTES da recarga) tinha exatamente
**8.998 PCs com número**, e é **idêntico linha a linha** ao `MAPA_PARCIAL_SIGEF.csv`, que o
Richard gerou em 16/08 direto do `ESTOQUE_FCEE_OFICIAL_DA_CGE.xlsx` e **nunca passou pelo
banco**. 8.998 de 8.998.

⚠️ **O mecanismo do estrago está em `recarga_exec.js:214-215`**: quando a planilha traz vários
rótulos para a mesma chave, ele grava `nums[0]` — **o MENOR**. Isso colapsa parcelas inteiras
num número só. E **207 de 3.071 linhas de planilha (6,7%) têm SGPe que não existe naquela TR no
banco** (100% das de 2025/2026), o que faz a chave falhar e o `MIN` colapsar o que sobra.

### Os números, medidos por DOIS agentes cegos um ao outro (bateram)

| | |
|---|---|
| escopo (`hoje ≠ mapa`) | **2.432 PCs · 211 TRs** |
| onde o gabarito de 05/08 tem opinião | 73 PCs · 30 TRs — **e discorda do mapa em 100%** |
| nas outras 2.359 | **B é mudo**: o número de hoje não veio de gabarito nenhum |
| a recarga de 05/08 | **6.128 PCs alteradas**: 5.716 apagadas · 77 trocadas · 335 criadas |

⚠️ **O teste "a planilha concorda com B em 64 de 73" NÃO VALE — é circular.** B, o
`processo_pc` do banco e o rótulo da planilha vêm todos da mesma leitura. **Toda medição que
escapa dessa chave põe a planilha ao lado do mapa da CGE:**

```
por VALOR (coluna que a recarga nunca leu)   73×1 · 121×8 · 224×3 · 358×12
maior número por TR (B só usou o menor)      41×3   ← os dois agentes, idêntico
conjunto de números por TR                   15×1 nas 30 TRs · 44×3 nas 211
```

E nas **6 chaves** em que a planilha ATUAL escreve mais de um número para o mesmo processo, **o
número do mapa está escrito nas 6** — B é sempre o menor.

**Ninguém renumerou nada entre 04/08 e 16/08:** 6 linhas mudaram, todas duplicata ou
apagamento, **zero tocam as 73**.

### ⚠️ A DECISÃO QUE FALTA, E É SÓ DO RICHARD

**O SIGEF permite duas parcelas no mesmo processo SGPe?**

- **SIM** → o mapa está certo e a correção vale para as 2.432.
- **NÃO** → o mapa parte processos indevidamente em **114 casos (78 TRs)**, e o lote precisa ser recortado.

**Nenhum agente leu o SIGEF** — e o `ESTOQUE_FCEE_OFICIAL_DA_CGE.xlsx` não está no
repositório. Os dois auditaram o CSV derivado, não a fonte.

⚠️ **E a armadilha 16 não é verdade literal:** o `parcial_num` de hoje já tem **10 casos** de
um processo com mais de um número. A regra "uma parcial = (tr, processo_pc)" só sobrevive
porque a chave crua **não normaliza** — `SCC8214/2024` e `SCC 00008214/2024` contam como
processos diferentes.

### O que BLOQUEIA a gravação hoje (achados do revisor e do qa-banco)

| # | achado | tamanho |
|---|---|---|
| 1 | **split** — o mesmo processo em várias parciais | 114 processos · 78 TRs · 297 PCs (94 baixadas · 87 com parecer · 10 no C.I.) |
| 2 | **parcelas mistas** (parte baixada, parte aberta) — hoje existem **0** | **12**, e numa delas 2 PCs nunca analisadas somem dentro da faixa azul do C.I. |
| 3 | **o histórico não acompanha o número** | 76 linhas em 64 parciais mudam de dono; **29 diligências voltam a ser cobradas pelo sino** |
| 4 | **o `-1` entra em parcela real** | 2 → **42 parciais**, 39 TRs; 3 já com parecer; uma de R$ 169.361,85 |
| 5 | a correção **desfaz 2 fusões legítimas** | `2022TR000791` e `2022TR000967` — o mesmo processo em duas grafias, 12 PCs baixadas |

### Os 4 defeitos do `renumerar_sigef.js` (NÃO corrigidos — o escopo pode mudar)

1. ⚠️ **O `--gravar` DESTRÓI o backup.** O `_backup_parcial_num_20260816` que está no banco
   tem **11 colunas**; o script faz `DROP TABLE` e recria com **7**, perdendo `parecer_tipo`,
   `enviado_ci`, `ci_situacao` e `analista_id` — a única prova de que o C.I. não foi tocado.
2. **A trava do item 0 é lint, não guarda:** roda um regex sobre uma constante do próprio
   arquivo. **Não pode disparar com dado nenhum** — e imprime `✓`.
3. **A conferência pós-escrita compara 1 de 13 colunas** (só `baixada`), porque o backup dela
   guarda 7.
4. **A janela usa 2 sinais; o `janela_livre.js` usa 4.** Uma analista registrando resposta de
   diligência deixa o `janela_livre` OCUPADO e este script **LIVRE** — armadilha 17 ao contrário.

⚠️ **E a validação que teria abortado a rodada JÁ EXISTE no repositório:**
`corrigir_processo_pc.js:224-227`, `'parcela partida em 2 numeros'`. Hoje dá **0**; depois do
lote daria **114**.

### Os arquivos desta frente

| arquivo | onde |
|---|---|
| `AUDITORIA_SIGPC_2026-08-16.md` | versionado |
| `PARECER_FONTES_2026-08-16.md` | versionado — o parecer da dupla verificação |
| `renumerar_sigef.js` | **NÃO versionado** — tem os 4 defeitos acima |
| `MAPA_PARCIAL_SIGEF.csv` · `TRS_AFETADAS_176.csv` | **no `.gitignore`** |
| `GRUPO 1/2/3 ... .xlsx` (16/08) | na raiz, não versionados |
| `_backup_parcial_num_20260816` | **no banco, 14.652 linhas, 11 colunas — NÃO APAGAR** |

⚠️ **O `MAPA_PARCIAL_SIGEF.csv` NÃO se reconstrói a partir do banco.** Se sumir, reimportar a
planilha da CGE.

⚠️ **O pacote `xlsx` NÃO está instalado no projeto** — logo o `recarga_exec.js` **não roda
hoje** neste diretório. Os agentes instalaram fora, em pasta temporária.

### A ordem de trabalho da próxima sessão

1. **Responder a pergunta do SIGEF** (split). Sem ela, o resto é trabalho perdido.
2. Recortar o lote pelos 5 bloqueios acima — **não só por fusão, como foi feito na primeira vez**.
3. Corrigir os 4 defeitos do script.
4. Dry-run · dupla verificação · gravar em janela livre · **conferir de novo DEPOIS de gravar,
   na mesma transação, com `ROLLBACK` se não bater**.

---

## ▶ A PRÓXIMA SESSÃO COMEÇA AQUI (fechado em 14/08/2026)

Cinco frentes, na ordem em que o Richard as deixou.

### 1. ⚠️ AUDITORIA: as planilhas dos analistas × a base do sistema — **SÓ LEITURA PRIMEIRO**

**Vários analistas relatam divergência de número de PCs e de VALORES** entre a planilha deles
e o que o sistema mostra. Isso ainda não foi medido nesta sessão.

⚠️ **NÃO "consertar" o banco para bater com a planilha.** Já há um caso medido em que a
PLANILHA é que estava errada: a coluna "Número de PCs" do **Grupo 2** está inflada — 44,7% das
chaves com razão exatamente 2,0 contra o banco, e o gabarito de 1.899 da aba Monitoramento
saiu da mesma coluna (o real apurado é ~1.217). G1 e G3, lendo o mesmo banco com a mesma
regra, deram 96,4% e 93,1% de razão 1,0. Prova aritmética guardada: a `2020TR000681` declara
26 parciais somando **98 PCs**, e a TR inteira tem **53 PCs** no banco.

**Ordem de trabalho, e ela importa:**
1. **Medir sem escrever.** Por analista e por TR: contagem de PCs e soma de valores, dos dois
   lados, com a chave explícita (TR + processo SGPe, ou `codigo_pc`).
2. **Separar quem diverge de quanto diverge.** Razão 2,0 é linha duplicada na planilha; razão
   quebrada é outra coisa.
3. **Levar a lista ao Richard antes de qualquer `UPDATE`.** Escrita continua exigindo ordem
   expressa.

⚠️ **A base é a fonte única** (`prestacoes_contas`, 14.652 linhas). A planilha é o que se
audita, não o gabarito — salvo se o Richard decidir o contrário caso a caso.

### 2. Ativar o time de agentes
Os quatro estão prontos em `.claude/agents/` e o fluxo em `TIME_AGENTES.md`. **Nada foi
acionado.** Falta o Richard mandar, e decidir o `deny` do `settings.local.json` e se entra o
plugin `pr-review-toolkit`.

### 3. As 14 telas que ninguém clicou
A lista está em "O QUE O RICHARD IA TESTAR NA TELA", mais abaixo. As duas últimas são as mais
novas: **os dois papéis** e o **agir pela conta**.

### 4. As 3 PCs FINAIS com `parcial_num = '1'`
`2021TR001689` (Grazielly) · `2021TR002133` (Richard) · `2023TR000048` (Elisandra).
A FINAL ficou agrupada junto da parcial 1, e como toda rota grava por
`WHERE tr = ... AND parcial_num = ...`, **um parecer na parcial 1 dessas três baixaria a FINAL
junto**. É correção de DADO, não de código — com o comando na tela antes.

### 5. A Caroline sem cadastro
Meta 27 vigente, **sem linha em `usuarios`**. É a única nessa situação, e agora tem
consequência prática: se alguém a indicar no motivo 1 do pedido de devolução, **a aprovação
trava** com o motivo escrito na tela (é o que se decidiu, em vez de mandar a TR ao estoque em
silêncio).

---

## ⚠️ O SISTEMA ESTÁ ABERTO

Modo preparação **desligado**. Modo manutenção **desligado**. A equipe trabalha.

**Os dois interruptores ficam em Configurações**, em abas separadas. Se ligar a manutenção,
lembre: **ninguém além do superadmin entra** — nem coordenador, nem o Controle Interno.

---

## O QUE FICOU PRONTO EM 12–14/08

### 🔒 Modo manutenção — a janela segura de escrita
Antes dele, gravar dependia de pedir no WhatsApp e esperar 30 min de inércia do
`ultimo_acesso`. **Funcionou na primeira: de 3 analistas online para 0.**

⚠️ **São TRÊS mecanismos, e os três são necessários:**
1. `sessao_fim = clock_timestamp()` em todos menos o superadmin, na MESMA transação;
2. **`PATCH /usuarios/:id` recusa quem não é superadmin** — SEM ISTO O ITEM 1 NÃO SEGURA:
   o heartbeat de `onlineCarregar()` bate de 5 em 5 min e ressuscitaria a pessoa na lista;
3. o polling de `config_sistema`, agora de 20 s, derruba a tela de quem está dentro.

⚠️ **O superadmin NÃO bloqueia a janela** — nem no `janela_livre.js`, nem no
`renumerar_parcial_num.js`. Ele nunca é derrubado (de propósito), mas é o mesmo que ligou o
modo e roda o script. **Custou uma recusa real:** um dos dois critérios tinha sido corrigido
e o outro não. **Se houver dois critérios de "pode gravar", eles têm de ser o mesmo.**

```bash
node janela_livre.js            # uma foto
node janela_livre.js --vigiar   # até dar LIVRE
```

### ✅ As parciais foram renumeradas — 1.189 PCs em 70 TRs
`parcial_num` voltou a ser o número do SIGEF em **1.545 das 1.554 TRs**.

⚠️ **NÃO renumerar por `parcela_seq`** — era o caminho escrito aqui e foi **medido e
reprovado**: reescrevia 592 parcelas cujo rótulo veio da planilha do analista, que é o número
do SIGEF. Na própria 704, 44 dos 48 rótulos conferidos mudariam. `parcela_seq` **não é a
ordem do SIGEF**.

O que se fez: **preservar o rótulo da planilha e preencher só a lacuna.**
⚠️ **O gabarito é o `_backup_parcial_num_20260805`. Não apagar.**

9 TRs ficaram de fora, e nenhuma é numeração: 7 têm rótulo acima do total (o SIGEF tem
parcela que a base não tem) e 2 têm o mesmo SGPe em duas grafias.

### ↩ Devolver a TR ao estoque — só superadmin
Existia desde 30/07 e tinha sido **perdida de vista**: em 05/08 a Minha Planilha foi
reconstruída e levou o botão junto. Voltou no cartão da TR, agora com rota transacional,
guarda no servidor e rastro em `parcela_historico`.

⚠️ **PC no ciclo do C.I. BLOQUEIA a devolução** (opção B). E atenção: **as 13 PCs no C.I. são
todas `baixada = true`** — encaminhar ao C.I. já conta como baixa. A primeira versão procurava
C.I. só entre as não baixadas e **a trava nunca disparava**.

### ✎ Corrigir o processo SGPe — em todas as telas
O lápis entrou no `procHtml`, que é usado em 11 pontos: aparece nas onze de uma vez.
`processo_mae` também é editável. **Automático primeiro, manual depois** — o campo de colar
o link só aparece quando mapa + cache + SGPe ao vivo não resolvem.

⚠️ **`origem = 'MANUAL'` é imune ao job**, em DOIS lugares: `montarFila` não o põe na fila e
as três gravações de `lib/sgpe-lote` recusam sobrescrevê-lo.

**Resultado:** `processo_pc` 14.419 de 14.652 com link (98,4%) · `processo_mae` 14.501 (98,9%).

### ✓ Assumir a TR numa transação — o último PATCH-por-PC
Era o mesmo defeito da devolução, e o único lugar que restava. `POST /tr/assumir`.

⚠️ **A trava de limite era conferida a cada PATCH.** Numa TR de 83 PCs, 83 consultas — e
como a PC 1 já contava como assumida, o limite podia estourar no meio e deixar a TR pela
metade. Agora é conferida UMA vez, dentro da transação.

O **nome curto** (`analista_nome` = "Richard", não "Richard Motta Coelho") saiu do
`index.html` e virou `lib/assumir.js`.

### 🔍 Busca global — localizar qualquer TR ou PC numa tela só. SÓ SUPERADMIN.
Menu → bloco Superadmin. Um campo, seis identificadores (TR, PC, NL, processo mãe,
processo da PC, entidade). **Um card por TR, nunca uma linha solta.**

⚠️ **A guarda é da ROTA, não do menu.** `GET /busca_global` devolve o acervo de qualquer
analista — o oposto do recorte por `analista_id` das outras telas. O perfil vem do banco;
coordenador, analista e C.I. levam 403 (conferido em produção).

⚠️ **`tr = ANY(...)`, e não o termo no `WHERE` das agregações** — o defeito de 09/08. Com o
filtro junto, as contagens veriam só as linhas que casaram: a 2019TR000168 tem 20 PCs e
aparecia com 2.

⚠️ **O prazo antigo quase voltou.** O `pg` devolve `date` como **objeto `Date`**, e
`String(d).slice(0,10)` num Date dá `"Thu Mar 31"` — que, comparado como TEXTO contra
`"2026-08-01"`, PASSA no corte. A busca chegou a mostrar **9.221 dias de atraso**. Corrigido
com `paraIso()`. Ver a armadilha 18: é a mesma família de erro do fuso.

**O encaminhamento** sai por `window.print()` (PDF) e `Blob application/msword` (.doc), com o
cabeçalho institucional do CGE. **Sem biblioteca nova** — o `package.json` continua com seis
dependências. Um botão abre a janela com o documento pronto e as duas ações no topo, que
somem no papel.

**A coluna "Código da PC" é dimensionada pela FINAL**: `2018TR000093-PFINAL` tem 19
caracteres contra 12 de `2018PC000015`. `nowrap` na tela e no papel.

⚠️ **"No estoque desde" só nas devolvidas.** Das 795 TRs sem dono, **793 nunca tiveram um** —
para essas não existe "desde quando", e usar a data da carga (18/07, igual para todas) daria
um número que parece resposta e não é.

### 🏛 O botão do C.I. nunca tinha acendido — e agora são TRÊS passos
**O defeito mais caro do dia, e nenhum dos 15 testes pegava.** Sem parecer o botão
"Encaminhar ao CI" ficava cinza; **com** parecer a parcial virava `baixada` e caía no ramo
verde do cartão, **que não desenhava botão nenhum**. Medido: **4.259** parciais no cinza,
**2.181** sem botão, e **zero** encaminhamentos feitos por analista em produção — as 13 PCs
que estão no C.I. entraram pela `migracao_ci` de 05/08, não pela tela.

⚠️ **A trava do servidor NÃO mudou.** `POST /parcela/ci` continua exigindo parecer prévio.
O que se corrigiu foi a tela esconder o botão depois que o parecer existe.

⚠️ **Encaminhar ao C.I. é OBRIGATÓRIO** (decisão do Richard). A primeira versão do texto dizia
"opcional — a parcial já está baixada" e convidava a parar na baixa.

```
Passo 1 de 3  âmbar  registre o parecer para poder baixar   · botão cinza COM o motivo ao lado
Passo 2 de 3  verde  baixada em <data> · parecer: <tipo>    · botão ATIVO
                     FALTA ENCAMINHAR AO CONTROLE INTERNO
Passo 3 de 3  azul   No Controle Interno desde <data> · aguardando retorno há N dias
                     o retorno do CI não cancela a baixa
```

⚠️ **Havia uma SEGUNDA tela com a regra invertida** — o detalhe da TR (o "Ver PCs"):
`!p.baixada && !p.enviado_ci` escondia o botão justamente quando a PC era baixada. E era pior:
gravava por **PATCH de UMA PC** (o encaminhamento é por PARCELA, e há parcela com 7), montava
`baixada`/`data_baixa` **no navegador** com o relógio de quem clicou, e por ser PATCH genérico
**passava por fora da trava do parecer**. As duas telas agora decidem pelo mesmo `pPasso` e
gravam pela mesma rota transacional.

### 🏛 Etiqueta "N sem C.I." na lista — a dívida que ninguém enxergava
Encaminhar é obrigatório e **nada exige**: sem trava no servidor, sem sino, sem relatório. O
cabeçalho da TR agora mostra `🏛 3 sem C.I.` em âmbar — **inclusive na TR "✓ concluída", e
principalmente nela**, que é onde a dívida se perde de vista.

**2.181 parciais em 550 TRs vão nascer com a etiqueta.** A contagem é conferida contra o banco
em `prova_banco_ci.js` — contagem que diverge do banco é pior que contagem nenhuma.

### ↩ O analista PEDE a devolução da TR — e quem devolve é a coordenação
Tabela nova **`solicitacao_devolucao`** (criada em 13/08, com autorização). Botão no cartão da
TR, ao lado do "Ver PCs"; modal com **seis motivos** em lista fechada e justificativa
obrigatória em todos; fila em **Aprovações**, aba nova ao lado de "Vagas extras".

⚠️ **TABELA SEPARADA, e o motivo é medido.** Sete consultas de `lib/limite-tr.js` leem a
`solicitacao_vaga` **sem filtro nenhum** — um pedido de devolução gravado lá viraria +1 no
limite de quem pediu para devolver, reservaria no Estoque a TR que ele quer largar, e seria
consumido como autorização para furar o limite. Nada disso dá erro. **Não fundir as duas.**

⚠️ **A TR continua contando no limite enquanto o pedido está pendente** — o pedido não toca em
`analista_id`. Só a aprovação devolve. Senão qualquer um abriria vaga só pedindo devolução.

⚠️ **DOIS CAMINHOS NA APROVAÇÃO.** Motivo 1 ("já estava em análise por outro antes de
01/08/2026") vai **direto para o analista indicado**, pela `lib/assumir.js` — mandar ao
estoque uma TR que tem destino a entrega a quem chegar primeiro. Os outros cinco vão ao
estoque, pela `lib/devolucao.js`. **O limite NÃO é conferido** na transferência: 29 dos 44
analistas já estão em 6 ou acima, e a trava vale no *ato de assumir*. A carga do indicado
aparece no cartão e quem decide é o coordenador.

⚠️ **Indicado sem cadastro ativo BLOQUEIA** (409) em vez de cair no estoque em silêncio. O
primeiro caso real é a **Caroline** — meta vigente, nenhum cadastro.

⚠️ **O solicitante não decide o próprio pedido.** Exceção: o superadmin, e aí o histórico
ganha `AUTODECIDIDO — quem pediu e quem decidiu sao a mesma pessoa`.

**Provado contra o Postgres em dois ciclos completos, e os dois revertidos por inteiro:**
o índice único (segundo pedido → 409), a segunda decisão (→ 409), a `dt_inicio_analise`
preservada, a baixada que fica no nome de quem baixou, o sino nas duas decisões, e a marca do
autodecidido. **Nada sobrou no banco.**

### 🛠 AGIR pela conta do analista, e os DOIS PAPÉIS do superadmin (14/08)

**O "Ver como analista" deixou de ser leitura.** Sem agir não se dava suporte nenhum.

**Autoria dupla:** `parcela_historico.executado_por` (ALTER de 14/08). `analista_id` é o
**dono**, `executado_por` é **quem clicou**, e fica **NULO quando são a mesma pessoa** — nulo
quer dizer "foi ele mesmo", e o que importa achar é a linha em que os dois diferem.

⚠️ **O `fetch` do `index.html` deixou de BLOQUEAR e passou a CARIMBAR**, trocando DOIS campos:
`analista_id = alvo().id` e `executado_por = U.id`. Trocar só um gravaria a baixa na
produtividade errada. É num ponto só porque são **56 chamadas de escrita** no arquivo.

**10 ações liberadas · 4 travas ficam:** estornar · devolver TR · solicitar devolução ·
decidir no C.I. Não são "leitura" — são decisões **sobre** o trabalho dele. Há teste que falha
se aparecer uma quinta.

**Os dois papéis:** `usuarios.papel_ativo` + tabela `papel_historico`.
`analista` (padrão ao entrar, **14 itens somem do menu**) · `tecnico` (tudo, e o único que
age por outro). O reset ao entrar é do SERVIDOR.

⚠️ **UMA REGRA SÓ, dos dois lados: `perfilEfetivo`.** No papel analista o superadmin **é**
analista em toda parte — 10 pontos no servidor, e o menu recebe o usuário já com o perfil
efetivo. Resolve sozinho o ponto que passaria batido: as **seis rotas de "coordenador OU
superadmin"**, onde tirar só o `superadmin` da lista não bastaria, porque ele não é
coordenador de ninguém.

⚠️ **Quatro rotas liam o `perfil` do CORPO** — excluir usuário, excluir no repositório e os
dois estornos. Passaram a ler do banco.

**Provado contra o Postgres, os dois revertidos:** autoria dupla 11/11 (dono 18 + executor 4
gravados; analista mandando `executado_por` → 403) e papel 14/14 (no papel analista a busca
global e a prévia da devolução → 403; depois da troca, respondem).

### 👁 "Ver como analista" — o botão morto pintado de vivo
O `vcOff()` mandava a opacidade num **segundo atributo `style=`**, e o HTML fica com o
primeiro: os sete botões do modo apareciam com a cor inteira e **não respondiam ao clique**.
Quem pinta agora é o CSS (`.btn-acao:disabled`). **Eles nunca gravaram** — são três travas:
o `disabled`, a conferência dentro das funções, e o `window.fetch` envolvido, que bloqueia
todo não-GET para a API (menos o logout).

A faixa dizia *"no nome dela"* e supunha o gênero de quem estava sendo visto. Agora é
**"no nome deste analista"**.
---

## ⚠️ OS 11 PROCESSOS SGPe QUE FICARAM PENDENTES

**Resolvem pelo lápis, quando alguém tiver o número certo do SGPe.**

**O SGPe responde que NÃO TEM o processo** (6 textos):
```
ADR05 00011020/2017   21 PCs      ADR07 1064/2016      21 PCs
SDR05 001028/2017     21 PCs      SDR13 458/2017       21 PCs
fcee 6291/2024         7 PCs      fcee 7198/2024        1 PC
```

**Nenhuma leitura plausível existe** (4 textos):
```
AR355478172           21 PCs   333 candidatos testados, nenhum confirma
ADR19 0011181.2017    19 PCs   só ADR19 1181/2017 existe — e é de OUTRA TR
ADR 1181/2017         19 PCs   "ADR" sem o número da regional
ER221202154            4 PCs   só na coluna mãe; "ER" fora do mapa de 183
```

**AMBÍGUOS — vários anos confirmam** (2 textos):
```
SCC7537    2 PCs   existe em 2017, 2019, 2020, 2021, 2022, 2023 e 2024
SCC 6579   1 PC    existe em 2020, 2021, 2022, 2023, 2024 e 2025
```

⚠️ **Estes dois quase entraram por engano.** A primeira versão testou UM ano — o da TR —,
confirmou, e ia corrigir como se fosse certeza. **Um candidato só esconde a ambiguidade em
vez de revelá-la.** Link para o processo errado não dá erro na tela: ninguém percebe.

---

## AS LIÇÕES QUE CUSTARAM CARO EM 13/08

**1. Confirmar no SGPe e não gravar no cache deixa o texto certo e a tela SEM LINK.**
Foi o estado em que as correções ficaram até se perceber. O cache é o que faz o link existir.

**2. A conferência de fusão dava alarme falso** na coluna mãe e nos textos já corretos: ela
pergunta se o `processo_pc` da TR já tem aquele valor — e tem, porque é o da própria PC.
Fusão só existe para `processo_pc`, e nunca quando `de` é igual a `para`.

**3. Validação que compara com backup antigo acusa o que rodadas anteriores fizeram de
propósito.** Compare com uma **foto do início da rodada**.

**4. `AT TIME ZONE` sozinho está errado para coluna `timestamp` que guarda UTC.** Mostrou
03:31 às 21:31. O certo são dois passos:
`(col AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo'`.

**5. Um `kill` pode não pegar.** Uma rodada que mandei parar seguiu até o fim e só notificou
depois. Não causou dano porque era dry-run, mas foi sorte de sequência. **Confirme que o
processo morreu antes de seguir.**

---

## COMO TESTAR

```bash
for t in teste_*.js; do node $t; done    # 15 suítes do front
```

No `index.html`, extrair os blocos `<script>` para um arquivo temporário e rodar
`node --check` — o comando não roda em HTML.

⚠️ **Antes de publicar, rode contra o banco.** Foi o que pegou todos os defeitos de 10–13/08,
inclusive a trava do C.I. que nunca disparava — invisível para o dublê.

⚠️ **Nunca teste função que abre a própria transação de dentro de outra** (regra 11).

## O QUE ESTÁ NO AR

`sigpc-api` e `sigpc-gt` — `main` e `feature/baixa-por-parcial` iguais nos dois.
**Produção roda da `feature` na API; o GitHub Pages publica da `main`.** Publique nas duas.

## BACKUPS DE 12–13/08 — não apagar

```
_backup_parcial_num_20260805     ← o GABARITO dos números do SIGEF
_backup_parcial_num_20260813     ← antes da renumeração
_backup_parcela_historico_20260813
_backup_processo_pc_20260813     ← antes da correção dos processos
_backup_processo_20260813b       ← antes da rodada final
```

## ⚠️ O QUE O RICHARD IA TESTAR NA TELA (13/08, fim da manhã)

Ele ficou de abrir os três primeiros e avisar o que encontrasse. **Se este chat é novo,
pergunte o resultado antes de mexer nessas telas.**

1. **Assumir uma TR** — a mais usada, e reescrita em 13/08. A TR **inteira** tem de aparecer
   na Minha Planilha, não parte dela. No erro o modal fica aberto com o motivo.
2. **Devolver a TR ao estoque** — ✅ **ELE TESTOU, E FUNCIONOU.** Há duas devoluções reais no
   histórico: `2020TR001601` e `2020TR001599`, ambas com motivo "TESTE DO SISTEMA", 2 PCs
   cada. As duas estão livres no estoque — se ele quiser desfazer, é só reassumir.
3. **O lápis do processo SGPe** — em 11 telas; âmbar onde não há link.
4. **A busca global** — nunca aberta. É a tela mais nova.
5. **Modo manutenção** — ficou para o **fim do expediente**: ligar derruba a equipe na hora.

Faltam também, com menos risco: o cabeçalho do cartão ("assumida em" + ✨ NOVA) e a seta do
indicador de online (fechar pelo botão, clicando fora e com Esc).

**E o que entrou depois, à tarde — nada disso foi clicado por uma pessoa:**

6. **Os três passos da parcial.** O caso direto é o do **Rafael**: `2020TR001230` e
   `2021TR000777`. A faixa verde tem de **cobrar** "falta encaminhar ao Controle Interno", e o
   botão azul ao lado tem de estar **ativo**. Se ele encaminhar, a parcela pula para o passo 3
   — seria **o primeiro encaminhamento feito pela tela na história do sistema**.
7. **A etiqueta `🏛 N sem C.I.`** no cabeçalho da TR, na lista. 550 TRs a têm.
8. **O detalhe da TR ("Ver PCs")** — o "Enviar ao CI" agora aparece nas PCs **baixadas**, e o
   `title` avisa que vai a parcela inteira.
9. **"Ver como analista"** — os botões nascem apagados **de verdade** agora.
10. **O modal do limite atingido** — faixa `#C62828`, o "Assumir" sai da tela, o pedido vira
    botão de largura total. ⚠️ **O print nunca chegou** — se ele mandar, ajustar só `limiteAviso`.
11. **⚠️ Solicitar devolução, ponta a ponta.** O botão no cartão, o modal dos seis motivos, e
    a fila em Aprovações. **O caminho do MOTIVO 1 — a transferência direta — só foi provado
    por unidade**: os dois ciclos reais usaram o motivo 4, que vai ao estoque. Para exercitar
    o 1 é preciso indicar alguém com cadastro ativo.
12. **A etiqueta `🏛 N sem C.I.`** — 550 TRs a têm.
13. **⚠️ Os dois papéis.** Entre normalmente: você nasce **analista**, e as telas de
    coordenação e superadmin **não estão lá**. A caixa fica no pé do menu → "🛠 Virar técnico
    do sistema" → o menu cresce e a faixa azul aparece no topo.
14. **⚠️ Agir pela conta de um analista** (só no papel técnico). Confira no console do
    navegador a linha `[agir como] POST /parcela/... · dono X · executor 4` a cada escrita —
    se ela não aparecer, o carimbo não pegou. E confira no histórico da parcela que o
    trabalho ficou no nome dele.

---

## ⚠️ O QUE AINDA NÃO CHEGOU

O **print do mockup** e o **modelo do documento em PDF** que o Richard ia colar na pasta.
Procurados nos dois repositórios em 13/08: não estão lá. O layout do encaminhamento seguiu a
especificação escrita dele e o cabeçalho do relatório CGE. **Quando o modelo chegar, ajustar
SÓ o documento** () — a busca e o card não mudam.

---

## O QUE FALTA

- [ ] **Os 11 processos SGPe** acima — pelo lápis, com o número do SGPe em mãos.
- [ ] **`ZZ TESTE TRAVA`** continua entrando no sistema. Se não é conta de teste, olhar.
- [ ] **A fusão de parcelas** está implementada e testada por unidade, mas **nunca foi
      exercitada contra o banco** — não há hoje correção que a dispare.
- [ ] **Scheila (49)** e **Eduardo (52)** — sem CPF, não entram. Eduardo também inativo.
- [ ] **A sua senha** ainda é a antiga, agora em bcrypt. Esteve pública por meses.
- [ ] **A camada de autorização** continua sendo o buraco de fundo: quem montar um pedido
      HTTP e se declarar coordenador passa. Preparação e manutenção são cortina, não tranca.
- [ ] **11,3 MB por tela** — seis telas ainda baixam o acervo inteiro para filtrar no cliente.

### O que ficou parado esperando o Richard

- [x] ~~Solicitar devolução de TR pelo analista~~ — **PRONTO em 13/08.** Ver a seção própria
      acima. Falta só **clicar na tela**.
- [ ] **3 PCs FINAIS com `parcial_num = '1'`** — `2021TR001689` (Grazielly), `2021TR002133`
      (Richard) e `2023TR000048` (Elisandra). A FINAL ficou agrupada junto da parcial 1, e
      como toda rota grava por `WHERE tr = ... AND parcial_num = ...`, **um parecer na parcial
      1 dessas três baixaria a FINAL junto**. É correção de DADO, não de código.

### O time de agentes está pronto na gaveta
`.claude/agents/` tem os quatro — `orquestrador`, `coder`, `qa-banco`, `revisor` — e o fluxo
está em `TIME_AGENTES.md`. **Nada foi ativado.** As três regras do Richard (13/08) estão no
`CLAUDE.md` e repetidas dentro do prompt de cada um: nenhum agente escreve no banco, nenhum
decide regra de negócio, nenhum publica.
