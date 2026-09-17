// CAMINHO: sigpc-gt/teste_front_gestao.js
//
// A TELA GESTÃO (17/09/2026). Extrai o bloco da própria `index.html` e executa num contexto de
// mentira — sem navegador, sem rede, sem login.
//
// O que se prova: o menu e as guardas; que a tela usa as contagens do SERVIDOR (armadilha 16);
// que a data do acervo importado nunca aparece como vencida; o recorte da lista; a ficha (o botão
// de arquivar só na parcial pronta, as etapas e a anotação fora do "ver como").
//
// USO: node teste_front_gestao.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let ok = 0, falhou = 0;
const conf = (v, r) => { if (v) { ok++; console.log('  OK    ' + r) } else { falhou++; console.log('  FALHA  ' + r) } };

// ⚠️ A JANELA TERMINA NUM MARCO DO CÓDIGO (armadilha 30), nunca num número de caracteres.
const ini = html.indexOf('const GES_ETAPAS = [');
const fim = html.indexOf("function toast(msg, tipo='ok') {");
if (ini < 0 || fim < 0 || fim < ini) { console.error('FALHA: nao achei o bloco da Gestao.'); process.exit(1) }
const bloco = html.slice(ini, fim);

console.log('\n═══ 1. O MENU E AS LIGAÇÕES ═══');
{
  const iG = html.indexOf("{ id:'gestao', bloco:'analista'");
  const iE = html.indexOf("{ id:'est',   bloco:'analista'");
  const iD = html.indexOf("{ id:'dash',  bloco:'analista'");
  conf(iG > 0, 'o item Gestão está no bloco do analista');
  conf(iD < iG && iG < iE, 'logo depois do Dashboard, antes do Estoque');
  conf(/id:'gestao'[^}]*acao:'irGestao\(\)'[^}]*pode:naoEhCI/.test(html), 'abre irGestao() e fica fora do Controle Interno');
  const arq = html.slice(html.indexOf('function arqRecarregar() {'), html.indexOf('function arqSituacaoHtml('));
  conf(arq.includes("getElementById('gesApp')") && arq.includes('gesRecarregar()'), 'depois de arquivar, a Gestão se repinta');
  const ir = bloco.slice(bloco.indexOf('async function irGestao('), bloco.indexOf('async function gesCarregar('));
  conf(ir.indexOf("'controle_interno'") > 0 && ir.indexOf("'controle_interno'") < ir.indexOf("getElementById('BODY')"),
    'a guarda do Controle Interno vem ANTES de montar a tela');
  const car = bloco.slice(bloco.indexOf('async function gesCarregar('), bloco.indexOf('function gesRecarregar('));
  conf(car.includes('/gestao?usuario_id=${U.id}&analista_id=${alvo().id}'), 'pede a gestão de quem está sendo visto (alvo)');
  conf(car.includes('sgpeAbsorver('), 'absorve os links do SGPe');
}

console.log('\n═══ 2. A TELA NÃO CONTA (armadilha 16) ═══');
{
  const lista = bloco.slice(bloco.indexOf('function gesListaHtml() {'), bloco.indexOf('function gesRecorte() {'));
  conf(lista.includes('_ges.contagens[_gesF.ano]'), 'o funil lê as contagens do servidor, por ano');
  conf(!/\.filter\([^)]*etapa\s*===/.test(lista), 'o funil não filtra PC por etapa para contar');
  const ficha = bloco.slice(bloco.indexOf('function gesFichaHtml(t) {'), bloco.indexOf('// ── SGPe da ficha'));
  conf(ficha.includes('t.n_ci_devolvidas') && ficha.includes('t.n_no_ci'), 'o C.I. da ficha vem contado do servidor');
  conf(!/pcs\.filter\([^)]*etapa\s*===\s*'no_ci'/.test(ficha), 'a ficha não conta a fila do C.I.');
}

