# SESSÃO 03/08/2026 — SIGPC-GT

## Estado atual do sistema

| Indicador | Valor |
|---|---|
| Total de PCs | 14.652 |
| Baixadas | **3.733** |
| Meta do período | 4.631 |
| Cumprimento | **80,6%** |
| Estoque livre | ~6.700 |
| Técnicos monitorados | 45 |

Relatório anterior (14/05/2026): 2.186 PCs · 56,5%. Evolução: +1.547 PCs · +24,1 p.p.

## O que foi feito hoje

### Importação das planilhas (definitiva — planilhas descontinuadas a partir de 04/08)
- 2.237 linhas com parecer/CI nas planilhas → 2.203 processos únicos após normalização
- 1.768 já estavam baixados no banco (ignorados pelo `IS DISTINCT FROM true`)
- **435 NLs novas → 622 PCs baixadas** (fator de expansão 1,43)
- Banco: 3.130 → 3.752 → 3.733 (ajustes posteriores)
- `origem_baixa = 'planilha_ago2026'`, `data_baixa = 03/08/2026`

Origens de baixa no banco:
- `carga_historica` (30/06/2026): 3.127 — carimbo de migração, **sem valor cronológico**
- `sistema` (18/07/2026): 3 — testes
- `planilha_ago2026` (03/08/2026): 622 → 603 após ajustes

### Correção de vínculo — Claudia
As 135 PCs da Claudia (id 36, G3) estavam com `analista_id = 22` (Ana Claudia, G2). Bug de substring: "Claudia" dentro de "Ana Claudia".
- Antes: Claudia 0 (0%) · Ana Claudia 105
- Depois: Claudia 56 (51%) · Ana Claudia 49 (45%)
- Verificado: era o **único** caso de divergência nome↔cadastro (só resta "Richard" vs "Richard Motta Coelho", que é grafia curta e não afeta contagem)

### Alterações no código (commits do dia)
1. Dashboard: removido filtro `estornada=false` — PC rebaixada após estorno não some mais
2. Quadro 1: passou a exigir `baixada === true && noPeriodo(p)` — antes contava qualquer PC com `parecer_tipo` preenchido
3. Quadro 1: nova coluna **Controle Interno (7a)** via `totCI`, contando `!ehRegular && !ehIrregular`
4. Produtividade e Relatórios: carimbo de data/hora da apuração
5. Quadro 4: colunas **NLs** e **TRs** (Sets `nlsPend` / `trsPend`)
6. Manual do sistema no Dashboard (card colapsável, 6 etapas)
7. Rodapé de governança com logos SEGOV / Casa Civil / FCEE / CGE em `assets/logos/`
8. Assinaturas: `[assinado digitalmente]` em itálico + Gustavo Hallack Porto, Portaria FCEE 95 – 13/05/2026
9. Crédito no rodapé do relatório

## PENDÊNCIAS ABERTAS

### Diagnóstico de consistência — 3 dos 4 achados NÃO resolvidos
1. ~~Dashboard vs Produtividade — campo de baixa divergente~~ (parcialmente: Dashboard corrigido)
2. **ABERTO** — Produtividade não filtra por período; Quadro 2 filtra. Os percentuais nunca batem, por definição.
3. ~~Quadro 1 não filtrava~~ RESOLVIDO
4. **ABERTO** — Produtividade e Quadro 2 listam universos diferentes de servidores (`perfil !== 'coordenador'` vs `perfil === 'analista'` + superadmin)

**ABERTO** — `status === 'baixada'` ainda aparece em ~15 lugares (Board, Relatórios, Minha Planilha, Painel Técnico). O canônico é `baixada === true`. Risco latente.

### 19 PCs baixadas sem analista
7 TRs, 17 NLs. Baixadas por efeito de NL compartilhada em TRs não atribuídos. Não há de quem herdar (testado por NL e por TR, ambos `UPDATE 0`). Só o 2022TR000830 foi resolvido (Graciane, +1 baixa).
TRs: 2020TR000632, 2020TR000723, 2020TR000940, 2020TR001636, 2021TR002029, 2022TR001157, 2023TR000039.

### Cadastros
- **Gustavo Hallack Porto** — CPF 020.839.609-80, Portaria FCEE 95 de 13/05/2026 — criar conta de coordenador G3
- CPFs faltantes: Aline, Ana Leticia, Daniela, Franciani, Marisa, Miriam, Marlene, Scheila, Nayara, Zadir (vários estão na aba "Novos Resultados" das planilhas)
- Caroline (G3) — existe na planilha, não existe no banco
- Janaína duplicada (inativa) — excluir
- Eduardo — confirmar situação
- Afastamentos: só o Willian está lançado

### Técnicas
- **API sem camada de autorização** — filtra só pelo que o front manda. Resolver antes de FCC/SED/SES
- Distribuição do estoque: qualquer analista vê e assume qualquer TR livre. Sem divisão por grupo
- Upload de arquivo no Repositório (hoje só link)
- Fase 6 — matriz de permissões

## ARMADILHAS (aprendidas hoje)

**Railway — aba Query só aceita SELECT.** UPDATE dá `syntax error at or near "LIMIT"`. Para UPDATE use a aba **Console** → `psql $DATABASE_URL` → prompt `railway=#`.

**Data de corte do relatório.** Se a hora for anterior ao momento da importação, o total volta a 3.130. Usar sempre 23:59.

**data_baixa não tem valor histórico** para as 3.127 da carga. Qualquer filtro de período sobre elas mente. As baixas feitas no sistema a partir de agora gravam NOW() real.

**Chave de conciliação planilha↔banco:** prefixo alfabético + dígitos sem zeros à esquerda, aplicado nos dois lados. **NUNCA por TR+Parcial** — a numeração da planilha não corresponde a `parcela_seq`.

**Três contagens nas planilhas, todas diferentes:**
- Aba Monitoramento: 3.959 (PCs, usa "Número de PCs")
- Aba Novos Resultados: 2.134 (pareceres)
- Recálculo da fórmula do Monitoramento: 4.098 (diferença de 139 por descarte de nome no SUMIFS)
- Sistema: 3.733 (auditável registro a registro)

**Coluna "Parecer" das planilhas é imprestável** — no G3 tem "Aguardando Lei FCEE" e "AGUARDANDO PARECER CONIN". Usar a coluna **Situação**, que é padronizada.

**G2 não tem linha de cabeçalho** na aba Planilha1 — a primeira linha já é dado.

## Leitura do Quadro 4 (nova)

Volume de PC não mede carga:
- Gabriele: 361 PCs em **9 TRs** (202 NLs)
- Sandra Paul: 279 PCs em **8 TRs**
- Grazielly: 155 PCs em **54 TRs** (36 NLs)
- Graciane: 5 PCs em 5 TRs

## Método de trabalho
- Código via Claude Code, um passo por vez, `node --check` antes de commitar
- `git add index.html assets/logos` — **nunca `-A` nem `.`** (existem `identidade_sigpc.css` e `logo_sc_base64.js` untracked na raiz)
- Diagnóstico antes de alterar; mockup antes de implementar tela
