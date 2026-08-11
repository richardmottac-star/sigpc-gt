# SIGPC-GT — ESTADO EM 11/08/2026
Cole no início do chat novo. Os estados de 10/08, 08/08, 06/08 e 04/08 estão preservados mais
abaixo.

---

## ⚠️ NÃO EXISTE MAIS `prompt()` NEM `confirm()` NESTE ARQUIVO

Os 20 viraram **17 chamadas** de `moConfirm` / `moPrompt` / `moFormRecado`. **Não reintroduzir
diálogo do navegador** — os três motivos, na ordem em que doem:

1. **O `prompt()` valida DEPOIS de fechar e o texto some.** No estorno, 14 caracteres eram
   recusados por um toast e a pessoa reescrevia tudo. Agora o botão fica cinza com contador.
2. **É de uma linha.** Justificativa, anotação e recado são texto de parágrafo.
3. **Congela a aba inteira**, inclusive o relógio de 60 s do sino.

**O defeito que a troca corrigiu:** o envio de recado usava
`confirm('Enviar para TODOS?\n\nOK = todos · Cancelar = só o meu grupo')`. `confirm()` só tem
OK e Cancelar, então **quem clicava em Cancelar querendo desistir mandava para o grupo** — não
havia como sair sem enviar. Virou formulário com radio.

`moValido` e `moNota` ficam FORA do motor, como declarações: é a regra que muda de
comportamento, e sem DOM ela é testável (`teste_front_modal.js`).

---

## CONCLUÍDO EM 11/08

### Sino de notificações
Contador **só aparece quando há não lidas** — badge permanente vira cenário e para de ser
lido. A lista mostra **só as não lidas**; ao marcar, a notificação **sai da vista na hora**.
Um clique **marca como lida e navega** — separar em dois deixaria o sino cheio de resolvido.
Marcação **otimista**: o contador cai no clique, o servidor é avisado depois; a carga de 60 s
corrige se a rede falhar.
**"Ver todas" aparece sempre**, inclusive com o sino vazio — é justamente aí que a pessoa vai
procurar o que sumiu. Lá as lidas mostram **a data em que serão apagadas** (15 dias após a
leitura), em data absoluta: sem ela, a exclusão vira surpresa.
Erro de rede **não apaga o que está na tela nem mostra zero falso**.

### Reserva de TR no Estoque
Tag âmbar na segunda linha da célula da TR (nenhuma coluna mexida), Assumir cinza com o motivo
no `title`. A tag aparece **para todos**, inclusive para quem pediu (que vê "você"); só o
botão não fica cinza para ele nem para o superadmin.
⚠️ Se a busca de reservas falhar, o Estoque carrega igual, **só sem as tags** — deliberado:
quem barra é o PATCH no servidor, então a tela não trava por precaução.
Perder a corrida pela TR **não sai como "Erro:"** — é a regra funcionando.

### Botão "Entidade respondeu"
No bloco da diligência, **fora do modal de Situação**: registrar a resposta e mudar a situação
são coisas diferentes, e juntá-las empurraria o analista a mudar o status antes da hora.
Depois de registrado vira `✉ Entidade respondeu em dd/mm`, senão ele não sabe se já clicou.

---

## PADRÃO: BUSCA LEVE EM PARALELO, NUNCA DENTRO DA CONSULTA PESADA

Reservas de TR e respostas de diligência vêm de rotas próprias, em `Promise.all` com a
consulta principal. Se falharem, a tela carrega igual — só sem o adorno.

⚠️ `teste_front_links` conta as telas que absorvem `j.links` e **enxerga as duas formas** de
chamar `fetchListaCompleta` (direta e dentro de `Promise.all`). Em 11/08 ele acusou 11 de 12
porque só via a primeira — o mecanismo estava intacto, era a âncora do teste.

---

## SUÍTES

`teste_front_busca` 110 · `painel` 94 · `prazo` 70 · `ordem` 32 · `links` 26 · `pedidos` 26 ·
**`modal` 20**. Extraem funções do `index.html` via `vm` — **nunca copiar código**, uma cópia
diverge em silêncio. Só declarações de função viram propriedades do contexto do `vm`;
`const` de seta, não.

---

## CONCLUÍDO EM 10/08 — Configurações, Aprovações e a trava no assumir (`a095272`, no ar)

Publicado no GitHub Pages (confirmado: `irConfiguracoes` está no HTML servido).

