// CAMINHO: sigpc-gt/teste_front_estoque.js
//
// Testes da TABELA DO ESTOQUE DE TRs, lendo a marcação do próprio index.html.
// Sem navegador, sem rede, sem login.
//
// Os ajustes de 16/08/2026, e o que cada um existe para impedir:
//   · BAIXADAS e ANALISTA saíram — a TR some do Estoque quando é assumida, então as duas
//     só sabiam mostrar zero e travessão. Coluna que nunca varia ocupa largura e não informa.
//   · a ENTIDADE ficou com a maior largura e QUEBRA — o maior nome do acervo tem 81
//     caracteres, e cortar com reticências escondia o nome inteiro atrás do `title`.
//   · TR e SGPe MÃE NUNCA quebram.
//   · só o CABEÇALHO é centralizado.
//
// USO: node teste_front_estoque.js

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// O bloco da tela, de `function irEst(` até o fim do `renderEst`.
const ini = html.indexOf('function irEst(');
const fim = html.indexOf('function renderPag(');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco do Estoque no index.html.');
  process.exit(1);
}
const est = html.slice(ini, fim);

console.log('\n═══ 1. AS DUAS COLUNAS QUE SAIRAM ═══');

// O cabeçalho da tabela, entre o <thead> e o </thead>.
const thead = est.slice(est.indexOf('<thead>'), est.indexOf('</thead>'));
conf(!/>\s*Baixadas\s*</.test(thead), 'BAIXADAS saiu do cabecalho');
conf(!/>\s*Analista\s*</.test(thead), 'ANALISTA saiu do cabecalho');
conf((thead.match(/<th>/g) || []).length === 7, 'restaram 7 colunas', String((thead.match(/<th>/g) || []).length));
conf(/>TR</.test(thead) && /SGPe MÃE/.test(thead) && />Entidade</.test(thead)
  && />PCs</.test(thead) && />NLs</.test(thead) && />Status</.test(thead) && />Ações</.test(thead),
  'e sao TR · SGPe MAE · Entidade · PCs · NLs · Status · Acoes');

// ⚠️ O corpo não pode continuar desenhando as células removidas: sobrariam duas <td> a mais
// que o cabeçalho, e a tabela inteira sai do lugar sem dar erro nenhum.
conf(!/t\.baixadas\}/.test(est), 'o corpo nao desenha mais a celula de baixadas');
conf(!/analistaH/.test(est), 'nem a de analista');

// ⚠️ MAS `t.baixadas` CONTINUA SENDO LIDO — é ele que deriva o status "baixada". Tirar a
// coluna não pode ter tirado o cálculo.
conf(/baixadas\s*>=\s*totalPcs/.test(html), 'o status "baixada" ainda e derivado de baixadas');
// E `analista_nome` continua decidindo se a TR é minha (botao "Ver") e se e Livre.
conf(/isMeuTR/.test(est) && /!t\.analista_nome/.test(html),
  'e analista_nome ainda decide "e minha" e "e livre"');

console.log('\n═══ 2. O colspan ACOMPANHOU ═══');

// Um colspan que não acompanha não dá erro: a linha de "carregando", a de erro, a de vazio e
// o separador de grupo simplesmente param de ocupar a tabela toda.
const spans = (est.match(/colspan="(\d+)"/g) || []).map(s => s.match(/\d+/)[0]);
conf(spans.length >= 4, `ha ${spans.length} colspan no bloco do Estoque`);
conf(spans.every(s => s === '7'), 'e todos sao 7', spans.join(','));

console.log('\n═══ 3. O QUE FAZ O NOWRAP VALER ═══');

// ⚠️ ESTE E O TESTE QUE IMPORTA. Percentual no <col> e sugestao: sem `table-layout:fixed` o
// navegador estica a coluna que o conteudo exigir, e a TR quebra em duas linhas MESMO com o
// `white-space:nowrap` escrito. O nowrap sozinho nao segura nada.
conf(/\.tbl-est\{table-layout:fixed;\}/.test(html), 'a tabela do Estoque e table-layout:fixed');
conf(/<table class="tbl-est">/.test(est), 'e a classe esta na tabela');

