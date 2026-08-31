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
// ⚠️ O `procInvalido` VEM JUNTO, e nao e enfeite: ele pergunta se o `normalizarProcesso`
// produz algo que casa com a `PROC_RE`, entao mexer na normalizacao mexe NELE — e ele decide
// o que o analista ve (a etiqueta de processo invalido). Medir um sem o outro deixaria passar
// exatamente o efeito colateral que a secao 15 registra.
const iInv = html.indexOf('const PROC_RE =');
const fInv = html.indexOf('\n}', html.indexOf('function procInvalido(bruto)', iInv)) + 2;
if (iInv < 0 || fInv <= iInv) {
  console.error('FALHA: nao achei o PROC_RE / procInvalido no index.html.');
  process.exit(1);
}
// ⚠️ O `procPartes` TAMBEM VEM JUNTO. Ele e quem preenche as tres caixas do lapis ao abrir,
// e depende do `campoSiglaOk` do componente — testa-lo fora daqui exigiria uma segunda copia
// da lista de siglas, que e justamente o que este arquivo inteiro existe para nao ter.
const iPar = html.indexOf('function procPartes(bruto) {');
const fPar = html.indexOf('\n}', html.indexOf('return { sigla: campoSiglaOk(letras)', iPar)) + 2;
if (iPar < 0 || fPar <= iPar) {
  console.error('FALHA: nao achei o procPartes no index.html.');
  process.exit(1);
}
const codigo = (html.slice(iNorm, fNorm) + '\n' + html.slice(iInv, fInv) + '\n'
              + html.slice(iComp, fComp) + '\n' + html.slice(iPar, fPar))
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
// ⚠️ AS SIGLAS LONGAS DO CADASTRO (Richard, 31/08/2026). Sao 27 das 183 que passam de 5
// caracteres, e a maior real e `SCPARCERIAS`, com 11. Enquanto o `match` das letras parava em
// 8 ele era GULOSO e cortava no meio: "SCPARCERIAS 197/2021" saia com sigla `SCPARCER` e o
// resto virava numero — um processo de OUTRO orgao, montado em silencio. E silencio e o pior
// resultado possivel, a mesma razao da trava da regiao.
conf(igual(pr('SCPARCERIAS 197/2021'), 'SCPARCERIAS', '197', '2021'), '"SCPARCERIAS" — 11 letras, a maior real');
conf(igual(pr('SCPARCERIAS197/2021'), 'SCPARCERIAS', '197', '2021'), 'e colada ao numero tambem');
conf(igual(pr('FESPORTE 1234/2020'), 'FESPORTE', '1234', '2020'), '"FESPORTE" — 8 letras');
conf(igual(pr('CEASASC 45/2019'), 'CEASASC', '45', '2019'), '"CEASASC" — 7 letras');
conf(igual(pr('SANTUR 9/2018'), 'SANTUR', '9', '2018'), '"SANTUR" — 6 letras');
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
// ⚠️ NOS CAMPOS DE DIGITO A LARGURA E O NUMERO DE CARACTERES. Nunca a linha.
conf(/width:4ch/.test(htmlTr) && /width:6ch/.test(htmlTr), 'TR: 4ch para o ano, 6ch para o numero');
conf(/width:9ch/.test(htmlPr) && /width:4ch/.test(htmlPr), 'processo: 9ch para o numero, 4ch para o ano');
// ⚠️ A SIGLA E A EXCECAO, E POR DECISAO (Richard, 31/08/2026): 150px FIXOS, dimensionados pela
// MAIOR das 183 do cadastro do SGPe — `SAPIENS_EXTERNO_INAT`, com 20 caracteres. NENHUMA das
// 183 fica de fora da caixa. Com `SCC` sobra espaco, e e assim mesmo: caixa que encolhe com o
// conteudo faz o numero ao lado mudar de lugar a cada tecla.
const cxSigla = htmlPr.match(/id="p1Sigla"[\s\S]*?>/)[0];
conf(/width:150px/.test(cxSigla), 'a sigla tem 150px fixos');
conf(!/\dch/.test(cxSigla), 'e nao e medida em caracteres — a largura nao acompanha o conteudo');
conf(!/width:100%|flex:1/.test(htmlTr + htmlPr), 'nenhuma caixa pede a linha inteira');
conf(/maxlength="6"/.test(htmlTr) && /maxlength="9"/.test(htmlPr), 'o maxlength acompanha a largura');
conf(/maxlength="20"/.test(cxSigla), 'e a sigla aceita 20 — o tamanho da maior das 183');
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
ctx._SIGLAS = new Set(['SCC', 'FCEE', 'ADR20', 'SDR13', 'DC', 'SCPARCERIAS']);

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
ctx._SIGLAS = new Set(['SCC', 'FCEE', 'ADR20', 'SDR13', 'DC', 'SCPARCERIAS']);

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