### As decisões (o resto do detalhe está no SESSAO.md do sigpc-api)

Limite padrão **5**, mas **NULL no banco** — nada trava até você digitar o número na tela.
Confere **só no ato de assumir** · vaga livre quando a **TR inteira** baixa · aprova o
**coordenador** · **superadmin nunca trava**.

### Telas

- **Configurações** (menu ADMIN, só superadmin) — abas montadas a partir de `CFG_ABAS`; por
  ora só "Limite de TRs". Limite padrão com caixa **"Sem limite"** que desabilita o número,
  para não existir estado ambíguo entre vazio e zero. Mais: liberação (TR/parcial), pedido
  liga-desliga + quem aprova, exceções por analista, rodapé com quem alterou e quando.
- **Aprovações** (coordenador e superadmin) — mostra **quantas TRs a pessoa já tem**, que é o
  número em que a decisão se apoia. Negar exige motivo (a tela e a API recusam vazio).
  Contador de pendentes no menu.

### ⚠️ A checagem no front NÃO é a trava

Quem trava é o `PATCH /prestacoes_contas/:codigo_pc`. Aqui é conveniência — e por isso
`limiteChecar` devolve **"pode" quando a rede falha**: a tela não bloqueia por conta própria.

Confere ao **ABRIR** o modal, não ao confirmar: descobrir o bloqueio depois do clique
significaria assumir metade da TR e parar no meio (o front manda um PATCH por PC).
Bloqueado → botão Confirmar desabilitado + aviso + botão "Solicitar mais uma TR".
Liberado por autorização aprovada → o modal diz isso, senão o analista não entenderia por
que desta vez passou.

### O que falta

- [ ] **Definir o limite na tela.** Nada trava até lá.
- [ ] Abas 2 e 3 de Configurações.
- [ ] Avisar o analista quando o pedido for decidido — hoje ele só descobre tentando de novo.

Suítes do front: 94+70+110+26+32.

---

## A REGRA CRÍTICA DA REGEX DUPLICADA ACABOU — 08/08

**Não existe mais regex de processo no `index.html`.** A regra de normalização voltou a ter
um dono só: `sigpc-api/lib/sgpe-link.js`.

O que mudou: a API passou a devolver um mapa `links` junto com os dados, **indexado pelo
valor CRU** (`links["SCC2146/2020"]`). A tela faz `_sgpeCache.get(bruto)` e exibe — sem
normalizar nada. `SGPE_PADRAO`, `sgpeChave`, o resolvedor e o `MutationObserver` foram
removidos, e o `sgpe-link-standalone.js` (que nenhum `<script>` carregava) também.

### ⚠️ NÃO REINTRODUZIR NORMALIZAÇÃO NESTE ARQUIVO

Enquanto a tela não normalizar nada, não há segunda cópia para divergir. Divergiu uma vez, em
05/08, e o estrago foi silencioso: o servidor passou a aceitar região na sigla, esta cópia
ficou para trás, e "ADR17 00000867/2017" deixou de linkar **sem nunca ser perguntado à API**
— enquanto FCEE e SCC linkavam normalmente. Nada acusou.

Se um dia parecer necessário normalizar aqui, o certo é a **API** passar a devolver a chave
que a tela precisa.

`teste_front_links.js` tranca isso: falha se `SGPE_PADRAO`, `sgpeChave`, `data-proc` ou
manipulação de texto dentro de `procHtml` voltarem a aparecer.

---

## CONCLUÍDO EM 06/08

- **Tabela de 183 `cdOrgaosetor`** extraída do SGPe e no ar
  (sigpc-api `9938571`, `feature/baixa-por-parcial`)
- **Regex da sigla aceita região** (ADR20, SDR13) com separador
- **Trava de ambiguidade corrigida** para avaliar dígitos crus antes da remoção de zeros
  (sigpc-api `1cf8a0f`) — 39 testes passando
- **22 ADRs validadas** contra o SGPe por `sgOrgaosetor`
- **UPDATE do grupo A no banco:** 76 valores, 1.641 linhas
- **Paridade front/servidor restaurada** (`61e0d62`, `main`) — 8.159/8.159, 0 divergências

### ⚠️ Correção ao registro do UPDATE

A tabela `prestacoes_contas_bkp_processo_pc` **não existe**. Conferido em 06/08: as únicas
tabelas de backup no banco são `_backup_baixada_20260805` e `_backup_parcial_num_20260805`,
de outra frente. O UPDATE foi aplicado sem esse backup, ou ele foi removido depois.

