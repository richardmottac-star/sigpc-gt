# SIGPC-GT — ESTADO EM 26/10/2026

Cole no início do chat novo. Este arquivo é o que basta para retomar.

> ⚠️ **Os blocos anteriores ficaram para trás.** Continuam úteis como registro do que se mediu —
> **não como estado**. O estado é o bloco de **26/10**, logo abaixo: o Estoque passou a avisar
> quais TRs já têm baixa no SIGEF. O de **23/10** vem em seguida (as cinco TRs e o relatório de
> TRs do analista, **os dois já publicados**), o de **20/10** com o relatório do 4º trimestre
> refeito, e o de **19/10** com a causa da divergência com a CGE.

---

## ▶ 26/10/2026 — O ESTOQUE PASSOU A AVISAR O QUE O SERVIDOR JÁ SABIA

**Começou com uma reclamação no grupo do WhatsApp** e terminou num achado de produto: havia
**255 prestações em 120 TRs** no Estoque com a baixa **já registrada no SIGEF**, e o analista só
descobria **depois de assumir**. ✅ **Publicado e conferido na tela.**

---

### 1. O QUE TRAVOU — e o botão estava certo

A Graciane assumiu duas TRs em 25/10, achou as prestações já baixadas e pediu devolução das duas.
Os pedidos ficaram presos: o coordenador via o **Aprovar aceso** e ele nunca funcionava.

⚠️ **A CAUSA NÃO ERA DEFEITO DA REGRA.** Nos dois pedidos o campo *"quem já analisava esta TR"*
foi preenchido com **ela mesma** (`indicado_id = 41`). O motivo *"já estava em análise por outro
analista"* manda a TR **direto para o indicado** — indicar a si mesma é transferir a TR de alguém
para essa mesma pessoa, o que não é nada. `impedimentoIndicado` recusa, e está certo.

⚠️ **E A LISTA NASCE EM BRANCO** — não foi a tela que escolheu por ela. Nas justificativas ela
aponta outras pessoas: *"Richard"* numa, *"Marcio Valvassori"* na outra. **Marcio Valvassori não
existe no cadastro**, então nem com a escolha certa o pedido passaria.

⚠️ **O DEFEITO REAL ERA O MOMENTO DA CONFERÊNCIA:** o pedido impossível **era aceito**, entrava na
fila, e só travava quando alguém clicava em Aprovar. **É a armadilha 12 pelo avesso** — não um
botão aceso que não grava, mas um pedido aceito que a aprovação sempre recusa.

✅ **O destravamento é `✕ Recusar`** — a recusa não passa pela regra do indicado. Só o Aprovar trava.

### 2. O PENTE FINO — 274, e não 1.828

⚠️ **O NÚMERO BRUTO MENTE.** "PC não baixada com `data_baixa_sigef`" dá **1.828** — e **1.378 delas
são `VA`**, que **não é baixa** (armadilha 28). Levar esse número adiante seria repetir, por dentro,
o erro que a CGE apontou por fora.

✅ **O número que se sustenta é o da tag do próprio sistema**, `ABERTA_COM_BAIXA_SIGEF` —
*"Baixada no SIGEF, aberta aqui"*:

| | |
|---|---|
| PCs com a tag | **274** |
| **livres no estoque** | **255, em 120 TRs** |
| com dono | 19, em 8 TRs |
| já declaradas pelo analista | **0** |

⚠️ **E A CAUSA DE NINGUÉM VER:** o `GET /prestacoes_contas/resumo_tr` **devolve `sigef_tags` por TR
desde 31/08**, e a palavra `sigef_tags` **não aparece uma única vez no `index.html`**. O servidor
avisava havia dois meses; a tela nunca leu o campo.

### 3. OS DOIS CONSERTOS

✅ **O ESTOQUE MOSTRA, E COM O NÚMERO.** Etiqueta âmbar embaixo do número da TR: **⚠ 6 já baixadas
no SIGEF**. ⚠️ **O NÚMERO NÃO É ENFEITE** — uma TR de 30 PCs com 6 já baixadas não é o mesmo
trabalho que uma com 1, e o selo sem contagem não ajuda a decidir. Veio de `sigef_ambar`, novo no
`resumo_tr`, contado pela **mesma expressão de `lib/sigef.js`**: a tela não classifica nada por
conta própria.

⚠️ **USA A CLASSE `.est-reserva`, E NÃO ESTILO INLINE.** Com `table-layout:fixed`, um inline com
`nowrap` transbordou por cima da coluna vizinha em 16/08 — e estilo inline vence classe, que foi
exatamente o que causou aquele defeito.

✅ **O PEDIDO IMPOSSÍVEL NÃO SAI MAIS**, em duas camadas: o próprio nome **sai da lista** em
`devIndicadoPintar()`, e `validarPedido` **recusa no envio**, não só na aprovação.
**`teste_devolucao_pedido.js`: 91 passaram, 0 falharam.**

⚠️ **E EU QUEBREI O `server.js` NO CAMINHO:** usei **crase dentro de template literal** num
comentário — a armadilha 10 —, e o comentário da linha de cima avisa exatamente isso
(*"sem crase nos nomes: crase dentro de template literal fecha a string"*). `node --check` pegou.

### 4. AS DUAS TRs DA GRACIANE — decisão do Richard: baixadas, e ficam com ela

| | `2021TR001587` | `2021TR002349` |
|---|---|---|
| PC | `2021PC002034` | `2021PC002568` |
| parecer | Parecer Regular | Parecer Regular com Ressalvas |
| **data efetiva** | **18/07/2025** | **02/09/2025** |
| tag âmbar | **sumiu** | **sumiu** |

⚠️ **O PARECER VEIO DA SITUAÇÃO DE ORIGEM DO SIGEF**, não de escolha minha: *Baixa Regular* →
Parecer Regular; *Baixa Regular Ressalva* → Parecer Regular com Ressalvas.

⚠️ **EM CADA TR A PARCIAL 1 TEM UMA PC SÓ** — justamente a âmbar. Conferido antes: baixar a parcial
não alcançou a P002 nem as finais, que **continuam em análise com ela**.

⚠️ **A BAIXA É DE HOJE, A DATA EFETIVA É DE 2025.** `data_baixa = 26/10/2026`, mas `data_efetiva`
vem do SIGEF — **julho e setembro de 2025**. **Não infla o trimestre corrente dela**, e foi dito ao
Richard antes de gravar.

✅ **A TAG TER SUMIDO É A PROVA** de que a divergência acabou no dado, e não só na tela.

### 5. A DECISÃO QUE O RICHARD TOMOU — opção (a)

Das três que foram postas (deixar com aviso · tirar do estoque · baixar em lote), ele escolheu
**(a): as 255 ficam no estoque, com o aviso visível.** ⚠️ **A (c) — baixar em lote pelo registro do
SIGEF — foi recusada**, e é a mais perigosa: gravaria parecer que ninguém leu.

### 6. O RECADO NO SINO FOI CANCELADO, E AS 17 COM DONO VIRARAM 14

⚠️ **O RECADO ÀS TRÊS ANALISTAS NÃO FOI ENVIADO** — o Richard cancelou no meio, e nada saiu.

Ele pediu então as TRs delas para si, *"pra mim que eu vou dar baixa e ganhar produtividade"*.
⚠️ **A PREMISSA NÃO SE SUSTENTAVA, E FOI DITO ANTES DE MOVER QUALQUER COISA:** a produtividade
sai da **data efetiva**, que é a `data_baixa_sigef` — essas PCs cairiam em **agosto/2025 e
abril/2026**, e **não** no trimestre corrente. Confirmar esses pareceres dá trabalho e não move
o número do período. Foi medido nas duas da Graciane no mesmo dia: baixadas em 26/10, efetivas
em julho e setembro de 2025.

⚠️ **E AS TRs NÃO VINHAM SOZINHAS:** a `2021TR000618` tem 23 PCs, **17 já baixadas pela Ana
Letícia**; a `2020TR000651` tem 32, **24 já baixadas pela Grace**. Pegar o Termo levaria o acervo
delas junto.

✅ **ELE ESCOLHEU A OPÇÃO 1 — só as que já eram dele.** Três parciais baixadas, nenhuma TR
trocou de mão, ninguém cedeu nada:

| PC | parecer | data efetiva |
|---|---|---|
| `2021PC002102` (`2021TR001658` p1) | Parecer Regular com Ressalvas | 04/09/2025 |
| `2021PC002336` (`2021TR002099` p1) | Parecer Regular com Ressalvas | 12/04/2026 |
| `2024PC000994` (`2024TR000710` p2) | Parecer Regular | 11/11/2025 |

⚠️ **CADA PARCELA TINHA UMA PC SÓ** — conferido antes, porque `/parcela/parecer` baixa a parcela
inteira. Nenhuma arrastou PC sem baixa no SIGEF junto.

#### ⚠️ A PC FINAL DO SECRETÁRIO FICOU DE FORA — decisão: opção 3, deixar como está

A `2021TR001658-PFINAL` tem `situacao_origem = "Regular com Ressalvas - Secretário"`. **É baixa do
Titular da Pasta, não do técnico** — separá-las foi decisão dele próprio em 20/10. Baixá-la pelo
caminho comum gravaria `origem_baixa = "sistema"` e ela contaria como produção dele.

⚠️ **E O CAMINHO CERTO ESTAVA A DUAS ETAPAS DE DISTÂNCIA.** A final só arquiva depois de todas as
parciais arquivadas, e a parcial 1 **nunca foi ao Controle Interno** (`enviado_ci = false`) — ela
só arquiva depois da devolutiva. Medido, não suposto.

⚠️ **E ARQUIVAR NÃO BAIXA:** a final continuaria `baixada = false`, sem produtividade. O
arquivamento registra que a TR encerrou e que o Secretário baixou no SIGEF naquela data — ele não
credita produção ao técnico, de propósito.

Das três saídas postas (levar ao C.I. e seguir o fluxo · baixar como as outras · deixar como
está), **ele escolheu deixar como está**. A etiqueta âmbar continua nela, avisando quem olhar.

### O QUE FOI GRAVADO (26/10)

| o quê | quanto |
|---|---|
| parciais baixadas (parecer confirmado) | **5** — 2 da Graciane, 3 do Richard |
| pedidos de devolução encerrados, com motivo no sino | **2** |
| recados no sino | **nenhum** — cancelado antes de enviar |

⚠️ **Executado pelo Richard**, com o comando na tela antes — e conferido depois pela API.

### ⚠️ O QUE FICA ABERTO

- **As 14 PCs com dono** na mesma situação (Grace 7, Ana Letícia 5, Richard 1, Andressa 1). ⚠️ **O
  aviso delas NÃO é no Estoque** — elas já têm dono e não aparecem lá. Seria na Minha Planilha, que
  ainda não mostra.
- **A fila de pedidos** tem dois da Sandra Cezária (`2020TR001160` e `2020TR001603`), motivo *falta
  de documentação*, destino estoque — **esses não travam**.
- **O 5º relatório do CGE pelo sistema** e **a tela de Relatórios** — bloco de 20/10, inteiros.
- **A trilha retroativa das 341 PCs** devolvidas em 20/10 — oferecida, não autorizada.
- **O caso Juliana**, as **82 PCs `livre` com dono** e as **52 parciais** — esperando decisão.

---


## ▶ 23/10/2026 — AS CINCO TRs ENTRARAM, E O RELATÓRIO DE TRs SAIU DE DENTRO DO SISTEMA

**Duas coisas:** 143 PCs foram para o acervo do Richard, e a lista de TRs por analista — que até
ontem era PDF montado por script — passou a ser um relatório do sistema. ✅ **PUBLICADO EM 23/10**, depois de escrito este bloco: a API em `e2c895d` e o
front em `1b37070`.

> ## ▶ A PRÓXIMA SESSÃO COMEÇA AQUI
>
> 1. ⚠️ **PUBLICAR, NESTA ORDEM: a API primeiro, o front depois.** `sigpc-api/lib/gestao.js`
>    (+9 linhas, branch `feature/baixa-por-parcial`) e `sigpc-gt/index.html` (+193 linhas). Se o
>    front subir sozinho, o relatório funciona e **a coluna Baixadas sai vazia**, com a nota
>    explicando — de propósito, para não sair zero.
> 2. **O 5º RELATÓRIO DO CGE DIRETO DO SISTEMA** continua de pé, com o quadro do bloco de 20/10
>    valendo inteiro: a separação `Bx. Secretário` no acumulado, a seção 1.6, o comparativo por
>    servidor, o confronto com o Anexo Único e a tela de Relatórios. ⚠️ **O relatório de hoje não
>    o substitui** — ele é outra coisa: lista de acervo, não apuração de produtividade.
> 3. **Olhar na tela** o card novo e o PDF saindo pelo navegador de verdade: hoje a prova foi em
>    sandbox, não no browser.

---

### 1. AS CINCO TRs — 143 PCs para a planilha do Richard

Ele pediu TRs fora da Grande Florianópolis, com muitas PCs, livres no estoque. Antes de atribuir,
**cruzei as PCs delas contra os dois Anexos Únicos da CGE** — o do 3º trimestre (2.108 linhas) e o do
4º (1.544) —, que é o que ele perguntou: *"mas essas nos relatórios da CGE estão livres?"*.

⚠️ **ZERO LINHAS NOS DOIS ANEXOS**, e nenhuma baixada no sistema. O SIGEF não registrou baixa de
nenhuma dessas prestações nos trimestres auditados, então **pegá-las não mexe em nada do que já foi
informado à Controladoria**.

| TR | PCs | valor | entidade |
|---|---:|---:|---|
| `2020TR000820` | 47 | R$ 5.189.690,55 | APAE (SCC6112/2020) |
| `2022TR000841` | 33 | R$ 6.336.902,16 | APAE de Ituporanga |
| `2017TR000096` | 21 | R$ 1.129.644,24 | APAE de Blumenau |
| `2017TR000078` | 21 | R$ 1.080.955,52 | APAE (ADR17) |
| `2017TR000097` | 21 | R$ 878.683,25 | APAE de Gaspar |
| **total** | **143** | **R$ 14.615.875,72** | |

⚠️ **A GRAVAÇÃO FOI PELA ROTA DO SISTEMA (`POST /tr/assumir`), E NÃO POR UPDATE** — uma transação por
TR, `FOR UPDATE` nas PCs livres, trilha em `parcela_historico` como `assumir_tr` (`livre → Richard`,
`analista_id = 4`), nome curto certo, e `baixada` / `data_baixa` / `parecer_tipo` / `enviado_ci`
intocados. Conferido depois: **143 de 143**, todas `status = 'analise'`, trilha nas cinco às 13:41.

⚠️ **QUEM EXECUTOU FOI O RICHARD, NO POWERSHELL DELE.** O modo automático barrou a escrita em produção
(*"Modify Shared Resources"*) e eu parei: entreguei o comando, ele rodou. **A primeira versão que
mandei era bash e ele colou no PowerShell** — erro meu de ambiente; a segunda foi
`Invoke-RestMethod` com `Tls12`, e funcionou.

**Acervo dele: 219 PCs · 42 TRs · 190 em curso.** Eu havia projetado 186, pela régua do relatório (que
exclui PC invalidada); a contagem crua eram 47 em aberto, não 43.

### 2. A `2022TR000841` — a ressalva que fica registrada

Ela tem **7 PCs com situação de origem "Em Diligência"** vindas da carga, com `num_diligencia = 0`:
a diligência **não foi aberta no sistema**, veio escrita assim do SIGEF. **Não é análise dele nem
devolução do C.I.** — é estado herdado, e ele aceitou assim.

### 3. O RELATÓRIO DE TRs DO ANALISTA — agora é do sistema

**Relatórios › Gestão › "TRs do analista — lista completa"**, com seletor de integrante ao lado do
botão. Admin e coordenador geram, de qualquer integrante. Sai no papel timbrado, com imprimir/PDF e
baixar .doc, como os outros gerenciais.

⚠️ **TUDO VEM DE `/gestao`, NUMA CHAMADA SÓ — a mesma fonte da tela de Gestão da TR.** Remontar a
contagem no front, a partir das PCs, criaria um segundo jeito de contar a mesma coisa: no dia em que
uma regra mudasse de lado, a tela e o papel divergiriam sem erro nenhum.

#### ⚠️ `n_baixadas` DA `/gestao` NÃO CONTA BAIXA — e por pouco isso ia para o papel

Ela conta **PC fora da etapa "análise"**, o que inclui devolvida pelo C.I., encerrada e arquivada. No
acervo do Richard dava **30** onde a baixa real é **29**. Um erro desse tamanho num documento
assinado não é questionado por ninguém.

⚠️ **E `data_baixa` NÃO SERVE DE SUBSTITUTO:** medido no acervo inteiro, **71 das 16.480 PCs têm data
de baixa sem estar baixadas** — o estorno limpa `baixada` e preserva a data do evento. 5.223 com
`baixada`, 5.294 com data, e **nenhuma baixada sem data**.

