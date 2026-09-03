// CAMINHO: sigpc-gt/teste_front_ci.js
//
// OS TRÊS ESTADOS DA PARCIAL — a faixa do passo e o botão "Encaminhar ao CI".
// Extrai as funções do próprio index.html. Sem navegador, sem rede, sem login.
//
// POR QUE ESTA SUÍTE EXISTE
// Até 13/08/2026 o botão do C.I. era INALCANÇÁVEL, e nenhum teste pegava: sem parecer ele
// ficava cinza; com parecer a parcial virava baixada e caía no ramo verde do cartão, que não
// desenhava botão nenhum. Medido no banco: 4.259 parciais no cinza, 2.181 sem botão, e ZERO
// encaminhamentos feitos por analista — as 13 PCs que estão no C.I. entraram pela migração de
// 05/08. O que faltava provar não era o botão: era que existe um estado em que ele ACENDE.
//
// USO: node teste_front_ci.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('function pPasso(pa) {');
const fim = html.indexOf('function renderPlan(rows) {');
if (ini < 0 || fim < 0 || fim < ini) {
  console.error('FALHA: nao achei o bloco dos tres estados da parcial no index.html.');
  process.exit(1);
}

// ⚠️ Dublê do `diaBr` do index.html, definido FORA do ctx para o `planDataTs` poder chamá-lo.
// Se os dois divergirem, o teste passa a provar outra coisa — por isso o corpo é idêntico.
const ctxDiaBr = (d) => {
  if (!d) return null;
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/T00:00:00(\.0+)?Z?$/.test(s)) return s.slice(0, 10);
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
};

