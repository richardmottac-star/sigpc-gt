// CAMINHO: sigpc-gt/teste_front_vinculo.js
//
// A FAIXA DE VINCULACAO MAE/PARCIAIS do modal do SGPe (F4), executando de verdade num DOM de
// mentira. Sem navegador, sem rede.
//
// ⚠️ O QUE ELA GUARDA: a faixa diz o TAMANHO da TR. Os numeros chegam prontos da rota
// (`GET /sgpe/vinculo`) e a tela NAO recalcula nenhum — recontar aqui daria o que coube na
// resposta, nao o que a TR tem, e um numero menor se le como o total.
//
// USO: node teste_front_vinculo.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const semComent = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ── extrair o que a faixa precisa ───────────────────────────────────────────
const fatia = (ini, fimMarca) => {
  const i = html.indexOf(ini);
  const f = html.indexOf('\n}', html.indexOf(fimMarca, i)) + 2;
  if (i < 0 || f <= i) throw new Error('nao achei: ' + ini);
  return html.slice(i, f);
};
const iV = html.indexOf('const VINC_AMBAR');
const fV = html.indexOf('function sgpeConsultaAbrir(bruto) {');
if (iV < 0 || fV < 0) { console.error('FALHA: nao achei o bloco da faixa no index.html.'); process.exit(1); }

// ⚠️ `campoProcPartir` E `campoAno4` VEM JUNTO, e nao como dubles: sao elas que quebram o
// processo nos tres pedacos que o link carrega (`data-s`/`data-n`/`data-a`). Um duble aqui
// faria o teste provar que o link tem OS ATRIBUTOS, e nao que eles levam os valores certos —
// que e a unica coisa que importa quando o clique preenche as caixas do topo.
const codigo = (
  fatia('function normalizarProcesso(str) {', 'return `${siglaBase} ${numero}/${mNum[2]}`') + '\n' +
  fatia('const PROC_RE =', 'function procInvalido(bruto)').replace(/\n\}[\s\S]*$/, '\n}') + '\n' +
  fatia('function campoProcPartir(txt) {', 'return { sigla, numero, ano: mA[2] }') + '\n' +
  fatia('function campoAno4(a) {', "return d.length === 2 ? '20' + d : d") + '\n' +
  html.slice(iV, fV)
).replace(/^(let|const) /gm, 'var ');

const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let els = {};
const ctx = {
  console, escHtml, API_URL: '',
  fetch: async () => ({ json: async () => ({ data: null }) }),
  document: { getElementById: (id) => els[id] || null },
};
vm.createContext(ctx);
vm.runInContext(codigo, ctx);

// ── A FAIXA VIROU TABELA (31/08/2026), E O TESTE PRECISA SEPARAR AS LINHAS ──
//
// ⚠️ ANTES BASTAVA CORTAR NO `flex-direction:column`, porque a mae ficava FORA do contentor
// das linhas. Agora ela e uma linha da MESMA tabela — e um recorte que ainda a deixasse de
// fora mediria o bloco errado, passando ou reprovando por acidente.
//
// Aqui as linhas sao separadas pelo estilo que TODAS compartilham, e classificadas pelo que
// as distingue: o cabecalho tem `uppercase`, a mae tem a etiqueta.
const LINHA_INI = 'display:flex;align-items:center;gap:8px;padding:6px 8px;';
const partes = (h) => {
  const bl = h.split(LINHA_INI).slice(1);
  return {
    cabecalho: bl.find((x) => /text-transform:uppercase/.test(x)) || '',
    mae: bl.find((x) => />mãe</.test(x)) || '',
    lista: bl.filter((x) => !/text-transform:uppercase/.test(x) && !/>mãe</.test(x)),
  };
};

// ── o `data` da rota, como ela devolve ──────────────────────────────────────
const BLOCO = {
  encontrado: true, papel: 'parcial', tr: '2020TR000623', entidade: 'APAE DE PINHALZINHO',
  processo_mae: 'FCEE559/2020', total_pcs: 75, total_processos_parciais: 3, pcs_sem_processo: 1,
  processos: [
    { processo: 'SCC11160/2020', qtd: 12, parciais: ['1','2','3','4','5','6','7','8','9','10','11','12'], atual: true },
    { processo: 'SCC9460/2021',  qtd: 5,  parciais: ['41','42','43','44','final'], atual: false },
    { processo: 'AR355478172',   qtd: 2,  parciais: ['7','9'], atual: false },
  ],
};
const comPapel = (p) => ({ ...BLOCO, papel: p });