// ── o contexto de mentira ────────────────────────────────────────────────────
const elementos = {};
const fetchChamadas = [];
const ctx = {
  console, Promise, Date, Math, JSON, Object, Number, String, Array, Map, Set, URLSearchParams, encodeURIComponent,
  API_URL: 'https://api', U: { id: 4, nome: 'Richard Motta Coelho', perfil: 'analista' },
  _verComo: null,
  alvo() { return ctx._verComo || ctx.U },
  verComoAtivo() { return !!ctx._verComo },
  escHtml: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  planData: (d) => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—',
  planDataHora: (d) => d ? String(d) : '—',
  procHtml: (b) => `<a class="proc">${b}</a>`,
  procVazio: (b) => { const t = String(b ?? '').trim(); return !t || t === '-1' || t === '-' },
  normalizarProcesso: (b) => String(b),
  sgpeLogoImg: () => '<img>',
  sgpeAbsorver: (j) => j,
  arqArgs: (tr, n, s) => `'${tr}','${n}','${s || ''}'`,
  arqFrase: (m) => String(m || ''),
  AC_EV_LABEL: {},
  toast: () => {}, ativarMenu: () => {}, moPrompt: async () => null, irPlanilha: () => {},
  window: { scrollTo: () => {} },
  fetch: async (url, o) => { fetchChamadas.push({ url, o }); return { json: async () => ({ data: [], error: null }) } },
  document: {
    getElementById: (id) => elementos[id] || null,
    createElement: () => ({}), head: { appendChild: () => {} },
  },
};
vm.createContext(ctx);
// `const`/`let` de topo não viram propriedade do contexto: troca-se por `var` só aqui dentro.
vm.runInContext(bloco.replace(/^(const|let) /gm, 'var '), ctx);

const pc = (o) => Object.assign({ codigo_pc: 'X', parcial_num: '1', final: false, processo_pc: 'SCC 1/2024', valor: 10,
  etapa: 'analise', situacao: 'Em análise', diligencia: false, prazo: null, data_baixa: null, ci_situacao: null,
  ci_devolveu_em: null, ci_devolveu_carga: false, arquivamento: null, arquivada_em: null, baixa_secretario_em: null,
  setorial_id: 'FCEE', sgpe: null }, o);
const tr = (o) => Object.assign({ tr: 'T', ano: 2021, entidade: 'APAE', processo_mae: 'SCC 9/2019', grupo: 3,
  dt_assumida: null, ultima_mov: '2026-09-14', dias_parado: 3, etapa: 'analise', n_parciais: 1, tem_final: false,
  n_pcs: 1, n_baixadas: 0, n_arquivadas: 0, n_no_ci: 0, n_ci_devolvidas: 0, valor_total: 10, situacoes: ['Em análise'],
  diligencia: false, prazo_proximo: null, sgpe_mae: null, sgpe_atual: null, pcs: [] }, o);

console.log('\n═══ 3. O PRAZO NA TELA ═══');
{
  ctx._ges = { corte_prazo: '2026-08-01', hoje: '2026-09-17' };
  const imp = ctx.gesPrazoHtml({ tipo: 'importado', data: '2023-04-05', dias: null });
  conf(imp.includes('sem prazo definido') && !/vencid/.test(imp), 'acervo importado: "sem prazo definido", nunca vencido');
  conf(ctx.gesPrazoHtml({ tipo: 'vencido', data: '2026-09-10', dias: -7 }).includes('vencido há 7 dias'), 'vencido há 7 dias');
  conf(ctx.gesPrazoHtml({ tipo: 'vence', data: '2026-09-17', dias: 0 }).includes('vence hoje'), 'vence hoje');
  conf(ctx.gesPrazoHtml({ tipo: 'ok', data: '2026-10-30', dias: 43 }).includes('em 43 dias'), 'em 43 dias');
  conf(ctx.gesPrazoHtml(null).includes('—'), 'sem prazo → travessão');
  conf(ctx.gesDiasHtml(1).includes('1 dia<') && ctx.gesDiasHtml(2).includes('2 dias'), 'singular e plural');
}

