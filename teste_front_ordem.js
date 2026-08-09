// CAMINHO: sigpc-gt/teste_front_ordem.js
//
// Testes da ORDEM DE TRABALHO POR ANO DA TR, extraindo as funções do próprio index.html.
// Sem navegador, sem rede, sem login.
//
// A regra não é cronológica, é por risco:
//   1º 2020 (ainda permite glosa e cobrança) · 2º 2021+ crescente · 3º pré-2020 decrescente
//
// USO: node teste_front_ordem.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('function anoTR(');
const fim = html.indexOf('// O botão Buscar, um só para todas as telas.');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco da ordem por ano no index.html.');
  process.exit(1);
}
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const { anoTR, ordemAnoTR, compararAnoTR } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

console.log('\n═══ 1. anoTR — o ano sai do inicio do codigo ═══');
{
  conf(anoTR('2020TR000617') === 2020, '"2020TR000617" -> 2020');
  conf(anoTR('2017TR000001') === 2017, '"2017TR000001" -> 2017');
  conf(anoTR('2024TR000204') === 2024, '"2024TR000204" -> 2024');
  conf(anoTR('2020 TR000777') === 2020, 'com espaco no meio (caso real do acervo) -> 2020');
  conf(anoTR(null) === null && anoTR('') === null, 'null/vazio -> null');
  conf(anoTR('TR000617') === null, 'sem ano -> null');
}

console.log('\n═══ 2. A SEQUENCIA EXATA PEDIDA ═══');
{
  // Uma TR por ano presente no acervo (2017..2024) mais anos futuros, embaralhadas.
  const trs = ['2019TR000100', '2024TR000100', '2017TR000100', '2021TR000100',
               '2026TR000100', '2020TR000100', '2018TR000100', '2022TR000100',
               '2023TR000100', '2025TR000100'];
  const ordenado = [...trs].sort(compararAnoTR).map(anoTR);
  const esperado = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2019, 2018, 2017];
  conf(JSON.stringify(ordenado) === JSON.stringify(esperado),
       'ordem final: ' + esperado.join(' · '), ordenado.join(' · '));
}

console.log('\n═══ 3. AS TRES REGRAS, UMA A UMA ═══');
{
  const antes = (a, b) => compararAnoTR(a, b) < 0;
  conf(antes('2020TR1', '2021TR1'), '2020 antes de 2021');
  conf(antes('2020TR1', '2019TR1'), '2020 antes de 2019');
  conf(antes('2020TR1', '2026TR1'), '2020 antes de 2026 (2020 e sempre o primeiro)');
  conf(antes('2021TR1', '2022TR1'), 'depois de 2020, crescente: 2021 antes de 2022');
  conf(antes('2025TR1', '2026TR1'), '2025 antes de 2026');
  conf(antes('2026TR1', '2019TR1'), 'qualquer ano pos-2020 antes de qualquer pre-2020');
  conf(antes('2019TR1', '2018TR1'), 'pre-2020 decrescente: 2019 antes de 2018');
  conf(antes('2018TR1', '2017TR1'), '2018 antes de 2017');
  conf(antes('2017TR1', 'SEMANO'), 'TR sem ano legivel vai para o fim');
}

console.log('\n═══ 4. DENTRO DO MESMO ANO, O ANO NAO DESEMPATA ═══');
{
  // O desempate por numero e feito por quem chama, com `|| localeCompare`.
  conf(compararAnoTR('2020TR000999', '2020TR000001') === 0, 'mesmo ano -> empate (0)');
  const mesmoAno = ['2020TR000617', '2020TR000123', '2020TR000999'];
  const ordenado = [...mesmoAno].sort((a, b) => compararAnoTR(a, b) || a.localeCompare(b));
  conf(JSON.stringify(ordenado) === JSON.stringify(['2020TR000123', '2020TR000617', '2020TR000999']),
       'com o desempate, fica crescente por numero', ordenado.join(' · '));
}

