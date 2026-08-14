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

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