// ⚠️ `SAPIENS_EXTERNO_INAT` PASSA, E CABE — decisao do Richard em 31/08/2026, corrigindo o
// que ele mesmo tinha dito antes. Ela E uma das 183 (cdOrgaosetor 15073) e e a MAIOR delas,
// com 20 caracteres: a caixa foi dimensionada por ela, e nenhuma das 183 fica de fora.
// A asserção anterior deste bloco dizia o contrário, e estava errada.
const _sig = ctx._SIGLAS;
ctx._SIGLAS = new Set(['SCC', 'SAPIENS', 'SAPIENS_EXTERNO_INAT']);
conf(ctx.campoSiglaOk('SAPIENS_EXTERNO_INAT') === true, 'esta na lista das 183 — PASSA');
conf('SAPIENS_EXTERNO_INAT'.length === 20 && /maxlength="20"/.test(cxSigla),
     'e cabe: 20 caracteres, e a caixa aceita 20');
ctx.campoProcPor('procEd', 'SAPIENS_EXTERNO_INAT', '1', '2020');
conf(gPr.caixas.Sigla.value === 'SAPIENS_EXTERNO_INAT', 'entra inteira na caixa, sem corte');
conf(gPr.caixas.Sigla.classList.contains('erro') === false, 'sem borda vermelha');
conf(ctx.campoProcValido('procEd').ok === true, 'e o salvar liberado, mesmo em modo cadastro');

// ⚠️ ATE 31/08 AQUI HAVIA UM DEFEITO REGISTRADO, e ele foi CONSERTADO na mesma data: o
// `campoProcLer` devolvia "SAPIENS _EXTERNO_INAT 1/2020", com um espaco no meio da sigla,
// porque o `normalizarProcesso` REMONTAVA o texto ao desistir de le-lo. Agora ele devolve a
// entrada como veio (ver a secao 15), e o valor chega inteiro ao servidor.
//
// ⚠️ E ELE NAO SAI CANONICO — o numero NAO ganha zero a esquerda. Nao e descuido: a funcao
// nao consegue LER esta sigla (a classe `[A-Za-zÀ-ÿ]+` para no `_`), e devolver o texto como
// veio e justamente o que ela faz quando nao le. Preservar vale mais que padronizar; inventar
// um formato para o que nao se entendeu foi o defeito anterior.
conf(ctx.campoProcLer('procEd') === 'SAPIENS_EXTERNO_INAT 1/2020',
     'campoProcLer devolve a sigla INTEIRA, sem espaco no meio', ctx.campoProcLer('procEd'));
conf(!/ _/.test(ctx.campoProcLer('procEd')), 'e nenhum espaco antes do `_`');

// ⚠️ AGORA ELA SE FORMA NO TECLADO — o `_` entrou no filtro do `oninput` (Richard,
// 31/08/2026). E a UNICA das 183 que o traz; sem isto os dois underscores caiam e sobrava
// `SAPIENSEXTERNOINAT`, de 18, que nao e a chave e caia como sigla desconhecida.
// ⚠️ O `_` ENTROU SO NO FILTRO. A colagem (`campoProcPartir`) e a normalizacao
// (`normalizarProcesso`) continuam exatamente como estavam — ordem do Richard: aquela regex e
// a chave de comparacao com o banco, validada em 95,8%, e mexer nela reabre a conciliacao.
gPr.caixas.Sigla.value = 'sapiens_externo_inat';
disparar('input', evento(gPr.caixas.Sigla));
conf(gPr.caixas.Sigla.value === 'SAPIENS_EXTERNO_INAT', 'digitada, o "_" SOBREVIVE ao filtro');
conf(ctx.campoSiglaOk(gPr.caixas.Sigla.value) === true, 'e o que fica E a chave das 183');
conf(gPr.caixas.Sigla.classList.contains('erro') === false, 'sem borda vermelha');
// ⚠️ E o `_` entrou so na SIGLA. Nos campos de numero ele continua caindo, como todo o resto
// que nao e digito — sao caixas de numero do SIGEF, e ali `_` nunca quis dizer nada.
gPr.caixas.Num.value = '19_7';
disparar('input', evento(gPr.caixas.Num));
conf(gPr.caixas.Num.value === '197', 'e no campo de numero o "_" continua caindo');
ctx._SIGLAS = _sig;