S('1. AS PARCIAIS');
const pp = ctx.sgpeVincParciais;
// ⚠️ SO OS NUMEROS, SEM A PALAVRA (31/08/2026): ha uma coluna chamada PARCIAIS em cima, e
// repetir a palavra em cada celula e dizer duas vezes a mesma coisa — em 110px, e a palavra
// ocupando o lugar dos numeros.
conf(pp(['1','2','3','4','5','6','7','8','9','10','11','12']) === '1 a 12', 'contiguas viram intervalo', pp(['1','2','3']));
conf(pp(['41','42','43','44','final']) === '41 a 44, final', 'e a final vai depois do intervalo', pp(['41','42','43','44','final']));
// ⚠️ NAO CONTIGUAS SAO LISTADAS, e nao viram "1 a 7": o intervalo afirmaria que a 3 esta la.
conf(pp(['1','3','7']) === '1, 3, 7', 'nao contiguas saem como estao', pp(['1','3','7']));
conf(pp(['10','2','1']) === '1, 2, 10', 'e saem ordenadas por NUMERO, nao por texto', pp(['10','2','1']));
conf(pp(['5']) === '5', 'uma so sai sozinha', pp(['5']));
conf(!/parcia/i.test(pp(['1','2']) + pp(['5']) + pp(['final'])), 'e a palavra nao aparece em lugar nenhum');
conf(pp(['final']) === 'final', 'so a final');
conf(pp([]) === '' && pp(null) === '', 'lista vazia nao escreve nada');

S('2. O CABECALHO');
let h = ctx.sgpeVincHtml(BLOCO);
conf(h.includes('2020TR000623') && h.includes('APAE DE PINHALZINHO'), 'TR e entidade em destaque');
conf(/75 PCs/.test(h) && /3 processos/.test(h), 'os numeros vem PRONTOS da rota');
conf(/1 sem processo/.test(h), 'e o "sem processo" aparece quando ha');
// ⚠️ A TELA NAO RECALCULA NADA: a soma das qtd desta amostra e 19, e o cabecalho diz 75.
// E o certo — a rota viu as 75 PCs da TR, e a lista traz so os processos.
conf(BLOCO.processos.reduce((n, p) => n + p.qtd, 0) !== BLOCO.total_pcs && /75 PCs/.test(h),
     'e diz o total da ROTA, nao a soma do que esta na lista');
const semZero = ctx.sgpeVincHtml({ ...BLOCO, pcs_sem_processo: 0 });
conf(!/sem processo/.test(semZero), 'com zero sem processo, essa parte NAO aparece');

S('3. A FAIXA DA MAE');
conf(/>mãe</.test(h), 'tem a etiqueta "mãe"');
conf(h.includes('#EAF1F9'), 'e fundo azul claro quando o consultado e um parcial');
conf(!/>mãe</.test(ctx.sgpeVincHtml({ ...BLOCO, processo_mae: null })), 'sem processo_mae, a faixa NAO aparece');
// ⚠️ AZUL E SO DA MAE — nenhuma linha da lista o usa.
conf(partes(h).lista.every(x => !x.includes('#EAF1F9')), 'e o azul nao vaza para a lista');

