# A RÉGUA DE PRODUTIVIDADE DO GT — DECIDIDA, NÃO PERGUNTAR DE NOVO

**Respondido por Nayara Limas (coordenadora do Grupo 1, assina os relatórios da CGE) em
17/09/2026.** Confirmado por ela em 27/09/2026 sem alterações. Traduzido para o sistema no
documento `REGRA_PRODUTIVIDADE_GT_IMPLANTACAO_2026-09-18`. **Implantado em 30/09–05/10/2026.**

> ⚠️ **ESTE ARQUIVO EXISTE PORQUE A MESMA PERGUNTA FOI FEITA TRÊS VEZES.** O questionário
> respondido estava num `.docx` na pasta Downloads, fora do repositório — e cada sessão nova
> reabria o que já tinha sido decidido. **Antes de perguntar qualquer coisa sobre produtividade,
> procurar aqui.** Se a resposta estiver aqui, ela não é pergunta: é especificação.

A régua mora em **`sigpc-api/lib/meta.js`**, cópia única, com `teste_meta.js` provando cada item.

---

## A. O que conta como produção

| item | pergunta | resposta |
|---|---|---|
| **A1** | A unidade é a PC? | ✅ **Confirmado.** Conta PC, não parcial |
| **A2** | Baixada, ou encaminhada ao C.I. com parecer? | ❌ **Mudou:** *"Apenas conta na baixa da parcial, com a emissão do parecer pelo técnico, não conta no envio ao CI"* |
| **A3** | PC retrabalhada conta de novo? | ✅ **Confirmado.** Conta uma vez só |
| **A4** | PC invalidada sai da contagem? | *"Desconheço o que seria PC anulada"* — sem resposta; segue como está (sai) |
| **A5** | Arquivamento conta? | ✅ **Confirmado, não conta.** *"a contagem não deve ser no encaminhamento ao controle interno e sim na baixa da parcial, no parecer"* |

## B. A meta

| item | resposta |
|---|---|
| **B1** | **12/mês de ago a dez/2025** · **zero em janeiro/2026** (férias) · **10/mês de fevereiro em diante**. 140 acumulados até set/2026 para quem está desde o início; proporcional para quem entrou depois |
| **B2** | A meta inicia em **01/08/2025** |
| **B3** | ✅ Não há documento anterior que a tenha fixado |
| **B4** | **Acrescido de 10 a cada mês para todos**, *"com exceção dos que já foram substituídos"* |
| **B5** | ✅ A meta é individual; a do grupo é a soma |
| **B6** | Proporcional **com base em 30 dias**, 10 PCs por mês, para entrada ou saída no meio |
| **B7** | ✅ **Férias, licença e afastamento NÃO descontam** |
| **B8** | ✅ **O dispensado mantém a meta congelada na saída, e a produção dele continua contando no total do GT** |
| **B9** | Os quatro sem meta: **Eduardo 35 · Jeisson 17 · Carla 12 · Fabiana 12** |

⚠️ **O número do B9 é o ACUMULADO ATÉ 30/09/2026, e não uma meta eterna.** De outubro em diante
ele sobe 10 por mês como o de todos (B4) — `FIM_DA_META_INFORMADA` em `lib/meta.js`. Sem isso a
meta dos quatro congelaria enquanto os outros 45 subiriam, e o percentual deles cresceria sozinho.

## C. Período de apuração

| item | resposta |
|---|---|
| **C1** | *"A meta é acumulada, mas **os relatórios puxam acumulada e por período**, com foco sempre nos 3 últimos meses, pois o relatório é trimestral; o início do grupo é 01/08/2025"* |
| **C2** | ✅ O acumulado corre sem reinício |
| **C3** | Proporção de acordo com a entrada e a saída do analista |

## D. Qual data marca o mês da produção

| item | resposta |
|---|---|
| **D1** | *"No relatório da CGE importa datas, pois o foco é o trimestre; **tem as duas situações no relatório: o acumulado e o do trimestre**"* |
| **D2** | ✅ **Confirmado** + *"**Essas podem ser puxadas no acumulado**"* — as PCs com data de carga entram **no acumulado** e **nunca no trimestre** |

