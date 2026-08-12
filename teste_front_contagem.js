// CAMINHO: sigpc-gt/teste_front_contagem.js
//
// Testes da CONTAGEM DE PARCIAIS na Minha Planilha. Sem navegador, sem rede.
//
// ⚠️ POR QUE ESTE ARQUIVO EXISTE
//
// Por 25 dias a tela contou a PC FINAL como se fosse uma parcial. O agrupamento e por
// `parcial_num`, e a final tem `parcial_num = 'FINAL'` — virava um grupo e entrava na conta.
//
// A analista Sandra Rocha pegou comparando com o SIGEF, em 12/08/2026:
//
//     2020TR000637 — SIGEF: 19 parciais · sistema: 21
//
// A conta fechou assim: 20 parciais reais + 1 PC final contada como parcial = 21.
// E das 20, uma (a parcial 23, PC 2021PC001882) tem processo_pc = '-1' e NAO existe no
// SIGEF. 20 - 1 = 19. Bate exatamente.
//
// Este teste tranca a metade que e de CODIGO: a final nunca mais conta como parcial.
// A outra metade e dado, e esta em auditoria.
//
// USO: node teste_front_contagem.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// Reproduz o agrupamento do index.html sobre dados de teste.
// ⚠️ `const` de seta NAO vira propriedade do contexto do vm — so declaracao de funcao vira.
// Por isso o ajudante vai concatenado no MESMO script, para enxergar a constante pelo
// escopo lexico. E a armadilha registrada no SESSAO.md.
const ctx = { console };
vm.createContext(ctx);
const iniH = html.indexOf('const planEhFinal =');
vm.runInContext(html.slice(iniH, iniH + 200) + `
function _ehFinal(p){ return planEhFinal(p) }`, ctx);
const ehFinal = ctx._ehFinal;

/** Monta os grupos como `buscarPlan` monta, e devolve as contagens. */
function contar(pcs) {
  const parciais = {};
  pcs.forEach(p => {
    const num = (p.parcial_num === null || p.parcial_num === undefined || p.parcial_num === '')
      ? '—' : String(p.parcial_num);
    (parciais[num] ||= { num, pcs: [] }).pcs.push(p);
  });
  const lista = Object.values(parciais).map(pa => ({ ...pa, soFinal: pa.pcs.every(ehFinal) }));
  return {
    grupos: lista.length,
    qtdParciais: lista.filter(p => !p.soFinal).length,
    qtdFinais: lista.filter(p => p.soFinal).length,
  };
}

const parcial = (num, pc) => ({ tipo:'parcial', parcial_num:String(num), codigo_pc:pc });
const final   = (num, pc) => ({ tipo:'final',   parcial_num:String(num), codigo_pc:pc });

console.log('\n═══ 1. O CASO REAL: 2020TR000637 ═══');
{
  // As 20 parciais reais da TR (com as lacunas 6,7,8,16,18) e a PC final.
  const nums = [1,2,3,4,5,9,10,11,12,13,14,15,17,19,20,21,22,23,24,25];
  const pcs = nums.map(n => parcial(n, 'PC'+n));
  pcs.push(final('FINAL', '2020TR000637-PFINAL'));

  const c = contar(pcs);
  conf(c.grupos === 21, 'o agrupamento cru da 21 grupos — o que a tela mostrava');
  conf(c.qtdParciais === 20, 'PARCIAIS agora sao 20', String(c.qtdParciais));
  conf(c.qtdFinais === 1, 'e a FINAL e contada a parte', String(c.qtdFinais));
  // ⚠️ O SIGEF diz 19. A diferenca que sobra e a parcial 23, que nao existe la — dado,
  // nao tela. Este teste NAO a resolve, e nao deve fingir que resolve.
  conf(c.qtdParciais - 1 === 19, 'e 20 - 1 (a parcial 23, PC com SGPe -1) = 19 = SIGEF');
}