// ⚠️ E O `fixed` NAO PODE SER GLOBAL. O seletor `table{}` vale para dezenas de tabelas do
// arquivo — o relatorio CGE depende da largura automatica delas.
const regraTabelaGlobal = html.match(/\ntable\{[^}]*\}/);
conf(regraTabelaGlobal && !/table-layout/.test(regraTabelaGlobal[0]),
  'e o fixed NAO vazou para o seletor table{} global');

conf(/\.tbl-est \.est-mae\{white-space:nowrap;\}/.test(html), 'o SGPe MAE tem nowrap');
conf(/<td class="est-tr">/.test(est), 'a celula da TR usa a classe est-tr');
conf(/class="proc-sgpe est-mae"/.test(est), 'e a do SGPe MAE usa est-mae');

// ⚠️ O NOWRAP DA TR E DO CODIGO, NAO DA CELULA — e a diferenca foi um defeito na tela.
// A celula tambem hospeda a etiqueta de reserva ("Aguardando aprovacao — Fulano", ate 41
// caracteres). Com o nowrap na CELULA e o table-layout:fixed, ela transbordava por cima da
// coluna SGPe MAE e tapava o link do processo. Visto na 2022TR001511 em 16/08/2026.
conf(/\.tbl-est \.est-tr\{white-space:normal;\}/.test(html),
  'a celula da TR pode ter mais de uma linha');
conf(/\.tbl-est \.est-tr > strong\{white-space:nowrap;\}/.test(html),
  'mas o CODIGO da TR continua preso numa linha so');

console.log('\n═══ 3-B. A ETIQUETA DE RESERVA NAO INVADE A COLUNA AO LADO ═══');

conf(/\.tbl-est \.est-reserva\{display:block;white-space:normal;overflow-wrap:anywhere;/.test(html),
  'a etiqueta e block, quebra, e cabe na coluna');
conf(/<div class="est-reserva"/.test(est), 'e a etiqueta usa a classe');

// ⚠️ ESTILO INLINE VENCE CLASSE. Foi um `display:inline-block;white-space:nowrap` no atributo
// style que causou o transbordo — se voltar para la, a classe acima nao adianta nada.
const tag = est.slice(est.indexOf('const tagReserva'), est.indexOf('const tagReserva') + 900);
conf(!/style="[^"]*display:inline-block/.test(tag), 'o display NAO voltou para o style inline');
conf(!/style="[^"]*white-space:nowrap[^"]*">\s*⏳/.test(tag),
  'nem o nowrap na div da etiqueta');
// O "✕ cancelar" continua inteiro: e um link, e quebrar no meio dele seria pior que a quebra.
conf(/cancelar<\/a>/.test(tag) && /white-space:nowrap;"\s*\n?\s*title="Cancelar/.test(tag),
  'so o "✕ cancelar" fica sem quebra, por ser link');

console.log('\n═══ 4. AS LARGURAS ═══');

const colgroup = est.slice(est.indexOf('<colgroup>'), est.indexOf('</colgroup>'));
const larguras = (colgroup.match(/width:(\d+)%/g) || []).map(s => parseInt(s.match(/\d+/)[0]));
conf(larguras.length === 7, 'ha uma largura por coluna', String(larguras.length));
conf(larguras.reduce((a, b) => a + b, 0) === 100, 'e somam 100%', String(larguras.reduce((a, b) => a + b, 0)));

// ⚠️ A ENTIDADE TEM DE SER A MAIOR — e a regra escrita do Richard. Se um ajuste futuro
// empatar ou inverter, e aqui que aparece.
const maior = Math.max(...larguras);
conf(larguras[2] === maior && larguras.filter(l => l === maior).length === 1,
  'a ENTIDADE e a maior coluna, sozinha', `entidade ${larguras[2]}% · maior ${maior}%`);
// A largura da TR e do SGPe foi medida contra o acervo: 12 e 20 caracteres.
conf(larguras[0] >= 12 && larguras[1] >= 18,
  'TR e SGPe MAE tem largura para o maior valor do acervo', `${larguras[0]}% · ${larguras[1]}%`);

