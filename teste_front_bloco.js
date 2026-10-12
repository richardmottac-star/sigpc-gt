// CAMINHO: sigpc-gt/teste_front_bloco.js
//
// O BLOCO DA PARCELA  (12/10/2026)
//
// ⚠️ O QUE ELE GUARDA: que cada parcela continue sendo um bloco FECHADO. O Richard abriu a
// 2021TR001578 e disse que a tela estava confusa — e o defeito não era o tamanho da letra: a
// faixa de passo e o bloco do C.I. ficavam soltos entre uma parcela e outra, e o "Passo 3 de 3"
// da FINAL aparecia logo abaixo da linha dela, parecendo conclusão da Parcial 1.
//
// ⚠️ E QUE A FAIXA NÃO VOLTE A SER PRETA. A primeira versão usou o grafite das linhas e virou um
// retângulo quase preto: *"essa cor destoa"*. O sistema é verde; o grafite é contorno.
//
// USO: node teste_front_bloco.js

const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('./index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ⚠️ A janela termina num MARCO DO PRÓPRIO CÓDIGO (armadilha 30).
const i = html.indexOf('function pBlocoCor(pa) {');
// ⚠️ O FIM É A FUNÇÃO SEGUINTE, e não uma frase do comentário dela: cortar no meio de um
// `/** ... */` deixa o comentário aberto e o `vm` recusa o trecho inteiro. Aconteceu aqui.
const fonte = i < 0 ? '' : html.slice(i, html.indexOf('function pFaltaAgora(r, pa) {', i));

const ctx = {
  console,
  escHtml: (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  planMoedaAgr: () => 'R$ 140.000,00',
  planAncora: (tr, n) => `pc-${tr}-${n}`,
  procHtml: (p) => `<a href="#" class="link-sgpe">${p}</a>`,
  procVazio: (p) => !p,
  procInvalido: () => false,
  procInvalidoTag: () => '',
  sgpeIconeConsulta: () => '<span class="icone-sgpe"></span>',
};
vm.createContext(ctx);
new vm.Script(fonte.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ')).runInContext(ctx);

const PARCELA = {
  num: '1', soFinal: false, qtd: 1, data_baixa: '2026-06-30',
  pcs: [{ codigo_pc: '2021PC002060', processo_pc: 'SCC 00011955/2022' }],
  ci_situacao: 'na_fila', arquivamento: null,
};
const TR = { tr: '2021TR001578', arquivada: false };

S('1. O BLOCO É FECHADO — e tem o âncora da parcela');
{
  conf(fonte.length > 0, 'o trecho do bloco foi encontrado');
  const abre = ctx.pBlocoAbre(TR, PARCELA);
  conf(/border:2px solid/.test(abre), 'a parcela ganha moldura própria de 2px');
  conf(/border-radius:11px/.test(abre) && /margin:13px/.test(abre), 'com cantos e respiro — ela é uma coisa só');
  conf(/id="pc-2021TR001578-1"/.test(abre), 'e carrega o âncora, pelo planAncora de sempre');
  // ⚠️ AS DUAS CHAMADAS: o bloco abre nos dois ramos do cartão (armadilha 19).
  conf((html.match(/\$\{pBlocoAbre\(r, pa\)\}/g) || []).length === 2, 'o bloco abre nos DOIS ramos',
    (html.match(/\$\{pBlocoAbre\(r, pa\)\}/g) || []).length);
  conf((html.match(/\$\{pFaixaParcela\(r, pa, \{/g) || []).length === 2, 'e a faixa é montada pela mesma função nos dois');
  conf((html.match(/\$\{pSubParcela\(r, pa, /g) || []).length === 2, 'a sub-linha também');
}

S('2. A FAIXA É VERDE INSTITUCIONAL — nunca preta');
{
  const c = ctx.pBlocoCor(PARCELA);
  conf(c.faixa === '#004D2B', 'em dia, a faixa é o verde escuro do sistema', c.faixa);
  conf(!/#232C27|#000|black/.test(JSON.stringify(c)), '⚠️ e o preto não voltou');
  const faixa = ctx.pFaixaParcela(TR, PARCELA, { marca: '✓ ', quando: 'baixada em 30/06/2026', acoes: '<button>Ações</button>' });
  conf(/background:#004D2B/.test(faixa), 'a faixa sai pintada de verde escuro');
  conf(/font-size:15px;font-weight:900;text-transform:uppercase/.test(faixa),
    'o nome da parcela é 15px, peso 900 e caixa alta');
  conf(/PARCIAL 1|Parcial 1/.test(faixa.replace(/<[^>]+>/g, '')), 'e diz qual parcela é');
  conf(/1 PC · R\$ 140\.000,00/.test(faixa.replace(/<[^>]+>/g, ' ')), 'com o tamanho dela ao lado');
  conf(/baixada em 30\/06\/2026/.test(faixa), 'e quando foi baixada');
  conf(/<button>Ações<\/button>/.test(faixa), 'as ações continuam na faixa');
}

S('3. QUANDO O C.I. DEVOLVEU, A FAIXA MUDA DE COR');
{
  // ⚠️ É o único estado em que a parcela espera uma ação — e a cor diz isso antes do texto.
  const devolvida = { ...PARCELA, ci_situacao: 'com_analista' };
  const c = ctx.pBlocoCor(devolvida);
  conf(c.faixa === '#7A5600', 'devolvida pelo C.I. → faixa âmbar escura', c.faixa);
  conf(c.borda === '#8A6100', 'e a moldura acompanha');
  // `na_fila` é o contrário: está com eles, e não há o que cobrar aqui.
  conf(ctx.pBlocoCor({ ci_situacao: 'na_fila' }).faixa === '#004D2B',
    '⚠️ "na fila" NÃO é devolução — continua verde');
  conf(ctx.pBlocoCor({ ci_situacao: 'encerrado' }).faixa === '#004D2B', 'encerrada também');
  conf(ctx.pBlocoCor(null).faixa === '#004D2B', 'e sem C.I. nenhum, verde');
}

S('4. OS LINKS DO SGPe PERMANECEM — e saem do procHtml');
{
  const sub = ctx.pSubParcela(TR, PARCELA, '<span class="pil">Parecer Regular</span>');
  conf(/link-sgpe/.test(sub), '⚠️ o link do processo continua lá');
  conf(/SCC 00011955\/2022/.test(sub), 'com o número do processo');
  conf(/icone-sgpe/.test(sub), 'e o ícone de consulta ao lado');
  conf(/Parecer Regular/.test(sub), 'as pílulas vêm junto');
  // ⚠️ UM procHtml POR PROCESSO DISTINTO: a parcela pode ter várias PCs no mesmo processo.
  const duas = { ...PARCELA, pcs: [
    { codigo_pc: 'A', processo_pc: 'SCC 1/2022' }, { codigo_pc: 'B', processo_pc: 'SCC 1/2022' },
    { codigo_pc: 'C', processo_pc: 'SCC 2/2022' }] };
  const s2 = ctx.pSubParcela(TR, duas, '');
  conf((s2.match(/link-sgpe/g) || []).length === 2, 'processo repetido aparece uma vez só',
    (s2.match(/link-sgpe/g) || []).length);
  // ⚠️ PC SEM PROCESSO CONTINUA DESENHANDO O `procHtml`, e isso é de propósito: é ele que
  // mostra o caso "sem processo" com o lápis para corrigir (armadilha 17). Filtrar aqui
  // esconderia justamente a PC que precisa de conserto.
  conf(/proc-sgpe/.test(ctx.pSubParcela(TR, { ...PARCELA, pcs: [{ codigo_pc: 'A', processo_pc: '' }] }, '')),
    'PC sem processo ainda chama o procHtml — é o caminho do conserto');
  // Sem pílula e sem PC nenhuma, a sub-linha não existe — faixa vazia é ruído.
  conf(ctx.pSubParcela(TR, { ...PARCELA, pcs: [] }, '') === '', 'sem nada para dizer, a sub-linha some');
}

S('5. A PARCELA ARQUIVADA RECUA, SEM SUMIR');
{
  const arq = { ...PARCELA, arquivamento: { estado: 'arquivada' } };
  conf(/opacity:\.62/.test(ctx.pBlocoAbre(TR, arq)), 'arquivada: o bloco inteiro esmaece');
  conf(!/opacity/.test(ctx.pBlocoAbre(TR, PARCELA)), 'e a normal não');
  // ⚠️ Com a TR inteira arquivada não há o que distinguir — todas estão.
  conf(!/opacity/.test(ctx.pBlocoAbre({ ...TR, arquivada: true }, arq)),
    'com a TR toda arquivada, nenhuma parcela esmaece');
}

S('6. A TR E OS AVISOS GANHARAM PESO');
{
  conf(/font-size:21px;font-weight:900[\s\S]{0,220}escHtml\(r\.tr\|\|'—'\)/.test(html),
    'o código da TR está em 21px e peso 900');
  conf(/A sua baixa está mantida[\s\S]{0,40}ela contou/.test(html), 'o aviso da baixa continua');
  const iOk = html.indexOf('✓ A sua baixa está mantida');
  conf(/border-left:6px solid var\(--v\)/.test(html.slice(Math.max(0, iOk - 420), iOk)),
    '⚠️ e ganhou barra lateral VERDE — é o aviso que tranquiliza');
  const iAt = html.indexOf('Ainda não dá para arquivar —');
  conf(/border-left:6px solid #8A6100/.test(html.slice(Math.max(0, iAt - 420), iAt)),
    '⚠️ o que COBRA ganhou barra âmbar — as duas cores se separam de relance');
  conf(/font-size:13\.5px/.test(html.slice(Math.max(0, iOk - 420), iOk)), 'e os dois subiram para 13,5px');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