console.log('\n═══ 2. AS TRES GRAFIAS DE "FINAL" ═══');
{
  // No acervo ha FINAL (981), Final (39) e final (1). O teste e por `tipo`, nao pelo texto
  // de `parcial_num` — senao duas grafias contariam diferente.
  ['FINAL','Final','final'].forEach(g => {
    const c = contar([parcial(1,'a'), parcial(2,'b'), final(g,'f')]);
    conf(c.qtdParciais === 2 && c.qtdFinais === 1, `grafia "${g}" e reconhecida como final`);
  });
  // E o `tipo` tambem aparece com espaco ou caixa trocada em carga.
  const c = contar([parcial(1,'a'), { tipo:' Final ', parcial_num:'FINAL', codigo_pc:'f' }]);
  conf(c.qtdFinais === 1, 'tipo com espaco e caixa trocada tambem conta como final');
}

console.log('\n═══ 3. AS CINCO FINAIS COM parcial_num = 1 ═══');
{
  // ⚠️ Essas NAO viram grupo proprio: misturam-se a parcial 1. Se a parcial 1 tem uma
  // parcial de verdade dentro, o grupo continua sendo uma PARCIAL — que e o correto.
  const misto = contar([parcial(1,'2021PC002391'), final(1,'2021TR002215-PFINAL'), parcial(2,'b')]);
  conf(misto.qtdParciais === 2, 'grupo misto (parcial + final na mesma chave) conta como parcial');
  conf(misto.qtdFinais === 0, 'e nao conta como final');

  // Mas quando a final esta SOZINHA na chave 1, o grupo e so final.
  const soFinal = contar([final(1,'2021TR001689-PFINAL'), parcial(2,'b')]);
  conf(soFinal.qtdParciais === 1 && soFinal.qtdFinais === 1,
       'final sozinha na chave 1 conta como final, nao como parcial');
}

console.log('\n═══ 4. TR SEM FINAL, E TR SO COM FINAL ═══');
{
  const semFinal = contar([parcial(1,'a'), parcial(2,'b'), parcial(3,'c')]);
  conf(semFinal.qtdParciais === 3 && semFinal.qtdFinais === 0, 'TR sem final: 3 parciais, 0 final');
  const soF = contar([final('FINAL','f')]);
  conf(soF.qtdParciais === 0 && soF.qtdFinais === 1, 'TR so com final: 0 parciais, 1 final');
  conf(contar([]).qtdParciais === 0, 'lista vazia nao quebra');
}

console.log('\n═══ 5. TRAVAS NO index.html ═══');
{
  conf(/qtdParciais: parciais\.filter\(p => !p\.soFinal\)\.length/.test(html),
       'qtdParciais exclui os grupos so-final');
  conf(/qtdFinais:\s+parciais\.filter\(p =>  p\.soFinal\)\.length/.test(html),
       'qtdFinais conta os grupos so-final');
  // ⚠️ O contador NAO pode voltar a usar parciais.length.
  conf(!/\$\{r\.parciais\.length\} parcia/.test(html),
       'o contador NAO usa mais parciais.length');
  conf(/\$\{r\.qtdParciais\} parcia/.test(html), 'e usa qtdParciais');
  conf(/r\.qtdFinais \? ` \+ \$\{r\.qtdFinais\} final`/.test(html),
       'e mostra "+ N final" quando existe');
  // O rotulo do cartao: "PARCIAL FINAL" era contraditorio.
  conf(!/PARCIAL \$\{escHtml\(pa\.num\)\}/.test(html), 'o cartao nao diz mais "PARCIAL FINAL"');
  conf((html.match(/pa\.soFinal \? 'PC FINAL'/g) || []).length === 2,
       'os dois ramos do cartao (aberta e baixada) dizem "PC FINAL"');
  // A regra tem de sair de `tipo`, nunca do texto de parcial_num.
  conf(/const planEhFinal = \(p\) => String\(p\?\.tipo\|\|''\)\.trim\(\)\.toLowerCase\(\) === 'final'/.test(html),
       'planEhFinal decide por `tipo`, com trim e minuscula');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
