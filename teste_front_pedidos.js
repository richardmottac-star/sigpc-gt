// CAMINHO: sigpc-gt/teste_front_pedidos.js
//
// Testes das telas de PEDIDO DE VAGA (Meus pedidos e a aba Histórico de Aprovações),
// extraindo as funções do próprio index.html. Sem navegador, sem rede, sem login.
//
// O que protege:
//   · os cinco status têm apresentação, e um status desconhecido não quebra a tela;
//   · "dispensado" é só pendente + já assumida — negada ou expirada NÃO são dispensadas;
//   · o contador de pendentes e o badge do menu excluem os dispensados, senão a fila
//     parece maior do que é e o número vermelho deixa de ser lido.
//
// USO: node teste_front_pedidos.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('const PED_STATUS = {');
const fim = html.indexOf('async function irMeusPedidos(');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco dos pedidos de vaga no index.html.');
  process.exit(1);
}
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const { pedEtiqueta, pedDispensado } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

console.log('\n═══ 1. OS CINCO STATUS TEM APRESENTACAO ═══');
{
  const esperado = {
    pendente: 'PENDENTE', aprovada: 'APROVADA', usada: 'USADA',
    negada: 'NEGADA', expirada: 'EXPIRADA', cancelada: 'CANCELADA',
  };
  Object.entries(esperado).forEach(([st, rot]) => {
    conf(pedEtiqueta(st).includes(rot), `'${st}' vira "${rot}"`);
  });

  // O CHECK do banco pode ganhar um status novo antes desta tela. Melhor mostrar o nome cru
  // do que quebrar a lista inteira de pedidos.
  const novo = pedEtiqueta('reaberta');
  conf(novo.includes('REABERTA'), 'status desconhecido nao quebra: mostra o nome cru');
  conf(pedEtiqueta(null).includes('—'), 'status nulo nao estoura');
  conf(pedEtiqueta(undefined).includes('—'), 'status indefinido nao estoura');
}

console.log('\n═══ 2. EXPIRADA E CANCELADA NAO COMPETEM POR ATENCAO ═══');
{
  // Cinza de proposito: nao sao derrota nem vitoria. Se saissem vermelhas, o analista leria
  // "expirou" como se tivesse sido negado — e o assunto e outro, e a culpa tambem.
  const cinza = '#6B7280';
  conf(pedEtiqueta('expirada').includes(cinza), 'expirada sai cinza, nao vermelha');
  conf(pedEtiqueta('cancelada').includes(cinza), 'cancelada sai cinza');
  conf(pedEtiqueta('negada').includes('#B02A37'), 'negada sim, essa e vermelha');
  conf(pedEtiqueta('aprovada').includes('#1B7A3E'), 'aprovada verde');
  conf(pedEtiqueta('usada').includes('#1B7A3E'), 'usada tambem verde — foi aprovada e gasta');
}

console.log('\n═══ 3. DISPENSADO = PENDENTE + JA ASSUMIDA, e so isso ═══');
{
  conf(pedDispensado({ status:'pendente', ja_assumida:true }) === true,
       'pendente de uma TR que ele ja assumiu: dispensado');
  conf(pedDispensado({ status:'pendente', ja_assumida:false }) === false,
       'pendente normal: NAO dispensado');

  // A armadilha: `ja_assumida` continua true depois de decidido, porque a TR e dele mesmo.
  // Se o "dispensado" olhasse so esse campo, todo pedido aprovado viraria "dispensado" no
  // historico — e o coordenador leria que sua propria aprovacao foi inutil.
  conf(pedDispensado({ status:'aprovada', ja_assumida:true }) === false,
       'aprovada com a TR ja assumida: NAO e dispensada, foi aprovacao que valeu');
  conf(pedDispensado({ status:'usada', ja_assumida:true }) === false, 'usada: nao e dispensada');
  conf(pedDispensado({ status:'negada', ja_assumida:false }) === false, 'negada: nao');
  conf(pedDispensado({ status:'expirada', ja_assumida:false }) === false, 'expirada: nao');
  conf(pedDispensado({ status:'cancelada', ja_assumida:false }) === false, 'cancelada: nao');

  // Resposta antiga da API, sem o campo: nao pode virar `undefined` na tela.
  conf(pedDispensado({ status:'pendente' }) === false, 'sem o campo: trata como nao dispensado');
  conf(pedDispensado(null) === false, 'null nao estoura');
}

