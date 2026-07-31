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

## Fase 1 concluída — regra do Controle Interno

Commits 0bdb672 e 7165c53.

Regra definida pela coordenação: encaminhar ao Controle Interno registra a baixa. O analista já tem o parecer pronto e anexado no SGPe e no SIGEF antes de encaminhar, então a responsabilidade é dele. Quando o Controle Interno devolve o processo para diligência ou pede novas ações, a PC permanece baixada. Ao retornar ao Controle Interno novamente não computa nova baixa, para não duplicar produtividade.

O que foi implementado: as 17 ocorrências de `status==='baixada'` foram migradas para o campo booleano `baixada`. As cadeias de `else if` foram quebradas, permitindo que uma PC conte como baixada e simultaneamente apareça em diligência. A função `ciConfirmarDevolucao` não zera mais o campo `dt_envio_ci`, que passa a ser a marca permanente da passagem pelo Controle Interno. A função `enviarAoCI` recebeu o segundo argumento `jaBaixada` e só grava os campos de baixa se a PC ainda não estiver baixada. O botão "Registrar parecer" é substituído pelo texto "Já baixada" quando a PC já está baixada. Foi criada a função `tagsEstadoPC`, ainda não aplicada nas telas.

Estados possíveis pelo par de campos: `enviado_ci` falso e `dt_envio_ci` vazio significa que nunca foi ao Controle Interno. `enviado_ci` verdadeiro e `dt_envio_ci` preenchido significa que está no Controle Interno agora. `enviado_ci` falso e `dt_envio_ci` preenchido significa que já voltou do Controle Interno.

Teste realizado e aprovado com a PC `2023PC002110`. Produtividade subiu de 30 para 31 ao encaminhar ao Controle Interno, e permaneceu em 31 após a devolução pelo painel. A PC foi revertida ao estado original por comando direto no banco ao final do teste.

### Pendências anotadas

Aplicar a função `tagsEstadoPC` nas telas. Substituir os `confirm` do navegador por modal do sistema. Criar tela de estorno, pois hoje a reversão só é possível por comando direto no banco. Unificar no back-end os campos `status`, `baixada` e `estornada`, que hoje podem desincronizar. Lançar manualmente no sistema os 41 registros de Controle Interno que existem nas planilhas, equivalentes a 46 PCs.

## Fase 2 concluída — cadastro de analistas

Commits: `1f1016f` no repositório `sigpc-api`, e `21cefb7` e `3d356cd` no `sigpc-gt`.

Foram criados cinco campos na tabela `usuarios`: `matricula` do tipo texto, `portaria` do tipo texto, `data_ingresso` do tipo data, `data_saida` do tipo data e `meta_mensal` do tipo inteiro com padrão dez. O `ALTER TABLE` foi executado pelo painel do Railway, na aba Database e seção Query, porque o `psql` não está instalado no computador do trabalho.

Na API foi necessário alterar dois pontos no arquivo `server.js`. A constante `USUARIOS_PATCH_PERMITIDOS` funciona como whitelist e descartava silenciosamente qualquer campo fora da lista, sem retornar erro. Os cinco campos foram acrescentados. A rota `POST` de usuários tinha o `INSERT` com colunas fixas e também foi ampliada.

**Armadilha registrada:** um PATCH misto contendo um campo válido e um campo fora da whitelist grava apenas o válido e responde sucesso. O campo descartado não gera erro algum. Sempre verificar a whitelist antes de acrescentar campos novos em qualquer tela.

No frontend o campo Observações do modal de usuário foi removido, pois nunca gravou nada por não existir a coluna `obs` na tabela. No lugar entrou a seção "Dados do GT-PC" com os cinco campos. As funções `admSalvarUsuario`, `admEditarUsuario` e `abrirNovoUsuario` foram ajustadas para ler, gravar e limpar os campos.

**Bug corrigido durante a fase:** o superadmin estava trancado para fora do próprio Painel Admin. A função `irAdmin` e a variável `isAdmin` em `renderSB` exigiam `setorialAcesso` igual a `ADMIN`, mas não existe seletor de setorial na interface para fazer essa troca. As duas condições passaram a usar `perfil` igual a `superadmin`.

Teste realizado e aprovado: os dados gravados no formulário persistem após fechar e reabrir o usuário.

**Pendência da fase:** as colunas novas ainda não aparecem na listagem da tabela do Painel Admin, apenas no formulário de edição.

### Próximo passo

Fase 3, férias e afastamentos. Criar a tabela `afastamentos` com os campos `analista_id`, `data_inicio`, `data_fim` e `motivo`. Coordenador lança os do próprio grupo e superadmin lança de todos. Os registros alimentam a tabela de afastamentos do relatório CGE.
