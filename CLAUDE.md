# SIGPC-GT — Contexto do Projeto

Sistema de Gestão de Prestações de Contas do Grupo de Trabalho da FCEE
(Fundação Catarinense de Educação Especial, Governo de Santa Catarina).

**Responsável:** Richard Motta Coelho — superadmin e analista do Grupo 3.
**Última sessão:** 17/08/2026 (madrugada) — ver `SESSAO.md`. **DOZE escritas em produção em
16/08; NENHUMA em 17/08.**

> ## ▶ 17/08/2026 — SÓ TELA. Nada gravado no banco.
>
> **✅ A FAIXA DE AVISOS MUDOU DE LUGAR NO DASHBOARD.** Ela sai do rodapé e vai para **logo
> abaixo da Estrutura de Governança** — **rolando igual**, mesma cor, mesma etiqueta URGENTE.
> Altura **30 → 40 px**, corpo **12 → 13 px**. Nas demais telas, o rodapé, como sempre foi.
> ⚠️ **A primeira versão disto estava errada** e fica registrado: virou um bloco parado com o
> texto inteiro. **É a mesma faixa; muda só a posição.**
> ⚠️ **A marcação é montada UMA VEZ SÓ** e as duas posições saem dela — a única diferença
> permitida é a classe `.faixa-dash`, que só pode mexer em **posição**. **Ver a armadilha 25.**
>
> **✅ REGRESSÃO CORRIGIDA: a etiqueta de reserva vazava por cima da coluna SGPe MÃE** e tapava
> o link do processo (visto na `2022TR001511`). É filha do `table-layout:fixed` de 16/08.
> **Ver a armadilha 24** — ela é a metade que faltava da 23.
>
> **✅ As logos da governança 30 → 48 px** (opacidade `.55` → `.7` junto: logo maior e
> igualmente apagada só fica maior e apagada). O botão do Dashboard virou **"SUA
> PRODUTIVIDADE"**, e o título da tela, **"Produtividade"** — o "(NL)" contradizia a regra:
> a unidade é a **PC baixada** (CGE nº 727/2025), não a NL.
>
> **🔴 O `isMeuTR` ERRA EM 5 ANALISTAS, E NÃO FOI CORRIGIDO — de propósito.** O `renderEst`
> decide "esta TR é minha" **comparando NOME**, com o `MAPA_PLAN_EST` daqui — a **segunda
> cópia** do mapa que estava quebrado no `sigpc-api/lib/assumir.js`, com as **mesmas três
> chaves mortas**. O botão **"Ver" some** nas TRs da Sandra Rocha (19), Ana Claudia (22),
> Ana Letícia (23), Goreti (40) e Janaína (51).
> ⚠️ **Copiar o mapa arrumado para cá resolve hoje e recria a divergência amanhã.** O certo é
> a armadilha 1 do `sigpc-api` — comparar por `analista_id` —, mas o
> `GET /prestacoes_contas/resumo_tr` **não devolve `analista_id`**. **É decisão do Richard**,
> e o conserto é no `sigpc-api`.
>
> **✅ O AVISO id 6 FOI GRAVADO** (17/08, 09h54, pelo `sigpc-api`): o texto curto — **é o que
> passa na faixa agora** — e o `fim` estendido de 18/08 para **31/08**. ⚠️ O `fim` é
> **inclusivo** (`fim >= HOJE_BR`): a faixa passa o dia 31 inteiro e some em 01/09.
>
> **Testes em 17/08:** **18 suítes · 1.033 checagens · 0 falhas** neste repositório
> (`teste_front_faixa.js` é a nova, 43) · `sigpc-api` **19 · 949 · 0**.
>
> ⚠️ **A tela Estoque e o Dashboard continuam NÃO ABERTOS no navegador.** A lista do que olhar
> está no `SESSAO.md` deste repo.

