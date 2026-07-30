# SESSÃO — 30/07/2026

## Estado do sistema

Frontend: https://richardmottac-star.github.io/sigpc-gt/
API: https://sigpc-api-production.up.railway.app
Repo local: C:\Users\Richard\sigpc-gt

Commits do dia: 25f4ceb · 638682d · 0379be2

## 1. Painel Técnico (concluído)

Tela visível apenas para `superadmin`. Item no menu com nome neutro.

Lê de `prestacoes_contas` com `status=livre`, agrupa por `tr` + `codigo_nl`, ranqueia pelo maior pacote de PCs que um único parecer baixa.

Funções: `irPrioridade()` · `priorCarregar()` · `priorOrdenar()` · `priorRenderizar()` · `priorExportarCSV()`

Somente consulta — o botão Assumir foi removido de propósito. O analista vê aqui e assume pelo Estoque, para não haver divergência entre telas.

## 2. Devolução Master (concluído)

Permite ao superadmin devolver TR ao estoque sem aprovação de coordenador.

Funções: `abrirDevM(tr)` · `confDevM()` · modal `moDevM`

Regras:
- Só aparece para `U.perfil==='superadmin'`
- Presente no Estoque TRs (dentro do ramo `isMeuTR`) e na Minha Planilha (coluna própria)
- Devolve a TR inteira
- **Protege PCs baixadas** — filtra `baixada !== true` antes do PATCH
- Atualiza `prestacoes_contas`: `status='livre'`, `analista_nome=null`, `analista_id=null`

Pendente: testar no navegador.

## 3. Dessincronia entre tabelas

`estoque` e `prestacoes_contas` divergem.

Caso que expôs: `2023TR001078` — o estoque dizia livre, mas as 10 PCs já eram da Geisa (grupo 2).

Fonte correta: `prestacoes_contas` — 14.652 PCs, 6.713 livres.

O Painel Técnico e a Devolução Master já usam a fonte correta. A tela Estoque TRs ainda precisa ser verificada.

Para retomar, coletar o `count` de:

```
/estoque?status=livre&setorial_id=FCEE&limit=1
/prestacoes_contas?status=livre&setorial_id=FCEE&limit=1
```

## 4. Análise das métricas CGE

Analisadas as planilhas dos três grupos e o relatório entregue (ago/25 a abr/26).

**Achado central:** as planilhas usam dois métodos incompatíveis para a mesma métrica.

| Método | Onde | Total |
|---|---|---|
| A — conta pareceres | aba Novos Resultados | 2.160 |
| B — soma "Número de PCs" | aba Monitoramento (SUMIFS) | 4.163 |
| Entregue à CGE | relatório ago/25-abr/26 | 2.186 |

Média geral: 1,93 PCs por parecer. Por grupo: G1 = 1,84 · G2 = 2,89 · G3 = 1,16

Recomendação técnica: Método B. A meta é definida em PCs e a tabela `prestacoes_contas` tem 1 linha = 1 PC, tornando a contagem nativa e auditável.

Ressalva: adotar B eleva o número de 2.186 para 4.163 e exige justificativa expressa no relatório.

### Inconsistências encontradas

- Variantes de nome: Janaina/Janaína (13 pareceres perdidos), Sandra Rocha (4 grafias), Willian/WIllian
- Noici (G2): célula de produtividade mostra 1, o correto é 32
- Coluna "Número de PCs" incompleta em 7 servidores
- Marilza, Caroline e Eduardo com meta atribuída e zero baixas

### Regra do Controle Interno

O CI não conta como baixa — confirmado nas duas planilhas (coluna separada) e nos 41 registros da base.

A confirmar com Nayara/Zadir:
1. Encaminhar ao CI conta como baixa para produtividade CGE?
2. Se sim, como evitar dupla contagem quando o processo retorna e recebe parecer?

## 5. Situação individual — Richard

Meta 78 · Realizadas 30 · Faltam 48 · Cumprimento real 38,5%

A planilha mostra 22 porque 8 registros estão com a coluna "Número de PCs" em branco, todos em parcelas FINAL. O correto é 30 — valor que coincide exatamente com o Quadro 2 do relatório anterior.

### TRs a corrigir na planilha (preencher com valor 1)

2022TR000251 · 2021TR001582 · 2022TR002146 · 2023TR000150 · 2021TR002268 · 2021TR001690 · 2023TR000807 · e um registro sem número de TR informado

### Plano para fechar a meta — 5 TRs, 5 pareceres, 51 PCs

| TR | Entidade | PCs |
|---|---|---|
| 2022TR001465 | APAE Blumenau | 12 |
| 2022TR002271 | APAE Florianópolis | 12 |
| 2023TR000219 | Fraternidade Cristã | 11 |
| 2022TR001456 | APAE São Ludgero | 8 |
| 2023TR000809 | Integração Social de Crianças | 8 |

### Lista de reserva

2022TR001451 (7) · 2022TR001512 (7) · 2022TR001438 (6) · 2022TR001530 (6) · 2022TR001086 (5) · 2022TR001440 (5) · 2022TR000770 (4)

### Evitar por ora (pacote inicial bom, volume total alto — entope a carteira)

2022TR001683 (36 PCs) · 2022TR000941 (42) · 2022TR000691 (45) · 2020TR000820 (46)

### Excluídos por inviabilidade técnica

Todos da Associação de Deficientes Visuais de Itajaí e Região: 2022TR001097 · 2022TR001688 · 2020TR000632

### TR 2020TR000620 — APAE Timbó

77 PCs em 27 NLs, todas do Richard. CNPJ 83.793.083/0001-40 · processo mãe SCC2511/2020.

Maiores pacotes: 2022NL003473 (6 PCs) · 2020NL006139 (5) · 2021NL005732 (5) · 2022NL014906 (5)

Razão de 2,85 PCs por parecer — bem acima da média do Grupo 3.

**Verificar depois:** 4 PCs de 2023 com valor e SGPe idênticos (SCC 00007810/2024, R$ 483.957,94) mas com NLs diferentes — sugere possível duplicidade na carga.

## Próximos passos

1. Testar a Devolução Master no navegador
2. Verificar qual tabela a tela Estoque TRs está lendo
3. Levar o PDF de análise à coordenação e definir o método de apuração
4. Confirmar a regra do Controle Interno
5. Definir o período do relatório: junho/2026 (meta 110) ou julho/2026 (meta 120)
6. Executar o plano dos 5 TRs