O dado está correto — a transformação foi validada valor a valor antes de rodar e o
`ainda_colados` zerou — e o rollback continua trivial: basta remover o espaço inserido entre
região e número. Mas a rede de segurança prevista no plano não está lá.

---

## PENDENTE

- **Skill `sgpe-link` (SKILL.md)** — a fazer hoje à noite
- **22 valores dos grupos B e C** (ano grudado / ambíguos) em `sigpc-api/adr_sdr_sem_link.csv`
  — conferência manual. Atingem 345 PCs.
- **Merge da feature na main do sigpc-api** — produção roda da feature, confirmado no painel
  do Railway
- **Sondar `cdOrgaosetor` das 9 regionais** agora testáveis: ADR01, 18, 21, 22, 24, 26, 28,
  29, 32. A ADR22 (`13580`) nunca foi verificada.

---

## LINKS DO SGPe NA TELA — como funciona (desde 08/08)

O link **vem pronto da API**. Não há rodada de resolução na tela, nem carregamento
progressivo: o número já sai como `<a>` na primeira pintura.

```
GET /prestacoes_contas          ─┐
GET /prestacoes_contas/resumo_tr ├─ devolvem { data, count, links, error }
GET /prestacoes_contas/alertas_prazo ─┘
```

- **12 pontos de fetch** passam a resposta por `sgpeAbsorver(await r.json())`, que joga o mapa
  no `_sgpeCache` **antes do render**. Se entrar depois, a primeira pintura sai sem link.
- `procHtml(bruto)` é um `Map.get` e mais nada.
- **Sem link o número fica texto puro, sem aviso.** Vale para sigla fora do mapa, região
  colada (ambígua), processo que o SGPe não tem, e PC que entrou depois da última passada do
  job — essa última o cron resolve em até 1 h.
- CSV e PDF de Relatórios ficam de fora de propósito: seguem em `normalizarProcesso`.
- O front **não tem** a tabela `ORGAOS` nem a regex, de propósito.

Quem enche o cache é `sigpc-api/job_sgpe_links.js`, num serviço separado no Railway, de hora
em hora, `--limite=200`. Em 08/08 a carga completa resolveu 7.311 processos em 42 min, com 6
negativas e zero erros.

`POST /sgpe/links` continua existindo na API, mas **a tela não o chama mais** — sobrou como
ferramenta manual.

---

## ESTADO DAS BRANCHES

`main` = `feature/baixa-por-parcial`, publicada no GitHub Pages. Em 06/08 o build do Pages
demorou cinco minutos; em 08/08 saiu em menos de um. Conferir o que está no ar com:

```bash
curl -s https://richardmottac-star.github.io/sigpc-gt/index.html | grep -c 'sgpeAbsorver'
```

Deve devolver 13 (1 definição + 12 pontos de uso).

---

# SIGPC-GT — ESTADO EM 04/08/2026 (manhã)

---

## NÚMEROS DO RELATÓRIO — conferidos e fechados

| Indicador | Valor |
|---|---|
| Total de PCs | 14.652 |
| Baixadas | **3.760** |
| Meta do período | **5.041** |
| Cumprimento | **74,6%** |
| Baixas sem analista | **0** |
| Quadro 1 = Quadro 2 | sim |
| Meta mínima | **10 PCs/servidor/mês** (12 meses = 120 por técnico) |

Quadro 1: 3452 + 4 + 284 + 4 + 16 = 3.760. Quadro 2: soma das 45 linhas = 3.760.

---

## O QUE FOI FEITO EM 04/08

### Editor do relatório CGE — 4 partes, todas no ar e testadas

**Banco:** coluna `secoes` JSONB criada em `relatorios_cge`. Registro id=1 carregado com as **24 seções** do relatório oficial de 14/05/2026.

Formato de cada seção:
```json
{"chave":{"t":"título","g":"grupo","onde":"onde sai","tipo":"rico|lista|notas|campos|q1|q3|afast|sign","v":conteúdo,"orig":"oficial|editado","fonte":"..."}}
```

As 24 chaves: cab · ctx, cron, desemp_intro, ingressantes, aval, motivos, pos_motivos, g1, g2, g3, qual_intro, just, pos_just, q4_abre, consol, afast, concl · q1, q2, q3, afast_tab · local, sign

