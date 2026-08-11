# SIGPC-GT — Contexto do Projeto

Sistema de Gestão de Prestações de Contas do Grupo de Trabalho da FCEE
(Fundação Catarinense de Educação Especial, Governo de Santa Catarina).

**Responsável:** Richard Motta Coelho — superadmin e analista do Grupo 3.
**Última sessão:** 20/07/2026

---

## Arquitetura

| Camada | Stack | Repositório |
|---|---|---|
| Frontend | HTML single-file no GitHub Pages | `sigpc-gt` → `index.html` |
| API | Node.js/Express no Railway | `sigpc-api` → `server.js` |
| Banco | PostgreSQL no Railway | — |

- Sistema: https://richardmottac-star.github.io/sigpc-gt/
- API: https://sigpc-api-production.up.railway.app
- Banco: string de conexão em `DATABASE_URL` (variável de ambiente — ver Railway; não versionar a senha)

O deploy é automático: `git push` no `sigpc-api` redeploya o Railway; no `sigpc-gt` atualiza o GitHub Pages.

---

## Regra de negócio

```
TR ──── processo mãe (1:1)
 └── PC (1 a 83)   ← chave única = codigo_pc | unidade de produtividade
      ├── processo SGPe da PC   (compartilhado entre PCs)
      └── NL (1 por PC)         (compartilhada entre PCs → 1 parecer baixa N)
```

- **1 PC = exatamente 1 NL.** Sem exceção nas 13.626 parciais.
- **1 NL pode ser quitada por várias PCs** — até 19 (ex: `2022NL008336`).
  É o que a CGE descreve como *"um parecer baixa 8 PCs"*.
- O analista assume a **TR inteira** e analisa todas as PCs dela.
- A unidade de produtividade é a **PC baixada**, conforme CGE nº 727/2025.
- Meta padrão: 110 PCs por analista no período; proporcional para quem entrou depois.

---

## Banco de dados

### `prestacoes_contas` — 14.652 registros (fonte única)

Chave: `codigo_pc`. Tipos: `parcial` (13.626) e `final` (1.026, sem NL, id `{TR}-PFINAL`).

Status: `livre`, `analise`, `diligencia`, `reanalise`, `baixada`.

Campos: `codigo_pc`, `codigo_nl`, `tipo`, `tr`, `processo_pc`, `processo_mae`,
`parcela_seq`, `entidade`, `cnpj_cpf`, `valor`, `situacao_origem`, `status`,
`analista_nome`, `analista_id`, `grupo`, `conflito`, `parecer_tipo`, `baixada`,
`data_baixa`, `origem_baixa`, `registrado_por`, `setorial_id`, `dt_limite_pc`,
`dt_recebimento_pc`, `prazo_analise_dias`, `dias_atraso`, `prazo_diligencia`,
`num_diligencia`, `enviado_ci`, `dt_envio_ci`

### Outras
- `metas_analistas` — 46 analistas, `vigente = true`, período Nov/2025 a Abr/2026
- `anotacoes_tr` — anotações por TR com histórico
- `usuarios` — cadastro e login
- `planilha_analista` — **DESCONTINUADA.** Nenhuma tela usa. Não reintroduzir.

### Baixas históricas
`origem_baixa = 'carga_historica'` · `data_baixa = 2026-06-30`

---

## Equipe

| Grupo | Coordenador | Analistas |
|---|---|---|
| 1 | Nayara Limas Ferreira | 15 |
| 2 | Zadir T. Machado Ferreira | 14 |
| 3 | Gustavo (**sem cadastro em `usuarios`**) | 17 |

Coordenadores não contam produtividade e não aparecem no Quadro 2 do relatório CGE.

---

## Fluxo de acesso e perfil (desde 19–20/07/2026)

- **Primeiro Acesso** virou autocadastro completo (nome, CPF, setorial, e-mail,
  telefone, região, município, núcleo, senha) via `POST /usuarios/primeiro_acesso`
  — não depende mais de um usuário pré-criado pelo admin. O cadastro nasce com
  `ativo=false`, `aprovado=false`, `aguardando_aprovacao=true`, `grupo=null`.