// ⚠️ O FORMATO DO LAPIS E A QUARTA PORTA, e ela tambem tinha de abrir. Sao quatro em serie:
// filtro do `oninput` · `maxlength` · lista das 183 · formato do `procEdMudou`. Com `[A-Z]`
// sem o `_`, a sigla atravessava as tres primeiras, chegava inteira, e a quarta a reprovava
// como "Sigla invalida" com o Salvar apagado — no UNICO modal que existe para consertar o
// acervo. Liberar so o filtro teria entregue a metade que nao se ve.
const RE_LAPIS = /^[A-Z_]{2,20}\d{0,2}$/;
conf(html.includes('/^[A-Z_]{2,20}\\d{0,2}$/'), 'o formato do lapis aceita `_` na sigla');
conf(RE_LAPIS.test('SAPIENS_EXTERNO_INAT'), 'e a sigla de 20 com `_` passa por ele');
conf(RE_LAPIS.test('ADR20') && RE_LAPIS.test('SCC') && RE_LAPIS.test('SCPARCERIAS'),
     'sem soltar o que ja passava — ADR20, SCC, SCPARCERIAS');

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

gPr.caixas.Sigla.value = ''; gPr.caixas.Num.value = ''; gPr.caixas.Ano.value = '';
colar(gPr.caixas.Num, 'SCPARCERIAS 197/2021');
conf(gPr.caixas.Sigla.value === 'SCPARCERIAS' && gPr.caixas.Num.value === '00000197'
     && gPr.caixas.Ano.value === '2021', 'a sigla de 11 letras cabe inteira na caixa');

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
console.log('\n═══ 15. `normalizarProcesso` — DESISTIR É DEVOLVER A ENTRADA ═══');
//
// ⚠️ ESTA FUNCAO E A CHAVE DE COMPARACAO COM O BANCO, e mexer nela reabre a conciliacao —
// e por isso que o que mudou em 31/08/2026 foi SO o que ela devolve nos DOIS ramos em que ela
// ja desistia. Antes eles remontavam `${siglaBase} ${resto}`, e aquele espaco e o separador
// entre sigla e numero: nos ramos de desistencia nao ha numero, e ele caia DENTRO da coisa que
// a regex de cima tinha partido.
//
// ⚠️ O CASO QUE PROVOU: `SAPIENS_EXTERNO_INAT` e a unica das 183 com `_`, e `[A-Za-zÀ-ÿ]+`
// para nele. Sobrava "SAPIENS _EXTERNO_INAT 1/2020" — e `SAPIENS` sozinho e OUTRO orgao das
// 183 (31525, contra 15073). Texto partido virando nome de orgao que existe e o pior
// resultado possivel, o mesmo da trava da regiao.
const norm = ctx.normalizarProcesso;

conf(norm('SAPIENS_EXTERNO_INAT 1/2020') === 'SAPIENS_EXTERNO_INAT 1/2020',
     'a sigla com `_` volta INTEIRA, sem espaco no meio', norm('SAPIENS_EXTERNO_INAT 1/2020'));
// ⚠️ O QUE NAO PODE MUDAR: tudo o que a funcao JA normalizava continua igual — sao os ramos
// que casam, e eles nao foram tocados. Estes sao os quatro formatos que o acervo usa em volume.
conf(norm('SCC 197/2021') === 'SCC 00000197/2021', 'SCC 197/2021 normaliza como antes');
conf(norm('SCC19172/2020') === 'SCC 00019172/2020', 'colado sem zeros, idem');
conf(norm('ADR20 1234/2019') === 'ADR20 00001234/2019', 'ADR20 1234/2019 continua igual');
conf(norm('SDR13 458/2017') === 'SDR13 00000458/2017', 'a regional continua com a regiao na sigla');
conf(norm('SST 1234/2020') === 'SST 1234/2020', 'e o SST continua com 4 digitos, nao 8');
conf(norm('') === '—' && norm('   ') === '—', 'vazio continua devolvendo o travessao');

