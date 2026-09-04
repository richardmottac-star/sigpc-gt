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
// ⚠️ `perfilEfetivo` mora no bloco do MENU, fora deste recorte — mas `verComoPodeVer` a
// usa desde 14/08: agir pela conta de outro e do papel TECNICO. Sem ela aqui, o teste
// quebraria por falta de funcao, e nao por defeito.
vm.runInContext(`
  var PAPEL_PADRAO = 'analista'
  function perfilEfetivo(u) {
    if(!u) return null
    if(u.perfil !== 'superadmin') return u.perfil
    return (u.papelAtivo || PAPEL_PADRAO) === 'tecnico' ? u.perfil : PAPEL_PADRAO
  }
`, ctx);
vm.runInContext('var U = { id: 4, nome: "Richard", perfil: "superadmin", grupo: "3", papelAtivo: "tecnico" }', ctx);

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

console.log('\n═══ 2. COM O MODO LIGADO, A ESCRITA SAI CARIMBADA ═══');
{
  // ⚠️ MUDOU EM 14/08/2026. Ate 13/08 este `fetch` BLOQUEAVA toda escrita, e a secao provava
  // isso. O Richard precisa AGIR pela conta do analista para dar suporte — sem agir nao se da
  // suporte nenhum. O bloqueio virou CARIMBO, e o que se prova agora e a AUTORIA DUPLA.
  _setVerComo(ANA);
  conf(verComoAtivo() === true, 'o modo esta ligado');
  conf(alvo().id === 22, 'alvo() passa a ser a pessoa vista');
  conf(_getVerComo().id === 22 && ctx.U.id === 4, 'e U NAO foi trocado — continua sendo voce');

  for (const metodo of ['POST', 'PATCH', 'DELETE']) {
    chamadasReais.length = 0;
    const r = await _fetch('http://api.teste/parcela/parecer',
      { method: metodo, body: JSON.stringify({ analista_id: 4, tr: '2020TR000612' }) });
    conf(r === 'PASSOU', `${metodo} SAI do navegador`);
    conf(chamadasReais.length === 1, `${metodo} chegou ao fetch de verdade`);

    const corpo = JSON.parse(chamadasReais[0].opts.body);
    // ⚠️ O par: o DONO vira o analista, o EXECUTOR vira voce. Trocar so um gravaria a baixa
    // na produtividade errada — e mandar `analista_id: U.id` era o que o arquivo ja fazia.
    conf(corpo.analista_id === 22, `${metodo}: analista_id vira o DONO (22)`, `veio ${corpo.analista_id}`);
    conf(corpo.executado_por === 4, `${metodo}: executado_por vira VOCE (4)`, `veio ${corpo.executado_por}`);
    conf(corpo.executado_por_nome === 'Richard', `${metodo}: e o nome do executor vai junto`);
    conf(corpo.tr === '2020TR000612', `${metodo}: o resto do corpo nao e mexido`);
  }
}

