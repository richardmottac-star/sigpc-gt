// CAMINHO: sigpc-gt/teste_front_faixa.js
//
// Testes da FAIXA DE AVISOS, executando a `faixaPintar` de verdade num DOM de mentira.
// Sem navegador, sem rede, sem login.
//
// A regra, decidida pelo Richard em 16/08/2026:
//   E A MESMA FAIXA, ROLANDO IGUAL -- muda so O LUGAR.
//   Dashboard      -> logo abaixo da Estrutura de Governanca.
//   demais telas   -> no rodape, como sempre foi.
//   e uma de cada vez: no Dashboard o rodape fica VAZIO.
//
// USO: node teste_front_faixa.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('const FAIXA_SEG_MIN');
const fim = html.indexOf('function faixaIniciar(');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco da faixa no index.html.');
  process.exit(1);
}

// ⚠️ `let` e `const` de topo NAO viram propriedade do contexto do vm — ficam no escopo
// lexical do script e o teste nao consegue nem ler nem escrever `_faixas`. Trocar por `var`
// so nas declaracoes de primeira coluna (as de dentro das funcoes sao indentadas).
const codigo = html.slice(ini, fim).replace(/^(let|const) /gm, 'var ');

const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let els = {};
const ctx = {
  console, escHtml, URLSearchParams,
  API_URL: '', U: null,
  fetch: async () => ({ json: async () => ({ data: [] }) }),
  document: { getElementById: (id) => els[id] || null },
};
vm.createContext(ctx);
vm.runInContext(codigo, ctx);

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// Pinta com uma lista de avisos, numa tela, com ou sem o elemento do bloco.
function pintar(faixas, tela, comBloco = true) {
  els = { faixaAviso: { innerHTML: 'SUJO' } };
  if (comBloco) els.faixaBloco = { innerHTML: 'SUJO' };
  ctx._faixas = faixas;
  ctx._faixaTela = tela;
  ctx.faixaPintar();
  return {
    rodape: els.faixaAviso.innerHTML,
    bloco: comBloco ? els.faixaBloco.innerHTML : null,
  };
}

const AVISO = { escopo: 'todas', texto: 'SISTEMA AJUSTADO E ATUALIZADO EM 16/08/2026' };
const URGENTE = { escopo: 'urgente', texto: 'Sistema em manutencao as 18h' };
const SO_INICIAL = { escopo: 'inicial', texto: 'Recado da tela inicial' };

console.log('\n═══ 1. NO DASHBOARD: NA TELA SIM, RODAPE NAO ═══');

let r = pintar([AVISO], 'inicial');
conf(r.bloco.includes('faixa-mv'), 'a faixa e desenhada no Dashboard, e ROLANDO');
conf(r.bloco.includes(AVISO.texto), 'e traz o texto do aviso');
// ⚠️ O PONTO DA MUDANCA: mostrar as duas seria o mesmo recado duas vezes na mesma tela.
conf(r.rodape === '', 'e o RODAPE fica vazio no Dashboard', JSON.stringify(r.rodape));

console.log('\n═══ 2. NAS DEMAIS TELAS: RODAPE SIM, NA TELA NAO ═══');

r = pintar([AVISO], 'outra');
conf(r.rodape.includes('faixa-mv'), 'a faixa rolante volta no rodape');
conf(r.rodape.includes(AVISO.texto), 'com o texto do aviso');
conf(r.bloco === '', 'e o lugar do Dashboard fica vazio', JSON.stringify(r.bloco));

// A tela nova nao tem o elemento do Dashboard — a funcao nao pode quebrar por isso.
r = pintar([AVISO], 'outra', false);
conf(r.rodape.includes('faixa-mv'), 'sem o elemento do Dashboard, o rodape continua funcionando');

console.log('\n═══ 3. AS DUAS ROLAM, E A MARCACAO E A MESMA ═══');

const noDash = pintar([AVISO], 'inicial').bloco;
const noRodape = pintar([AVISO], 'outra').rodape;

// ⚠️ E A MESMA FAIXA. A unica diferenca permitida e a classe `faixa-dash`, que so acrescenta
// canto arredondado e respiro a quem mora dentro do conteudo. Se aparecer qualquer outra
// diferenca, as duas formas comecaram a divergir.
conf(noDash.includes('--faixa-seg') && noRodape.includes('--faixa-seg'),
  'as duas recebem a duracao proporcional');