✅ **O CONSERTO FOI NA ORIGEM:** `lib/gestao.js` passou a expor **`baixada` por PC** e
**`n_com_baixa` por TR**, contados pelo campo `baixada`. ⚠️ **`n_baixadas` NÃO FOI TOCADA** — a tela de
Gestão depende dela, e mudar o que ela conta mudaria a tela sem aviso. As duas convivem, cada uma
com o comentário dizendo o que é. **`node teste_gestao.js`: 86 checagens, 0 falharam.**

⚠️ **E QUANDO O CAMPO NÃO VIER, A COLUNA DIZ QUE NÃO VEIO.** Enquanto a API não for publicada, a
coluna Baixadas sai `—` com nota explicando. Com `||0` ela sairia zerada — número errado que ninguém
questiona.

#### As decisões de papel, tomadas depois de ver a impressão

- ⚠️ **O NOME DA ENTIDADE ENCURTA SÓ NO PREFIXO.** "ASSOCIACAO DE PAIS E AMIGOS DOS EXCEPCIONAIS DE
  BLUMENAU" ocupava **sete linhas por célula** e esticava o documento para quatro páginas; vira
  "APAE DE BLUMENAU", que é a sigla da própria expressão. ⚠️ **O MUNICÍPIO FICA** — é ele que
  distingue uma APAE da outra, e abreviar além disso juntaria entidades diferentes numa linha só.
  **O documento declara a substituição em nota.** Há razão social que já repete a sigla no fim
  ("…EXCEPCIONAIS APAE"), e a repetição é colapsada.
- ⚠️ **O TOTAL SAIU DO `<tfoot>`.** Em `table-footer-group` o navegador o **repete em toda página**, e
  o leitor lê o total geral como se fosse o daquela página. Virou a última linha do corpo.
- **A ordem é o tempo no setor**, do mais antigo para o mais recente — é o ponto do relatório. ⚠️ **TR
  sem posição do SGPe vai para o FIM**: ordenando por maior primeiro, o `-1` a jogaria para o topo,
  no lugar da mais parada de todas.
- **O setor é leitura do SGPe**, com a data da leitura impressa na ficha; sem leitura, a célula diz
  *"não consultado"* — e não fica vazia, que o leitor confundiria com processo sem setor.

#### ⚠️ COMO A FUNÇÃO FOI PROVADA — e o harness que ficou

`scratchpad/provar_rel_trs.js` **roda o `gerTrsAnalista` do próprio `index.html`**, num `vm` com DOM
mínimo, interceptando `window.open` para capturar o documento, e imprime em PDF pelo Edge headless.
⚠️ **REMONTAR O DOCUMENTO NO SCRIPT PROVARIA O SCRIPT, NÃO O SISTEMA.** Saiu com as 42 TRs, logo,
timbre e os totais batendo com o banco: 29 baixadas, 219 prestações, R$ 21.794.155,41.

Três coisas que o harness ensinou, e que a próxima vez aproveita:

- ⚠️ **`const` E `let` DE TOPO NÃO VIRAM PROPRIEDADE DO GLOBAL NO `vm`** — só `function` e `var`. Por
  isso `DOC_CSS`, `planMoeda`, `dataBr` e `LOGO_SC` apareciam como indefinidos: o harness acrescenta
  **uma linha** ao fim do bloco expondo-os.
- ⚠️ **`U` É `let`, ENTÃO `ctx.U = {...}` NÃO ALCANÇA A VARIÁVEL QUE A FUNÇÃO LÊ.** A mesma linha
  exporta `entrarComoU(v)`, que atribui dentro do escopo.
- ⚠️ **`getElementById` NÃO PODE DEVOLVER `null`** no sandbox: o código de arranque da tela quebra em
  `innerHTML` de null e o script para antes das constantes.

⚠️ **E O PRÓPRIO HARNESS ME ENGANOU UMA VEZ:** a primeira impressão disse **38 baixadas** porque ele
contava as PCs da TR inteira, não as do analista. A `/gestao` recorta por escopo; o harness não
recortava. Corrigido, deu 29 — o número do banco.

### O QUE FOI GRAVADO (23/10)

| o quê | quanto |
|---|---|
| PCs atribuídas ao Richard pela rota `/tr/assumir` | **143**, em 5 TRs |
| trilha em `parcela_historico` (`assumir_tr`) | **5 linhas**, 13:41 |

⚠️ **Executado pelo Richard, não por mim** — ver o item 1.

### ⚠️ O QUE NÃO FOI ABERTO NO NAVEGADOR

- [ ] **O card novo em Relatórios › Gestão**, e o documento saindo pelo `window.open` de verdade.
- [ ] **A Minha Planilha dele** com as 143 PCs novas.
- [ ] **O Estoque**, agora com 5 TRs a menos.

### O QUE FICA ABERTO

- **Publicar os dois repositórios** — ver o quadro no topo.
- **O 5º relatório do CGE pelo sistema** e **a tela de Relatórios** — bloco de 20/10, inteiros.
- **A trilha retroativa das 341 PCs devolvidas em 20/10** — oferecida, não autorizada. Elas só são
  identificáveis por `atualizado_em`, o que é frágil.
- **Os anexos do 1º e 2º trimestres**, se a CGE fornecer.
- **O caso Juliana**, as **82 PCs `livre` com dono** e as **52 parciais** — todos esperando decisão.

---


## ▶ 20/10/2026 — O RELATÓRIO DO 4º TRIMESTRE FOI REFEITO, E O ACERVO DO RICHARD FOI LIMPO

**Os dois documentos estão prontos em `relatorio_cge_4tri/`** — o relatório retificado (**9 páginas**) e o
comparativo para anexar (**8 páginas**). ⚠️ **HOUVE MUITA ESCRITA EM PRODUÇÃO.** Detalhe em *"O que foi
gravado"*, no fim.

> ## ▶ A PRÓXIMA SESSÃO COMEÇA AQUI — O RELATÓRIO SAI DE DENTRO DO SISTEMA
>
> **Decisão do Richard, 20/10:** *"vamos colocar isso para dentro do sistema que no próximo relatório
> é só colocar as datas de corte do último trimestre e realizar o relatório direto pelo sistema"*.
> **Fica para outra hora** — ele mesmo disse —, mas é a frente seguinte, e o estado dela é este:
>
> ⚠️ **O RELATÓRIO DE HOJE NÃO SAIU DO SISTEMA.** Saiu de `scratchpad/gerar_relatorios.js`, alimentado
> por `scratchpad/extrair_relatorio.js`, e **scratchpad some**. O que a tela Relatórios › CGE gera
> hoje **não tem**: a separação `Bx. Secretário` / `Bx. Técnico` no acumulado, a seção 1.6 do
> desenvolvedor, o comparativo por servidor, o confronto com o Anexo Único, a nota do Quadro 1 ×
> Quadro 2, nem o acerto de papel (Arial 12, justificado, grade de assinaturas, rodapé).
>
> **O QUE PRECISA IR PARA DENTRO, em ordem:**
>
> 1. **O QUADRO 2 COM AS DUAS COLUNAS no acumulado.** A conta está em `extrair_relatorio.js`
>    (`acum_sec` por analista) e é a mesma régua do `sqlContaAte` — move-se para o `cgeAgregar`.
> 2. **A SEÇÃO 1.6**, com os números vindos do servidor: 45 em exercício, 42 analistas, 3
>    coordenadores, e a contagem de rotas/libs/testes.
> 3. **O COMPARATIVO COM O ANEXO ÚNICO.** ⚠️ Ele depende de **ler o `.xlsx` da CGE**, que hoje é feito
>    em Node no scratchpad. Na tela isso vira **upload do anexo** e conferência no servidor — é a
>    parte mais nova, e a que mais vale: é ela que prova prestação por prestação.
> 4. **O PAPEL** — Arial 12, tabelas em 9pt, justificado com hifenização, assinaturas 2×2, rodapé
>    `SIGPC-GT · Relatório Sistema`, nove páginas com folga. Tudo decidido e testado hoje; é só
>    transportar o CSS.
> 5. **ARRUMAR A TELA DE RELATÓRIOS** — o parecer de 19/10 continua valendo: três abas com lógicas
>    diferentes, oito parâmetros de exceção **sem uma linha explicando o que fazem**, e número sem
>    botão "Fonte".
>
> ⚠️ **O ALVO É: escolher a setorial, pôr as duas datas de corte e clicar em gerar.** Mais nada.
>
> ⚠️ **E OS SCRIPTS DO SCRATCHPAD SÃO A REFERÊNCIA, não o destino.** Quem for fazer isso lê
> `gerar_relatorios.js` e `extrair_relatorio.js` para saber o que o documento precisa ter — e depois
> os joga fora.

---

### 1. A AUDITORIA FECHOU — e os dois erros eram meus

O Richard pediu *"auditoria minuciosa"* antes de gerar o relatório, com a frase que define o dia:
**"eu não quero passar vergonha, isso é muito sério"**. A auditoria achou dois erros, e os dois eram
meus:

⚠️ **ERRO 1 — misturei dois fatos do anexo.** A **aba 1** registra a **baixa da prestação parcial**
(chave `UGPC`) e a **aba 2** o **parecer da prestação final do termo** (chave `UGTR`). São dois
eventos, em dias diferentes, que a CGE conta **separadamente** — é por isso que o Quadro 01 soma
1.378 + 128. Eu importei usando *"a data mais recente quando a PC aparece nas duas abas"*, e isso
jogou 33 parciais para o dia do parecer final.

⚠️ **ERRO 2 — usei só um anexo.** Com isso **49 parciais que já tinham a data certa** (fevereiro, do
anexo do 3º trimestre) foram empurradas para junho/julho. **Era a causa dos −143 do 3º trimestre.**

✅ **A REGRA QUE FICOU:** a data da parcial vem **sempre da aba 1**, de qualquer anexo, e a **mais
antiga** quando aparece nos dois — a baixa aconteceu uma vez. A aba 2 **nunca** data parcial: ela
data a PC `-PFINAL` da TR.

⚠️ **E O LAYOUT MUDA ENTRE OS ANEXOS:** no do 4º trimestre a PC está na coluna **F** e o GTPC na **L**;
no do 3º, na **E** e na **J**, e há uma terceira aba. **Ler por posição fixa leria a coluna errada em
silêncio** — cada aba é mapeada pelo cabeçalho.

**A validação mais forte:** a soma das duas abas dos dois anexos dá **3.041 parciais + 266 finais**,
exatamente o acumulado que a CGE declara no Quadro 05 (**3.307**).

### 2. O RESULTADO — o 4º trimestre bate

| Quadro 01 — 4º trimestre | nosso | CGE | |
|---|---:|---:|---|
| **parcial regular** | **1.378** | 1.378 | **exato** |
| parcial irregular | 0 | 0 | ✓ |
| final regular | 118 | 128 | −10 |
| secretário | 11 | 0 | +11 |
| **TOTAL** | **1.507** | **1.506** | **+1** |

**As 1.430 prestações distintas do Anexo Único:** todas existem, todas baixadas, todas com parecer,
todas no trimestre, **todas com data coincidente**. Nenhuma faltando.

⚠️ **O 1º E O 2º TRIMESTRES CONTINUAM SEM CONFERÊNCIA** (+60 e +19): **não há anexo** para eles. Se a
CGE fornecer, fecham do mesmo jeito.

### 3. O ACERVO DO RICHARD FOI LIMPO — pedido dele

O Quadro 4 mostrava **382 processos em curso** no nome dele. Medido: **52 TRs que ele nunca assumiu**
(`dt_assumida` vazia) respondiam por **339** deles — Termos que caíram no seu nome por não terem dono.

- **93 baixas do Secretário** foram desvinculadas (`analista_id = NULL`). Elas continuam **baixadas** e
  continuam somando no total do Grupo: o trabalho foi do Titular da Pasta.
- **341 PCs em aberto** das 52 TRs voltaram ao Estoque (`livre`, sem dono).
- **Acervo dele: de 508 PCs / 121 TRs / 382 em curso → 74 PCs / 36 TRs / 43 em curso.**

⚠️ **`baixada` NÃO FOI TOCADA em nenhuma** (armadilha 29): zerar seria estorno com outro nome,
inventando um evento que não houve.

⚠️ **PC BAIXADA NÃO VOLTA AO ESTOQUE** — a regra do `POST /tr/devolver` desde 13/08. A baixa é produção
registrada, e devolver a PC levaria a produção junto. Só voltou o que estava em aberto.

### 4. AS BAIXAS DO SECRETÁRIO — o achado que o Richard viu primeiro

Foi dele a leitura, confirmada depois pela medição: *"então aquelas TR que não tinha ninguém e já
estavam analisadas é do secretário baixa"*. Medido: das 140 baixas com `origem_baixa = 'secretario'`,
**93 estavam com ele**, em **47 TRs**, com datas do SIGEF de 08/05 a 12/11/2025 — e **47 dessas TRs
nunca foram assumidas por ninguém**. A carga trouxe, inclusive, a situação de origem escrita:
*"Regular com Ressalvas - **Secretário**"* (44), *"Em Análise - **Secretário**"* (18), *"Regular -
**Secretário**"* (8).

✅ **O QUADRO 2 PASSOU A SEPARAR `Bx. Secretário` DE `Bx. Técnico` TAMBÉM NO ACUMULADO**, para os 48 —
é como a CGE classifica no Quadro 02 dela. **Somada, a baixa do Titular aparece como produção do
técnico, que é o que ela não é.**

⚠️ **E O RODAPÉ DO QUADRO 2 SOMA AS PRÓPRIAS LINHAS**, não o Quadro 1. Com as 93 sem dono, o Quadro 1
dá **3.639** e o Quadro 2 **3.580** — e **há nota declarando os 59 de diferença**. Antes o rodapé
mostrava o número do Quadro 1, ou seja, a tabela não fechava com ela mesma.

### 5. OS DOIS DOCUMENTOS

**`relatorio_cge_4tri/1 - Relatorio 4o trimestre FCEE - RETIFICADO.pdf`** — 8 páginas. Mesmo formato
do original, com nota de retificação, Quadro 1 (todas as linhas somando), Quadro 2 com os 48
servidores em trimestre e acumulado, Quadro 4, as 20 férias e a **seção 1.6** sobre a atuação do
servidor que desenvolveu o sistema.

**`relatorio_cge_4tri/2 - Comparativo CGE x SIGPC-GT - ANEXO.pdf`** — 7 páginas. A conferência do
Anexo Único, o Quadro Geral, o **confronto dos 48 servidores**, a evolução por trimestre, o acumulado,
a origem da divergência, a mesma seção do desenvolvedor e o atendimento ao Quadro 06. Assinado por
**Richard Motta Coelho — Desenvolvedor do Sistema SIGPC-GT**.

⚠️ **O CASAMENTO DOS NOMES É POR CRITÉRIO DECLARADO.** A CGE anonimiza por iniciais (`S.C.R.R.`) e
metade do nosso cadastro só tem o primeiro nome. São quatro passadas, da mais forte para a mais
fraca — **iniciais completas (23, a única que é prova)**, grupo+letra+meta (10), grupo+letra+produção
(8), grupo+letra (3) —, e **a última coluna da tabela mostra qual delas foi usada em cada linha**.
Quem não casou (4) aparece como *"não localizado no cadastro atual"*: **forçar um par atribuiria a
produção de uma pessoa a outra**.

⚠️ **48 SERVIDORES É NÚMERO MEDIDO, não a contagem de linhas do Quadro 2** — o Richard perguntou, e eu
tinha errado: são **41 analistas + 3 coordenadores + 4 do C.I. em exercício**, todos com acesso
registrado, 46 deles nos últimos 30 dias.

### 6. A TELA, O TEXTO E O PAPEL — o que ficou decidido

- **Fonte Arial 12** no corpo; **tabelas em 9pt**, porque o Quadro 2 tem 11 colunas e em 12 não cabe
  em A4 retrato.
- **Texto justificado com hifenização** (`hyphens:auto` + `lang="pt-BR"`). ⚠️ Sem o hífen, justificado
  em linha de 18 cm abre rios de espaço. **Não alcança tabela, título nem assinatura.**
- **Assinaturas em grade 2×2**, com `break-inside:avoid`. ⚠️ A assinatura é digital, então **não se
  reserva espaço para a caneta** — em duas colunas as quatro cabem na página da conclusão.
- ⚠️ **A ASSINATURA ÚNICA TEM CLASSE PRÓPRIA (`.ass.solo`).** A grade dá a cada nome 84% de MEIA
  página; sozinha, a mesma regra virava uma linha de ponta a ponta colada na data.
- **A justificativa do item 1.6 não menciona a separação das baixas de Secretário** — decisão do
  Richard: elas aparecem na coluna certa, e pronto.
