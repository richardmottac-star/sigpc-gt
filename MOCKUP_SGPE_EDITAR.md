# CORRIGIR O PROCESSO SGPe — mockup para aprovação

**Nada implementado.** As três medições que você pediu, o desenho, e o que precisa da sua
decisão. **Não preciso de coluna nova** — explico onde cada coisa cabe.

---

## AS MEDIÇÕES

### 1. Quantas PCs estão sem link: **717 de 14.652** (95,1% já têm)

| motivo | PCs | é problema de quê |
|---|---|---|
| **texto que não vira processo** | **506** | **dado nosso — é o que você quer corrigir** |
| o SGPe não tem o processo | 92 | dado do SGPe (6 processos distintos) |
| `processo_pc = '-1'` | 79 | dado ausente (o caso já conhecido) |
| **sigla fora do mapa** | **40** | mapa de órgãos |
| nunca resolvido | **0** | — o job está em dia |

⚠️ **O maior grupo é erro de digitação na nossa base**, não limitação do SGPe. É exatamente o
que o item 1 resolve.

### 2. Sigla fora do mapa de 183 códigos: **2 processos, 40 PCs**

| sigla | PCs | texto |
|---|---|---|
| `AR19` | 21 | `AR19  1727/2017` |
| `ADR` | 19 | `ADR 1181/2017` |

Bem menos do que parecia. E os dois têm cara de digitação: `AR19` provavelmente é `ADR19`
(que **está** no mapa), e `ADR` sozinho está sem o número da regional. Ou seja: **os 40
também se resolvem editando**, não mexendo no mapa.

### 3. `sgpe_processo_ref` — o que já existe

```
7.705 linhas · 7.699 resolvidas · 6 negativas
colunas: sigla, numero_oficial, ano, nu_processo, cd_orgaosetor,
         origem, criado_em, tentativas, ultima_tentativa, motivo
origem:  'SGPE' (7.699)  ·  'NAO_ENCONTRADO' (6)
```

**Já serve para guardar link manual, sem coluna nova.** A URL do SGPe é:

```
...visualizarDocumentosProcesso.do?processoPK=137111,7059,2025&itemAba=aba_pecas
                                              └nu──┘ └cd─┘ └ano┘
```

Os três números que a URL carrega são exatamente `nu_processo`, `cd_orgaosetor` e `ano` — as
colunas que a tabela já tem. **Colar o link é despedaçá-lo e gravar nessas colunas**, com
`origem = 'MANUAL'`. Daí em diante nada muda: as telas leem o cache como sempre, e o link
manual vale para **todas** as PCs daquele processo, não só a que você corrigiu.

---

## OS 506 — o que são, de fato

| classe | textos | PCs | exemplo |
|---|---|---|---|
| espaço no lugar da barra | 30 | 54 | `SCC 2971 2024` |
| **dígitos colados, sem separador** | **22** | **388** | `AR35455172` · `ADR26000017012017` |
| outros | 7 | 64 | `ADR29/00000483/2017` · `SCC: 14765/2024` · `SCC7537` (sem ano) |

⚠️ **22 textos respondem por 388 PCs.** São processos com muitas PCs cada: corrigir
`ADR26000017012017` sozinho conserta **21 PCs de uma vez**. O trabalho é bem menor do que
os 506 sugerem — são **59 correções**, não 506.

---

## O DESENHO

### Onde o botão aparece: em **todas** as telas, de um lugar só

O processo é desenhado por uma única função, `procHtml`, usada em **11 pontos** — Estoque,
detalhe da TR, Minha Planilha, Repositório, Controle Interno, Board, Meus pedidos. Mexer nela
alcança todas de uma vez, e nenhuma tela precisa saber que a edição existe.

```
hoje:     SCC 8855/2025          (link, quando resolve)
          ADR26000017012017      (texto cru, quando não resolve)

depois:   SCC 8855/2025 ✎        ← lápis discreto, aparece ao passar o mouse
          ADR26000017012017 ✎    ← aqui em âmbar, porque não tem link
```

⚠️ O lápis aparece para **analista, coordenador e superadmin** — como você pediu. No modo
"ver como" ele não é desenhado.

### O modal de correção

```
┌─ ✎ Corrigir o processo SGPe ──────────────────────────── ✕ ─┐
│                                                             │
│  PC 2020PC001540 · TR 2020TR000705                          │
│                                                             │
│  Hoje:  ADR26000017012017                                   │
│         ⚠ não foi possível gerar o link                     │
│                                                             │
│   Sigla        Número         Ano                           │
│  ┌────────┐  ┌────────────┐  ┌────────┐                     │
│  │ ADR26  │  │ 1701       │  │ 2017   │                     │
│  └────────┘  └────────────┘  └────────┘                     │
│   ✓ ADR26 está no mapa de órgãos                            │
│                                                             │
│  Vai ficar:  ADR26 1701/2017                                │
│                                                             │
│  ⚠ Esta correção vale para as 21 PCs que hoje têm           │
│    esse mesmo texto nesta TR.                               │
│                                                             │
│                        [ Cancelar ]  [ Salvar e buscar ]    │
└─────────────────────────────────────────────────────────────┘
```

