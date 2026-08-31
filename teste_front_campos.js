// CAMINHO: sigpc-gt/teste_front_campos.js
//
// OS DOIS CAMPOS — TR (SIGEF) e PROCESSO (SGPe) — executando de verdade num DOM de mentira.
// Sem navegador, sem rede, sem login.
//
// ⚠️ ELE NAO CASA TEXTO DO ARQUIVO PARA PROVAR COMPORTAMENTO. O bloco do componente e
// extraido do `index.html` e RODADO num `vm`: a colagem, a conferencia de sigla e o
// preenchimento com zero a esquerda sao exercitados pelos handlers de verdade, disparados com
// eventos de mentira. Um teste que so procurasse `padStart(6` no arquivo passaria com o
// handler nunca registrado.
//
// ⚠️ E `let`/`const` DE TOPO VIRAM `var`, pelo mesmo motivo do teste da faixa: declaracao
// lexica nao vira propriedade do contexto do `vm`, e o teste nao conseguiria ler `_SIGLAS`
// nem chamar `campoProcHtml`.
//
// USO: node teste_front_campos.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// ⚠️ AS CONFERENCIAS DE "SUMIU" LEEM O ARQUIVO SEM COMENTARIO. Este arquivo comenta muito, e
// os comentarios CITAM o que foi removido — o `<input id="acmpTr">` antigo, o mapa `ORGAOS`.
// Um teste que procurasse no texto cru reprovaria justamente a explicacao da mudanca.
const semComent = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// ── extrair o codigo ────────────────────────────────────────────────────────
const iNorm = html.indexOf('function normalizarProcesso(str) {');
const fNorm = html.indexOf('\n}', html.indexOf('return `${siglaBase} ${numero}/${mNum[2]}`', iNorm)) + 2;
const iComp = html.indexOf('//  OS DOIS CAMPOS — TR (SIGEF)');
const fComp = html.indexOf('// ── AS CONSULTAS RECENTES');
if (iNorm < 0 || iComp < 0 || fComp < 0 || fNorm <= iNorm) {
  console.error('FALHA: nao achei o bloco do componente (ou o normalizarProcesso) no index.html.');
  process.exit(1);
}
const codigo = (html.slice(iNorm, fNorm) + '\n' + html.slice(iComp, fComp))
  .replace(/^(let|const) /gm, 'var ');

// ── um DOM de mentira, com o minimo que o componente toca ───────────────────
const porId = {};
const grupos = [];
const handlers = { input: [], focusout: [], keydown: [], paste: [] };

function novoEl(props) {
  const cls = new Set();
  const el = Object.assign({
    value: '', textContent: '', tagName: 'INPUT',
    attrs: {},
    classList: {
      add: c => cls.add(c), remove: c => cls.delete(c),
      contains: c => cls.has(c),
      toggle: (c, v) => { const q = v === undefined ? !cls.has(c) : !!v; q ? cls.add(c) : cls.delete(c); return q; },
    },
    getAttribute: k => (k in el.attrs ? el.attrs[k] : null),
    setAttribute: (k, v) => { el.attrs[k] = v; },
    focus() { el.focado = true; },
    setSelectionRange() {},
    dispatchEvent() {},
    closest: () => el.grupo || null,
  }, props || {});
  return el;
}

/** Monta um grupo (as caixas + o span de aviso), como o innerHTML faria. */
function montarGrupo(id, tipo, modo, muda, enter) {
  const cps = tipo === 'tr' ? ['Ano', 'Num'] : ['Sigla', 'Num', 'Ano'];
  const aviso = novoEl({ tagName: 'SPAN', classe: 'cmpe' });
  const caixas = {};
  const g = novoEl({
    tagName: 'SPAN',
    attrs: { 'data-cg': id, 'data-tipo': tipo, 'data-modo': modo || 'busca',
             'data-muda': muda || '', 'data-enter': enter || '' },
    querySelector: (sel) => {
      if (sel === '.cmpe') return aviso;
      const m = sel.match(/data-cp="(\w+)"/);
      return m ? caixas[m[1]] || null : null;
    },
  });
  for (const cp of cps) {
    const c = novoEl({ attrs: { 'data-cg': id, 'data-cp': cp }, grupo: g });
    c.classList.add('cmpi');
    caixas[cp] = c;
    porId[id + cp] = c;
  }
  g.caixas = caixas; g.aviso = aviso; g.id = id;
  grupos.push(g);
  return g;
}