- ⚠️ **NÃO SE ESCREVE "adequação às mudanças do SIGEF e do SGPe"** — correção dele: não há mudanças a
  que se adequar; o trabalho foi **construir o mecanismo de consulta ao SGPe**, que não oferece
  interface de integração.

### 7. OS AJUSTES DA NOITE — a Nayara validou e vieram as correções

**Os dois documentos foram lidos pela coordenação.** O que mudou depois disso:

⚠️ **SÃO 42 ANALISTAS E 3 COORDENADORES. O CONTROLE INTERNO NÃO INTEGRA O GT-PC** — correção do
Richard, e fecha com os *"45 membros"* que a CGE declara. Medido no banco: **41 com perfil
`analista` em exercício** (15 + 13 + 13) **+ o superadmin, que também analisa** = 42. Eu tinha
escrito 48 somando os 4 técnicos da Unidade de Controle Interno, que usam o sistema mas **não são do
Grupo**.

⚠️ **"NÃO ALTERAR NADA DE NÚMEROS — A NAYARA JÁ VALIDOU."** Ordem dele, e por isso a correção ficou
**só no texto da composição da equipe**: nenhum valor apurado foi tocado. Conferido um a um no
documento gerado depois da mudança — 1.507 · 3.639 · 1.378 · 12.873 · 119,13% · 70,80%.

**No cabeçalho ficou `45 em exercício (42 analistas e 3 coordenadores)`**, e a **nota do Quadro 2
explica as 48 linhas**: os 42 em exercício mais os desligados no período, cuja produção integra o
acumulado. Os dois números convivem porque respondem a perguntas diferentes, e a nota diz qual é
qual.

#### O cabeçalho e o papel

- ⚠️ **A COLUNA INVISÍVEL DO CABEÇALHO SAIU.** Ela existia só para equilibrar a logo e **roubava 168
  px de largura**, empurrando o texto para o meio da página — era ela que quebrava
  "FUNDAÇÃO CATARINENSE DE EDUCAÇÃO ESPECIAL" em duas linhas. Sem ela o nome cabe numa linha, com
  `nowrap` e 11,5pt, e o espaço entre logo e texto subiu de 16 para 26 px.
- **Texto justificado com hifenização** (`hyphens:auto` + `lang="pt-BR"`), que **não alcança tabela,
  título nem assinatura**.
- **Assinaturas em grade 2×2.** ⚠️ **A assinatura é digital: não se reserva espaço para a caneta.**
- ⚠️ **A ASSINATURA ÚNICA TEM CLASSE PRÓPRIA (`.ass.solo`)** — a grade dá a cada nome 84% de MEIA
  página; sozinha, a mesma regra virava uma linha de ponta a ponta colada na data.
- **O rodapé é só `SIGPC-GT · Relatório Sistema`.**

⚠️ **NOVE PÁGINAS COM FOLGA, E NÃO OITO APERTADAS** — decisão dele, depois de ver as duas. Cheguei a
espremer a entrelinha para 1,38 e devolvi para **1,50**: *"deixe em nove páginas e mais espaçado para
não ficar muito amontoado"*. **O documento vai à Controladoria e é lido inteiro; economizar papel
atrapalha quem lê.** Relatório **9 páginas**, comparativo **8**.

#### A justificativa do item 1.6

Reescrita três vezes até ficar no ponto. O que ficou decidido:

- ⚠️ **NÃO MENCIONA a separação das baixas de Secretário** — elas aparecem na coluna certa e pronto.
- ⚠️ **NÃO DATA o início da atuação** (*"o servidor responde pela concepção…"*, sem "desde a
  instituição do Grupo"): correção dele, não foi desde o começo.
- ⚠️ **NÃO FALA EM "adequação às mudanças do SIGEF e do SGPe"** — não há mudanças a que se adequar; o
  trabalho foi **construir o mecanismo de consulta ao SGPe**, que não oferece interface de integração.
- **Sem caixas de destaque**, tudo em texto corrido, com o acúmulo de função integrado ao parágrafo.
- **Encurtada de 8 parágrafos para 5**, a pedido dele.
- ✅ **E GANHOU A FRASE DA DEDICAÇÃO CONTINUADA** (opção A de duas que ele leu):
  *"E a demanda não é transitória: enquanto o sistema estiver em operação, haverá regra a atualizar,
  dado a conciliar e integrante a atender — de modo que a continuidade dos resultados aqui
  apresentados pressupõe a permanência dessa dedicação."*
  ⚠️ **É DELIBERADAMENTE INDIRETA.** A opção B, mais explícita, amarrava a dedicação à recomendação
  da CGE; ele preferiu a que **deixa a conclusão por conta de quem lê**.

### 8. O TEXTO PARA O WHATSAPP DOS COORDENADORES

Escrito e enviado a ele em duas versões (longa e curta; ficou a curta). Abre pelos dois documentos,
explica em duas frases o que estava errado e o que foi corrigido, dá os quatro números
(1.507 · 119,13% · 3.639 · 70,80%), destaca que **as parciais regulares deram 1.378, o número exato
da CGE**, e avisa que **a produtividade de 10 analistas mudou, nove para cima, com cada um já
avisado pelo sino**.

---



---

### O QUE FOI GRAVADO (20/10)

| o quê | quanto |
|---|---|
| baixas do Secretário **desvinculadas** do Richard | **93** |
| PCs **devolvidas ao Estoque** (52 TRs que ele nunca assumiu) | **341** |
| `data_baixa_sigef` corrigida pelos dois anexos | **214** (84 parciais + 130 finais) |
| as 14 PCs da `2024TR000710` atribuídas a ele, e depois limpas junto | — |

⚠️ **TUDO COM DRY-RUN ANTES E CONFERÊNCIA DEPOIS, na MESMA transação**, com `ROLLBACK` previsto se o
gravado não batesse com o previsto. Bateu em todas.

### ⚠️ O QUE NÃO FOI ABERTO NO NAVEGADOR

- [ ] **A tela Produtividade e o Dashboard** depois da limpeza — o número do Richard caiu para 16.
- [ ] **O Estoque de TRs** com as 52 TRs que voltaram: elas aparecem para qualquer analista assumir.
- [ ] **A tela Relatórios › CGE** gerando o período e o acumulado.
- [ ] **A tela Férias e Afastamentos** com os 20 registros.

### O QUE FICA ABERTO

- **O 5º relatório direto do sistema** — ver o quadro no topo deste bloco.
- **A tela de Relatórios** — o parecer de 19/10 continua valendo.
- **Os anexos do 1º e 2º trimestres**, se a CGE fornecer.
- **As 52 parciais** do bloco de 19/10 e **o caso Juliana** e as **82 PCs `livre` com dono** do bloco
  de 13/10 — todos ainda esperando decisão.

---


## ▶ 19/10/2026 — A DIVERGÊNCIA COM A CGE, E A DATA QUE A CAUSOU

**A Informação CGE nº 275/2026 recusou o relatório do 4º trimestre.** A FCEE informou **2.250**
baixas; a CGE apurou **1.506** no SIGEF. Depois do trabalho deste dia, o nosso número é **1.507**,
e as parciais regulares batem **exato: 1.378 contra 1.378**.

⚠️ **HOUVE MUITA ESCRITA EM PRODUÇÃO.** Detalhe em *"O que foi gravado"*, no fim.

| commit | repo | o quê |
|---|---|---|
| `e651c25` · `8ad7a4b` | api · gt | a **data efetiva da baixa** — a do SIGEF, não a da carga |
| `fcf55fe` | api | o **dia da carga** recusa a data, seja qual for a origem |
| `1104f9c` | api | **uma régua só** — a produtividade conta pela mesma data do relatório |

---

### 1. A CAUSA: três datas para o mesmo fato

O relatório contava pela `data_baixa`. As **3.517 PCs da `recarga_parcial_20260805`** têm todas
`data_baixa = 30/06/2026` — **o dia em que o arquivo entrou**, não o dia da análise. Jogadas num
trimestre com 1.260 de meta, produziram os **180,43%** que a CGE recusou.

⚠️ **E O CONSERTO DE 30/09 ERROU PARA O OUTRO LADO:** tirar a carga inteira do período deixou o
trimestre com **47 baixas** (3,7%). **Um número inventava trabalho; o outro apagava trabalho que
houve.**

✅ **A DATA CERTA JÁ ESTAVA NO BANCO: `data_baixa_sigef`.** É a mesma fonte que a CGE usa para
conferir. A regra entrou como **cópia única** em `sigpc-api/lib/sigef.js`:

1. `data_baixa_sigef` quando existe;
2. senão a `data_baixa`, **só quando a baixa foi feita aqui dentro**;
3. senão **nenhuma** — carga sem data do SIGEF não tem data de trabalho em lugar algum.

⚠️ **A TELA NÃO CALCULA ESSA DATA.** `GET /prestacoes_contas` manda `data_efetiva` pronta,
cortada pelo `::date` do Postgres. **A API manda hora em UTC**, e um `slice(0,10)` jogaria a baixa
de **31/07 às 22h30 para 01/08** — outro trimestre, bem no corte que a CGE confere.

### 2. O DIA DA CARGA — a porta lateral que a auditoria achou

A lista de origens não bastava: **39 baixas com `origem_baixa = 'secretario'`** tinham
`data_baixa = 30/06/2026` e **nenhuma data do SIGEF**. Como "secretario" não estava na lista, a
data da carga passava — e a CGE põe **zero** na coluna Secretário daquele trimestre.

⚠️ **MEDIDO ANTES DE FECHAR A PORTA**, para não levar baixa de verdade junto: as baixadas que caem
exatamente em 30/06/2026 são 3.517 da recarga (já fora pela origem), 42 do secretário (39 sem data)
e 2 da importação do SIGEF — **estas COM data, e por isso intocadas**. **Baixa feita no sistema em
30/06/2026: nenhuma.** O dia é da carga e de mais nada.

### 3. A AUDITORIA CONTRA OS DOIS ANEXOS — e os DOIS ERROS MEUS

O Richard mandou o **Anexo Único do 4º trimestre** (CGE 275/2026) e depois o do **3º trimestre**
(CGE 162/2026): a lista PC a PC que a CGE extraiu do SIGEF. Conferência de 1.430 + 1.329 prestações.

⚠️ **ERRO 1 — misturei dois fatos.** Importei as datas usando *"a mais recente quando a PC aparece
nas duas abas"*. **Errado.** A **aba 1** registra a **baixa da prestação parcial** (chave `UGPC`) e
a **aba 2** o **parecer da prestação final do termo** (chave `UGTR`). São dois fatos, em dias
diferentes, que a CGE conta **separadamente** — é por isso que o Quadro 01 soma 1.378 + 128.

⚠️ **ERRO 2 — usei só um anexo.** Com isso **49 parciais que já tinham a data certa** (fevereiro, do
anexo do 3º trimestre) foram empurradas para junho/julho. **Era a causa dos −143 do 3º trimestre.**

✅ **A REGRA QUE FICOU:** a data da parcial vem **sempre da aba 1**, de qualquer anexo, e a **mais
antiga** quando aparece nos dois — a baixa aconteceu uma vez. A aba 2 **nunca** data parcial: ela
data a PC `-PFINAL` da TR.

⚠️ **E O LAYOUT MUDA ENTRE OS ANEXOS:** no do 4º trimestre a PC está na coluna **F** e o GTPC na
**L**; no do 3º, na **E** e na **J**, e há uma terceira aba. **Ler por posição fixa leria a coluna
errada em silêncio** — cada aba é mapeada pelo cabeçalho.

**A validação mais forte:** somando a aba 1 e a aba 2 dos dois anexos, dá **3.041 parciais + 266
finais** — exatamente o acumulado que a CGE declara no Quadro 05 (**3.307**).

### 4. O RESULTADO DA AUDITORIA

| Quadro 01 — 4º trimestre | nosso | CGE | |
|---|---:|---:|---|
| **parcial regular** | **1.378** | 1.378 | **exato** |
| parcial irregular | 0 | 0 | ✓ |
| final regular | 129 | 128 | +1 |
| final irregular | 0 | 0 | ✓ |
| **TOTAL** | **1.507** | **1.506** | **+1** |

| | antes | depois | CGE |
|---|---:|---:|---:|
| 3º trimestre | 1.229 | **1.354** | 1.372 (−18) |
| estoque em 31/07 | 13.056 | **12.873** | 12.903 (−30) |

**As 1.430 PCs do anexo do 4º trimestre:** todas existem, todas baixadas, todas com parecer, todas
no trimestre. **Nenhuma faltando.**

⚠️ **O QUE AINDA DIFERE, E TEM MOTIVO ESCRITO:**
· **+11 "secretário"** — a CGE conta **outra coisa** nessa coluna: PCs baixadas pelo Titular que já
  estavam *"Em análise Secretário"* no levantamento de 03/06/2025. As nossas 11 têm data do SIGEF.
· **1º e 2º trimestres (+60 e +19)** — **sem anexo para conferir**. Vem de datas do SIGEF anteriores
  a agosto/2025 que o GT herdou.

### 5. UMA RÉGUA SÓ — a produtividade passou a contar igual ao relatório

⚠️ **HAVIA DUAS RÉGUAS, e isso era o próximo problema:** o relatório do CGE passou a contar pela
data do SIGEF e a produtividade continuava em `data_baixa <= corte`. Medido: **301 PCs** de
diferença e **24 analistas** com número distinto. O analista via um total em *"Sua Produtividade"* e
o documento que vai à CGE mostrava outro.

`sqlBaseAte` virou **`COALESCE(data efetiva, data_baixa) <= corte`**.

⚠️ **O `COALESCE` É DECISÃO DO RICHARD E NÃO PODE FALTAR:** a PC de carga sem data no SIGEF
**continua contando no acumulado**, pela `data_baixa`. *"No acumulado fica a mesma coisa, não perde
essas PCs."* O trabalho existiu; o que não existe é prova do dia. **Sem ele, 301 PCs sumiriam do
total de 24 pessoas** — e some trabalho feito, não só uma data.

⚠️ **E NÃO RESSUSCITA O DEFEITO DO 4º TRIMESTRE:** aquele era um **período** com começo e fim, e
período continua exigindo data efetiva (`cgeAgregar`). Aqui a pergunta é *"o que estava feito até
esta data"*, e para ela a data da carga é um limite superior honesto.

**Efeito medido:** o GT vai de **4.739 para 4.756** (+17). **Dez** analistas mudam, **nove para
cima**; só a Graciane cai 1. Uma cópia só, alcançando régua, Dashboard, Board e Gestão Grupo.

---

### O QUE FOI GRAVADO (19/10)

| o quê | quanto |
|---|---|
| PCs **baixadas** que o SIGEF já tinha baixado | **5** — 3 livres + as 2 em diligência, com o parecer e a data do próprio SIGEF |
| `data_baixa_sigef` **corrigida** | 86 + 128 + 33 + 214 = **461 gravações**, com a regra final valendo |
| **férias** do 4º trimestre | **15** novos registros (5 já estavam; total 20) |
| **recados no sino** | **13** — Graciane (2157), Fabiana e Ana Letícia (as 2 em diligência), e os **10** da régua |

⚠️ **TODA GRAVAÇÃO PASSOU POR DRY-RUN e teve CONFERÊNCIA DEPOIS, na MESMA transação**, com
`ROLLBACK` previsto se o gravado não batesse com o previsto. Bateu em todas.

⚠️ **AS 38 PCs "Demais" DO ANEXO FICARAM DE FORA, de propósito:** são do grupo permanente, não do
GT, e a própria CGE as separa no Quadro 05. Baixá-las aqui inventaria produção do GT.

⚠️ **A `2024PC000752` FOI BAIXADA SEM DONO** — conta no total do GT e na produtividade de ninguém.
Se for para atribuir a alguém, é decisão do Richard.

### O QUE FICA ABERTO

- **O modelo do relatório** — o Richard vai mandar o documento a corrigir, para substituir os dados
  pelos atualizados.
- **As 52 parciais** que o anexo do 4º trimestre cita **só na aba 2**: a data delas aqui é a do
  parecer final. O anexo não traz a baixa da parcial delas, e **não há backup da data anterior**.
- **Os anexos do 1º e 2º trimestres**, se a CGE puder fornecer — fecham os +60 e +19.
- **O caso Juliana** (4 TRs com dono trocado) e as **82 PCs `livre` com dono** — do bloco de 13/10,
  ainda esperando decisão.

### ⚠️ O QUE NÃO FOI ABERTO NO NAVEGADOR

- [ ] **A tela Produtividade e o Dashboard** com a régua nova — os números de 10 analistas mudaram.
- [ ] **O relatório CGE** gerado com 01/05/2026 → 31/07/2026 e com 01/08/2025 → 31/07/2026.
- [ ] **A tela Férias e Afastamentos** com os 20 registros.
- [ ] **A nota de rodapé nova** do Quadro 1, que diz quantas baixas entraram pela data do SIGEF.

---


## ▶ 13/10/2026 — O CADERNO FOI PARA A ABA GESTÃO, E DUAS COISAS QUE VAZAVAM FORAM FECHADAS

**Tudo publicado e conferido no ar.** ⚠️ **HOUVE ESCRITA EM PRODUÇÃO** — duas novidades, um item
no repositório e **55 avisos no sino**. Detalhe em *"O que foi gravado"*, no fim deste bloco.

| commit | repo | o quê |
|---|---|---|
| `b13cf50` | gt | o **"Abrir" da fila espera a planilha** em vez de acusar TR que não é sua |
| `56c66ad` | gt | o **mesmo caderno na ficha da TR**, sincronizado com a Minha Planilha |
| `703c209` | api | o caderno privado **não sai pela rota pública da TR** |
| `f493dac` · `0033599` | api · gt | a **parcela arquivada sai do seletor** do caderno |

---

### 1. O CASO MIRIAM — a fila acusava "esta TR não é sua", e era mentira

A Miriam clicou em **Abrir** na fila "Para você hoje" e recebeu *"a TR não está na sua planilha"*.
A TR **era** dela.

⚠️ **ERA CORRIDA, NÃO PERMISSÃO.** A fila chega antes da planilha: `GET /minha_fila` responde em
**~500 ms** e a consulta das 54 TRs em **~1 s** (medido). Entre uma coisa e outra o botão já está
clicável, e o `planIrAoAlvo` procurava a TR numa lista **vazia** — não achava, e dizia a única
frase que não podia dizer: que a TR não é dela.

O conserto tem duas metades, e as duas importam:

- **`filaIr` não chama mais o alvo direto**: guarda `_planAlvo` e só navega se a planilha já
  carregou; senão avisa *"Abrindo… a sua planilha ainda está carregando."* e o `buscarPlan`, ao
  terminar, chama `planIrAoAlvo` sozinho.
- **`planIrAoAlvo` com lista vazia DEVOLVE O ALVO** (`if (!lista.length) { _planAlvo = alvo; return }`)
  em vez de consumi-lo. Consumir era o que transformava a corrida em erro definitivo: na segunda
  tentativa não havia mais alvo nenhum.

⚠️ **A LIÇÃO QUE FICA: mensagem de erro que afirma permissão tem de ser a ÚLTIMA hipótese.**
"Não achei" e "não é seu" são coisas diferentes, e a tela dizia a segunda quando a verdade era a
primeira — a pessoa acreditou, e com razão.

### 2. O CADERNO NA ABA GESTÃO — o mesmo, não um segundo

Pedido do Richard: *"quero que a mesma funcionalidade apareça dentro da aba gestão… o que escreve
aqui aparece lá em minhas planilhas e o que escreve em minhas planilhas aparece no gestão"*. E,
perguntado se as duas caixas conviveriam: **"A, mantém as duas"** — a **Anotações** (pública)
continua, e o caderno entra ao lado.

É literalmente o mesmo caderno: mesma tabela (`anotacoes_tr` com `parcial_num`), mesmas rotas
(`GET/POST/PATCH /registros`), mesmo desenho do item (`regItemHtml`) e mesma regra de estado
(`regEstado`). **O que muda é a vista** — na planilha, a parcela; na ficha, a TR inteira agrupada
por parcela.

⚠️ **QUEM ESCREVE NA FICHA ESCOLHE A PARCELA**, no seletor `em [Parcial N ▾]`. A ficha não tem
parcela corrente, e gravar sem dizer qual criaria um caderno paralelo, sem lugar na planilha.

⚠️ **A REPINTURA ALCANÇA AS DUAS TELAS.** `regRecarregar` recarrega as TRs da planilha **e** a TR
aberta na ficha, e repinta quem estiver montado — decidido pelo DOM (`getElementById`), nunca por
uma variável "em que tela estou", que seria um terceiro estado para manter em dia.

### 3. O CADERNO PRIVADO SAÍA PELA ROTA PÚBLICA DA TR — fechado antes de qualquer divulgação

`GET /anotacoes_tr?tr=X` fazia `SELECT *` **sem filtrar `parcial_num`**. Como o caderno mora na
mesma tabela, a anotação privada de um analista sairia pela rota que qualquer um usa para ler as
anotações públicas da TR.

⚠️ **NÃO VAZOU** — medido antes de consertar: **zero** registros de caderno gravados até ali. Mas
o card com a novidade estava pronto para ir aos 48, e o primeiro item escrito já sairia.

O conserto são duas linhas em espelho, e as duas precisam existir:
- `GET /anotacoes_tr` ganhou `parcial_num IS NULL` — a rota pública só enxerga a anotação da TR;
- o `DELETE` ganhou `AND parcial_num IS NULL` junto com o `analista_id` — sem isso, a rota pública
  apagaria item de caderno pelo id.

⚠️ **E A ROTA DO CADERNO FAZ O INVERSO**: só o autor, e só o que **tem** parcela. As duas se
complementam, e há teste que falha se uma delas perder a condição.

### 4. A PARCELA ARQUIVADA SAIU DO SELETOR — e a regra foi para o servidor

Achado ao conferir o card antes de postar no WhatsApp: na ficha da Gestão o seletor listava
**parcela já arquivada**, e o `POST /registros` recusava com **409**. Botão aceso que não grava é
a **armadilha 12** — e na Minha Planilha isso já estava certo desde 12/10.

⚠️ **A CAUSA ERA A TELA AGRUPAR AS PCs POR CONTA PRÓPRIA.** `gesParcelasDaTr` montava as parcelas a
partir de `t.pcs`, e o arquivamento não entrava na conta. Agora `GET /gestao` manda
`parcelas: [{num, rotulo, arquivada, n_pcs}]` **pronta**, na ordem da ficha.

⚠️ **A REGRA É A MESMA DE `lib/registro.js`, E PELO MESMO CAMPO, DE PROPÓSITO:** a parcela só
acabou quando **todas** as PCs dela foram arquivadas — lá é `bool_and(COALESCE(arquivada,false))`,
aqui é nenhuma PC fora de `arquivada`, e `etapaDaPc` lê a mesma coluna. Duas perguntas diferentes
para *"esta parcela acabou?"* é a segunda ficando velha.

Na ficha, agora: a arquivada **sai do seletor**; os itens dela ficam **à vista, em só leitura**
(sem marcar, editar nem cancelar), com o rótulo *"arquivada, histórico"*; e com **todas** as
parcelas arquivadas o formulário não aparece, e a caixa diz por quê.

⚠️ **O "só leitura" vem do PRÓPRIO ITEM** (`parcela_arquivada`, que o servidor manda), a mesma
resposta que a Minha Planilha usa — e não de uma segunda conta na tela.

### 5. AS FIGURAS DO GUIA SÃO A TELA, NÃO UM DESENHO

O Richard viu o guia e perguntou: *"no card vc mostrou a tela e aqui não? por que? importante ter
a tela para eles verem"*. Tinha razão — as figuras eram os cards desenhados para o WhatsApp.

As três figuras do guia agora saem de um gerador que **carrega o `index.html`, executa as funções
reais** (`regCaixa`, `regPilulaTr`, `gesCadernoHtml`) com dados de exemplo e aplica o CSS do
próprio arquivo. O que aparece na figura é o HTML que o sistema produz.

⚠️ **PRINT TIRADO À MÃO ENVELHECE CALADO.** Figura gerada pelo código muda quando a tela muda; a
que foi desenhada continua mostrando a tela do mês passado e ninguém percebe.

O gerador está no scratchpad desta sessão (`gerar_previa_registro.js`) — **não foi versionado**.
Se for virar rotina, o lugar dele é o repositório.

### 6. O CASO JULIANA — a TR com DOIS donos, e o analista só enxerga a PC dele

**⚠️ MEDIDO, NADA GRAVADO. Espera decisão do Richard** — ele vai conferir no trabalho.

A Juliana de Souza (id **45**, grupo 3) mandou um PDF com três inconsistências. **As três têm a
mesma causa, e ela está certa nas três.**

A planilha recorta por `analista_id`. Nessas TRs a **PC final é dela** e as **parciais são de
outra pessoa** — então a TR aparece "✓ concluída" e **sem as parciais**, porque as parciais não
são dela.

| TR | parciais | final | o que ela relatou |
|---|---|---|---|
| `2022TR001687` | **Tanimeri** (35, **grupo 2**) — baixou em 25/08, `origem=sistema` | Juliana | *"retirar, já analisada por outro técnico"* |
| `2022TR002065` | **Marlene** (46) — baixou em 07/10, `origem=sistema` | Juliana | *"não carregou as parciais"* |
| `2022TR002108` | **Marlene** (46) — baixou em 07/10, `origem=sistema` | Juliana | *"não carregou as parciais"* |

⚠️ **AS TRÊS FINAIS DELA VIERAM DA CARGA** — `origem_baixa = 'recarga_parcial_20260805'`,
`data_baixa = 30/06`. **Ela não analisou nenhuma.** As parciais, ao contrário, são trabalho real e
recente, com `registrado_por` preenchido.

**O padrão no acervo inteiro:** **20 TRs com dono misto** (45 PCs), das quais **17** no formato
"final de um, parciais de outro" — e **exatamente 3 são dela**. Ela listou as três.

#### O quarto caso é o INVERSO — `2023TR000039` (APAE de Canelinha)

As duas PCs são da **Graciane** (41), com baixa de carga e **arquivadas em 04/10**. Por isso não
está na planilha da Juliana. **Mas o print do SIGEF mostra JULIANA DE SOUZA** (CPF
029.073.159-35) nas diligências de 27/11/2025 e 13/02/2026 e no *"Regular com Ressalvas"* de
28/04/2026. **O trabalho no SIGEF é dela; o registro aqui está com a Graciane.**

⚠️ O processo do print parece `SCC 00065511/2024`; **no banco é `SCC 00006511/2024`**, e essa é a
única grafia que existe — a imagem está em resolução baixa. **Confirmar com ela** antes de supor
que há um segundo erro.

#### POR QUE NÃO FOI CORRIGIDO NA HORA

⚠️ **A ROTA OFICIAL DE TRANSFERÊNCIA RECUSA PC BAIXADA** — `SQL_MOVER` tem `AND NOT baixada`, de
propósito, para não mover produtividade. **Todas estas estão baixadas.** Qualquer correção aqui é
`UPDATE` à mão em produtividade alheia, e isso é decisão do Richard (regra 2 do time de agentes).

| analista | base hoje (baixada + parecer) | efeito da correção |
|---|---|---|
| Juliana (45) | 132, sendo **111 de carga** | **−3** se as finais acompanharem a TR |
| Tanimeri (35) | 62 | +1 |
| Marlene (46) | 45 | +2 |
| Graciane (41) | 46 | **−2** se a `2023TR000039` for para a Juliana |

⚠️ **AS 3 FINAIS SÃO DE CARGA → SÓ MEXEM NO ACUMULADO, não no trimestre** (item D2 da régua). Já a
`2023TR000039-PFINAL` tem `origem_baixa = 'secretario'` — **essa conta no trimestre**, e é a mais
sensível das quatro.

#### A RECOMENDAÇÃO QUE FOI PARA ELE

1. **As 3 TRs: a final acompanha a TR** — vai para Tanimeri (1687) e Marlene (2065 e 2108). A
   Juliana não analisou nenhuma, e é o que ela mesma está pedindo.
2. **`2023TR000039`: falar com as duas antes.** Há o print do SIGEF, **não há prova no sistema**, e
   esta move produção do trimestre.

⚠️ **Quando autorizar:** script com **lista explícita de `codigo_pc`** (regra 11), trilha em
`parcela_historico` e **conferência depois de gravar, dentro da mesma transação**.

#### ⚠️ E UM ACHADO MAIOR, QUE APARECEU NO CAMINHO

**82 PCs em 46 TRs têm `status = 'livre'` COM `analista_id` preenchido.** Pela definição única
(`PC_LIVRE_SQL` = `analista_id IS NULL AND status = 'livre'`) elas **não** aparecem no Estoque para
ninguém assumir — mas o status diz que estão livres. É um limbo: têm dono e se dizem sem dono.

As maiores: **Andressa 11 · Aline 11 · Tatiana 8 · Simone 8 · Grace 7 · Elisandra 7**. A
`2022PC003986` (parcial 2 da `2022TR002065`, da queixa da Juliana) é uma delas.

**Precisa decidir qual lado está certo** — o dono (e o status vira `analise`) ou o status (e o
dono é limpo). **Não foi tocado.**



---

### O QUE FOI GRAVADO (13/10)

| onde | o quê |
|---|---|
| `novidade` | **id 9** — "Registro / Tarefa: anote na própria parcela…" (`tela_nova`, todos) |
| `novidade` | **id 10** — "O seu caderno agora também na aba Gestão…" (`melhoria`, todos) |
| `repositorio` | **id 14** — "GUIA — REGISTRO / TAREFA: O CADERNO DO ANALISTA", categoria **Orientações** |
| `notificacao` | **55 recados** no sino, `alvo: todos`, não urgentes |

⚠️ **AS DUAS NOVIDADES E O ITEM DO REPOSITÓRIO APONTAM PARA O PAGES** — o guia e as três telas em
`assets/orientacoes/`. Por isso a ordem foi: **push primeiro, escrita depois**, com o 200 dos
quatro arquivos conferido antes de gravar. Publicar antes deixaria a novidade no ar com o link
quebrado — e o link quebrado é o que a pessoa clica primeiro.

⚠️ **O SINO VAI PARA TODOS OS CADASTROS** (`SELECT id FROM usuarios`, sem filtro de ativo) menos o
autor: **55**. É como a rota sempre funcionou; fica registrado porque o número não é "quem
trabalha", é "quem está cadastrado".

### O QUE NÃO FOI ABERTO NO NAVEGADOR

- [ ] **A aba Novidades com as duas novas**, e a figura da tela dentro do cartão.
- [ ] **A ficha de uma TR com parcela arquivada**, na Gestão — o seletor sem ela, e os itens dela
      sem o lápis e sem o X.
- [ ] **O caderno na ficha**, escrevendo de um lado e conferindo do outro.
- [ ] **O "Abrir" da fila** clicado no primeiro segundo, antes de a planilha carregar (o caso
      Miriam) — tem de avisar que está abrindo, e abrir sozinho quando a lista chegar.

### O QUE CONTINUA ABERTO

- **O CASO JULIANA — 4 TRs com dono trocado** (seção 6 acima). ⚠️ **Espera decisão:** mexe na
  produtividade de 4 analistas, e a rota de transferência recusa PC baixada. O Richard vai
  conferir no trabalho.
- **82 PCs com `status` dizendo `livre` E `analista_id` preenchido**, em 46 TRs — achado novo, maior que a
  queixa que o revelou. Nada tocado.
- **7 processos ainda em duas TRs** que o portal não resolve: `ADR 10853/2017` (41 PCs),
  `FCEE 968/2020`, `FCEE 963/2020`, `FCEE 276/2022`, `FCEE 384/2022` (estes dois são cadastro de
  proponente), `SCC 12247/2024`, `SCC 12367/2024`.
- **24 PCs limpas** esperando os analistas informarem o processo certo pelo lápis.
- ~~**Avisar a Graciane**~~ — ✅ **FEITO em 13/10**: recado id **2157** no sino dela, contando a
  correção do processo da parcial 1 da `2021TR001008` e por que ela não tinha sido avisada antes.
- **Os 10 recados da Zadir** voltarem a não lidos (ids 535, 620, 1086, 1225, 1227, 1270, 1274,
  1278, 1375, 1436).

---


## ▶ 12/10/2026, à tarde — A TELA DO ANALISTA FOI REFEITA, E OS PROCESSOS TROCADOS APARECERAM

**Tudo publicado.** ⚠️ **HOUVE ESCRITA EM PRODUÇÃO** — a correção de um processo, a limpeza de
24, e 11 avisos no sino. Detalhe em *"O que foi gravado"*, abaixo.

| commit | repo | o quê |
|---|---|---|
| `119b430` · `03b9b10` | api · gt | a **fila "Para você hoje"** na Minha Planilha |
| `7d75a5d` | gt | o contorno grafite e a caixa alta da fila |
| `6e58ac9` | gt | **cada parcela num bloco fechado**, com faixa verde |
| `e46c271` · `b1a0940` | api · gt | a caixa **Registro / Tarefa** |
| `ab2b09c` · `aca03b7` · `3ec5908` | gt · api · gt | os três consertos do mesmo dia |

---

### 1. A FILA "PARA VOCÊ HOJE" — `lib/fila.js` e `GET /minha_fila`

Nasceu de uma frase: *"eu agora voltei a analisar processos e acho bem confuso"*. O problema não
era a tela — era que **o analista CAÇA o trabalho**: abre a planilha, expande TR por TR, lê o
cartão, fecha, abre a próxima. São 120 TRs no acervo do Richard, 51 no da Grazielly.

A fila agrupa **POR AÇÃO, não por TR**: o C.I. devolveu · o SGPe já liberou · falta só a FINAL ·
em diligência. Medido no acervo do Richard: **5 · 3 · 10 · 14**.

⚠️ **UM ITEM CAI NUM GRUPO SÓ, e a ordem é a prioridade.** A final em reanálise que encerra a TR
precisa aparecer como trabalho dele, e não como "espera a entidade".

⚠️ **O VEREDITO DO SGPe NÃO FOI REESCRITO EM SQL** — vem de `lib/ci-sgpe.js`, o mesmo que o botão
obedece. É por isso que a fila nunca oferece um clique que a tela depois recusa.

⚠️ **A TRAMITAÇÃO DAS CANDIDATAS VEM EM DUAS CONSULTAS**, por `unnest`, e não em duas por parcela:
com 40 candidatas seriam 80 consultas de uma vez, e o pool tem 10 conexões.

### 2. O CARTÃO DA PARCELA — bloco fechado, faixa verde

O Richard abriu a `2021TR001578` e disse que estava confuso. **O defeito não era o tamanho da
letra:** a faixa de passo e o bloco do C.I. ficavam SOLTOS entre uma parcela e outra — no print, o
"Passo 3 de 3 · registrado em 30/06" da FINAL aparecia logo abaixo da linha dela e parecia
conclusão da Parcial 1.

Agora cada parcela é um bloco com moldura: faixa com o nome, sub-linha com pílulas e processo, e
dentro tudo o que é dela. ⚠️ **A FAIXA É VERDE ESCURO INSTITUCIONAL (`#004D2B`)** — a primeira
versão usou o grafite das linhas e virou um retângulo quase preto: *"essa cor destoa"*. Quando o
C.I. devolveu, ela fica **âmbar**.

⚠️ **OS LINKS DO SGPe NÃO MUDARAM** — saem do `procHtml`, o ponto único das 11 telas (armadilha
17); só passaram da linha para a sub-linha. E **PC sem processo continua chamando o `procHtml`**,
porque é ele que mostra o caso "sem processo" com o lápis — filtrar esconderia quem precisa de
conserto.

⚠️ **O rótulo da parcela e o âncora passaram a morar numa função só** (`pFaixaParcela`,
`pBlocoAbre`), chamada pelos dois ramos. Eram duas cópias da mesma expressão.

### 3. O MENU "AÇÕES" — de 14 itens para 5

O print mostrava a lista **atrás da barra de tarefas do Windows**. O `acReposicionar` já virava o
menu para cima; com 14 itens — 8 desligados, com duas linhas de explicação cada — ele não cabia de
nenhum lado. ⚠️ **NÃO ERA O LUGAR: ERA O TAMANHO.** Os disponíveis sobem para "Agora"; o resto vai
para **"Mais ações (N)"**, com o mesmo motivo. Ao abrir, a altura trava em **62% da janela**.

### 4. A CAIXA "REGISTRO / TAREFA" — o caderno do analista

⚠️ **NÃO NASCEU TABELA NOVA.** A `anotacoes_tr` já tinha **87 anotações de 14 analistas**, e o
conteúdo delas já era isto: *"Diligência 03/2026 - Prazo 10 dias"*. **O que faltava não era onde
escrever — era VER o que já foi escrito:** a Marlene gravou a mesma anotação em dois dias seguidos
(ids 88 e 89). A tabela ganhou 8 colunas por `ADD COLUMN IF NOT EXISTS`; **nenhuma linha existente
mudou** (conferido: 87 continuam com `parcial_num` nulo = anotação da TR).

**As quatro decisões do Richard**, implementadas:
1. **Quem vê é quem escreveu** — `analista_id` no `WHERE` de todas as consultas, inclusive na
   leitura. Não há rota que devolva o caderno de outra pessoa.
2. **Prazo opcional, e só em tarefa** — registro com prazo é recusado pelo servidor.
3. **A pílula da barra da TR PULSA** só quando há tarefa vencida ou vencendo hoje — e quem decide
   é o servidor, em `resumoPorTr`. Tarefa para a semana que vem aparece sem pulsar.
4. **Editar e cancelar, nunca apagar** — cancelar marca `cancelada_em` e some da lista.

⚠️ **NA PARCELA QUE ACABOU A CAIXA NÃO COBRA NADA** — decisão do mesmo dia, vendo a tela: *"PC
finalizada e arquivada registrando tarefa? como assim"*. Medido: **115 das 253 parcelas do acervo
dele já tinham acabado** e estavam sendo convidadas; no GT, **3.131 de 8.341**. Arquivada sem nada
escrito: a caixa não existe. Com histórico: só leitura. E **a tarefa aberta de parcela arquivada
some da pílula** — a guarda é do servidor, que recusa a gravação com 409.

⚠️ **UM DEFEITO MEU ESCAPOU PARA A PRODUÇÃO E DUROU UMA PUBLICAÇÃO:** o ramo "sem nenhum item"
devolvia o convite ANTES de olhar se a pessoa tinha clicado em Escrever — o botão não fazia nada
(armadilha 12 com outra roupa). O teste só media a parcela que já tinha item.

---

### 5. OS PROCESSOS TROCADOS — o caso que a Graciane achou

A analista viu na tela dela um documento que não era seu. **Era erro de dado, não de tela:** a
parcial 1 da `2021TR001008` (APAE de Florianópolis) estava com `SCC921/2022`, que é o processo da
**PC FINAL da `2021TR000895`** (APAE de Armazém, Grazielly).

⚠️ **A PROVA VEIO DO PORTAL DO SGPe, NAS DUAS PONTAS** — e o script recusaria a gravação se
qualquer uma não confirmasse:
· `FCEE 921/2022` → *"PRESTAÇÃO DE CONTAS **APAE FLORIANÓPOLIS**"*
· `SCC 921/2022` → *"Prestação de Contas Final do Termo de Fomento **2021TR000895** da Apae de
  Armazém"*

⚠️ **A CORREÇÃO FOI PELA ROTA DO LÁPIS** (`PATCH /prestacoes_contas/:codigo_pc/processo`), não por
`UPDATE` à mão: é ela que grava `parcela_historico` e mantém o rastro igual ao de qualquer
analista. Linha **5873**.

**E o padrão foi varrido no acervo inteiro: 25 processos gravados em MAIS DE UMA TR.**

⚠️ **A PRIMEIRA VARREDURA ERROU, E O ERRO FOI MEU:** usei uma normalização escrita à mão que **não
tirava os zeros à esquerda** — `SCC921/2022` e `SCC 00000921/2022` passaram como processos
diferentes, e **o caso da Graciane não apareceu**. Refeito com a `chaveProcesso` de `lib/busca.js`,
a cópia única: de 18 saltou para 25. **Normalização paralela é a segunda cópia ficando velha.**

⚠️ **O DETALHAMENTO DO SGPe CITA A TR EM QUATRO FORMATOS** — `2021TR001594`, `2022TR1459` (sem
zeros), `TR000310` (sem ano) e `TR 269/2023`. A primeira versão só reconhecia o primeiro e jogava
nove casos resolvíveis para a decisão manual.

### 6. O QUE FOI GRAVADO

| o quê | tamanho |
|---|---|
| `2021PC001289` — processo corrigido para `FCEE 921/2022` | 1 PC |
| **24 PCs** com processo de outra TR — número **limpo**, valor antigo na trilha | 24 PCs · 18 TRs · histórico 5935–5958 |
| aviso no sino aos analistas das 24 | **8** (ids 2066–2073) |
| recado ao Controle Interno (a separação da final) | 3 (ids 2034–2036) |
| as 8 colunas novas de `anotacoes_tr` | ALTER no boot |

⚠️ **LIMPAR, E NÃO SUBSTITUIR, FOI DECISÃO CONSCIENTE:** o SGPe diz de quem o processo é — isso
prova qual PC está errada —, mas **não diz qual seria o certo da outra**, e a consulta do portal é
por sigla/número/ano, não por TR. Gravar número adivinhado seria trocar um erro por outro, em PC
que na maioria está baixada.

⚠️ **E UMA GUARDA ERRADA QUASE DEIXOU 7 ANALISTAS SEM AVISO:** o envio pedia `ativo AND aprovado`,
e no dry-run **7 dos 8 foram barrados, inclusive o superadmin**. Medido: **`aprovado = false` em 48
dos 56 cadastros** — a coluna só é preenchida por quem passou pelo Primeiro Acesso (19/07/2026 em
diante). **Quem não entra no sistema é quem tem `aguardando_aprovacao = true`.** O recado ao C.I.,
mais cedo, só passou porque os três técnicos são cadastros novos.

### 7. O QUE FICOU ABERTO

- [ ] **7 PROCESSOS AINDA EM DUAS TRs**, que o portal não resolve — e precisam de olho humano:
      `ADR 10853/2017` (2 TRs, **41 PCs**) · `FCEE 968/2020` e `FCEE 963/2020` (as duas entre
      `2019TR000168` e `2019TR000565`) · **`FCEE 276/2022` e `FCEE 384/2022`, que são *cadastro de
      proponente*, não prestação** — provavelmente nem deveriam estar no campo · `SCC 12247/2024`
      (AMA Videira) · `SCC 12367/2024`.
- [ ] **As 24 PCs limpas esperam o analista informar o processo certo** pelo lápis. Os 8 foram
      avisados; vale conferir daqui a alguns dias quantas foram preenchidas.
- [ ] **Avisar a Graciane** — ela **não recebeu aviso no sino** (a dela foi corrigida, não limpa).
      O texto para o WhatsApp está no histórico desta sessão.
- [ ] **NADA DISTO FOI ABERTO NO NAVEGADOR POR UMA PESSOA**, salvo o que o Richard viu em print: a
      fila, a tarja, o menu com "Mais ações", o bloco da parcela e a caixa Registro / Tarefa.
      ⚠️ **O POST de `/registros` nunca foi exercitado** — ninguém salvou um registro ainda.
- [ ] **Os 10 recados da Zadir** continuam pendentes (ids 535, 620, 1086, 1225, 1227, 1270, 1274,
      1278, 1375, 1436).

### Testes em 12/10

`sigpc-api`: `teste_fila.js` **38 · 0** (novo) · `teste_registro.js` **66 · 0** (novo) ·
`teste_meta.js` 81 · 0 · `teste_busca.js` 107 · 0 · `teste_busca_global.js` 99 · 0 ·
`teste_notificacao.js` 107 · 0 · `teste_sigef.js` 179 · 0 · `teste_ci.js` 149 · 0.
`sigpc-gt`: `teste_front_fila.js` **76 · 0** (novo) · `teste_front_bloco.js` **35 · 0** (novo) ·
`teste_front_registro.js` **69 · 0** (novo) · `teste_front_lote_ci.js` 24 · 0 ·
`teste_front_regua.js` 41 · 0 · `teste_front_paginacao.js` 14 · 0 · `teste_front_gestao.js` 46 · 0.

**As falhas que sobram são anteriores** e foram conferidas contra o `HEAD`: `front_devolucao` 2 ·
`front_menu` 2 · `front_prazo` 1 · `front_vercomo` 2 · `front_busca` (erro de `perfilEfetivo`, já
quebrava antes) · no servidor, `sgpe_portal` 2 e `sgpe_situacao` 1.

⚠️ **TRÊS TESTES REPROVARAM CÓDIGO CERTO e foram corrigidos** — dois contavam as duas cópias
antigas do rótulo da parcela, e o da trava do C.I. tinha como marco de janela a caixa branca que
deixou de existir. **Armadilha 30 de novo, e desta vez o marco era um estilo CSS.**

---

## ▶ 05–12/10/2026 — A RÉGUA NO AR, E A SEMANA DAS DÚVIDAS DOS ANALISTAS

**Tudo publicado.** ⚠️ **HOUVE ESCRITA EM PRODUÇÃO** — cinco rodadas, todas autorizadas uma por
uma, com dry-run antes e conferência dentro da mesma transação. O quadro completo está em
*"As escritas em produção"*, abaixo.

> ⚠️ **ANTES DE QUALQUER COISA SOBRE PRODUTIVIDADE, LER `REGRA_PRODUTIVIDADE.md`** — as respostas
> da coordenação, item por item. O arquivo nasceu em 05/10 porque a mesma pergunta já havia sido
> feita três vezes. **Se a resposta está lá, não é pergunta — é especificação.**

| commit | repo | o quê |
|---|---|---|
| `6915929` · `8f72a21` | `sigpc-api` | a **régua** do documento de 18/09 entra no sistema |
| `8399bd6` · `6cb0a1c` | `sigpc-gt` | as três telas leem a régua, e nasce a **tela de ajuda** |
| `b53e362` · `f9f74bd` | `sigpc-api` · `sigpc-gt` | a analista id 9 passa a ser **"Clara Cristina"** |
| `0dc147c` · `22f27d2` | `sigpc-api` · `sigpc-gt` | o **sino guarda 24 h** o que marcou como lido · a **paginação do Estoque** |
| `a603ccb` | `sigpc-api` | o **código de TR abreviado** passa a ser encontrado |
| `1d6fb9c` · `69a44e4` | `sigpc-api` · `sigpc-gt` | a **busca global** diz quem está com a TR e quem esteve |
| `d4e2103` | `sigpc-gt` | a barra do lote vira um **painel que se faz ver** |

---

### 1. A RÉGUA ENTROU NO AR (05/10)

O que estava pronto e não publicado no bloco anterior **subiu**. ⚠️ **O `sigpc-api` foi primeiro**,
porque o `sigef_conta` novo vem do servidor — e o primeiro build ficou **preso na fila do Railway**,
o que exigiu o commit vazio `8f72a21` para disparar outro. Conferido no ar depois disso.

O resumo da régua está no `CLAUDE.md` deste repositório, no bloco do topo. **O que não pode ser
desfeito sem querer continua valendo:** a `contaMeta` **saiu da tela** · o número do item B9
**não é eterno** (`FIM_DA_META_INFORMADA`) · as baixas com data de carga **só entram no acumulado**,
e a lista é **por origem, nunca por data** · *"de fevereiro em diante"* **não tem fim** · **a tela
não soma meta**.

⚠️ **UMA REGRESSÃO APARECEU E FOI CORRIGIDA NO MESMO DIA** (`6cb0a1c`): a tela lia a régua e
**quebrava inteira** enquanto o servidor novo não estava no ar. Nasceram `_reguaIndisponivel` e
`reguaAvisoHtml()` — a Produtividade passa a avisar que a meta está indisponível em vez de não
desenhar nada. **Tela que depende de rota nova precisa do ramo em que a rota ainda não existe.**

**Medido em 05/10:** GT **71%** (meta 6.298 · produção 4.443) · G1 89% · G2 72% · G3 51%.

---

### 2. AS CINCO CORREÇÕES QUE NASCERAM DE RECLAMAÇÃO DE ANALISTA

Nenhuma foi ideia minha. **As cinco vieram de pergunta de analista no WhatsApp**, e é por isso que
estão juntas: a semana foi de atendimento, não de frente nova.

#### a) A busca de TR abreviada — `a603ccb`

A Noici digitou **`2020TR793`** e o sistema disse *"não consta na planilha"*. A TR existe:
`2020TR000793`. **Quem escreve o código de uma TR não digita os zeros** — e eram "várias
reclamações", nas palavras do Richard.

⚠️ **A CHAVE ENTRA AO LADO DO `ILIKE`, COM `OR` — não no lugar dele.** O `ILIKE` do texto cru é o
que faz a busca por **pedaço** funcionar (`TR0007`); a chave normalizada, que tira os zeros à
esquerda de cada token nos dois lados, é o que acha o abreviado. **Trocar um pelo outro conserta
metade e quebra a outra.** `condicaoTr` em `sigpc-api/lib/busca.js`, com `CAMPOS_CHAVE` incluindo
`tr` ao lado dos campos de processo.

⚠️ **É A MESMA `chaveProcesso` DO PROCESSO SGPe**, de propósito: o problema é o mesmo (zero à
esquerda), e uma segunda normalização seria a segunda cópia ficando velha.

#### b) A paginação do Estoque — `22f27d2`

O print do Richard mostrava **"Pág. 5 de 1"** e a lista vazia. O filtro encolhe a lista e a página
corrente continua onde estava — **a tela pedia uma página que não existe mais**.

```js
const ultimaPag = Math.max(0, Math.ceil(TOT / PP) - 1); if (PAG > ultimaPag) PAG = ultimaPag
```

⚠️ **Zerar a página a cada filtro seria pior:** quem está na página 7 e muda só o grupo perde o
lugar. O correto é **limitar ao fim**, não voltar ao começo. `teste_front_paginacao.js` (14 · 0).

#### c) O sino guarda 24 h o que marcou como lido — `0dc147c`

A Marlene foi aprovada e **não recebeu** o aviso: abriu o sino, ele marcou tudo como lido, e na
visita seguinte a caixa estava vazia. **Abrir o sino apagava o recado que a pessoa ainda não tinha
lido.** A regra virou `HORAS_AINDA_NO_SINO = 24` em `sigpc-api/lib/notificacao.js`, com a condição
`lida_em IS NULL OR lida_em > NOW() - (INTERVAL '1 hour' * 24)`.

⚠️ **O LIDO NÃO VOLTA A SER NÃO LIDO** — ele só **continua à vista**, abaixo do divisor
*"JÁ LIDAS — ficam aqui por 24 horas"*. Marcar de novo como não lido mentiria sobre o estado e o
contador voltaria a subir sozinho. O `sinoRender` ganhou `linhaNotif` e a separação
`novas` / `lidas`.

#### d) A busca global diz quem está com a TR, e quem esteve — `1d6fb9c` · `69a44e4`

Pedido do Richard, **e só ele vê**: `const souSuper = papel.perfilEfetivo(u[0]) === 'superadmin'`
no servidor — sem isso a rota já devolve o acervo de qualquer analista (armadilha 18), e o dono
seria mais um dado vazando.

Três campos novos no card: **quem está com a TR** e em que situação está essa pessoa (em
atividade · dispensada · **sem cadastro no sistema**) · **quem esteve antes** · e a marca de
divergência quando o `analista_nome` da PC não corresponde ao `analista_id`.

⚠️ **A DIVERGÊNCIA DE NOME É MEDIDA PELA `nomeCurto`, NÃO POR SEMELHANÇA DE TEXTO.** A primeira
versão comparava os dois textos e acusava a **Goreti** ("Maria Goreti Korb" → "Goreti"), que está
certa. **A função que confere tem de ser a mesma que grava** — `nomeCurto` de `lib/assumir.js`.

⚠️ **O HISTÓRICO DEDUPLICA.** Um repasse de 46 PCs gravou **46 linhas iguais** na trilha; sem o
`historicoDeDonos`, o card listaria a mesma pessoa 46 vezes. `EVENTOS_DONO` é lista explícita —
`assumir_tr`, `devolucao_tr`, `transferencia` —, nunca "todo evento que menciona analista".

⚠️ **OS CAMPOS NASCEM FECHADOS**, e o silêncio é explicado: **91% das TRs não têm evento de dono**
(só 139 de 1.560). Campo vazio sem explicação seria lido como "nunca ninguém pegou", e não é isso —
é que a TR chegou por carga, sem trilha.

#### e) O painel da seleção em lote — `d4e2103`

O print mostrou a barra azul **atrás da barra de tarefas do Windows**. O Richard pediu **modal**;
eu propus **painel flutuante** e mostrei as duas opções lado a lado antes de mexer — ele escolheu
o painel.

⚠️ **E NÃO VIROU MODAL DE PROPÓSITO:** modal bloqueia a tela, e aqui a pessoa precisa **continuar
marcando parciais** depois da primeira. O pedido queria **ser visto**, não interromper.
`bottom:18px`, sombra `0 10px 34px`, faixa verde no topo, bolha com o número, três contadores
(parciais · prestações · valor) e **dois botões com pesos diferentes** — verde cheio para o C.I.,
azul claro para o SGPe. Antes os dois eram contorno branco sobre azul e ninguém sabia qual era qual.

⚠️ **A LINHA QUE DIZ O QUE CADA BOTÃO FAZ é parte do conserto, não enfeite:** quatro analistas
perguntaram na mesma semana para que servia a devolutiva pelo SGPe. **A explicação tem de estar
onde se decide.**

⚠️ **AS DUAS AÇÕES CONTINUAM CONFIRMANDO ANTES** (`moConfirm`, com o aviso de que vai a parcela
inteira). Mudou a forma do painel, não o que ele dispara. `teste_front_lote_ci.js` (24 · 0)
**executa o painel num DOM de mentira** e mede o que a pessoa vê.

---

### 3. AS ESCRITAS EM PRODUÇÃO

| quando | o quê | tamanho |
|---|---|---|
| 06/10 | **"Cris" → "Clara Cristina"** — `usuarios` id 9 e o acervo | 1 cadastro · **208 PCs** |
| 08/10 | **`2020TR000750`** — a parcial 1 estava **partida em duas** | **6 PCs** reunidas |
| 09–10/10 | **`2022TR001174`** — Grazielly → Ana Claudia (id 22) | **16 PCs** + coluna `grupo` 3→2 |
| 10/10 | **3 TRs do estoque para a Tanimeri**, mais a PC órfã | **124 PCs** + 1 PC movida |
| 07–11/10 | **recados pelo sino** | **15** + 2 coordenadores + **47** |
| **12/10** | **as 5 prestações FINAIS gravadas com número de parcial** (armadilha 15) | **5 PCs**, 1 por TR |
| **12/10** | **recado ao Controle Interno** pelo sino (ids 62, 63, 64) | **3 avisos** |

⚠️ **A `2020TR000750` É O CASO QUE PROVA A ARMADILHA 14.** As 9 NLs da parcial somam
**R$ 15.873,83** — exatamente o valor do SIGEF — e estão **no mesmo processo** `SCC14075/2021`;
estavam gravadas como duas parciais diferentes. **Reuni-las revelou que 6 das 9 estão em
diligência**, o que a divisão escondia.

⚠️ **A TR 1174 FOI PARA A CLAUDIA ERRADA NA PRIMEIRA TENTATIVA** — id 36 (Claudia, G3) em vez da
id 22 (Ana Claudia, G2). O Richard assumiu a confusão e mandou corrigir; foi corrigida pelo repasse
**5444**, e a coluna `grupo` foi junto. **"Claudia" não identifica pessoa neste cadastro** — são
duas, em grupos diferentes. **Só o `analista_id` identifica** (armadilha 1).

⚠️ **AS 5 FINAIS COM NÚMERO DE PARCIAL SAÍRAM DO ACERVO** (armadilha 15). A `2021TR002133` era
minha e **bloqueava a devolutiva pelo SGPe da própria final** — a regra lia "a parcela 1" e
encontrava uma PC sem baixa, que era a parcial real em diligência. As outras 4 (Grazielly,
Janaína, Rafael, Elisandra) desenhavam um cartão só.
**Medido depois de gravar, com a rodada parada: zero finais com número, e zero grupos
`(tr, parcial_num)` com parcial e final juntas em todo o acervo.**

⚠️ **E ISSO MUDA A FILA DO C.I.** — a `2022TR000621` passou de um item para **dois**, e a
`2021TR001689` trocou o rótulo de "parcial 1" para **FINAL**. Não é trabalho novo: é o mesmo
processo com o nome certo. Os três técnicos foram avisados pelo sino no mesmo dia (ids 2034–2036),
com `ref_id` próprio para que reenviar não duplique.

⚠️ **O recado dos 15 foi PESSOAL, com o número de cada um** — e é por isso que funcionou. Aviso
geral não move ninguém. Os coordenadores foram avisados em separado, e o recado para os grupos de
WhatsApp saiu **sem nomear ninguém**, por decisão do Richard.

---

### 4. O QUE SE MEDIU NO CAMINHO

| número | o que é |
|---|---|
| **83%** | das TRs com dono **nunca foram assumidas pelo sistema** — 732 de 879. Chegaram por carga, sem trilha. |
| **91%** | das TRs **não têm evento de dono** — só 139 de 1.560 têm. É o silêncio que a busca global explica. |
| **25 de 41** | analistas estão **no limite de 6 TRs ou acima**. A Grazielly tem **51**. |
| **317** | prestações que **o SGPe já libera** e ninguém registrou, em 21 analistas (15 em atividade). |

⚠️ **O LIMITE DE 6 TRs NÃO BARRA NADA HOJE** — 25 de 41 estão acima dele. Tratar o número como
regra ativa seria afirmar uma trava que não existe.

---

### 5. AS ORIENTAÇÕES QUE FICARAM VALENDO

Escritas para o Richard encaminhar. **O que delas é regra, e não recado:**

- **"Aprovado não significa que a TR migra direto."** A aprovação libera o acesso; a TR continua no
  estoque até alguém assumir. Foi a dúvida da Marlene, e o recado dela saiu **sem falar de erro
  nosso** — só a orientação, por ordem do Richard.
- **"SEMPRE APERTE CTRL + F5 QUANDO NÃO ENCONTRAR UMA TR."** Pedido do Richard em negrito e fonte
  maior: parte das "TRs que sumiram" era página velha no navegador.
- **"A produtividade conta no parecer, não no encaminhamento."** A frase que evita a pergunta mais
  comum desde que a régua entrou.
- **"As alterações no nosso sistema não vão para o SGPe — e isso é de propósito."** O sistema
  **consulta** a tramitação do SGPe periodicamente para saber onde o processo está; ele **não
  escreve** lá. Foi o aviso enviado aos 47.
- **"Ausência no relatório do SIGEF não prova ausência de PC"** (armadilha 26) — a resposta à
  divergência planilha × sistema da Sandra.

---

### 6. O QUE FICOU ABERTO

- [ ] **NADA ABERTO NO NAVEGADOR POR UMA PESSOA:** a tela de ajuda da Produtividade · o Board com
      **"PCs recebidas"** e a meta em linha própria · o Quadro 1 do CGE com as **duas leituras** ·
      os três campos novos da **busca global** · o **painel do lote** (este eu conferi no ar às
      09:35 de 12/10 — painel descolado da borda, linha explicativa e os dois pesos de botão).
- [ ] **O RECADO DO C.I. NO WHATSAPP, em 13/10** — o do sino foi enviado (ids 2034–2036), mas os
      três têm **42, 58 e 58 avisos não lidos**: lá ele se perde. ⚠️ **O texto formal já foi
      aprovado** e está no histórico desta sessão; é só repassar.
- [ ] **A LISTA DE NLs DAS PARCIAIS 6 E 7 DA `2020TR000750`**, pelo SIGEF — a Sandra ia mandar.
      Sem ela as divergências **+4.660,98** e **+44.929,32** ficam em aberto. ⚠️ A NL
      **`2022NL009539`** aparece em **duas parciais com valores diferentes**, e é o fio a puxar.
- [ ] **Os 10 recados da Zadir** voltarem a não lidos — ids **535, 620, 1086, 1225, 1227, 1270,
      1274, 1278, 1375, 1436**. O dry-run passou em 05/10; o Richard mandou deixar para outro dia.
      ⚠️ **O script foi apagado na limpeza de temporários e precisa ser refeito** — por lista
      explícita de ids, nunca por condição derivada (armadilha 11).
- [ ] **As 24 PCs baixadas sem parecer** voltam a contar assim que o analista registrar o parecer.
      Vale o mesmo recado pessoal que funcionou agora.
- [ ] **O modal de ciência de repasse diz "sob responsabilidade de —"** quando a origem é o
      Estoque (`de: null`).
- [ ] **O cadastro `ZZ TESTE TRAVA`** (id 57, Controle Interno) continua ativo. Nunca entrou na
      apuração; o Richard decide se apaga ou inativa.
- [ ] **39 de 48 analistas sem portaria e 46 sem data de ingresso** — o termo de repasse exige os
      dois.
- [ ] **Medir o efeito dos recados:** `node medir_passo2.js` contra `baseline_passo2.json`
      (⚠️ exige papel técnico).

### Testes em 12/10

`sigpc-api`: `teste_meta.js` **81 · 0** · `teste_busca.js` **107 · 0** · `teste_busca_global.js`
**99 · 0** · `teste_notificacao.js` **107 · 0**.
`sigpc-gt`: `teste_front_regua.js` **41 · 0** · `teste_front_paginacao.js` **14 · 0** (nova) ·
`teste_front_lote_ci.js` **24 · 0** (nova).

⚠️ **DOIS ERROS MEUS QUE VALE REGISTRAR.** O `teste_front_lote_ci.js` foi **destruído** por um
script que fez `split(CR+LF)` num arquivo salvo com **LF** — o arquivo virou uma linha só, e tive
de reescrevê-lo inteiro. **Script de edição exata confere o fim de linha do arquivo antes de
cortar.** E a janela de teste do painel termina num **marco do próprio código**
(`html.indexOf('/**', i)`), nunca num número — armadilha 30, que já tinha cobrado duas janelas em
05/10.

⚠️ **E UM ERRO DE COMUNICAÇÃO, que é regra daqui para a frente:** ao escrever o recado da Nayara eu
incluí o quadro inteiro do Grupo 1. Do Richard: *"quanto mais informação vc manda mais confuso fica
e eles me deixam malucos com essas informações"*. **Recado de coordenação tem cinco linhas.** Dado
de apoio fica aqui, não na mensagem.

---

## ▶ 05/10/2026 — A RÉGUA DE PRODUTIVIDADE ENTROU NO SISTEMA

**Pronta e testada.** Nenhuma escrita no banco nesta sessão. ⚠️ **No dia, nada estava publicado;
foi publicada nas horas seguintes** — ver o bloco de 05–12/10, acima.

> ⚠️ **ANTES DE QUALQUER COISA SOBRE PRODUTIVIDADE, LER `REGRA_PRODUTIVIDADE.md`** — as respostas
> da coordenação, item por item. **O arquivo nasceu hoje porque a mesma pergunta foi feita três
> vezes:** o questionário respondido vivia num `.docx` na pasta Downloads, fora do repositório, e
> cada sessão nova reabria o que já estava decidido. Do Richard: *"pelo amor de deus sempre caímos
> nisso, e já resolvemos anterior"*. **Se a resposta está lá, não é pergunta — é especificação.**

### O que mudou

| onde | o quê |
|---|---|
| `sigpc-api/lib/meta.js` | **a régua, cópia única** — 12/mês ago–dez/2025 · zero em jan/2026 · 10/mês depois · proporcional por dias base 30 · congelada na saída · os 4 informados |
| `sigpc-api/lib/sigef.js` | a base passou de `baixada OU enviado_ci` para **`baixada AND parecer_tipo IS NOT NULL`**, na conta de hoje e na cumulativa |
| `GET /produtividade/regua` | a meta por pessoa e por grupo, com `de`/`ate`, **e a origem de cada número** |
| `sigpc-gt/index.html` | Produtividade, Board e relatório do CGE **lendo a régua** |

### As cinco coisas que não podem ser desfeitas sem querer

⚠️ **A `contaMeta` SAIU DA TELA.** Ela zerava a meta do dispensado — decisão de 28/08 — e isso
**contradiz o item B8 em silêncio**: a meta dele congela na saída e ele continua somando no grupo.
Era a armadilha 16 em ação, conta escrita na tela que nenhum teste do servidor alcançava.

⚠️ **O NÚMERO DO ITEM B9 NÃO É ETERNO.** Eduardo 35, Jeisson 17, Carla 12, Fabiana 12 são o
acumulado **até 30/09/2026**; de outubro em diante sobem 10 por mês como todos (item B4). **Sem
isso a meta dos quatro congelaria enquanto os outros 45 subiriam**, e o percentual deles cresceria
sozinho, mês após mês, sem ninguém produzir nada. `FIM_DA_META_INFORMADA` em `lib/meta.js`.

⚠️ **AS BAIXAS COM DATA DE CARGA SÓ ENTRAM NO ACUMULADO** (item D2). São **3.560**, da
`recarga_parcial_20260805`, todas com `data_baixa` em junho/2026. **A lista é por ORIGEM, nunca por
data:** cortar "tudo de junho de 2026" levaria junto **24 baixas de trabalho real**. O questionário
falava de `carga_historica`, que **não existe mais** no acervo — a recarga de 05/08 renomeou a
origem e manteve a data.

⚠️ **"DE FEVEREIRO EM DIANTE" NÃO TEM FIM.** A primeira versão de `metaDoMes` devolvia zero para
ano > 2026, e em janeiro de 2027 a meta do GT inteiro pararia de crescer sem erro nenhum na tela.

⚠️ **A TELA NÃO SOMA META.** O servidor manda `meta_por_grupo` pronto; o Board só mostra.


### A tela que explica a conta ao analista

**`irProdAjuda()`, botão "❓ Como é calculada" no topo da Produtividade.** Quatro blocos: a conta em
uma linha, com o fluxo em que o passo do PARECER é o destacado · o que conta, o que não conta e o que
ainda não conta · **por que o número mudou** (como era × como é agora, e a régua da meta mês a mês) ·
**por que demorou**, pelas cinco variantes reais · e onde conferir, pelo botão "Fonte".

⚠️ **NENHUM NÚMERO DE ACERVO E NENHUM NOME DE CAMPO ENTRAM NELA** — ordem do Richard. Quem lê quer
saber o que fazer e por que mudou; dado interno no meio disso vira ruído e gera justamente a pergunta
que a tela deveria evitar. **Há teste que falha se um número do acervo vazar para lá.**

⚠️ **A frase que evita a pergunta mais comum:** *"a produtividade conta no parecer, não no
encaminhamento"*. E a que responde a segunda: *"se o seu percentual caiu, não é porque você produziu
menos — a meta antiga cobria metade do tempo e estava sendo comparada com o período inteiro"*.

⚠️ **O estilo mora num bloco com prefixo `#ajpApp`**, nunca no CSS global: as regras dela falam de
`.col`, `.passo` e `.aviso`, nomes curtos que atropelariam dezenas de telas se vazassem.

### Os números, medidos em 05/10

| | meta | produção | % |
|---|---|---|---|
| **GT** | 6.298 | 4.443 | **71%** |
| G1 | 2.171 | 1.927 | 89% |
| G2 | 2.021 | 1.446 | 72% |
| G3 | 2.106 | 1.070 | 51% |

**A mudança de regra custou 31 PCs** — 7 que contavam só por terem ido ao C.I. sem baixa (todas em
diligência ou reanálise) e **24 baixadas sem parecer**, 17 delas da importação do SIGEF de 30/08.
⚠️ **As 24 voltam a contar assim que o analista registrar o parecer** — vale um recado pessoal para
os 12 analistas, como nas rodadas de setembro. **Quem derruba o percentual é a META**, não a regra.

**Conferências que fecharam:** a régua reproduz **as 14 linhas da tabela do item 3 do documento**,
uma a uma · a meta somada até 30/09 dá **5.918**, o mesmo número que foi para a coordenação em
27/09 · o relatório do CGE rodado com os dados reais: trimestre jul–set/2026 **960 baixadas sobre
meta 1.263 (76%)**, acumulado **4.592 sobre 5.918 (77,6%)**.

**Testes:** `teste_meta.js` **81 · 0** (novo) · `teste_front_regua.js` **25 · 0** (novo) ·
`teste_sigef.js` **179 · 0** · `teste_dispensa.js` **52 · 0**.
As falhas que sobram são **anteriores** e foram conferidas contra a cópia de antes das mudanças:
`sgpe_portal` 2 · `sgpe_situacao` 1 · `front_busca_global` 1 · `front_devolucao` 2 · `front_menu` 2
(a guarda do `irRel` mede `U.perfil` e o código usa `perfilEfetivo`) · `front_prazo` 1 ·
`front_vercomo` 2.

⚠️ **DUAS JANELAS DE TESTE QUEBRARAM POR FATIA FIXA (armadilha 30), e as duas acusavam código que
estava certo:** a do Quadro 2 em `teste_front_menu.js` tinha 900 caracteres e parou de alcançar a
linha medida quando a `cgeAgregar` ganhou comentários; e no `teste_front_regua.js` a âncora de fim
`'<!-- Graficos lado a lado -->'` estava **sem acento**, então a janela foi até o fim do arquivo e
passou a medir a Gestão Grupo.

### O que ficou aberto

- [x] **PUBLICADA** em 05/10 (`6915929` no `sigpc-api`, `8399bd6` no `sigpc-gt`). ⚠️ **O `sigpc-api` precisa subir ANTES** —
      o `sigef_conta` novo vem do servidor, e a tela só muda junto com ele.
- [ ] **NADA ABERTO NO NAVEGADOR:** o Board com "PCs recebidas" e a meta em linha própria, a tela
      Produtividade com a meta nova, e o Quadro 1 do CGE com as duas leituras.
- [ ] **Os 10 recados da Zadir** voltarem a não lidos — o Richard entrou com o login dela e o sino
      marcou a caixa inteira como lida em 30/09 às 14:31:23. O comando está pronto, por lista
      explícita de ids (535, 620, 1086, 1225, 1227, 1270, 1274, 1278, 1375, 1436), e o dry-run
      passou. **Falta o "pode".**
- [ ] **O modal de ciência de repasse diz "sob responsabilidade de —"** quando a origem é o
      Estoque (`de: null`). Três repasses da Ana Claudia, de 23/09. O conserto é um ramo no texto.
- [ ] **O cadastro `ZZ TESTE TRAVA`** (id 57, perfil Controle Interno) continua ativo. Nunca entrou
      na apuração; o Richard decide se apaga ou inativa.
- [ ] **39 de 48 analistas sem portaria e 46 sem data de ingresso** no cadastro — o termo de
      repasse exige os dois. A régua **não** depende disso (ela lê as portarias de substituição).
- [ ] **Medir o efeito dos recados de 28/09:** `node medir_passo2.js` contra `baseline_passo2.json`.

---

## ▶ 28/09/2026 — A MADRUGADA E O DIA: a devolutiva pelo SGPe, o sino e a aba Gerenciais

Cinco frentes, todas **no ar**. ⚠️ **Houve escrita em produção**: 3 novidades, 4 rodadas de recado
(55 + 33 + 40 + 3) e 2 itens no repositório — nenhuma tocou em PC, baixada ou parecer.

| commit | repo | o quê |
|---|---|---|
| `3970bc2` · `99117a3` | `sigpc-api` | a correção do processo alcança a **parcela** |
| `bf3a2db` · `dc3a012` | `sigpc-gt` | o modal do lápis pergunta o alcance |
| `64d4935` | `sigpc-api` | a urgência do sino deixa de ser eterna |
| `34a1e97` | `sigpc-gt` | abrir o sino marca o que ele mostrou |
| `e8dc860` · `4101d82` | `sigpc-gt` | a **aba Gerenciais** e os dois relatórios |
| `5072763` · `df976fa` | `sigpc-api` | a **devolutiva provada pelo SGPe**, e o lote |
| `18222da` · `358402a` | `sigpc-gt` | o caminho na tela, e o lote |
| `9dca63e` · `093e5e1` | `sigpc-gt` | o guia das situações e o card |

---

### 1. A CORREÇÃO DO PROCESSO ALCANÇA A PARCELA — e a escolha é do analista

**O caso do Valderi (G1):** na `2022TR000848` as parciais **2, 3 e 4** estavam com `SCC 3123/2023`,
e corrigir uma mudava as três. *"Quando tento alterar ele muda nas três PCs."*

⚠️ **É O DEFEITO ESPELHADO DO DE 22/09** — lá a correção alcançava de MENOS (1 PC, e a TR seguia
mostrando o número velho), e o conserto daquele dia a fez alcançar de MAIS. Os dois aparecem para
quem usa como *"salvei e não mudou o que eu queria"*.

⚠️ **E NÃO BASTA ESTREITAR:** um processo do SGPe **pode** carregar várias parcelas (armadilha 14).
Medido: **138 pares (TR, processo) com mais de uma parcial**, em 96 TRs, 564 PCs. Por isso
`alcance: 'tr'` existe — e **o padrão é a parcela, inclusive para quem não mandar nada**.

- `GET .../processo_escopo`: leitura pura, para o modal **perguntar com os números na mão**.
- A resposta do PATCH diz o que ficou **de fora** (`fora_da_parcela`), pelo valor ANTIGO — sem isso,
  quem corrige a parcial 3 sai achando que corrigiu a 2 e a 4.

---

### 2. O SINO QUE ENTUPIA

**O Richard viu:** o recado enviado naquela hora nascia na **nona linha** da caixa da Geisa.

⚠️ **A ORDEM ERA "URGENTE E NÃO LIDO PRIMEIRO"** — e, como só o CLIQUE marcava como lido, o urgente
ficava grudado no topo **para sempre**. Medido em 27/09: **465 avisos urgentes não lidos**, em **49
das 56 pessoas**, o mais velho de **12/08**. A Sandra Cezária tinha 40; a Geisa, 30 de 30 por ler.
**Quanto mais se marcava como urgente, menos se via o que era novo.**

- `URGENTE_DIAS = 7`: passado o prazo, o aviso entra na fila pela data. A tarja vermelha fica; o que
  acaba é a carona no topo.
- **Abrir o sino marca o que ele mostrou** (`POST /notificacao/marcar_lidas`, por lista de ids **e**
  com o destinatário no WHERE). ⚠️ **Não some da tela na hora**: o clique é "já tratei disto"; abrir
  é "estou lendo agora".
- ⚠️ **A recarga de 60 s ESPERA com o painel aberto** (`sinoTique`) — a carga traz só as não lidas, e
  sem a pausa ela esvaziaria o painel na frente da pessoa. Era o segundo defeito que a mudança criaria.
- `DIAS_GUARDA_LIDA` **15 → 60**: "lida" passou a significar "esteve na sua frente", e apagar isso em
  15 dias faria sumir recado que ninguém leu. ⚠️ **A notificação lida é APAGADA**, não arquivada.
- ⚠️ **As 465 antigas NÃO foram marcadas como lidas**: com a urgência expirando elas saem do topo
  sozinhas, e afirmar uma leitura que não houve iniciaria o relógio de exclusão.

---

### 3. A ABA GERENCIAIS — relatórios que existem DENTRO do sistema

*"Um relatório de analista que nunca acessou o sistema… isso deveria já ter em alguma aba."* Tinha
razão: a tela de Relatórios só sabia fazer o do CGE, e todo levantamento virava arquivo solto.

- **`GER_RELATORIOS` é uma LISTA**: o próximo relatório entra com uma linha. O segundo entrou assim.
- **Acesso ao sistema** — ⚠️ **os 5 que nunca acessaram são todos DISPENSADOS por portaria**, e os 2
  parados há +30 dias também. **A coluna da portaria é o que faz o relatório prestar**: sem ela o
  mesmo número vira lista de gente que ignora o sistema, e cobrança indevida é pior que relatório
  nenhum. A conclusão **muda conforme o dado**.
- **Parciais paradas no passo 2** — 397 parciais, 645 PCs, 34 analistas, 179 TRs, e as dez TRs com
  mais concentração (a Geisa tinha 40 numa TR só).
- ⚠️ **O timbre é o do sistema** (`docCabecalho` + `DOC_CSS`), o mesmo do CGE e do termo de repasse.

---

### 4. A DEVOLUTIVA DO C.I. PROVADA PELA TRAMITAÇÃO DO SGPe — a frente maior do dia

**O caso da Clara:** parcial 1 da `2020TR000764`, baixada e com parecer, processo `SCC 12315/2020`
que **entrou no FCEE/CONIN em 01/12/2025 e saiu em 02/12/2025**. O sistema pedia para mandar de novo
ao C.I., só para eles registrarem o que fizeram dez meses antes. Do Richard: *"eles têm muita
demanda, e mandar só para fazer esse trâmite é muito ruim"*.

**Medido nos 1.347 processos envolvidos:**

| | passo 2 | na fila do C.I. |
|---|---|---|
| passagem **provada** no SGPe | 292 | 270 |
| ainda no CONIN agora | 54 | 667 |
| nunca passou pelo C.I. | 47 | 41 |

⚠️ **AS TRÊS CONDIÇÕES SÃO CUMULATIVAS** (`lib/ci-sgpe.js`): entrou no C.I., **saiu**, e **não está
lá agora**. A terceira é a que protege o C.I. — e um processo que foi, voltou e foi de novo **não
prova nada**. A passagem que vale é a mais recente COM saída.

⚠️ **A PROVA É A TRAMITAÇÃO, E NÃO A PALAVRA DE NINGUÉM.** Não é declaração do analista: quem
responde é o que o portal registrou, com data.

⚠️ **E NÃO SE AFIRMA O TEOR.** Não grava `ci_opcao`, não grava técnico, não grava `parecer_ci`. O
evento tem **nome próprio** — `ci_pelo_sgpe` — para que quem varra o histórico atrás de decisão do
C.I. **não encontre isto no meio**. Na tela, "🏛 Devolutiva pelo SGPe".

⚠️ **AS DATAS SÃO AS DO SGPe**, e não `NOW()`: o fato aconteceu naquele dia.

**Quem pode:** o analista dono, o coordenador e o superadmin (decisão do Richard). Em parcela de
dono misto o analista não registra sozinho.

**O lote** (`/conferir` e `/lote`): ⚠️ **no servidor, e não na tela** — 40 conferências e 40 escritas
em série é o que a armadilha 16 proíbe. Uma transação para o lote inteiro, a prova relida DENTRO
dela, e **a recusa de uma não derruba as outras**. Provado na TR da Geisa: **das 40 paradas, 39
liberam** (58 PCs); a que sobra nunca passou pelo C.I.

---

### 5. O QUE FOI COMUNICADO — e por que cada um

| para quem | o quê |
|---|---|
| **55 pessoas** | a trava do C.I. e o botão "Consultar o SGPe agora" (novidade 6 · repositório 12) |
| **55 pessoas** | o guia "O que fazer em cada situação" (novidade 7 · repositório 13, fixado) |
| **33 analistas** | 1 recado PESSOAL com o número DELE de parciais paradas no passo 2 |
| **40 analistas** | 1 recado PESSOAL com quantas parciais o SGPe já libera |
| **3 do C.I.** | a mudança que mexe na fila deles — urgente, e **antes** de a fila cair |
| **todos** | o card, na novidade 8 e nos grupos |

⚠️ **O NÚMERO PESSOAL É O QUE FAZ A PESSOA ABRIR A TELA.** "Há parciais paradas no sistema" ninguém
lê como sendo sobre si; "você tem 56, nestas TRs" é a mesma frase que move.

⚠️ **O RICHARD FICOU DE FORA dos recados em massa** — as 51 parciais no nome dele são de suporte,
uma por TR, e não trabalho de analista esperando encaminhamento.

⚠️ **E O C.I. FOI AVISADO ANTES**: descobrir pela fila encolhendo sozinha seria a pior forma de ficar
sabendo. O recado diz o que o sistema **não** faz, como eles enxergam cada registro, e que basta
avisar para desfazer.

**Os guias e o card** moram em `assets/orientacoes/` e `assets/novidades/`, servidos pelo Pages.
⚠️ **As imagens ficam na MESMA pasta do guia**: com `../novidades/` a figura sumia dependendo de
onde o arquivo fosse aberto — foi o Richard quem viu. E a checagem que prova carregamento é
`naturalWidth`, não `complete`, que volta verdadeiro também para imagem quebrada.

---

### O que ficou aberto

- [ ] **NADA DISTO FOI ABERTO NO NAVEGADOR** por uma pessoa: o modal da devolutiva pelo SGPe, o lote,
      a aba Gerenciais, o modal do lápis com a escolha, e a faixa da trava do C.I.
- [ ] **Medir o efeito dos recados.** `node medir_passo2.js` compara com `baseline_passo2.json`
      (27/09: 346 no passo 2, 978 na fila, 168 prontas, 137 arquivadas). ⚠️ A medição por `/gestao`
      exige o **papel técnico**: no papel analista a rota recusa ver os outros, e a varredura sai
      incompleta sem dizer que está.
- [ ] **A produtividade** continua RETIDA até a Nayara responder ao relatório de 27/09.
- [ ] **O agendamento na nuvem falhou** três vezes (o comando é cortado antes de chegar ao servidor).
      O medidor está pronto; falta só disparar.

---

## ▶ 27/09/2026 — O DIA ANTERIOR. (Este bloco dizia "nenhuma escrita no banco desde 03/09";
deixou de valer na noite de 27/09, com a novidade, o recado para 55 e o item do repositório.)