**API (repo sigpc-api, server.js):** `secoes` acrescentado a `RELATORIOS_CGE_PATCH_PERMITIDOS` e `RELATORIOS_CGE_CAMPOS_JSONB`, e ao POST ($1..$17). Testado gravando de verdade via console do navegador + SELECT no banco.

**Commits no sigpc-gt (index.html):**

| Commit | O que |
|---|---|
| 1392eee | Parte 1 — `_cgeSecoes`, leitura/gravação de `secoes`, `cgeSecGet/cgeSecSet`, removido `criado_por` (era descartado em silêncio pela API) |
| ff53921 | Partes 2 e 3 — tela de 24 seções + PDF lendo de `secoes` |
| fe51c3e | Parte 4 — pré-visualização ao lado, `cgeMontarDocumento()` como fonte única |
| 09d45ee | Correção — `{{campos}}` apareciam como travessão no preview |
| 1d362f1 | `cgeAgregar()` — agregação extraída do `cgeGerar`, com prova de equivalência em 3 períodos |

**Funcionalidades entregues:**
- 24 seções editáveis agrupadas em Identificação · Texto corrido · Quadros · Fechamento
- Bolinha verde (editado) / azul (herdado do relatório de 14/05)
- Faixa de origem por seção + botão "Voltar ao texto anterior"
- Salvamento automático com debounce de 1s; aviso vermelho se o servidor não confirmar
- 10 campos `{{token}}`: periodo, meta_global, meta_mensal, meta_por_tecnico, qtd_tecnicos, total_pcs, baixadas, percentual, estoque, data_corte — resolvidos só na geração, então o texto não envelhece
- Pré-visualização ao vivo em 3ª coluna, com zoom 55–130%, rolagem automática e destaque amarelo na seção sendo editada
- Botão "Imprimir / salvar PDF" na própria tela
- Removidos os textos padrão `defG1`, `defG2`, `defG3`, `defConclusao` do código — eram eles que substituíam silenciosamente os textos oficiais

**Funções novas importantes:**
- `cgeMontarDocumento()` (~linha 3185) — devolve o HTML do documento; usada pelo PDF **e** pelo preview. Fonte única.
- `cgeAgregar(todosPcs, metaPorId, usuarios, dtInicio, dtCorte)` — regras de agregação compartilhadas entre `cgeGerar` e `cgeCarregarNumeros`
- `cgeCarregarNumeros()` / `cgeCamposFonte()` — alimentam os `{{campos}}` sem exigir gerar o relatório antes

### Textos já corrigidos na tela
- **Conclusão** — primeiro parágrafo com `{{periodo}}`, `{{meta_global}}`, `{{baixadas}}`, `{{percentual}}`; os outros 5 parágrafos preservados
- **Local e data** — `São José, {{data_corte}}`
- **Cabeçalho e metas** — meta mínima 10, meses do período 12

---

## ADENDO — 04/08 à tarde

### J) Rótulo da linha do Quadro 1 está chumbado no código — DIVERGE DO OFICIAL

O texto "Resultado até o período — agosto de 2025 a agosto de 2026" NÃO vem
do banco nem do relatório oficial. Está escrito no index.html:

    // ~linha 2107 na cópia v62
    <td style="font-weight:700;">Resultado até o período — ${periodoLong}</td>

    // ~linha 1930-1932
    const fmtPeriodo = (s) => new Date(s+'T12:00:00')
      .toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
    const periodoLong = `${fmtPeriodo(dtInicio)} a ${fmtPeriodo(dtCorte)}`

Comparação com o relatório oficial de 14/05:

| | Oficial (14/05) | Sistema (04/08) |
|---|---|---|
| Rótulo da linha do Quadro 1 | Resultado até o 3º trimestre | Resultado até o período — agosto de 2025 a agosto de 2026 |
| Cabeçalho | Período de Monitoramento: Agosto/2025 a Abril/2026 | agosto de 2025 a agosto de 2026 |

Dois problemas distintos:
1. Semântica — o oficial nomeia o trimestre; o sistema descreve o intervalo de datas.
2. Formato — oficial "Agosto/2025"; fmtPeriodo devolve "agosto de 2025".

Causa de fundo: o Quadro 1 é seção do tipo `q1` (tabela gerada por código).
O rótulo da primeira coluna não está no JSONB `secoes`, então a coordenação
não consegue corrigir pela tela do editor.