- **Login** bloqueia com mensagem específica se `aguardando_aprovacao=true`
  (não usa mais `.eq('ativo', true)` na query — busca por CPF e decide depois).
- **Painel Admin** (`irAdmin`) mostra a seção "Aguardando Aprovação" no topo
  (superadmin e coordenador veem todos os pendentes, sem filtro de grupo).
  Aprovar seta `ativo/aprovado=true` e define o grupo escolhido no momento;
  rejeitar **deleta** o registro pendente (permite recadastro pelo mesmo CPF).
- **Meu Perfil** (`irMeuPerfil`, item novo no sidebar) — qualquer usuário logado
  edita e-mail, telefone, região, município, núcleo e foto (JPG/PNG ≤200KB,
  salva como `foto_base64`); e redefine a própria senha. Avatar do cabeçalho
  mostra a foto quando existir.
- **Região/Município** são dropdowns encadeados usando a constante
  `REGIOES_FECAM` (295 municípios de SC nas 21 associações regionais da
  FECAM) — fonte: arquivo `MUNICIPIOS DE SC E REGIÕES FECAM LISTA.md`
  fornecido pelo Richard. Sem região selecionada, lista todos em ordem alfabética.

---

## Armadilhas conhecidas

1. **Nome curto vs completo** — `prestacoes_contas.analista_nome` é curto ("Richard");
   `usuarios.nome` é completo ("Richard Motta Coelho").
   **Sempre filtrar por `analista_id`**, nunca por nome.

2. **`CREATE TABLE IF NOT EXISTS` não altera tabela existente.**
   Para colunas novas usar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

3. **Datas futuras zeram o relatório.** `data_baixa` sempre no passado.

4. **Colunas que NÃO existem em `usuarios`:** `obs`, `atualizado_em`.
   Incluí-las no payload gera erro. Se precisar, criar antes com `ALTER TABLE`.
   `email`, `regiao`, `municipio`, `telefone`, `nucleo`, `foto_base64`, `aprovado`
   e `aguardando_aprovacao` existem desde o fluxo de Primeiro Acesso/Perfil (19/07/2026).

5. **Não editar `index.html` por número de linha via PowerShell** — risco de corromper
   o arquivo inteiro. Usar edição por busca de texto.

6. **Setorial é sempre FCEE.** Os processos são abertos pelos núcleos (SCC, ADR, SDR),
   mas a concedente é a FCEE.

7. **Chave de agrupamento é `codigo_pc`**, nunca `processo_sgp` — 2.704 processos
   têm mais de uma PC.

8. **A senha não se confere mais neste arquivo — e não pode voltar a se conferir.**
   Até 11/08/2026 o `login()` pedia a linha do usuário COM A SENHA e comparava em
   JavaScript. Consequência medida em produção: `GET /usuarios` devolvia as 49 senhas em
   texto puro a quem soubesse o endereço da API, que está escrito neste arquivo público.
   Agora quem confere é `POST /usuarios/login` e `senha_hash` não sai do servidor.
   A regra de acesso mora em `sigpc-api/lib/auth.js`, com teste.

9. **Crase dentro de template literal quebra o arquivo.** Boa parte da marcação do
   `index.html` é gerada por JS dentro de `` `...` ``. Um comentário com crase no meio
   fecha a string. Aconteceu em 11/08, no bloco do Meu Perfil.

---

## Método: TRABALHAR EM BLOCO, NÃO PASSO A PASSO (desde 12/08/2026)

**Motivo:** em 10/08 o método passo a passo — mockup, parar, implementar uma tela, parar,
reportar — consumiu o dia inteiro e cansou o Richard sem necessidade.

- **Agrupar frentes relacionadas num único ciclo**, em vez de parar entre cada tela.
- **Parar só quando a decisão for realmente dele:** regra de negócio, prioridade, ou
  dado de analista real.
- **Não parar** para confirmar detalhe de implementação, texto de mensagem ou escolha
  técnica — decidir, seguir, e reportar depois.
