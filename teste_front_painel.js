// CAMINHO: sigpc-gt/teste_front_painel.js
//
// Testes do PAINEL da Minha Planilha: ordenações, chips e o alfinete.
// Extrai as funções do próprio index.html e roda em Node. Sem navegador, sem rede.
//
// USO: node teste_front_painel.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// o bloco do painel + as funções de prazo/ano de que ele depende
const trechos = [
  ['function anoTR(', '// O botão Buscar, um só para todas as telas.'],
  ['function prazoDias(', 'function prazoCelula('],
  ['let _planPrefs', 'function planOrdParciais('],
];
let codigo = '';
for (const [de, ate] of trechos) {
  const i = html.indexOf(de), f = html.indexOf(ate, i);
  if (i < 0 || f < 0) { console.error('FALHA: nao achei o trecho', de); process.exit(1); }
  codigo += html.slice(i, f) + '\n';
}

// ⚠️ `API_URL` precisa estar aqui: `planSalvarPref` engole erro no catch (falha de rede não
// pode quebrar a tela), então sem ele o ReferenceError sumiria e o teste passaria em falso.
const ctx = { console, API_URL: 'http://api.teste', fetch: async () => ({ json: async () => ({ data: [] }) }),
              U: { id: 4 }, PP: 50, window: {} };
vm.createContext(ctx);
vm.runInContext(codigo, ctx);
const { planOrdenar, planChip, planFixar, planToggle } = ctx;
const PLAN_CHIPS = vm.runInContext('PLAN_CHIPS', ctx);
const PLAN_ORDENS = vm.runInContext('PLAN_ORDENS', ctx);

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// TR de mentira, com só o que o painel olha
const tr = (o) => Object.assign({
  tr: '2022TR000001', pendentes: 0, fixada: false, expandida: false,
  anotacoes: [], baixadasQtd: 0, total_pcs: 1, piorDias: null, situacoes: [],
  // `parciais` entrou com o chip do C.I., em 24/08: sem a lista vazia por padrao, os testes
  // dos outros cinco chips passariam a estourar no `.some` do sexto.
  parciais: [],
}, o);
const tick = () => new Promise(r => setTimeout(r, 0));   // deixa o microtask do fetch rodar

console.log('\n═══ 1. AS QUATRO ORDENACOES ═══');
{
  conf(Object.keys(PLAN_ORDENS).join(',') === 'analise,prazo,pcs,ano', 'as 4 na ordem do dropdown', Object.keys(PLAN_ORDENS).join(','));
  conf(PLAN_ORDENS.analise.rotulo === 'Em análise primeiro', 'padrao e "Em análise primeiro"');

  const dados = [
    tr({ tr:'2019TR000001', pendentes:1, piorDias:10 }),
    tr({ tr:'2020TR000001', pendentes:5, piorDias:-5 }),
    tr({ tr:'2022TR000001', pendentes:0, piorDias:900 }),
  ];

  vm.runInContext('_planOrdem = "pcs"', ctx);
  conf(planOrdenar(dados)[0].tr === '2020TR000001', 'Mais PCs a baixar: 5 pendentes primeiro');

  vm.runInContext('_planOrdem = "prazo"', ctx);
  conf(planOrdenar(dados)[0].tr === '2022TR000001', 'Prazo mais critico: 900 dias vencida primeiro');

  vm.runInContext('_planOrdem = "ano"', ctx);
  conf(planOrdenar(dados)[0].tr === '2020TR000001', 'Ano da TR: 2020 primeiro (a regra que ja existia)');

  vm.runInContext('_planOrdem = "analise"', ctx);
  const r = planOrdenar(dados);
  conf(r[r.length-1].tr === '2022TR000001', 'Em analise primeiro: quem nao tem pendencia vai para o fim');
}