conf(noDash.includes('faixa-mv') && noRodape.includes('faixa-mv'), 'as duas rolam');
conf(noDash.includes('faixa-dash'), 'a do Dashboard ganha a classe de posicao');
conf(!noRodape.includes('faixa-dash'), 'e a do rodape nao');
conf(noDash.replace(' faixa-dash', '') === noRodape.replace('  ', ' '),
  'fora essa classe, a marcacao das duas e IDENTICA');

// O conteudo vai duplicado para nao deixar vao em branco na volta — nas duas.
conf(noDash.split(AVISO.texto).length - 1 === 2, 'o conteudo vai DUPLICADO no Dashboard');
conf(noRodape.split(AVISO.texto).length - 1 === 2, 'e duplicado no rodape tambem');

console.log('\n═══ 4. SEM AVISO, NENHUM DOS DOIS OCUPA ESPACO ═══');

r = pintar([], 'inicial');
conf(r.bloco === '' && r.rodape === '', 'Dashboard sem aviso: os dois vazios');
r = pintar([], 'outra');
conf(r.bloco === '' && r.rodape === '', 'outra tela sem aviso: os dois vazios');

console.log('\n═══ 5. O ESCOPO "inicial" SO APARECE NO DASHBOARD ═══');

r = pintar([SO_INICIAL], 'inicial');
conf(r.bloco.includes(SO_INICIAL.texto), 'no Dashboard ele aparece — e no bloco');
r = pintar([SO_INICIAL], 'outra');
conf(r.rodape === '' && r.bloco === '', 'fora do Dashboard ele some, e nada fica no lugar');

console.log('\n═══ 6. A ETIQUETA URGENTE E A COR, NAS DUAS FORMAS ═══');

r = pintar([URGENTE], 'inicial');
conf(r.bloco.includes('faixa-urg-tag') && r.bloco.includes('URGENTE'), 'o Dashboard traz a etiqueta URGENTE');
conf(/class="faixa urg faixa-dash"/.test(r.bloco), 'e a classe de cor urgente');
r = pintar([URGENTE], 'outra');
conf(r.rodape.includes('URGENTE'), 'o rodape tambem traz a etiqueta');
conf(/class="faixa urg "/.test(r.rodape), 'e a mesma classe de cor');

// Um aviso urgente no meio de outros pinta o conjunto — a regra e a mesma nas duas formas.
r = pintar([AVISO, URGENTE], 'inicial');
conf(/class="faixa urg faixa-dash"/.test(r.bloco), 'um urgente entre varios pinta a faixa inteira');
r = pintar([AVISO, URGENTE], 'outra');
conf(/class="faixa urg "/.test(r.rodape), 'e o rodape inteiro, igual');

console.log('\n═══ 7. DOIS AVISOS, O MESMO SEPARADOR NAS DUAS ═══');

r = pintar([AVISO, URGENTE], 'inicial');
conf(r.bloco.includes('faixa-sep'), 'no Dashboard os dois avisos vem separados por bullet');
conf(r.bloco.includes(AVISO.texto) && r.bloco.includes(URGENTE.texto), 'e os dois textos estao la');
r = pintar([AVISO, URGENTE], 'outra');
conf(r.rodape.includes('faixa-sep'), 'no rodape, igual');

console.log('\n═══ 8. O TEXTO DO AVISO E ESCAPADO NAS DUAS FORMAS ═══');

const XSS = { escopo: 'todas', texto: '<img src=x onerror=alert(1)>' };
r = pintar([XSS], 'inicial');
conf(!r.bloco.includes('<img'), 'o bloco escapa o HTML do aviso');
r = pintar([XSS], 'outra');
conf(!r.rodape.includes('<img'), 'e o rodape tambem');

console.log('\n═══ 9. A MARCACAO E O CSS NO index.html ═══');

conf(/<div id="faixaBloco"><\/div>/.test(html), 'o elemento do bloco existe');
// ⚠️ Ele tem de vir DEPOIS da Estrutura de Governanca — foi onde o Richard pediu.
const iGov = html.indexOf('Estrutura de Governança do Grupo de Trabalho');
const iBloco = html.indexOf('<div id="faixaBloco">');
conf(iGov > 0 && iBloco > iGov, 'e vem logo abaixo da Estrutura de Governanca');

