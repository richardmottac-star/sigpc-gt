# CLASSIFICAÇÃO DOS MODAIS — 31/08/2026

Levantamento completo do `index.html` antes de transformar os modais de consulta em janelas
flutuantes. **31 modais**: 25 declarados no HTML estático + 6 criados por script.

---

## ▶ GRUPO A — JANELA FLUTUANTE (consulta e trabalho)

Sem fundo escuro, arrasta pelo cabeçalho, minimiza/maximiza/fecha, posição e tamanho salvos.

| # | modal | onde | o que é | escreve? |
|---|---|---|---|---|
| 1 | `sgpeConsultaAbrir` | 5906, dinâmico | **Consultar processo no SGPe (F4)** — citado por você | não |
| 2 | `ciBuscaAbrir` | 16558, dinâmico | **Localizar processo no C.I. (F2)** — citado por você | não |
| 3 | `moNL` | 1264 | **quatro telas na mesma caixa** — ver abaixo | não |
| 4 | `moTR` | 1272 | **Detalhe da TR** — o maior (1100px), a tela de trabalho | não* |
| 5 | `moNovImg` | 1518 | a imagem da novidade ampliada — só visualização | não |

### ⚠️ O `moNL` É UMA CAIXA SÓ COM QUATRO DONOS

Ele é reaproveitado por quatro funções, que só trocam o título e o corpo — e **duas delas
são as que você citou**:

| chamador | linha | título que aparece |
|---|---|---|
| `pVerParecer` | 14684 | `Parcial N — TR` (**o "ver parecer"**) |
| `pHistoricoPc` | 13636 | `Histórico — Parcial N TR` (**o "histórico da parcial"**) |
| NLs — Anexo IV | 1266 | `NLs — Anexo IV` |
| `verProdDetalhe` | 17542 | `Produtividade — nome` |

**Consequência:** flutuar o `moNL` flutua os quatro de uma vez — não há como separar sem
partir a caixa em quatro. Os quatro são leitura pura, então a classificação bate; mas
**"posição e tamanho salvos por janela" vai salvar UM estado para os quatro**, porque é uma
janela só. Se você quiser estado por chamador, isso é uma chave a mais e eu preciso saber.

### ⚠️ (*) O `moTR` TEM BOTÕES DE AÇÃO DENTRO

`Registrar parecer` e `Enviar ao CI` moram no corpo dele (4368, 4372) e abrem os modais do
Grupo B. Isso continua funcionando: a confirmação sobe por cima com o fundo escuro dela, e a
janela flutuante fica atrás. É o comportamento esperado — só estou registrando que a janela
flutuante **não** é só leitura.

---

## ▶ GRUPO B — CONTINUA MODAL, TRAVANDO A TELA (confirmação e ação)

| modal | linha | o que faz |
|---|---|---|
| `moParecer` | 1280 | 📝 Registrar Parecer — **citado por você** |
| `moPPar` | 1336 | Registrar parecer (o da parcela) |
| `moPSit` | 1303 | Situação da Parcial — grava situação |
| `moCorrigir` | 1476 | ✎ Corrigir situação da parcial |
| `moAss` | 1098 | ✅ Assumir TR |
| `moDev` | 1117 | ↩ Solicitar devolução da TR |
| `moDevM` | 1192 | ↩ Devolver TR ao Estoque (superadmin) |
| `moPuxarCi` | 1568 | ↩ Puxar de volta do C.I. — derruba baixa |
| `moDesfazerPx` | 1599 | ↺ Desfazer a puxada do C.I. |
| `ciReabrirAbrir` | 16678, dinâmico | Reabrir no Controle Interno |
| `moPcNova` | 1628 | ➕ Cadastrar PC nesta TR |
| `moSolCor` | 1682 | 📨 Solicitar correção ao coordenador |
| `moRepo` | 1361 | ➕ Adicionar ao Repositório |
| `moRepoCat` | 1386 | 🏷 Nova categoria |
| `moAfast` | 1222 | Novo Afastamento |
| `moNovForm` | 1525 | Publicar novidade |
| `faixaEditar` | 7557, dinâmico | Novo/Editar aviso da faixa |
| `moFormRecado` | 8130, dinâmico | 📢 Novo recado |
| `moPrimAcesso` | 1407 | 🔐 Primeiro Acesso — cadastro, antes de entrar |
| `moAdmUser` | 14995 | Novo Usuário (admin) |
| `moAdmSenha` | 15078 | Redefinir Senha (admin) |
| `moAdmAprovar` | 15099 | Aprovar Cadastro (admin) |
| `moDialogo` | 7694, dinâmico | **todos os "tem certeza?"** — `confirmar()` e `pedirTexto()` |

⚠️ O `moDialogo` é a fábrica genérica: `confirmar()` (7783) e `pedirTexto()` (7788) saem dele.
É ele que atende os "tem certeza?" que você citou, e ele **não muda**.

---

## ▶ DUVIDOSOS — decisão sua

### 1. `moSigef` — "Conferência com o SIGEF" (1159)

**É consulta E é ação, na mesma caixa.** Mostra o que o SIGEF registrou para a prestação e o
histórico — leitura — mas tem `✓ Declarar`, que chama `POST /parcela/sigef_declaracao`.

⚠️ **E essa declaração NÃO SE DESMARCA** — o SQL só sabe apendar (CLAUDE.md, 27/08). É uma
escrita irreversível dentro de uma caixa que, no resto, é de consulta.

### 2. `moProcEd` — o lápis do processo SGPe (1067)

Aparece em 11 telas, quase sempre no meio de uma consulta, e é trabalho miúdo. Mas grava
(`PATCH .../processo`) e busca o link. Não é um "tem certeza?", e também não é leitura.

### 3. `moNovAviso` — o aviso "Novidades" (1502)

É o cartão roxo que aparece **sozinho ao entrar**, com "Depois" e "Ver novidades". Ninguém o
abre de propósito. Flutuando sem fundo escuro ele deixa de interromper — que pode ser bom
(não atrapalha quem entrou para trabalhar) ou ruim (é um aviso, e ninguém veria).

---

## O que NÃO é modal e por isso ficou de fora

- **Busca global** (`irBuscaGlobal`, 6411) — é uma **tela** (`#BODY`), não um modal. O F2 do
  sistema abre a busca do **C.I.**, e é a única tecla F2 no arquivo (16649).
- **Ver como** (`verComoEntrar`, 2543) — é uma faixa e uma troca de alvo, não um modal.
