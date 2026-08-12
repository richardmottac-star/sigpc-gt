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

  vm.runInContext('U = { id: 5, nome:"Nayara", perfil:"coordenador", grupo:"1" }', ctx);
  conf(verComoPodeVer({ id:7, perfil:'analista', grupo:'1' }) === true, 'coordenador ve analista DO SEU grupo');
  // ⚠️ A regra que importa: coordenador nao alcanca outro grupo.
  conf(verComoPodeVer(ANA) === false, 'coordenador NAO ve analista de outro grupo (Ana e G2)');
  conf(verComoPodeVer({ id:6, perfil:'coordenador', grupo:'2' }) === false, 'coordenador nao ve outro coordenador');

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