// Os dois ramos de desistencia, um a um, com valores REAIS do acervo.
conf(norm('SCC7537') === 'SCC7537', 'ramo `!mNum`: devolve a entrada, sem inventar espaco');
conf(norm('ADR19 0011181.2017') === 'ADR19 0011181.2017', 'ramo `!mRegiao`: idem');
conf(norm('adr19 0011181.2017') === 'adr19 0011181.2017', 'e sem forcar maiuscula no que nao leu');

// ⚠️⚠️ EFEITO COLATERAL MEDIDO, RELATADO E **NAO COMPENSADO** — espera decisao do Richard.
// `procInvalido` pergunta se `normalizarProcesso` produz algo que casa com a `PROC_RE`. Como a
// desistencia deixou de remontar, UM valor real do acervo mudou de lado: `SCC732 3/2021` —
// espaco no meio do numero, 2 PCs numa TR. Antes a remontagem virava "SCC 732 3/2021", que a
// PROC_RE recusava; agora o texto cru "SCC732 3/2021" a satisfaz, porque `[A-Z0-9]+` engole
// "SCC732" como se fosse sigla. Resultado: essas 2 PCs PERDERAM a etiqueta de invalido.
// Nenhum outro dos 11 valores malformados do acervo mudou de lado — medido, nao presumido.
// ⚠️ Compensar isso e mexer na `PROC_RE`, que decide o que o analista ve. E regra, e nao foi
// pedida. Este `conf` guarda o que ACONTECE hoje: se alguem mudar, ele reprova.
// ⚠️ OS ONZE, UM A UM — nao uma amostra. A frase "nenhum outro mudou de lado" so vale se os
// onze forem conferidos; conferir quatro e afirmar onze e a armadilha 27 na sua forma de
// teste (lista cortada mente). A contagem de PCs vem do PROCESSOS_MALFORMADOS.csv, medida em
// 30/08/2026, e conta so o campo `processo_pc`.
const MALFORMADOS = [
  ['-1',                   63, true,  'marcador de ausencia'],
  ['AR355478172',          21, true,  'nao forma processo'],
  ['ADR19 0011181.2017',   19, true,  'ponto no lugar da barra'],
  // ⚠️ FALSO NEGATIVO ANTERIOR A TUDO ISTO, e NAO tocado: o ramo ADR le "1181/2017" como
  // regiao 11 + numero 81, entao a `PROC_RE` casa e ele nunca foi marcado. Sao 19 PCs, e a
  // sigla `ADR` sem regiao nem esta nas 183. Fica registrado; consertar e outra frente.
  ['ADR 1181/2017',        19, false, 'FALSO NEGATIVO ANTIGO — lido como regiao 11'],
  // ⚠️ O UNICO QUE MUDOU DE LADO com a correcao dos ramos de desistencia.
  ['SCC732 3/2021',         2, false, 'MUDOU: era true, virou false'],
  ['SCC7537',               2, true,  'sem ano'],
  ['SCC 6579',              1, true,  'sem ano'],
  ['ar355478172',           0, true,  'idem, em minuscula, no processo_mae'],
  ['ER221202154',           0, true,  'nao forma processo'],
  ['adr19 0011181.2017',    0, true,  'idem, em minuscula'],
  ['Adr 1181/2017',         0, false, 'mesmo falso negativo, no processo_mae'],
];
conf(MALFORMADOS.length === 11, 'os 11 valores malformados distintos do acervo estao na tabela');
for (const [valor, , esperado, nota] of MALFORMADOS) {
  conf(ctx.procInvalido(valor) === esperado,
       `procInvalido(${JSON.stringify(valor)}) === ${esperado}  — ${nota}`);
}