console.log('\n═══ 2b. O CARIMBO SO VALE PARA QUEM DECLARA DONO ═══');
{
  _setVerComo(ANA);
  // Rota que nao fala de analista_id nao e trabalho de analista — config, senha, faixa.
  chamadasReais.length = 0;
  await _fetch('http://api.teste/config_sistema', { method:'PATCH', body: JSON.stringify({ modo: true }) });
  const semDono = JSON.parse(chamadasReais[0].opts.body);
  conf(!('executado_por' in semDono), 'corpo sem analista_id NAO ganha carimbo');
  conf(semDono.modo === true, 'e segue intacto');

  // `usuario_id` tambem e dono: e o que o "assumir" manda.
  chamadasReais.length = 0;
  await _fetch('http://api.teste/tr/assumir', { method:'POST', body: JSON.stringify({ usuario_id: 4, tr: 'X' }) });
  const comUser = JSON.parse(chamadasReais[0].opts.body);
  conf(comUser.usuario_id === 22, 'usuario_id tambem vira o DONO');
  conf(comUser.executado_por === 4, 'e o executor vai junto');

  // Corpo que nao e JSON nao pode estourar o fetch inteiro.
  chamadasReais.length = 0;
  const r = await _fetch('http://api.teste/qualquer', { method:'POST', body: 'texto solto' });
  conf(r === 'PASSOU', 'corpo que nao e JSON passa sem quebrar');

  // O logout continua sendo a excecao: sair nao e agir pela pessoa.
  chamadasReais.length = 0;
  await _fetch('http://api.teste/usuarios/logout', { method:'POST', body: JSON.stringify({ usuario_id: 4 }) });
  const lg = JSON.parse(chamadasReais[0].opts.body);
  conf(lg.usuario_id === 4 && !('executado_por' in lg), 'o logout NAO e carimbado — sai como voce');
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
  // ⚠️ Agir pela conta de outro é do papel TÉCNICO (14/08). No papel analista a função
  // recusa mesmo chamada pelo console — o item some do menu, mas o menu não é a guarda.
  vm.runInContext('U = { id: 4, nome:"Richard", perfil:"superadmin", grupo:"3", papelAtivo:"tecnico" }', ctx);
  conf(verComoPodeVer(ANA) === true, 'superadmin ve analista de qualquer grupo');
  conf(verComoPodeVer({ id:5, perfil:'coordenador', grupo:'1' }) === true, 'superadmin ve coordenador');

  vm.runInContext('U = { id: 4, nome:"Richard", perfil:"superadmin", grupo:"3", papelAtivo:"analista" }', ctx);
  conf(verComoPodeVer(ANA) === false, 'mas NAO no papel analista');
  vm.runInContext('U = { id: 4, nome:"Richard", perfil:"superadmin", grupo:"3" }', ctx);
  conf(verComoPodeVer(ANA) === false, 'nem sem papel definido — o padrao e analista');
  vm.runInContext('U = { id: 4, nome:"Richard", perfil:"superadmin", grupo:"3", papelAtivo:"tecnico" }', ctx);
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

  // ⚠️ O DEFEITO DE 13/08: o vcOff mandava a opacidade num SEGUNDO atributo style=, e o HTML
  // fica com o PRIMEIRO. Os sete botoes ja tem style= inline, entao o cinza nunca aparecia:
  // botao com a cor inteira, de aparencia clicavel, que nao respondia ao clique. Quem pinta
  // agora e o CSS, que nao depende de ordem nem de repeticao.
  conf(!/style=/.test(s), 'vcOff NAO devolve style — o segundo style= do HTML e ignorado');
  conf(/\.btn-acao:disabled\{[^}]*opacity/.test(html), 'quem pinta o desabilitado e o CSS');
  conf(/\.btn-acao:disabled\{[^}]*cursor:not-allowed/.test(html), 'com o cursor de bloqueado junto');

  _setVerComo(null);
  conf(vcOff() === '', 'e nada fora do modo');

  // A faixa nao pode supor o genero de quem esta sendo visto — o Rafael e ele.
  // A faixa nao pode supor o genero de quem esta sendo visto — o Rafael e ele. O unico
  // "no nome dela" que sobrou e o da TELA DE ESCOLHA, que fala da pessoa escolhida na lista
  // e concorda com "a pessoa" — nao com o analista.
  conf(!/gravado no nome dela/.test(html), 'a faixa nao diz mais "gravado no nome dela"');
  // ⚠️ O texto mudou em 14/08: o modo passou a AGIR, e "nada do que você fizer é gravado no
  // nome deste analista" virou MENTIRA — agora tudo é gravado no nome dele, e é o ponto.
  conf(/O trabalho fica no nome dele; você fica registrado como quem executou/.test(html),
       'a faixa explica a autoria dupla');
  conf(!/nada do que você fizer é gravado no nome deste analista/i.test(html),
       'e o texto antigo, que virou mentira, saiu');
  conf(/VOCÊ ESTÁ AGINDO PELA CONTA DE/.test(html), 'e a faixa diz AGINDO, não vendo');
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
  conf(/if\(_verComo && paraApi && metodo !== 'GET' && !String\(url\)\.includes\('\/usuarios\/logout'\)\)/.test(html),
       'e so age no modo, na API, fora do GET e fora do logout');
  conf(/usuarios\/logout/.test(html.slice(html.indexOf('window.fetch = function'), html.indexOf('window.fetch = function') + 900)),
       'com a excecao do logout escrita ao lado');

  // Sair do sistema tambem sai do modo.
  const bSair = html.slice(html.indexOf('function sair()'), html.indexOf('function sair()') + 1200);
  conf(/verComoSair\(true\)/.test(bSair), 'sair() desliga o modo');
}