console.log('\n═══ 2. TR SEM PRAZO NAO SEQUESTRA O TOPO ═══');
{
  vm.runInContext('_planOrdem = "prazo"', ctx);
  const dados = [tr({ tr:'2022TR000001', piorDias:null }), tr({ tr:'2022TR000002', piorDias:-400 })];
  conf(planOrdenar(dados)[0].tr === '2022TR000002', 'null vai para o fim, nao para o topo');
}

console.log('\n═══ 3. ALFINETE — vem antes de QUALQUER ordenacao ═══');
{
  const dados = [
    tr({ tr:'2022TR000009', pendentes:9, piorDias:900 }),
    tr({ tr:'2022TR000001', pendentes:0, piorDias:null, fixada:true }),
  ];
  for (const ordem of Object.keys(PLAN_ORDENS)) {
    vm.runInContext(`_planOrdem = "${ordem}"`, ctx);
    conf(planOrdenar(dados)[0].tr === '2022TR000001', `fixada primeiro na ordem "${ordem}"`);
  }
}

console.log('\n═══ 4. OS SEIS CHIPS ═══');
{
  // O sexto entrou em 24/08/2026: e o destino do card "C.I. devolveu com ressalvas" do
  // Dashboard, que ate entao abria a planilha inteira, sem recorte nenhum.
  conf(PLAN_CHIPS.length === 6, 'sao 6 chips', String(PLAN_CHIPS.length));
  conf(PLAN_CHIPS.map(c=>c.rotulo).join(' · ') ===
       'Prazo vencido · Aguardando diligência · Em análise · Não iniciadas · Com anotação · C.I. devolveu',
       'na ordem pedida', PLAN_CHIPS.map(c=>c.rotulo).join(' · '));

  const acha = (id) => PLAN_CHIPS.find(c => c.id === id).teste;
  conf(acha('vencido')(tr({ piorDias:1 })) === true,  'Prazo vencido: +1 dia entra');
  conf(acha('vencido')(tr({ piorDias:0 })) === false, 'Prazo vencido: vence hoje NAO entra');
  conf(acha('vencido')(tr({ piorDias:null })) === false, 'Prazo vencido: sem prazo nao entra');
  conf(acha('diligencia')(tr({ situacoes:['Diligência'] })) === true, 'Aguardando diligência');
  conf(acha('diligencia')(tr({ situacoes:['Em análise'] })) === false, 'sem diligência nao entra');
  conf(acha('analise')(tr({ situacoes:['Em análise'] })) === true, 'Em análise');
  conf(acha('naoini')(tr({ baixadasQtd:0, situacoes:[] })) === true, 'Não iniciadas: nada baixado, nenhuma situação');
  conf(acha('naoini')(tr({ baixadasQtd:1, situacoes:[] })) === false, 'com baixa nao e "nao iniciada"');
  conf(acha('naoini')(tr({ baixadasQtd:0, situacoes:['Em análise'] })) === false, 'com situacao nao e "nao iniciada"');
  conf(acha('anotacao')(tr({ anotacoes:[{texto:'x'}] })) === true, 'Com anotação');
  conf(acha('anotacao')(tr({ anotacoes:[] })) === false, 'sem anotação nao entra');

  // ── o chip do retorno do C.I.
  const comCi = (s) => tr({ parciais: [{ ci_situacao: s }] });
  conf(acha('ressalva')(comCi('com_analista')) === true, 'C.I. devolveu: com_analista entra');
  conf(acha('ressalva')(comCi('na_fila')) === false, 'ainda NA FILA do C.I. nao entra — nao voltou');
  conf(acha('ressalva')(comCi('encerrado')) === false, 'encerrada no C.I. nao entra — nao ha o que fazer');
  conf(acha('ressalva')(comCi(null)) === false, 'quem nunca foi ao C.I. nao entra');
  conf(acha('ressalva')(tr({ parciais: [] })) === false, 'TR sem parcial nenhuma nao estoura');
  // ⚠️ UMA parcial devolvida basta: a TR aparece na lista mesmo com as outras dez encerradas.
  conf(acha('ressalva')(tr({ parciais: [{ci_situacao:'encerrado'},{ci_situacao:'com_analista'}] })) === true,
       'uma parcial devolvida ja traz a TR');
}

