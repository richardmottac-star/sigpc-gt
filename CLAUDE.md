# SIGPC-GT — Contexto do Projeto

Sistema de Gestão de Prestações de Contas do Grupo de Trabalho da FCEE
(Fundação Catarinense de Educação Especial, Governo de Santa Catarina).

**Responsável:** Richard Motta Coelho — superadmin e analista do Grupo 3.
**Última sessão:** 13/08/2026 — ver `SESSAO.md` para o estado do dia.

> **O sistema está ABERTO.** Os dois interruptores estão **desligados** e a equipe trabalha.
>
> **Configurações tem TRÊS abas:** Limite de TRs · Modo preparação · Modo manutenção.
>
> | | preparação | **manutenção** |
> |---|---|---|
> | o analista **entra**? | sim, e a tela limita | **não** |
> | isentos | superadmin **e** coordenador | **só superadmin** |
> | quem já está dentro | vira tela restrita | **cai a sessão em até 20 s** |
>
> ⚠️ **A manutenção derruba TODO MUNDO** — coordenadores e o Controle Interno inclusive.
> No login ela mostra um painel **vermelho sem formulário**; o superadmin entra pelo link
> discreto *"Acesso do administrador"*. A regra mora em `sigpc-api/lib/manutencao.js`.

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
`num_diligencia`, `enviado_ci`, `dt_envio_ci`, `parecer_ci`, `situacao_atual`,
`ci_situacao`, `ci_rodada`, `dt_inicio_analise`, `dt_assumida`

⚠️ **`dt_inicio_analise` e `dt_assumida` respondem perguntas DIFERENTES.** A primeira é o
relógio da **análise** e não reinicia; a segunda é **quando este analista pegou a TR**, e
reinicia a cada assunção (volta a `NULL` na devolução). Usar uma no lugar da outra faz o
cartão mostrar a data do analista **anterior**. Detalhe no `CLAUDE.md` do `sigpc-api`.

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
| 3 | Gustavo Hallack Porto (id 56) | 17 |

**Controle Interno** — 3 técnicos, perfil `controle_interno`, sem grupo, `meta_mensal = 0`:
ids **62 Marcia Terezinha Miranda · 63 Atemilson Bispo dos Santos · 64 Sirene Wolf dos Santos**.

⚠️ **Coordenadores E técnicos do C.I. não entram em relatório de produtividade.** Não é meta
zero — é não aparecer. A regra é `contaProdutividade(u)` no `index.html`, usada pela
Produtividade, pela Gestão Grupo e pelo Board. O Quadro 2 do CGE resolve por outro caminho:
lista de **inclusão** (`perfil === 'analista'`), que exclui qualquer perfil novo sozinha.

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

10. **NUNCA testar contra o banco real uma função que gerencia a própria transação.**
    O `COMMIT` interno dela **confirma a transação externa**, e o `ROLLBACK` do teste não
    desfaz nada. Em 12/08/2026 isto gravou 7 PCs e 14 mensagens em produção, num teste que
    parecia isolado. Ou dublê de banco, ou SQL cru em `BEGIN/ROLLBACK` — nunca os dois.

11. **`WHERE` de reversão SEMPRE por lista explícita de chaves**, nunca por condição
    derivada. No mesmo dia, reverter com `ci_rodada <> 1` pegou as 14.639 PCs que tinham o
    padrão `0`: de 7 linhas para 14.639. Capturar a lista **antes** e usar `= ANY($1)`.

12. **Botão que aceita clique e não responde é pior que botão cinza.** O Confirmar do
    modal Assumir só era ajustado no caminho de sucesso; no erro continuava aceso, e
    clicar não fazia nada. Todo botão de ação nasce desabilitado e é habilitado no
    caminho que o autoriza — com o motivo no `title` quando não estiver.

13. **No modo "ver como", esconder o caminho, não só travar o fim.** Guardar a função e
    deixar o botão à vista faz o modal abrir, a pessoa preencher e só então descobrir.
    Havia DOIS caminhos de anotação e eu só tinha guardado um — o outro abria normalmente.
    Onze funções recusam na origem, e os botões nem são desenhados.

14. **`parcial_num` VOLTOU a ser o número do SIGEF** — em 1.545 das 1.554 TRs, desde a
    renumeração de 12/08/2026. Já dá para conversar com o analista por ele.
    **Uma parcial = (tr, processo_pc).**

    ⚠️ Em **9 TRs** ele continua não sendo: 623, 638, 681, 718, 722, 809, 2385 (o SIGEF tem
    parcela que a base não tem) e 791, 967 (mesmo SGPe escrito de dois jeitos). Nessas, a
    referência segue sendo o **processo SGPe**. E a **2020TR000637** fecha 1..20 contra 19 do
    SIGEF — a sobra é a PC de `processo_pc = '-1'`, isolada no 20. Detalhe no `CLAUDE.md`
    do `sigpc-api`.