// ⚠️ E A PROVA DE QUE SO UM MUDOU E FEITA RODANDO AS DUAS VERSOES, nao afirmada em prosa.
// O "antes" e reconstruido desfazendo as duas linhas no proprio codigo extraido — se alguem
// mexer nos ramos de desistencia de novo, esta contagem muda e o teste avisa.
const ANTES = (() => {
  const src = (html.slice(iNorm, fNorm) + '\n' + html.slice(iInv, fInv))
    .replace('if(!mRegiao) return s', 'if(!mRegiao) return `${siglaBase} ${resto}`')
    .replace('if(!mNum) return s', 'if(!mNum) return `${siglaBase} ${resto}`');
  const c = { console }; vm.createContext(c); vm.runInContext(src, c); return c;
})();
conf(ANTES.normalizarProcesso('SCC7537') === 'SCC 7537',
     'a versao ANTERIOR foi reconstruida — ela remonta, como remontava');

const viraram = MALFORMADOS.filter(([v]) => ANTES.procInvalido(v) !== ctx.procInvalido(v));
conf(viraram.length === 1, `exatamente UM dos 11 mudou de lado`, viraram.map(x => x[0]).join(', '));
conf(viraram.length === 1 && viraram[0][0] === 'SCC732 3/2021', 'e e o `SCC732 3/2021`');

const somaPCs = (ctxo) => MALFORMADOS.reduce((n, [v, pcs]) => n + (ctxo.procInvalido(v) ? pcs : 0), 0);
conf(somaPCs(ANTES) === 108, 'PCs marcadas invalidas ANTES: 108', somaPCs(ANTES));
conf(somaPCs(ctx) === 106, 'PCs marcadas invalidas DEPOIS: 106', somaPCs(ctx));

conf(ctx.procInvalido('SCC 197/2021') === false && ctx.procInvalido('ADR20 1234/2019') === false,
     'sem marcar de invalido o que e valido');

// ════════════════════════════════════════════════════════════════════════════
console.log('\n═══ 16. `procPartes` — O PROCESSO GRUDADO NO LAPIS ═══');
//
// ⚠️ A VERSAO ANTERIOR QUEBRAVA TODO PROCESSO GRUDADO. A regex era
// `^([A-Za-z]+\d{0,3})...` e o `\d{0,3}` e GULOSO: comia tres digitos do NUMERO e os colava
// na sigla. Medido no navegador em 31/08/2026, na versao publicada — `SCC14778/2021` abria o
// lapis com sigla "SCC147" e numero "78", e com a caixa da sigla VERMELHA, acusando erro numa
// sigla que a pessoa nunca digitou. De 55 valores reais do acervo, 31 abriam vermelhos.
//
// A regra: no grudado a sigla e o MAIOR PREFIXO DE LETRAS QUE ESTA NA LISTA DAS 183, e o
// resto e o numero. Quem decide onde a sigla termina e a lista — a mesma que pinta a borda.
ctx._SIGLAS = new Set(['SCC', 'FCEE', 'SST', 'ADR20', 'SDR13', 'SDR02', 'SCPARCERIAS',
                       'SAPIENS', 'SAPIENS_EXTERNO_INAT']);
const pp = (v) => { const p = ctx.procPartes(v); return `${p.sigla}|${p.numero}|${p.ano}`; };

// GRUDADO — o caso que motivou tudo, e os irmaos dele no acervo.
conf(pp('SCC14778/2021') === 'SCC|00014778|2021', 'SCC14778/2021 -> SCC · 00014778 · 2021', pp('SCC14778/2021'));
conf(pp('SCC3538/2020') === 'SCC|00003538|2020', 'SCC3538/2020 nao vira SCC353 · 8', pp('SCC3538/2020'));
conf(pp('FCEE390/2019') === 'FCEE|00000390|2019', 'FCEE390/2019 nao vira FCEE39 · 0', pp('FCEE390/2019'));
conf(pp('SST1234/2020') === 'SST|00001234|2020', 'SST1234/2020 nao vira SST123 · 4', pp('SST1234/2020'));
conf(pp('SCPARCERIAS14778/2021') === 'SCPARCERIAS|00014778|2021', 'e a sigla de 11 letras, grudada');

// COM SEPARADOR — o que ja funcionava tem de continuar igual.
conf(pp('SCC 197/2021') === 'SCC|00000197|2021', 'com espaco: SCC · 00000197 · 2021');
conf(pp('SCC 00019172/2020') === 'SCC|00019172|2020', 'com zeros ja postos, idem');
conf(pp('ADR20 1233/2017') === 'ADR20|00001233|2017', 'a regional mantem a regiao na sigla');
conf(pp('SDR02 00001076/2013') === 'SDR02|00001076|2013', 'idem para SDR');
conf(pp('SAPIENS_EXTERNO_INAT 1/2020') === 'SAPIENS_EXTERNO_INAT|00000001|2020', 'e a sigla com `_`');