// ⚠️ OS NUMEROS DO RICHARD, FIXADOS. Ele pediu TR 14 · SGPe 20 · ENTIDADE 42 · PCs 7 ·
// NLs 7 · ACOES 10 -- que somam 100 para SEIS colunas -- e mandou MANTER o Status, que e a
// setima. Os 10% do Status saem da ENTIDADE, pela regra de desempate que ele mesmo escreveu:
// "se faltar espaco, tira da ENTIDADE". Cinco das seis larguras dele estao intactas; a
// entidade e a unica que absorve. Se alguem mexer, e aqui que aparece.
const PEDIDO = { tr: 14, mae: 20, pcs: 7, nls: 7, acoes: 10 };
conf(larguras[0] === PEDIDO.tr,    'TR ficou nos 14% pedidos',       `${larguras[0]}%`);
conf(larguras[1] === PEDIDO.mae,   'SGPe MAE nos 20% pedidos',       `${larguras[1]}%`);
conf(larguras[3] === PEDIDO.pcs,   'PCs nos 7% pedidos',             `${larguras[3]}%`);
conf(larguras[4] === PEDIDO.nls,   'NLs nos 7% pedidos',             `${larguras[4]}%`);
conf(larguras[6] === PEDIDO.acoes, 'ACOES nos 10% pedidos',          `${larguras[6]}%`);
conf(larguras[2] === 42 - larguras[5],
  'e a ENTIDADE cedeu exatamente a largura do Status',
  `42% - ${larguras[5]}% = ${larguras[2]}%`);

console.log('\n═══ 5. A ENTIDADE QUEBRA, E SO ELA ═══');

conf(/\.tbl-est \.est-ent\{white-space:normal;overflow-wrap:anywhere;/.test(html),
  'a entidade quebra em mais de uma linha');
conf(/<td class="est-ent"/.test(est), 'e a celula usa a classe');
// ⚠️ O `title` FICA. Numa janela estreita a coluna ainda aperta.
conf(/<td class="est-ent" title="\$\{t\.entidade\|\|''\}"/.test(est),
  'e o title continua, para a janela estreita');
// A regra antiga nao pode ter sobrado na celula.
conf(!/text-overflow:ellipsis/.test(est.slice(est.indexOf('est-ent'), est.indexOf('est-ent') + 300)),
  'as reticencias sairam da celula da entidade');

console.log('\n═══ 6. SO O CABECALHO E CENTRALIZADO ═══');

conf(/\.tbl-est th\{text-align:center;\}/.test(html), 'o cabecalho e centralizado por CSS');
// ⚠️ E as celulas NAO. A TR, o SGPe e a entidade continuam a esquerda: numero e nome
// centralizados criam um serrilhado que atrapalha a leitura em coluna.
// ⚠️ ANCORAR NA CELULA DA TR, nao no primeiro `<tr class=`: o separador de grupo
// (`grupo-sep`) e desenhado ANTES e casaria primeiro, e o recorte pegaria a linha errada —
// que nao tem celula centralizada nenhuma e faria o teste passar por vazio.
const iniLinha = est.indexOf('<td class="est-tr">');
const linha = est.slice(iniLinha, est.indexOf('</tr>`', iniLinha));
conf(!/<td class="est-tr" style="text-align:center/.test(linha), 'a celula da TR nao foi centralizada');
conf(!/<td class="est-ent"[^>]*text-align:center/.test(linha), 'nem a da entidade');
conf((linha.match(/text-align:center/g) || []).length === 2,
  'so PCs e NLs continuam centralizados no corpo',
  String((linha.match(/text-align:center/g) || []).length));

console.log('\n═══ 7. O CABECALHO DO SISTEMA ═══');

conf(/\.top\{[^}]*height:62px;/.test(html), 'a faixa verde subiu para 62px');
conf(/\.top-logo\{[^}]*min-width:240px;\}/.test(html), 'e a caixa do logo acompanhou, 240px');
conf(/alt="Governo de Santa Catarina" style="height:48px;/.test(html), 'o logo do Estado esta em 48px');

// ⚠️ A caixa branca TEM de crescer junto com a imagem. So aumentar o logo o faria encostar
// na borda arredondada — e o teste existe porque isso nao da erro, so fica feio.
const alturaLogo = 48, alturaFaixa = 62;
conf(alturaLogo < alturaFaixa, 'o logo cabe na faixa', `${alturaLogo}px em ${alturaFaixa}px`);

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
