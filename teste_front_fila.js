// CAMINHO: sigpc-gt/teste_front_fila.js
//
// A FILA DO DIA, A TARJA "FALTA AGORA" E O MENU QUE ENCOLHE  (12/10/2026)
//
// ⚠️ O QUE ELE GUARDA: as três frentes que nasceram da mesma queixa do Richard — *"eu agora
// voltei a analisar processos e acho bem confuso"*. As três EXECUTAM num DOM de mentira, em
// vez de casar texto no arquivo: casar texto prova que a frase existe, não que ela chega na
// tela (é a lição de `teste_front_faixa.js`).
//
// ⚠️ AS JANELAS TERMINAM EM MARCOS DO PRÓPRIO CÓDIGO, nunca num número de caracteres —
// armadilha 30, que já cobrou 11 falhas falsas numa sessão só.
//
// USO: node teste_front_fila.js

const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('./index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

/** Recorta do arquivo, de marco a marco. Devolve '' quando um dos dois não existe mais. */
const fatia = (de, ate) => {
  const i = html.indexOf(de);
  if (i < 0) return '';
  const f = html.indexOf(ate, i + de.length);
  return f < 0 ? '' : html.slice(i, f);
};

// ⚠️ `let`/`const` de topo NÃO viram propriedade do contexto do `vm` — o teste não conseguiria
// ler nem escrever as variáveis. Viram `var`, como em `teste_front_faixa.js`.
const paraVar = (js) => js
  .replace(/^let /gm, 'var ').replace(/^const /gm, 'var ');

// O DOM de mentira: só o que estas funções tocam.
function criarDoc() {
  const elementos = new Map();
  const novo = (id) => ({
    id, innerHTML: '', style: { cssText: '', display: '' }, dataset: {},
    parentElement: null, scrollIntoView() { this.rolou = true; }, focus() { this.focado = true; },
    querySelector() { return null; }, querySelectorAll() { return []; },
  });
  return {
    elementos,
    getElementById(id) { if (!elementos.has(id)) elementos.set(id, novo(id)); return elementos.get(id); },
    createElement() { return novo(''); },
    body: { appendChild() {} },
    _novo: novo,
  };
}

const baseCtx = (doc) => ({
  document: doc, console,
  escHtml: (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  planData: (d) => String(d || '').split('-').reverse().join('/'),
  toast: (m, t) => { baseCtx._toast = { m, t }; },
  vcOff: () => '',
  U: { id: 4, nome: 'Richard' },
  alvo: () => ({ id: 4 }),
  API_URL: 'http://x',
  window: {},
  setTimeout: (f) => f(),
});

// ──────────────────────────────────────────────────────────────────────────────
S('1. A TARJA "FALTA AGORA" — o que a parcela espera DE VOCÊ');
{
  const fonte = fatia('function pPasso(pa) {', 'function pFaixaPasso(pa) {');
  conf(fonte.length > 0, 'o trecho da tarja foi encontrado no arquivo');
  const doc = criarDoc();
  const ctx = { ...baseCtx(doc) };
  vm.createContext(ctx);
  new vm.Script(paraVar(fonte)).runInContext(ctx);

  const r = { tr: '2021TR002099' };
  const texto = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // ── o C.I. devolveu
  const devolvida = ctx.pFaltaAgora(r, { num: '1', ci_situacao: 'com_analista', baixada: true,
    parecer_tipo: 'Parecer Regular', enviado_ci: true, pcs: [{ status: 'baixada' }] });
  conf(/Falta agora: responder ao Controle Interno/.test(texto(devolvida)), 'o C.I. devolveu → "responder ao C.I."');
  conf(/pIrResponderCi\('2021TR002099','1'\)/.test(devolvida), 'e o botão leva ao campo de resposta que já existe');
  conf(/sua baixa está mantida/.test(texto(devolvida)), 'dizendo que a baixa está mantida — é a dúvida que todos têm');

  // ── baixada com parecer, sem C.I.
  const passo2 = ctx.pFaltaAgora(r, { num: '1', baixada: true, parecer_tipo: 'Parecer Regular',
    enviado_ci: false, pcs: [{ status: 'baixada' }] });
  conf(/Falta agora: encaminhar ao Controle Interno/.test(texto(passo2)), 'passo 2 → "encaminhar ao C.I."');
  conf(/pEnviarCI\(/.test(passo2), 'e chama a função de sempre, não uma nova');
  conf(/obrigatório/.test(texto(passo2)), 'lembrando que o encaminhamento é obrigatório');

  // ── sem parecer
  const passo1 = ctx.pFaltaAgora(r, { num: '1', baixada: false, parecer_tipo: null,
    enviado_ci: false, pcs: [{ status: 'analise' }] });
  conf(/Falta agora: registrar o parecer/.test(texto(passo1)), 'passo 1 → "registrar o parecer"');
  conf(/pAbrirPar\(/.test(passo1), 'e abre o modal do parecer');

  // ── diligência: a bola NÃO está com o analista
  const dilig = ctx.pFaltaAgora(r, { num: '1', baixada: false, parecer_tipo: null,
    enviado_ci: false, pcs: [{ status: 'diligencia' }] });
  conf(/Aguarda a entidade/.test(texto(dilig)), 'diligência → "aguarda a entidade"');
  conf(/não depende de você agora/.test(texto(dilig)), 'dizendo com todas as letras que não é com ele');
  conf(!/<button/.test(dilig), '⚠️ e SEM BOTÃO — cobrar aqui seria cobrar trabalho de outro');
  conf(!/FFF8E6/.test(dilig), 'e sem o amarelo da cobrança');

  // ── no C.I., esperando: não falta nada a ele
  const noCi = ctx.pFaltaAgora(r, { num: '1', baixada: true, parecer_tipo: 'P', enviado_ci: true,
    ci_situacao: 'na_fila', pcs: [{ status: 'baixada' }] });
  conf(noCi === '', 'parcela esperando o C.I. não ganha tarja — a faixa azul já diz onde está');

  // ── a reanálise se identifica
  const rean = ctx.pFaltaAgora(r, { num: '1', baixada: false, parecer_tipo: null, enviado_ci: false,
    pcs: [{ status: 'reanalise' }] });
  conf(/parecer da reanálise/.test(texto(rean)), 'na reanálise, o texto diz que o parecer é dela');
}

S('2. A TARJA É CHAMADA NOS DOIS RAMOS DO CARTÃO');
{
  // ⚠️ ARMADILHA 19: regra escrita num ramo só deixou o botão do C.I. inalcançável para 2.181
  // parciais, e nenhum dos 15 testes pegou. Aqui se conta.
  const chamadas = (html.match(/\$\{pFaltaAgora\(r, pa\)\}/g) || []).length;
  conf(chamadas === 2, 'a tarja aparece nos DOIS ramos — verde e aberto', chamadas);
  const iVerde = html.indexOf('${pFaltaAgora(r, pa)}');
  const iFaixa = html.indexOf('${pFaixaPasso(pa)}', iVerde);
  conf(iVerde > 0 && iFaixa > iVerde && iFaixa - iVerde < 120,
    'e ela vem ANTES da faixa de passo — primeiro o que falta, depois onde está');
}

// ──────────────────────────────────────────────────────────────────────────────
S('3. O MENU QUE ENCOLHE — "Agora" em cima, o resto atrás de "Mais ações"');
{
  const fonte = fatia('function acGrupo(titulo) {', 'async function acAbrir(');
  conf(fonte.length > 0, 'o trecho do menu foi encontrado');
  const doc = criarDoc();
  const ctx = { ...baseCtx(doc), AC_CORES: { situacao: { fg: '#1', bg: '#2' }, inativo: { fg: '#3', bg: '#4' } },
    acIcone: () => '<svg></svg>', _acSecao: 0, _acAberto: null, acReposicionar: () => {} };
  vm.createContext(ctx);
  new vm.Script(paraVar(fonte)).runInContext(ctx);

  const linhas = [
    ctx.acGrupo('Fluxo da análise'),
    ctx.acItem('Salvar situação', 'sit', 'x()', true, 'situacao'),
    ctx.acItem('Ver parecer', 'doc', 'y()', false, 'situacao', 'A parcial ainda não tem parecer'),
    ctx.acItem('Encaminhar ao C.I.', 'enviar', 'z()', false, 'situacao', 'Já está no Controle Interno'),
    ctx.acGrupo('Correções'),
    ctx.acItem('Corrigir situação', 'lapis', 'w()', true, 'correcao'),
    ctx.acItem('Solicitar volta do C.I.', 'carta', 'v()', false, 'correcao', 'O C.I. já devolveu'),
  ];
  const menu = ctx.acCompactar(linhas);

  conf(/Agora/.test(menu), 'há um grupo "Agora" no topo');
  const antesDoMais = menu.split('data-ac-mais')[0];
  conf((antesDoMais.match(/data-ativo="1"/g) || []).length === 2, 'com os DOIS itens disponíveis',
    (antesDoMais.match(/data-ativo="1"/g) || []).length);
  conf(!/data-ativo="0"/.test(antesDoMais), '⚠️ e NENHUM item desligado na primeira tela');
  conf(/⌄ Mais ações \(3\)/.test(menu), 'o botão diz quantos ficaram guardados');
  conf(/data-ac-resto[^>]*display:none/.test(menu), 'e o resto nasce fechado');

  // ⚠️ NADA SOME: os três desligados continuam no HTML, com o motivo.
  conf((menu.match(/data-ativo="0"/g) || []).length === 3, 'os três desligados continuam no menu');
  conf(/A parcial ainda não tem parecer/.test(menu), 'com o motivo de cada um — nada de item mudo');
  conf(/Já está no Controle Interno/.test(menu), 'inclusive o do C.I.');

  // Os grupos voltam no bloco escondido, e só os que têm item.
  const resto = menu.split('data-ac-resto')[1] || '';
  conf(/Fluxo da análise/.test(resto) && /Correções/.test(resto), 'os grupos acompanham os itens guardados');

  // Sem nada disponível, a mensagem explica em vez de deixar o topo vazio.
  ctx._acSecao = 0;
  const sóInativos = ctx.acCompactar([ctx.acGrupo('Fluxo da análise'),
    ctx.acItem('Ver parecer', 'doc', 'y()', false, 'situacao', 'ainda não há parecer')]);
  conf(/Nada a fazer nesta parcial agora/.test(sóInativos), 'sem item ativo, o topo explica o vazio');
  conf(/Mais ações \(1\)/.test(sóInativos), 'e o único item continua alcançável');

  // Tudo disponível: não há "Mais ações" nenhum.
  ctx._acSecao = 0;
  const sóAtivos = ctx.acCompactar([ctx.acGrupo('Fluxo'), ctx.acItem('A', 'sit', 'a()', true, 'situacao')]);
  conf(!/data-ac-mais/.test(sóAtivos), 'com tudo disponível, o botão "Mais ações" nem aparece');

  conf(/acCompactar\(linhas\)/.test(html), 'e a montagem do menu passa pelo compactador');
}

S('4. ABRIR "MAIS AÇÕES" TRAVA A ALTURA — senão o defeito volta');
{
  const fonte = fatia('function acGrupo(titulo) {', 'async function acAbrir(');
  const doc = criarDoc();
  const caixa = { style: { display: 'none' }, querySelectorAll: () => [1, 2, 3] };
  const bt = { innerHTML: '', parentElement: { querySelector: () => caixa } };
  const menuEl = { style: {} };
  const ctx = { ...baseCtx(doc), AC_CORES: { situacao: { fg: '', bg: '' }, inativo: { fg: '', bg: '' } },
    acIcone: () => '', _acSecao: 0, _acAberto: menuEl, acReposicionar: () => { ctx._repos = true; },
    window: { innerHeight: 800 } };
  vm.createContext(ctx);
  new vm.Script(paraVar(fonte)).runInContext(ctx);

  ctx.acMais(bt);
  conf(caixa.style.display === 'block', 'o clique abre o resto');
  conf(/Menos ações/.test(bt.innerHTML), 'e o botão troca de rótulo');
  conf(menuEl.style.maxHeight === '496px', '⚠️ a altura trava em 62% da janela', menuEl.style.maxHeight);
  conf(menuEl.style.overflowY === 'auto', 'com rolagem dentro do menu');
  conf(ctx._repos === true, 'e o menu se reposiciona — ele acabou de mudar de tamanho');

  ctx.acMais(bt);
  conf(caixa.style.display === 'none' && !menuEl.style.maxHeight, 'fechar devolve tudo ao normal');
}

// ──────────────────────────────────────────────────────────────────────────────
S('5. A FILA "PARA VOCÊ HOJE" — a tela SÓ MOSTRA');
{
  const fonte = fatia('let _filaDados = null;', '// ══════════════════════════════════════\n//  O BOTÃO "AÇÕES"')
    || fatia('let _filaDados = null;', '//  O BOTÃO "AÇÕES"');
  conf(fonte.length > 0, 'o trecho da fila foi encontrado');
  const doc = criarDoc();
  const ctx = { ...baseCtx(doc) };
  vm.createContext(ctx);
  new vm.Script(paraVar(fonte)).runInContext(ctx);

  ctx._filaDados = {
    total: 32, trs: 120, parcelas: 253,
    grupos: [
      { chave: 'ci_devolveu', rotulo: 'o C.I. devolveu', detalhe: 'respondê-los é o que destrava', cor: 'azul',
        qtd: 5, pcs: 5, itens: [{ tr: '2021TR001253', parcial_num: '1', pcs: 1, entidade: 'APAE', arquivada: true, so_final: false }] },
      { chave: 'sgpe_liberou', rotulo: 'o SGPe já liberou', detalhe: 'um clique cada, sem o C.I.', cor: 'ambar',
        qtd: 3, pcs: 3, itens: [{ tr: '2021TR001578', parcial_num: '1', pcs: 1, entidade: 'APAE',
          ci_entrada: '2025-11-13', ci_saida: '2025-11-14', so_final: false }] },
      { chave: 'falta_final', rotulo: 'falta só a FINAL', detalhe: '1 parecer encerra a TR', cor: 'verde',
        qtd: 10, pcs: 10, itens: [{ tr: '2020TR000935', parcial_num: 'FINAL', pcs: 1, entidade: 'APAE', so_final: true }] },
      { chave: 'diligencia', rotulo: 'em diligência ou reanálise', detalhe: 'esperam a entidade', cor: 'neutro',
        qtd: 14, pcs: 14, itens: [] },
    ],
    fonte: { unidade: 'a PARCELA', tabela: 'prestacoes_contas', grupos: 'um item num grupo só',
      sgpe: 'a passagem provada pela tramitação', fora: 'a arquivada sai' },
  };
  ctx.filaRender();
  const h = doc.getElementById('filaHoje').innerHTML;
  const texto = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  conf(/Para você hoje/.test(texto), 'o painel tem título');
  conf(/32 parcelas esperam uma ação sua/.test(texto), 'e diz o total, com o plural certo');
  conf(/120 TRs no acervo/.test(texto), 'com o tamanho do acervo ao lado');
  conf(/o C\.I\. devolveu/.test(texto) && /o SGPe já liberou/.test(texto)
    && /falta só a FINAL/.test(texto) && /em diligência ou reanálise/.test(texto),
    'os quatro grupos aparecem');
  conf(/>5</.test(h) && /10/.test(h) && /14/.test(h), 'com os números que o SERVIDOR mandou');
  conf(/Abaixo, a sua planilha de sempre/.test(texto), '⚠️ e o painel diz que a planilha continua abaixo');

  // ⚠️ A TELA NÃO CONTA NADA: nenhum `.length`, `reduce` ou `filter` sobre o acervo aqui.
  conf(!/\.reduce\(/.test(fonte), 'a tela não soma nada (armadilha 16)');
  conf(!/\.filter\(/.test(fonte.split('function filaAbrir')[0] || ''), 'e não recalcula grupo nenhum');

  // ── A FORMA, pedida pelo Richard em 12/10 vendo o painel no ar ─────────────
  // ⚠️ "as caixas deviam ter um contorno melhor e a escrita maior em caixa alta, assim como os
  // botões; mais robusto; as linhas um tom grafite". O que se guarda aqui é isso, e não um
  // gosto: painel sem contorno se dissolveu no fundo claro da planilha.
  conf(/border:2px solid var\(--grafite\)/.test(h), 'o painel tem moldura de 2px em grafite');
  conf(/border-right:2px solid var\(--grafite\)/.test(h), 'e as colunas se separam pelo mesmo grafite');
  conf((h.match(/border-right:2px solid var\(--grafite\)/g) || []).length === 3,
    '⚠️ três divisórias para quatro colunas — a última não tem',
    (h.match(/border-right:2px solid var\(--grafite\)/g) || []).length);
  conf(/font-size:34px;font-weight:900/.test(h), 'o número é 34px');
  conf(/font-size:14px;font-weight:900[\s\S]{0,60}text-transform:uppercase/.test(h),
    'o rótulo é 14px, peso 900 e CAIXA ALTA');
  conf(/letter-spacing:\.03em/.test(h), 'com entreletra — em caixa alta e 900 ela é o que mantém legível');
  conf(/text-transform:uppercase[\s\S]{0,40}letter-spacing:\.05em/.test(h), 'o botão também é caixa alta');
  conf(/box-shadow:0 2px 0 rgba\(0,0,0,\.18\)/.test(h), 'e tem relevo de 2px — ele afunda quando apertado');
  conf(/border-top:2px solid var\(--grafite\)/.test(h), 'o rodapé fecha com a mesma linha grafite');
  conf(/--grafite:#39443E/.test(html), 'e o grafite é uma variável do :root, não um literal espalhado');

  // Fila vazia: diz que não há nada, em vez de quatro zeros.
  ctx._filaDados = { total: 0, trs: 10, grupos: [], fonte: {} };
  ctx.filaRender();
  conf(/Nada esperando por você agora/.test(doc.getElementById('filaHoje').innerHTML),
    'sem pendência, o painel diz isso — e não quatro zeros');
}

S('6. O "FONTE" DA FILA — abre, fecha, e o estado mora no próprio botão');
{
  const fonte = fatia('let _filaDados = null;', '//  O BOTÃO "AÇÕES"');
  const doc = criarDoc();
  const ctx = { ...baseCtx(doc) };
  vm.createContext(ctx);
  new vm.Script(paraVar(fonte)).runInContext(ctx);
  ctx._filaDados = { total: 1, trs: 1, grupos: [], fonte: { unidade: 'a PARCELA', tabela: 'prestacoes_contas',
    grupos: 'um item num grupo só', sgpe: 'a passagem, não o teor', fora: 'a arquivada sai' } };

  const bt = doc.getElementById('filaFonteBt'); bt.dataset.aberto = '0';
  const bl = doc.getElementById('filaFonteBloco'); bl.style.display = 'none';
  ctx.filaFonte();
  conf(bt.dataset.aberto === '1', 'o estado mora no `data-aberto` do botão, nunca em sessionStorage');
  conf(bl.style.display === 'block', 'e o bloco abre');
  const t = bl.innerHTML.replace(/<[^>]+>/g, ' ');
  conf(/de onde vem/.test(t) && /a unidade/.test(t) && /a tabela/.test(t) && /o que NÃO entra/.test(t),
    'com as linhas do padrão: de onde vem · unidade · tabela · filtro · o que não entra');
  conf(/a passagem, não o teor/.test(t), '⚠️ e deixa claro que o SGPe prova a PASSAGEM, não o parecer');
  ctx.filaFonte();
  conf(bt.dataset.aberto === '0' && bl.style.display === 'none', 'o segundo clique fecha');
}

S('7. ABRIR UM GRUPO LISTA AS PARCELAS, E "ABRIR" LEVA À TR');
{
  const fonte = fatia('let _filaDados = null;', '//  O BOTÃO "AÇÕES"');
  const doc = criarDoc();
  const ctx = { ...baseCtx(doc), _planAlvo: null, planIrAoAlvo: () => { ctx._foi = true; } };
  vm.createContext(ctx);
  new vm.Script(paraVar(fonte)).runInContext(ctx);
  ctx._filaDados = { total: 3, trs: 2, grupos: [
    { chave: 'sgpe_liberou', rotulo: 'o SGPe já liberou', detalhe: '', cor: 'ambar', qtd: 1, pcs: 1,
      itens: [{ tr: '2021TR001578', parcial_num: '1', pcs: 1, entidade: 'APAE DE MARAVILHA',
        ci_entrada: '2025-11-13', ci_saida: '2025-11-14', so_final: false }] },
    { chave: 'falta_final', rotulo: 'falta só a FINAL', detalhe: '', cor: 'verde', qtd: 1, pcs: 1,
      itens: [{ tr: '2020TR000935', parcial_num: 'FINAL', pcs: 1, entidade: 'APAE', so_final: true }] },
  ], fonte: {} };

  const lista = doc.getElementById('filaLista');
  ctx.filaAbrir('sgpe_liberou');
  conf(lista.style.display === 'block', 'o grupo abre a lista');
  const t = lista.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  conf(/2021TR001578/.test(t), 'com a TR');
  // ⚠️ EM CAIXA ALTA desde 12/10 — pedido do Richard depois de ver o painel no ar.
  conf(/PARCIAL 1/.test(t), 'e a parcela, em caixa alta');
  conf(/o C\.I\. recebeu em 13\/11\/2025 e devolveu em 14\/11\/2025/.test(t),
    '⚠️ e as DUAS datas da passagem pelo C.I. — é o que sustenta a afirmação', t.slice(0, 90));

  ctx.filaAbrir('falta_final');
  conf(/FINAL/.test(lista.innerHTML) && /2020TR000935/.test(lista.innerHTML), 'outro grupo troca a lista');
  conf(lista.dataset.grupo === 'falta_final', 'e a lista sabe de quem é');
  ctx.filaAbrir('falta_final');
  conf(lista.style.display === 'none', 'clicar no mesmo grupo fecha');

  ctx.filaIr('2021TR001578', '1');
  conf(ctx._planAlvo && ctx._planAlvo.tr === '2021TR001578', '"Abrir" aponta o alvo da planilha');
  conf(ctx._foi === true, 'e usa o caminho de sempre (planIrAoAlvo), sem recarregar a tela');
}

S('8. A FILA NÃO PODE DERRUBAR A PLANILHA');
{
  const fonte = fatia('let _filaDados = null;', '//  O BOTÃO "AÇÕES"');
  conf(/A fila do dia não está disponível agora/.test(fonte),
    'sem a rota no ar, a fila avisa em vez de quebrar — a lição de 05/10');
  conf(/a sua planilha[\s\S]{0,30}continua abaixo/i.test(fonte), 'e diz que a planilha continua completa');
  conf(/alvo\(\)/.test(fonte), '⚠️ no "ver como", a fila é a DO ANALISTA (armadilha 22)');
  conf(/filaCarregar\(\)/.test(html.split('carregarAlertasPrazo()')[1] || ''),
    'e ela é carregada uma vez por visita, junto dos alertas — não a cada filtro');
  const iFila = html.indexOf('<div id="filaHoje"');
  const iResumo = html.indexOf('<div id="planResumo"');
  conf(iFila > 0 && iFila < iResumo, 'o painel fica ACIMA dos cinco números da planilha');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