console.log('\n═══ 4. A CONTA DA FILA EXCLUI OS DISPENSADOS ═══');
{
  // Mesma conta em dois lugares — a aba "Pendentes (N)" e o badge vermelho do menu. Se um
  // dia divergirem, o menu vai pedir atencao para uma fila que a tela mostra vazia.
  const fila = [
    { status:'pendente', ja_assumida:false },
    { status:'pendente', ja_assumida:true  },   // dispensado
    { status:'pendente', ja_assumida:false },
    { status:'pendente', ja_assumida:true  },   // dispensado
  ];
  const contar = (l) => l.filter(s => !pedDispensado(s)).length;
  conf(contar(fila) === 2, '4 pendentes, 2 dispensados -> a fila real e 2', `deu ${contar(fila)}`);

  const sohDispensados = [{ status:'pendente', ja_assumida:true }];
  conf(contar(sohDispensados) === 0, 'so dispensados -> 0, e o badge some');

  conf(contar([]) === 0, 'lista vazia -> 0');
}

console.log('\n═══ 5. O MODAL DO LIMITE ATINGIDO ═══');
{
  // O bloco do limite mora em `limiteAviso`, fora da faixa extraida acima — vai por texto.
  const iLim = html.indexOf('function limiteAviso(lim, tr)');
  const bLim = html.slice(iLim, html.indexOf('async function limitePedir('));
  if (iLim < 0 || !bLim) {
    conf(false, 'achei a funcao limiteAviso no index.html');
  } else {
    conf(/Limite atingido<\/div>/.test(bLim), 'a faixa vermelha tem o titulo "Limite atingido"');
    conf(/background:#C62828;color:#fff;font-size:12px;font-weight:800/.test(bLim),
         'e o fundo da faixa e o #C62828 pedido');

    // O pedido e a UNICA acao possivel aqui — por isso ocupa a largura inteira.
    conf(/display:block;width:100%/.test(bLim), 'o botao do pedido e de largura total');
    conf(/background:#C62828;color:#fff;\s*\n?\s*font-weight:800/.test(bLim),
         'fundo #C62828, texto branco e negrito');
    conf(/➕ Pedir vaga extra para esta TR/.test(bLim), 'com icone e o rotulo combinado');
    conf(/O pedido vai para sua coordenação — você é avisado pelo sino quando houver resposta\./.test(bLim),
         'e a linha cinza explicando para onde o pedido vai');

    // ⚠️ O ambar antigo nao pode ter sobrado: dois botoes de pedido no mesmo bloco seriam
    // dois caminhos para a mesma acao, e o menor pareceria o secundario.
    conf(!/Solicitar mais uma TR</.test(bLim), 'o botao ambar "Solicitar mais uma TR" saiu do bloco');
  }

  // ⚠️ Sumir e SO no limite. Na reserva o cinza fica: a TR pode voltar a ser dele em 3 dias,
  // e oferecer "pedir vaga extra" ali mandaria pedir uma TR que ja e de outro.
  const iSum = html.indexOf('function assLimiteAtingido(lim)');
  const bSum = html.slice(iSum, iSum + 400);
  const ctxL = { console };
  vm.createContext(ctxL);
  vm.runInContext(bSum.slice(0, bSum.indexOf('\n}') + 2), ctxL);
  const { assLimiteAtingido } = ctxL;

  conf(assLimiteAtingido({ pode:false }) === true, 'limite atingido -> o Assumir some');
  conf(assLimiteAtingido({ pode:false, reserva:{ nome:'Ana' } }) === false,
       'RESERVA nao some — e outra conversa, e o cinza ali explica');
  conf(assLimiteAtingido({ pode:false, jaMinha:true }) === false, 'ja e minha tambem nao some');
  conf(assLimiteAtingido({ pode:true }) === false, 'sem bloqueio nenhum, o Assumir fica');
  conf(assLimiteAtingido(null) === false, 'previa que nao carregou nao esconde nada');

  // O terceiro argumento tem de CHEGAR ao assBotao — senao a funcao existe e nao muda a tela.
  conf(/assBotao\(ASS_PREVIA\.pode,[\s\S]{0,160}?assLimiteAtingido\(ASS_PREVIA\)\)/.test(html),
       'e assumirTR passa isso para o assBotao');
  // Como `sumir` nasce indefinido, as chamadas de dois argumentos repoem o botao.
  conf(/b\.style\.display = sumir \? 'none' : ''/.test(html),
       'o assBotao repoe o botao quando sumir nao vem');
}