Três frentes: **a trava do C.I. no arquivamento** (23/09, e a segunda leva na noite de 27/09), **a
produtividade** (regra validada, implantação **retida de propósito** até a coordenação ler o relatório)
e **o aviso da funcionalidade para a equipe** — novidade, recado e repositório, gravados em produção.

---

### 1. A TRAVA DO C.I. NO ARQUIVAMENTO — NO AR

| commit | repo | o quê |
|---|---|---|
| `c2b0c8e` | `sigpc-api`, `feature/baixa-por-parcial` | a regra e o SQL |
| `834f8ec` | `sigpc-gt` | a tela |

**A regra:** enquanto o processo estiver, no SGPe, **dentro do Controle Interno**, a parcial não é
"pronta para arquivar" e **não arquiva** — nem pela tela, nem pela rota.

⚠️ **O sistema mandava arquivar o que o C.I. ainda não tinha devolvido.** Medido em 23/09:
**634 das 797** parciais que ele chamava de prontas tinham o processo em `FCEE/CONIN`, em **186
TRs**; a que o Richard viu na tela estava lá havia **167 dias**. Arquivar ali **não dava erro** —
encerrava a parcial e a tirava da lista. O defeito não parecia defeito: parecia tarefa cumprida.

**Onde a regra mora, e por que aí:**
- `sigpc-api/lib/sgpe-situacao.js` — `SETOR_CI`, `ehSetorCI` (JS) e `sqlSetorCI` (SQL). ⚠️ **Um dono
  só:** três cópias de um `LIKE '%CONIN%'` divergiriam no dia em que a FCEE criasse um segundo setor
  de controle, e **a que ficasse para trás seria a que deixa arquivar**.