// ⚠️ O `ativarMenu('dash')` chama `faixaTela` ANTES de o BODY ser reescrito: naquele instante
// o #faixaBloco ainda nao existe. Sem uma segunda chamada depois do innerHTML, o bloco nasce
// vazio e so aparece na recarga de 5 minutos.
const irDash = html.slice(html.indexOf('function irDash()'), html.indexOf('function irEst('));
conf(irDash.indexOf('faixaPintar()') > irDash.indexOf('faixaBloco'),
  'e a irDash chama faixaPintar() DEPOIS de escrever o BODY');

conf(/\.faixa\{[^}]*height:40px;/.test(html), 'a faixa subiu para 40px');
conf(/\.faixa-mv\{[^}]*font-size:13px;/.test(html), 'e o texto dela para 13px');
// ⚠️ A classe do Dashboard so pode mexer em POSICAO. Cor, altura e animacao vem da `.faixa`,
// que e uma so — se ela ganhar background ou height proprios, as duas formas divergem.
const regraDash = (html.match(/\.faixa-dash\{[^}]*\}/) || [''])[0];
conf(/margin-top:14px/.test(regraDash) && /border-radius:12px/.test(regraDash),
  'a classe do Dashboard da respiro e canto arredondado');
conf(!/background|height:|animation/.test(regraDash),
  'e NAO mexe em cor, altura nem animacao', regraDash);
conf(!/\.faixa-bloco\b/.test(html), 'o bloco parado saiu do CSS — nao ha marcacao morta');

console.log('\n═══ 10. AS LOGOS DA GOVERNANCA E O BOTAO DA PRODUTIVIDADE ═══');

conf(/\.ft-lg img\{height:48px;/.test(html), 'as logos da governanca estao em 48px');
// ⚠️ ESTA SECAO MUDOU DE LADO EM 18/08/2026 — decisao do Richard. Ate aqui ela EXIGIA o
// `grayscale(100%)` com `opacity:.7`, revertidos no hover. O problema e que hover NAO EXISTE
// em toque: no celular as quatro marcas ficavam em preto e branco e desbotadas para sempre.
// E sao marcas de quatro orgaos diferentes — apaga-las nao era estetica, era descaracteriza-las.
// Agora aparecem SEMPRE coloridas, como os arquivos de assets/logos.
conf(!/\.ft-lg img\{[^}]*grayscale/.test(html), 'sem grayscale — as logos ficam coloridas');
conf(!/\.ft-lg img\{[^}]*opacity/.test(html), 'e sem opacidade que as desbote');
// E a regra de hover saiu junto: nao ha mais o que reverter.
conf(!/\.ft-lg:hover img\{/.test(html), 'e a regra de hover foi removida, nao ha o que reverter');

// ⚠️ O BOTAO RAPIDO "SUA PRODUTIVIDADE" SAIU DO DASHBOARD em 18/08/2026 — decisao do
// Richard. Ele, e o "Estoque de TRs" ao lado, repetiam em letra grande dois itens que a barra
// lateral ja oferece: ocupavam a dobra com atalhos, nao com informacao. O espaco virou os
// blocos "Precisa de voce" e "Suas PCs no Controle Interno".
//
// O que esta secao passa a proteger e o CAMINHO, nao o rotulo: a Produtividade continua
// alcancavel pelo menu.
conf(!/>\s*SUA PRODUTIVIDADE\s*<\/button>/.test(html),
     'o botao rapido "SUA PRODUTIVIDADE" saiu do Dashboard');
conf(!/Estoque de TRs\s*<\/button>/.test(html), 'e o "Estoque de TRs" saiu junto');
conf(/id:'prod',\s*bloco:'analista'/.test(html), 'a Produtividade continua no menu do analista');
// ⚠️ O "(NL)" saiu dos DOIS ROTULOS VISIVEIS. A unidade de produtividade e a PC baixada
// (CGE 727/2025), nao a NL — o rotulo antigo contradizia a regra do sistema.
//
// ⚠️ E O TESTE MEDE O ROTULO, NAO A STRING. A primeira versao procurava "Produtividade (NL)"
// no arquivo inteiro e falhava por causa de um COMENTARIO de CSS que registra o nome antigo.
// Teste que casa comentario proibe explicar a mudanca no codigo.
conf(!/>\s*Produtividade \(NL\)\s*</.test(html), 'e nenhum rotulo visivel diz "(NL)"');
conf(/<div style="font-size:16px;font-weight:700;">Produtividade<\/div>/.test(html),
  'o titulo da tela ficou neutro — o coordenador ve a de todos, nao "a sua"');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
