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

const ctx = {
  console,
  // As dependências reais do bloco, no comportamento que importa aqui.
  planData: (d) => d ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
  escHtml: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  vcOff: () => '',
};
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const { pPasso, pDiasNoCi, pFaixaPasso, pBotaoCI } = ctx;

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
  conf(/Passo 1 de 2 · registre o parecer para poder baixar/.test(f1),
       'passo 1: "registre o parecer para poder baixar"');
  conf(/#FFF4D6/.test(f1), 'em ambar — e um aviso, nao um erro');

  const f2 = pFaixaPasso(BAIXADA);
  conf(/Passo 2 de 2/.test(f2), 'passo 2: "Passo 2 de 2"');
  conf(/baixada em 10\/08\/2026/.test(f2), 'com a data da baixa');
  conf(/parecer: Parecer Regular/.test(f2), 'e com o tipo do parecer');
  conf(/#E8F5E9/.test(f2), 'em verde — o trabalho do analista acabou aqui');

  const f3 = pFaixaPasso(NO_CI);
  conf(/No Controle Interno desde 30\/06\/2026/.test(f3), 'passo 3: "No Controle Interno desde <data>"');
  conf(/aguardando retorno há \d+ dias/.test(f3), 'e ha quantos dias espera');
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

console.log('\n═══ 3. O BOTAO DO C.I. — E ESTE O CONSERTO ═══');
{
  const b1 = pBotaoCI(SEM_PARECER, "'2020TR000612','1'");
  conf(/disabled/.test(b1), 'passo 1: o botao fica desabilitado — a trava do servidor e a mesma');
  // ⚠️ NUNCA CINZA MUDO. O motivo tem de estar AO LADO, em texto, nao so no title.
  conf(/exige parecer registrado/.test(b1), 'e o motivo vem AO LADO: "exige parecer registrado"');
  conf(b1.indexOf('exige parecer registrado') < b1.indexOf('<button'),
       'o texto vem ANTES do botao — le-se o motivo antes de tentar clicar');

  const b2 = pBotaoCI(BAIXADA, "'2020TR000612','1'");
  conf(!/disabled/.test(b2), 'passo 2: O BOTAO ACENDE — e o ramo que nao desenhava botao nenhum');
  conf(/onclick="pEnviarCI\('2020TR000612','1'\)"/.test(b2), 'e chama o pEnviarCI da parcela');
  conf(/opcional — a parcial já está baixada/.test(b2), 'com "opcional — a parcial ja esta baixada"');
  conf(/#1A4E8A/.test(b2), 'no azul do Controle Interno');

  conf(pBotaoCI(NO_CI, "'x','1'") === '', 'passo 3: o botao SOME — ja foi encaminhada');

  // O estorno acende sem dizer "ja esta baixada", porque nao esta.
  const b2e = pBotaoCI({ parecer_tipo: 'Parecer Regular', baixada: false, enviado_ci: false }, "'x','1'");
  conf(!/disabled/.test(b2e) && !/já está baixada/.test(b2e),
       'estorno: acende, mas nao afirma uma baixa que nao existe');
}

console.log('\n═══ 4. OS DOIS RAMOS DO CARTAO USAM OS MESMOS AUXILIARES ═══');
{
  // ⚠️ Era exatamente aqui que o defeito morava: o ramo verde nao chamava o botao. Se um dia
  // alguem duplicar a regra em vez de chamar o auxiliar, os dois ramos voltam a divergir.
  const iRP = html.indexOf('function renderPlan(rows) {');
  const bRP = html.slice(iRP, iRP + 9000);

  conf((bRP.match(/\$\{pFaixaPasso\(pa\)\}/g) || []).length === 2,
       'a faixa aparece nos DOIS ramos — baixada e em aberto');
  conf((bRP.match(/pBotaoCI\(pa, chave\)/g) || []).length === 2,
       'e o botao do C.I. tambem — era so no ramo em aberto');

  // A regra saiu de dentro do HTML: nao ha mais um `podeCI` solto no cartao.
  conf(!/const podeCI = /.test(html), 'o `podeCI` inline sumiu — a regra mora no pBotaoCI');
  conf((html.match(/🏛 Encaminhar ao CI<\/button>/g) || []).length === 1,
       'ha UM unico botao "Encaminhar ao CI" no arquivo');

  // Sem numero de parcial nao ha acao nenhuma — nem no ramo verde.
  conf(/\$\{semNum \? '' : pBotaoCI\(pa, chave\)\}/.test(bRP),
       'sem no de parcial, o botao nao aparece nem na baixada');

  // A data do envio precisa CHEGAR na parcial, senao a faixa 3 nasce sem "desde".
  conf(/dt_envio_ci:\s*pa\.pcs\.find\(x=>x\.dt_envio_ci\)\?\.dt_envio_ci \|\| null/.test(html),
       'a agregacao da parcial carrega o dt_envio_ci');
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
  // A decisao do Richard em 13/08: parecer previo CONTINUA exigido. A tela deixou de
  // esconder o botao; a regra de quem pode encaminhar segue igual, e no servidor.
  const iB = html.indexOf('function pBotaoCI(pa, chave) {');
  const bB = html.slice(iB, iB + 1200);
  conf(/const pode = !!pa\.parecer_tipo/.test(bB),
       'a tela continua exigindo parecer para acender o botao');
  conf(/Registre o parecer antes de encaminhar ao Controle Interno/.test(bB),
       'e o title continua dizendo isso');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
