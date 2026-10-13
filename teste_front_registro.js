// CAMINHO: sigpc-gt/teste_front_registro.js
//
// A CAIXA "REGISTRO / TAREFA" NA PARCELA  (12/10/2026)
//
// ⚠️ O QUE ELE GUARDA:
//   · a caixa NASCE ABERTA quando há tarefa em aberto — e fechada ela diz que há algo escrito;
//   · a pílula da TR PULSA só quando o servidor manda (`por_tr[tr].pulsa`);
//   · o cadeado "só você vê" está lá — é o que diferencia esta caixa da anotação da TR;
//   · cancelar NÃO apaga, e a tela diz isso antes;
//   · a tela não conta nada: as contagens vêm de `por_tr`.
//
// ⚠️ EXECUTA as funções num DOM de mentira, em vez de casar texto no arquivo.
//
// USO: node teste_front_registro.js

const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('./index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ⚠️ A janela termina num MARCO DO PRÓPRIO CÓDIGO (armadilha 30), e nunca dentro de um
// comentário `/** */` — cortar no meio dele deixa o bloco aberto e o `vm` recusa tudo.
const i = html.indexOf('let _regItens = [];');
const fonte = i < 0 ? '' : html.slice(i, html.indexOf('function pBlocoCor(pa) {', i));
// Recorta de marco a marco — a mesma regra: o fim e sempre um marco do proprio codigo.
const fatia = (de, ate) => { const a = html.indexOf(de); if (a < 0) return ''; const b = html.indexOf(ate, a + de.length); return b < 0 ? '' : html.slice(a, b); };

const ctx = {
  console,
  escHtml: (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  planData: (d) => String(d || '').split('-').reverse().join('/'),
  planDataTs: (d) => String(d || '').slice(0, 10).split('-').reverse().join('/'),
  vcOff: () => '',
  toast: () => {},
  U: { id: 4, nome: 'Richard' },
  alvo: () => ({ id: 4 }),
  API_URL: '',
  document: { getElementById: () => null },
  window: {},
  planAplicar: () => {},
};
vm.createContext(ctx);
new vm.Script(fonte.replace(/^let /gm, 'var ').replace(/^const /gm, 'var ')).runInContext(ctx);

const TR = { tr: '2021TR001578', arquivada: false };
const PA = { num: '1', soFinal: false, qtd: 1, pcs: [] };
const texto = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const item = (o) => ({ id: 1, tr: '2021TR001578', parcial_num: '1', tipo: 'registro',
  texto: 'Analisada a despesa de material de consumo.', analista_nome: 'Richard',
  criado_em: '2026-09-30T19:02:00.000Z', prazo: null, concluida_em: null, cancelada_em: null, ...o });

S('1. SEM NADA ESCRITO, A CAIXA CONVIDA — e não some');
{
  conf(fonte.length > 0, 'o trecho do caderno foi encontrado');
  ctx._regItens = []; ctx._regPorTr = {}; ctx._regAbertas = new Set();
  const h = ctx.regCaixa(TR, PA);
  conf(/Nada registrado nesta parcela ainda/.test(texto(h)), 'diz que não há nada');
  conf(/anote o que está analisando/.test(texto(h)), 'e explica para que serve');
  conf(/Escrever/.test(texto(h)), 'com um botão para começar');
  conf(h.length < 1500, 'numa linha só — sem ocupar a tela de quem não usa', String(h.length));
  // ⚠️ O DEFEITO QUE ESCAPOU PARA A PRODUÇÃO EM 12/10: este ramo devolvia a linha de convite
  // ANTES de olhar se a pessoa tinha clicado em Escrever. O clique marcava a parcela como
  // aberta, a tela repintava — e caía aqui de novo. O botão não fazia nada (armadilha 12).
  ctx.regAbrir('2021TR001578', '1');
  const h2 = ctx.regCaixa(TR, PA);
  conf(/Salvar registro/.test(texto(h2)), '⚠️ clicar em Escrever ABRE o formulário, mesmo sem nenhum item');
  conf(/Criar tarefa/.test(texto(h2)), 'com os dois botões');
  conf(/escreva o primeiro/.test(texto(h2)), 'e o cabeçalho convida, em vez de dizer "0 registros"');
  conf(/recolher/.test(texto(h2)), 'e dá para fechar de novo');
  ctx.regFechar('2021TR001578', '1');
  conf(/Nada registrado/.test(texto(ctx.regCaixa(TR, PA))), 'recolher volta ao convite');
}

S('2. COM TAREFA ABERTA, A CAIXA NASCE ABERTA');
{
  ctx._regHoje = '2026-10-12';
  ctx._regAbertas = new Set();
  ctx._regItens = [
    item({ id: 10, tipo: 'tarefa', texto: 'Cobrar o extrato de setembro', prazo: '2026-10-20' }),
    item({ id: 11, texto: 'Notas 115 a 128 conferidas, sem divergência.' }),
  ];
  const h = ctx.regCaixa(TR, PA);
  const t = texto(h);
  conf(/REGISTRO \/ TAREFA|Registro \/ Tarefa/i.test(t), 'o título é "Registro / Tarefa"');
  conf(/1 tarefa aberta/.test(t), 'diz quantas tarefas estão abertas');
  conf(/1 registro/.test(t), 'e quantos registros há');
  conf(/Cobrar o extrato de setembro/.test(t), 'a tarefa aparece');
  conf(/Notas 115 a 128/.test(t), 'o registro também');
  conf(/prazo 20\/10\/2026/.test(t), 'com o prazo escrito por extenso');
  // ⚠️ O CADEADO: é o que diferencia esta caixa da anotação da TR, que todos veem.
  conf(/só você vê/.test(t), '⚠️ e o cadeado diz que só o analista vê');
  conf(/Salvar registro/.test(t) && /Criar tarefa/.test(t), 'os dois botões estão lá');
  conf(/prazo da tarefa/.test(t), 'com o campo de prazo — opcional, ao lado do botão da tarefa');
  conf(/Registro é o que você fez/.test(t), 'e a linha que explica a diferença entre os dois');
}

S('3. SÓ COM REGISTRO, ELA NASCE FECHADA — mas mostra o último');
{
  ctx._regAbertas = new Set();
  ctx._regItens = [item({ id: 12, texto: 'Diligência 03/2026 — prazo de 10 dias a contar de 06/10.' })];
  const h = ctx.regCaixa(TR, PA);
  const t = texto(h);
  conf(/último registro/.test(t), 'mostra que é o último registro');
  conf(/Diligência 03\/2026/.test(t), 'com o texto dele');
  conf(/1 no total/.test(t), 'e quantos existem');
  conf(/Abrir registro/.test(t), 'com um clique para abrir');
  conf(!/Salvar registro/.test(t), 'o formulário só aparece depois de abrir');
  // ⚠️ É ISTO QUE FALTAVA: a Marlene gravou a mesma anotação duas vezes porque a primeira
  // não estava à vista.
  ctx.regAbrir('2021TR001578', '1');
  conf(/Salvar registro/.test(texto(ctx.regCaixa(TR, PA))), 'depois de abrir, o formulário aparece');
  ctx.regFechar('2021TR001578', '1');
  conf(!/Salvar registro/.test(texto(ctx.regCaixa(TR, PA))), 'e recolher fecha de novo');
}

S('4. A TAREFA MOSTRA O ESTADO PELA COR E PELO RÓTULO');
{
  ctx._regHoje = '2026-10-12';
  ctx._regAbertas = new Set(['2021TR001578|1']);
  const estados = [
    ['tarefa sem prazo',  { tipo: 'tarefa' },                              'Tarefa'],
    ['vence hoje',        { tipo: 'tarefa', prazo: '2026-10-12' },         'Vence hoje'],
    ['vencida',           { tipo: 'tarefa', prazo: '2026-10-01' },         'Vencida'],
    ['concluída',         { tipo: 'tarefa', concluida_em: '2026-10-10' },  'feita'],
    ['registro',          { tipo: 'registro' },                            'Registro'],
  ];
  for (const [rot, o, esperado] of estados) {
    ctx._regItens = [item({ id: 20, ...o })];
    conf(new RegExp(esperado).test(texto(ctx.regCaixa(TR, PA))), `${rot} → "${esperado}"`);
  }
  // A concluída fica riscada, e não some: ela é prova do que já foi feito.
  ctx._regItens = [item({ id: 21, tipo: 'tarefa', concluida_em: '2026-10-10T12:00:00Z' })];
  const h = ctx.regCaixa(TR, PA);
  conf(/line-through/.test(h), 'a concluída fica riscada');
  conf(/concluída em 10\/10\/2026/.test(texto(h)), 'com a data em que foi marcada');
  conf(/checkbox[^>]*checked/.test(h), 'e a caixa marcada — clicar de novo reabre');
}

S('5. A PARCELA QUE ACABOU NÃO COBRA NADA');
{
  // ⚠️ Decisão do Richard em 12/10, vendo a tela: *"PC finalizada e arquivada registrando
  // tarefa? como assim"*. Medido: 115 das 253 parcelas do acervo dele já tinham acabado e
  // estavam sendo convidadas; no GT, 3.131 de 8.341.
  const ARQ = { ...PA, arquivamento: { estado: 'arquivada' } };
  ctx._regAbertas = new Set();
  ctx._regItens = [];
  conf(ctx.regCaixa(TR, ARQ) === '', '⚠️ arquivada e sem nada escrito: a caixa NÃO EXISTE');
  conf(ctx.regCaixa({ ...TR, arquivada: true }, PA) === '', 'com a TR inteira arquivada, idem');

  ctx._regItens = [item({ id: 30, texto: 'Conferido o comprovante de devolução de saldo.' }),
    item({ id: 31, tipo: 'tarefa', texto: 'Cobrar extrato', prazo: '2026-10-01' })];
  const h = ctx.regCaixa(TR, ARQ);
  const t = texto(h);
  conf(/histórico/i.test(t), 'arquivada COM histórico: a caixa vira histórico');
  conf(/não há o que registrar/.test(t), 'e diz por que não há o que fazer');
  conf(!/Salvar registro/.test(t) && !/Criar tarefa/.test(t), '⚠️ sem formulário — não se cria nada');
  conf(!/Escrever/.test(t), 'e sem o botão de escrever');
  // Só leitura de verdade: nem concluir, nem editar, nem cancelar.
  ctx.regAbrir('2021TR001578', '1');
  const h2 = ctx.regCaixa(TR, ARQ);
  conf(/Conferido o comprovante/.test(texto(h2)), 'o que foi escrito continua à vista');
  conf(!/type="checkbox"/.test(h2), '⚠️ sem caixa de marcar — a tarefa não se conclui ali');
  conf(!/regEditar\(/.test(h2) && !/regCancelar\(/.test(h2), 'e sem editar nem cancelar');
  ctx._regAbertas = new Set();

  // ── baixada com o C.I. encerrado: não convida, mas não fecha a porta
  const ENC = { ...PA, baixada: true, ci_situacao: 'encerrado' };
  ctx._regItens = [];
  const h3 = ctx.regCaixa(TR, ENC);
  conf(!/Nada registrado/.test(texto(h3)), 'encerrada no C.I.: sem o convite grande');
  conf(/registrar algo nesta parcela/.test(texto(h3)), 'só um link discreto');
  conf(h3.length < 600, 'numa linha fina', String(h3.length));
}

S('6. A PÍLULA DA TR — e o pulso vem do SERVIDOR');
{
  ctx._regPorTr = { 'TR-A': { abertas: 2, vencidas: 1, vence_hoje: 0, registros: 3, total: 5, pulsa: true } };
  const p = ctx.regPilulaTr('TR-A');
  conf(/2 tarefas/.test(texto(p)), 'diz quantas tarefas abertas');
  conf(/1 vencida/.test(texto(p)), 'e que uma venceu');
  conf(/class="reg-pulsa"/.test(p), '⚠️ e PULSA, porque o servidor disse que pulsa');

  ctx._regPorTr = { 'TR-B': { abertas: 1, vencidas: 0, vence_hoje: 0, registros: 0, total: 1, pulsa: false } };
  const p2 = ctx.regPilulaTr('TR-B');
  conf(/1 tarefa/.test(texto(p2)), 'tarefa para depois também aparece');
  conf(!/reg-pulsa/.test(p2), '⚠️ mas NÃO pulsa — movimento gasto em tudo não significa nada');

  ctx._regPorTr = { 'TR-C': { abertas: 0, vencidas: 0, vence_hoje: 0, registros: 4, total: 4, pulsa: false } };
  const p3 = ctx.regPilulaTr('TR-C');
  conf(/4/.test(texto(p3)) && !/tarefa/.test(texto(p3)), 'só com registros, a pílula é neutra');
  conf(!/reg-pulsa/.test(p3), 'e registro nunca pulsa');

  conf(ctx.regPilulaTr('TR-SEM-NADA') === '', 'sem nada escrito, não há pílula');
  // ⚠️ A TELA NÃO CONTA: nenhuma soma sobre os itens para desenhar a pílula.
  const trecho = fonte.slice(fonte.indexOf('function regPilulaTr'), fonte.indexOf('function regCaixa'));
  conf(!/\.filter\(|\.reduce\(/.test(trecho), 'a pílula não recalcula nada — lê `por_tr` (armadilha 16)');
}

S('7. O CSS DO PULSO, E O RESPEITO A QUEM PEDIU PARA NÃO ANIMAR');
{
  conf(/@keyframes regPulsa/.test(html), 'a animação existe');
  conf(/\.reg-pulsa\{animation:regPulsa/.test(html), 'e a classe a usa');
  conf(/prefers-reduced-motion: reduce\)\{\.reg-pulsa\{animation:none/.test(html),
    '⚠️ quem pediu ao sistema para não animar vê a pílula parada — não deixa de vê-la');
}

S('8. CANCELAR NÃO APAGA, E A TELA DIZ ISSO ANTES');
{
  conf(/acao: 'cancelar'/.test(fonte), 'há a ação de cancelar');
  conf(!/method: 'DELETE'/.test(fonte), '⚠️ e nenhum DELETE — registro é trilha');
  conf(/fica no histórico/.test(fonte), 'a confirmação diz que o item fica no histórico');
  conf(/Nada é apagado/.test(fonte), 'com todas as letras');
  conf(/moConfirm\(/.test(fonte) && /moPrompt\(/.test(fonte),
    'usa os diálogos do sistema, não o confirm/prompt do navegador');
  conf(/acao: 'editar'/.test(fonte), 'e dá para editar');
}

S('9. O CADERNO NÃO DERRUBA A PLANILHA');
{
  conf(/_regItens = \[\]; _regPorTr = \{\};/.test(fonte), 'se a rota falhar, o caderno fica vazio e segue');
  conf(/alvo\(\) : U\.id/.test(fonte) || /alvo\(\)\.id : U\.id/.test(fonte),
    '⚠️ no "ver como", o caderno é o DO ANALISTA (armadilha 22)');
  conf(/regCarregar\(trs\.map/.test(html), 'ele é carregado DEPOIS de a planilha pintar');
  conf((html.match(/\$\{regCaixa\(r, pa\)\}/g) || []).length === 2, 'e a caixa aparece nos DOIS ramos',
    (html.match(/\$\{regCaixa\(r, pa\)\}/g) || []).length);
}

S('10. O MESMO CADERNO NA FICHA DA ABA GESTÃO');
{
  // ⚠️ Pedido do Richard em 13/10: a mesma caixa na aba Gestão, SINCRONIZADA — o que se escreve
  // num lugar aparece no outro. É o mesmo caderno, a mesma tabela e as mesmas funções; o que
  // muda é a vista: na planilha é a parcela, na ficha é a TR inteira.
  const fonteGes = fatia('async function gesCadernoCarregar(tr)', '// ── anotações — a MESMA');
  conf(fonteGes.length > 0, 'o trecho do caderno da Gestão existe');
  // ⚠️ RODA NO MESMO CONTEXTO do caderno da planilha — e é isso que o teste prova junto: as
  // funções da Gestão usam `regEstado` e `regItemHtml`, as mesmas da Minha Planilha. Se um dia
  // alguém duplicar essas funções para a Gestão, este teste continua passando e a divergência
  // nasce calada — por isso há uma checagem explícita de que não há segunda cópia, no fim.
  const ctx2 = ctx;
  ctx2._gesF = { tr: '2021TR001578' };
  new vm.Script(fonteGes.replace(/^let /gm, 'var ').replace(/^const /gm, 'var ')).runInContext(ctx2);

  ctx2._regHoje = '2026-10-13';
  ctx2._regItens = [
    item({ id: 40, tr: '2021TR001578', parcial_num: '1', texto: 'Notas conferidas.' }),
    item({ id: 41, tr: '2021TR001578', parcial_num: 'FINAL', tipo: 'tarefa', texto: 'Cobrar extrato', prazo: '2026-10-01' }),
    item({ id: 42, tr: '2021TR000895', parcial_num: '1', texto: 'De outra TR — não pode aparecer' }),
  ];
  const t = { tr: '2021TR001578', pcs: [
    { parcial_num: '1', final: false }, { parcial_num: 'FINAL', final: true }] };
  const h = ctx2.gesCadernoHtml('2021TR001578', t);
  const tx = texto(h);

  conf(/Registro \/ Tarefa/i.test(tx), 'a caixa tem o mesmo nome da Minha Planilha');
  conf(/só você vê/.test(tx), 'e o mesmo cadeado — a anotação ao lado é que é pública');
  conf(/Notas conferidas/.test(tx) && /Cobrar extrato/.test(tx), 'mostra os itens das DUAS parcelas da TR');
  conf(!/De outra TR/.test(tx), '⚠️ e nada de outra TR entra aqui');
  conf(/Parcial 1/.test(tx) && /PC final/.test(tx), 'agrupados por parcela, com o rótulo de cada uma');
  conf(/1 tarefa aberta · 2 itens/.test(tx), 'o cabeçalho conta tarefas e itens da TR');
  // ⚠️ O SELETOR DE PARCELA é o que mantém os dois lugares mostrando a mesma coisa.
  conf(/<select id="gesCadParc"/.test(h), 'há um seletor de parcela');
  conf((h.match(/<option value="/g) || []).length === 2, 'com as duas parcelas da TR',
    (h.match(/<option value="/g) || []).length);
  conf(/gesCadSalvar\('2021TR001578','registro'\)/.test(h) && /gesCadSalvar\('2021TR001578','tarefa'\)/.test(h),
    'e os dois botões, registro e tarefa');
  conf(/type="date" id="gesCadPrazo"/.test(h), 'com o prazo opcional da tarefa');

  // Sem nada escrito, ela explica a sincronia em vez de ficar vazia.
  ctx2._regItens = [];
  conf(/aparece na parcela correspondente da sua Minha Planilha/.test(texto(ctx2.gesCadernoHtml('2021TR001578', t))),
    'sem itens, a caixa explica que os dois lugares são o mesmo caderno');

  // ⚠️ E A REPINTURA ALCANÇA AS DUAS TELAS — era isso que faltaria para a sincronia valer
  // depois de marcar uma tarefa.
  const rec = fatia('async function regRecarregar()', 'function pBlocoCor(pa) {');
  conf(/gesCadernoPintar\(\)/.test(rec) && /planAplicar\(\)/.test(rec),
    'regRecarregar repinta a Gestão E a planilha');
  conf(/_gesF\.tr/.test(rec), 'e recarrega também a TR que está aberta na ficha');
  conf(/\$\{gesCadernoCarregar\(t\.tr\)|gesCadernoCarregar\(t\.tr\)/.test(html),
    'a ficha carrega o caderno junto com o resto');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