console.log('\n═══ 5. COMO AS TELAS USAM ═══');
{
  // Estoque de TRs: status continua em cima; o ano ordena dentro dele.
  const blocoEst = (html.match(/TRS_EST\.sort\([\s\S]*?\}\)/) || [''])[0];
  conf(/EST_ORDEM_EXIBICAO\.indexOf/.test(blocoEst), 'Estoque: status continua sendo o primeiro criterio');
  conf(/compararAnoTR\(a\.tr, b\.tr\)/.test(blocoEst), 'Estoque: ano entra depois do status');
  conf(/localeCompare/.test(blocoEst), 'Estoque: numero da TR continua desempatando');

  // Minha Planilha: a ordem "Em análise primeiro" mudou de endereco em 09/08/2026 — saiu do
  // `trs.sort` dentro do buscarPlan e virou uma das opcoes do dropdown do painel
  // (PLAN_ORDENS.analise). A REGRA e a mesma: pendentes, depois ano, depois numero.
  const blocoPlan = (html.match(/analise: \{ rotulo:'Em análise primeiro',[\s\S]*?\},/) || [''])[0];
  conf(/pendentes>0/.test(blocoPlan), 'Planilha: pendentes continuam vindo primeiro', blocoPlan.trim());
  conf(/compararAnoTR\(a\.tr,b\.tr\)/.test(blocoPlan), 'Planilha: ano entra depois dos pendentes');
  conf(/localeCompare/.test(blocoPlan), 'Planilha: numero da TR continua desempatando');
  // e o alfinete tem de vir por cima de todas as ordens, inclusive dessa
  conf(/\(b\.fixada\?1:0\) - \(a\.fixada\?1:0\) \|\| cmp\(a,b\)/.test(html), 'Planilha: fixada vem antes de qualquer ordem');

  // Estoque de PCs: NAO usa — decisao registrada no codigo.
  const blocoPag = (html.match(/function estMontarPaginas[\s\S]*?\n\}/) || [''])[0];
  conf(!/compararAnoTR/.test(blocoPag), 'Estoque de PCs NAO ordena por ano (PCs ja baixadas)');
  conf(/NÃO SE APLICA a ordem por ano/.test(html), 'e a razao esta escrita no codigo');
}

console.log('\n═══ 6. SIMULACAO COM A DISTRIBUICAO REAL DO ACERVO ═══');
{
  // TRs por ano medidas em producao em 09/08/2026.
  const acervo = { 2017: 190, 2018: 1, 2019: 14, 2020: 204, 2021: 390, 2022: 544, 2023: 83, 2024: 133 };
  const lista = [];
  for (const [ano, n] of Object.entries(acervo)) {
    for (let i = 0; i < n; i++) lista.push(`${ano}TR${String(i).padStart(6, '0')}`);
  }
  // embaralha de forma determinista (sem Math.random, para o teste nao variar)
  lista.sort((a, b) => (a.slice(-3) + a).localeCompare(b.slice(-3) + b));
  const ordenado = lista.sort((a, b) => compararAnoTR(a, b) || a.localeCompare(b));

  const anos = ordenado.map(anoTR);
  conf(anos[0] === 2020, 'a primeira TR da lista e de 2020', String(anos[0]));
  conf(anos[203] === 2020 && anos[204] === 2021, 'as 204 de 2020 vem antes da primeira de 2021');
  conf(anos[anos.length - 1] === 2017, 'a ultima e de 2017 (a mais antiga)', String(anos[anos.length - 1]));
  // sequencia dos blocos, sem repetir
  const blocos = anos.filter((a, i) => i === 0 || a !== anos[i - 1]);
  conf(JSON.stringify(blocos) === JSON.stringify([2020, 2021, 2022, 2023, 2024, 2019, 2018, 2017]),
       'blocos na ordem: 2020 · 2021-2024 · 2019 · 2018 · 2017', blocos.join(' · '));
  conf(ordenado.length === 1559, 'as 1.559 TRs do acervo continuam todas na lista', String(ordenado.length));
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
