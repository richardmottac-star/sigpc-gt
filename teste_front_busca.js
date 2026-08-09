// CAMINHO: sigpc-gt/teste_front_busca.js
//
// Testes da normalização de busca da TELA, extraindo as funções do próprio index.html e
// rodando em Node. Sem navegador, sem rede, sem login.
//
// O que protege: quem digita "São José" — a grafia correta — tem de achar
// "ASSOC ... DE SAO JOSE", que é como o acervo está gravado. Antes de 09/08/2026 não achava:
// a busca com acento devolvia tela vazia e a sem acento trazia 24 TRs.
//
// USO: node teste_front_busca.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('function escHtml(');
const fim = html.indexOf('async function carregarAnotacoes');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco de funcoes no index.html.');
  process.exit(1);
}
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const { semAcento, termoBusca } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

console.log('\n═══ 1. semAcento ═══');
{
  const casos = [
    ['São José', 'Sao Jose'], ['SÃO JOSÉ', 'SAO JOSE'], ['Sao Jose', 'Sao Jose'],
    ['Assunção', 'Assuncao'], ['Içara', 'Icara'], ['Içaí', 'Icai'],
    ['APAE', 'APAE'], ['2019TR000168', '2019TR000168'], ['', ''],
  ];
  for (const [entra, sai] of casos) {
    conf(semAcento(entra) === sai, `"${entra}" -> "${sai}"`, semAcento(entra));
  }
  conf(semAcento(null) === '' && semAcento(undefined) === '', 'null/undefined viram string vazia');
}

console.log('\n═══ 2. termoBusca — sem acento, minusculo, sem espaco nas pontas ═══');
{
  conf(termoBusca('  São José  ') === 'sao jose', 'apara, baixa a caixa e tira o acento');
  conf(termoBusca('SÃO JOSÉ') === 'sao jose', 'maiusculo acentuado');
  conf(termoBusca('sao jose') === 'sao jose', 'ja normalizado passa igual');
  conf(termoBusca(null) === '', 'null vira vazio');
}

console.log('\n═══ 3. O CASO REAL — como o acervo esta gravado ═══');
{
  // Amostras verdadeiras de prestacoes_contas.entidade (todas sem acento).
  const acervo = [
    'ASSOC.DE PAIS E AMIGOS DOS EXCEPCIONAIS- APAE DE SAO JOSE DO CERRITO-SC',
    'ASSOC DOS PAIS E AMIGOS DOS EXCEPCIONAIS DE SAO JOSE',
    'ASSOCIACAO DE PAIS E AMIGOS DOS EXCEPCIONAIS DE SAO JOSE DO CEDRO SC- APAE',
    'APAE DE ICARA',
  ];
  const acha = (termo) => acervo.filter(e => e.toLowerCase().includes(termoBusca(termo))).length;

  conf(acha('São José') === 3, 'digitando "São José" acha as 3 de Sao Jose', String(acha('São José')));
  conf(acha('SAO JOSE') === 3, 'digitando sem acento acha as mesmas 3');
  conf(acha('são josé') === 3, 'minusculo com acento tambem');
  conf(acha('Içara') === 1, '"Içara" acha "APAE DE ICARA"');
  conf(acha('xyz') === 0, 'termo que nao existe nao acha nada');
}

console.log('\n═══ 4. AS QUATRO BUSCAS DO FRONT USAM termoBusca ═══');
{
  // Guarda contra o esquecimento: tela nova que compare texto cru volta a ignorar acento.
  const usos = (html.match(/termoBusca\(/g) || []).length;
  conf(usos >= 5, `${usos} usos de termoBusca (1 definicao + 4 buscas)`);

  // Nenhuma das quatro pode ter voltado ao toLowerCase() cru sobre o campo do usuario.
  conf(!/getElementById\('plBusca'\)\?\.value\.trim\(\)\.toLowerCase\(\)/.test(html), 'Minha Planilha nao usa mais toLowerCase cru');
  conf(!/getElementById\('admBusca'\)\?\.value\|\|''\)\.toLowerCase\(\)/.test(html), 'Admin nao usa mais toLowerCase cru');
  conf(/const q = termoBusca\(_estBusca\)/.test(html), 'Estoque de PCs usa termoBusca');
  conf(/const q = termoBusca\(tr\)/.test(html), 'Relatorios usa termoBusca');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
