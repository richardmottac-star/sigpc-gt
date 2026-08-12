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
const { semAcento, termoBusca, prepararBusca } = ctx;

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
  // conjunto inteiro). Tem de continuar assim, e pelo `casaBusca` compartilhado — a cobertura
  // de campos e testada na secao 4b, no proprio casaBusca, e nao mais repetida aqui.
  const bloco = (html.match(/function estDadosFiltrados\(\)[\s\S]*?\n\}/) || [''])[0];
  conf(/_estDados\.filter/.test(bloco), 'Estoque de PCs continua filtrando no cliente', bloco.trim());
  conf(/casaBusca\(p, b\)/.test(bloco), 'e usa o casaBusca compartilhado, nao uma lista propria');
  conf(/prepararBusca\(_estBusca\)/.test(bloco), 'preparando o termo uma vez, fora do filter');
}

console.log('\n═══ 4b. casaBusca — os seis campos, um por um ═══');
{
  // `function` vira propriedade do contexto; `const` NAO — ver o mesmo caso no topo.
  const casaBusca = ctx.casaBusca;
  const CAMPOS_BUSCA = vm.runInContext('CAMPOS_BUSCA', ctx);
  const linha = {
    tr: '2020TR000657', processo_mae: 'SCC2070/2020', processo_pc: 'SCC9692/2020',
    entidade: 'ASSOCIACAO DOS PAIS E AMIGOS DO AUTISTA - AMA',
    codigo_nl: '2020NL007584', codigo_pc: '2020PC000520',
  };
  conf(CAMPOS_BUSCA.length === 6, 'sao 6 campos', String(CAMPOS_BUSCA.length));
  const parciais = { tr: '000657', processo_mae: 'SCC2070', processo_pc: '9692',
                     entidade: 'autista', codigo_nl: '007584', codigo_pc: 'PC000520' };
  for (const [campo, termo] of Object.entries(parciais)) {
    conf(casaBusca(linha, termoBusca(termo)), `acha por ${campo} com termo parcial "${termo}"`);
  }
  conf(casaBusca(linha, termoBusca('AUTÍSTA')), 'acha com acento no termo');
  conf(!casaBusca(linha, termoBusca('zzz')), 'termo inexistente nao casa');
  conf(casaBusca(linha, ''), 'termo vazio casa tudo');
  conf(!casaBusca({}, termoBusca('x')), 'linha vazia nao estoura');
}

console.log('\n═══ 4a2. PROCESSO SGPe — zeros a esquerda e separadores ═══');
{
  const chaveProcesso = ctx.chaveProcesso;
  const casaBusca = ctx.casaBusca;

  // As quatro grafias reais do acervo tem de convergir.
  const grupos = [
    ['SCC 00019172/2020', 'SCC19172/2020', 'SCC 19172/2020'],
    ['SCC 00002511/2020', 'SCC2511/2020'],
    ['ADR22 2679/2017', 'ADR2226792017'],
    ['ADR20 1233/2017', 'ADR20 00001233/2017', 'ADR20-1233/2017'],
  ];
  for (const g of grupos) {
    const ks = g.map(chaveProcesso);
    conf(ks.every(k => k === ks[0]), `${g.length} grafias de "${g[0]}" -> ${ks[0]}`, ks.join(' | '));
  }

  // Os casos exatos do relato.
  const linha = { processo_pc: 'SCC 00019172/2020', processo_mae: 'SCC2511/2020', tr: '', entidade: '', codigo_nl: '', codigo_pc: '' };
  for (const t of ['SCC 19172/2020', 'SCC 00019172/2020', '19172', 'SCC19172/2020']) {
    conf(casaBusca(linha, prepararBusca(t)), `"${t}" acha a linha`);
  }
  const linha2 = { processo_pc: 'SCC 00002070/2023', processo_mae: '', tr: '', entidade: '', codigo_nl: '', codigo_pc: '' };
  conf(casaBusca(linha2, prepararBusca('SCC 2070')), '"SCC 2070" acha "SCC 00002070/2023"');
  conf(casaBusca(linha, prepararBusca('SCC 2511')), '"SCC 2511" acha "SCC2511/2020" (na mae)');
  conf(!casaBusca(linha, prepararBusca('SCC 9999')), 'numero que nao existe na linha nao casa');

  // Zeros internos nao podem sumir.
  conf(chaveProcesso('SCC1000/2020') === 'SCC10002020', 'zero interno preservado', chaveProcesso('SCC1000/2020'));
  conf(chaveProcesso(null) === '' && chaveProcesso('-1') === '1', 'lixo nao estoura');
}