const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ctx = {
  console, escHtml, Set, Event: function () {},
  API_URL: '', window: {},
  LOGO_SIGEF_B64: 'data:image/png;base64,SIGEF',
  LOGO_SGPE_B64: 'data:image/png;base64,SGPE',
  fetch: async () => ({ json: async () => ({ data: {} }) }),
  document: {
    getElementById: (id) => porId[id] || null,
    querySelector: (sel) => {
      const m = sel.match(/data-cg="([^"]+)"/);
      return m ? grupos.find(g => g.getAttribute('data-cg') === m[1]) || null : null;
    },
    querySelectorAll: (sel) => grupos.filter(g =>
      !/data-tipo="proc"/.test(sel) || g.getAttribute('data-tipo') === 'proc'),
    addEventListener: (tipo, fn) => { if (handlers[tipo]) handlers[tipo].push(fn); },
  },
};
vm.createContext(ctx);
vm.runInContext(codigo, ctx);

const disparar = (tipo, ev) => handlers[tipo].forEach(fn => fn(ev));
const evento = (alvo, extra) => Object.assign({
  target: alvo, key: '', preventDefault() { this.barrado = true; },
}, extra || {});
const colar = (alvo, texto) => {
  const e = evento(alvo, { clipboardData: { getData: () => texto } });
  disparar('paste', e);
  return e;
};

// ════════════════════════════════════════════════════════════════════════════
console.log('\n═══ 1. LER O QUE FOI COLADO ═══');

const tr = ctx.campoTrPartir;
conf(JSON.stringify(tr('2021TR000411')) === '{"ano":"2021","numero":"000411"}', '"2021TR000411" parte em ano e numero');
conf(JSON.stringify(tr('2021tr411')) === '{"ano":"2021","numero":"411"}', 'minusculo e sem zeros tambem');
conf(tr('2021TR000411 ') !== null && tr(' 2021TR000411') !== null, 'espaco em volta nao atrapalha');
conf(tr('CENTRO EDUCACIONAL') === null, 'nome de entidade nao e TR');
conf(tr('2021PC000411') === null, 'codigo de PC nao e TR');
conf(tr('2021TR0004111') === null, 'sete digitos nao e TR');

const pr = ctx.campoProcPartir;
const igual = (o, s, nu, a) => o && o.sigla === s && o.numero === nu && o.ano === a;
conf(igual(pr('SCC 00000197/2021'), 'SCC', '00000197', '2021'), '"SCC 00000197/2021"');
conf(igual(pr('SCC197/2021'), 'SCC', '197', '2021'), '"SCC197/2021" — colado, sem zeros');
conf(igual(pr('scc 197/2021'), 'SCC', '197', '2021'), 'minuscula vira maiuscula');
conf(igual(pr('FCEE390/2019'), 'FCEE', '390', '2019'), '"FCEE390/2019"');
// ⚠️ A REGIAO SO ENTRA NA SIGLA COM SEPARADOR — a mesma trava do lib/sgpe-link.js.
conf(igual(pr('ADR20 00001233/2017'), 'ADR20', '00001233', '2017'), 'a regiao entra na sigla QUANDO ha separador');
conf(igual(pr('ADR19 0011181.2017'), 'ADR19', '0011181', '2017'), 'o ponto no lugar da barra tambem serve');
conf(igual(pr('ADR17867/2017'), 'ADR', '17867', '2017'), 'SEM separador todo digito e do numero — nunca chutar a regiao');
conf(pr('ADR2226792017') === null, 'sem barra nao forma processo — e ambiguo, e ambiguo se recusa');
conf(pr('SCC 6579') === null, 'sem ano nao forma processo');
conf(pr('CENTRO EDUCACIONAL SAO JOSE') === null, 'nome de entidade nao e processo');
conf(pr('2021NL012345') === null, 'NL nao e processo');