Três saídas avaliadas:
1. Voltar ao padrão oficial: `Resultado até o ${rotuloTrimestre}`, com campo
   novo no painel de parâmetros (ex.: "4º trimestre"). ← reproduz o documento anterior
2. Criar `{{rotulo_periodo}}` como 11º token editável.
3. Só ajustar o fmtPeriodo para "Agosto/2025", se o incômodo for apenas o formato.

Decisão: PENDENTE. Nada foi alterado no código ainda.

Atenção ao aplicar: os números de linha são da cópia v62 anexada ao projeto.
Os commits de 04/08 deslocaram tudo — localizar pelo trecho de texto
("Resultado até o período"), nunca pela linha.

---

## PENDÊNCIAS

### A) Textos ainda com dados de maio (a coordenação corrige na tela)
| Seção | O que está errado |
|---|---|
| **1.1 Cronograma** | "fevereiro a abril de 2026", "1.290", "30 processos", "43 técnicos" — contradiz o Quadro 1 logo abaixo |
| Análise consolidada | "Durante o período de fevereiro a abril de 2026" |
| Afastamentos — texto | "No período de fevereiro a abril de 2026" |
| Metas proporcionais | cita Luis Filipe, Caroline, Elquier, Marilza como substituídos |
| Grupo 2 | "2 técnicos ultrapassado a meta" |
| Conclusão | ainda tem a palavra **"teste"** no fim do último parágrafo — APAGAR |

### B) BOMBA — `data_baixa` não tem valor histórico
Medido em teste: no período **fev–abr/2026 o total de baixas dá ZERO**. As 3.760 estão carimbadas em 30/06/2026 (carga histórica), não nas datas reais.
O relatório da CGE é trimestral. Se alguém colocar o período do trimestre, sai tudo zerado.
**Resolver antes do próximo relatório.**

### C) Estoque do Quadro 1
Sai 14.652 (igual ao total). A fórmula é *não-baixadas + baixadas-no-período*; com período largo, soma o universo inteiro.
Conversa com a pendência antiga de o estoque mostrar 14.622 em vez de 11.552 — parece ser a mesma questão de período, não de cálculo. **Não investigado.**

### D) Gabriele — NÃO VERIFICADO
Planilha do G1 diz **56** baixas, sistema diz **1**. Única divergência grande na direção contrária.
Se ela baixou mesmo 56, o sistema perde 55 baixas e o Quadro 2 está errado.
SQL para checar:
```sql
SELECT COUNT(*) FILTER (WHERE baixada=true) AS baixadas,
       COUNT(*) FILTER (WHERE baixada=false) AS nao_baixadas,
       COUNT(*) AS total
FROM prestacoes_contas WHERE setorial_id='FCEE' AND analista_nome='Gabriele';
```

### E) 4 PCs atribuídas pela regra de NL (não por parcial)
2020PC000845, 2020PC003459, 2022PC003974, 2022PC003191 — atribuídas em 03/08 usando NL, regra derrubada na reunião. 0,1% do total.
```sql
SELECT codigo_nl, parcial_num, codigo_pc, processo_pc, analista_nome
FROM prestacoes_contas WHERE setorial_id='FCEE'
AND codigo_nl IN ('2020NL008835','2020NL010150','2022NL009114','2022NL020539')
ORDER BY codigo_nl, parcial_num;
```

### F) Não testado
- **"Fechar versão"** — congela o relatório e abre rascunho novo herdando tudo. Nunca foi acionado. Testar antes de a coordenação usar.
- Preview no Firefox (zoom CSS só a partir da v126)
- Altura do preview: `calc(100vh - 250px)`, pode precisar de ajuste

### G) Passos 2 a 5 da decisão de 03/08 — NÃO FEITOS
Tela por parcial · situação por parcial · `registrar_parecer` expandindo por parcial em vez de NL · CI só habilita com parecer

### H) Cadastros
- **Gustavo Hallack Porto** — conta de coordenador G3 (CPF 020.839.609-80, Portaria FCEE 95 de 13/05/2026)
- **Caroline** (G3) — meta 27 em `metas_analistas` com `analista_id` órfão; não existe em `usuarios`
- **Eduardo** — meta 17 na planilha do G3, não existe no banco
- CPFs faltantes: Aline, Ana Leticia, Daniela, Franciani, Marisa, Miriam, Marlene, Scheila, Nayara, Zadir
- Janaína duplicada (inativa) — excluir
- Afastamentos: só o Willian lançado (o relatório de maio tinha 12)

