// CAMINHO: sigpc-gt/teste_front_vercomo.js
//
// Testes do MODO "VER COMO" e da LISTA DE ONLINE, extraindo as funções do index.html.
// Sem navegador, sem rede, sem login.
//
// ⚠️ O QUE ESTES TESTES PROTEGEM
//
// **Nada pode ser gravado no nome da pessoa que está sendo vista.** Se isso falhar, o
// relatório da CGE deixa de provar quem fez cada baixa — que é a razão de o sistema existir.
//
// `U.id` alimenta leitura e escrita com a mesma sintaxe, em 59 caminhos de escrita. Por isso
// a garantia NÃO é o botão cinza: é a trava no `fetch`, por onde as 59 passam. Estes testes
// exercitam a trava de verdade — chamam `window.fetch` com POST e exigem que ele recuse.
//
// USO: node teste_front_vercomo.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// O recorte vai do inicio do modo ate a secao seguinte — `vcOff` e `verComoFaixa` moram
// depois de `irVerComo`, e ficariam de fora de um recorte mais curto.
const ini = html.indexOf('let _verComo = null');
const fim = html.indexOf('//  MODO PREPARAÇÃO', ini);
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco do modo "ver como".');
  process.exit(1);
}

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// ── contexto ────────────────────────────────────────────────────────────────
const chamadasReais = [];
const ctx = {
  console,
  API_URL: 'http://api.teste',
  toast: () => {},
  Response,
  Promise,
  window: {},
};
ctx.window.fetch = (url, opts) => { chamadasReais.push({ url, opts }); return Promise.resolve('PASSOU'); };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim) + `
function _setVerComo(v){ _verComo = v }
function _getVerComo(){ return _verComo }
function _fetch(u,o){ return window.fetch(u,o) }
`, ctx);
vm.runInContext('var U = { id: 4, nome: "Richard", perfil: "superadmin", grupo: "3" }', ctx);

const { alvo, verComoAtivo, verComoPodeVer, vcOff, _setVerComo, _getVerComo, _fetch } = ctx;
const ANA = { id: 22, nome: 'Ana Claudia', perfil: 'analista', grupo: '2' };

