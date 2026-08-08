// CAMINHO: sigpc-gt/teste_front_links.js
//
// Testes do caminho de link da TELA, extraindo as funções do próprio index.html e rodando-as
// em Node. Sem navegador, sem rede, sem login.
//
// Extrair do arquivo real (em vez de copiar o código para cá) é o que faz o teste continuar
// valendo quando o index.html mudar — uma cópia divergiria em silêncio, que é exatamente o
// erro que esta frente inteira existe para não repetir.
//
// USO: node teste_front_links.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Recorta o trecho que vai de escHtml até o fim de procHtml — é o caminho inteiro do link.
const ini = html.indexOf('function escHtml(');
const fimMarca = html.indexOf('async function sgpeResolverPendentes');
if (ini < 0 || fimMarca < 0) {
  console.error('FALHA: nao achei o bloco do link no index.html (escHtml .. sgpeResolverPendentes).');
  process.exit(1);
}
const codigo = html.slice(ini, fimMarca);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(codigo, ctx);
// `function` vira propriedade do contexto; `const` NÃO — para o Map é preciso avaliar
// a expressão dentro do próprio contexto.
const { procHtml, sgpeAbsorver } = ctx;
const _sgpeCache = vm.runInContext('_sgpeCache', ctx);

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

const URL_A = 'https://sgpe.sea.sc.gov.br/cpav/visualizarDocumentosProcesso.do?processoPK=5950,4267,2019&itemAba=aba_pecas';

console.log('\n═══ 1. CAMINHO NOVO — link vem do mapa da API, sem regex ═══');
{
  // Exatamente o formato que a API devolve: chave crua.
  sgpeAbsorver({ data: [], links: { 'FCEE5830/2019': URL_A } });
  const h = procHtml('FCEE5830/2019');
  conf(h.includes('<a href='), 'virou <a> na primeira pintura');
  conf(h.includes(URL_A.replace(/&/g, '&amp;')) || h.includes(URL_A), 'com a url que a API mandou');
  conf(!h.includes('data-proc'), 'NAO deixou <span data-proc> — nao vai perguntar de novo', h);
}

console.log('\n═══ 2. AS GRAFIAS QUE A CHAVE CANONICA PERDERIA ═══');
{
  // Estas três convivem no acervo e apontam para processos diferentes; todas têm de casar
  // pelo valor cru, sem passar por regex nenhuma.
  sgpeAbsorver({ links: {
    'FCEE 00000968/2020':  'https://x/?processoPK=974,4267,2020',
    'SDR18 00006140/2013': 'https://x/?processoPK=6182,6988,2013',
    'SCC2146/2020':        'https://x/?processoPK=2150,10068,2020',
  } });
  conf(procHtml('FCEE 00000968/2020').includes('974,4267,2020'), 'espaco + zeros a esquerda');
  conf(procHtml('SDR18 00006140/2013').includes('6182,6988,2013'), 'regiao na sigla com separador');
  conf(procHtml('SCC2146/2020').includes('2150,10068,2020'), 'sigla colada ao numero');
}

console.log('\n═══ 3. O QUE NAO E PROCESSO CONTINUA TEXTO PURO ═══');
{
  for (const lixo of ['Aguardando protocolo', '-', 'SCC 6579', '9223/2026', '']) {
    const h = procHtml(lixo);
    conf(!h.includes('<a ') && !h.includes('data-proc'), `"${lixo}" -> texto puro`, h);
  }
  conf(procHtml(null) === '' || !procHtml(null).includes('<a '), 'null nao quebra');
}

console.log('\n═══ 4. REDE DE SEGURANCA — o que a API nao mandou ainda vira <span> ═══');
{
  // Processo válido que não veio no mapa: tem de continuar caindo no caminho antigo, senão
  // uma rota esquecida perderia o link em silêncio.
  const h = procHtml('SCC9999/2021');
  conf(h.includes('data-proc="SCC 9999/2021"'), 'vira <span data-proc> com a chave canonica', h);
}

console.log('\n═══ 5. NEGATIVA CONHECIDA NAO VIRA <span> ═══');
{
  _sgpeCache.set('SCC 18870/2026', null);   // é assim que o resolvedor antigo grava
  const h = procHtml('SCC18870/2026');
  conf(!h.includes('data-proc'), 'nao pergunta de novo', h);
  conf(!h.includes('<a '), 'e nao vira link');
}

console.log('\n═══ 6. sgpeAbsorver E TOLERANTE ═══');
{
  conf(sgpeAbsorver(undefined) === undefined, 'resposta undefined nao quebra');
  conf(sgpeAbsorver({ data: [] }) !== null, 'resposta sem `links` nao quebra');
  const j = { data: [1], links: { 'X1/2020': 'u' } };
  conf(sgpeAbsorver(j) === j, 'devolve o mesmo objeto, para encaixar no `const j = ...`');
}

console.log('\n═══ 7. TODA ROTA QUE RENDERIZA PROCESSO ABSORVE O MAPA ═══');
{
  // Guarda contra o esquecimento: se alguém criar uma tela nova e não absorver, o número
  // volta a depender do resolvedor antigo — e ninguém percebe, porque o link continua saindo.
  const absorve = (html.match(/sgpeAbsorver\(await r\.json\(\)\)/g) || []).length;
  conf(absorve >= 12, `${absorve} pontos absorvendo j.links (esperado >= 12)`);
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