- **Reportar em bloco no fim**, não a cada etapa.
- **Rodar contra o banco antes de publicar continua valendo** — foi o que pegou os quatro
  defeitos de SQL de 10–11/08, todos invisíveis aos 220 testes com dublê.

Isto NÃO afrouxa a regra de escrita no banco: `INSERT`/`UPDATE`/`DELETE`/`ALTER`/`CREATE`
continuam exigindo autorização expressa. O que muda é o ritmo do trabalho, não a permissão.

---

## Padrões de trabalho

- Validar sempre com `node --check` antes de commit.
- No `index.html`, extrair os blocos `<script>` para um arquivo temporário e validar.
- Testar rotas contra o banco antes do push; reverter dados de teste em seguida.
- Nunca commitar CSVs de carga nem scripts com credencial.
- Comunicação com o Richard em português do Brasil.

---

## Pendências

> Conferida contra o banco em **11/08/2026**. O que está `[x]` foi verificado, não presumido.
> A lista completa e o motivo de cada baixa estão no `CLAUDE.md` do `sigpc-api`.

### Verificar (última rodada não conferida)
- [ ] Quadro 2 do relatório CGE lista os 45 servidores (estava truncando em 5)
- [ ] Estoque no Quadro 1 mostra 11.552 — o banco tem **11.033 abertas**; os números não
      batem, conferir de onde sai o 11.552
- [x] Tela Produtividade com linhas neutras — corrigido 19/07/2026 (zebra branco/cinza,
      cor só no % e na barra: verde #15803D / âmbar #B45309 / vermelho #991B1B)

### Verificar — sessão 20/07/2026 (não testado em navegador, só validado com node --check)
- [ ] Fluxo completo Primeiro Acesso → aparece em "Aguardando Aprovação" → Aprovar
      (com grupo) → login libera. E o caminho de Rejeitar.
- [ ] Upload de foto no Meu Perfil, agora que o bodyParser subiu para 5mb
- [ ] Migração automática das colunas novas de `usuarios` rodou certo no boot do
      Railway (`garantirColunasUsuarios` em `server.js`)
- [ ] Dropdown Região/Município no Primeiro Acesso e no Meu Perfil (filtro e opção
      "Todas as regiões" mostrando os 295 municípios)

### Cadastro
- [ ] **Gustavo: nome completo e portaria.** O cadastro existe (id 56, coordenador, grupo 3);
      falta a assinatura no PDF do relatório CGE, ainda comentada.
- [ ] **Caroline** — meta 27 vigente, sem usuário em `usuarios`. É a única nessa situação.
- [x] Claudia — id 36, meta 120 vigente. Dado completo; reabrir só se voltar a aparecer "—".

### Dados
- [x] 16 TRs com 2+ analistas — `conflito = true` devolve **0 TRs, 0 PCs**.
- [x] 6 TRs que não casaram — **nenhuma existe** em `prestacoes_contas`; lista obsoleta.
- [ ] Definir meta vigente: CGE (Ago/25) ou Monitoramento (Nov/25)

### Funcionalidades
- [x] **Notificações internas — o sino está no ar** desde 10–11/08/2026. Quatro canais:
      aprovação, prazo, diligência e recado. Ver `SESSAO.md`.
- [x] E-mails dos analistas — campo `email` existe desde 19/07/2026 (Primeiro Acesso
      e Meu Perfil). Falta **envio**, que é funcionalidade nova, não item em aberto.
- [ ] Código morto: `confDev` e modal `moDev` — **14 ocorrências** no `index.html`.

### Arquivos não versionados (intencional, conferir antes de apagar)
- [ ] `sigpc-gt`: `identidade_sigpc.css`, `logo_sc_base64.js` — **nenhum `<script>` ou
      `<link>` os carrega** (conferido em 11/08). Mesmo caso do `sgpe-link-standalone.js`,
      que foi removido; candidatos a exclusão, mas confirmar com o Richard antes de apagar.
- [ ] `sigpc-api`: scripts de carga (`carga_*.js`, `*_carga.csv`, `backfill_*.js`,
      `desfazer_assuncoes.js`, `importar_nls.js`) — nunca commitar (regra do projeto)
