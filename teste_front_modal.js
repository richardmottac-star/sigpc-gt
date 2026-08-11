// CAMINHO: sigpc-gt/teste_front_modal.js
//
// Testes dos MODAIS DO SISTEMA, extraindo as funções do próprio index.html.
// Sem navegador, sem rede, sem login.
//
// O motor (`moDialogo`) monta DOM e não roda aqui. O que roda é a REGRA — `moValido` e
// `moNota` — que é justamente o que muda em relação ao `prompt()` do navegador: validar
// ANTES de fechar, em vez de recusar depois e a pessoa perder o que escreveu.
//
// USO: node teste_front_modal.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('function moValido(');
const fim = html.indexOf('function moDialogo(');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco dos modais no index.html.');
  process.exit(1);
}
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const { moValido, moNota } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

console.log('\n═══ 1. SEM REGRA, TUDO VALE ═══');
{
  // Substituindo prompt() puro, onde qualquer coisa era aceita — inclusive vazio.
  conf(moValido('', {}) === true, 'vazio vale quando nao ha exigencia');
  conf(moValido('qualquer coisa', {}) === true, 'texto vale');
  conf(moValido(null, {}) === true, 'null nao estoura');
  conf(moValido(undefined) === true, 'sem opcoes nao estoura');
}

console.log('\n═══ 2. OBRIGATORIO ═══');
{
  const o = { obrigatorio: true };
  conf(moValido('justifiquei', o) === true, 'com texto: vale');
  conf(moValido('', o) === false, 'vazio: nao vale');
  // Espaco em branco e o caso que passa despercebido: o prompt() aceitava, o servidor
  // recusava, e a pessoa so descobria depois.
  conf(moValido('   ', o) === false, 'so espaco: NAO vale');
  conf(moValido('\n\n  \t', o) === false, 'so quebra de linha e tabulacao: nao vale');
}

console.log('\n═══ 3. MINIMO DE CARACTERES (o motivo do estorno) ═══');
{
  const o = { min: 15 };
  conf(moValido('a'.repeat(14), o) === false, '14 de 15: nao vale');
  conf(moValido('a'.repeat(15), o) === true,  '15 de 15: vale');
  conf(moValido('a'.repeat(90), o) === true,  'acima do minimo: vale');
  conf(moValido('', o) === false, 'vazio: nao vale');

  // Conta DEPOIS de aparar. Sem isso, 15 espacos passariam pelo minimo e o servidor
  // recusaria depois — exatamente o que se quer acabar.
  conf(moValido('   ' + 'a'.repeat(13) + '   ', o) === false,
       'espaco nas pontas nao conta para o minimo');
}

console.log('\n═══ 4. O RODAPE DIZ O QUE FALTA ═══');
{
  conf(moNota('a'.repeat(12), { min: 15 }) === '12 de 15 caracteres',
       'abaixo do minimo mostra o alvo', moNota('a'.repeat(12), { min: 15 }));
  conf(moNota('a'.repeat(20), { min: 15 }) === '20 caracteres',
       'atingido, some o alvo — o objetivo ja foi cumprido');
  conf(moNota('abc', {}) === '3 caracteres', 'sem minimo, so conta');
  conf(moNota('', { obrigatorio: true }) === 'obrigatório', 'vazio e obrigatorio: avisa');
  conf(moNota('', {}) === '', 'vazio e opcional: nao polui a tela com nada');
  conf(moNota(null, {}) === '', 'null nao estoura');
}

console.log('\n═══ 5. AS DUAS CONCORDAM ═══');
{
  // O rodape e o botao leem a MESMA regra. Se divergissem, apareceria "15 caracteres" com o
  // botao cinza — e ninguem entenderia o que falta.
  const casos = [
    ['', { obrigatorio: true }], ['   ', { obrigatorio: true }], ['ok', { obrigatorio: true }],
    ['a'.repeat(14), { min: 15 }], ['a'.repeat(15), { min: 15 }], ['x', {}], ['', {}],
  ];
  let coerentes = 0;
  casos.forEach(([t, o]) => {
    const vale = moValido(t, o);
    const nota = moNota(t, o);
    // Quando NAO vale, a nota nunca pode parecer conclusiva.
    const notaOk = vale ? true : (nota === 'obrigatório' || /de \d+ caracteres/.test(nota) || nota === '');
    if (notaOk) coerentes++;
  });
  conf(coerentes === casos.length, `os ${casos.length} casos batem entre botao e rodape`, `${coerentes}/${casos.length}`);
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