console.log('\n═══ 4c. ADMIN — CPF com e sem mascara, e nome nulo ═══');
{
  // ⚠️ o fim tem de ser a funcao SEGUINTE a adminFiltrar. `admPodeGerenciar` fica ANTES dela
  // no arquivo, e usa-la como marcador dava um recorte vazio.
  const iniA = html.indexOf('function adminFiltrar()');
  const fimA = html.indexOf('function abrirNovoUsuario', iniA);
  const trecho = iniA >= 0 && fimA > iniA ? html.slice(iniA, fimA) : null;
  if (!trecho) {
    conf(false, 'nao achei adminFiltrar no index.html');
  } else {
    const users = [
      { id: 1, nome: 'Richard Motta Coelho', cpf: '038.237.359-69', perfil: 'analista', ativo: true },
      { id: 2, nome: 'Nayara Limas Ferreira', cpf: '538.066.039-87', perfil: 'coordenador', ativo: true },
      { id: 3, nome: null, cpf: null, perfil: 'analista', ativo: true },   // o caso que estourava
    ];
    const els = {};
    const doc = { getElementById: (id) => els[id] || null };
    const ctxA = {
      console, document: doc, _admUsers: users, U: { perfil: 'superadmin' },
      termoBusca: ctx.termoBusca, soDigitos: ctx.soDigitos,
      perfilLabel: () => 'x', admPodeGerenciar: () => true,
      // Desde 12/08 o `adminFiltrar` também alimenta a seleção em bloco: guarda os ids
      // visíveis e manda a barra se atualizar. Quem testa a BUSCA não testa isso — mas
      // precisa fornecer as peças, senão a função nem roda.
      // A regra da seleção tem suíte própria: teste_front_bloco.js.
      _admSel: new Set(), _admVisiveis: [], admBarraAtualizar: () => {},
    };
    vm.createContext(ctxA);
    vm.runInContext(trecho, ctxA);

    const filtrar = (termo) => {
      els.admBusca = { value: termo };
      els.admTblTit = { textContent: '' };
      els.admTblSub = { textContent: '' };
      els.admBody = { innerHTML: '' };
      ctxA.adminFiltrar();
      return parseInt(els.admTblTit.textContent) || 0;
    };

    conf(filtrar('038.237.359-69') === 1, 'CPF completo COM mascara acha');
    conf(filtrar('03823735969') === 1, 'CPF completo SEM mascara acha');
    conf(filtrar('038237') === 1, 'pedaco do CPF, so digitos, acha');
    conf(filtrar('038.237') === 1, 'pedaco do CPF com ponto acha');
    conf(filtrar('359-69') === 1, 'final do CPF com hifen acha');
    conf(filtrar('richard') === 1, 'busca por nome continua funcionando');
    conf(filtrar('MOTTA') === 1, 'nome em maiuscula acha');
    conf(filtrar('') === 3, 'sem termo, lista todos');
    conf(filtrar('zzz') === 0, 'termo inexistente nao acha ninguem');
    // A armadilha: termo sem digito nao pode virar busca de CPF vazia e casar todo mundo.
    conf(filtrar('joao') === 0, 'termo sem digito NAO casa todo mundo por CPF vazio');
    // E o usuario de nome nulo nao pode derrubar o filtro.
    conf(els.admBody.innerHTML !== undefined, 'usuario com nome nulo nao estoura o filtro');
  }
}

