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
// ⚠️ O TRECHO EXTRAIDO CRESCEU, E A SUITE MORREU EM SILENCIO. Entre `escHtml` e
// `carregarAnotacoes` moram hoje o logo do SGPe, os dois campos de TR/processo e os
// `addEventListener` deles — codigo que TOCA O DOM no momento em que e avaliado. Sem estes
// cocos o `vm` derruba tudo antes da primeira checagem, e o que se ve no terminal e um
// `ReferenceError`, nunca um "falhou": um teste que nao roda nao reprova nada.
// ⚠️ O DOM DESTE CONTEXTO E APONTAVEL, e nao um `() => null` fixo. As funcoes do componente
// (`campoTrTermo`, `campoProcTermo`) sao compiladas AQUI, entao o `document` que elas enxergam
// e este — passa-las para outro contexto sem isto faz elas lerem sempre `null` e devolverem
// vazio, e o teste "passa" medindo nada. Quem precisa delas aponta o `ctxEls` para os seus
// campos antes de chamar.
let ctxEls = {};
const ctx = {
  console, Set, Map, URLSearchParams, window: {},
  API_URL: '', LOGO_SIGEF_B64: '', LOGO_SGPE_B64: '',
  fetch: async () => ({ json: async () => ({ data: {} }) }),
  document: {
    getElementById: (id) => ctxEls[id] || null, querySelector: () => null,
    querySelectorAll: () => [], addEventListener: () => {},
  },
};
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
  // ⚠️ O RECORTE PARA NA PROXIMA FUNCAO, E NAO LA NO `carregarAnotacoes` (31/08/2026). Este
  // bloco CONTA requisicoes: um recorte largo passou a arrastar junto o `siglasCarregar()`
  // dos campos novos, que tambem faz um `fetch` — e a contagem virou 3 onde a regra fala de
  // 2. O teste nao estava errado sobre o `fetchListaCompleta`; ele estava medindo outra coisa.
  const fimF = html.indexOf('function normalizarProcesso(str)');
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