console.log('\n═══ 4. O RECORTE DA LISTA ═══');
{
  ctx._ges = {
    corte_prazo: '2026-08-01', hoje: '2026-09-17', anos: ['2022', '2021'],
    contagens: { todos: {}, '2021': {}, '2022': {} },
    trs: [
      tr({ tr: '2021TR000001', ano: 2021, entidade: 'APAE de Antônio Carlos', pcs: [
        pc({ codigo_pc: 'A1', etapa: 'arquivada' }), pc({ codigo_pc: 'A2', etapa: 'devolvida', final: true }) ] }),
      tr({ tr: '2022TR000268', ano: 2022, entidade: 'APAE de Navegantes', pcs: [
        pc({ codigo_pc: 'B1', situacao: 'Diligência', diligencia: true, prazo: { tipo: 'importado', data: '2023-04-05' } }),
        pc({ codigo_pc: 'B2', prazo: { tipo: 'vencido', data: '2026-09-01', dias: -16 }, processo_pc: 'SCC 8673/2023' }) ] }),
    ],
  };
  const F = ctx._gesF;
  const rodar = (o) => { Object.assign(F, { ano: 'todos', etapa: null, busca: '', sit: '', prazo: '' }, o); return ctx.gesRecorte() };
  conf(rodar({}).length === 2, 'sem filtro, as duas TRs');
  conf(rodar({ ano: '2022' }).map((x) => x.t.tr).join() === '2022TR000268', 'recorte por ano');
  conf(rodar({ etapa: 'devolvida' }).length === 1 && rodar({ etapa: 'devolvida' })[0].pcs.length === 1, 'recorte por etapa leva só a PC da etapa');
  conf(rodar({ sit: 'Diligência' })[0].pcs.map((p) => p.codigo_pc).join() === 'B1', 'recorte por situação');
  conf(rodar({ prazo: 'vencido' })[0].pcs.map((p) => p.codigo_pc).join() === 'B2', 'vencidas: a importada fica de fora');
  conf(rodar({ busca: 'antonio' }).length === 1, 'busca ignora acento');
  conf(rodar({ busca: '8673' })[0].pcs.map((p) => p.codigo_pc).join() === 'B2', 'busca pelo processo da PC');
  conf(rodar({ busca: 'zzz' }).length === 0, 'busca sem resultado → lista vazia');
}

