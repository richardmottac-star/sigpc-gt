// CAMINHO: sigpc-gt/teste_front_preparacao.js
//
// Testes do MODO PREPARAÇÃO na tela, extraindo as funções do próprio index.html.
// Sem navegador, sem rede, sem login.
//
// ⚠️ O QUE ESTES TESTES PROTEGEM
//
//   · superadmin e coordenador NUNCA veem a tela restrita — se vissem, não haveria quem
//     desligasse o modo;
//   · na dúvida o sistema ABRE: `_prep` desligado ou ausente não restringe ninguém;
//   · a barra lateral SOME INTEIRA, e não "com menos itens" — item cinza é convite a
//     clicar e a perguntar por quê;
//   · o Meu Perfil ganha uma porta de volta no modo restrito, senão a pessoa fica presa
//     nele e só sai recarregando a página.
//
// USO: node teste_front_preparacao.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('let _prep = { modo_preparacao: false');
const fim = html.indexOf('function iniciarApp()');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco do modo preparacao no index.html.');
  process.exit(1);
}

const ctx = { console, setInterval: () => 0, clearInterval: () => {},
              document: { getElementById: () => null }, fetch: async () => ({ json: async () => ({}) }),
              escHtml: s => String(s), ativarMenu: () => {}, toast: () => {},
              API_URL: 'http://x', renderSB: () => {}, irDash: () => {} };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim) + `
function _setU(v){ U = v }
function _setPrep(v){ _prep = v }
`, ctx);
vm.runInContext('var U = null', ctx);

const { prepRestrito, _setU, _setPrep } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

console.log('\n═══ 1. QUEM VE A TELA RESTRITA ═══');
{
  _setPrep({ modo_preparacao: true, mensagem: 'x' });
  _setU({ perfil: 'analista' });
  conf(prepRestrito() === true, 'analista ve a tela restrita');

  _setU({ perfil: 'superadmin' });
  conf(prepRestrito() === false, 'SUPERADMIN NAO — senao nao haveria quem desligasse');
  _setU({ perfil: 'coordenador' });
  conf(prepRestrito() === false, 'COORDENADOR NAO');
  _setU({ perfil: 'controle_interno' });
  conf(prepRestrito() === true, 'perfil fora dos isentos ve a tela restrita');
}

console.log('\n═══ 2. NA DUVIDA, O SISTEMA ABRE ═══');
{
  _setU({ perfil: 'analista' });
  _setPrep({ modo_preparacao: false });
  conf(prepRestrito() === false, 'modo desligado nao restringe');
  _setPrep({});
  conf(prepRestrito() === false, 'config vazia (busca falhou) nao restringe');
  _setPrep({ modo_preparacao: null });
  conf(prepRestrito() === false, 'valor nulo nao restringe');

  _setPrep({ modo_preparacao: true });
  _setU(null);
  conf(prepRestrito() === false, 'sem usuario logado, nao restringe');
}

console.log('\n═══ 3. TRAVAS NO index.html ═══');
{
  // A barra some INTEIRA. Item cinza é convite a clicar e a perguntar por quê.
  conf(/if\(prepRestrito\(\)\) \{\s*nav\.innerHTML = ''\s*nav\.style\.display = 'none'/.test(html),
       'renderSB esconde a barra lateral inteira');
  // Sem a barra, o Meu Perfil precisa de porta de volta — senão a pessoa fica presa nele.
  const iPerfil = html.indexOf('function irMeuPerfil()');
  const blocoPerfil = html.slice(iPerfil, iPerfil + 1200);
  conf(/prepRestrito\(\)/.test(blocoPerfil) && /onclick="irPreparacao\(\)"/.test(blocoPerfil)
       && /← Voltar/.test(blocoPerfil),
       'Meu Perfil ganha "Voltar" no modo restrito');
  // A tela restrita oferece o Meu Perfil, que é a única coisa que se pode fazer agora.
  conf(/irPreparacao\(\)[\s\S]{0,1600}?onclick="irMeuPerfil\(\)"/.test(html),
       'a tela restrita leva ao Meu Perfil');

  // A busca vem ANTES do primeiro render: senão o analista veria o menu inteiro por um
  // instante e a tela restrita entraria por cima.
  conf(/prepCarregar\(\)\.finally\(\(\) => \{\s*renderSB\(\)/.test(html),
       'iniciarApp busca o estado ANTES de desenhar');
  // `finally`, e não `then`: se a busca falhar, a tela tem de abrir do mesmo jeito.
  conf(/prepCarregar\(\)\.finally\(/.test(html) && !/prepCarregar\(\)\.then\(/.test(html),
       'e usa finally — busca que falha nao pode deixar a tela em branco');

  // Sem a releitura periódica, "à tarde eu desligo e abre para todos" exigiria que 47
  // pessoas recarregassem a página.
  conf(/_prepTimer = setInterval\([\s\S]{0,400}?\}, 60000\)/.test(html),
       'reconfere de 60 em 60 s');
  conf(/if\(prepRestrito\(\) !== antes\)/.test(html),
       'e so repinta quando o estado MUDA — repintar sempre roubaria o que a pessoa digita');

  // O interruptor.
  conf(/\{ id: 'prep',\s*rotulo: 'Modo preparação'/.test(html), 'a aba existe em Configuracoes');
  conf(/cfgPrepAlternar\(\$\{on \? 'false' : 'true'\}\)/.test(html),
       'o botao alterna para o oposto do estado atual');
  conf(/cfgPrepAlternar[\s\S]{0,600}?await moConfirm/.test(html),
       'ligar e desligar passam pela confirmacao do sistema');
  // O estado tem de estar fresco antes de desenhar a aba, senão o botão mente.
  conf(/await prepCarregar\(\)\s*cfgRender\(\)/.test(html),
       'cfgCarregar releva o estado antes de desenhar a aba');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
