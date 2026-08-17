// CAMINHO: sigpc-gt/teste_front_faixa.js
//
// Testes da FAIXA DE AVISOS, executando a `faixaPintar` de verdade num DOM de mentira.
// Sem navegador, sem rede, sem login.
//
// A regra, decidida pelo Richard em 16/08/2026:
//   Dashboard      -> BLOCO parado abaixo da Estrutura de Governanca, texto INTEIRO.
//   demais telas   -> a faixa ROLANDO no rodape, como sempre foi.
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

console.log('\n═══ 1. NO DASHBOARD: BLOCO SIM, RODAPE NAO ═══');

let r = pintar([AVISO], 'inicial');
conf(r.bloco.includes('faixa-bloco'), 'o bloco e desenhado no Dashboard');
conf(r.bloco.includes(AVISO.texto), 'e traz o texto do aviso');
// ⚠️ O PONTO DA MUDANCA: mostrar os dois seria o mesmo recado duas vezes na mesma tela.
conf(r.rodape === '', 'e o RODAPE fica vazio no Dashboard', JSON.stringify(r.rodape));

console.log('\n═══ 2. NAS DEMAIS TELAS: RODAPE SIM, BLOCO NAO ═══');

r = pintar([AVISO], 'outra');
conf(r.rodape.includes('faixa-mv'), 'a faixa rolante volta no rodape');
conf(r.rodape.includes(AVISO.texto), 'com o texto do aviso');
conf(r.bloco === '', 'e o bloco fica vazio', JSON.stringify(r.bloco));

// A tela nova nao tem o elemento do bloco — a funcao nao pode quebrar por isso.
r = pintar([AVISO], 'outra', false);
conf(r.rodape.includes('faixa-mv'), 'sem o elemento do bloco, o rodape continua funcionando');

console.log('\n═══ 3. O BLOCO NAO ROLA, E O RODAPE ROLA ═══');

r = pintar([AVISO], 'inicial');
// ⚠️ `faixa-mv` e a classe que carrega a animacao e o `white-space:nowrap`. Se ela aparecer
// no bloco, o texto volta a correr e a rolagem que o Richard tirou volta pela porta dos fundos.
conf(!r.bloco.includes('faixa-mv'), 'o bloco NAO usa a classe que anima');
conf(!r.bloco.includes('--faixa-seg'), 'nem recebe duracao de volta');
conf(r.bloco.includes('faixa-bloco-item'), 'ele usa o item de bloco, que quebra em linhas');

r = pintar([AVISO], 'outra');
conf(r.rodape.includes('--faixa-seg'), 'o rodape continua com a duracao proporcional');
// O conteudo vai duplicado para nao deixar vao em branco na volta.
conf(r.rodape.split(AVISO.texto).length - 1 === 2, 'e com o conteudo DUPLICADO na volta',
  String(r.rodape.split(AVISO.texto).length - 1));
conf(!r.rodape.includes('faixa-bloco'), 'e o rodape nao vira bloco');

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
conf(r.bloco.includes('faixa-urg-tag') && r.bloco.includes('URGENTE'), 'o bloco traz a etiqueta URGENTE');
conf(/class="faixa-bloco urg"/.test(r.bloco), 'e a classe de cor urgente');
r = pintar([URGENTE], 'outra');
conf(r.rodape.includes('URGENTE'), 'o rodape tambem traz a etiqueta');
conf(/class="faixa urg"/.test(r.rodape), 'e a mesma classe de cor');

// Um aviso urgente no meio de outros pinta o conjunto — a regra e a mesma nas duas formas.
r = pintar([AVISO, URGENTE], 'inicial');
conf(/class="faixa-bloco urg"/.test(r.bloco), 'um urgente entre varios pinta o bloco inteiro');
r = pintar([AVISO, URGENTE], 'outra');
conf(/class="faixa urg"/.test(r.rodape), 'e o rodape inteiro, igual');

console.log('\n═══ 7. DOIS AVISOS NAO VIRAM UM PARAGRAFO SO ═══');

r = pintar([AVISO, URGENTE], 'inicial');
conf((r.bloco.match(/faixa-bloco-item/g) || []).length === 2,
  'no bloco sao DOIS itens, um por aviso',
  String((r.bloco.match(/faixa-bloco-item/g) || []).length));
// ⚠️ No bloco o texto QUEBRA. Dois recados emendados com bullet viravam um paragrafo unico e
// o segundo se perdia — por isso o separador do rodape nao entra aqui.
conf(!r.bloco.includes('faixa-sep'), 'e sem o bullet separador, que e coisa da rolagem');
r = pintar([AVISO, URGENTE], 'outra');
conf(r.rodape.includes('faixa-sep'), 'no rodape o bullet continua, porque ali e uma linha so');

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

conf(/\.faixa\{[^}]*height:40px;/.test(html), 'a faixa do rodape subiu para 40px');
conf(/\.faixa-mv\{[^}]*font-size:13px;/.test(html), 'e o texto dela para 13px');
conf(/\.faixa-bloco\{[^}]*padding:14px 18px;/.test(html), 'o bloco tem respiro de 14x18');
conf(/\.faixa-bloco-item\{[^}]*white-space:normal;/.test(html), 'e o texto do bloco quebra');
conf(/\.faixa-bloco\.urg\{background:#7A1620;/.test(html), 'o bloco urgente usa a MESMA cor do rodape');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