console.log('\n═══ 5. A FICHA ═══');
{
  ctx._ges.hoje = '2026-09-17';
  const t = tr({ tr: '2021TR001253', etapa: 'devolvida', n_parciais: 1, tem_final: true, n_pcs: 2, n_baixadas: 2,
    n_arquivadas: 1, n_ci_devolvidas: 2, pcs: [
      pc({ codigo_pc: 'P1', etapa: 'arquivada', arquivada_em: '2026-09-14', ci_situacao: 'encerrado',
        arquivamento: { estado: 'arquivada' } }),
      pc({ codigo_pc: 'PF', parcial_num: 'FINAL', final: true, etapa: 'devolvida', ci_situacao: 'encerrado',
        ci_devolveu_em: '2026-09-09', arquivamento: { estado: 'pronta' } }),
      pc({ codigo_pc: 'P9', parcial_num: '9', etapa: 'devolvida', ci_situacao: 'com_analista',
        arquivamento: { estado: 'bloqueada', motivo: 'Há diligência aberta' } }),
    ] });
  const h = ctx.gesFichaHtml(t);
  conf((h.match(/onclick="arqAbrir\(/g) || []).length === 1, 'o botão de arquivar aparece só na parcial PRONTA');
  conf(h.includes("arqAbrir('2021TR001253','FINAL','FCEE')"), 'o botão da final chama o modal do arquivamento');
  conf(h.includes('Arquivar e encerrar'), 'na final o botão diz que encerra a TR');
  conf(h.includes('Há diligência aberta'), 'a bloqueada mostra o motivo, em texto (botão cinza nunca é mudo)');
  conf(h.includes('📁 14/09/2026'), 'a arquivada mostra a data');
  conf((h.match(/class="ges-ps ok"/g) || []).length === 3 && (h.match(/class="ges-ps at"/g) || []).length === 1,
    'devolvida: três etapas concluídas e o arquivamento em andamento');
  conf(h.includes('Controle Interno devolveu · desde 09/09/2026'), '"onde está agora" com a data da devolutiva');
  conf(h.includes('2 devolvidas · 0 na fila'), 'o C.I. da ficha com os números do servidor');
  conf(h.includes('class="ges-marca"'), 'a ilustração de prestação de contas está na faixa verde');
  conf(h.includes('id="gesSgpe"') && h.includes('id="gesHist"') && h.includes('id="gesAnot"'), 'os três blocos que carregam depois');
  const enc = ctx.gesFichaHtml(tr({ etapa: 'encerrada', pcs: [pc({ final: true, etapa: 'arquivada', baixa_secretario_em: '2026-09-12' })] }));
  conf((enc.match(/class="ges-ps ok"/g) || []).length === 4, 'TR encerrada: as quatro etapas concluídas');
  conf(enc.includes('baixa do Secretário em 12/09/2026'), 'TR encerrada mostra a data do Secretário');
}

console.log('\n═══ 6. OS PROCESSOS DA FICHA ═══');
{
  const lst = ctx.gesProcessos(tr({ processo_mae: 'SCC 9/2019', pcs: [
    pc({ processo_pc: 'SCC 1/2024', parcial_num: '1' }), pc({ processo_pc: 'SCC 1/2024', parcial_num: '2' }),
    pc({ processo_pc: '-1' }), pc({ processo_pc: 'SCC 9/2019', final: true }) ] }));
  conf(lst.length === 2, 'mãe + um processo de PC (o -1 fica de fora, e a final no mesmo da mãe não duplica)');
  conf(lst[0].rot === 'Processo mãe' && lst[1].rot === 'Parcial 1, Parcial 2', 'rótulos dos processos');
}

console.log('\n═══ 7. A ANOTAÇÃO E O "VER COMO" ═══');
(async () => {
  const box = { innerHTML: '' };
  elementos.gesAnot = box;
  ctx._gesF.tr = 'T1';
  ctx.fetch = async () => ({ json: async () => ({ data: [{ texto: 'nota', analista_nome: 'R', criado_em: 'x' }], error: null }) });
  ctx._verComo = null;
  await ctx.gesAnotCarregar('T1');
  conf(box.innerHTML.includes('Editar anotação'), 'no próprio acesso, o botão de anotação aparece');
  ctx._verComo = { id: 20, nome: 'Fulana' };
  await ctx.gesAnotCarregar('T1');
  conf(!box.innerHTML.includes('gesAnotar(') && box.innerHTML.includes('nota'), 'no "ver como", lê a anotação e não oferece botão');
  let chamou = false;
  ctx.moPrompt = async () => { chamou = true; return 'x' };
  await ctx.gesAnotar('T1');
  conf(!chamou, 'no "ver como", gesAnotar recusa na origem (armadilha 13)');
  ctx._verComo = null;

  // O "Atualizar agora" vai por POST na rota nova, com o usuário.
  elementos.gesSgpe = { innerHTML: '' };
  ctx._ges = { hoje: '2026-09-17', trs: [tr({ tr: 'T1', processo_mae: 'SCC 9/2019' })] };
  ctx._gesF.proc = null;
  const chamadas = [];
  ctx.fetch = async (url, o) => { chamadas.push({ url, o }); return { json: async () => ({ data: { valido: true, situacao: null, tramitacoes: [] }, error: null }) } };
  await ctx.gesSgpeCarregar(true);
  conf(chamadas[0] && chamadas[0].url.endsWith('/sgpe/situacao/atualizar') && chamadas[0].o.method === 'POST', 'Atualizar agora → POST /sgpe/situacao/atualizar');
  conf(chamadas[0] && JSON.parse(chamadas[0].o.body).usuario_id === 4, 'com o usuário');
  await ctx.gesSgpeCarregar(false);
  conf(chamadas[1] && chamadas[1].url.includes('/sgpe/situacao?') && !chamadas[1].o, 'ao abrir a ficha → só leitura (GET)');
  conf(elementos.gesSgpe.innerHTML.includes('Ainda não sincronizado'), 'processo sem leitura diz o que fazer');

  console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
  process.exitCode = falhou ? 1 : 0;
})();
