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

console.log('\n═══ 4. QUEM BUSCA NA API, QUEM BUSCA NO CLIENTE ═══');
{
  // Tres telas mandam `busca` para a API e NAO filtram localmente.
  const mandam = (html.match(/(params|p)\.set\('busca',/g) || []).length;
  conf(mandam === 3, `${mandam} telas mandam busca para a API (Estoque de TRs, Relatorios, Minha Planilha)`);

  // Minha Planilha: o filtro de cliente saiu.
  conf(!/pcs = pcs\.filter\(p => \(p\.tr\|\|''\)\.toLowerCase\(\)/.test(html), 'Minha Planilha nao filtra mais no cliente');
  conf(/if\(busca\) params\.set\('busca', busca\)/.test(html), 'Minha Planilha manda busca para a API');

  // Relatorios: idem, e o campo deixou de ser so TR.
  conf(!/dados = dados\.filter\(p => \(p\.tr\|\|''\)\.toLowerCase\(\)/.test(html), 'Relatorios nao filtra mais no cliente');
  conf(/if\(tr\) params\.set\('busca', tr\)/.test(html), 'Relatorios manda busca para a API');
  conf(!/placeholder="Ex: 2022TR000251"/.test(html), 'rotulo do campo de Relatorios foi corrigido');

  // Estoque de PCs: filtra no cliente DE PROPOSITO (oninput por tecla + contador precisa do
  // conjunto inteiro). Tem de continuar assim, e cobrindo os mesmos campos da API.
  conf(/const q = termoBusca\(_estBusca\)/.test(html), 'Estoque de PCs continua filtrando no cliente');
  const bloco = (html.match(/function estDadosFiltrados\(\)[\s\S]*?\n\}/) || [''])[0];
  for (const campo of ['tr', 'processo_mae', 'processo_pc', 'entidade', 'codigo_nl', 'codigo_pc']) {
    conf(bloco.includes(`p.${campo}`), `Estoque de PCs cobre ${campo}`);
  }
}

console.log('\n═══ 5. DEBOUNCE do Estoque de PCs ═══');
{
  // Roda o `estBuscarInput` de verdade, com `estRender` dublado, e simula digitacao rapida.
  const ini5 = html.indexOf('let _estBuscaTimer');
  const fim5 = html.indexOf('function estPg(');
  const espera = (ms) => new Promise(res => setTimeout(res, ms));

  if (ini5 < 0 || fim5 < 0) {
    conf(false, 'nao achei estBuscarInput no index.html');
    encerrar();
  } else {
    let pinturas = 0;
    const ctx5 = { setTimeout, clearTimeout, console, _estBusca: '', _estPag: 9, estRender: () => { pinturas++; } };
    vm.createContext(ctx5);
    vm.runInContext(html.slice(ini5, fim5), ctx5);

    // digitando "apae": 4 teclas em rajada
    for (const v of ['a', 'ap', 'apa', 'apae']) ctx5.estBuscarInput(v);

    conf(pinturas === 0, 'nao pinta durante a rajada de digitacao', `pinturas=${pinturas}`);
    conf(vm.runInContext('_estBusca', ctx5) === 'apae', 'o termo ja vale na hora, sem esperar');
    conf(vm.runInContext('_estPag', ctx5) === 0, 'volta para a primeira pagina na hora');

    espera(260)
      .then(() => {
        conf(pinturas === 1, '4 teclas -> 1 pintura so, depois da pausa', `pinturas=${pinturas}`);
        ctx5.estBuscarInput('apae d');   // uma tecla isolada depois tem de pintar de novo
        return espera(260);
      })
      .then(() => {
        conf(pinturas === 2, 'nova digitacao depois da pausa pinta de novo', `pinturas=${pinturas}`);
        encerrar();
      })
      .catch(e => { conf(false, 'erro no teste de debounce', e.message); encerrar(); });
  }
}

function encerrar() {
  console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
  process.exit(falhou ? 1 : 0);
}
