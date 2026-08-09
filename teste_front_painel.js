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

console.log('\n═══ 4. OS CINCO CHIPS ═══');
{
  conf(PLAN_CHIPS.length === 5, 'sao 5 chips', String(PLAN_CHIPS.length));
  conf(PLAN_CHIPS.map(c=>c.rotulo).join(' · ') ===
       'Prazo vencido · Aguardando diligência · Em análise · Não iniciadas · Com anotação',
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

  console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
  process.exit(falhou ? 1 : 0);
})();
