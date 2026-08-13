# CARTÃO DA TR — devolver, data de assunção e etiqueta de nova

**Nada implementado.** Mockup para aprovação. Um item precisa de coluna nova e outro de
decisão sua.

---

## 1. DEVOLVER TR AO ESTOQUE

### Você perguntou o que aconteceu. Aconteceu isto:

**A devolução existe. Nunca foi removida — foi perdida de vista.**

| quando | o quê |
|---|---|
| **30/07/2026** (`0379be2`) | *"feat: devolucao master de TR — superadmin, protege PCs baixadas"*. Modal `moDevM`, funções `abrirDevM` / `confDevM`. Botão **↩ Master** em dois lugares: na tabela da Minha Planilha e na do Estoque. |
| **05/08/2026** (`9f73e29`) | *"feat: tela Minha Planilha por parcial"*. A tela foi **reconstruída** agrupando TR → Parcial, e a tabela antiga saiu inteira — **levando o botão junto**. As funções e o modal ficaram. |
| **hoje** | O botão **↩ Master ainda existe, mas só na tela Estoque** (`index.html:2723`), nas TRs que são suas, só para superadmin. Na Minha Planilha não há nenhum. |

Ou seja: não foi decisão de tirar, foi **efeito colateral da reconstrução da tela**. Ninguém
notou porque o botão continuou aparecendo — na outra tela.

⚠️ **Não confundir com o `confDev`/`moDev`** que está nas Pendências como código morto. Esse
é outro: a *"Solicitar Devolução"* do analista, que nunca teve rota. São dois recursos
diferentes com nomes quase iguais — o `M` no fim é a diferença.

### E o que existe hoje tem três defeitos sérios

**1. Uma requisição HTTP por PC, em série, sem transação.**
```js
for(const pc of PCS_DEVM) {              // uma TR pode ter 83 PCs
  await fetch(`/prestacoes_contas/${pc.codigo_pc}`, { method:'PATCH', ... })
}
```
Se a rede cair no meio de uma TR de 83 PCs, **metade volta ao estoque e metade fica com o
analista** — e não há como desfazer. É exatamente o estado que a coluna `conflito` existe
para impedir. O próprio código admite: *"⚠️ ok/83 devolvidas. Erros: N"*.

**2. A regra de quem pode devolver mora no `index.html`.**
```js
if(U.perfil !== 'superadmin') { toast('Ação restrita.','err'); return }
```
É a **armadilha 9**: contornável pelo DevTools. O servidor não confere nada — o `PATCH`
aceita `analista_id: null` de quem pedir.

**3. Não existe rota de devolução.** O front desmonta a operação em PATCHes de campo. Não
há registro de que uma devolução aconteceu, nem quem devolveu, nem por quê.

### O que proponho

**Uma rota, uma transação, conferência no servidor** — e o botão onde você pediu.

```
POST /tr/devolver   { tr, usuario_id, motivo }
```

- **Transacional**: ou volta a TR inteira, ou não volta nada.
- **Superadmin conferido pelo BANCO**, a partir do `usuario_id` — como já faz o
  `PATCH /config_sistema`. Coordenador recebe 403.
- **PCs baixadas não voltam** — mantém o comportamento de 30/07, que está certo: a
  produtividade do analista fica registrada.
- **Registra em `parcela_historico`** (`evento: 'devolucao_tr'`), com quem devolveu e o
  motivo. Hoje uma devolução não deixa rastro nenhum.
- **Notifica o analista** pelo sino — hoje a TR some da planilha dele sem aviso.

### O botão, no cabeçalho do cartão

Só superadmin o vê. Discreto, à esquerda do "Ver PCs":

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📌  2020TR000704   [diligência]  🗒️            57 parciais + 1 final          │
│     ASSOC. DE PAIS E AMIGOS...                 12 de 83 baixadas             │
│     assumida em 04/08/2026 · análise desde 04/08/2026                        │
│                                          [↩ Devolver ao estoque] [▼ Ver PCs] │
└──────────────────────────────────────────────────────────────────────────────┘
```

### A confirmação

```
   ┌────────────────────────────────────────────────────────┐
   │ ⚠ Devolver a TR 2020TR000704 ao estoque?               │
   │                                                        │
   │ 71 PCs voltam ao estoque e a TR fica LIVRE para        │
   │ outro analista assumir.                                │
   │                                                        │
   │ 12 PCs já baixadas NÃO voltam — a produtividade da     │
   │ Claudia continua registrada.                           │
   │                                                        │
   │ A TR sai da planilha dela. Ela é avisada pelo sino.    │
   │                                                        │
   │ Motivo:  [ ▼ selecione                              ]  │
   │                                                        │
   │                        [ Voltar ]  [ Devolver 71 PCs ] │
   └────────────────────────────────────────────────────────┘