- `lib/arquivamento.js` — a regra entra na **`bloqueioDeFatos`**, a única cópia, e por isso a leitura
  da tela e o `POST /parcela/arquivar` recusam **com a mesma frase**.
- ⚠️ **O `LEFT JOIN` da leitura mora numa CTE própria (`arq_sgpe`), NUNCA dentro da `arq_parc`** —
  aquela faz `COUNT(*) AS n_pcs` e monta as listas de códigos: uma situação repetida pela chave
  normalizada **multiplicaria as PCs e inflaria número que a tela mostra**. Conferido no ar: o
  `n_pcs` continua igual à contagem real.
- ⚠️ **`FOR UPDATE OF p`** na `SQL_PARCELA`: trancar a linha do cache do SGPe não protege nada e
  brigaria com o job do rodízio, que escreve nela a cada hora.
- ⚠️ **A frase acionável vem primeiro:** diligência, "falta baixar" e "na fila do C.I." falam **antes**
  da trava nova. Todas bloqueiam igual — o que muda é o que a pessoa lê.
- ⚠️ **Sem leitura do SGPe, nada muda.** Afirmar que está no C.I. sem ter lido seria o mesmo erro na
  direção contrária.

**Na tela:** faixa vermelha com setor, desde quando e há quantos dias; botão cinza **sem `onclick`**,
com o motivo **ao lado em texto**; o processo como link pelo `procHtml`; e **a hora da leitura do
SGPe**. A pílula passou de "pronta para arquivar" a "no Controle Interno há N dias", a pílula verde
do acordo saiu do cabeçalho e a conversa vazia ganhou o terceiro motivo ("o processo ainda está com
eles"). Vai junto a **etiqueta da opção deduzida** (22/09, servidor `a21ad78`).

**Medido no ar depois de publicar:** as prontas caíram de **797 para 161**; **727 parciais**
bloqueadas por esta regra. `/gestao`, `/arquivamento` e `/parcela/acoes` respondem normalmente.

**Testes:** `teste_arquivamento_trava_ci.js` **44 · 0** e `teste_front_trava_ci.js` **24 · 0**.
As falhas que sobram são **anteriores**: `sgpe_portal` 2 · `sgpe_situacao` 1 (mede lote 300, e o job
passou a 600) · `busca_global` 1 · `devolucao` 2 · `menu` 2 · `front_busca` (`perfilEfetivo is not
defined`, conferido contra o `HEAD`).

- [ ] **NÃO ABERTO NO NAVEGADOR.** Abrir a parcial 4 do caso e ver a faixa vermelha, o botão cinza
      e o link do SGPe.

---

### 2. A PRODUTIVIDADE — REGRA VALIDADA, IMPLANTAÇÃO RETIDA

**A coordenação confirmou em 27/09 que o documento de 18/09 está correto e não alterou nada.**
⚠️ **A implantação NÃO começou, e é decisão do Richard:** o relatório novo **corrige um número que
ela já recebeu**, e mudar a tela antes de ela ler faria o percentual do grupo cair sem explicação —
e é ela quem assina os relatórios da CGE.

**A régua validada** (resposta de 17/09): conta a **PC baixada com parecer registrado** — o
encaminhamento ao C.I. **deixa de contar**; apuração desde **01/08/2025**; **12/mês** de ago a
dez/2025, **zero** em jan/2026, **10/mês** de fev/2026 em diante (**140** acumulados até set/2026);
**proporcional por dias sobre base 30** para quem entrou ou saiu; **meta congelada na data de saída**,
e o dispensado **continua somando no grupo**; os quatro informados: Eduardo **35**, Jeisson **17**,
Carla **12**, Fabiana **12**.

**A medição de 27/09** (só leitura, pela API; 16.478 PCs; 49 integrantes — coordenador e C.I. fora):

| | hoje | com a regra nova |
|---|---|---|
| o que conta | 4.350 | **4.319** |
| meta | 5.041 | **5.918** |
| % do GT | 86% | **73%** |

Por grupo — G1 109% → 92% (meta 1.730 → 2.031) · G2 87% → 74% (1.630 → 1.891) · G3 63% → 52%
(1.681 → 1.996).

⚠️ **A PRODUÇÃO QUASE NÃO MUDA — QUEM MUDA É A META.** Só **7 PCs** contam hoje apenas por terem ido
ao C.I. sem baixa, e **24** estão baixadas sem parecer. Quem derruba o percentual é a meta subindo de
120 fixos para 140 acumulados.

⚠️ **O QUADRO DO ITEM 5 DO DOCUMENTO DE 18/09 TINHA DOIS ERROS** — os dois aumentavam a queda:
1. **Erro de soma:** meta nova **6.336** onde a própria tabela do documento dá **5.918**. O Grupo 2
   batia exato (1.891); G1 e G3 vinham inflados em **193** e **225**.
2. **Populações diferentes:** o **"98% de hoje" foi calculado SEM os 7 dispensados**, enquanto o "67%"
   os incluía. Medido: com todos, hoje é **86%**; sem os dispensados, **98%** — o número do documento.
   ⚠️ Pela regra validada (B4/B8) **o dispensado entra nas duas leituras, ou em nenhuma**.
   **Esta é a armadilha da implantação: fixar a população antes de comparar percentual.**

⚠️ **As 14 metas individuais da tabela de 18/09 batem uma a uma com a medição de hoje** — o erro
estava só no quadro-resumo, não na régua nem nas datas.

**Como a conta é feita hoje, e o que muda:** hoje o servidor usa
`lib/sigef.js` → `SQL_BASE_PRODUTIVIDADE = (p.baixada = true OR p.enviado_ci = true)`, e a tela soma o
`p.sigef_conta` que vem **pronto** (armadilha 16). A regra nova é **o mesmo `sigef_conta` exigindo,
além dele, `baixada` e `parecer_tipo`** — assim todos os descontos atuais (tag do SIGEF, pré-GT,
engenharia, estorno, invalidada) continuam valendo iguais.

**O que está salvo** (nenhum tem credencial):

| arquivo | o quê |
|---|---|
| `medir_produtividade_20260927.js` | a medição inteira: metas, portarias, acervo, meta calculada |
| `gerar_relatorio_produtividade.js` | o documento em HTML |
| `imprimir_pdf.js` | HTML → PDF pelo Edge headless (CDP), sem biblioteca |
| `comparativo_produtividade_20260927.json` | o resultado medido, 49 linhas |
| `~/Downloads/RELATORIO_PRODUTIVIDADE_GT_2026-09-27.pdf` | **o que vai para a coordenação** (tom impessoal) |
| `~/Downloads/PRODUTIVIDADE_HOJE_x_REGRA_NOVA_2026-09-27.html` | a mesma medição, para ler na tela |

**Quando ela responder, a ordem é:** a regra única no servidor → as três telas lendo dela
(Produtividade, Board da Coordenação, Relatório do CGE) → conferência dos números antes de publicar.
No Board, o rótulo **"Total" passa a "PCs recebidas"** e a meta ganha linha própria.

---


### 3. A TRAVA DO C.I., SEGUNDA LEVA — e o aviso para a equipe (27/09, à noite)

| commit | repo | o quê |
|---|---|---|
| `c7832d3` | `sigpc-api` | a leitura vencida, e a posição do SGPe sempre |
| `bb7eaf2` | `sigpc-gt` | o botão de consultar o SGPe e a faixa que confirma |
| `193e5a3` | `sigpc-gt` | o guia didático e as três imagens |

**O caso que abriu isto** (Richard, a partir de um print): a parcial 2 da **`2020TR000655`** (Marisa,
processo `SCC 13667/2021`). Em **24/09** a Sirlene registrou às **13h41** *"o C.I. concorda com o
parecer, a analista confere o registro no SGPe e arquiva"* — e a leitura do SGPe que a tela usava era
das **11h04**, duas horas e meia ANTES. A tela mostrava, na mesma altura, a mensagem do C.I. mandando
arquivar e a faixa dizendo que não dava. Ela esperou **um dia**; arquivou em 25/09 às 13h27.

⚠️ **O RODÍZIO É AUTOMÁTICO, MAS NÃO É INSTANTÂNEO** — e a janela entre uma leitura e a seguinte é
onde o caso mora. Medido em 27/09: **7.780 processos** no universo, 600 por rodada, de hora em hora —
**13 horas** para dar a volta; a leitura mais velha entre as travadas tinha 19 h, a mediana 7 h.

**O que mudou:**
- ⚠️ **A LEITURA VENCIDA NÃO TRAVA** (`leituraVencida`): devolutiva do C.I. registrada DEPOIS da última
  leitura do SGPe libera — o fato novo vence a foto velha. **E não é "o C.I. decidiu, então libera"**:
  se a leitura for posterior, ela continua mandando, porque o processo pode ter voltado ao C.I. depois.
- **A posição do SGPe passa a vir SEMPRE** (`sgpe` no estado), e não só quando trava: é ela que deixa a
  mesma faixa dizer *"já saiu do C.I., está em FCEE/SEPCO, pode arquivar"* a quem ainda não arquivou.
  ⚠️ O recorte por setor saiu do `WHERE` e virou um `CASE`; **o `no_ci` vai decidido para a tela**.
  ⚠️ **Sem o recorte no WHERE, o `DISTINCT ON` podia escolher uma PC irmã que já saiu** numa parcela
  cujo processo ainda está no C.I., e a trava sumiria sozinha — a PC no C.I. ganhou prioridade no
  `ORDER BY`, com teste.
- **O botão "Consultar o SGPe agora"** dentro da faixa, com a logo do SGPe, pela MESMA rota do
  "Atualizar agora" da Gestão (`POST /sgpe/situacao/atualizar`). ⚠️ **Ele não arquiva nada** — só relê
  e regrava a posição. E a tela **não julga o setor**.
- **Na PC final, o passo 4**: o arquivamento ainda pedirá a data da baixa do Secretário no SIGEF.
- ⚠️ **"há 0 dias" não se diz** — foi a prévia que mostrou a frase saindo *"desde 24/09/2026, há 0
  dias"*. Com a data, ela basta; sem data, "chegou hoje". Corrigido nos dois lados.

**Testes:** `teste_arquivamento_trava_ci.js` **63 · 0** · `teste_front_trava_ci.js` **48 · 0**. E uma
checagem de `teste_arquivamento_opcao` media a assinatura antiga da conversa do C.I. (de 23/09) — era o
teste que estava velho, não a tela.

**O aviso para a equipe — TRÊS ESCRITAS em produção, autorizadas pelo Richard:**
| onde | o quê |
|---|---|
| **Novidade id 6** | categoria *Regra de negócio*, público Todos, com imagem e botão "Guia completo" |
| **Recado** | *"Arquivamento: agora a tela consulta o SGPe na hora"* — **55 enviadas, 55 pessoas** |
| **Repositório id 12** | *"GUIA — ARQUIVAR A PARCIAL..."*, em Orientações |

⚠️ **AS IMAGENS DO GUIA SÃO A FAIXA DE VERDADE**, desenhada pela própria função do `index.html` num DOM
de mentira — e não um desenho parecido. Guia com mockup envelhece na primeira mudança da tela e passa a
ensinar o que não existe mais. Ficam em `assets/novidades/`, servidas pelo Pages (conferidas: 200).

**Conferido depois de gravar:** a novidade aparece como não lida; o recado está na caixa de Marisa,
Noici, Gustavo, Márcia (C.I.) e Aline; o item 12 no repositório; e o guia e as três imagens respondem
200 no GitHub Pages. ⚠️ Na conferência, `limite=8` na rota da notificação **mentiu** — a lista não vem
por data pura, e o recado novo ficava fora das oito primeiras. Com `limite=100`, está lá.

- [ ] **NADA DISTO FOI ABERTO NO NAVEGADOR.** Olhar: a faixa vermelha com o botão na parcial travada;
      o clique em "Consultar o SGPe agora" num processo que já saiu do C.I.; a faixa verde confirmando
      o setor; a Novidade na aba e o sino com o recado.

---

> ⚠️ **O bloco "ESTADO DE 03/09" e o "HISTÓRICO" abaixo ficaram para trás.** Continuam úteis como
> registro do que se mediu — **não como estado**. O estado é o bloco de 11/09.

---

## ▶ 11/09/2026 — O ESTADO DE AGORA. Nenhuma escrita no banco nesta sessão.

Tudo foi **código** e **leitura**: os scripts de conferência rodaram em `BEGIN READ ONLY` com
`ROLLBACK`. Nada de `INSERT/UPDATE`. O sistema está **ABERTO**.

### O que foi publicado

| commit | repo | o quê |
|---|---|---|
| `6b9b0c7` · `5bf4834` | `sigpc-gt` | **O processo SGPe no cartão da Minha Planilha**: a mãe numa etiqueta abaixo da entidade, o da PC na linha da parcela baixada e no bloco do C.I. Tudo pelo `procHtml` (link, lápis, vazio, inválido). |
| `27c7472` | `sigpc-api`, `feature/baixa-por-parcial` | **`lib/sigef.js`, três correções:** (a) na âmbar "Baixada no SIGEF, aberta aqui", **só `nao_baixada` apaga a pílula, e é a ÚLTIMA declaração que decide** — `ja_estava`/`registrei_agora` confirmam a premissa e a pílula fica; SQL e JS com a mesma regra (antes o SQL nunca apagava e o JS apagava com qualquer resposta). (b) **PC na engenharia não conta** no card (`SQL_FORA_ENGENHARIA`, `IS DISTINCT FROM`). (c) O **cumulativo** desconta a engenharia **pela data do envio**, na forma do estorno e da invalidação (`eng_situacao IS DISTINCT FROM ... OR eng_enviada_em > corte`). Dry-run: **0 PCs mudam hoje** nos três; SQL × JS concordam nas 16.478 ativas; 12 cenários sintéticos no Postgres batem. `teste_sigef` 175 · 0. |
| `f8d8345` | `sigpc-gt` | **O lote do C.I. alcança a parcela só de final** (`ciLotePode` sem `!pa.soFinal`). A pílula "N sem C.I." contava 59 finais e a caixa não nascia nelas. Medido: 339 finais já foram ao C.I., 25 em rodada 2 — o servidor nunca excluiu a final. |
| — | `C:\Users\Richard\PENDENCIAS_POR_ANALISTA.md` | **38 analistas · 403 PCs**, só o que cada um resolve sozinho: Verificar registro no SIGEF 91 · Sem registro 96 · Devolvida com ressalvas pelo C.I. 216 (com quem devolveu e quando). Nenhuma linha cortada. Fora, de propósito: sem dono, NL residual, pré-GT, processo inválido. |

⚠️ **`origin/main` do `sigpc-api` continua em `4329f1c`** — nunca push nem merge para lá.

⚠️ **Nada disto foi aberto no navegador.** Olhar: a etiqueta da mãe no cabeçalho verde (um logo só,
antes do número); o processo na linha da parcela baixada e no bloco do C.I.; a caixa de lote
nascendo numa parcela só de final.

### O levantamento das pílulas (11/09, só leitura, 16.478 PCs ativas)

**1.716 pendências a regularizar** (1.634 PCs distintas) + 3.802 informativas (pré-GT 110, NL
residual 3.692). Por tipo: Verificar final 91 · Sem registro 96 · **Aberta com baixa no SIGEF 385**
· Processo inválido 137 · Sem C.I. 783 PCs/481 parcelas · Engenharia 7 · Ressalva do C.I. 216.
Zero pendências de ação: Franciani, Claudia, Eduardo Pizolati, Jeisson.

### O que ficou PENDENTE — decisão do Richard

- [ ] **As 356 PCs "Baixada no SIGEF, aberta aqui" SEM DONO** (173 TRs; em **58 TRs** é a única
      coisa que falta para concluir). Não aparecem em planilha nenhuma, e o Estoque não pinta a
      pílula desde 30/08. O `sigef_status` já diz o parecer (AV = Regular, SV = com Ressalvas),
      mas registrar baixa em massa sem dono é regra de negócio: em nome de quem fica?
- [ ] **As 44 correções de processo SGPe inválido** (137 PCs em 42 TRs, 97 sem dono; a rota
      corrige as irmãs juntas). Grafias: `-1` 58 · `AR355478172` 21 · `ADR19 0011181.2017` 19 ·
      `ADR34-1028/2017` 18 · `ADR34- 1125/2017` 18 · `SCC7537` 2 · `SCC 6579` 1. Cada número
      confirmado no SGPe antes de gravar; nunca em lote cego.
- [ ] **Distribuir as listas do `PENDENCIAS_POR_ANALISTA.md` aos analistas** — ainda não foi
      enviado a ninguém.
- [ ] Os 12 processos-mãe inválidos (por TR) e os 1.813 `processo_pc` vazios (1.742 sem dono).

---

## ESTADO DE 03/09 (ficou para trás)

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