S('4. O CONSULTADO');
// ⚠️ SAO AS DUAS COISAS JUNTAS (31/08/2026): o fundo bege, que ja existia, MAIS a barra
// laranja de 4px na borda esquerda. O selo "consultado" saiu — ele descia para uma segunda
// linha DENTRO da coluna PROCESSO e crescia a linha inteira.
conf(h.includes('#FAEEDA') && h.includes('#EF9F27'), 'o atual leva fundo ambar e a barra laranja');
conf(!/consultado/.test(h), 'e a palavra "consultado" nao sobrou em lugar nenhum da faixa');
// ⚠️ O NUMERO VALIDO SAI NORMALIZADO — `SCC11160/2020` vira `SCC 00011160/2020` pelo
// `normalizarProcesso`, que e o mesmo de todas as listas do sistema. So o INVALIDO sai cru
// (secao 6), porque ali normalizar seria a tela consertando texto que ela nao entendeu.
const alvoAtual = ctx.normalizarProcesso('SCC11160/2020');
conf(h.includes(alvoAtual), 'o processo valido sai normalizado', alvoAtual);
const linhaAtual = partes(h).lista.find(x => x.includes(alvoAtual)) || '';
conf(/#FAEEDA/.test(linhaAtual), 'a linha do consultado tem o fundo bege');
// ⚠️ A BARRA E DA LINHA, E NAO DE UMA CELULA. O selo tinha de escolher uma coluna — e as duas
// escolhas possiveis custavam largura a alguem: na PROCESSO ele descia de linha, na PARCIAIS
// tomava o lugar dos numeros. A borda esquerda fica na margem da linha, fora das cinco
// colunas, e por isso nao empurra nada.
const celProc = (linha) => linha.slice(linha.indexOf('flex:0 0 158px'), linha.indexOf('flex:1 1 0'));
const celPar  = (linha) => linha.slice(linha.indexOf('flex:0 0 110px'));
conf(/border-left-color:#EF9F27/.test(linhaAtual), 'e a barra laranja na borda esquerda dela');
conf(!/#EF9F27/.test(celProc(linhaAtual)) && !/#EF9F27/.test(celPar(linhaAtual)),
     'e ela nao entra em celula nenhuma');
conf(/1 a 12/.test(celPar(linhaAtual)), 'os numeros das parciais seguem inteiros na coluna deles',
     celPar(linhaAtual).replace(/<[^>]*>/g,'').trim());
// ⚠️ AS OUTRAS LINHAS TEM A MESMA ESPESSURA, em transparente — e o cabecalho tambem. Pintar a
// borda so na destacada moveria o conteudo dela 4px para a direita: a linha que se quer ler
// seria a unica fora do alinhamento da tabela.
conf(partes(h).lista.every(x => /border-left:4px solid transparent/.test(x)),
     'todas as linhas nascem com 4px de borda transparente');
conf(/border-left:4px solid transparent/.test(partes(h).cabecalho),
     'e os titulos das colunas tambem, senao ficariam 4px fora das colunas');
conf((h.match(/border-left-color:#EF9F27/g) || []).length === 1, 'so UMA barra laranja na faixa inteira',
     (h.match(/border-left-color:#EF9F27/g) || []).length);

S('5. CONSULTANDO PELA MAE');
// ⚠️ O AMBAR VAI PARA A FAIXA AZUL, e NENHUMA linha da lista se destaca (decisao do Richard).
const hm = ctx.sgpeVincHtml(comPapel('mae'));
const blocoMae = partes(hm).mae;
conf(/#FAEEDA/.test(blocoMae) && />mãe</.test(blocoMae), 'a faixa da mae fica ambar');
conf(/border-left-color:#EF9F27/.test(blocoMae), 'e ganha a MESMA barra laranja da lista');
// ⚠️ A MAE PERDE A BORDA AZUL ENQUANTO E ELA A CONSULTADA, e quem continua dizendo que ela e
// a mae e a ETIQUETA azul, que nao saiu. Uma marca na lista e outra na mae seriam duas
// linguagens para o mesmo estado, na mesma tabela — e a mae ficaria 1px fora do alinhamento,
// porque a borda dela era de 3px e a das outras e de 4px.
const estiloMae = blocoMae.slice(0, blocoMae.indexOf('>'));
conf(!/#1A4E8A/.test(estiloMae), 'e a borda azul cede o lugar enquanto ela e a consultada');
conf(/>mãe</.test(blocoMae), 'mas a etiqueta "mãe" fica, e e ela que a identifica');
const celProcMae = blocoMae.slice(blocoMae.indexOf('flex:0 0 158px'), blocoMae.indexOf('flex:1 1 0'));
const celPcsMae  = blocoMae.slice(blocoMae.indexOf('flex:0 0 52px'), blocoMae.indexOf('flex:0 0 110px'));
const celParMae  = blocoMae.slice(blocoMae.indexOf('flex:0 0 110px'));
conf(!/#EF9F27/.test(celProcMae) && !/#EF9F27/.test(celParMae),
     'e a barra nao entra em celula nenhuma, como na lista');
// ⚠️ A BORDA DA MAE E DE 4px COMO A DAS OUTRAS, e nao mais de 3px.
conf(/border-left:4px solid transparent/.test(blocoMae), 'a mae parte da mesma espessura das outras');
// ⚠️ E as duas colunas da direita ficam VAZIAS de conteudo proprio: a mae nao tem PC nem
// parcial. E por estarem vazias que o selo cabe ali sem empurrar informacao nenhuma.
//
// ⚠️ O TEXTO DA CELULA E O QUE ESTA ENTRE AS TAGS, e nao um recorte por posicao. Cortar da
// marca `flex:...` ate a marca seguinte termina no MEIO do `style` da celula vizinha, e o
// residuo (`<span style="`, `52px`, `#8A5A00`) faria um `[0-9]` cru reprovar uma celula vazia.
const textoCelula = (linha, marca) => {
  const i = linha.indexOf(marca);
  if (i < 0) return null;
  const ini = linha.indexOf('>', i) + 1;
  return linha.slice(ini, linha.indexOf('</span>', ini)).replace(/<[^>]*>/g, '').trim();
};
conf(textoCelula(blocoMae, 'flex:0 0 52px') === '', 'e a coluna PCS da mae fica vazia',
     JSON.stringify(textoCelula(blocoMae, 'flex:0 0 52px')));
conf(textoCelula(blocoMae, 'flex:0 0 110px') === '', 'e a PARCIAIS fica vazia tambem',
     JSON.stringify(textoCelula(blocoMae, 'flex:0 0 110px')));
conf((hm.match(/border-left-color:#EF9F27/g) || []).length === 1, 'e ha UMA barra so na faixa toda',
     (hm.match(/border-left-color:#EF9F27/g) || []).length);
// O `atual: true` do SCC11160 continua vindo da rota, e mesmo assim a linha nao se destaca.
const listaMae = partes(hm).lista.join('');
conf(!/border-left-color:#EF9F27/.test(listaMae), 'nenhuma linha da lista fica destacada, mesmo com atual=true');

S('6. O PROCESSO INVALIDO');
// `AR355478172` nao forma processo — e o `procInvalido` da tela que decide, o mesmo das listas.
conf(ctx.procInvalido('AR355478172') === true, 'o AR355478172 e invalido para a tela');
const linhaInv = h.slice(h.indexOf('AR355478172') - 500, h.indexOf('AR355478172') + 300);
conf(/line-through/.test(linhaInv), 'o numero sai riscado');
conf(/#8A5A00/.test(linhaInv), 'em #8A5A00');
conf(/processo inválido/.test(linhaInv), 'com o texto "processo inválido"');
conf(/#FAEEDA/.test(linhaInv), 'e fundo #FAEEDA');
// ⚠️ A CELULA DO PROCESSO QUEBRA — armadilha 24. Com `flex:0 0 158px` ela perde a licenca de
// esticar, e o que nao cabe NAO e cortado: escapa por cima da coluna vizinha. O numero ja
// leva ~128px dos 158, e aqui vem o rotulo "processo invalido" junto.
conf(/flex:0 0 158px[^"]*flex-wrap:wrap/.test(linhaInv), 'e a celula do processo pode quebrar');
conf((h.match(/flex:0 0 158px[^"]*flex-wrap:wrap/g) || []).length === 4,
     'nas quatro celulas de processo — mae e as tres linhas',
     (h.match(/flex:0 0 158px[^"]*flex-wrap:wrap/g) || []).length);
conf(linhaInv.includes('AR355478172'), 'e o valor CRU, sem a tela tentar consertar');
// ⚠️ INVALIDO QUE TAMBEM E O CONSULTADO MOSTRA AS DUAS COISAS — o fundo bege e o mesmo nos
// dois casos, e quem os separa agora e a BARRA (antes era o selo).
const hInvAtual = ctx.sgpeVincHtml({ ...BLOCO,
  processos: [{ processo: 'AR355478172', qtd: 2, parciais: ['7'], atual: true }] });
conf(/line-through/.test(hInvAtual) && /border-left-color:#EF9F27/.test(hInvAtual),
     'invalido E consultado mostra o riscado e a barra');

S('6b. O CABECALHO PRESO E A LISTA QUE ROLA');
// ⚠️ SO A LISTA ROLA (31/08/2026). A caixa de baixo tem altura maxima e rolagem propria; a
// TR, a entidade, a contagem e os titulos das colunas ficam presos no topo DELA, e as linhas
// passam por baixo. Numa TR de 58 processos era o cabecalho que sumia primeiro, e quem estava
// no fim da lista ja nao via de qual TR aquilo era.
conf(/max-height:330px;overflow-y:auto/.test(h), 'a lista tem altura maxima e rolagem propria');
conf(/position:sticky;top:0/.test(h), 'e o bloco do cabecalho fica preso no topo dela');
// ⚠️ E ELE FICA DENTRO DA CAIXA QUE ROLA, nao acima dela. Fora, ele nao perderia os ~15px que
// a barra de rolagem come da LARGURA das linhas: a coluna elastica encolheria so nas linhas e
// os titulos passariam a apontar para a coluna vizinha — exatamente quando ha lista demais
// para ler, que e quando o titulo serve para alguma coisa.
const iCaixa = h.indexOf('max-height:330px');
conf(iCaixa > 0 && h.indexOf('text-transform:uppercase') > iCaixa,
     'os titulos das colunas estao DENTRO da caixa que rola');
conf(iCaixa > 0 && h.indexOf('2020TR000623') > iCaixa, 'e a TR e a entidade tambem');
// ⚠️ FUNDO OPACO NO BLOCO PRESO: sem ele o sticky fica transparente e as linhas aparecem POR
// CIMA do texto do cabecalho enquanto rolam.
conf(/position:sticky;top:0;z-index:2;background:#fff/.test(h),
     'com fundo opaco e acima das linhas');
// ⚠️ A JANELA CONTINUA ROLANDO POR FORA — o #sgpeRolagem do modal nao foi tocado.
conf(/id="sgpeRolagem" style="overflow-y:auto/.test(html), 'e a rolagem do modal segue de pe');

S('7. O RODAPE');
conf(/1 PC sem processo gravado/.test(h), 'diz quantas PCs nao tem processo', 'singular');
conf(/3 PCs sem processo gravado/.test(ctx.sgpeVincHtml({ ...BLOCO, pcs_sem_processo: 3 })), 'no plural tambem');
conf(!/sem processo gravado/.test(semZero), 'e some quando nao ha nenhuma');

S('8. NA TELA');
conf(/<div id="sgpeVinculo"><\/div>/.test(semComent), 'o lugar da faixa existe no modal');
// ⚠️ DENTRO DO MIOLO QUE ROLA: fora dele viraria uma segunda area fixa, e numa TR de 58
// processos empurraria a linha do tempo para fora da janela.
const iRol = semComent.indexOf('id="sgpeRolagem"');
const iVin = semComent.indexOf('id="sgpeVinculo"');
const iRec = semComent.indexOf('id="sgpeRecentes"');
conf(iRol > 0 && iVin > iRol, 'dentro do miolo que rola');
conf(iVin > semComent.indexOf('id="sgpeSaida"') && iVin < iRec, 'ABAIXO do resultado e acima das recentes');
// ⚠️ CARREGA SOZINHA na consulta que deu certo, e some no comeco de CADA consulta.
conf(/sgpeVincCarregar\(`\$\{s\} \$\{n\}\/\$\{a\}`\)/.test(semComent), 'a consulta que deu certo chama a faixa');
conf(/sgpeVincLimpar\(\)/.test(semComent), 'e cada consulta limpa a anterior antes');
const iLimpa = semComent.indexOf('sgpeVincLimpar()');
const iCarrega = semComent.indexOf('sgpeVincCarregar(`');
conf(iLimpa > 0 && iCarrega > iLimpa, 'e o limpar vem ANTES do carregar');
// ⚠️ SEM `await`: o resultado que a pessoa pediu nao espera pela faixa.
conf(!/await sgpeVincCarregar/.test(semComent), 'e a faixa nao segura o resultado da consulta');

S('9. NAO ACHOU: SILENCIO');
// ⚠️ `encontrado: false` APAGA E NAO DIZ NADA — o processo pode ser de outro orgao e nao
// estar no acervo do GT. Escrever "nao encontrado" afirmaria uma ausencia que a rota nao
// conhece. Idem para falha de rede: a consulta ao SGPe ja respondeu logo acima.
const corpo = (html.match(/async function sgpeVincCarregar[\s\S]*?\n\}/) || [''])[0];
conf(/if\(!d \|\| !d\.encontrado\) return/.test(corpo), 'nao encontrado devolve sem desenhar');
conf(/catch\(_\) \{/.test(corpo), 'e a falha de rede e engolida');
conf(!/toast\(|sgpeCaixa\(/.test(corpo), 'sem toast e sem caixa de erro');
// A janela pode ter fechado enquanto a resposta voltava.
conf(/const alvo = document\.getElementById\('sgpeVinculo'\)/.test(corpo),
     'e o alvo e relido depois do await — a janela pode ter fechado');

S('8b. O ASSUNTO E A SITUACAO — AS TRES COMBINACOES');
{
  const mi = (a, s) => ctx.sgpeVincMiolo(a, s).replace(/\s+/g, ' ');
  const italico = (h) => /font-style:italic/.test(h);
  const verde = (h) => /color:var\(--v\)/.test(h);

  // ── 1. os dois preenchidos ────────────────────────────────────────────────
  const c1 = mi('PRESTACAO DE CONTAS DE CONVENIO', 'ABERTO');
  conf(c1.includes('PRESTACAO DE CONTAS DE CONVENIO'), '1) mostra o assunto');
  conf(/>ABERTO</.test(c1), '1) e a situacao');
  conf(verde(c1), '1) ABERTO sai em verde');
  conf(!italico(c1), '1) e sem italico');

  const c1a = mi('CONVENIO', 'ARQUIVADO');
  conf(/>ARQUIVADO</.test(c1a) && !verde(c1a), '1) ARQUIVADO sai em cinza, nao verde');

  // ── 2. os dois vazios ─────────────────────────────────────────────────────
  const c2 = mi(null, null);
  conf(/ainda não sincronizado/.test(c2), '2) os dois null: "ainda nao sincronizado"');
  conf(italico(c2), '2) em italico');
  conf(!/>ABERTO<|>ARQUIVADO</.test(c2), '2) e o espaco da situacao fica vazio');

  // ── 3. so a situacao — O ESTADO NORMAL DE HOJE ────────────────────────────
  // ⚠️ AQUI NAO ENTRA O ITALICO. Escrever "ainda nao sincronizado" ao lado de um ARQUIVADO
  // preenchido seria a tela se contradizendo na mesma linha: a situacao so existe porque o
  // processo FOI sincronizado. O que falta e a coluna nova, e isso e historia do banco.
  // Medido em 31/08/2026: 7.768 linhas com situacao, ZERO com assunto — quase toda linha
  // da faixa cai neste caso hoje.
  const c3 = mi(null, 'ARQUIVADO');
  conf(!/ainda não sincronizado/.test(c3), '3) so situacao: NAO diz "ainda nao sincronizado"');
  conf(!italico(c3), '3) e nao ha italico nenhum');
  conf(/>ARQUIVADO</.test(c3), '3) a situacao aparece normalmente');
  conf(verde(mi(null, 'ABERTO')), '3) e um ABERTO sem assunto segue verde');

  // ⚠️ O ASSUNTO OCUPA O QUE SOBRA E CORTA: ele vem de varchar(120), e sem `min-width:0` um
  // assunto longo empurraria a situacao e a contagem para fora da linha.
  // ⚠️ `flex:1 1 0`, E NAO `1 1 auto` — a diferenca e a BASE, e ela decide se a linha
  // QUEBRA. O conteiner e `flex-wrap:wrap`, e o flexbox decide a quebra pela largura base de
  // cada item: com `basis:auto` a base do assunto e o conteudo inteiro, entao um assunto de
  // 120 caracteres empurra a situacao e a contagem para uma segunda linha — e as reticencias
  // nunca aparecem, porque o item nunca precisou encolher.
  conf(/flex:1 1 0;min-width:0/.test(c1), 'o assunto nasce com base 0 e cresce no que sobra');
  conf(!/flex:1 1 auto/.test(c1), 'e NAO com base auto, que faria a linha quebrar');
  conf(/text-overflow:ellipsis/.test(c1), 'e corta com reticencias');
  conf(/title="PRESTACAO DE CONTAS DE CONVENIO"/.test(c1), 'com o texto inteiro no title');
  // ⚠️ AS LARGURAS SAO AS DA TABELA, e saem do VINC_COL — nao ha px escrito na celula.
  conf(/flex:0 0 88px/.test(c1.slice(c1.indexOf('ABERTO') - 260)), 'a situacao tem os 88px da coluna');
  conf(/text-align:center/.test(c1.slice(c1.indexOf('ABERTO') - 260)), 'e vem centrada');

  // ── a ordem na linha, e na mae ────────────────────────────────────────────
  const hL = ctx.sgpeVincHtml({ ...BLOCO,
    processos: [{ processo: 'SCC9460/2021', qtd: 3, parciais: ['1'], atual: false,
                  assunto: 'ASSUNTO DA PARCIAL', situacao_portal: 'ABERTO' }],
    mae_assunto: 'ASSUNTO DA MAE', mae_situacao_portal: 'ARQUIVADO' });
  const linha = partes(hL).lista.find(x => x.includes('SCC 00009460/2021')) || '';
  const iAss = linha.indexOf('ASSUNTO DA PARCIAL');
  const iSit = linha.indexOf('>ABERTO<');
  const iQtd = linha.indexOf('flex:0 0 52px');
  const iPar = linha.indexOf('flex:0 0 110px');
  conf(iAss > 0 && iSit > iAss && iQtd > iSit && iPar > iQtd,
       'a ordem e processo · assunto · situacao · PCs · parciais',
       `${iAss} < ${iSit} < ${iQtd} < ${iPar}`);
  // ⚠️ A COLUNA PCS MOSTRA SO O NUMERO — a palavra ja esta no cabecalho.
  conf(/flex:0 0 52px[^>]*>s*3s*</.test(linha), 'e PCS mostra so o numero, sem "PC"/"PCs"',
       (linha.match(/flex:0 0 52px[\s\S]{0,90}/) || [''])[0]);
  // ⚠️ O `margin-left:auto` que empurrava a contagem SAIU: quem ocupa o meio agora e o
  // assunto, e um `auto` sobrando abriria um vao entre a situacao e a contagem.
  conf(!/margin-left:auto/.test(linha), 'e o margin-left:auto da contagem saiu');
  // A mae usa a MESMA funcao, com os campos DELA.
  const blocoMae = partes(hL).mae;
  conf(/ASSUNTO DA MAE/.test(blocoMae) && />ARQUIVADO</.test(blocoMae), 'a mae mostra o assunto e a situacao DELA');
  conf(!/ASSUNTO DA PARCIAL/.test(blocoMae), 'e nao os do processo da lista');
  conf(/sgpeVincMiolo\(d\.mae_assunto, d\.mae_situacao_portal\)/.test(semComent),
       'pela mesma funcao, com os campos proprios');
}

S('9b. OS NUMEROS SAO LINK');
{
  const hL = ctx.sgpeVincHtml(BLOCO);            // consultado = SCC11160/2020, papel=parcial
  const link = (txt) => {
    const i = hL.indexOf(ctx.normalizarProcesso(txt));
    return hL.slice(Math.max(0, i - 420), i + 60);
  };
  // ⚠️ NAO SAO `<a href>`: um href navegaria, e a regra e "tudo dentro do modal". Sao botoes
  // com `data-f`, atendidos pelo MESMO ouvinte das consultas recentes.
  conf(/data-f="vinc"/.test(hL), 'os links saem com data-f="vinc"');
  conf(!/<a [^>]*href/.test(hL), 'e NAO sao <a href> — nada navega para fora');
  conf(!/target="_blank"/.test(hL), 'nem abre aba nova');

  const l1 = link('SCC9460/2021');
  conf(/data-f="vinc"/.test(l1), 'um processo qualquer da lista e link');
  conf(/class="proc-link"/.test(l1), 'com o estilo azul sublinhado que ja existe');
  conf(/cursor:pointer/.test(l1), 'e cursor de mao');
  // ⚠️ OS TRES PEDACOS TEM DE CHEGAR CERTOS — e o que o clique poe nas caixas do topo.
  conf(/data-s="SCC"/.test(l1) && /data-n="9460"/.test(l1) && /data-a="2021"/.test(l1),
       'e leva sigla, numero e ano separados', l1.match(/data-[sna]="[^"]*"/g));

  // ⚠️ O CONSULTADO NAO E LINK: ele ja e o que esta na tela.
  const lAtual = link('SCC11160/2020');
  conf(!/data-f="vinc"/.test(lAtual), 'o consultado NAO e link');
  conf(!/proc-link/.test(lAtual), 'e sai em texto normal, sem sublinhado');

  // ⚠️ O INVALIDO NAO E LINK: nao ha o que consultar. Fica com o bege que ja tinha.
  const iInv = hL.indexOf('AR355478172');
  const lInv = hL.slice(Math.max(0, iInv - 420), iInv + 200);
  conf(!/data-f="vinc"/.test(lInv), 'o invalido NAO e link');
  conf(/line-through/.test(lInv) && /#FAEEDA/.test(lInv), 'e mantem o tratamento bege riscado');

  // ⚠️ A MAE E LINK QUANDO NAO E A CONSULTADA, e deixa de ser quando e.
  const maeParcial = partes(hL).mae;
  conf(/data-f="vinc"/.test(maeParcial), 'a mae e link quando o consultado e um parcial');
  const maeMae = ctx.sgpeVincHtml(comPapel('mae'));
  conf(!/data-f="vinc"/.test(partes(maeMae).mae), 'e deixa de ser link quando ela mesma e a consultada');

  // ⚠️ CONSULTANDO PELA MAE, a lista inteira vira link — nenhuma linha e a consultada.
  const listaMae2 = partes(maeMae).lista.join('');
  conf((listaMae2.match(/data-f="vinc"/g) || []).length === 2,
       'e as duas linhas validas da lista viram link (a invalida nao)',
       (listaMae2.match(/data-f="vinc"/g) || []).length);
}

S('9c. O CLIQUE NAO TEM CAMINHO PROPRIO');
// ⚠️ UM RAMO SO PARA `rec` E `vinc`. Sao o mesmo pedido — "preencha os tres campos e
// consulte" —, e o que a `consultar()` faz depois (limpar a faixa, gravar a recente, rolar ao
// topo, tratar os quatro erros da rota) nao se copia sem esquecer um pedaco.
conf(/if\(f === 'rec' \|\| f === 'vinc'\) \{/.test(semComent), 'rec e vinc dividem UM ramo');
conf(!/if\(f === 'vinc'\) \{/.test(semComent), 'e nao ha um segundo ramo so para o vinc');
{
  const ramo = semComent.slice(semComent.indexOf("if(f === 'rec' || f === 'vinc')"));
  const fim = ramo.indexOf('}');
  const corpo = ramo.slice(0, fim + 1);
  conf(/cSig\.value = alvo\.getAttribute\('data-s'\)/.test(corpo), 'ele preenche a sigla');
  conf(/cNum\.value/.test(corpo) && /cAno\.value/.test(corpo), 'o numero e o ano');
  conf(/return consultar\(\)/.test(corpo), 'e chama a MESMA `consultar` do botao Consultar');
}
// E a faixa se redesenha porque a `consultar` ja limpa e recarrega — nada novo para isso.
conf(/sgpeVincLimpar\(\)/.test(semComent) && /sgpeVincCarregar\(/.test(semComent),
     'e a faixa se redesenha pelo caminho que ja existia');

S('10. A CORRIDA ENTRE DUAS CONSULTAS');
//
// ⚠️ SEM `await`, LIMPAR NAO CANCELA — so apaga o que esta na tela. A resposta que ja estava
// voltando escreve por cima depois, e a TR do processo ANTERIOR aparece embaixo do resultado
// do NOVO. E facil de provocar: consultar A, consultar B, e A demorar mais.
//
// Este teste roda os dois carregamentos de verdade, com a resposta de A chegando DEPOIS da
// de B, e exige que o que fique na tela seja o de B.
(async () => {
  const respostas = {
    'A': { ...BLOCO, tr: '2020TR000AAA', entidade: 'ENTIDADE A' },
    'B': { ...BLOCO, tr: '2020TR000BBB', entidade: 'ENTIDADE B' },
  };
  let atrasoDeA = null;
  els = { sgpeVinculo: { innerHTML: '' } };
  ctx.fetch = async (url) => {
    const qual = /A$/.test(url) ? 'A' : 'B';
    if (qual === 'A') await new Promise(r => { atrasoDeA = r; });   // A fica presa
    return { json: async () => ({ data: respostas[qual], error: null }) };
  };

  const pA = ctx.sgpeVincCarregar('A');     // pede A — fica presa
  const pB = ctx.sgpeVincCarregar('B');     // pede B — volta na hora
  await pB;
  conf(/2020TR000BBB/.test(els.sgpeVinculo.innerHTML), 'B chegou e desenhou');

  atrasoDeA();                              // agora A volta, ATRASADA
  await pA;
  conf(/2020TR000BBB/.test(els.sgpeVinculo.innerHTML) && !/2020TR000AAA/.test(els.sgpeVinculo.innerHTML),
       'e a resposta ATRASADA de A NAO escreve por cima de B');

  // ⚠️ E O LIMPAR CANCELA DE VERDADE: quem estiver voltando depois dele nao escreve mais.
  els.sgpeVinculo.innerHTML = '';
  let solta = null;
  ctx.fetch = async () => { await new Promise(r => { solta = r; });
                            return { json: async () => ({ data: respostas['A'], error: null }) }; };
  const pC = ctx.sgpeVincCarregar('C');
  ctx.sgpeVincLimpar();                     // a pessoa consultou outra coisa
  solta();
  await pC;
  conf(els.sgpeVinculo.innerHTML === '', 'depois do limpar, a resposta em voo nao desenha nada',
       els.sgpeVinculo.innerHTML.slice(0, 60));

  // A janela fechada continua protegida pela segunda guarda.
  els = {};
  ctx.fetch = async () => ({ json: async () => ({ data: respostas['A'], error: null }) });
  let caiu = false;
  try { await ctx.sgpeVincCarregar('A'); } catch (_) { caiu = true; }
  conf(!caiu, 'e a janela fechada no meio do caminho nao derruba nada');

  console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
  process.exit(falhou ? 1 : 0);
})();