(async () => {

console.log('\n═══ 1. FORA DO MODO, NADA MUDA ═══');
{
  _setVerComo(null);
  conf(verComoAtivo() === false, 'o modo comeca desligado');
  conf(alvo().id === 4, 'alvo() e o proprio usuario');
  conf(vcOff() === '', 'nenhum botao e desabilitado');
  chamadasReais.length = 0;
  const r = await _fetch('http://api.teste/prestacoes_contas/baixar', { method:'POST', body:'{}' });
  conf(r === 'PASSOU', 'um POST passa normalmente');
  conf(chamadasReais.length === 1, 'e chegou ao fetch de verdade');
}

console.log('\n═══ 2. COM O MODO LIGADO, NENHUMA ESCRITA SAI ═══');
{
  _setVerComo(ANA);
  conf(verComoAtivo() === true, 'o modo esta ligado');
  conf(alvo().id === 22, 'alvo() passa a ser a pessoa vista');
  conf(_getVerComo().id === 22 && ctx.U.id === 4, 'e U NAO foi trocado — continua sendo voce');

  for (const metodo of ['POST', 'PATCH', 'DELETE']) {
    chamadasReais.length = 0;
    const r = await _fetch('http://api.teste/prestacoes_contas/baixar', { method: metodo, body:'{}' });
    const corpo = await r.json();
    conf(r.status === 403, `${metodo} e RECUSADO com 403`, `veio ${r.status}`);
    conf(corpo.error && corpo.error.ver_como === true, `${metodo} devolve a marca ver_como`);
    conf(chamadasReais.length === 0, `${metodo} NAO chegou ao fetch de verdade`);
  }
}

console.log('\n═══ 3. LEITURA CONTINUA PASSANDO ═══');
{
  _setVerComo(ANA);
  chamadasReais.length = 0;
  const r = await _fetch('http://api.teste/prestacoes_contas?analista_id=22');
  conf(r === 'PASSOU', 'GET sem opts passa');
  const r2 = await _fetch('http://api.teste/prestacoes_contas', { method:'GET' });
  conf(r2 === 'PASSOU', 'GET explicito passa');
  conf(chamadasReais.length === 2, 'as duas leituras chegaram ao fetch');
}

console.log('\n═══ 4. O QUE NAO E DA API NAO E BLOQUEADO ═══');
{
  // A trava e sobre a API, nao sobre o mundo. Bloquear tudo quebraria qualquer outra coisa.
  _setVerComo(ANA);
  chamadasReais.length = 0;
  const r = await _fetch('https://outra.coisa/qualquer', { method:'POST' });
  conf(r === 'PASSOU', 'POST para fora da API passa');
}

console.log('\n═══ 5. SAIR DO SISTEMA E A UNICA ESCRITA PERMITIDA ═══');
{
  // Travar o logout deixaria a pessoa presa na lista de online — o oposto do que se quer.
  _setVerComo(ANA);
  chamadasReais.length = 0;
  const r = await _fetch('http://api.teste/usuarios/logout', { method:'POST', body:'{"id":4}' });
  conf(r === 'PASSOU', 'POST /usuarios/logout passa mesmo no modo');
  conf(chamadasReais.length === 1, 'e chegou ao fetch');
}

console.log('\n═══ 6. QUEM PODE VER QUEM ═══');
{
  vm.runInContext('U = { id: 4, nome:"Richard", perfil:"superadmin", grupo:"3" }', ctx);
  conf(verComoPodeVer(ANA) === true, 'superadmin ve analista de qualquer grupo');
  conf(verComoPodeVer({ id:5, perfil:'coordenador', grupo:'1' }) === true, 'superadmin ve coordenador');
  conf(verComoPodeVer({ id:4, perfil:'superadmin', grupo:'3' }) === false, 'ninguem se ve a si mesmo');
  conf(verComoPodeVer({ id:62, perfil:'controle_interno' }) === false, 'C.I. nao entra na lista');
  conf(verComoPodeVer(null) === false, 'nulo nao quebra');

  // ⚠️ SO SUPERADMIN (correcao do Richard, 12/08). O coordenador tinha acesso no primeiro
  // desenho e foi RETIRADO: ver o sistema pelos olhos de outra pessoa e ferramenta de
  // suporte do dono do sistema, nao de coordenacao.
  vm.runInContext('U = { id: 5, nome:"Nayara", perfil:"coordenador", grupo:"1" }', ctx);
  conf(verComoPodeVer({ id:7, perfil:'analista', grupo:'1' }) === false,
       'COORDENADOR NAO VE NINGUEM, nem do proprio grupo');
  conf(verComoPodeVer(ANA) === false, 'nem de outro grupo');

  vm.runInContext('U = { id: 22, nome:"Ana", perfil:"analista", grupo:"2" }', ctx);
  conf(verComoPodeVer({ id:7, perfil:'analista', grupo:'2' }) === false, 'ANALISTA NAO VE NINGUEM');
}

console.log('\n═══ 7. O BOTAO CINZA (camada de UX) ═══');
{
  _setVerComo(ANA);
  const s = vcOff();
  conf(/disabled/.test(s), 'vcOff devolve disabled no modo');
  conf(/Desabilitado no modo Ver como/.test(s), 'e o motivo no title');
  _setVerComo(null);
  conf(vcOff() === '', 'e nada fora do modo');
}

console.log('\n═══ 8. TRAVAS NO index.html ═══');
{
  // As leituras das quatro telas apontam para alvo(); as escritas continuam em U.
  conf(/new URLSearchParams\(\{ analista_id: alvo\(\)\.id, limit: 9999/.test(html),
       'Minha Planilha le por alvo()');
  conf(/solicitacao_vaga\?analista_id=\$\{alvo\(\)\.id\}/.test(html), 'Meus pedidos le por alvo()');
  conf(/alertaParams = new URLSearchParams\(\{ analista_id: alvo\(\)\.id \}\)/.test(html),
       'alertas de prazo leem por alvo()');
  conf(/if\(verComoAtivo\(\)\) p\.set\('analista_id', alvo\(\)\.id\)/.test(html),
       'o Dashboard passa a contar as PCs DELA no modo');
  conf(/if\(verComoAtivo\(\)\) return d\.u\.id === alvo\(\)\.id/.test(html),
       'a Produtividade mostra o cartao dela');

  // ⚠️ A escrita da baixa NAO pode ter sido trocada por alvo().
  conf(/analista_id: U\.id, registrado_por: U\.nome/.test(html),
       'a BAIXA continua gravando U.id e U.nome — nunca o alvo');
  conf(!/registrado_por: alvo\(\)/.test(html), 'nenhuma escrita usa alvo() como autor');

  // A trava, e a excecao do logout.
  conf(/window\.fetch = function\(url, opts\)/.test(html), 'o fetch e envolvido uma vez');
  conf(/if\(_verComo && paraApi && metodo !== 'GET'\)/.test(html), 'e so age no modo, na API, fora do GET');
  conf(/usuarios\/logout/.test(html.slice(html.indexOf('window.fetch = function'), html.indexOf('window.fetch = function') + 900)),
       'com a excecao do logout escrita ao lado');

  // Sair do sistema tambem sai do modo.
  const bSair = html.slice(html.indexOf('function sair()'), html.indexOf('function sair()') + 1200);
  conf(/verComoSair\(true\)/.test(bSair), 'sair() desliga o modo');
}

console.log('\n═══ 8b. A TELA DEIXA CLARO QUE NADA E ACIONAVEL ═══');
{
  // ⚠️ A trava do fetch segura a GRAVACAO. Isto aqui e outra coisa: a tela nao pode dar a
  // impressao de que da para agir. Modal que abre, campo que aceita texto e botao que
  // aceita o clique dizem "voce pode" — e so na hora de salvar e que nao.
  const acoes = [
    ['pAbrirSit',      'mudar a situação'],
    ['pAbrirPar',      'registrar parecer'],
    ['pEstornar',      'estornar'],
    ['pRespondeu',     'registrar a resposta'],
    ['pEnviarCI',      'encaminhar ao C.I.'],
    ['pCiResponder',   'responder ao C.I.'],
    ['salvarAnotacao', 'salvar anotação'],
    ['ciDecidir',      'decidir no C.I.'],
    ['assumirTR',      'assumir TR'],
  ];
  acoes.forEach(([fn, rot]) => {
    const i = html.indexOf(`function ${fn}(`);
    const bloco = html.slice(i, i + 500);
    conf(i > 0 && /if\(verComoAtivo\(\)\)/.test(bloco),
         `${fn} recusa na ORIGEM (${rot})`);
  });

  // O formulario de anotacao nem e desenhado no modo — so a lista do que ja existe.
  // O ramo do modo vem ANTES do formulario: `${verComoAtivo() ? <aviso> : <textarea>}`.
  const iAnot = html.indexOf('<label>Anotações</label>');
  const bAnot = html.slice(iAnot, iAnot + 1600);
  conf(/\$\{verComoAtivo\(\) \?/.test(bAnot) && /Modo leitura — escrever anotação/.test(bAnot),
       'o formulario de anotacao NAO e desenhado no modo leitura');
  conf(bAnot.indexOf('Modo leitura') < bAnot.indexOf('<textarea id="anotTexto"'),
       'o aviso vem no lugar do textarea, nao ao lado dele');
  conf(/As anotações já[\s\S]{0,40}?gravadas aparecem abaixo/.test(html),
       'e diz que as anotacoes existentes continuam a vista');

  // O botao Assumir nasce desabilitado e e desabilitado tambem no erro.
  conf(/function assBotao\(pode, motivo\)/.test(html), 'ha uma funcao unica para o botao Assumir');
  conf(/assBotao\(false, 'Carregando as PCs livres desta TR\.\.\.'\)/.test(html),
       'ele NASCE desabilitado, antes da busca');
  const iAss = html.indexOf('async function assumirTR(');
  const bAss = html.slice(iAss, iAss + 3000);
  conf(/catch\(e\) \{[\s\S]{0,400}?assBotao\(false, e\.message\)/.test(bAss),
       'e e desabilitado NO ERRO — era este o caminho que o deixava clicavel');
  conf(/b\.title = pode \? '' : \(motivo \|\| ''\)/.test(html), 'com o motivo no title');
}

console.log('\n═══ 8c. O MENU ENCOLHE NO MODO ═══');
{
  const ctxM = { console };
  vm.createContext(ctxM);
  const iM = html.indexOf('const SB_BLOCOS = ['), fM = html.indexOf('function renderSB()');
  vm.runInContext(html.slice(iM, fM) + `
function _m(u, vc){ return sbMontar(u, vc) }`, ctxM);

  const sup = { id:4, perfil:'superadmin', grupo:'3' };
  const normal = ctxM._m(sup, false).map(b => b.id);
  const modo   = ctxM._m(sup, true);
  conf(normal.length === 3, 'fora do modo, o superadmin ve os tres blocos');
  conf(modo.length === 1 && modo[0].id === 'analista',
       'no modo, so o bloco do analista', JSON.stringify(modo.map(b=>b.id)));

  const ids = modo[0].itens.map(i => i.id);
  // ⚠️ Estoque e Estornar existem para AGIR, e nao mostram dado da pessoa. Deixa-los no
  // menu seria oferecer um caminho que termina em botao cinza.
  conf(!ids.includes('est'), 'ESTOQUE fica de fora — assumir TR e acao, nao leitura');
  conf(!ids.includes('estornar'), 'ESTORNAR fica de fora pelo mesmo motivo');
  conf(ids.includes('plan'), 'Minha Planilha fica');
  conf(ids.includes('meuspedidos'), 'Meus pedidos fica');
  conf(ids.includes('prod'), 'Produtividade fica');
  conf(ids.includes('dash'), 'Dashboard fica');

  // E o item "Ver como" mora no bloco do superadmin.
  const vc = ctxM._m(sup, false).find(b => b.id === 'superadmin').itens.find(i => i.id === 'vercomo');
  conf(!!vc, 'o item "Ver como" esta no bloco SUPERADMIN');
  conf(!ctxM._m({ id:5, perfil:'coordenador', grupo:'1' }, false)
        .some(b => b.itens.some(i => i.id === 'vercomo')),
       'e o coordenador NAO ve o item');
}

console.log('\n═══ 9. LISTA DE ONLINE ═══');
{
  conf(/Usuários online/.test(html), 'a lista tem titulo');
  conf(/function onlineAvatar\(u\)/.test(html), 'ha avatar por pessoa');
  conf(/u\.foto_base64[\s\S]{0,120}?border-radius:50%/.test(html), 'foto redonda quando existir');
  conf(/onlineAvatar[\s\S]{0,700}?slice\(0,2\)\.map\(n=>n\[0\]\)/.test(html), 'iniciais quando nao houver foto');
  // A rota nova: e ela que sabe de sessao encerrada.
  conf(/API_URL\}\/usuarios\/online\?/.test(html), 'busca em /usuarios/online');
  // A busca antiga nao pode voltar como CODIGO. Ela sobrevive num comentario, que conta por
  // que a rota nova existe — e comentario nao chama rota. Por isso as linhas de comentario
  // saem antes da conferencia.
  const semComentario = html.split(/\r?\n/).filter(l => !/^\s*(\/\/|--)/.test(l)).join('\n');
  conf(!/_gte_ultimo_acesso/.test(semComentario),
       'e a busca antiga, que ignorava o logout, saiu do codigo');
  // Sair avisa o servidor ANTES de limpar U.
  const iSair = html.indexOf('function sair()');
  const bloco = html.slice(iSair, iSair + 900);
  conf(bloco.indexOf('usuarios/logout') < bloco.indexOf('U = null'),
       'sair() avisa o servidor ANTES de limpar U');
  conf(/\.catch\(\(\) => \{\}\)/.test(bloco), 'e nao trava se a rede falhar');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
})();