### I) Débitos técnicos
- **API sem camada de autorização** — resolver antes de FCC/SED/SES
- `status === 'baixada'` ainda em ~15 lugares (canônico é `baixada === true`)
- Produtividade não filtra período; Quadro 2 filtra — percentuais nunca batem
- Código morto: `CGE_TXT_PADRAO`, `cgeJustRender/Add/Del`, `cgeAssRender/Add/Del`, `cgeQ3Render/Add/Del`, `cgeSecGet`
- Chip `{{campo}}` gruda no texto vizinho — dificulta digitar espaço antes/depois
- `tmp_parc_ok` pode ser dropada

---

## DIAGNÓSTICO SISTEMA × PLANILHA (fechado em 03/08)

| Grupo | Planilha | Sistema | Dif |
|---|---|---|---|
| G1 | 1.531 | 1.586 | +55 |
| G2 | 1.902 | 1.309 | **−593** |
| G3 | 916 | 865 | −51 |
| **Total** | **4.349** | **3.760** | **−589** |

**Causa:** a aba Monitoramento usa
`=SUMIFS(backup!E:E, backup!A:A, "<nome>", backup!G:G, "*Parecer*")`
somando a coluna **"Número de PCs"**. Quando uma NL cobre várias parciais, o analista repetiu o total da NL em CADA linha de parcial.

Exemplo real — Ana Claudia, TR 2020TR000725: parciais 2, 3 e 4, cada uma com "Número de PCs" = 4. Planilha soma 12; PCs reais: 4.

**Prova pela correlação:** G3 (multiplicador 1 em 654 de 762 linhas) → −51 · G2 (153 linhas com multiplicador 4) → −593.

**A planilha discorda dela mesma.** Ana Claudia: aba Monitoramento **136**, aba Novos Resultados **31**, sistema **52**.

**Conclusão: 3.760 é o número defensável.**

---

## ARMADILHAS CONFIRMADAS

**Railway:** aba Query aceita SELECT e UPDATE simples, mas quebra com LIMIT. Para blocos grandes: aba **Console** → `psql $DATABASE_URL` → esperar `railway=#`. Comandos `\pset` etc. têm que ficar SOZINHOS na linha. Limite de colagem ~32 KB (gerar arquivos de até 19 KB).

**Coluna do TR é `tr`**, não `codigo_tr`.

**41 colunas de `prestacoes_contas`:**
id, tr, codigo_pc, codigo_nl, processo_pc, processo_mae, parcela_seq, entidade, cnpj_cpf, valor, situacao_origem, status, analista_nome, analista_id, grupo, conflito, parecer_tipo, baixada, data_baixa, origem_baixa, registrado_por, setorial_id, criado_em, atualizado_em, estornada, data_estorno, motivo_estorno, estornado_por, tipo, dt_limite_pc, dt_recebimento_pc, prazo_analise_dias, dias_atraso, prazo_diligencia, num_diligencia, enviado_ci, dt_envio_ci, parcial_num, qtd_diligencias, dt_situacao, obs_situacao

**IDs:** Aline 7 · Richard 4 · Franciani 12 · Ana Claudia 22 · Noici 31 · Higor 43 · Juliana 45 · Samoel 48 · Scheila 49 · Willian 50

**Variantes de parecer** (usar ILIKE, NUNCA igualdade):
Parecer Regular com Ressalvas 1.981 · com Ressalva 1.166 · Parecer Regular 586 · Encaminhado ao Controle Interno 16 · Parecer Irregular 8 · com Ressalva(s) 3
Regular → `ILIKE 'Parecer Regular%'` · Irregular → `ILIKE '%Irregular%'`

**Whitelist da API descarta campo fora da lista em silêncio e responde sucesso.** Sempre conferir antes de mandar campo novo.

**Data de corte: sempre 23:59.**

**Textos do Quadro 1 e Quadro 2 são gerados por código**, não estão em `secoes` — ver adendo J.

**Repositório local:** `C:\Users\Richard\sigpc-gt` e `C:\Users\Richard\sigpc-api` (no PC de casa). No PC do trabalho não foi localizado.

**Método:** um prompt por vez no Claude Code; `node --check` (extrair os `<script>` para arquivo .js, o comando não roda em HTML); `git add index.html` — nunca `-A` nem `.`
