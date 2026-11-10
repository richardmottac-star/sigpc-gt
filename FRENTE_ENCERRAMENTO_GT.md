# FRENTE DE TRABALHO — ENCERRAMENTO DO GT

> **Criado em 10/11/2026.** O GT encerra em **dezembro**, quando o programa finda. O relatório
> de dezembro é o de **encerramento**, vai à CGE e precisa mostrar **o que fica por analisar**.
>
> ⚠️ **ESTE ARQUIVO EXISTE PORQUE AS PENDÊNCIAS ESTAVAM ESPALHADAS EM ONZE SEÇÕES** do
> `SESSAO.md`, cada uma dizendo "o que fica aberto", sem ninguém puxá-las de volta. Três delas
> ficaram paradas **um mês**. Aqui elas estão num lugar só, **com o número medido hoje** — e o
> número é o que diz se a pendência ainda existe.
>
> **Como usar:** medir de novo antes de agir (os números envelhecem), riscar o que sair, e não
> deixar item sem dono nem sem data.

---

## ⚠️ SE O GT ENCERRASSE HOJE

| | |
|---|---:|
| prestações **em aberto** | **10.969** |
| em Termos de Repasse | **1.037** |
| de entidades distintas | **214** |
| valor envolvido | **R$ 882.368.161,35** |
| **sem dono nenhum** | **7.368** |
| já analisadas (baixadas com parecer) | 4.367 |

⚠️ **De 15.336 prestações do universo do GT, 71,5% seguem em aberto.** É o passivo que fica, e é
a primeira pergunta que a CGE vai fazer.

---

## 1. BLOQUEIA O RELATÓRIO DE DEZEMBRO

### 1.1 O quadro do estoque — **não existe**
O Quadro 1 traz dois números: "Estoque" e "Total/Estoque %". **Não diz o que está lá dentro.**
Para um documento de encerramento, é o quadro mais importante: TRs abertas por situação, por
entidade, por tempo parado, valor. **Decidido em 10/11: vai como documento à parte.**

### 1.2 O período do relatório ainda é ago–out
O 5º trimestre foi estendido para **01/08 a 31/12/2026**. O atalho da tela diz "ago–out/2026" e
precisa mudar. **Sem isso, quem gerar em dezembro pega o período errado.**

### 1.3 O texto da seção 1.1 é do 3º trimestre
Diz *"fevereiro a abril de 2026"* e *"43 técnicos"*. É texto editável, no passo 2 da tela — mas
sai no documento assim se ninguém trocar.

### 1.4 As correções do Quadro 1 **não estão no ar**
`index.html` e `teste_front_regua.js` seguem sem commit desde 06/11: o Quadro 1 somando certo
(1.404, não 1.370), o cabeçalho em 45 servidores, o rótulo "Meta acumulada". **Quem gerar o
relatório pela tela hoje pega o Quadro 1 errado.**

---

## 2. DÍVIDA DE DADO — o que fica errado se ninguém mexer

| # | o que é | hoje | observação |
|---|---|---:|---|
| 2.1 | **PCs abertas no nome de quem saiu** | **88** | ⚠️ **Todas do Guilherme**, em 9 TRs, dispensado em 11/08. Nunca foram destinadas. A tela do Acervo existe para isso. |
| 2.2 | **Esperando resposta ao Controle Interno** | **358** | ⚠️ Everaldo 44, Geisa 36, Juliana 27, Daiana 25. **9 estão com quem já saiu** — ninguém vai responder. |
| 2.3 | **Prestações sem processo do SGPe** | **1.602** | 1.560 sem dono, 42 com dono. Sem processo não há consulta ao SGPe nem rastreio. |
| 2.4 | **Prazo de diligência vencido** | **152** | A entidade não respondeu e ninguém reiterou. |
| 2.5 | **Baixas do Secretário com dono** | **27** | Adiadas em 10/11 por caírem em trimestre informado. **Continuam erradas.** |
| 2.6 | **Baixadas sem parecer** | **10** | Sem código no SIGEF — sem código não há o que traduzir. |

---

## 3. ESPERA DECISÃO SUA

| # | o que é | por que parou |
|---|---|---|
| 3.1 | **As 27 do Secretário** | Tirá-las muda o Quadro 2 do 3º e do 4º trimestres, já informados. É o "caso inverso" que ficou sem decisão em 27/10. |
| 3.2 | **Janaína e Marlene** | Recados segurados em 10/11 — você vai falar com o coordenador antes. Janaína −19, Marlene com 3 alterações. |
| 3.3 | **A trilha retroativa das 341 PCs** | Devolvidas ao Estoque em 20/10 sem linha em `parcela_historico`. Oferecida, não autorizada. |
| 3.4 | **As 52 parciais** | O anexo do 4º trimestre as cita só na aba 2; a data aqui é a do parecer final, não a da baixa da parcial. |
| 3.5 | **O comparativo com o Anexo Único** | Fora do desenho por sua decisão. É o que prova prestação por prestação **quando** a CGE mandar anexo. |

---

## 4. DÍVIDA TÉCNICA — não bloqueia, mas cobra juros