console.log('\n═══ 4e. CONTROLE INTERNO — a busca passou para o SERVIDOR (25/08/2026) ═══');
{
  // ⚠️ A TELA DO C.I. NAO FILTRA MAIS NO NAVEGADOR. Ate 25/08 ela baixava o ciclo inteiro de
  // uma situacao — 1.737 PCs numa resposta — e `ciGrupos()` recortava aqui. Sao 2.928 PCs no
  // ciclo, e essa era a sexta tela a repetir o problema listado nas Pendencias do CLAUDE.md.
  //
  // O recorte agora e feito no banco, e a tela manda o que o usuario escolheu.
  conf(!/function ciGrupos\(\)/.test(html), 'ciGrupos saiu — a tela nao agrupa nem filtra localmente');
  conf(/API_URL\}\/ci\/fila\?\$\{p\}/.test(html), 'a lista vem filtrada do servidor');
  conf(/new URLSearchParams\(\{ usuario_id: U\.id, chip: _ciChip \}\)/.test(html),
       'com o recorte do chip e quem esta pedindo');

  // ⚠️ OS DOIS BLOCOS DE BUSCA SAO EXCLUDENTES, e a decisao e do Richard: usar um limpa o
  // outro. Combina-los devolveria vazio silencioso toda vez que o processo digitado nao fosse
  // o da entidade digitada — e a pessoa leria "nao existe" para uma PC que existe.
  const sg = (html.match(/function ciBuscarSgpe\(\)[\s\S]*?\n\}/) || [''])[0];
  const ge = (html.match(/function ciBuscarGeral\(\)[\s\S]*?\n\}/) || [''])[0];
  conf(sg.length > 0 && ge.length > 0, 'os dois blocos tem cada um a sua funcao');
  conf(/_ciGeral = \{ q:'', analista_id:'', espera:'' \}/.test(sg), 'buscar por processo limpa o bloco de baixo');
  conf(/_ciSgpe = \{ sigla:_ciSgpe\.sigla \|\| CI_SIGLA_PADRAO, num:'', ano:'' \}/.test(ge),
       'e buscar na fila limpa o numero e o ano do processo');
  conf(/_ciModo = 'sgpe'/.test(sg) && /_ciModo = 'geral'/.test(ge), 'e so um dos dois modos vale por vez');

  // ⚠️ OS TRES CAMPOS DO SGPe SAO OBRIGATORIOS, e o botao so acende com os tres. Buscar so
  // pelo numero devolveria o SCC 7537 de sete anos diferentes — armadilha 19 como interface.
  const ch = (html.match(/function ciSgpeMudou\(\)[\s\S]*?\n\}/) || [''])[0];
  conf(/bt\.disabled = falta\.length > 0/.test(ch), 'o botao do processo nasce cinza');
  conf(/bt\.title = falta\.length \? `Informe \$\{falta\.join\(', '\)\}/.test(ch),
       'e o cinza DIZ o que falta, no title (armadilha 15)');
  for (const c of ['a sigla', 'o número', 'o ano'])
    conf(ch.includes(`'${c}'`), `falta "${c}" quando o campo esta vazio`);
  // ⚠️ A SIGLA NAO NASCE MAIS PREENCHIDA (Richard, 31/08/2026): nenhuma caixa nasce com valor
  // dentro, e o `SCC` que ficava ali virou PLACEHOLDER cinza, no componente. A dica continua
  // na tela; o campo comeca limpo, e quem vai digitar FCEE nao precisa apagar antes.
  conf(/campoProcHtml\('ciSg', \{ modo: 'busca'/.test(html.replace(/\n\s*/g, ' ')),
       'a sigla nao e mais pre-enchida na chamada');
  conf(/const CI_SIGLA_PADRAO = ''/.test(html), 'e o padrao do C.I. virou vazio');
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
    // ⚠️ `_chaves` VAI JUNTO. A tela monta os dois no carregamento: `_busca` e o texto dos seis
    // campos e `_chaves` sao as chaves de processo. A caixa do SGPe procura no SEGUNDO — um
    // evento de fixture so com `_busca` faria o filtro de processo achar zero sempre, e o
    // teste "passaria" provando o contrario do que se quer.
    const ev = (id, texto, procs) => ({
      analista_id: id, data_estorno: '2026-08-01T10:00:00Z', pcs: ['x'],
      _busca: termoBusca(texto),
      _chaves: (procs || []).map(p => ctx.chaveProcesso(p)).join(' '),
    });
    const eventos = [
      ev(4, '2020TR000657 SCC2070/2020 SCC9692/2020 APAE DE SAO JOSE 2020NL007584 2020PC000520 Richard',
         ['SCC2070/2020', 'SCC9692/2020']),
      ev(7, '2019TR000111 FCEE1/2019 FCEE111/2019 APAE DE ICARA 2019NL000222 2019PC000333 Nayara',
         ['FCEE1/2019', 'FCEE111/2019']),
    ];
    let recebeu = null;
    // ⚠️ AS DUAS CAIXAS DA BARRA ENTRAM AQUI (31/08/2026). O `estLogFiltrar` passou a somar o
    // filtro de TR e o de processo ao termo livre, e sem estes campos no DOM de mentira ele
    // quebrava — nao por defeito, mas porque o teste desenhava metade da tela.
    const els = {
      estLogBusca: { value: '' }, estLogAnalista: { value: '' },
      estLogDtIni: { value: '' }, estLogDtFim: { value: '' },
      estLogTrAno: { value: '' }, estLogTrNum: { value: '' },
      estLogPrSigla: { value: '' }, estLogPrNum: { value: '' }, estLogPrAno: { value: '' },
    };
    const ctxL = {
      console, window: {}, _estLogEventos: eventos,
      termoBusca: ctx.termoBusca, prepararBusca: ctx.prepararBusca,
      // As funcoes REAIS do componente, nao dublês — sao elas que montam o termo parcial.
      campoTrTermo: ctx.campoTrTermo, campoProcTermo: ctx.campoProcTermo,
      campoTrPartes: ctx.campoTrPartes, campoProcPartes: ctx.campoProcPartes,
      chaveProcesso: ctx.chaveProcesso,
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

    // ── AS DUAS CAIXAS DA BARRA (31/08/2026) ──────────────────────────────────
    // ⚠️ O CAMPO LIVRE NAO PERDEU NADA: as checagens de cima continuam valendo, e sao a
    // prova de que entidade, NL e PC seguem sendo achadas por ele. O que as caixas
    // acrescentam e poder pedir TR **e** processo ao mesmo tempo, que o termo unico nao fazia.
    const limpar = () => { els.estLogBusca.value = '';
      for (const k of ['estLogTrAno','estLogTrNum','estLogPrSigla','estLogPrNum','estLogPrAno'])
        els[k].value = ''; };
    const filtrarCampos = (o) => {
      limpar();
      for (const [k, v] of Object.entries(o)) els[k].value = v;
      ctxEls = els;                 // as funcoes do componente leem o DOM do contexto de cima
      ctxL.estLogFiltrar(); return recebeu.length;
    };
    conf(filtrarCampos({}) === 2, 'caixas vazias nao filtram');
    conf(filtrarCampos({ estLogTrAno: '2020' }) === 1, 'so o ano da TR ja recorta');
    conf(filtrarCampos({ estLogTrAno: '2020', estLogTrNum: '657' }) === 1, 'ano + numero da TR');
    conf(filtrarCampos({ estLogPrSigla: 'FCEE' }) === 1, 'so a sigla do processo ja recorta');
    conf(filtrarCampos({ estLogPrSigla: 'SCC', estLogPrNum: '2070', estLogPrAno: '2020' }) === 1,
         'o processo inteiro');
    // ⚠️ AND, NUNCA OR — a mesma regra do servidor. TR de um evento com processo do OUTRO tem
    // de devolver ZERO; num OR devolveria dois, e a tela mostraria o contrario do pedido.
    conf(filtrarCampos({ estLogTrAno: '2020', estLogPrSigla: 'FCEE' }) === 0,
         'TR de um com processo do outro devolve zero — e AND, nao OR');
    conf(filtrarCampos({ estLogTrAno: '2020', estLogPrSigla: 'SCC' }) === 1, 'e os dois do mesmo evento acham');
    conf(filtrarCampos({ estLogBusca: 'APAE', estLogTrAno: '2019' }) === 1,
         'o campo livre soma com as caixas');
    conf(filtrarCampos({ estLogBusca: 'ICARA', estLogTrAno: '2020' }) === 0,
         'e some junto quando discordam');
    limpar();
    ctxEls = {};   // devolve o DOM de cima ao estado neutro, para as secoes seguintes
  }
}

console.log('\n═══ 4g. BOTAO BUSCAR EM TODAS AS TELAS ═══');
{
  // O botao nasceu so no Estoque de TRs; as outras buscavam apenas ao digitar, e quem
  // procurava o botao achava que a tela nao tinha busca.
  // ⚠️ O C.I. SAIU DAQUI EM 25/08/2026, e nao por descuido: a tela nova tem DOIS blocos de
  // busca independentes, cada um com o seu Buscar, e o de cima so acende com os tres campos
  // do processo preenchidos. O botao compartilhado tem um so, e sempre aceso.
  const usos = (html.match(/\$\{BTN_BUSCAR\('/g) || []).length;
  conf(usos === 5, `${usos} telas com o botao Buscar compartilhado (esperado 5)`);
  conf(/onclick="ciBuscarSgpe\(\)"/.test(html) && /onclick="ciBuscarGeral\(\)"/.test(html),
       'e o C.I. tem os seus dois, um por bloco');

  for (const acao of ['buscar()', 'buscarPlan()', 'adminFiltrar()', 'estBuscarAgora()', 'estLogBuscarAgora()']) {
    conf(html.includes(`\${BTN_BUSCAR('${acao}')}`), `botao chamando ${acao}`);
  }

  // Nao pode ter sobrado o markup antigo copiado a mao.
  conf((html.match(/class="btn-buscar" onclick="buscar\(\)"/g) || []).length === 0, 'o botao antigo do Estoque foi trocado pelo compartilhado');

  // As tres telas com debounce precisam de um "aplicar agora" que cancele o timer — senao o
  // clique no botao pintaria, e 150ms depois o debounce pintaria de novo.
  for (const fn of ['estBuscarAgora', 'estLogBuscarAgora']) {
    const corpo = (html.match(new RegExp(`function ${fn}\\(\\)[\\s\\S]*?\\n\\}`)) || [''])[0];
    conf(/clearTimeout/.test(corpo), `${fn} cancela o debounce pendente`, corpo.trim().slice(0, 60));
  }

  // A busca ao digitar continua existindo em todas.
  for (const id of ['estBusca', 'admBusca', 'estLogBusca']) {
    conf(new RegExp(`id="${id}"[^>]*oninput=`).test(html), `${id} mantem a busca ao digitar`);
  }
  // ⚠️ NO C.I. A BUSCA E NO ENTER OU NO BOTAO, nunca ao digitar. Cada tecla dispararia uma
  // consulta ao banco sobre 2.928 PCs — e o bloco do processo so faz sentido completo.
  //
  // ⚠️ E O CAMPO DO PROCESSO RESPONDE AO ENTER PELO `data-enter` DO GRUPO, nao por um
  // `onkeydown` em cada caixa (31/08/2026). Sao tres caixas: tres `onkeydown` iguais eram
  // tres lugares para esquecer um. Quem escuta e um ouvinte delegado no `document` — por isso
  // a conferencia mudou de forma, mas nao de conteudo: continua sendo "busca no Enter".
  conf(/campoProcHtml\('ciSg',[\s\S]{0,220}enter: 'ciBuscarSgpe\(\)'/.test(html),
       'ciSg busca no Enter, nao ao digitar');
  conf(!/campoProcHtml\('ciSg',[\s\S]{0,220}oninput/.test(html), 'e nao ha busca ao digitar no processo');
  for (const id of ['ciQ']) {
    conf(new RegExp(`id="${id}"[^>]*onkeydown=`).test(html), `${id} busca no Enter, nao ao digitar`);
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