> ## ✅ 16/08/2026 — DOZE ESCRITAS EM PRODUÇÃO. Ver `SESSAO.md`.
>
> **14.658 PCs** · 1.031 finais · 3.804 baixadas · **2.318 no C.I.** · **6.090 sem dono, todas
> `livre`**. Renumeração pelo SIGEF em **211 TRs**; 6 PCs incluídas; 87 destravadas; 78 soltas
> atribuídas ao dono da TR.
>
> ⚠️ **A armadilha 16 foi REESCRITA:** um processo SGPe carrega **várias** parcelas do SIGEF —
> 113 pares medidos no estoque da CGE. A regra antiga foi lida do banco já deformado.
> ⚠️ **`parecer`, `estornar` e `ci` ganharam filtro de `baixada`** — faziam `UPDATE ... WHERE tr
> AND parcial_num` e reescreviam baixa alheia em parcela mista.
> ⚠️ **"Livre" tem UMA definição:** `assumir.PC_LIVRE_SQL`, usada pelo assumir, pelo `resumo_tr`
> e pela tela. Antes eram duas, e 87 PCs caíam no vão.
> ⚠️ **`recarga_exec.js` está DESARMADO** — zera 14.652 linhas, e o sistema está aberto.
>
> **✅ As 18 PCs com `analista_id` sem `analista_nome` FORAM GRAVADAS** (16/08). Elas revelaram
> que o `MAPA_NOME` do `sigpc-api/lib/assumir.js` tinha **três chaves mortas** — o rótulo de
> **5 analistas** saía errado, e os ids 22 e 23 viravam os dois "Ana". Corrigido, 10 chaves.
> Detalhe no `CLAUDE.md` do `sigpc-api`, armadilha 1.
>
> **✅ A TELA ESTOQUE DE TRs FOI AJUSTADA** (16/08): faixa **62px**, logo do Estado **48px**,
> ícone de pessoas antes do ponto verde. Na tabela, **BAIXADAS e ANALISTA saíram** (9 → 7
> colunas) e a entidade passou a **quebrar** — TR 14% · SGPe 20% · **Entidade 32%** · PCs 7% ·
> NLs 7% · Status 10% · Ações 10%.
> ⚠️ **O que faz o `nowrap` valer é o `table-layout:fixed` na classe `.tbl-est`**, nunca no
> seletor `table{}`, que é global e vale para o relatório CGE. Sem ele o percentual do `<col>`
> é só sugestão e a TR quebra em duas linhas. **Ver a armadilha 23.**
> ⚠️ **Não foi aberta no navegador** — o Richard vai abrir. A lista do que olhar está no
> `SESSAO.md` deste repo.
>
> **📌 O que continua registrado e sem executar** (detalhe no `SESSAO.md` do `sigpc-api`):
> a tabela **`estoque` morta** (4.476 linhas, parada em 18/07 — **não mexer, ordem do
> Richard**) · as listas `CI_PENDENTE_POR_ANALISTA/` · e 10 PCs em que o `analista_nome`
> contradiz o `analista_id`.
> As **PCs soltas em TR com dono já foram corrigidas** — 78 em 5 TRs; não repetir.
>
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