// ⚠️ NENHUM PREFIXO NA LISTA: sigla VAZIA, numero inteiro, e SEM vermelho. `ADR` sozinho nao
// esta nas 183, e `AR` nao e sigla nenhuma — inventar uma seria pior que deixar a pessoa
// completar.
conf(pp('ADR2226792017') === '|2226792017|', 'ADR2226792017: sigla vazia, numero inteiro');
conf(pp('AR355478172') === '|355478172|', 'AR355478172: idem');
conf(ctx.procPartes('ADR2226792017').sigla === '', 'e sigla vazia NAO pinta vermelho (campoMarcar so marca preenchida)');

// ⚠️ E NAO SE INVENTA NUMERO. "SCC732 3/2021" tem espaco no meio do numero; juntar os digitos
// daria "7323", que nao e o numero de processo nenhum.
conf(pp('SCC732 3/2021') === 'SCC||2021', 'texto que nao forma numero: a caixa do meio fica vazia');
conf(pp('-1') === '||', 'o marcador de ausencia nao vira numero');

// ⚠️ SEM A LISTA, degrada para o comportamento antigo do caso comum: as letras viram a sigla.
const _s16 = ctx._SIGLAS;
ctx._SIGLAS = null;
conf(pp('SCC14778/2021') === 'SCC|00014778|2021', 'lista fora do ar: as letras viram a sigla, e o numero fica certo');
ctx._SIGLAS = _s16;

// ⚠️ E NENHUM DELES ABRE VERMELHO — que era o defeito relatado.
const GRUDADOS = ['SCC14778/2021','SCC3538/2020','SCC19836/2021','FCEE390/2019','SST1234/2020',
                  'SCC9460/2021','SCC702/2022','SCC13297/2020','ADR2226792017','AR355478172'];
const vermelhos = GRUDADOS.filter(v => { const p = ctx.procPartes(v); return p.sigla && !ctx.campoSiglaOk(p.sigla); });
conf(vermelhos.length === 0, 'nenhum grudado abre com a sigla vermelha', vermelhos.join(', '));

console.log('\n═══ 17. O EXPANDIR DO MODAL DO SGPe (F4) ═══');
//
// ⚠️ MEDIDO NO NAVEGADOR, na versao publicada: o botao FUNCIONA quando o `sessionStorage`
// responde (860px -> 1711px e de volta). Com ele bloqueado — janela anonima, cookies de
// terceiros barrados — o `sgpeCheiaLer()` devolve `false` para sempre, o `!` do clique da
// `true` toda vez, e a janela expande no primeiro clique e NUNCA MAIS volta: quatro cliques
// seguidos, 1711px nos quatro.
// O estado passou a sair do proprio elemento (`data-cheia`), que e quem sabe o tamanho que
// tem. O `sessionStorage` continua, e continua sendo lido NA ABERTURA — que e onde ele serve.
conf(/mc\.dataset\.cheia\s*=\s*cheia \? '1' : '0'/.test(semComent),
     'quem aplica o tamanho carimba o estado no elemento');
conf(/function sgpeEstaCheia\(mc\)\s*\{\s*return !!mc && mc\.dataset\.cheia === '1'/.test(semComent),
     'e ha uma funcao que le esse estado de volta');
conf(/const c = !sgpeEstaCheia\(mc\)/.test(semComent), 'o clique alterna a partir do ELEMENTO');
conf(!/const c = !sgpeCheiaLer\(\)/.test(semComent), 'e nao a partir do sessionStorage');
// ⚠️ O sessionStorage NAO saiu: ele lembra o tamanho entre janelas na mesma sessao.
conf(/sgpeCheiaGravar\(c\)/.test(semComent), 'a escolha continua sendo gravada');
conf(/sgpeAplicarTamanho\(mc, btExp, sgpeCheiaLer\(\)\)/.test(semComent),
     'e continua sendo lida na ABERTURA da janela');

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n=== RESULTADO: ${ok} passaram · ${falhou} falharam ===\n`);
process.exit(falhou ? 1 : 0);
