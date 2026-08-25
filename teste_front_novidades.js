// CAMINHO: sigpc-gt/teste_front_novidades.js
//
// A TELA NOVIDADES DO SISTEMA.  (25/08/2026)
//
// POR QUE ESTA SUITE EXISTE
// Cada mudanca do sistema virava mensagem de WhatsApp e PDF por e-mail. Quem nao leu a
// mensagem nao ficava sabendo, e quem entra depois nunca via. O que esta tela protege e o
// contrario disso — e os defeitos que a fariam falhar sao todos silenciosos: um recorte que
// esconde novidade, um "novo" que nunca aparece, um modal que abre toda navegacao.
//
//   node teste_front_novidades.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// As funcoes puras da tela.
const ini = html.indexOf('let _novidades = []');
const fim = html.indexOf('async function novMarcarTudo');
if (ini < 0 || fim < 0 || fim < ini) {
  console.error('FALHA: nao achei o bloco das novidades no index.html.');
  process.exit(1);
}
const ctx = { console, escHtml: (s) => String(s ?? '') };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const chamar = (e) => vm.runInContext(e, ctx);

console.log('\n═══ 1. O ITEM DE MENU E PARA TODOS ═══');
{
  conf(/rotulo:'Novidades',     acao:'irNovidades\(\)', pode:\(\)=>true/.test(html),
       'o item existe e `pode` devolve true para qualquer perfil');
  conf(/bloco:'analista'.{0,60}rotulo:'Novidades'/s.test(html), 'no bloco Principal');
  conf(/badge:'sbNovidBadge'/.test(html), 'com contador ao lado do rotulo');
  // ⚠️ O contador vem do servidor e some quando a pessoa ABRE a tela — nao quando ela navega.
  conf(/function novPintarBadge\(\)/.test(html), 'ha uma funcao unica que pinta o contador');
  const iB = html.indexOf('function novPintarBadge');
  conf(/style\.display = _novNaoLidas \? '' : 'none'/.test(html.slice(iB, iB + 400)),
       'e o badge SOME no zero, em vez de mostrar 0');
}

console.log('\n═══ 2. QUEM MARCA "VI ATE AQUI" — E QUANDO ═══');
{
  // ⚠️ A BUSCA NAO MARCA NADA. Se marcasse, o contador do menu zeraria sozinho na primeira
  // navegacao e ninguem chegaria a ver o numero.
  const iC = html.indexOf('async function novCarregar');
  const carregar = html.slice(iC, html.indexOf('function novPintarBadge'));
  conf(!/marcar_visto/.test(carregar), 'novCarregar NAO marca nada como visto');

  // ⚠️ E `irNovidades` marca DEPOIS de desenhar: a lista ja foi montada com o estado antigo,
  // entao as etiquetas "novo" continuam visiveis NESTA visita. Marcar antes faria a pessoa
  // abrir a tela e nao ver nada destacado — o oposto do que ela veio ver.
  const iI = html.indexOf('async function irNovidades');
  const abrir = html.slice(iI, html.indexOf('function novVisiveis'));
  conf(/marcar_visto/.test(abrir), 'irNovidades marca ao abrir a tela');
  conf(abrir.indexOf('novRender()') < abrir.indexOf('marcar_visto'),
       'e marca DEPOIS de desenhar, para as etiquetas "novo" aparecerem nesta visita');
}

console.log('\n═══ 3. OS CINCO CHIPS ═══');
{
  vm.runInContext(`_novidades = [
    {id:1, publico:'todos',            nova:true},
    {id:2, publico:'analistas',        nova:true},
    {id:3, publico:'coordenacao',      nova:false},
    {id:4, publico:'controle_interno', nova:false}]`, ctx);
  const conta = (c) => { vm.runInContext(`_novChip = '${c}'`, ctx); return ctx.novVisiveis().length; };
  conf(conta('tudo') === 4, 'Tudo traz as quatro');
  conf(conta('novas') === 2, '"Novas para voce" traz so as nao lidas');
  conf(conta('analistas') === 1, 'Para analistas recorta pelo publico');
  conf(conta('controle_interno') === 1, 'Controle Interno tambem');
  conf(conta('coordenacao') === 1, 'e Coordenacao');
  // ⚠️ "Tudo" e o padrao, e a tela SEMPRE abre nele — um recorte na abertura esconderia
  // novidade de quem nao sabe que existe um filtro ligado.
  conf(/let _novChip = 'tudo'/.test(html), 'o chip inicial e "tudo", escrito no codigo');
  // As cores da especificacao.
  conf(/id:'tudo',  rot:'Tudo',             n:_novContagem\.tudo  \?\? 0, bg:'#173404'/.test(html),
       'Tudo usa o verde escuro');
  conf(/id:'novas'.{0,80}bg:'#EEEDFE', fg:'#3C3489'/s.test(html), 'e "Novas para voce" o roxo claro');
}