14. **⚠️ UM PROCESSO SGPe PODE CARREGAR VÁRIAS PARCELAS DO SIGEF.** Reescrita em 16/08/2026 —
    até então esta armadilha dizia **"uma parcial = (tr, processo_pc)"**, e era **falso**.

    Medido no estoque oficial da CGE por dois agentes cegos um ao outro: **113 pares
    (TR, processo) com 2+ parcelas — 78 TRs, 465 PCs**, e a 2019TR000193 com **11 parcelas**
    num processo só. A direção contrária também existe: **81** parcelas com 2+ processos.
    A regra parecia verdadeira porque foi lida do banco já deformado pela recarga de 05/08.

    ⚠️ **A TELA JÁ ESTAVA CERTA, e é por isso que nada aqui quebrou:** o agrupamento é por
    `parcial_num` nos três pontos (`3205` no detalhe da TR, `8235` na Minha Planilha, `10813`
    no C.I.), nunca por `processo_pc`. Um processo em três parciais vira **três cartões**.

    ⚠️ **O QUE MUDOU NA TELA foi o lápis** — ver a armadilha 17. O `procEdSalvar` tinha um
    ramo de `409` com o modal *"⚠ Isto junta duas parciais"* e o botão **"Entendi, juntar"**;
    ele mandava o servidor igualar o `parcial_num` das duas. **Saiu.** No lugar, o sucesso traz
    `convive` e o toast avisa *"este processo também está na parcial N desta TR"*.

    ⚠️ **`parcial_num` continua sendo o número do SIGEF** e serve para conversar com o
    analista. Em **9 TRs** ele não é: 623, 638, 681, 718, 722, 809, 2385 (o SIGEF tem parcela
    que a base não tem) e 791, 967 (mesmo SGPe escrito de dois jeitos — e essas duas **deixaram
    de ser exceção**, o processo em duas parcelas ali é legítimo). A **2020TR000637** fecha
    1..20 contra 19 do SIGEF: a sobra é a PC de `processo_pc = '-1'`, isolada no 20.
    Detalhe no `CLAUDE.md` do `sigpc-api` e em `SPLIT_PROCESSO_2026-08-16.md`.

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

18. **A busca global é SÓ SUPERADMIN, e a guarda é do servidor.** `GET /busca_global`
    devolve o acervo de **qualquer** analista — o oposto do recorte por `analista_id` das
    outras telas. O `pode:` do menu e o `if` de `irBuscaGlobal` só evitam desenhar o caminho.

    ⚠️ **O documento sai sem biblioteca:** PDF por `window.print()` (igual ao relatório CGE)
    e `.doc` pelo MESMO HTML num `Blob application/msword`. **Não trazer `jspdf`, `pdfmake`
    nem `docx`** para um `index.html` de 11 MB — há teste que falha se aparecerem.

    ⚠️ **A coluna "Código da PC" é dimensionada pela FINAL**, não pela parcial:
    `2018TR000093-PFINAL` tem 19 caracteres contra 12 de `2018PC000015`. `nowrap` na tela e
    no papel. A final entra na tabela como as outras, com `—` na NL.