conf(ctx.campoAno4('21') === '2021', 'ano de 2 digitos vira 20xx');
conf(ctx.campoAno4('2021') === '2021', 'ano de 4 digitos fica como esta');

console.log('\n═══ 2. A COLAGEM CANONICA DAS BUSCAS LIVRES ═══');

const canon = ctx.campoColagemCanonica;
conf(canon('2021TR411') === '2021TR000411', 'TR sem zeros vira "2021TR000411"');
conf(canon('SCC 197/2021') === 'SCC 00000197/2021', 'processo vira "SCC 00000197/2021"');
conf(canon('SCC197/21') === 'SCC 00000197/2021', 'com ano de 2 digitos tambem');
conf(canon('ADR20 1233/2017') === 'ADR20 00001233/2017', 'a regional mantem a regiao na sigla');
// ⚠️ E O QUE NAO CASA VOLTA `null`: e isso que faz o campo livre continuar livre.
conf(canon('CENTRO EDUCACIONAL') === null, 'entidade volta null — a colagem nao mexe nela');
conf(canon('2021NL012345') === null, 'NL volta null');
conf(canon('2021PC001810') === null, 'codigo de PC volta null');
conf(canon('') === null, 'vazio volta null');

console.log('\n═══ 3. A MARCACAO ═══');

const htmlTr = ctx.campoTrHtml('t1', {});
const htmlPr = ctx.campoProcHtml('p1', { modo: 'cadastro' });
conf(/class="cmp-sigef"/.test(htmlTr) && /alt="SIGEF"/.test(htmlTr), 'o campo da TR traz o logo do SIGEF, com alt');
conf(/class="cmp-sgpe"/.test(htmlPr) && /alt="SGPe"/.test(htmlPr), 'o campo do processo traz o logo do SGPe, com alt');
conf(htmlTr.includes(ctx.LOGO_SIGEF_B64) && htmlPr.includes(ctx.LOGO_SGPE_B64), 'os dois leem das constantes do topo');
// ⚠️ O LOGO SUBSTITUI O ROTULO — nem "Transferencia" nem "Processo" ao lado.
// O que conta e o TEXTO VISIVEL. O `aria-label` e o `title` continuam dizendo o que e cada
// caixa — e assim que um leitor de tela sabe, e tira-los seria trocar um problema por outro.
// O rotulo que sumiu e o DESENHADO ao lado.
const visivel = (h) => h.replace(/="[^"]*"/g, '').replace(/<[^>]*>/g, ' ');
conf(!/Transfer|Processo|Sigla|N.mero|Ano/i.test(visivel(htmlTr) + visivel(htmlPr)),
     'nenhum rotulo de texto ao lado do logo', visivel(htmlTr) + '|' + visivel(htmlPr));
conf(/>TR</.test(htmlTr), 'o "TR" fixo esta entre as duas caixas da TR');
conf(/>\/</.test(htmlPr), 'a "/" fixa esta entre o numero e o ano do processo');
// ⚠️ A LARGURA E O NUMERO DE CARACTERES. Nunca a linha.
conf(/width:4ch/.test(htmlTr) && /width:6ch/.test(htmlTr), 'TR: 4ch para o ano, 6ch para o numero');
conf(/width:5ch/.test(htmlPr) && /width:9ch/.test(htmlPr) && /width:4ch/.test(htmlPr),
     'processo: 5ch sigla, 9ch numero, 4ch ano');