console.log('\n═══ 4. O CARD ═══');
{
  vm.runInContext(`_novCategorias = { melhoria:{rotulo:'Melhoria', bg:'#E6F1FB', cor:'#185FA5'} }
                   _novPublicos = { todos:'Todos' }
                   _novPodePublicar = false`, ctx);
  const card = (o) => ctx.novCard(Object.assign({
    id:1, titulo:'Fila de trabalho', texto:'Agora da para ver quem esta com o que.',
    categoria:'melhoria', publico:'todos', data:'2026-08-25', nova:true,
    imagem_src:null, imagem_legenda:null, guia_url:null }, o));

  const nova = card({});
  conf(/border-left:3px solid #534AB7/.test(nova), 'nao lida ganha a borda esquerda roxa');
  conf(/>novo</.test(nova), 'e a etiqueta "novo"');
  conf(/font-size:14\.5px;font-weight:500/.test(nova), 'titulo em 14.5px peso 500');
  conf(/font-size:13px;color:var\(--ct\);line-height:1\.65/.test(nova), 'texto 13px, entrelinha 1.65');

  const lida = card({ nova:false });
  conf(!/border-left:3px solid/.test(lida), 'ja lida NAO tem borda');
  conf(!/>novo</.test(lida), 'nem etiqueta');

  // ── sem imagem e sem link: so texto. E o formato das mudancas nao visuais.
  conf(!/<img/.test(lida), 'sem imagem, o card nao desenha <img>');
  conf(!/Ver como é na tela/.test(lida) && !/Guia completo/.test(lida),
       'e sem link nenhum, nao ha rodape de botoes');

  // ── com imagem
  const comImg = card({ imagem_src:'https://drive.google.com/thumbnail?id=X&sz=w1600', imagem_legenda:'A tela nova' });
  conf(/<img src="https:\/\/drive\.google\.com\/thumbnail/.test(comImg), 'com imagem, desenha a <img>');
  // ⚠️ O RECUO DE 45px ALINHA COM O TITULO, e nao com o icone: 34px do quadrado + 11px do gap.
  conf(/margin:11px 0 0 45px/.test(comImg), 'recuada 45px, alinhada com o titulo');
  conf(/font-style:italic;color:var\(--ct\)/.test(comImg), 'com legenda em italico');
  conf(/Ver como é na tela/.test(comImg), 'e o botao de ampliar');
  // ⚠️ Imagem do Drive so aparece se o arquivo estiver compartilhado. Sem o aviso, o card
  // ficaria com um buraco silencioso e ninguem saberia que e questao de partilha.
  conf(/onerror=/.test(comImg) && /qualquer pessoa com o link/.test(comImg),
       'e um aviso no lugar dela quando nao carrega');

  const comGuia = card({ guia_url:'https://drive.google.com/file/d/G/view' });
  conf(/Guia completo/.test(comGuia) && /target="_blank"/.test(comGuia), 'o guia abre em outra aba');
  conf(/rel="noopener"/.test(comGuia), 'com rel=noopener');

  // ── editar/excluir so para quem publica
  conf(!/novExcluir\(/.test(nova), 'sem permissao, nao ha link de excluir');
  vm.runInContext('_novPodePublicar = true', ctx);
  conf(/novExcluir\(/.test(card({})), 'com permissao, aparece');
  vm.runInContext('_novPodePublicar = false', ctx);
}

console.log('\n═══ 5. A DATA DO GRUPO ═══');
{
  // ⚠️ CONSTRUIDA DAS PARTES, e nunca `new Date(iso)` — armadilha 25: `new Date('2026-08-25')`
  // e meia-noite UTC, que em Brasilia e dia 24, e o rotulo do grupo mostraria a data errada.
  conf(ctx.novDataLonga('2026-08-25') === '25 de agosto de 2026', 'a data por extenso',
       ctx.novDataLonga('2026-08-25'));
  conf(ctx.novDataLonga('2026-01-01') === '1 de janeiro de 2026', 'primeiro do ano tambem');
  conf(ctx.novDataLonga('2026-12-31') === '31 de dezembro de 2026', 'e o ultimo');
  conf(ctx.novDataLonga('2026-08-25T00:00:00.000Z') === '25 de agosto de 2026',
       'timestamp completo tambem funciona — o `pg` pode devolver assim');
  conf(!/new Date\(String\(iso\)\)/.test(html.slice(html.indexOf('function novDataLonga'),
       html.indexOf('function novDataLonga') + 500)), 'e NAO passa a string por new Date()');
}

console.log('\n═══ 6. O AVISO DO PRIMEIRO ACESSO ═══');
{
  const iA = html.indexOf('async function novAvisoInicial');
  const aviso = html.slice(iA, html.indexOf('function novAvisoVer'));
  conf(iA > 0, 'novAvisoInicial existe');
  // ⚠️ UMA VEZ POR SESSAO, e a marca e de MEMORIA — nao `localStorage`. Guardada no
  // navegador, quem entrasse amanha nao veria o aviso, e e quem passou dias fora que mais
  // precisa dele.
  conf(/if\(_novModalMostrado\) return/.test(aviso), 'aparece uma vez por sessao');
  conf(/let _novModalMostrado = false/.test(html), 'e a marca e de memoria');
  conf(!/localStorage[^\n]*novModal/.test(html), 'nao vai para o localStorage');
  // ⚠️ Sem nada novo, NAO aparece. Um aviso que abre dizendo "nada" ensina a fechar sem ler.
  conf(/if\(!_novNaoLidas\) return/.test(aviso), 'e nao aparece quando nao ha nada novo');
  // O texto e montado com template: `novidade${...>1?'s':''} desde sua ultima visita`.
  conf(/desde sua última visita/.test(aviso) && aviso.includes('${_novNaoLidas}'),
       'o titulo diz quantas e desde quando');
  conf(/slice\(0, 5\)/.test(aviso), 'mostra ate cinco titulos');
  conf(/e mais \$\{_novNaoLidas - novas\.length\}/.test(aviso), 'e diz quantas ficaram de fora');
  conf(/function novAvisoVer\(\) \{ fm\('moNovAviso'\); irNovidades\(\) \}/.test(html),
       '"Ver novidades" fecha o modal e leva a tela');
  conf(/onclick="fm\('moNovAviso'\)">Depois</.test(html), 'e "Depois" so fecha');
  // ⚠️ O modal mora no HTML GLOBAL: ele abre no LOGIN, antes de qualquer tela ser montada.
  const iBody = html.indexOf('<div class="mo" id="moNovAviso">');
  conf(iBody > 0 && iBody < html.indexOf('async function irNovidades'),
       'e o modal esta no HTML global, nao dentro da tela');
  // E o boot chama.
  conf(/novAvisoInicial\(\)/.test(html.slice(html.indexOf('sinoIniciar()'), html.indexOf('sinoIniciar()') + 500)),
       'o boot da sessao dispara o aviso');
}

console.log('\n═══ 7. O FORMULARIO E DO SUPERADMIN ═══');
{
  const iF = html.indexOf('function novAbrirForm');
  const form = html.slice(iF, iF + 400);
  // A tela recusa cedo, mas a trava de verdade e a do servidor — esconder botao nao e trava.
  conf(/if\(!_novPodePublicar\)/.test(form), 'a tela recusa quem nao pode publicar');
  conf(/_novPodePublicar = !!j\.pode_publicar/.test(html),
       'e o "pode publicar" vem do SERVIDOR, nao do perfil lido na tela');
  ['novFTitulo','novFTexto','novFCategoria','novFPublico','novFImagem','novFLegenda','novFGuia','novFData']
    .forEach(id => conf(html.includes(`id="${id}"`), `o campo ${id} existe`));
  conf(/O arquivo precisa estar compartilhado/.test(html),
       'e o formulario avisa que o Drive precisa estar compartilhado');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
