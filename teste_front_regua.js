// CAMINHO: sigpc-gt/teste_front_regua.js
//
// A TELA LENDO A REGUA DE PRODUTIVIDADE  (30/09/2026)
//
// ⚠️ O QUE ELE GUARDA: que a META continue vindo PRONTA do servidor. Ate 30/09 esta tela somava
// `metas_analistas` por `analista_id` e, pior, decidia sozinha que o dispensado recebia zero —
// o contrario do que a regua confirmada pela coordenacao diz (itens B4 e B8: a meta dele CONGELA
// na data de saida e ele continua somando no grupo). Era a armadilha 16 em acao: conta escrita
// na tela e conta que nenhum teste do servidor alcanca, e esta contradizia o acordo em silencio.
//
// ⚠️ E GUARDA O ROTULO DO BOARD. "Total" ao lado do concluido parecia meta e nao era — e foi
// exatamente essa leitura que a coordenacao questionou. O numero e o acervo RECEBIDO; a meta
// passou a ter linha propria, com o mesmo numero da tela Produtividade.
//
// USO: node teste_front_regua.js

const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ⚠️ A JANELA TERMINA NUM MARCO DO PROPRIO CODIGO, nunca num numero de caracteres — armadilha
// 30. Fatia fixa reprova o que cresceu por baixo dela, e o modo de falhar parece defeito de tela.
const entre = (de, ate) => {
  const i = html.indexOf(de);
  if (i < 0) return '';
  const f = html.indexOf(ate, i);
  return f < 0 ? html.slice(i) : html.slice(i, f);
};

S('1. A META VEM DO SERVIDOR, E NAO DE metas_analistas');
{
  const fn = entre('async function fetchMetasVigentes() {', '// Contagem total de prestacoes_contas');
  conf(fn.length > 100, 'a funcao existe', `${fn.length} caracteres`);
  conf(fn.includes('/produtividade/regua'), 'ela le a rota da regua');
  // ⚠️ `metas_analistas` NAO PODE VOLTAR AQUI. Duas fontes vivas para a mesma meta e a segunda
  // ficando velha — a licao do MAPA_PLAN_EST e das duas definicoes de "livre".
  conf(!fn.includes('metas_analistas'), 'e nao le mais metas_analistas');
  conf(!/vigente/.test(fn), 'nem fala em "vigente": a meta nao e mais um numero gravado');
  // A regua inteira fica guardada para o botao "Fonte" poder dizer de onde saiu cada numero.
  conf(/_regua\s*=\s*j\.data/.test(fn), 'guarda a regua recebida em _regua');
  conf(/let _regua = null/.test(html), 'e _regua e declarada uma vez so');
}

