// CAMINHO: sigpc-gt/teste_front_paginacao.js
//
// A PAGINA NUNCA PASSA DO FIM DA LISTA  (07/10/2026)
//
// ⚠️ O QUE ELE GUARDA: que um filtro que ENCOLHE o resultado nao deixe a tabela vazia com o
// contador cheio. A analista Marlene teve duas TRs aprovadas, foi ao Estoque, estava na pagina
// 5 da lista completa e buscou a TR pelo numero. A tela respondeu "1 TRs encontradas" no
// cabecalho e "Nenhum registro encontrado" na tabela, com o rodape dizendo "Pag. 5 de 1" — e
// ela concluiu que a TR nao existia.
//
// ⚠️ E O CONSERTO NAO FOI NO BOTAO BUSCAR. Zerar a pagina la arrumaria o caminho que alguem
// viu e deixaria de pe todos os outros que encolhem a lista: o filtro de status, o de setorial,
// o campo de processo, o de entidade. Recuar a pagina vale para qualquer um deles.
//
// USO: node teste_front_paginacao.js

const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ⚠️ A janela termina num MARCO DO PROPRIO CODIGO, nunca num numero — armadilha 30.
const entre = (de, ate) => {
  const i = html.indexOf(de);
  if (i < 0) return '';
  const f = html.indexOf(ate, i);
  return f < 0 ? html.slice(i) : html.slice(i, f);
};

S('1. O ESTOQUE RECUA A PAGINA QUANDO A LISTA ENCOLHE');
{
  const fn = entre('    TOT = TRS_EST.length', 'renderPag()');
  conf(fn.length > 0, 'o trecho da paginacao existe');
  conf(/const ultimaPag = Math\.max\(0, Math\.ceil\(TOT \/ PP\) - 1\)/.test(fn), 'calcula a ultima pagina valida');
  conf(/if \(PAG > ultimaPag\) PAG = ultimaPag/.test(fn), 'e recua a pagina antes de cortar a lista');
  // ⚠️ A ORDEM IMPORTA: recuar DEPOIS do slice nao adianta — a tabela ja teria sido montada vazia.
  const iRecuo = fn.indexOf('PAG = ultimaPag');
  const iSlice = fn.indexOf('TRS_EST.slice(');
  conf(iRecuo > 0 && iSlice > iRecuo, 'o recuo vem ANTES do corte da lista');
  // Com lista vazia a conta nao pode dar pagina negativa.
  conf(/Math\.max\(0,/.test(fn), 'lista vazia nao gera pagina negativa');
}

S('2. A SEGUNDA LISTA DA MESMA TELA TEM A MESMA PROTECAO');
{
  const fn = entre("  if (_estPag > Math.max(0, totalPaginas - 1))", 'if(bPrx)');
  conf(fn.length > 0, 'a protecao existe na segunda lista');
  conf(/_estPag = Math\.max\(0, totalPaginas - 1\)/.test(fn), 'recua para a ultima pagina valida');
  conf(/return estRender\(\)/.test(fn), 'e redesenha com a pagina corrigida');
}

S('3. A CONTA, PROVADA NOS CASOS QUE IMPORTAM');
{
  // A mesma expressao do arquivo, rodada aqui: e o comportamento que se quer, nao o texto.
  const PP = 20;
  const recuar = (TOT, PAG) => { const u = Math.max(0, Math.ceil(TOT / PP) - 1); return PAG > u ? u : PAG; };
  conf(recuar(1, 5) === 0, 'o caso da Marlene: 1 registro e pagina 5 -> volta para a primeira');
  conf(recuar(0, 3) === 0, 'lista vazia -> primeira pagina, nunca negativa');
  conf(recuar(41, 5) === 2, '41 registros e pagina 5 -> ultima valida e a 2 (terceira)');
  conf(recuar(41, 0) === 0, 'quem ja esta na primeira pagina fica onde esta');
  conf(recuar(100, 4) === 4, 'e a pagina valida NAO e mexida');
  // ⚠️ A paginacao normal continua funcionando: recuar nao pode prender a pessoa na pagina 1.
  conf(recuar(1000, 7) === 7, 'navegar nas paginas de uma lista grande continua livre');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