console.log('\n═══ 8b. A TELA DEIXA CLARO QUE NADA E ACIONAVEL ═══');
{
  // ⚠️ REESCRITA EM 14/08/2026. Antes as 14 acoes recusavam na origem. Agora o modo AGE:
  // dez foram liberadas, e QUATRO continuam recusando — e as quatro nao sao "leitura", sao
  // DECISOES sobre o trabalho do analista, que nao se tomam no nome dele.
  const LIBERADAS = [
    ['pAbrirSit',        'mudar a situação'],
    ['pAbrirPar',        'registrar parecer'],
    ['pRespondeu',       'registrar a resposta da entidade'],
    ['pEnviarCI',        'encaminhar ao C.I.'],
    ['pCiResponder',     'responder ao C.I.'],
    ['salvarAnotacao',   'salvar anotação'],
    ['planNovaAnotacao', 'escrever anotação pela Minha Planilha'],
    ['excluirAnotacao',  'excluir anotação'],
    ['assumirTR',        'assumir TR'],
    ['enviarAoCI',       'encaminhar ao C.I. pelo detalhe da TR'],
  ];
  const TRAVADAS = [
    ['pEstornar',       'estornar — decisão de coordenação'],
    ['abrirDevM',       'devolver TR — decisão de coordenação'],
    ['abrirPedidoDev',  'solicitar devolução — o pedido é dele, não seu'],
    // ⚠️ ERA `ciDecidir` ate 25/08/2026, quando a tela do C.I. voltou a ser POR PC.
    ['ciConfirmar',     'decidir no C.I. — é do técnico, não do analista'],
    // ⚠️ REABRIR NAO E DESFAZER A BAIXA, e nao e do analista: quem reabre uma parcela
    // encerrada e o tecnico do C.I. (26/08/2026).
    ['ciReabrirAbrir', 'reabrir no C.I. — e do tecnico do Controle Interno'],
  ];

  LIBERADAS.forEach(([fn, rot]) => {
    const i = html.indexOf(`function ${fn}(`);
    const bloco = html.slice(i, i + 500);
    conf(i > 0 && !/if\(verComoAtivo\(\)\)/.test(bloco), `${fn} AGE no modo (${rot})`);
  });
  TRAVADAS.forEach(([fn, rot]) => {
    const i = html.indexOf(`function ${fn}(`);
    const bloco = html.slice(i, i + 500);
    conf(i > 0 && /if\(verComoAtivo\(\)\)/.test(bloco), `${fn} continua RECUSANDO (${rot})`);
  });
  // ⚠️ SAO SEIS, E TODAS SAO NOMEADAS. Contar sem nomear era a versao anterior desta
  // linha, e ela nao distinguia a trava certa da trava por engano — que e a coisa que ela
  // existe para pegar. As quatro primeiras sao acoes de TRABALHO que continuam sendo do
  // dono; a quinta, de 24/08, e o `sinoMarcarTodas`, que NAO e acao de trabalho: e a
  // garantia de que ler o sino de outro no modo nunca marca a notificacao dele como lida.
  // A sexta, de 26/08, e o `ciReabrirAbrir` — reabrir uma parcela encerrada e do tecnico do
  // C.I., e nao passa a ser do analista so porque alguem esta agindo pela conta dele.
  const travas = (html.match(/if\(verComoAtivo\(\)\) \{ toast\(/g) || []).length;
  conf(travas === 6, 'as travas sao SEIS, nem mais nem menos', String(travas));
  const iMT = html.indexOf('async function sinoMarcarTodas');
  conf(/if\(verComoAtivo\(\)\) \{ toast\(/.test(html.slice(iMT, iMT + 700)),
       'e a quinta e o sinoMarcarTodas — leitura do sino nunca marca o aviso de outro');
  // E o texto delas nao diz mais "modo leitura" — o modo escreve.
  conf(!/Modo leitura: /.test(html), 'nenhuma trava diz mais "Modo leitura:"');

  // O formulario de anotacao nem e desenhado no modo — so a lista do que ja existe.
  // O ramo do modo vem ANTES do formulario: `${verComoAtivo() ? <aviso> : <textarea>}`.
  const iAnot = html.indexOf('<label>Anotações</label>');
  const bAnot = html.slice(iAnot, iAnot + 1600);
  // ⚠️ MUDOU EM 14/08: a anotacao PODE ser gravada, entao o formulario FICA. Esconder o campo
  // de uma acao que funciona seria a mesma mentira, ao contrario.
  conf(/\$\{verComoAtivo\(\) \?/.test(bAnot) && /será gravada <b>no nome de/.test(bAnot),
       'o aviso diz em nome de quem a anotacao vai');
  conf(bAnot.includes('<textarea id="anotTexto"'), 'e o formulario CONTINUA desenhado');
  conf(bAnot.indexOf('será gravada') < bAnot.indexOf('<textarea id="anotTexto"'),
       'com o aviso ANTES do campo, nao depois');

  // ⚠️ E o SEGUNDO caminho, o da Minha Planilha: os botoes nem sao desenhados no modo.
  // Guardar so a funcao deixava o botao a vista, e ele abria o modal.
  const iBloco = html.indexOf('function planAnotacaoBloco(r)');
  const bBloco = html.slice(iBloco, iBloco + 2200);
  conf(/\$\{verComoAtivo\(\)[\s\S]{0,120}?nenhuma anotação/.test(bBloco),
       '"+ Adicionar anotação" vira texto no modo leitura');
  conf(/\$\{verComoAtivo\(\) \? ''[\s\S]{0,200}?Editar<\/button>/.test(bBloco),
       'e o "Editar" simplesmente nao aparece');
  // As anotacoes ja escritas continuam legiveis — ler e o proposito do modo.
  conf(/white-space:pre-wrap;">\$\{escHtml\(atual\.texto\|\|''\)\}/.test(bBloco),
       'o texto da anotacao continua a vista');
  conf(/O trabalho fica <strong>no nome dela<\/strong>/.test(html),
       'e a tela de escolha diz que o trabalho fica no nome dela');

  // O botao Assumir nasce desabilitado e e desabilitado tambem no erro.
  // ⚠️ A ancora era a assinatura exata `(pode, motivo)` e quebrou quando o terceiro
  // argumento entrou (13/08). Assinatura e decisao tecnica; o que precisa ser provado e a
  // PROPRIEDADE: existe uma funcao so, e ninguem mais mexe no btnConfAss por fora dela.
  conf(/function assBotao\(pode, motivo/.test(html), 'ha uma funcao unica para o botao Assumir');
  // O btnConfAss e pego em dois lugares: o assBotao e o "Assumindo..." de
  // confirmarAssumirTR. A propriedade que importa e que quem RELIGA o botao e sempre o
  // assBotao — ninguem o reacende no braco, porque so o assBotao sabe se ele deve sumir.
  conf(html.split("getElementById('btnConfAss')").length - 1 === 2,
       'so dois lugares pegam o btnConfAss');
  const iConf = html.indexOf('async function confirmarAssumirTR(');
  const bConf = html.slice(iConf, iConf + 2600);
  conf(!/\bbtn\.disabled\s*=\s*false/.test(bConf), 'e ninguem o REACENDE por fora do assBotao');
  conf(/assBotao\([\s\S]{0,120}?assLimiteAtingido\(ASS_PREVIA\)\)/.test(bConf),
       'no erro, o Assumir escondido pelo limite NAO volta cinza para a tela');
  conf(/assBotao\(false, 'Carregando as PCs livres desta TR\.\.\.'\)/.test(html),
       'ele NASCE desabilitado, antes da busca');
  const iAss = html.indexOf('async function assumirTR(');
  const bAss = html.slice(iAss, iAss + 3000);
  conf(/catch\(e\) \{[\s\S]{0,400}?assBotao\(false, e\.message\)/.test(bAss),
       'e e desabilitado NO ERRO — era este o caminho que o deixava clicavel');
  conf(/b\.title = pode \? '' : \(motivo \|\| ''\)/.test(html), 'com o motivo no title');
}

console.log('\n═══ 8c. O MENU MOSTRA O QUE O ANALISTA VE (03/09/2026) ═══');
{
  const ctxM = { console };
  vm.createContext(ctxM);
  const iM = html.indexOf('const SB_BLOCOS = ['), fM = html.indexOf('function renderSB()');
  vm.runInContext(html.slice(iM, fM) + `
function _m(u, vc, alvo){ return sbMontar(u, vc, alvo) }`, ctxM);

  // ⚠️ Com dois papeis (14/08), o menu obedece ao papel ATIVO — e os tres blocos so
  // existem no TECNICO. Sem `papelAtivo`, o padrao e analista e o bloco superadmin nem sai.
  const sup = { id:4, perfil:'superadmin', grupo:'3', papelAtivo:'tecnico' };
  const ana = { id:51, perfil:'analista', grupo:'3' };
  const normal = ctxM._m(sup, false).map(b => b.id);
  const modo   = ctxM._m(sup, true, ana);
  conf(normal.length === 3, 'fora do modo, o superadmin ve os tres blocos');
  conf(modo.length === 1 && modo[0].id === 'analista',
       'no modo, so o bloco do analista', JSON.stringify(modo.map(b=>b.id)));

  const ids = modo[0].itens.map(i => i.id);

  // ⚠️ A DECISAO MUDOU EM 03/09/2026, e esta secao mudou junto. Ate aqui o modo escondia
  // ESTOQUE e ESTORNAR por uma marca `soAcao` — "tela que so serve para AGIR nao entra". O
  // Richard reverteu: o modo existe para ele enxergar O QUE A PESSOA ENXERGA, e um menu com
  // menos itens que o dela nao serve para orientar ninguem.
  //
  // ⚠️ O QUE ESTA SECAO PROTEGE AGORA E MAIS FORTE do que a lista de excecoes antiga: o menu
  // do modo tem de ser IGUAL, item a item e na mesma ordem, ao menu do proprio analista. Uma
  // lista de "estes ficam de fora" precisaria ser lembrada a cada item novo; a igualdade nao.
  const dele = ctxM._m(ana, false).flatMap(b => b.itens.map(i => i.id));
  conf(JSON.stringify(ids) === JSON.stringify(dele),
       'o menu do modo e IGUAL ao menu do proprio analista',
       `modo=${JSON.stringify(ids)} dele=${JSON.stringify(dele)}`);

  // ⚠️ O ESTOQUE ENTROU, e e o item que motivou a mudanca: e a tela de onde a pessoa assume
  // TR, ou seja, exatamente a duvida que faz alguem pedir suporte.
  conf(ids.includes('est'), 'ESTOQUE aparece — o analista tem essa tela');
  // ⚠️ E O ESTORNAR CONTINUA FORA, agora pelo motivo CERTO: `pode:` e so-superadmin desde
  // 18/08, e o `pode` passou a ser avaliado contra o ALVO. Nao ha excecao escrita a mao.
  conf(!ids.includes('estornar'), 'ESTORNAR fica de fora porque o ANALISTA nao o tem');
  conf(ids.includes('plan'), 'Minha Planilha fica');
  conf(ids.includes('meuspedidos'), 'Meus pedidos fica');
  conf(ids.includes('prod'), 'Produtividade fica');
  conf(ids.includes('dash'), 'Dashboard fica');

  // ⚠️ SEM O ALVO, O MODO NAO INVENTA UM. Cai no usuario que esta olhando — e e por isso que
  // a `renderSB` passa `alvo()` explicitamente. Se um dia ela parar de passar, o menu volta a
  // ser o do tecnico dentro do modo, e este teste diz qual e a diferenca.
  const semAlvo = ctxM._m(sup, true).flatMap(b => b.itens.map(i => i.id));
  conf(semAlvo.includes('estornar'),
       'sem o alvo, o menu volta a ser o de quem olha — a `renderSB` precisa passar `alvo()`');
  conf(/sbMontar\(U, verComoAtivo\(\), alvo\(\)\)/.test(html),
       'e a renderSB passa os tres argumentos');

  // ⚠️ A MARCA `soAcao` FOI REMOVIDA, nao comentada: era o recorte antigo, e propriedade que
  // ninguem le e propriedade que engana quem for mexer aqui depois.
  conf(!/soAcao:\s*true/.test(html), 'a marca `soAcao` saiu dos itens do menu');

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

console.log('\n═══ O SINO NO MODO: LE do alvo(), ESCREVE no U.id (24/08/2026) ═══');
{
  // ⚠️ O DEFEITO QUE ISTO FECHA: o sino era a UNICA parte da tela que ignorava o `alvo()`.
  // O Richard entrou pela conta da Sandra — que tinha 7 avisos de diligencia vencendo no
  // dia — e leu "Nada novo por aqui", porque o sino buscava as DELE.

  // ── as duas LEITURAS seguem o alvo(), e mandam QUEM PEDE junto
  const leituras = (html.match(/\/notificacao\?destinatario_id=\$\{alvo\(\)\.id\}/g) || []).length;
  conf(leituras === 2, 'as DUAS leituras de notificacao usam alvo().id', String(leituras));
  conf(!/\/notificacao\?destinatario_id=\$\{U\.id\}/.test(html),
       'e nenhuma leitura de notificacao usa U.id');
  // ⚠️ OS DOIS IDS SAO DIFERENTES DE PROPOSITO: `destinatario_id` diz DE QUEM sao os avisos,
  // `usuario_id` diz QUEM esta pedindo. O servidor confere o segundo contra o perfil lido do
  // BANCO. Mandar o `alvo()` nos dois seria dizer que a Sandra esta pedindo — e a conferencia
  // passaria a aprovar a si mesma, que e o mesmo buraco com outro nome.
  const comQuem = (html.match(/destinatario_id=\$\{alvo\(\)\.id\}&usuario_id=\$\{U\.id\}/g) || []).length;
  conf(comQuem === 2, 'as duas mandam usuario_id = U.id junto', String(comQuem));
  conf(!/usuario_id=\$\{alvo\(\)\.id\}/.test(html), 'e NENHUMA manda o alvo() como quem pede');
  // ⚠️ Recusa nao pode virar "Nada novo por aqui": sem esta guarda, um 403 zeraria a lista e
  // o contador em silencio, e a tela diria que nao ha avisos quando o que houve foi um nao.
  // ⚠️ A janela fecha na ATRIBUICAO, e nao num numero: com os comentarios da regra a funcao
  // passou de 1.600 caracteres e a checagem acusou falha que era do teste. Janela por tamanho
  // mede o tamanho do comentario.
  const iS2 = html.indexOf('async function sinoCarregar');
  const carregar = html.slice(iS2, html.indexOf('_notifs = j.data || []', iS2));
  conf(/if\(j\.error\) return/.test(carregar),
       'e um erro do servidor nao zera o sino em silencio');

  // ── as duas ESCRITAS continuam no U.id
  const escritas = (html.match(/destinatario_id: U\.id/g) || []).length;
  conf(escritas === 2, 'marcar-uma e marcar-todas continuam com U.id', String(escritas));
  conf(!/destinatario_id: alvo\(\)/.test(html), 'e NENHUMA escrita usa o alvo()');

  // ⚠️ O MOTIVO DA ASSIMETRIA, escrito no codigo para nao se perder: notificacao lida e
  // apagada 15 dias depois pelo `limparLidas`. Marcar a de outro a faria sumir antes de a
  // pessoa ver — e no caso da Sandra o prazo das 7 vencia naquele mesmo dia.
  conf(/limparLidas|apagada 15 dias|15 dias depois da leitura/.test(html),
       'o porque da assimetria esta escrito junto da regra');

  // ── o clique so marca o que e SEU, e a condicao e a POSSE, nao o modo ligado
  //
  // ⚠️ A GUARDA MUDOU DE FUNCAO EM 01/09/2026, e nao sumiu. Ela morava dentro da `sinoClicar`;
  // com os botoes do aviso de repasse ela passou a ser chamada de DOIS lugares, e virou a
  // `notifMarcarLida`. A primeira versao dos botoes REPETIA o bloco inteiro — e foi este teste,
  // contando as escritas com `U.id`, que pegou. Dois blocos iguais divergem no primeiro
  // ajuste, e o que divergiria aqui e justamente a guarda do modo "agir pela conta de".
  const iC = html.indexOf('async function notifMarcarLida');
  const clicar = html.slice(iC, html.indexOf('async function sinoClicar', iC));
  conf(/Number\(n\.destinatario_id\) === Number\(U\.id\)/.test(clicar),
       'so se marca quando a notificacao e do usuario logado');
  conf(/if\(!\(n && !n\.lida_em && meu\)\) return/.test(clicar),
       'e a remocao otimista entra na mesma condicao');
  // Sem isso o item sumiria da tela, o contador cairia, o PATCH casaria ZERO linhas (o WHERE
  // tem destinatario_id) e a carga de 60s traria tudo de volta — a tela piscando uma mentira.
  conf(!/^\s*_notifs = _notifs\.filter\(x => x\.id !== id\)\s*$/m.test(clicar.split('const meu =')[0] || ''),
       'e nao ha remocao otimista antes da condicao');
  // ⚠️ E OS DOIS CAMINHOS ENTRAM PELA MESMA PORTA. Um deles que marcasse por conta propria
  // pularia a guarda — que e exatamente o defeito que esta secao existe para pegar.
  const iCl = html.indexOf('async function sinoClicar');
  conf(/await notifMarcarLida\(id\)/.test(html.slice(iCl, iCl + 300)),
       'a sinoClicar entra pela notifMarcarLida');
  const iAg = html.indexOf('async function notifAgir');
  conf(/await notifMarcarLida\(notifId\)/.test(html.slice(iAg, iAg + 300)),
       'e os botoes do aviso de repasse, tambem');
  conf((html.match(/destinatario_id: U\.id/g) || []).length === 2,
       'e continuam sendo DUAS as escritas com U.id');

  // ── marcar-todas tem trava propria, alem de sumir da tela
  const iM = html.indexOf('async function sinoMarcarTodas');
  const todas = html.slice(iM, iM + 700);
  conf(/if\(verComoAtivo\(\)\)/.test(todas), 'sinoMarcarTodas recusa no modo, mesmo chamada de fora');
  conf(/_notifNaoLidas && !repres/.test(html), 'e o link "marcar todas" nem aparece no modo');

  // ── o rotulo, para ninguem ler aviso alheio achando que e seu
  conf(/notificações de <b>\$\{escHtml\(alvo\(\)\.nome/.test(html), 'o painel diz de quem sao as notificacoes');
  conf(/só leitura, não são marcadas como lidas/.test(html), 'e avisa que e so leitura');

  // ⚠️ ENTRAR E SAIR RECARREGAM O SINO. O timer so passa de 60 em 60 s: sem isto, entrar na
  // conta de alguem deixaria o sino com os avisos do dono ANTERIOR, sob o rotulo do novo.
  const iE = html.indexOf('function verComoEntrar');
  conf(/sinoCarregar\(\)/.test(html.slice(iE, html.indexOf('function verComoSair'))),
       'verComoEntrar recarrega o sino');
  const iS = html.indexOf('function verComoSair');
  const sair = html.slice(iS, iS + 700);
  conf(/sinoCarregar\(\)/.test(sair), 'verComoSair tambem');
  // ⚠️ ANTES do `silencioso`: a saida silenciosa tambem troca o dono do sino.
  conf(sair.indexOf('sinoCarregar()') < sair.indexOf('if(silencioso) return'),
       'e a recarga vem ANTES do atalho silencioso');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
})();