console.log('\n═══ 5. O CHIP ACESO APAGA AO SER CLICADO DE NOVO ═══');
{
  ctx.window._planDadosCache = [];
  ctx.planRenderBarra = () => {}; ctx.renderPlan = () => {}; ctx.planRenderPag = () => {};
  vm.runInContext('_planChip = ""', ctx);
  planChip('vencido');
  conf(vm.runInContext('_planChip', ctx) === 'vencido', 'primeiro clique acende');
  planChip('vencido');
  conf(vm.runInContext('_planChip', ctx) === '', 'segundo clique no mesmo apaga');
  planChip('anotacao');
  conf(vm.runInContext('_planChip', ctx) === 'anotacao', 'clicar em outro troca');
}

console.log('\n═══ 7. NO CODIGO DA TELA ═══');
{
  conf(/id="planBarra"/.test(html), 'a barra do painel existe no HTML');
  conf(/const blocos = !r\.expandida \? '' :/.test(html), 'recolhida NAO monta os blocos das parciais');
  conf(/\$\{r\.expandida \? planAnotacaoBloco\(r\) \+ blocos : ''\}/.test(html), 'expandida mostra anotacao + parciais');
  conf(/background:var\(--header-grad\)/.test(html), 'cabecalho usa o verde do sistema');
  conf(!/linear-gradient\(135deg,#2E1760,#1A237E\)/.test(html), 'o roxo/azul antigo saiu');
  conf(/\+ Adicionar anotação/.test(html), 'sem anotacao, oferece adicionar');
  conf(/histórico ·/.test(html), 'com anotacao, mostra historico');
  const blocoPg = (html.match(/function planPg\(d\)[\s\S]*?\n\}/) || [''])[0];
  conf(/planAplicar\(\)/.test(blocoPg), 'paginar passa por planAplicar (respeita chip e ordem)', blocoPg.trim());
  conf(!/renderPlan\(dados\.slice/.test(blocoPg), 'nao pagina mais direto do cache bruto');
  // os botoes de acao das parciais tem de continuar existindo
  for (const b of ['pAbrirSit', 'pAbrirPar', 'pEnviarCI']) conf(html.includes(b + '('), `botao ${b} preservado`);

  // ── o alfinete: azul fixado, cinza nao. Emoji nao serve (o 📌 e vermelho nos dois estados).
  const alf = (html.match(/function planAlfinete\(r\)[\s\S]*?\n\}/) || [''])[0];
  conf(/<svg/.test(alf), 'alfinete e SVG, nao emoji');
  // O emoji nao pode ser RENDERIZADO. Ele continua no arquivo, dentro do comentario que
  // explica por que nao serve — proibir a mencao faria o teste brigar com a documentacao.
  conf(!/>📌</.test(html), 'o emoji nao e mais renderizado como icone');
  conf(/r\.fixada \? '#7EC8FF' : 'rgba\(255,255,255,\.45\)'/.test(alf), 'azul quando fixado, cinza quando nao');
  conf(/aria-pressed="\$\{r\.fixada\}"/.test(alf), 'estado exposto para leitor de tela');
  conf(/planFixar\('\$\{escHtml\(r\.tr\)\}',event\)/.test(alf), 'clique chama planFixar com o event');
  conf(/border-left:4px solid var\(--az\)/.test(html), 'a borda azul do card marca a fixada de longe');
}

// A gravação é assíncrona: `planFixar` muda o estado na hora e dispara o fetch sem await,
// de propósito (o alfinete tem de responder ao clique). Por isso o teste espera um tick.
(async () => {
  console.log('\n═══ 6. PERSISTENCIA — o que vai para o banco ═══');
  const chamadas = [];
  ctx.fetch = async (url, opts) => { chamadas.push({ url, body: opts && JSON.parse(opts.body) }); return { json: async () => ({ data:{} }) } };
  ctx.window._planDadosCache = [tr({ tr:'2022TR000777' })];

  planFixar('2022TR000777');
  conf(ctx.window._planDadosCache[0].fixada === true, 'fixar muda o estado na hora, sem esperar a rede');
  await tick();
  conf(chamadas.length === 1 && /preferencia_tr/.test(chamadas[0].url), 'grava em preferencia_tr', JSON.stringify(chamadas));
  conf(chamadas[0].body.analista_id === 4 && chamadas[0].body.tr === '2022TR000777', 'manda analista_id + tr');
  conf(chamadas[0].body.fixada === true && chamadas[0].body.expandida === undefined, 'manda SO o campo que mudou');

  planToggle('2022TR000777');
  conf(ctx.window._planDadosCache[0].expandida === true, 'expandir muda o estado');
  await tick();
  conf(chamadas[1].body.expandida === true && chamadas[1].body.fixada === undefined, 'e grava so `expandida`');

  planFixar('2022TR000777');
  conf(ctx.window._planDadosCache[0].fixada === false, 'clicar de novo desafixa');

  console.log('\n═══ 8. OS QUATRO AJUSTES DE 09/08 ═══');
{
  const cab = html.slice(html.indexOf('const baixadaTr ='), html.indexOf('${r.expandida ? planAnotacaoBloco(r)'));

  // 1. botoes com contraste
  // o texto do botao deixou de depender de `baixadaTr` em 10/08 — agora e sempre verde, e
  // quem muda e a borda. Detalhe na secao 10.
  conf(/background:#fff;color:var\(--v\)/.test(cab), 'Ver PCs virou solido, nao mais translucido');
  // escopado ao cabecalho do painel: `rgba(255,255,255,.16)` tambem e usado pelo botao do
  // menu superior (.btn-guia), que nao tem nada a ver com isto.
  conf(!/rgba\(255,255,255,\.16\)/.test(cab), 'o fundo apagado do botao saiu do cabecalho da TR');
  // ⚠️ ESTA SECAO MEDIA OS TRES BOTOES SOLTOS DA LINHA DA PARCIAL. Em 18/08/2026 eles
  // deixaram de existir: "Salvar situacao", "Registrar parecer" e "Encaminhar ao C.I."
  // viraram itens do menu "Acoes ▾", e a linha ficou com UM botao so.
  //
  // A pergunta que a secao fazia — "a area expandida tem botoes com peso visual, e nao
  // links apagados?" — continua valendo; o que mudou e ONDE olhar. Agora se mede o botao
  // unico e os itens do menu, que sao o que a pessoa ve.
  const acoes = html.slice(html.indexOf('function pBotaoAcoes(pa, tr) {'),
                           html.indexOf('function pBotaoAcoes(pa, tr) {') + 900);
  conf(/font-weight:800/.test(acoes), 'o botao "Acoes" da linha tem peso 800');
  conf(/background:var\(--v\);color:#fff/.test(acoes),
       'e e verde solido com texto branco — o mesmo peso do antigo "Registrar parecer"');
  conf(/Ações ▾/.test(acoes) && !/⋯/.test(acoes),
       'o rotulo e "Acoes ▾", sem os tres pontinhos');

  // Os itens do menu: fonte e respiro maiores, como o Richard pediu ao levar tudo para la.
  const item = html.slice(html.indexOf('function acItem(rotulo, icone, acao, ativo, cor, motivo, destaque) {'),
                          html.indexOf('function acItem(rotulo, icone, acao, ativo, cor, motivo, destaque) {') + 1600);
  conf(/font-size:13\.5px/.test(item), 'os itens do menu estao em 13.5px');
  conf(/padding:11px 14px/.test(item), 'com padding 11px 14px');
  conf(/width:28px;height:28px/.test(item), 'e o icone num quadradinho de 28px');

  // 2. TR baixada recua
  // a regra saiu do render e virou `planTrConcluida` em 10/08, para o botao e o inicio da
  // analise lerem a MESMA definicao. Detalhe na secao 10.
  conf(/const baixadaTr = planTrConcluida\(r\)/.test(html), 'detecta TR toda baixada');
  conf(/baixadaTr \? 'var\(--vbg\)'\s*:\s*'var\(--header-grad\)'/.test(html), 'usa --vbg da paleta, nao cor nova');
  conf(/✓ concluída/.test(cab), 'e ganha etiqueta de concluida');

  // 3. etiqueta de vencida fora, inicio da analise no lugar
  // idem: a expressao sobrevive no comentario que explica a remocao, e proibir a mencao
  // faria o teste brigar com a documentacao. O que nao pode e ela ser RENDERIZADA.
  conf(!/\$\{r\.piorDias\}d vencida/.test(html), 'a etiqueta "Nd vencida" nao e mais renderizada');
  conf(!/d vencida/.test(cab), 'e nao esta no cabecalho da TR');
  conf(!/etqPrazo/.test(html), 'e a variavel que a montava tambem');
  conf(/planBadgeSit\(s\)/.test(html), 'as etiquetas de SITUACAO continuam');
  conf(/planInicioAnalise\(r\)/.test(cab), 'o cabecalho chama a data de inicio');
  conf(/dt_inicio_analise/.test(html), 'le o campo `dt_inicio_analise`, que ainda nao existe no banco');
  // ⚠️ o comportamento MUDOU em 09/08: antes, sem o campo, nao mostrava nada. Agora mostra
  // "definir início", clicavel — e o que permite preencher as TRs antigas, que nao tem
  // registro nenhum. Ver a secao 9.
  conf(/definir início/.test(html), 'sem o campo, convida a definir (nao fica vazio)');

  // 4. coluna do SGPe
  conf(/width:195px;">Processo SGPE/.test(html), 'coluna do processo foi para 195px');
  conf(/class="proc-sgpe"[^>]*white-space:nowrap/.test(html), 'e a celula nao quebra linha');
}

console.log('\n═══ 9. INICIO DA ANALISE — as duas formas de preencher ═══');
{
  const ini = (html.match(/function planInicioAnalise\(r\)[\s\S]*?\n\}/) || [''])[0];
  conf(/definir início/.test(ini), 'sem data, mostra "definir início"');
  conf(/análise desde \$\{planData\(menor\)\}/.test(ini), 'com data, mostra "análise desde dd/mm/aaaa"');
  conf((ini.match(/planDefinirInicio/g) || []).length === 2, 'os DOIS estados sao clicaveis (definir e corrigir)');
  conf(/datas\.sort\(\)\[0\]/.test(ini), 'usa a data mais antiga entre as PCs da TR');

  const def = (html.match(/async function planDefinirInicio[\s\S]*?\n\}/) || [''])[0];
  conf(/ev\.stopPropagation\(\)/.test(def), 'clicar na data NAO expande a TR junto');
  conf(/\^\(\\d\{2\}\)\\\/\(\\d\{2\}\)\\\/\(\\d\{4\}\)\$/.test(def), 'exige dd/mm/aaaa');
  conf(/d\.getDate\(\) !== \+m\[1\]/.test(def), 'recusa data inexistente (31/02)');
  conf(/nao pode ser futura|não pode ser futura/.test(def), 'recusa data futura (armadilha 3 do CLAUDE.md)');
  conf(/data: iso/.test(def), 'manda a data em ISO para a API');
  conf(/resp\.trim\(\)/.test(def) && /data: iso/.test(def), 'em branco limpa (iso fica null)');

  // O carimbo retroativo foi DESCARTADO por decisao — as 30 TRs da reserva ficam sem data.
  conf(!/atualizado_em.*dt_inicio_analise|dt_inicio_analise.*= *p\.atualizado_em/.test(html), 'nenhum backfill retroativo no front');
}

console.log('\n═══ 10. TR CONCLUIDA — botao e inicio da analise ═══');
{
  const ctxC = { console, escHtml: (s) => String(s ?? ''),
                 planData: (d) => d ? '15/03/2026' : '—' };
  const iniC = html.indexOf('function planTrConcluida(r)');
  const fimC = html.indexOf('// O alfinete.');
  vm.createContext(ctxC);
  vm.runInContext(html.slice(iniC, fimC), ctxC);
  const { planTrConcluida, planInicioAnalise } = ctxC;

  const comPcs = (pcs) => ({ parciais: [{ pcs }] });
  const mkTr = (total, baixadas, dataInicio) => Object.assign(
    comPcs([{ dt_inicio_analise: dataInicio || null }]),
    { tr: '2020TR000001', total_pcs: total, baixadasQtd: baixadas });

  conf(planTrConcluida(mkTr(10, 10)) === true, 'concluida: baixadas >= total');
  conf(planTrConcluida(mkTr(10, 9)) === false, 'nao concluida: falta uma');
  conf(planTrConcluida(mkTr(0, 0)) === false, 'TR sem PCs nao conta como concluida');

  // ── o pedido: "definir início" nao aparece em TR concluida
  const concSem = planInicioAnalise(mkTr(10, 10, null));
  conf(concSem === '', 'concluida SEM data: nao mostra nada', JSON.stringify(concSem));
  const concCom = planInicioAnalise(mkTr(10, 10, '2026-03-15'));
  conf(/análise desde/.test(concCom), 'concluida COM data: mostra a data');
  conf(!/planDefinirInicio/.test(concCom), 'e a data NAO e clicavel numa TR concluida');

  // ── em aberto, continua como estava
  const abertaSem = planInicioAnalise(mkTr(10, 3, null));
  conf(/definir início/.test(abertaSem), 'em aberto SEM data: convida a definir');
  conf(/planDefinirInicio/.test(abertaSem), 'e o convite e clicavel');
  const abertaCom = planInicioAnalise(mkTr(10, 3, '2026-03-15'));
  conf(/análise desde/.test(abertaCom) && /planDefinirInicio/.test(abertaCom), 'em aberto COM data: mostra e deixa corrigir');

  // ── uma definicao so de "concluida"
  conf((html.match(/r\.baixadasQtd >= r\.total_pcs/g) || []).length === 1, 'a regra de concluida existe em UM lugar so');
  conf(/const baixadaTr = planTrConcluida\(r\)/.test(html), 'o cabecalho usa a mesma funcao');

  // ── o botao na TR concluida
  // ⚠️ A janela fechava em `indexOf('Ver PCs')` e passou a fechar num COMENTÁRIO que cita
  // "Ver PCs" — escrito em 13/08, acima do botão. Fecha-se agora no `planToggle` do próprio
  // botão, que é o que a seção mede. Âncora que casa com prosa mede a prosa.
  const bloco = html.slice(html.indexOf('<!-- No cabeçalho verde escuro'),
                           html.indexOf("planToggle('${escHtml(r.tr)}');event.stopPropagation();") + 120);
  conf(/color:var\(--v\)/.test(bloco), 'texto do botao e sempre verde, nunca cinza claro');
  conf(/baixadaTr \? 'border:2px solid var\(--v\)/.test(bloco), 'na concluida ganha borda para se delimitar');
  conf(/: 'border:none/.test(bloco), 'na verde escura continua sem borda');
  conf(!/color:\$\{baixadaTr\?'var\(--ct\)'/.test(html), 'o cinza que sumia no fundo claro saiu');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
  process.exit(falhou ? 1 : 0);
})();