19. **⚠️ O CARTÃO DA PARCIAL TEM DOIS RAMOS, E O QUE FALTAR NUM DELES SOME DA TELA.**
    Até 13/08/2026 o botão "Encaminhar ao CI" era **inalcançável**, e nenhum dos 15 testes
    pegou: sem parecer ele ficava cinza; **com** parecer a parcial virava `baixada` e caía no
    ramo verde, que não desenhava botão nenhum. Medido: **4.259** parciais no cinza,
    **2.181** sem botão, e **zero** encaminhamentos feitos por analista em produção — as 13
    PCs que estão no C.I. entraram pela `migracao_ci` de 05/08, não pela tela.

    O conserto foi tirar a regra de dentro do HTML: **`pPasso` · `pFaixaPasso` · `pBotaoCI`**,
    chamados pelos **dois** ramos. Há teste que conta as duas chamadas — duplicar a regra em
    vez de chamar o auxiliar faz os ramos divergirem de novo.

    ⚠️ **Botão cinza NUNCA é mudo.** O motivo fica **ao lado, em texto** ("exige parecer
    registrado"), não só no `title` — o `title` só aparece para quem passa o mouse e espera.

    ⚠️ **A trava do servidor não mudou.** `POST /parcela/ci` continua exigindo parecer prévio.
    O que se corrigiu foi a tela esconder o botão depois que o parecer existe.

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

20. **⚠️ SOLICITAR DEVOLUÇÃO: o analista PEDE, não devolve.** Botão no cartão da TR, ao lado
    do "Ver PCs", só para analista e só em TR não concluída.

    O modal `moDev` e a função `confDev` eram **código morto**: chamavam
    `db.from('estoque').update(...)`, uma rota que **nunca existiu** — a TR nunca ficou
    "Aguard. Dev." porque nada gravava isso. Foram ressuscitados em 13/08/2026.
    ⚠️ **Continua valendo: não confundir com `moDevM`/`confDevM`**, a devolução direta do
    superadmin.

    ⚠️ **No motivo 1 a TR vai DIRETO para o analista indicado, NÃO para o estoque** — e o
    cartão da fila diz isso na cara. É o ponto em que a tela poderia enganar: o coordenador
    aprovaria achando que devolveu para a pessoa, e a TR ficaria no estoque para qualquer um
    pegar. A carga do indicado aparece ("Marisa: 8 TRs, limite 6") **e o limite não barra** —
    quem decide é o coordenador, não a regra.

    ⚠️ **Quem não decide não vê botão.** O solicitante não decide o próprio pedido (exceção:
    o superadmin, e aí o registro marca). Em vez de mostrar "Aprovar" e deixar a rota recusar,
    o cartão diz de quem é a decisão. `devPodeDecidir` repete a regra do servidor.

    ⚠️ **Sem aprovar em lote, de propósito.** Dez avisos com o mesmo texto genérico é o oposto
    do que o motivo escrito serve — e é ele que faz o analista entender o que houve com a TR.

21. **⚠️ DOIS PAPÉIS NO MESMO LOGIN, e o menu obedece ao papel ATIVO** (14/08/2026).
    `analista` é o **padrão ao entrar** e esconde **14 itens**; `tecnico` mostra tudo e é o
    único que age pela conta de outro.

    ⚠️ **UMA REGRA SÓ:** o menu recebe o usuário com o **perfil efetivo** (`comoPapelAtivo`),
    e não uma condição a mais em cada item — um `pode:` que ficasse para trás seria
    justamente o que deixaria a Busca global à vista.

    ⚠️ **ESCONDER MENU É COSMÉTICO.** A guarda é do servidor, que lê `usuarios.papel_ativo`
    do banco. A URL antiga continua existindo.

    ⚠️ **A troca não grava o papel localmente:** manda o pedido e usa o que VOLTOU. Gravar
    local e a rota falhar deixaria o menu mostrando um papel que o servidor não reconhece.

22. **⚠️ AGIR PELA CONTA DE UM ANALISTA — o `fetch` CARIMBA, não bloqueia** (14/08/2026).
    Até 13/08 ele recusava todo não-GET. Agora troca **dois** campos:
    `analista_id = alvo().id` (o dono) e `executado_por = U.id` (quem clicou).

    ⚠️ **TROCAR SÓ UM É O DEFEITO:** as escritas mandavam `analista_id: U.id`, e liberar sem
    mexer nisso gravaria a baixa na produtividade de quem está dando suporte.

    ⚠️ **É num ponto só porque são 56 chamadas de escrita** neste arquivo. Carimbar botão a
    botão erra uma, e a que errar é a que grava no nome de outra pessoa.

    **Quatro travas FICAM** — estornar, devolver TR, solicitar devolução e decidir no C.I.
    Não são leitura: são decisões *sobre* o trabalho dele. Há teste que falha na quinta.

23. **⚠️ LARGURA DE COLUNA SÓ VALE COM `table-layout:fixed` — e ele NÃO PODE SER GLOBAL**
    (16/08/2026). Percentual em `<col>` ou em `<th>` é **sugestão**: no modo automático o
    navegador estica a coluna que o conteúdo exigir. Foi por isso que a TR do Estoque quebrava
    em duas linhas **mesmo com o `white-space:nowrap` escrito** — o `nowrap` proíbe quebrar o
    texto, mas quem decide a largura é o algoritmo da tabela, e ele reparte o que sobra.

    ⚠️ **E o `fixed` mora numa CLASSE (`.tbl-est`), nunca no seletor `table{}`.** Aquele
    seletor é global e vale para dezenas de tabelas deste arquivo — o **relatório CGE** depende
    da largura automática delas, e um `table-layout:fixed` global espremeria os quadros do
    documento oficial sem dar erro nenhum. Há teste que falha se ele vazar.

    ⚠️ **Com quebra ligada, a largura deixa de decidir se o texto aparece** e passa a decidir
    em **quantas linhas** ele aparece. Foi o que permitiu a entidade do Estoque ceder 10 pontos
    para o Status sem esconder nome nenhum: o maior do acervo (81 caracteres) sai em 2 linhas
    tanto em 1920 quanto em 1366. Quem escondia era o `nowrap` com reticências.

    ⚠️ **O `colspan` das linhas de serviço tem de acompanhar** o número de colunas — carregando,
    erro, "nenhum registro" e o separador de grupo. Um `colspan` defasado **não dá erro**: a
    linha apenas deixa de atravessar a tabela.

24. **⚠️ O `table-layout:fixed` TIRA DA COLUNA A LICENÇA DE ESTICAR — e conteúdo `nowrap` que
    não cabe VAZA POR CIMA DA VIZINHA** (17/08/2026). É a metade que faltava da armadilha 23,
    e apareceu como **regressão dos ajustes do dia anterior**: a etiqueta
    "⏳ Aguardando aprovação — Fulano" passou por cima da coluna SGPe MÃE e **tapou o link do
    processo** (visto na `2022TR001511`).

    Enquanto a tabela tinha largura automática, a coluna esticava para caber e ninguém via
    problema. Com o `fixed` ela passou a ter **14% fixos** — e texto `nowrap` que não cabe
    **não quebra e não é cortado: escapa da célula**. Medido: a etiqueta tem 32 caracteres no
    caso real e **41** no pior (`— você  ✕ cancelar`); a 9,5 px isso passa de 215 px, e os 14%
    dão ~196 px num conteúdo de 1400. **Nunca coube.**

    ⚠️ **A regra que fica: toda célula que hospeda conteúdo de tamanho variável precisa poder
    quebrar.** O `nowrap` saiu da **célula** e foi para o **código da TR**, que é curto e fixo;
    a etiqueta virou `display:block` e quebra dentro da própria coluna.

    ⚠️ **`display` e `white-space` foram para a classe `.est-reserva`, e NÃO ficaram no
    `style`: estilo inline vence classe, e foi exatamente um inline que causou o defeito.**
    Há dois testes que falham se voltarem para lá.

25. **⚠️ A FAIXA DE AVISOS SAI EM DUAS POSIÇÕES, MAS É MONTADA UMA VEZ SÓ** (17/08/2026).
    No **Dashboard** ela fica logo abaixo da Estrutura de Governança; nas **demais telas**,
    no rodapé. **É a mesma faixa rolando** — a primeira versão virou um bloco parado com o
    texto inteiro, e estava errada.

    ⚠️ **As duas posições saem da mesma função e da mesma string.** A única diferença permitida
    é a classe **`.faixa-dash`**, que acrescenta canto arredondado e respiro — porque ali a
    faixa mora *dentro* do conteúdo, não colada na borda da janela. **Há teste que compara as
    duas marcações caractere a caractere**, e outro que falha se a `.faixa-dash` ganhar
    `background`, `height` ou `animation` próprios. Uma segunda montagem divergiria da primeira
    no dia em que alguém mexesse numa e esquecesse a outra — é o defeito dos dois ramos do
    cartão da parcial (armadilha 19) tentando nascer de novo.

    ⚠️ **NO DASHBOARD O RODAPÉ FICA VAZIO, de propósito** — as duas ao mesmo tempo seriam o
    mesmo recado duas vezes na mesma tela.

    ⚠️ **A `irDash` chama `faixaPintar()` DE NOVO, depois do `innerHTML`.** O
    `ativarMenu('dash')` já chamou `faixaTela('inicial')` lá em cima, mas naquele instante o
    `#faixaBloco` **ainda não existia** — o BODY só é reescrito depois. Sem a segunda chamada a
    faixa **nasce vazia** no Dashboard e só aparece na recarga de 5 minutos. Há teste que
    compara a posição das duas chamadas no arquivo.

    ⚠️ **`teste_front_faixa.js` executa a `faixaPintar` de verdade** num DOM de mentira, em vez
    de casar texto do arquivo — e **para isso troca `let`/`const` de topo por `var`**:
    declaração léxica não vira propriedade do contexto do `vm`, e o teste não conseguiria nem
    ler nem escrever `_faixas`.

---

## As três regras do time de agentes (Richard, 13/08/2026)

O time mora no `sigpc-api` (`.claude/agents/`), mas o `coder` toca **este** repositório —
o `index.html`. As regras valem aqui igual:

1. **NENHUM agente escreve no banco.** `INSERT`/`UPDATE`/`DELETE`/`ALTER`/`CREATE` passam
   pelo Richard, com o comando na tela antes. `SELECT` e teste rodam livres.
2. **NENHUM agente decide regra de negócio.** Regra → para e pergunta. Decisão técnica →
   resolve e segue. *Se a resposta muda o que o sistema faz para o analista, é regra.*
3. **NENHUM agente publica.** `git commit` e `git push` são do Richard.

### O auditor, e o que é só dele (16/08/2026)

O `revisor` lê **código**; o **`auditor`** lê **DADO**. Ele confere a base contra as fontes
externas — estoque da CGE, planilhas dos grupos, gabaritos, backups anteriores — e entra
**sempre que uma correção tocar dado em massa**.

⚠️ **ELE NÃO ESCOLHE ENTRE DUAS FONTES.** Quando discordam, mostra as duas, mede o tamanho da
discordância e diz **por que uma seria mais confiável** — e para aí. Escolher por você é
decidir regra de negócio com outro nome.

⚠️ **Nem a planilha nem a base são gabarito por padrão.** O erro tem duas direções, e as duas
já foram medidas: a coluna "Número de PCs" do Grupo 2 está **inflada ~2x** em 44,7% das chaves
(G1 e G3 dão 96% no mesmo banco), e a numeração das parciais **na base** é que estava errada
na migração. Quem "consertar" um lado para bater com o outro sem medir destrói dado bom.

### ⚠️ DUPLA VERIFICAÇÃO — dois agentes, o mesmo número, cegos um ao outro (16/08/2026)

**DOIS agentes medem o MESMO número de forma INDEPENDENTE, sem ver o resultado um do outro.**

- Bateram → segue.
- **Divergiram → a divergência É o achado**, e vem para o Richard antes de qualquer coisa.

⚠️ **Nada de "um mede e o outro confere".** Quem confere já chega sabendo a resposta e tende a
concordar — vira carimbo, não medição. **Foi a medição independente que revelou, em 16/08, as
51 TRs que ninguém tinha visto**, e o `split` de processo que a análise original não mediu
porque só olhou a direção contrária.

⚠️ **E TODA GRAVAÇÃO EM MASSA CONFERE DE NOVO DEPOIS DE GRAVAR**, dentro da MESMA transação,
comparando com o previsto no dry-run — e faz `ROLLBACK` se não bater. Conferir só antes prova
o que se esperava, não o que aconteceu.

---


⚠️ **Neste repositório a regra 2 aparece disfarçada de layout.** "Que cor tem o aviso",
"aparece ou não quando não há dado", "o botão nasce aceso" — parecem escolha de tela e são
regra: mudam o que o analista vê e faz. O aviso de manutenção ser **vermelho** e os campos de
login **sumirem** foram decisão dele, não do CSS.

O fluxo completo está em `sigpc-api/TIME_AGENTES.md`.

---


### ⚠️ A NUMERAÇÃO DAS PARCIAIS — frente ABERTA em 16/08/2026

**Não corrija `parcial_num` sem ler o `SESSAO.md`**, que abre com o estado completo.

O diagnóstico mudou: **a migração carregou o número da CGE CORRETO** (8.998 PCs); quem
estragou foi a **recarga de 05/08**, que apagou 5.716 números e trocou 77 — porque
`recarga_exec.js:214-215` grava `nums[0]`, **o MENOR rótulo** da planilha. O padrão de 87,5%
"numerado por `parcela_seq`" que a auditoria mediu é resíduo da renumeração de 13/08
preenchendo as lacunas que a recarga abriu.

✅ **A PERGUNTA QUE TRAVAVA TUDO FOI RESPONDIDA EM 16/08/2026: SIM**, o SIGEF permite várias
parcelas no mesmo processo SGPe — **113 pares, 78 TRs, 465 PCs**, medidos no estoque oficial
da CGE por dois agentes cegos um ao outro. A armadilha 14 foi reescrita, e o `juntar` do
lápis saiu da tela. Ver `sigpc-api/SPLIT_PROCESSO_2026-08-16.md`.

---

## Padrões de trabalho

- Validar sempre com `node --check` antes de commit.
- No `index.html`, extrair os blocos `<script>` para um arquivo temporário e validar.
- Testar rotas contra o banco antes do push; reverter dados de teste em seguida.
- Nunca commitar CSVs de carga nem scripts com credencial.
- Comunicação com o Richard em português do Brasil.

### O aviso sonoro — `C:\Users\Richard\.claude\avisar.ps1`

Roda ao fim de **toda** resposta, inclusive diagnóstico e pergunta.

```powershell
powershell -File C:\Users\Richard\.claude\avisar.ps1                  # terminou
powershell -File C:\Users\Richard\.claude\avisar.ps1 -Modo problema   # espera decisão
```

⚠️ **SEM VOZ, desde 13/08/2026.** A frase falada saiu por decisão do Richard, e o bloco de
síntese (WinRT, SAPI5 e a queda para a Maria) foi **removido, não comentado** — código que
ninguém chama é código que ninguém revisa. O parâmetro `-Mensagem` deixou de existir.

| modo | som |
|---|---|
| `ok` | **toque de aeroporto**: 880 Hz · 659 Hz · 523 Hz (Lá–Mi–Dó), com 40 ms entre elas |
| `problema` | **6 graves** de 400 Hz — inalterados, e é o único som que interrompe de propósito |

⚠️ **kernel32 `Beep`, NUNCA `[console]::Beep`.** O do console some quando a saída está
redirecionada; o do kernel32 fala com o driver e toca em qualquer contexto — inclusive
chamado de dentro de outro processo, que é como este script sempre roda.

⚠️ **O arquivo é ASCII PURO, de propósito.** O PowerShell 5.1 lê `.ps1` como ANSI quando não
há BOM: um travessão ou um emoji num comentário vira lixo e **quebra o parser**. Não é erro de
exibição — o script inteiro deixa de rodar. Já aconteceu.

---

## Pendências

> Conferida contra o banco em **13/08/2026**. O que está `[x]` foi verificado, não presumido.
> A lista completa e o motivo de cada baixa estão no `CLAUDE.md` do `sigpc-api`.
>
> **▶ A PRÓXIMA SESSÃO COMEÇA NO `SESSAO.md`**, que abre com as cinco frentes deixadas em
> 14/08 — a primeira delas é a **auditoria das planilhas × base do sistema, só leitura
> primeiro**. ⚠️ Não "consertar" o banco para bater com a planilha: há caso medido em que a
> planilha é que estava errada (Grupo 2, coluna "Número de PCs" inflada ~2x).
>
> **Estado em 13/08:** 53 usuários · **51 conseguem entrar** · fila de aprovação **vazia** ·
> **2 sem CPF**, e por isso barrados: **49 Scheila** e **52 Eduardo** (este também inativo).

### ⚠️ 16–17/08/2026 — no ar, NÃO abertas no navegador

- [ ] **A tela Estoque de TRs inteira.** A lista do que olhar, ponto a ponto, está no
      `SESSAO.md` deste repo — TR e SGPe MÃE sem quebrar, entidade inteira em duas linhas,
      cabeçalho centralizado e células não, separador de grupo atravessando a tabela.
- [ ] **A etiqueta de reserva não invade o SGPe MÃE.** Só duas TRs a têm hoje:
      **`2022TR001511`** (Juliana) e **`2023TR000582`** (Rafael). Ela tem de ficar em linha
      própria abaixo da TR, **dentro** da coluna. É o teste visual da armadilha 24.
- [ ] **A faixa de avisos no Dashboard** — rolando, abaixo da Estrutura de Governança, e o
      **rodapé vazio**. Nas demais telas, no rodapé. ⚠️ Se ela **nascer vazia** no Dashboard, é
      a segunda chamada de `faixaPintar()` que se perdeu (armadilha 25).
- [ ] **As logos da governança em 48 px** e o botão **"SUA PRODUTIVIDADE"**.
- [ ] **🔴 O botão "Ver" nas TRs de 5 analistas** — ids 19, 22, 23, 40 e 51. **Hoje ele NÃO
      aparece**, e isso é o defeito do `isMeuTR` descrito no bloco do topo. Só se vê com o
      filtro fora de "Livre". **Espera decisão do Richard**; o conserto é no `sigpc-api`.

### ⚠️ Telas de 13/08/2026 — no ar, NÃO testadas em navegador
Nada disto foi clicado por uma pessoa. Em 12/08 o Richard achou três defeitos abrindo as
telas que os 15 conjuntos de teste não pegaram.

- [ ] **Assumir uma TR** — reescrito: uma chamada, não 83. A TR **inteira** tem de aparecer
      na Minha Planilha. No erro o modal **fica aberto** com o motivo. `assumirTR` /
      `confirmarAssumirTR`.
- [x] **Devolver a TR ao estoque** — ✅ TESTADO NA TELA em 13/08 e funcionou: duas devoluções
      reais no histórico (2020TR001601 e 2020TR001599, motivo "TESTE DO SISTEMA").
- [ ] **Devolver — o resto do fluxo:** botão no cabeçalho do cartão, **só superadmin**.
      Contagens, motivo obrigatório, "Outro" exigindo descrição, e **baixada não volta**.
      `abrirDevM` / `confDevM`.
- [ ] **Lápis do processo SGPe** — em 11 telas, via `procHtml`. Sem link o número sai em
      **âmbar**. Corrigir e ver o link nascer. `procEditar` / `procEdSalvar`.
- [ ] **Cabeçalho do cartão** — "assumida em" e a etiqueta **✨ NOVA** (7 dias). Nas TRs
      antigas não aparece nada, e é proposital. `planAssumidaEm` / `planTrNova`.
- [ ] **Indicador de online** — rótulo e seta. Fechar pelo botão, clicando fora e com **Esc**:
      a seta tem de voltar nos três. `onlineSeta` / `onlineFechar`.
- [ ] **Busca global** — a tela mais nova, nunca aberta. `irBuscaGlobal` / `bgCard` / `bgMontarDoc`.
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
- [x] ~~Código morto: `confDev` e modal `moDev`~~ — **RESSUSCITADOS em 13/08/2026.** São o
      modal e a função do pedido de devolução, e gravam em `POST /solicitacao_devolucao`.
      Ver a armadilha 20.

### Arquivos não versionados (intencional, conferir antes de apagar)
- [ ] `sigpc-gt`: `identidade_sigpc.css`, `logo_sc_base64.js` — **nenhum `<script>` ou
      `<link>` os carrega** (conferido em 11/08). Mesmo caso do `sgpe-link-standalone.js`,
      que foi removido; candidatos a exclusão, mas confirmar com o Richard antes de apagar.
- [ ] `sigpc-api`: scripts de carga (`carga_*.js`, `*_carga.csv`, `backfill_*.js`,
      `desfazer_assuncoes.js`, `importar_nls.js`) — nunca commitar (regra do projeto)