conf(!/width:100%|flex:1/.test(htmlTr + htmlPr), 'nenhuma caixa pede a linha inteira');
conf(/maxlength="6"/.test(htmlTr) && /maxlength="9"/.test(htmlPr), 'o maxlength acompanha a largura');
conf(/id="t1Ano"/.test(htmlTr) && /id="t1Num"/.test(htmlTr), 'os ids saem do nome do grupo');
conf(/id="p1Sigla"/.test(htmlPr) && /id="p1Num"/.test(htmlPr) && /id="p1Ano"/.test(htmlPr), 'idem no processo');
conf(/text-align:left/.test(htmlPr.match(/id="p1Sigla"[\s\S]*?>/)[0]), 'a sigla e o unico campo alinhado a esquerda');
conf(/data-modo="cadastro"/.test(htmlPr), 'o modo vai na marcacao do grupo');

console.log('\n═══ 4. LER E ESCREVER ═══');

const gTr = montarGrupo('acmpTr', 'tr');
const gPr = montarGrupo('procEd', 'proc', 'cadastro');
const gBu = montarGrupo('ciSg', 'proc', 'busca');

ctx.campoTrPor('acmpTr', '2021TR411');
conf(gTr.caixas.Ano.value === '2021' && gTr.caixas.Num.value === '000411', 'campoTrPor completa com zero a esquerda');
conf(ctx.campoTrLer('acmpTr') === '2021TR000411', 'campoTrLer devolve o codigo canonico');
gTr.caixas.Num.value = '';
conf(ctx.campoTrLer('acmpTr') === '', 'faltando parte, devolve string vazia — nunca "2021TR000000"');

ctx.campoProcPor('procEd', 'scc', '197', '2021');
conf(gPr.caixas.Sigla.value === 'SCC', 'campoProcPor sobe a sigla para maiuscula');
conf(ctx.campoProcLer('procEd') === 'SCC 00000197/2021', 'campoProcLer passa pelo normalizarProcesso da tela');
gPr.caixas.Ano.value = '';
conf(ctx.campoProcLer('procEd') === '', 'faltando o ano, devolve vazio');

console.log('\n═══ 5. A SIGLA — AVISA SEMPRE, IMPEDE SO NO CADASTRO ═══');

// A lista chega como o `GET /sgpe/siglas` a entrega.
ctx._SIGLAS = new Set(['SCC', 'FCEE', 'ADR20', 'SDR13', 'DC']);

ctx.campoProcPor('procEd', 'SCC', '197', '2021');
conf(gPr.caixas.Sigla.classList.contains('erro') === false, 'sigla conhecida nao marca');
conf(gPr.aviso.textContent === '', 'e nao escreve aviso');
conf(ctx.campoProcValido('procEd').ok === true, 'e deixa salvar');

ctx.campoProcPor('procEd', 'XPTO', '197', '2021');
conf(gPr.caixas.Sigla.classList.contains('erro') === true, 'sigla fora das 183 marca de vermelho');
conf(/sigla fora/i.test(gPr.aviso.textContent), 'e escreve o aviso curto ao lado');
const vCad = ctx.campoProcValido('procEd');
conf(vCad.ok === false && /XPTO/.test(vCad.motivo), 'no CADASTRO ela impede salvar, e diz por que');

ctx.campoProcPor('ciSg', 'XPTO', '197', '2021');
conf(gBu.caixas.Sigla.classList.contains('erro') === true, 'na BUSCA a mesma sigla tambem marca');
conf(ctx.campoProcValido('ciSg').ok === true, 'mas NAO impede buscar');

// ⚠️ SEM A LISTA, TUDO PASSA. Reprovar por causa de uma falha de rede travaria o cadastro.
ctx._SIGLAS = null;
ctx.campoProcPor('procEd', 'XPTO', '197', '2021');
conf(gPr.caixas.Sigla.classList.contains('erro') === false, 'lista ausente: ninguem e reprovado');
conf(ctx.campoProcValido('procEd').ok === true, 'e o salvar continua liberado');
ctx._SIGLAS = new Set(['SCC', 'FCEE', 'ADR20', 'SDR13', 'DC']);

// ⚠️ AS AMBIGUAS CONTAM COMO CONHECIDAS: elas EXISTEM no SGPe, e quem as recusa e o servidor.
conf(ctx.campoSiglaOk('DC') === true, 'sigla ambigua nao e marcada como erro');
conf(ctx.campoSiglaOk('') === true, 'vazio nao e erro de sigla — quem cobra e o botao');