console.log('\n═══ 6. A FILA DE DEVOLUCAO DE TR ═══');
{
  // O bloco da fila mora fora da faixa extraida no topo — vai por texto.
  const i = html.indexOf('function devAprovCard(s) {');
  const b = html.slice(i, html.indexOf('async function devDecidir(', i));
  const iR = html.indexOf('function devAprovRender(c) {');
  const bR = html.slice(iR, i);

  // ⚠️ O motivo 1 NAO manda ao estoque: manda DIRETO para o indicado. E o ponto em que a
  // tela poderia enganar — o coordenador aprovaria achando que devolveu.
  conf(/A TR vai DIRETO para/.test(b), 'o cartao avisa que a TR vai DIRETO para o indicado');
  conf(/nao para o estoque|não para o estoque/.test(b), 'dizendo que NAO vai ao estoque');
  conf(/Carga hoje/.test(b) && /limite 6/.test(b), 'e mostra a carga do indicado com o limite');
  conf(/o limite NÃO barra a transferência/.test(b),
       'deixando claro que o limite nao barra — quem decide e o coordenador');

  // Os dois botoes nascem desabilitados, com o motivo no title (armadilha 15).
  conf((b.match(/disabled onclick="devDecidir/g) || []).length === 2,
       'Recusar e Aprovar nascem DESABILITADOS');
  conf(/Aprovar e transferir/.test(b) && /Aprovar e devolver/.test(b),
       'e o rotulo do Aprovar muda conforme o destino');

  // ⚠️ No bloqueio, RECUSAR continua ativo: pedido pendente para sempre e pior que recusa
  // com motivo escrito.
  const iP = html.indexOf('function devPintarDecisao(id) {');
  const bP = html.slice(iP, iP + 900);
  conf(/neg\.disabled = !!faltaTexto/.test(bP), 'Recusar depende SO do texto');
  conf(/apr\.disabled = !!faltaTexto \|\| !!imped/.test(bP), 'Aprovar depende do texto E do impedimento');

  // Sem aprovar em lote: um "aprovar todos" daria dez avisos com o mesmo texto generico.
  conf(!/aprovar.?todos|selecionar.?todos/i.test(b + bR), 'nao ha aprovacao em lote');

  // O vazio nao e erro, e oferece o caminho de quem quer conferir o que ja decidiu.
  conf(/Nenhum pedido de devolução/.test(bR), 'o vazio explica que nao ha pedido');
  conf(/você é avisado pelo sino/.test(bR), 'e diz que o sino avisa quando houver');
  conf(/Ver todas as decididas/.test(bR), 'com o atalho para as decididas');

  // ⚠️ O SOLICITANTE NAO DECIDE O PROPRIO PEDIDO. A tela nao mostra botoes que a rota vai
  // recusar — mostra de quem e a decisao.
  const iD = html.indexOf('function devPodeDecidir(s) {');
  const bD = html.slice(iD, iD + 600);
  const ctxD = { console, U: null };
  vm.createContext(ctxD);
  vm.runInContext(bD.slice(0, bD.indexOf('\n}') + 2), ctxD);
  const ped = { analista_id: 31, analista_grupo: '3' };

  ctxD.U = { id: 31, perfil: 'coordenador', grupo: '3' };
  conf(ctxD.devPodeDecidir(ped) === false, 'coordenador NAO decide o proprio pedido');
  ctxD.U = { id: 56, perfil: 'coordenador', grupo: '3' };
  conf(ctxD.devPodeDecidir(ped) === true, 'mas decide o dos outros do grupo dele');
  ctxD.U = { id: 57, perfil: 'coordenador', grupo: '2' };
  conf(ctxD.devPodeDecidir(ped) === false, 'e nao decide o de outro grupo');
  // EXCECAO: o superadmin decide o proprio, porque nao ha ninguem acima dele.
  ctxD.U = { id: 31, perfil: 'superadmin', grupo: '3' };
  conf(ctxD.devPodeDecidir(ped) === true, 'o SUPERADMIN decide o proprio');

  conf(/Este pedido é seu — quem decide é a coordenação do seu grupo/.test(b),
       'e o cartao explica de quem e a decisao, em vez de botao morto');
  conf(/Você pode decidir porque é superadmin/.test(b),
       'o superadmin e avisado de que o registro vai marcar');
  conf(/Quem pediu e quem decidiu são a mesma pessoa/.test(b),
       'e o cartao decidido carrega a marca');

  const iA = html.indexOf('function devAutodecidido(s) {');
  const bA = html.slice(iA, iA + 320);
  conf(/decidido_por.*===.*analista_id|String\(s\.decidido_por\) === String\(s\.analista_id\)/.test(bA),
       'a marca sai de decidido_por = analista_id — sem coluna nova');

  // A mesma regra de impedimento do servidor, para o botao nao prometer o que a rota recusa.
  const iI = html.indexOf('function devImpedimento(s) {');
  const bI = html.slice(iI, iI + 700);
  conf(/s\.motivo !== 'analise_anterior'/.test(bI), 'so o motivo 1 confere o indicado');
  conf(/não tem cadastro no sistema/.test(bI), 'sem cadastro, bloqueia');
  conf(/INATIVO/.test(bI), 'inativo tambem');
}


console.log('\n═══ 9. O INDICADO DO MOTIVO 1 E LISTA FECHADA (03/09/2026) ═══');
{
  // ⚠️ ISTO NASCEU DE UM DEFEITO MEDIDO, e a secao existe para ele nao voltar. O campo era um
  // `datalist`, que SUGERE e aceita texto livre: a Marlene digitou "Juliana" em vez de
  // escolher "Juliana de Souza", o `confDev` casava por igualdade exata contra
  // `usuarios.nome`, o `indicado_id` foi gravado NULO, o Enviar acendeu igual — e o pedido 7
  // so foi recusado 14 dias depois, por um erro que ela nao tinha como ver.
  //
  // ⚠️ E E A SEGUNDA VEZ que o `datalist` custa isto neste arquivo: a categoria do
  // Repositorio virou `select` em 18/08 pelo mesmo motivo. Por isso a marcacao e conferida
  // aqui, e nao so o comportamento.
  conf(/<select id="devIndicado"/.test(html), 'o campo e um <select>, nao um <input>');
  conf(!/list="devAnalistas"/.test(html) && !/<datalist id="devAnalistas"/.test(html),
       'o datalist saiu — nao ha mais como digitar um nome');
  conf(/<option value="">Selecione o analista<\/option>/.test(html),
       'a primeira opcao e em branco, com o texto pedido');

  // ── O comportamento, rodando as funcoes DE VERDADE num DOM de mentira ────────
  //
  // ⚠️ O RECORTE VAI DE `devIndicadoPintar` ATE `confDev`, e nao um numero de caracteres:
  // fatia fixa mente quando o codigo cresce (armadilha 30).
  const iP = html.indexOf('function devIndicadoPintar()');
  const fP = html.indexOf('async function confDev()');
  conf(iP > 0 && fP > iP, 'as funcoes do campo estao no arquivo');

  const els = {};
  ['devIndicado', 'devIndicadoAviso', 'devJust', 'devJustConta', 'btnConfDev'].forEach((id) => {
    els[id] = { id, value: '', innerHTML: '', textContent: '', disabled: false, title: '', style: {} };
  });
  const c2 = {
    console,
    escHtml: (s) => String(s == null ? '' : s),
    PED_ANALISTAS: [],
    PED_PREVIA: { pode: true, motivo_bloqueio: null,
                  motivos: [{ id: 'analise_anterior', exigeIndicado: true }, { id: 'outro' }] },
    _motivo: '',
    document: { getElementById: (id) => els[id] || null, querySelector: () => null },
  };
  vm.createContext(c2);
  vm.runInContext(html.slice(iP, fP) + `
function devMotivoEscolhido(){ return _motivo }
function _setAnalistas(l){ PED_ANALISTAS = l }
function _setMotivo(m){ _motivo = m }
`, c2);

  // 'Ândrea' esta aqui de proposito: sem o locale 'pt-BR' no localeCompare ela cai no fim.
  c2._setAnalistas([
    { id: 45, nome: 'Juliana de Souza' },
    { id: 46, nome: 'Marlene Teodoro Ramos da Silva' },
    { id: 19, nome: 'Ândrea Zamboni' },
    { id: 22, nome: 'Ana Claudia' },
  ]);
  c2.devIndicadoPintar();

  const opts = [...els.devIndicado.innerHTML.matchAll(/<option value="(\d+)">([^<]+)</g)];
  conf(JSON.stringify(opts.map((m) => m[2]))
       === JSON.stringify(['Ana Claudia', 'Ândrea Zamboni', 'Juliana de Souza', 'Marlene Teodoro Ramos da Silva']),
       'ordenada por nome, e o acento no lugar certo (pt-BR)', JSON.stringify(opts.map((m) => m[2])));
  // ⚠️ O `value` E O ID, e nao o nome: e a armadilha 1 resolvida na origem, em vez de
  // conferida depois por igualdade de texto.
  conf(opts.some((m) => m[1] === '45' && m[2] === 'Juliana de Souza'),
       'o value de cada opcao e o ID, e o texto e o nome');
  conf(els.devIndicado.value === '', 'nasce sem escolha');

  els.devJust.value = 'justificativa suficiente';
  c2._setMotivo('analise_anterior');

  els.devIndicado.value = '';
  c2.devPintarBotao();
  conf(els.btnConfDev.disabled === true, 'sem escolha o Enviar fica APAGADO');
  conf(/Selecione na lista/.test(els.btnConfDev.title), 'e o motivo esta no title — cinza nunca e mudo');

  els.devIndicado.value = '45';
  c2.devPintarBotao();
  conf(els.btnConfDev.disabled === false, 'com analista escolhido, acende');
  conf(c2.devIndicadoEscolhido().id === 45 && c2.devIndicadoEscolhido().nome === 'Juliana de Souza',
       'e resolve para o id 45 COM o nome completo — os dois saem da mesma opcao');

  // ⚠️ O CASO DO PEDIDO 7, virado teste: um nome solto no campo nao acende mais nada.
  els.devIndicado.value = 'Juliana';
  c2.devPintarBotao();
  conf(els.btnConfDev.disabled === true, 'um valor que nao e id de ninguem NAO acende (o pedido 7)');
  conf(c2.devIndicadoEscolhido() === null, 'e nao resolve para analista nenhum');

  // Os outros cinco motivos nao pedem indicado, e nao podem ficar travados por causa disto.
  c2._setMotivo('outro');
  els.devIndicado.value = '';
  c2.devPintarBotao();
  conf(els.btnConfDev.disabled === false, 'motivo sem indicado acende sem escolha nenhuma');

  // ⚠️ O PRECO DA LISTA FECHADA: sem ela carregada, o motivo 1 fica sem caminho. Nao pode
  // ficar sem caminho E sem explicacao.
  c2._setAnalistas([]);
  c2.devIndicadoPintar();
  conf(/Não foi possível carregar a lista/.test(els.devIndicadoAviso.textContent),
       'lista vazia: o aviso sob o campo TROCA e diz que ela nao carregou', els.devIndicadoAviso.textContent);
  c2._setMotivo('analise_anterior');
  c2.devPintarBotao();
  conf(els.btnConfDev.disabled === true && /lista de analistas não carregou/.test(els.btnConfDev.title),
       'e o Enviar fica apagado dizendo isso', els.btnConfDev.title);

  // ── O que o modal MANDA para a rota ──────────────────────────────────────────
  const iC = html.indexOf('async function confDev()');
  const bC = html.slice(iC, html.indexOf('\n}', iC));
  conf(/const achado = devIndicadoEscolhido\(\)/.test(bC),
       'o confDev le a opcao escolhida, e nao o texto do campo');
  conf(/indicado_nome: achado \? achado\.nome : null/.test(bC),
       'e o nome vai da MESMA opcao do id — nunca do que a pessoa digitou');
  conf(!/PED_ANALISTAS\.find\(u => u\.nome === nome\)/.test(html),
       'o casamento por igualdade de nome saiu do arquivo');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