| # | o que é |
|---|---|
| 4.1 | **`acervo-saida.js` conta `ci_esperando_resposta` sem distinguir `ci_reabriu`**, como o `arquivamento.js:751` faz. Numa PC reaberta pelo C.I., a frase "o C.I. devolveu com pendência" mente. |
| 4.2 | **A trava de conexão existe em poucos scripts.** Os demais caem em `localhost:5432` sem avisar — o erro aparece como problema de SSL. |
| 4.3 | **7 processos em duas TRs** que o portal do SGPe não resolve (`ADR 10853/2017` com 41 PCs, e outros 6). |
| 4.4 | **24 PCs limpas** esperando os analistas informarem o processo certo pelo lápis. |
| 4.5 | **Os 10 recados da Zadir** precisam voltar a não lidos (ids 535, 620, 1086, 1225, 1227, 1270, 1274, 1278, 1375, 1436). |
| 4.6 | **O 1º e o 2º trimestres sem conferência** (+60 e +19) — não há anexo da CGE para eles. |

---

## ⚠️ 5. O CRUZAMENTO COM O SIGEF — feito em 10/11, e o resultado tranquiliza

Os Anexos Únicos que a CGE enviou **trazem o autor de cada baixa**, na coluna
`Anonimizado GT PC`, por iniciais. ⚠️ **Eu disse ao Richard que esse dado não existia; ele me
corrigiu** — já estava subido desde outubro. O cruzamento está em
`sigpc-api/cruzar_autor_sigef.js`.

| de 3.051 prestações com autor no anexo | |
|---|---:|
| **batem** — SIGEF e sistema concordam | **1.382** |
| **não batem** | **35** |
| indeterminado — iniciais que não fecham com ninguém do cadastro | 1.629 |
| sem dono aqui / não existe aqui | 5 |

⚠️ **Das 35, trinta e três são a ambiguidade `C.C.`** (Claudia e Clara Cristina dão as mesmas
iniciais). **Sobram dois casos reais:**

| prestação | o sistema diz | o SIGEF diz | o que se sabe |
|---|---|---|---|
| `2024PC000752` | **Richard** (id 4) | **Noici Graeff Ranzi** | assumida por ele em 20/10, pela correção do anexo; a baixa no SIGEF é de **21/05**. A TR inteira (14 PCs) está no nome dele. |
| `2021PC002387` | **Tanimeri** (id 35) | **Janaína Frederico Dittrich** | **nunca assumida**, veio da recarga. Caso clássico: a planilha era da Tanimeri, quem baixou foi a Janaína. |

⚠️ **O LIMITE: 1.629 ficaram indeterminadas** — `A.G.B.` (168), `D.T.F.` (155), `M.N.G.D.A.`
(136), `V.M.D.` (135)… São pessoas **que não estão no cadastro atual**: analistas que saíram
antes de o sistema existir, ou de outras setoriais. **Só conferimos 46% do que o anexo traz**, e
desses, 97,5% batem.

**O que destravaria o resto:** a lista de quem são essas iniciais — a CGE tem, porque foi ela
que anonimizou.

---

## ⚠️ 6. A CAUSA COMUM DE QUASE TUDO ACIMA

**A carga de 05/08/2026 atribuiu o dono de cada prestação pela PLANILHA de cada analista, não
por quem baixou no SIGEF.** O Grupo trabalhou de 2024 a agosto de 2026 **sem o sistema**, e a
planilha era o único registro. A carga copiou fielmente — e o que veio errado na planilha veio
errado para cá.

⚠️ **O sistema não inventou dono nenhum**, e isso precisa estar claro em qualquer conversa sobre
esses números. **E o cruzamento da seção 5 mostra que a carga acertou em 97,5% do que dá para
conferir** — o erro existe, mas é exceção, não regra.

**O caso da Juliana apareceu porque ela conhecia o próprio trabalho.** Se há outros, só aparecem
assim — alguém notando que falta algo que fez.

**O que falta para fechar:** saber quem são as 1.629 iniciais que não fecham com o cadastro
atual. Com isso, o cruzamento cobre o anexo inteiro.

---

## ORDEM SUGERIDA

1. **Subir o que já está pronto** (1.4) — é um commit, e o relatório sai errado sem ele.
2. **O quadro do estoque** (1.1) — o mais trabalhoso e o coração do documento final.
3. **As 88 do Guilherme** (2.1) — a tela do Acervo já faz, é triagem.
4. **O período e o texto** (1.2 e 1.3) — rápidos, mas esquecíveis.
5. **As 358 do C.I.** (2.2) — as 9 de quem saiu primeiro, porque ninguém vai respondê-las.
6. **Decidir as 27** (3.1) antes do relatório final.

---

## O QUE JÁ SAIU — 27/10 a 10/11

| | |
|---|---:|
| PCs inalcançáveis (sem dono, fora do livre) | 1.487 → **0** |
| baixadas sem parecer | 202 → **10** |
| `livre` com dono | 62 → **0** |
| acervo do Higor redistribuído | **27 PCs**, 15 TRs |
| baixas do Secretário desvinculadas | **25** (restam 27) |
| atribuições corrigidas (Juliana, Tanimeri, Marlene, Graciane) | **4** |
| recados enviados | **20** |