Três campos separados, e não um texto livre: sigla, número e ano são o que o SGPe pede, e
separá-los deixa a conferência da sigla acontecer **enquanto a pessoa digita** — em vez de
recusar depois de salvar.

### Depois de salvar — a ordem que você pediu

```
   1. normaliza          ADR26 1701/2017
   2. sigla no mapa?     ✓ ADR26 = código 7024
   3. já está no cache?  não
   4. pergunta ao SGPe   ← ao vivo, este processo só
   5a. resolveu   →  ✓ link pronto, fecha
   5b. não resolveu →  aí sim oferece o manual
```

**Só no caso 5b** aparece o segundo passo:

```
┌─ Não consegui gerar o link ──────────────────────────── ✕ ─┐
│                                                            │
│  ADR26 1701/2017 foi salvo, mas o SGPe não devolveu        │
│  o processo.                                               │
│                                                            │
│  Abra o processo no SGPe, copie o endereço da barra do     │
│  navegador e cole aqui:                                    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ https://sgpe.sea.sc.gov.br/cpav/visualizarDocument…  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ✓ link reconhecido — processo 137111, órgão 7059, 2017    │
│                                                            │
│                     [ Agora não ]  [ Salvar o link ]       │
└────────────────────────────────────────────────────────────┘
```

O link colado é **conferido antes de aceitar**: tem de ser do domínio do SGPe e trazer o
`processoPK` com os três números. Um endereço qualquer é recusado na hora, com o motivo.

⚠️ **"Agora não" é um caminho legítimo.** A correção do texto já foi salva; o link pode vir
depois, de outra pessoa, em outra tela. Obrigar a colar o link travaria a correção do dado.

---

## ⚠️ O QUE ISTO MEXE, E VOCÊ PRECISA SABER

**Editar `processo_pc` muda o agrupamento da parcial.** A regra é *uma parcial =
(tr, processo_pc)*, e o `parcial_num` foi renumerado ontem sobre exatamente esse par.

Hoje o invariante está limpo: **0 casos** de PCs com o mesmo `(tr, processo_pc)` e
`parcial_num` diferente. Uma correção descuidada quebra isso — se duas parcelas da mesma TR
passarem a ter o mesmo processo, viram uma só, com dois números.

São **45 TRs** com PC de texto inválido, somando 992 PCs.

**Como proponho tratar:** ao salvar, o servidor confere se o novo `(tr, processo_pc)` já
existe naquela TR. Se existir, o modal avisa **antes de gravar**:

```
   ⚠ A TR 2020TR000705 já tem a parcial 6 com o processo ADR26 1701/2017.
     Salvar vai juntar estas 21 PCs naquela parcial.
     A parcial 12 deixa de existir e a numeração da TR é refeita.

                              [ Cancelar ]  [ Entendi, juntar ]
```

E aí o servidor renumera a TR, na mesma transação, com a mesma regra de ontem.

**Se você preferir**, a alternativa é **recusar** a fusão e mandar resolver em duas etapas.
Eu recomendo avisar-e-juntar: recusar deixa o dado errado no ar sem caminho de saída.

---

## ONDE CADA COISA É REGISTRADA — sem coluna nova

**A correção do texto** → `parcela_historico`, que já existe e já ganhou eventos novos
ontem:

```
evento          processo_pc
tr              2020TR000705
parcial_num     12
valor_anterior  ADR26000017012017
valor_novo      ADR26 1701/2017
analista_id     36            ← quem alterou
observacao      2020PC001540 · 21 PCs afetadas
criado_em       13/08/2026 00:12
```

**O link colado** → `sgpe_processo_ref` com `origem = 'MANUAL'`, e um segundo registro em
`parcela_historico` (`evento: 'sgpe_link_manual'`) para guardar **quem** colou — a tabela de
links não tem coluna de autor.

**Se você preferir o autor na própria tabela de links**, é uma coluna:

```sql
ALTER TABLE sgpe_processo_ref
  ADD COLUMN IF NOT EXISTS criado_por INTEGER;
```

**Não é necessária** — o histórico já responde quem colou. Só peço se você quiser.

---

## ⚠️ UMA TRAVA QUE PRECISA EXISTIR

O `origem = 'MANUAL'` tem de ser **imune ao job**. Hoje o `job_sgpe_links.js` reprocessa o
que está sem link e pode sobrescrever. Se ele passar por cima de um link colado à mão, o
trabalho do analista se perde silenciosamente — e ninguém vai reclamar, porque ninguém
percebe um link que voltou a não existir.

O job passa a **pular** `origem = 'MANUAL'`, e há teste que falha se ele deixar de pular.

---

## O QUE PRECISO DE VOCÊ

1. **Fusão de parcelas:** avisar-e-juntar *(recomendo)*, ou recusar e mandar resolver em duas
   etapas?
2. **`criado_por` em `sgpe_processo_ref`:** quer, ou o histórico basta?
3. **O `processo_mae` também é editável?** Ele aparece nas mesmas telas e usa o mesmo
   `procHtml`. Meu padrão: **sim**, com o mesmo modal. Diga se prefere só o `processo_pc`.

**O que faço sem perguntar mais nada:** o lápis nas 11 telas, o modal de três campos com
conferência de sigla ao vivo, a tentativa automática antes do manual, o parser do link
colado, o registro no histórico, a trava do job, e os testes dos dois lados.