S('2. O DISPENSADO TEM META CONGELADA, E NAO ZERO');
{
  // ⚠️ A `contaMeta` SAIU. Ela respondia NAO para o dispensado, e a regua responde SIM.
  conf(!/function contaMeta\s*\(/.test(html), 'a funcao contaMeta nao existe mais');
  conf(!/contaMeta\(/.test(html), 'e ninguem a chama');
  // O que ficou no lugar: a nota que diz onde a pergunta passou a ser respondida.
  conf(/A `contaMeta` SAIU EM 30\/09\/2026/.test(html), 'a nota explica onde a regra foi parar');
  conf(/contaProdutividade/.test(html), 'e contaProdutividade continua — e outra pergunta');
  const uso = entre('const meta = metaPorId[analistaId]', 'const pct');
  conf(uso.length > 0 && !uso.includes('contaMeta'), 'a tela Produtividade usa a meta como ela veio');
}

S('3. O BOARD: "PCs recebidas", e a meta em linha propria');
{
  const board = entre('const grupos = {1:{total:0', 'const analistas = Object.entries(mapaAn)');
  // ⚠️ A ANCORA DE FIM TEM ACENTO — "Gráficos". Sem ele o indexOf nao acha, a janela segue ate
  // o fim do arquivo e passa a medir tambem a Gestao Grupo, que tem um card por grupo com
  // "Total". O teste reprovava o Board por causa de OUTRA tela — a armadilha 30 noutra forma.
  const cards = entre('${[1,2,3].map(g => {', '<!-- Gráficos lado a lado -->');
  conf(cards.includes('PCs recebidas:'), 'o rotulo do card do grupo diz PCs recebidas');
  conf(!/>Total: <strong>\$\{gr\.total\}/.test(cards), 'e nao diz mais "Total"');
  conf(cards.includes('Meta do período'), 'a meta aparece em linha propria');
  conf(cards.includes('metaGrupo[g]'), 'e o numero vem da regua, por grupo');
  // ⚠️ A TELA NAO SOMA META. O servidor manda `meta_por_grupo` pronto; somar aqui seria refazer
  // a conta dele, e e assim que dois numeros da mesma coisa comecam a divergir.
  conf(!/metaGrupo\[g\]\s*=/.test(cards) && !/meta_por_grupo\s*\[[^\]]*\]\s*=/.test(board),
    'a tela nao calcula a meta do grupo, so mostra');
  conf(/_regua && _regua\.meta_por_grupo/.test(html), 'a meta por grupo e lida da regua recebida');
  // O percentual antigo continua, mas agora diz do que ele e percentual.
  conf(cards.includes('% do recebido'), 'e o percentual do acervo diz que e do recebido');
}

S('4. A META E A PRODUCAO VEM DO MESMO INSTANTE');
{
  const carga = entre('const [data] = await Promise.all([fetchTodasPCs(sid)', 'const { data: todosUsers }');
  conf(carga.includes('fetchMetasVigentes()'), 'o Board pede as PCs e a regua na mesma carga');
  conf(carga.includes('Promise.all'), 'numa chamada so — duas idas em sequencia dariam duas fotos');
}

S('5. O "FONTE" DO BOARD EXPLICA AS DUAS LINHAS');
{
  const fonte = entre("{ id:'boardFonteGrupos'", "{ id:'boardFonteTop'");
  conf(fonte.includes('PCs recebidas:'), 'a fonte descreve as PCs recebidas');
  // ⚠️ E DIZ O QUE O NUMERO NAO E. Foi justamente ler "Total" como meta que gerou a duvida da
  // coordenacao — a linha que a pessoa procura e a que diz o que NAO conta.
  conf(/NÃO é meta/.test(fonte), 'e diz, com todas as letras, que aquilo nao e meta');
  conf(fonte.includes('Meta:'), 'a fonte descreve tambem a meta');
  conf(/régua de produtividade/.test(fonte), 'apontando a regua como origem');
  conf(/mesmo número da tela Produtividade/.test(fonte), 'e dizendo que o numero e o mesmo da outra tela');
}

S('6. A TELA QUE EXPLICA A CONTA AO ANALISTA');
{
  // ⚠️ ELA MONTA DE VERDADE, num DOM de mentira — casar texto do arquivo provaria que a
  // frase existe, nao que ela chega na tela. A tela nova e justamente a que tem de aparecer.
  const vm = require('vm');
  const i = html.indexOf('function irProdAjuda() {');
  const fonte = i < 0 ? '' : html.slice(i, html.indexOf('async function prodCarregar() {', i));
  const body = { innerHTML: '' };
  const ctx = { document: { getElementById: (id) => (id === 'BODY' ? body : null) }, ativarMenu: () => {} };
  let montou = false;
  try { vm.createContext(ctx); new vm.Script(fonte + '\nirProdAjuda();').runInContext(ctx); montou = true; } catch (e) { montou = e.message; }
  conf(montou === true, 'a tela monta sem erro', typeof montou === 'string' ? montou : null);
  const out = body.innerHTML;
  conf(out.length > 5000, 'e tem conteudo', out.length + ' caracteres');

  // Os tres pilares pedidos pelo Richard: a conta, o porque mudou, e por que demorou.
  conf(out.includes('baixou com parecer registrado'), '1. a conta aparece em uma linha');
  conf(out.includes('é aqui que conta'), 'e o passo do parecer e o destacado no fluxo');
  // ⚠️ A FRASE QUE EVITA A PERGUNTA MAIS COMUM. Encaminhar ao C.I. parecia producao ate
  // 30/09/2026, e quem nao ler isto vai perguntar por que o encaminhamento sumiu da conta.
  conf(out.includes('conta no parecer, não no encaminhamento'), 'a frase-chave esta escrita');
  conf(out.includes('não é porque você produziu menos'), '2. a queda do percentual e explicada');
  conf(out.includes('janeiro/2026') && out.includes('férias'), 'a regua da meta aparece, mes a mes');
  conf(out.includes('linha do tempo diferente'), '3. o porque da demora fala das variantes');
  conf(/Registre o parecer e ela entra/.test(out), 'e ha o caminho acionavel: registrar o parecer');

  // ⚠️ NENHUM NUMERO DE ACERVO AQUI — decisao do Richard. Quem le quer saber o que fazer e
  // por que mudou; dado interno no meio disso vira ruido e gera a pergunta que a tela evitaria.
  conf(!/\b(3\.560|4\.443|6\.298|5\.918)\b/.test(out), 'nenhum numero de acervo vaza para a tela');
  conf(!/sigef_conta|parecer_tipo|baixada = true|metas_analistas/.test(out), 'nem nome de campo do banco');

  // ⚠️ O ESTILO E ESCOPADO. As regras daqui falam de `.col`, `.passo`, `.aviso` — nomes que
  // atropelariam dezenas de telas se caissem no CSS global.
  conf(out.includes('#ajpApp .cartao'), 'o estilo tem prefixo proprio');
  conf(!/\n\s*\.col\{/.test(out) && !/<style>\s*\.(col|passo|aviso)/.test(out), 'e nenhuma regra solta sem prefixo');
  conf((out.match(/irProd\(\)/g) || []).length >= 2, 'ha dois caminhos de volta — topo e rodape');

  // O caminho ate ela mora na propria tela do numero.
  conf(/onclick="irProdAjuda\(\)"/.test(html), 'o botao existe na tela Produtividade');
  conf(/Como é calculada/.test(html), 'e diz o que faz');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