const ctx = {
  console,
  // As dependências reais do bloco, no comportamento que importa aqui.
  // `date` puro — o valor JA E o dia civil.
  planData: (d) => d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
  // ⚠️ TIMESTAMP EM UTC — outra funcao, de proposito. As colunas data_baixa, dt_envio_ci e
  // dt_situacao guardam UTC, e o Postgres do Railway roda em Etc/UTC: depois das 21h de
  // Brasilia o instante ja e o dia seguinte. Um encaminhamento das 22h15 de 16/08 aparecia
  // como 17/08, e o contador dava "aguardando retorno ha -1 dias". Sao os dublês reais das
  // funcoes do index.html — se divergirem, o teste passa a provar outra coisa.
  // ⚠️ E a meia-noite cravada NAO e convertida: a carga historica gravou
  // data_baixa = 2026-06-30 (meia-noite), e converter daria 29/06 em 3.619 baixas.
  diaBr: ctxDiaBr,
  planDataTs: (d) => { const x = ctxDiaBr(d); return x ? new Date(x + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
  escHtml: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  vcOff: () => '',
};
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
// ⚠️ `pBotaoCI` saiu daqui em 18/08/2026: a funcao foi REMOVIDA do index.html quando o
// botao do C.I. virou item do menu "Acoes". Extrair uma funcao que nao existe mais devolve
// `undefined`, e o teste morria com "pBotaoCI is not a function" antes da primeira secao.
const { pPasso, pDiasNoCi, pFaixaPasso, planSemCi } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// As três parciais de referência.
const SEM_PARECER = { num: '1', qtd: 3, baixada: false, parecer_tipo: null, enviado_ci: false };
const BAIXADA     = { num: '1', qtd: 3, baixada: true, parecer_tipo: 'Parecer Regular',
                      data_baixa: '2026-08-10', enviado_ci: false };
const NO_CI       = { num: '1', qtd: 3, baixada: true, parecer_tipo: 'Parecer Regular',
                      data_baixa: '2026-06-30', enviado_ci: true, dt_envio_ci: '2026-06-30',
                      ci_situacao: 'na_fila' };

console.log('\n═══ 1. EM QUE PASSO A PARCIAL ESTA ═══');
{
  conf(pPasso(SEM_PARECER) === 1, 'sem parecer -> passo 1');
  conf(pPasso(BAIXADA) === 2, 'com parecer e baixada -> passo 2');
  conf(pPasso(NO_CI) === 3, 'ja encaminhada -> passo 3');

  // ⚠️ O passo 3 vence o 2: quem foi ao C.I. tem parecer E baixa, e continuaria caindo no 2.
  conf(pPasso({ parecer_tipo: 'Parecer Regular', baixada: true, enviado_ci: true }) === 3,
       'encaminhada vence baixada — o 3 e conferido primeiro');
  // O estorno limpa a baixa e deixa o parecer para tras: ainda e passo 2.
  conf(pPasso({ parecer_tipo: 'Parecer Regular', baixada: false, enviado_ci: false }) === 2,
       'estorno (parecer sem baixa) continua no passo 2');
}

console.log('\n═══ 2. A FAIXA DIZ O QUE FALTA ═══');
{
  const f1 = pFaixaPasso(SEM_PARECER);
  conf(/Passo 1 de 3 · registre o parecer para poder baixar/.test(f1),
       'passo 1: "registre o parecer para poder baixar"');
  conf(/#FFF4D6/.test(f1), 'em ambar — e um aviso, nao um erro');

  const f2 = pFaixaPasso(BAIXADA);
  // ⚠️ TRES passos, nao dois: a baixa nao e o fim, porque o C.I. e obrigatorio. A faixa verde
  // comemorava um fim que nao chegou — por isso ela agora diz o que FALTA.
  conf(/Passo 2 de 3/.test(f2), 'passo 2: "Passo 2 de 3"');
  conf(/falta encaminhar ao Controle Interno/.test(f2), 'e diz o que falta, no ambar do aviso');
  conf(/baixada em 10\/08\/2026/.test(f2), 'com a data da baixa');
  conf(/parecer: Parecer Regular/.test(f2), 'e com o tipo do parecer');
  conf(/#E8F5E9/.test(f2), 'em verde — o parecer esta feito');

  const f3 = pFaixaPasso(NO_CI);
  conf(/Passo 3 de 3/.test(f3), 'passo 3: "Passo 3 de 3"');
  // ⚠️ A DATA HERDADA NAO E DATA DE ENVIO — corrigido em 16/08/2026.
  //
  // O `NO_CI` tem `data_baixa` e `dt_envio_ci` IGUAIS (30/06), que e' exatamente o caso de
  // 1.684 PCs no banco: a marcacao em massa herdou a data da baixa, e a carga historica
  // baixou tudo em 30/06. A faixa dizia "No Controle Interno desde 30/06/2026" para PCs que
  // ninguem encaminhou naquele dia, e contava 47 dias de espera que nunca existiram.
  //
  // Estes dois testes afirmavam o comportamento ERRADO. Agora afirmam o certo.
  conf(/registrado em 30\/06\/2026/.test(f3), 'data herdada da baixa: diz "registrado em"');
  conf(!/desde 30\/06\/2026/.test(f3), 'e NAO diz "desde" — nao foi encaminhada naquele dia');
  conf(/data de registro no sistema/.test(f3), 'e explica na linha de baixo que a data e de registro');
  conf(!/aguardando retorno h/.test(f3), 'e NAO conta dias de espera sobre uma data que nao e do envio');

  // o caminho oposto: encaminhamento REAL, feito pela tela, com data propria
  const NO_CI_REAL = { ...NO_CI, dt_envio_ci: '2026-08-14' };
  const f3r = pFaixaPasso(NO_CI_REAL);
  conf(/No Controle Interno desde 14\/08\/2026/.test(f3r), 'data propria: volta a dizer "desde <data>"');
  conf(/aguardando retorno há \d+ dias?/.test(f3r), 'e aí SIM conta os dias de espera');
  conf(!/data de registro no sistema/.test(f3r), 'e sem a ressalva, que ali nao cabe');
  conf(/o retorno do CI não cancela a baixa/.test(f3),
       'com a linha cinza: o retorno do CI NAO cancela a baixa');

  // ⚠️ Sem data de envio a faixa nao pode escrever "desde —" nem "ha NaN dias".
  const f3s = pFaixaPasso({ enviado_ci: true, ci_situacao: 'na_fila' });
  conf(!/desde/.test(f3s) && !/NaN/.test(f3s), 'sem data de envio, o "desde" simplesmente sai');

  // Encerrado nao "aguarda" — dizer que espera seria mentira.
  const f3e = pFaixaPasso({ enviado_ci: true, ci_situacao: 'encerrado', dt_envio_ci: '2026-06-30' });
  conf(!/aguardando/.test(f3e) && /retorno recebido/.test(f3e),
       'ciclo encerrado nao diz "aguardando"');

  // O estorno nao pode escrever "baixada em —".
  const f2e = pFaixaPasso({ parecer_tipo: 'Parecer Regular', baixada: false, enviado_ci: false });
  conf(!/baixada em/.test(f2e), 'estorno: sem data de baixa, o trecho sai em vez de virar "—"');
}

console.log('\n═══ 3. O C.I. MUDOU DE LUGAR — DA LINHA PARA O MENU (18/08/2026) ═══');
{
  // ⚠️ A DECISAO MUDOU, e este bloco mudou junto. Ate 17/08 o botao do C.I. ficava SOLTO na
  // linha da parcial, e esta secao media o HTML dele (`pBotaoCI`). Em 18/08 o Richard levou
  // TODOS os botoes da linha para o menu "Acoes ▾": a linha ficou com um botao so.
  //
  // ⚠️ O QUE NAO MUDOU E O QUE ESTA SECAO PROTEGE: encaminhar ao C.I. e OBRIGATORIO, e
  // esconde-lo SEM SUBSTITUTO foi o defeito de 13/08 que deixou 2.181 parciais baixadas sem
  // caminho para o C.I. Agora ha substituto — o primeiro grupo do menu —, e ele entra EM
  // DESTAQUE. E isso que se mede aqui.
  conf(!/function pBotaoCI/.test(html),
       'pBotaoCI foi REMOVIDA, nao comentada — codigo que ninguem chama ninguem revisa');
  conf(/pBotaoCI` FOI REMOVIDA/.test(html),
       'e ficou o comentario dizendo para onde o botao foi');

  // ⚠️ A JANELA VAI ATE O GRUPO 2, e nao um numero fixo de caracteres. A fatia de 2600 que
  // estava aqui cortava o item do C.I. ao meio quando o grupo cresceu (a engenharia entrou
  // em 31/08), e o teste reprovava o destaque que estava escrito na tela.
  const iMenu = html.indexOf("linhas.push(acGrupo('Fluxo da análise'))");
  const bMenu = html.slice(iMenu, html.indexOf("linhas.push(acGrupo('Correções'))", iMenu));
  conf(iMenu > 0, 'o menu tem o grupo "Fluxo da analise"');
  // ⚠️ O SEGUNDO ARGUMENTO E A CHAVE DE `AC_ICONES`, e nao um emoji. Os itens do menu
  // ganharam icone de traco em 30/08 — "nada de emoji: eles mudam de forma e de tamanho a
  // cada sistema", diz o proprio comentario da tela.
  conf(/acItem\('Encaminhar ao C\.I\.', 'enviar'/.test(bMenu), 'e o C.I. e um item dele');
  conf(/pEnviarCiPc\(\$\{nm\}\)/.test(bMenu), 'que chama o pEnviarCI da parcela');
  const bCI = bMenu.slice(bMenu.indexOf("'Encaminhar ao C.I.'"));
  // O azul do Controle Interno mora em `AC_CORES.situacao` (#1B4F8E sobre #E8F0FB) — a cor
  // e escolhida pela NATUREZA da acao, e nao mais por um nome de cor solto.
  conf(/'situacao'/.test(bCI), 'com o icone AZUL do Controle Interno');
  // O ultimo argumento do acItem e o `destaque`, que poe o rotulo em negrito. Ele fecha em
  // `true))` — o primeiro parentese e do acItem, o segundo do linhas.push.
  conf(/\btrue\)\)/.test(bCI.slice(0, 420)),
       'e EM DESTAQUE — foi o que o Richard pediu ao tira-lo da linha');

  // ⚠️ A REGRA DE QUANDO ELE ACENDE SAIU DA TELA e foi para o servidor.
  conf(/d\.baixada === true && d\.enviado_ci !== true/.test(bMenu),
       'a condicao le o que o SERVIDOR disse (baixada e nao encaminhada)');
  conf(/Registre o parecer antes de encaminhar/.test(bMenu),
       'e o motivo da recusa continua escrito — agora sob o rotulo, nao ao lado');
  conf(/Já está no Controle Interno/.test(bMenu), 'no passo 3 o motivo e "ja esta no C.I."');
  conf(!/opcional/.test(bMenu), 'e sem a palavra "opcional" — o encaminhamento nao e escolha');
}

console.log('\n═══ 4. A LINHA DA PARCIAL FICOU COM UM BOTAO SO ═══');
{
  const iRP = html.indexOf('function renderPlan(rows) {');
  // ⚠️ A JANELA E A FUNCAO INTEIRA, e nao 9.000 caracteres. A `renderPlan` passou de
  // 19 mil com a engenharia, a pilula e o menu de acoes: a fatia curta enxergava so o ramo
  // de cima e reprovava o ramo verde, que estava escrito logo abaixo dela.
  const bRP = html.slice(iRP, html.indexOf('function planRenderPag() {', iRP));

  conf((bRP.match(/\$\{pFaixaPasso\(pa\)\}/g) || []).length === 2,
       'a faixa aparece nos DOIS ramos — baixada e em aberto');
  // ⚠️ O menu e que agora aparece nos dois ramos. Se um dia so um deles o desenhar, volta o
  // defeito de 13/08 por outro caminho: metade das parciais sem acao nenhuma.
  conf((bRP.match(/pBotaoAcoes\(pa, r\.tr\)/g) || []).length === 2,
       'e o menu de acoes tambem — nos DOIS ramos');
  conf(!/pBotaoCI\(pa, chave\)/.test(bRP), 'o botao solto do C.I. saiu da linha');
  conf(!/pAbrirSit\(\$\{chave\}\)/.test(bRP), 'o "Salvar situacao" solto saiu da linha');
  conf(!/pAbrirPar\(\$\{chave\}\)/.test(bRP), 'o "Registrar parecer" solto saiu da linha');
  conf((html.match(/🏛 Encaminhar ao CI<\/button>/g) || []).length === 0,
       'nao ha mais botao solto "Encaminhar ao CI" no arquivo');

  // A regra nunca voltou para dentro do HTML do cartao.
  conf(!/const podeCI = /.test(html), 'o `podeCI` inline continua fora do cartao');

  // ⚠️ O aviso de "sem no de parcial" FICA fora do menu: ele explica, antes do clique, por
  // que metade dos itens vai aparecer cinza.
  conf(/sem nº de parcial — não é possível registrar/.test(bRP),
       'sem no de parcial, o aviso continua na linha');

  // A data do envio precisa CHEGAR na parcial, senao a faixa 3 nasce sem "desde".
  conf(/dt_envio_ci:\s*pa\.pcs\.find\(x=>x\.dt_envio_ci\)\?\.dt_envio_ci \|\| null/.test(html),
       'a agregacao da parcial carrega o dt_envio_ci');
}

console.log('\n═══ 4b. A OUTRA TELA (detalhe da TR) SEGUE A MESMA REGRA ═══');
{
  // ⚠️ O detalhe da TR tinha a regra INVERTIDA: `!p.baixada && !p.enviado_ci` escondia o
  // botao justamente quando a PC era baixada — que e quando o C.I. passa a ser possivel. E
  // gravava por PATCH de UMA PC, montando baixada/data_baixa no navegador.
  const iAT = html.indexOf('async function abrirTR(tr) {');
  const bAT = html.slice(iAT, iAT + 4200);

  conf(!/const podeEnviarCI = !p\.baixada/.test(html), 'a condicao invertida sumiu');
  conf(/pPasso\(pa\) === 2/.test(bAT), 'e quem decide agora e o pPasso — a MESMA funcao do cartao');
  conf(/Encaminha a parcela inteira/.test(bAT), 'o title avisa que vai a parcela inteira');

  const iEA = html.indexOf('async function enviarAoCI(tr, parcialNum) {');
  const bEA = html.slice(iEA, iEA + 1600);
  conf(iEA > 0, 'enviarAoCI passou a receber (tr, parcial_num), nao um codigo_pc');
  conf(/\$\{API_URL\}\/parcela\/ci/.test(bEA), 'e grava pela MESMA rota transacional do cartao');
  conf(!/method: 'PATCH'/.test(bEA), 'o PATCH por PC saiu');
  // ⚠️ A tela nao decide mais a baixa — nem o valor, nem a data.
  conf(!/baixada|data_baixa|origem_baixa/.test(bEA), 'e a tela nao monta mais baixada/data_baixa');
  // ⚠️ MUDOU EM 14/08: encaminhar ao C.I. é TRABALHO do analista, e foi liberado no modo
  // "agir pela conta". O carimbo da autoria dupla é do `fetch`, num ponto só — não daqui.
  conf(!/if\(verComoAtivo\(\)\)/.test(bEA), 'encaminhar ao C.I. AGE no modo agir-pela-conta');
}

console.log('\n═══ 4c. A ETIQUETA "SEM C.I." NA LISTA ═══');
{
  // ⚠️ A cobranca que faltava. Encaminhar e obrigatorio e NADA exige: sem trava no servidor,
  // sem sino, sem relatorio. Sao 2.186 parciais baixadas que nunca foram ao C.I., e o unico
  // sinal era a faixa DENTRO do cartao — que so ve quem abre a TR, uma por uma.
  conf(planSemCi({ parciais: [BAIXADA, BAIXADA, NO_CI] }) === 2, 'conta so as que faltam ir');
  conf(planSemCi({ parciais: [NO_CI, NO_CI] }) === 0, 'TR toda encaminhada nao ganha etiqueta');
  conf(planSemCi({ parciais: [SEM_PARECER] }) === 0, 'sem parecer ainda nao e divida — e o passo 1');
  conf(planSemCi({ parciais: [] }) === 0, 'TR sem parcial nenhuma nao estoura');
  conf(planSemCi({}) === 0, 'nem TR sem a lista de parciais');

  // O estorno espera o C.I., mas nao e divida do mesmo tipo: a baixa foi desfeita.
  conf(planSemCi({ parciais: [{ parecer_tipo: 'Parecer Regular', baixada: false, enviado_ci: false }] }) === 0,
       'estorno nao entra na conta — a baixa dele foi desfeita');

  // ⚠️ A JANELA FECHA NA PROXIMA FUNCAO, e nao num numero. Era `iRP + 12000` e quebrou em
  // 24/08, quando os ancoras das parciais entraram no `renderPlan` e empurraram a etiqueta
  // para fora do corte: as duas checagens abaixo acusaram falha que era do TESTE, nao da tela.
  // Janela por tamanho mede o tamanho do arquivo; esta mede a funcao.
  const iRP = html.indexOf('function renderPlan(rows) {');
  const bRP = html.slice(iRP, html.indexOf('\nfunction planRenderPag(', iRP));
  conf(/const semCi\s+= planSemCi\(r\)/.test(bRP), 'o cartao calcula a etiqueta pela funcao unica');
  conf(/🏛 \$\{semCi\} sem C\.I\./.test(bRP), 'e desenha "N sem C.I."');
  // ⚠️ Principalmente na concluida: o cabecalho verde diz "✓ concluida" e a pessoa passa
  // adiante sem saber que a TR nao acabou.
  const iBad = bRP.indexOf('sem C.I.');
  const iCon = bRP.indexOf('✓ concluída');
  conf(iCon > 0 && iBad > iCon, 'a etiqueta fica AO LADO do "concluida", nao no lugar dela');
  conf(/title="\$\{semCi\} parcial\$\{semCi>1\?'is':''\} baixada/.test(bRP),
       'com o title dizendo o que fazer');
}

console.log('\n═══ 5. A CONFIRMACAO RESPONDE "VOU PERDER A BAIXA?" ═══');
{
  // ⚠️ A duvida nasce junto com o botao novo, e tem de ser respondida ANTES do clique — a
  // faixa que explica isso so aparece DEPOIS de encaminhar.
  const iE = html.indexOf('async function pEnviarCI(tr, num) {');
  const bE = html.slice(iE, iE + 1800);
  conf(/pa\.baixada[\s\S]{0,80}?A sua baixa NÃO é desfeita/.test(bE),
       'na parcial ja baixada, o modal diz que a baixa NAO e desfeita');
  conf(/retorno do C\.I\. também não a cancela/.test(bE), 'e que o retorno do C.I. tambem nao cancela');
  conf(/O parecer registrado é mantido\. A parcial passa a constar como encaminhada\./.test(bE),
       'na parcial ainda nao baixada, o texto antigo continua');
  conf(/if\(!pa\.parecer_tipo\)/.test(bE), 'e a conferencia de parecer continua antes de tudo');
}

console.log('\n═══ 6. A TRAVA DO SERVIDOR NAO FOI TOCADA ═══');
{
  // A decisao do Richard em 13/08: parecer previo CONTINUA exigido. Em 18/08 o botao mudou
  // de lugar (linha -> menu) e a REGRA mudou de dono: quem decide se ele acende passou a ser
  // `GET /parcela/acoes`, no servidor. A tela so desenha o que ele responde.
  //
  // ⚠️ E isso e mais forte que antes, nao mais fraco: enquanto a condicao morava aqui, ela
  // era uma SEGUNDA copia da regra do servidor, e duas copias divergem.
  const iMenu = html.indexOf("linhas.push(acGrupo('Fluxo da análise'))");
  const bMenu = html.slice(iMenu, iMenu + 2600);
  conf(/d\.baixada === true && d\.enviado_ci !== true/.test(bMenu),
       'a tela le a condicao do servidor, e nao recalcula parecer_tipo por conta propria');
  conf(!/const pode = !!pa\.parecer_tipo/.test(html),
       'a copia local da regra sumiu junto com o botao solto');
  conf(/Registre o parecer antes de encaminhar/.test(bMenu),
       'e o motivo continua escrito para quem nao pode clicar');
}

console.log('\n═══ O RETORNO DO C.I. CHEGA NA TELA (24/08/2026) ═══');
{
  // ⚠️ O DEFEITO: o analista encaminha, a parcela some da vista dele, e quando volta ele nao
  // fica sabendo. O servidor passou a notificar as DUAS decisoes com um link que carrega
  // destino; aqui se prova o outro lado — que a tela sabe ler esse destino.

  // ── o clique do sino
  const iSino = html.indexOf('async function sinoClicar');
  const sino = html.slice(iSino, html.indexOf('irAprovacoes()', iSino) + 40);
  conf(iSino > 0, 'sinoClicar foi localizada');
  conf(/alvoPlan\[0\] === '#planilha'/.test(sino),
       'o link do sino e lido por PREFIXO, e nao por igualdade');
  // ⚠️ A igualdade quebraria as notificacoes JA GRAVADAS, que tem `link = '#planilha'` puro:
  // o clique seria aceito e nao levaria a lugar nenhum — a armadilha 15.
  conf(!/link === '#planilha'\)\s+irPlanilha\(\)/.test(sino), 'a comparacao por igualdade saiu');
  conf(/irPlanilha\(alvoPlan\[1\] \|\| null, alvoPlan\[2\] \|\| null\)/.test(sino),
       'e TR e parcela viajam para a Minha Planilha');

  // ── a planilha aceita destino sem quebrar quem chama sem nada
  conf(/async function irPlanilha\(trAlvo, parcialAlvo, chipAlvo\)/.test(html),
       'irPlanilha aceita os tres alvos');
  conf(/function planIrAoAlvo\(\)/.test(html), 'planIrAoAlvo existe');
  // ⚠️ DEPOIS de planAplicar, nunca dentro de irPlanilha: `buscarPlan` e assincrona, e mirar
  // antes dos dados chegarem rola sobre uma lista que ainda nao existe.
  const iBusca = html.indexOf('window._planDadosCache = trs');
  conf(/planAplicar\(\)[\s\S]{0,30}planIrAoAlvo\(\)/.test(html.slice(iBusca, iBusca + 120)),
       'e roda DEPOIS de planAplicar, com os dados ja no cache');
  conf(/_planAlvo = null/.test(html), 'o alvo e consumido uma vez e apagado');

  // ── o ancora existe nos DOIS ramos da parcela
  conf(/function planAncora\(tr, parcial\)/.test(html), 'ha uma funcao unica para o id do ancora');
  const ancoras = (html.match(/id="\$\{planAncora\(r\.tr, pa\.num\)\}"/g) || []).length;
  // ⚠️ A parcela que volta do C.I. esta SEMPRE baixada — a baixa nao e cancelada em nenhum
  // caminho do ciclo. Ela cai no ramo verde; o ancora so no outro ramo nao serviria de nada.
  conf(ancoras === 2, 'o ancora da parcela esta nos dois ramos, baixada e em aberto', String(ancoras));
  conf(/id="\$\{planAncora\(r\.tr, null\)\}"/.test(html), 'e a TR tambem tem ancora, como reserva');
}

console.log('\n═══ O CARD "C.I. DEVOLVEU" LEVA AO FILTRO ═══');
{
  // ⚠️ O card ja contava certo; o que faltava era o destino. Ele abria a Minha Planilha
  // inteira — um numero que leva a uma lista onde ele nao aparece e, para quem clica,
  // indistinguivel de um filtro que nao fez nada.
  const iCard = html.indexOf("chave: 'ci_com_analista'");
  const card = html.slice(iCard, iCard + 400);
  conf(iCard > 0, 'o card ci_com_analista existe no Dashboard');
  conf(/vai: "irPlanilha\(null,null,'ressalva'\)"/.test(card), 'e agora abre a planilha JA FILTRADA');

  const iChip = html.indexOf("id:'ressalva'");
  const chip = html.slice(iChip, iChip + 200);
  conf(iChip > 0, 'o chip ressalva existe');
  // ⚠️ CARD E CHIP LEEM O MESMO CAMPO. O card conta `ci_situacao = 'com_analista'` no
  // servidor; o chip testa o mesmo valor na tela. Se um olhasse `enviado_ci` — que responde
  // outra pergunta — os dois numeros divergiriam sem erro nenhum.
  conf(/pa\.ci_situacao === 'com_analista'/.test(chip),
       'e testa ci_situacao = com_analista, o mesmo que a rota do painel conta');
  conf(!/enviado_ci/.test(chip), 'e NAO usa enviado_ci, que responde outra pergunta');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