console.log('\n═══ 6. FALTANDO PARTE, O MOTIVO SAI EM TEXTO ═══');

ctx.campoProcPor('procEd', 'SCC', '', '');
const vf = ctx.campoProcValido('procEd');
conf(vf.ok === false, 'sem numero e sem ano nao salva');
conf(/o n[uú]mero/.test(vf.motivo) && /o ano/.test(vf.motivo), 'e o motivo diz O QUE falta, nao so "invalido"');

console.log('\n═══ 7. DIGITANDO ═══');

gPr.caixas.Sigla.value = 'sc-c1!';
disparar('input', evento(gPr.caixas.Sigla));
conf(gPr.caixas.Sigla.value === 'SCC1', 'a sigla sobe para maiuscula e perde o que nao e letra nem digito');
// ⚠️ DIGITO NA SIGLA E LEGITIMO: ADR20 e SDR13 sao orgaos distintos no SGPe.
gPr.caixas.Sigla.value = 'ADR20';
disparar('input', evento(gPr.caixas.Sigla));
conf(gPr.caixas.Sigla.value === 'ADR20', 'e o digito da regional sobrevive');
gPr.caixas.Num.value = '1a9b7';
disparar('input', evento(gPr.caixas.Num));
conf(gPr.caixas.Num.value === '197', 'o numero fica so com digitos');

console.log('\n═══ 8. AO SAIR ═══');

gTr.caixas.Ano.value = '21'; gTr.caixas.Num.value = '411';
disparar('focusout', evento(gTr.caixas.Ano));
disparar('focusout', evento(gTr.caixas.Num));
conf(gTr.caixas.Ano.value === '2021', 'o ano de 2 digitos vira 20xx');
conf(gTr.caixas.Num.value === '000411', 'o numero da TR completa ate 6');

gPr.caixas.Num.value = '197';
disparar('focusout', evento(gPr.caixas.Num));
conf(gPr.caixas.Num.value === '00000197', 'o numero do processo completa ate 8');
gPr.caixas.Num.value = '123456789';
disparar('focusout', evento(gPr.caixas.Num));
conf(gPr.caixas.Num.value === '123456789', 'nove digitos nao sao mexidos — o padStart nunca corta');
gPr.caixas.Num.value = '';
disparar('focusout', evento(gPr.caixas.Num));
conf(gPr.caixas.Num.value === '', 'campo vazio continua vazio — nao vira "00000000"');

console.log('\n═══ 9. COLAR NUMA CAIXA DIVIDE ENTRE AS DO GRUPO ═══');

gTr.caixas.Ano.value = ''; gTr.caixas.Num.value = '';
let e = colar(gTr.caixas.Num, '2021TR000411');
conf(e.barrado === true, 'a colagem da TR e interceptada');
conf(gTr.caixas.Ano.value === '2021' && gTr.caixas.Num.value === '000411',
     'e o texto se divide entre as duas caixas — colado na do NUMERO');

gPr.caixas.Sigla.value = ''; gPr.caixas.Num.value = ''; gPr.caixas.Ano.value = '';
e = colar(gPr.caixas.Sigla, 'SCC 00000197/2021');
conf(e.barrado === true, 'a colagem do processo e interceptada');
conf(gPr.caixas.Sigla.value === 'SCC' && gPr.caixas.Num.value === '00000197' && gPr.caixas.Ano.value === '2021',
     'e se divide entre as tres — colado na da SIGLA, que so caberia 5 caracteres');

gPr.caixas.Sigla.value = ''; gPr.caixas.Num.value = ''; gPr.caixas.Ano.value = '';
colar(gPr.caixas.Ano, 'ADR20 1233/17');
conf(gPr.caixas.Sigla.value === 'ADR20' && gPr.caixas.Num.value === '00001233' && gPr.caixas.Ano.value === '2017',
     'a regional, com ano de 2 digitos, colada na caixa do ANO');