⚠️ **D2 — QUEM SÃO ELAS HOJE.** O questionário falava de 3.587 PCs com data de 29/06/2026.
Medido em 05/10/2026: `carga_historica` **não existe mais** no acervo; quem ocupa esse lugar é
**`recarga_parcial_20260805` — 3.560 PCs, todas com `data_baixa` em junho/2026**. A lista é
`ORIGENS_SEM_DATA_CONFIAVEL`, **por origem e não por data**: cortar "tudo de junho de 2026"
levaria junto **24 baixas de trabalho real** feitas naquele mês.

## E. Relatório do CGE

| item | resposta |
|---|---|
| **E1** | *"**puxar meta do trimestre**, mas possui **outro campo no relatório no quadro 1 que puxa também a acumulada**"* |
| **E2** | *"desconheço baixas anteriores ao GT-PC que esteja puxando"* — o corte pré-GT (12/08/2025) continua |
| **E3** | *"o encaminhamento pro controle interno **não deve contar em nenhuma tela**, apenas as PCs que constem parecer"* |
| **E4** | ✅ Quem entra: analistas + o administrador quando tem PC própria. **Não distingue ativo de dispensado** |

## F. Grupo e equipe

| item | resposta |
|---|---|
| **F1** | ✅ A meta do grupo é a soma das individuais |
| **F2** | ✅ **Analista sem nenhuma PC atribuída ENTRA na conta do grupo** — a meta dele soma mesmo sem PC |

---

## O que isso virou no código

| onde | o quê |
|---|---|
| `sigpc-api/lib/meta.js` | a régua inteira: `metaDoMes`, `metaAcumulada(entrada, saida, ate, de)`, `META_INFORMADA`, `ORIGENS_SEM_DATA_CONFIAVEL`, `apura` |
| `sigpc-api/lib/sigef.js` | `SQL_BASE_PRODUTIVIDADE` = **`baixada = true AND parecer_tipo IS NOT NULL`** (era `baixada OU enviado_ci`) |
| `GET /produtividade/regua` | a meta pronta, por pessoa e por grupo, com a **origem de cada número** |
| `sigpc-gt/index.html` | Produtividade, Board e relatório do CGE **lendo a régua** — nenhuma delas calcula meta |

⚠️ **A TELA NÃO CALCULA META** (armadilha 16). A `contaMeta` saiu em 30/09/2026: ela zerava a
meta do dispensado por conta própria e contradizia o item B8 em silêncio.

⚠️ **`metas_analistas` E `usuarios.meta_mensal` CONTINUAM NO BANCO**, intactas, como registro do
que valia antes — e **não são lidas por ninguém**. Duas fontes vivas para a mesma meta é a
segunda ficando velha.

---

## Os números, medidos em 05/10/2026

| | meta | produção | % |
|---|---|---|---|
| **GT** | 6.298 | 4.443 | **71%** |
| Grupo 1 | 2.171 | 1.927 | 89% |
| Grupo 2 | 2.021 | 1.446 | 72% |
| Grupo 3 | 2.106 | 1.070 | 51% |

⚠️ **A MUDANÇA DE REGRA CUSTOU 31 PCs NO GT INTEIRO** — 7 que contavam só por terem ido ao C.I.
sem baixa, e 24 baixadas sem parecer (17 delas da importação do SIGEF de 30/08). **Quem derruba
o percentual é a META**, que deixou de ser 120 fixos e passou a ser o acumulado do período.

⚠️ **AS 24 SÃO RECUPERÁVEIS:** basta o analista registrar o parecer da parcial e a PC volta a
contar na hora.

**Conferência:** a régua reproduz as 14 linhas da tabela do item 3 do documento, uma a uma, e a
meta somada até 30/09 dá **5.918** — o mesmo número da medição que foi para a coordenação em
27/09.