15. **A PC final não é uma parcial.** O agrupamento é por `parcial_num`, e a final tem
    `parcial_num = 'FINAL'` — ela virava um grupo e era contada. O teste é por **`tipo`**
    (`planEhFinal`), nunca pelo texto: no acervo há `FINAL` (981), `Final` (39) e `final`
    (1), e cinco finais gravadas com `parcial_num = '1'`, que se misturam à parcial 1.

16. **⚠️ A TELA NÃO CONTA, NÃO DECIDE E NÃO ITERA — quem faz isso é o servidor.**
    Três lugares tinham o mesmo padrão, e os três caíram em 12–13/08:
    · a **devolução** e o **assumir** faziam um PATCH por PC, em série, sem transação. Uma TR
      tem até 83: rede caindo no meio deixava metade feita. Viraram `POST /tr/devolver` e
      `POST /tr/assumir`, numa transação cada.
    · o modal do assumir **contava as PCs livres sozinho** e perguntava a trava numa segunda
      requisição — duas fontes para a mesma resposta. Agora `GET /tr/:tr/assumir` devolve as
      duas coisas juntas.
    · o **nome curto** do analista (`analista_nome` = "Richard") era montado aqui, com um mapa
      de 8 nomes no `index.html`. Foi para `lib/assumir.js`: a tela não decide mais o que vai
      para o banco.
    **Se a tela está iterando requisições ou contando o que o banco sabe, é defeito.**

17. **Corrigir o processo SGPe passa pelo `procHtml`.** Ele é o ponto único de desenho do
    processo, usado em 11 telas — o lápis entrou nele e apareceu nas onze. `processo_mae`
    também é editável, com o mesmo modal. **Automático primeiro, manual depois:** o campo de
    colar o link só aparece quando mapa + cache + SGPe ao vivo não resolvem.
    ⚠️ Sem lápis na linha do Estoque, de propósito: ela é agregada por TR e não tem uma PC de
    referência para o servidor corrigir.

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

> Conferida contra o banco em **13/08/2026**. O que está `[x]` foi verificado, não presumido.
> A lista completa e o motivo de cada baixa estão no `CLAUDE.md` do `sigpc-api`.
>
> **Estado em 13/08:** 53 usuários · **51 conseguem entrar** · fila de aprovação **vazia** ·
> **2 sem CPF**, e por isso barrados: **49 Scheila** e **52 Eduardo** (este também inativo).

### ⚠️ Telas de 13/08/2026 — no ar, NÃO testadas em navegador
Nada disto foi clicado por uma pessoa. Em 12/08 o Richard achou três defeitos abrindo as
telas que os 14 conjuntos de teste não pegaram.

- [ ] **Assumir uma TR** — reescrito: uma chamada, não 83. A TR **inteira** tem de aparecer
      na Minha Planilha. No erro o modal **fica aberto** com o motivo. `assumirTR` /
      `confirmarAssumirTR`.
- [ ] **Devolver a TR ao estoque** — botão no cabeçalho do cartão, **só superadmin**.
      Contagens, motivo obrigatório, "Outro" exigindo descrição, e **baixada não volta**.
      `abrirDevM` / `confDevM`.
- [ ] **Lápis do processo SGPe** — em 11 telas, via `procHtml`. Sem link o número sai em
      **âmbar**. Corrigir e ver o link nascer. `procEditar` / `procEdSalvar`.
- [ ] **Cabeçalho do cartão** — "assumida em" e a etiqueta **✨ NOVA** (7 dias). Nas TRs
      antigas não aparece nada, e é proposital. `planAssumidaEm` / `planTrNova`.
- [ ] **Indicador de online** — rótulo e seta. Fechar pelo botão, clicando fora e com **Esc**:
      a seta tem de voltar nos três. `onlineSeta` / `onlineFechar`.
- [ ] **Modo manutenção** — ⚠️ ligar **derruba a equipe na hora**. Testar fora do expediente.
      `cfgRenderManutencao` / `manutTelaLogin` / `manutDerrubar`.

### Telas de 12/08/2026 — no ar, não testadas em navegador
- [ ] **Controle Interno** — três abas, fila agrupada por encaminhamento, decisão em bloco
      com o número no botão. `ciGrupos` / `ciPainel` / `ciDecidir`.
- [ ] **Bloco do C.I. na PC do analista** — faixa verde nos três estados, bate-papo com
      avatar. `pCiBloco` / `pCiResponder`.
- [ ] **Fila de aprovação** — aviso de duplicidade, "Mesclar no cadastro existente" e
      seleção em bloco. Quem tem aviso **não tem caixa**, só é aprovado individualmente.
- [ ] **Primeiro Acesso com CPF repetido** — tela "Você já tem cadastro" com "Voltar ao
      login", que leva o CPF já digitado para o campo.

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