console.log('\n═══ 4d. fetchListaCompleta — teto de limit nao trunca em silencio ═══');
{
  const chamadas = [];
  const ctxF = {
    console: { warn: () => {}, log: () => {} },
    sgpeAbsorver: (j) => j,
    URL,
    fetch: async (url) => {
      chamadas.push(url);
      const u = new URL(url);
      const limit = Number(u.searchParams.get('limit'));
      const TOTAL = 12000;                       // mais que o teto de 9999
      const n = Math.min(limit, TOTAL);
      return { json: async () => ({ data: Array.from({ length: n }, (_, i) => ({ id: i })), count: TOTAL, error: null }) };
    },
  };
  const iniF = html.indexOf('async function fetchListaCompleta');
  const fimF = html.indexOf('async function carregarAnotacoes');
  vm.createContext(ctxF);
  vm.runInContext(html.slice(iniF, fimF), ctxF);

  ctxF.fetchListaCompleta('https://api.x/prestacoes_contas?limit=9999').then(j => {
    conf(j.data.length === 12000, 'refez o pedido e trouxe as 12.000', `veio ${j.data.length}`);
    conf(chamadas.length === 2, 'exatamente 2 requisicoes (a cortada + a completa)', `foram ${chamadas.length}`);
    conf(/limit=12000/.test(chamadas[1]), 'a segunda pediu limit=count');
    return ctxF.fetchListaCompleta('https://api.x/prestacoes_contas?limit=99999');
  }).then(() => {
    conf(chamadas.length === 3, 'quando o limite cabe, NAO refaz', `total de requisicoes ${chamadas.length}`);
  }).catch(e => conf(false, 'erro no teste de fetchListaCompleta', e.message));
}

console.log('\n═══ 4e. CONTROLE INTERNO — busca nova ═══');
{
  const iniC = html.indexOf('function ciDadosFiltrados()');
  const fimC = html.indexOf('function ciRender(', iniC);
  if (iniC < 0 || fimC < 0) {
    conf(false, 'nao achei ciDadosFiltrados no index.html');
  } else {
    const dados = [
      { tr: '2020TR000657', processo_pc: 'SCC9692/2020', processo_mae: 'SCC2070/2020',
        entidade: 'APAE DE SAO JOSE', codigo_nl: '2020NL007584', codigo_pc: '2020PC000520' },
      { tr: '2019TR000111', processo_pc: 'FCEE111/2019', processo_mae: 'FCEE1/2019',
        entidade: 'APAE DE ICARA', codigo_nl: '2019NL000222', codigo_pc: '2019PC000333' },
    ];
    let pintou = null;
    const ctxC = {
      console, setTimeout, clearTimeout,
      _ciDados: dados, _ciBusca: '',
      termoBusca: ctx.termoBusca, casaBusca: ctx.casaBusca, prepararBusca: ctx.prepararBusca,
      ciRender: (v) => { pintou = v; },
      document: { getElementById: () => null },
    };
    vm.createContext(ctxC);
    vm.runInContext(html.slice(iniC, fimC), ctxC);

    const filtrar = (t) => { vm.runInContext(`_ciBusca = ${JSON.stringify(t)}`, ctxC); return ctxC.ciDadosFiltrados().length; };
    conf(filtrar('') === 2, 'sem termo devolve tudo');
    conf(filtrar('000657') === 1, 'acha por pedaco da TR');
    conf(filtrar('9692') === 1, 'acha por SGPe da PC');
    conf(filtrar('SCC2070') === 1, 'acha por SGPe mae');
    conf(filtrar('São José') === 1, 'acha por entidade COM acento');
    conf(filtrar('007584') === 1, 'acha por NL');
    conf(filtrar('PC000520') === 1, 'acha por codigo da PC');
    conf(filtrar('APAE') === 2, 'termo comum acha as duas');
    conf(filtrar('zzz') === 0, 'inexistente nao acha');
    // `_ciDados` tem de continuar completo — a devolucao procura a PC nele.
    conf(vm.runInContext('_ciDados.length', ctxC) === 2, '_ciDados continua completo apos filtrar');
  }
}