const antes = gPr.caixas.Sigla.value;
e = colar(gPr.caixas.Sigla, 'CENTRO EDUCACIONAL');
conf(e.barrado === undefined, 'texto que nao forma processo NAO e interceptado');
conf(gPr.caixas.Sigla.value === antes, 'e nenhuma caixa e mexida');

console.log('\n═══ 10. COLAR NUMA BUSCA LIVRE NORMALIZA SO O TRECHO ═══');

const livre = novoEl({ attrs: { 'data-colagem': '' }, value: '', selectionStart: 0, selectionEnd: 0 });
e = colar(livre, '2021TR411');
conf(e.barrado === true && livre.value === '2021TR000411', 'a TR colada sai canonica');

livre.value = ''; livre.selectionStart = 0; livre.selectionEnd = 0;
e = colar(livre, 'SCC 197/2021');
conf(e.barrado === true && livre.value === 'SCC 00000197/2021', 'o processo colado sai canonico');

// ⚠️ O CAMPO CONTINUA LIVRE: o que nao e TR nem processo passa direto.
livre.value = ''; livre.selectionStart = 0; livre.selectionEnd = 0;
e = colar(livre, 'CENTRO EDUCACIONAL SAO JOSE');
conf(e.barrado === undefined && livre.value === '', 'entidade nao e tocada — a colagem nem intercepta');
e = colar(livre, '2021NL012345');
conf(e.barrado === undefined, 'NL nao e tocada');

// E o trecho entra ONDE o cursor esta, sem apagar o que ja estava escrito.
livre.value = 'creche '; livre.selectionStart = 7; livre.selectionEnd = 7;
colar(livre, '2021TR411');
conf(livre.value === 'creche 2021TR000411', 'o que ja estava digitado nao e apagado');

const semAtributo = novoEl({ value: '' });
e = colar(semAtributo, '2021TR411');
conf(e.barrado === undefined && semAtributo.value === '', 'campo sem data-colagem nao e tocado');

// ════════════════════════════════════════════════════════════════════════════
console.log('\n═══ 11. NO ARQUIVO: OS SEIS LUGARES DO ESCOPO A ═══');

const chamada = (fn, id) => new RegExp(fn + "\\('" + id + "'").test(html);
conf(chamada('campoProcHtml', 'sgpe'), '4 — modal do SGPe (F4)');
conf(chamada('campoProcHtml', 'pnProc'), '5 — cadastro de PC na TR');
conf(chamada('campoProcHtml', 'procEd'), '6 — corrigir o processo (o lapis)');
conf(chamada('campoProcHtml', 'ciSg'), '7 — busca da fila do C.I.');
conf(chamada('campoProcHtml', 'ciBusca'), '8 — a caixa do F2 no C.I.');
conf(chamada('campoTrHtml', 'acmpTr'), '9 — filtro TR do Acompanhamento');

// ⚠️ OS TRES TRIOS ESCRITOS A MAO TEM DE TER SUMIDO. Enquanto um deles sobreviver, ha duas
// respostas para a mesma pergunta, e a que ninguem olhar diverge — armadilha 19.
conf(!/<input id="sgpeSigla"/.test(semComent), 'o trio `sgpe*` escrito a mao sumiu');
conf(!/<input id="ciSgSigla"/.test(semComent), 'o trio `ciSg*` sumiu');
conf(!/<input id="ciBuscaSigla"/.test(semComent), 'o trio `ciBusca*` sumiu');
conf(!/id="pnProcesso"/.test(semComent), 'o campo de texto livre do cadastro de PC sumiu');
conf(!/<input id="acmpTr"/.test(semComent), 'o campo de texto livre do filtro de TR sumiu');
conf(!/procEdNumero/.test(semComent), 'e a referencia ao antigo `procEdNumero` nao ficou orfa');

