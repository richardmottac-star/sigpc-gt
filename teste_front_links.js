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
const fimMarca = html.indexOf('async function carregarAnotacoes');
if (ini < 0 || fimMarca < 0) {
  console.error('FALHA: nao achei o bloco do link no index.html (escHtml .. carregarAnotacoes).');
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

console.log('\n═══ 4. O QUE A API NAO MANDOU FICA TEXTO PURO ═══');
{
  // Processo bem formado que não veio no mapa: PC que entrou depois da última passada do job,
  // ou processo que o SGPe não tem. Some o link, some qualquer marcação — a coluna continua
  // legível e o cron resolve na próxima hora. Nada de <span> nem de pergunta à API.
  const h = procHtml('SCC9999/2021');
  conf(!h.includes('<a '), 'sem link', h);
  // ⚠️ Era "sem marcacao residual" ate 13/08/2026, quando o processo passou a ser CORRIGIVEL.
  // O <span> de hoje nao e residuo: e' o ambar que diz "este processo esta sem link", ao lado
  // do lapis. A marcacao proibida continua proibida — <a> (link que nao existe) e data-proc
  // (a pergunta por celula que foi apagada em 09/08).
  conf(!h.includes('data-proc'), 'sem a marcacao antiga de pergunta por celula', h);
  conf(!/onclick=/.test(h), 'e sem lapis quando nao ha PC de referencia', h);
  conf(h === 'SCC 00009999/2021' || h.length > 0, 'o numero continua na tela', h);
}

console.log('\n═══ 5. A REGEX NAO PODE VOLTAR ═══');
{
  // Guarda contra reintrodução. Enquanto esta tela não normalizar nada, não existe a segunda
  // cópia da regra — que foi o que divergiu em silêncio em 05/08.
  conf(!/const SGPE_PADRAO/.test(html), 'SGPE_PADRAO nao existe mais no index.html');
  conf(!/function sgpeChave/.test(html), 'sgpeChave nao existe mais');
  conf(!/data-proc/.test(html), 'nenhum <span data-proc> restante');
  conf(!/sgpeResolverPendentes|sgpeObservar/.test(html), 'resolvedor e observador removidos');
  conf(!/sgpe\/links/.test(html), 'a tela nao chama mais POST /sgpe/links');
  // O corpo de procHtml tem de caber em um lookup — se crescer, alguem esta normalizando.
  const corpo = (html.match(/function procHtml\(bruto\) \{([\s\S]*?)\n\}/) || [])[1] || '';
  conf(!/match\(|replace\(|toUpperCase\(/.test(corpo), 'procHtml nao manipula o texto do processo', corpo.trim());
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
  // Duas formas de absorver, e as duas contam:
  //   direta ....... const j = sgpeAbsorver(await r.json())
  //   pelo helper .. const j = await fetchListaCompleta(url)   <- chama sgpeAbsorver por dentro
  //
  // A âncora `const j =` no início da linha exclui o exemplo que aparece dentro do comentário
  // de `sgpeAbsorver` — um contador inflado esconderia ponto faltando.
  // O corpo do helper sai da contagem: o `sgpeAbsorver` que mora dentro dele nao e um ponto
  // de tela, e sim o mecanismo pelo qual as telas que o usam absorvem.
  const corpoHelper = (html.match(/async function fetchListaCompleta[\s\S]*?\n\}/) || [''])[0];
  const semHelper = html.replace(corpoHelper, '');

  const direto = (semHelper.match(/^\s*const j = sgpeAbsorver\(await r\.json\(\)\)/gm) || []).length;
  // Duas formas de chamar o helper, e as duas absorvem igual:
  //   const j = await fetchListaCompleta(url)
  //   const [j] = await Promise.all([ fetchListaCompleta(url), ... ])   <- Minha Planilha
  // A segunda apareceu em 11/08, quando a planilha passou a buscar em paralelo as respostas
  // de diligencia. A ancora antiga so via a primeira e acusou 11 de 12: o mecanismo estava
  // intacto, era o teste que enxergava uma sintaxe so. Contar `await fetchListaCompleta`
  // resolveria por acaso — a contagem e por CHAMADA, que e o que de fato absorve.
  const viaHelper   = (semHelper.match(/^\s*const j = await fetchListaCompleta\(/gm) || []).length;
  const viaParalelo = (semHelper.match(/^\s*fetchListaCompleta\(/gm) || []).length;
  // ⚠️ Era 12 ate 12/08/2026. Caiu para 11 quando a devolucao de TR deixou de baixar a
  // lista de PCs: a previa passou a vir de `GET /tr/:tr/devolucao`, que devolve CONTAGENS
  // (quantas voltam, quantas baixadas, quantas no C.I.) e nenhum processo SGPe. Tela que
  // nao desenha processo nao tem link a absorver — tirar o `sgpeAbsorver` de la e' certo,
  // nao regressao. Se este numero cair de novo, confira se a tela que saiu desenha SGPe.
  conf(direto + viaHelper + viaParalelo === 11,
       `${direto} diretos + ${viaHelper} pelo helper + ${viaParalelo} em paralelo = 11 telas absorvendo j.links`);

  // O helper PRECISA absorver — se alguem tirar o sgpeAbsorver de dentro dele, quatro telas
  // perdem o link de uma vez, em silencio.
  conf((corpoHelper.match(/sgpeAbsorver\(/g) || []).length >= 2, 'fetchListaCompleta absorve nas duas requisicoes que faz');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