```

O número vai **no botão** — é o padrão que a decisão em bloco do C.I. já usa. E o botão
nasce **desabilitado** até o motivo ser escolhido (armadilha 15).

⚠️ Se a TR tiver PCs no ciclo do Controle Interno, o aviso muda: *"3 PCs estão com o
Controle Interno e continuam lá"* — devolver não pode tirá-las da fila do C.I.

---

## 2. DATA EM QUE A TR FOI ASSUMIDA

### O campo existe. Está vazio em 99,2% das TRs.

`prestacoes_contas.dt_inicio_analise`, criada em 09/08/2026.

| | |
|---|---|
| PCs com dono | **8.442** |
| das quais **com** `dt_inicio_analise` | **102** |
| das quais **sem** | **8.340** |
| **TRs com dono** | **761** |
| **TRs com a data** | **6** |

**Por quê:** a coluna foi criada **sem backfill, por decisão sua** — está escrito no commit
`c96bbc1`: *"`atualizado_em` produziria data plausível e errada — pior que campo vazio"*.

O cartão **já mostra** essa data quando existe: `análise desde 04/08/2026`, clicável para
corrigir (`planInicioAnalise`). Nas outras 755 aparece o convite para registrar à mão.

### ⚠️ E ela responde outra pergunta

```js
dt_inicio_analise = COALESCE(dt_inicio_analise, NOW())   // server.js:2158
```

O `COALESCE` é deliberado: *"devolver ao estoque e reassumir **não reinicia** a contagem — o
relógio da análise já tinha começado"*.

**Isso colide de frente com o item 1.** Depois que você devolver uma TR e outro analista
assumir, o `dt_inicio_analise` continuará mostrando a data do analista **anterior**. Ou seja:
implementar a devolução transforma esse campo numa data errada para "assumida em".

São duas perguntas diferentes, e as duas são legítimas:

| campo | responde | reinicia ao reassumir? |
|---|---|---|
| `dt_inicio_analise` | quando a análise **começou** (o relógio do prazo) | **não**, de propósito |
| `dt_assumida` *(novo)* | quando **este** analista pegou a TR | **sim** |

### Procurei outra fonte. Não há.

| fonte | serve? |
|---|---|
| `estoque.assumido_em` | **não** — 4.476 linhas, **2** com data |
| `solicitacao_vaga` | **não** — cobre **0** das 761 TRs |
| `criado_em` | **não** — todas em 18/07/2026, é a carga |
| `atualizado_em` | **não** — 682 das 761 em jul/2026; é a carga, não a assunção |

### ⚠️ Precisa de coluna nova — aguardo sua autorização

```sql
ALTER TABLE prestacoes_contas
  ADD COLUMN IF NOT EXISTS dt_assumida TIMESTAMP;
```

**Sem backfill**, pela mesma razão que você decidiu em 09/08: não há dado verdadeiro, e
`atualizado_em` daria data plausível e errada.

**Consequência honesta: as 761 TRs de hoje ficam sem a data.** Só as assumidas daqui pra
frente a terão. Se preferir, o cartão pode mostrar `assumida em —` ou simplesmente omitir a
linha quando não houver — **prefiro omitir**, que é o que a tela já faz com a etiqueta de
concluída.

**Se você preferir não criar a coluna:** o cartão passa a mostrar o `análise desde` que já
existe, com o rótulo trocado para deixar claro o que é. Mas aí, depois de uma devolução, a
data será a do analista anterior — e eu não recomendo.

---

## 3. ETIQUETA DE TR RECÉM-ASSUMIDA

### O critério que proponho: **assumida nos últimos 7 dias**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📌  2020TR000704  ✨ NOVA  [diligência]  🗒️        57 parciais + 1 final      │
│     ASSOC. DE PAIS E AMIGOS...                     0 de 83 baixadas          │
│     assumida em 11/08/2026 · há 1 dia                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

Etiqueta no mesmo lugar das outras (`✓ concluída`, `diligência`), no mesmo formato — pílula
de 9,5px. Em **azul** (`--az`), que hoje só marca a TR fixada: não compete com o verde de
concluída nem com o vermelho de prazo.

**Por que 7 dias:**
- é uma semana de trabalho — "o que peguei nesta semana" é a pergunta real;
- a etiqueta **sai sozinha**, sem ninguém marcar como lida;
- não polui: quem assume 3 TRs por semana vê 3 etiquetas, não 40.

**Alternativas, se preferir:**

| critério | efeito |
|---|---|
| **7 dias** *(proposto)* | uma semana de trabalho |
| 14 dias | quem entra menos no sistema não perde o aviso |
| 7 dias **e** nenhuma PC baixada | marca só o que **ainda não começou** — some quando você trabalha, não quando o tempo passa |
| até a TR ser aberta uma vez | o mais preciso, mas **exige coluna nova** para registrar leitura por analista |

⚠️ **Isto depende do item 2.** Sem `dt_assumida` não há como saber o que é recente — e com
`dt_inicio_analise`, as 755 TRs sem data nunca receberiam a etiqueta, enquanto as 6 que têm
a receberiam todas (as 6 são de agosto/2026).

**Efeito colateral bom:** como a coluna nasce vazia, **nenhuma TR antiga é marcada**. A
etiqueta aparece só no que for assumido de verdade daqui pra frente — sem falso positivo em
massa no primeiro dia.

---

## O QUE PRECISO DE VOCÊ

1. **Autorizar o `ALTER TABLE`** da `dt_assumida` (item 2). Sem ele, os itens 2 e 3 ficam
   sem base — e o item 1 torna o `dt_inicio_analise` enganoso.
2. **Confirmar o critério de "recente"**: 7 dias, ou uma das alternativas.
3. **O motivo da devolução é obrigatório?** O modal antigo exigia. Mantenho, se você não
   disser o contrário — sem motivo, a devolução não deixa explicação para o analista que
   perdeu a TR.

**O que eu faço sem perguntar mais nada, se você aprovar:** a rota transacional, a
conferência de superadmin no servidor, o botão no cartão, o registro em `parcela_historico`,
a notificação ao analista, e a limpeza do botão órfão da tela Estoque — que passa a chamar
a rota nova em vez dos 83 PATCHes.