conf((html.match(/function campoTrHtml\(/g) || []).length === 1
  && (html.match(/function campoProcHtml\(/g) || []).length === 1,
  'a marcacao sai de DUAS funcoes, e ha uma so de cada');

console.log('\n═══ 12. NO ARQUIVO: AS BUSCAS LIVRES SO GANHARAM A COLAGEM ═══');

for (const [rot, id] of [['1 busca geral', 'fBusca'], ['2 filtro do Estoque', 'estBusca'],
     ['3 filtro da Minha Planilha', 'plBusca'], ['7b busca livre da fila do C.I.', 'ciQ'],
     ['10 busca geral do Acompanhamento', 'acmpQ'], ['11 filtro do relatorio CGE', 'relTR'],
     ['12 log do Estoque', 'estLogBusca']]) {
  conf(new RegExp('<input data-colagem[^>]*id="' + id + '"').test(html),
       rot + ' — continua <input> livre, com data-colagem');
}

console.log('\n═══ 13. NO ARQUIVO: AS DUAS CONSTANTES, E NENHUMA COPIA ═══');

conf(/^const LOGO_SIGEF_B64 = 'data:image\/png;base64,/m.test(html), 'LOGO_SIGEF_B64 no topo, em PNG');
conf(/^const LOGO_SGPE_B64  = 'data:image\/png;base64,/m.test(html), 'LOGO_SGPE_B64 no topo, em PNG');
// O nome antigo continua existindo, mas ja nao carrega base64 nenhum: e apelido.
conf(/const SGPE_LOGO = LOGO_SGPE_B64/.test(html), 'SGPE_LOGO virou apelido — o base64 nao ficou em dois lugares');
conf((html.match(/'data:image\/png;base64,/g) || []).length === 2,
     'ha exatamente DOIS base64 de PNG no arquivo — um por logo',
     (html.match(/'data:image\/png;base64,/g) || []).length);
conf(/\.cmp-sigef\{height:14px;width:auto/.test(html), 'o do SIGEF sai a 14px de altura, largura automatica');
conf(/\.cmp-sgpe\{height:20px;width:auto/.test(html), 'o do SGPe sai a 20px');

// ⚠️ A LISTA DAS 183 NAO PODE ESTAR AQUI. Ela vem do GET /sgpe/siglas, que a le do
// lib/sgpe-link.js. Uma copia neste arquivo seria a quarta do mapa ORGAOS.
conf(!/\bORGAOS\b/.test(semComent), 'o mapa ORGAOS nao foi copiado para o index.html');
conf(!/APSFS|SANTUR|CEASASC|SCPARCERIAS/.test(semComent), 'nem pedacos da lista de siglas');
conf(/fetch\(`\$\{API_URL\}\/sgpe\/siglas`\)/.test(html), 'as siglas vem da rota');
conf((html.match(/siglasCarregar\(\)/g) || []).length === 2,
     'e sao buscadas UMA vez ao carregar — a definicao e a chamada, nada mais',
     (html.match(/siglasCarregar\(\)/g) || []).length);

console.log('\n═══ 14. NO ARQUIVO: O CSS QUE FAZ A LARGURA VALER ═══');

// ⚠️ `.cmpg .cmpi`, NUNCA `.cmpi` SOZINHO. `.mc-campo input` e `.fg input` valem 0,1,1 e ja
// mandam `width:100%`; com 0,1,0 a caixa nasceria esticada dentro de todo modal.
conf(/\.cmpg \.cmpi\{/.test(html), 'a regra e `.cmpg .cmpi`, com especificidade para vencer o `width:100%`');
conf(!/^\.cmpi\{/m.test(semComent), 'e nao ha `.cmpi` sozinho, que perderia');
conf(/\.cmpg \.cmpi\{[^}]*box-sizing:content-box/.test(html), 'com box-sizing:content-box — a caixa mede os caracteres');
conf(/\.cmpg \.cmpi\.erro\{/.test(html), 'o erro e uma CLASSE');
conf(!/cmpi'\)\.style\.borderColor|classList[^)]*\)\.style\.border/.test(semComent), 'e nunca style.borderColor');

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n=== RESULTADO: ${ok} passaram · ${falhou} falharam ===\n`);
process.exit(falhou ? 1 : 0);