console.log('\n═══ 4f. LOG DE ESTORNOS — busca nova ═══');
{
  // O evento agrupa varias PCs e so guarda os codigos; `_busca` e montado no carregamento
  // com os seis campos de cada PC. Aqui se confere que o texto montado cobre tudo.
  const iniL = html.indexOf('function estLogFiltrar()');
  const fimL = html.indexOf('function estLogRenderCards', iniL);
  if (iniL < 0 || fimL < 0) {
    conf(false, 'nao achei estLogFiltrar no index.html');
  } else {
    const ev = (id, texto) => ({ analista_id: id, data_estorno: '2026-08-01T10:00:00Z', pcs: ['x'], _busca: termoBusca(texto) });
    const eventos = [
      ev(4, '2020TR000657 SCC2070/2020 SCC9692/2020 APAE DE SAO JOSE 2020NL007584 2020PC000520 Richard'),
      ev(7, '2019TR000111 FCEE1/2019 FCEE111/2019 APAE DE ICARA 2019NL000222 2019PC000333 Nayara'),
    ];
    let recebeu = null;
    const els = { estLogBusca: { value: '' }, estLogAnalista: { value: '' }, estLogDtIni: { value: '' }, estLogDtFim: { value: '' } };
    const ctxL = {
      console, window: {}, _estLogEventos: eventos,
      termoBusca: ctx.termoBusca, prepararBusca: ctx.prepararBusca,
      document: { getElementById: (id) => els[id] || null },
      estLogRenderCards: (l) => { recebeu = l; },
      estLogRenderTabela: () => {},
    };
    vm.createContext(ctxL);
    vm.runInContext(html.slice(iniL, fimL), ctxL);

    const filtrar = (t) => { els.estLogBusca.value = t; ctxL.estLogFiltrar(); return recebeu.length; };
    conf(filtrar('') === 2, 'sem termo devolve tudo');
    conf(filtrar('000657') === 1, 'acha por pedaco da TR');
    conf(filtrar('9692') === 1, 'acha por SGPe da PC');
    conf(filtrar('SCC2070') === 1, 'acha por SGPe mae');
    conf(filtrar('Içara') === 1, 'acha por entidade COM acento');
    conf(filtrar('007584') === 1, 'acha por NL');
    conf(filtrar('PC000333') === 1, 'acha por codigo da PC');
    conf(filtrar('nayara') === 1, 'acha pelo nome do analista');
    conf(filtrar('APAE') === 2, 'termo comum acha os dois');
    conf(filtrar('zzz') === 0, 'inexistente nao acha');
    // A busca tem de conviver com os filtros que ja existiam.
    els.estLogAnalista.value = '4';
    conf(filtrar('APAE') === 1, 'busca combina com o filtro de analista');
    els.estLogAnalista.value = '';
  }
}

console.log('\n═══ 4g. BOTAO BUSCAR EM TODAS AS TELAS ═══');
{
  // O botao nasceu so no Estoque de TRs; as outras buscavam apenas ao digitar, e quem
  // procurava o botao achava que a tela nao tinha busca.
  const usos = (html.match(/\$\{BTN_BUSCAR\('/g) || []).length;
  conf(usos === 6, `${usos} telas com o botao Buscar (esperado 6)`);

  for (const acao of ['buscar()', 'buscarPlan()', 'adminFiltrar()', 'ciBuscarAgora()', 'estBuscarAgora()', 'estLogBuscarAgora()']) {
    conf(html.includes(`\${BTN_BUSCAR('${acao}')}`), `botao chamando ${acao}`);
  }

  // Nao pode ter sobrado o markup antigo copiado a mao.
  conf((html.match(/class="btn-buscar" onclick="buscar\(\)"/g) || []).length === 0, 'o botao antigo do Estoque foi trocado pelo compartilhado');

  // As tres telas com debounce precisam de um "aplicar agora" que cancele o timer — senao o
  // clique no botao pintaria, e 150ms depois o debounce pintaria de novo.
  for (const fn of ['ciBuscarAgora', 'estBuscarAgora', 'estLogBuscarAgora']) {
    const corpo = (html.match(new RegExp(`function ${fn}\\(\\)[\\s\\S]*?\\n\\}`)) || [''])[0];
    conf(/clearTimeout/.test(corpo), `${fn} cancela o debounce pendente`, corpo.trim().slice(0, 60));
  }

  // A busca ao digitar continua existindo em todas.
  for (const id of ['ciBusca', 'estBusca', 'admBusca', 'estLogBusca']) {
    conf(new RegExp(`id="${id}"[^>]*oninput=`).test(html), `${id} mantem a busca ao digitar`);
  }
  for (const id of ['fBusca', 'plBusca']) {
    conf(new RegExp(`id="${id}"[^>]*onkeydown=`).test(html), `${id} mantem a busca no Enter`);
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
