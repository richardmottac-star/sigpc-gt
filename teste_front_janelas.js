// CAMINHO: sigpc-gt/teste_front_janelas.js
//
// AS JANELAS FLUTUANTES (31/08/2026) — os modais de consulta e trabalho que deixaram de
// travar a tela. Executa a regra de verdade num DOM de mentira. Sem navegador, sem rede.
//
// ⚠️ O QUE ELE GUARDA: a TRAVA DA POSICAO FORA DA TELA. A posicao e salva em pixels
// absolutos; quem arrasta a janela para a ponta de um monitor de 2560px e no dia seguinte
// abre o sistema num notebook de 1366 receberia uma janela inteira fora da area visivel — o
// F4 "nao faz nada", e nao ha nada na tela que explique por que. Esta e a unica regra do
// gerenciador que falha em SILENCIO, e por isso e a mais testada aqui.
//
// USO: node teste_front_janelas.js

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

// ── extrair a parte do gerenciador que decide, e executa-la ──────────────────
//
// ⚠️ SO O QUE DECIDE. O resto do gerenciador (arrastar, empilhar, desenhar a barra) mexe em
// elementos e ouvintes de verdade; um duble de DOM que os aceitasse provaria que o duble
// funciona. O que se testa aqui e a REGRA: onde a janela abre, e quando a posicao salva deixa
// de valer.
const iJF = html.indexOf('const JF_CHAVE_LS');
const fJF = html.indexOf('// ── A pilha');
if (iJF < 0 || fJF < 0 || fJF <= iJF) {
  console.error('FALHA: nao achei o bloco do gerenciador no index.html.'); process.exit(1);
}
const codigo = html.slice(iJF, fJF).replace(/^(let|const) /gm, 'var ');

// ⚠️ O `localStorage` DE MENTIRA TAMBEM PRECISA SABER LANCAR. E o que o modo anonimo faz, e
// foi por causa disso que o expandir do SGPe travou em producao — sem um duble que lance, o
// `try` do codigo nunca e exercitado e a protecao passa despercebida ate o dia em que falta.
function criarLS(inicial, lancar) {
  let dados = inicial === undefined ? null : inicial;
  return {
    getItem() { if (lancar) throw new Error('SecurityError'); return dados; },
    setItem(_, v) { if (lancar) throw new Error('SecurityError'); dados = v; },
    _ler() { return dados; },
  };
}

function novoCtx(inicial, lancar) {
  const ctx = { console, localStorage: criarLS(inicial, lancar) };
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx);
  return ctx;
}

S('1. A TRAVA: POSICAO SALVA QUE CAIU FORA DA TELA');
const ctx = novoCtx();
const naTela = ctx.jfNaTela;
const W = 1366, H = 768;

// O caso normal: uma janela bem no meio de uma tela comum.
conf(naTela({ x: 300, y: 120, w: 720, h: 500 }, W, H) === true, 'uma posicao comum vale');

// ⚠️ O MONITOR GRANDE PARA O NOTEBOOK — o caso que motivou a trava.
conf(naTela({ x: 1900, y: 300, w: 860, h: 600 }, W, H) === false,
     'a janela salva num monitor de 2560 nao vale num de 1366');
conf(naTela({ x: 300, y: 1400, w: 720, h: 500 }, W, H) === false,
     'nem uma salva abaixo do rodape de uma tela mais baixa');

// ⚠️ O CRITERIO E A BARRA DE TITULO, NAO A JANELA. E por ela que se arrasta a janela de
// volta: uma janela meio para fora a esquerda ainda mostra a ponta direita da barra.
conf(naTela({ x: -700, y: 100, w: 860, h: 500 }, W, H) === true,
     'meio para fora a esquerda ainda vale — sobra barra para agarrar');
conf(naTela({ x: -830, y: 100, w: 860, h: 500 }, W, H) === false,
     'mas so 30px de barra visivel NAO vale');
conf(naTela({ x: W - 30, y: 100, w: 860, h: 500 }, W, H) === false,
     'e o mesmo do outro lado, com a barra saindo pela direita');

// ⚠️ `y` NEGATIVO E SEMPRE FORA, por maior que seja a janela: a barra de titulo fica ACIMA do
// topo da tela, e e justamente ela que nao se alcanca. Em `x` nao e assim — e a assimetria e
// proposital, nao um esquecimento.
conf(naTela({ x: 300, y: -1, w: 720, h: 500 }, W, H) === false, 'y negativo nunca vale');
conf(naTela({ x: 300, y: 0, w: 720, h: 500 }, W, H) === true, 'y zero vale — a barra esta colada no topo');

// Lixo no armazenamento nao pode passar por posicao.
conf(naTela(null, W, H) === false, 'nulo nao vale');
conf(naTela({}, W, H) === false, 'objeto vazio nao vale');
conf(naTela({ x: 10, y: 10, w: 0, h: 500 }, W, H) === false, 'largura zero nao vale');
conf(naTela({ x: '10', y: 10, w: 720, h: 500 }, W, H) === false, 'texto no lugar do numero nao vale');
conf(naTela({ x: NaN, y: 10, w: 720, h: 500 }, W, H) === false, 'NaN nao vale');

S('2. E ENTAO ELA ABRE CENTRALIZADA');
// ⚠️ ESTA E A CONSEQUENCIA QUE IMPORTA. A trava sozinha so diz "nao vale"; o que impede a
// janela de sumir e a `jfGeometria` cair no padrao CENTRALIZADO quando ela diz isso.
const fora = novoCtx(JSON.stringify({ moTR: { x: 2400, y: 200, w: 1100, h: 680 } }));
const gFora = fora.jfGeometria('moTR', W, H);
conf(gFora.salva === false, 'a posicao fora da tela e descartada');
conf(Math.abs(gFora.x - Math.round((W - gFora.w) / 2)) <= 1, 'e a janela nasce centrada na horizontal',
     JSON.stringify(gFora));
conf(gFora.x >= 0 && gFora.x + gFora.w <= W, 'inteira dentro da tela na horizontal');
conf(gFora.y >= 0 && gFora.y + gFora.h <= H, 'e na vertical', JSON.stringify(gFora));

const dentro = novoCtx(JSON.stringify({ moTR: { x: 120, y: 60, w: 900, h: 600 } }));
const gDentro = dentro.jfGeometria('moTR', W, H);
conf(gDentro.salva === true && gDentro.x === 120 && gDentro.y === 60,
     'a posicao que cabe VOLTA como estava', JSON.stringify(gDentro));

S('3. O TAMANHO SALVO NUNCA PASSA DA TELA');
// ⚠️ UMA JANELA DE 1600px NUM MONITOR DE 1366 NASCERIA COM AS DUAS PONTAS FORA — e a da
// direita leva os tres botoes. O corte e no tamanho, e a posicao continua valendo.
const larga = novoCtx(JSON.stringify({ moTR: { x: 10, y: 10, w: 2400, h: 1800 } }));
const gLarga = larga.jfGeometria('moTR', W, H);
conf(gLarga.w <= W - 20 && gLarga.h <= H - 20, 'o tamanho salvo e cortado na tela',
     JSON.stringify(gLarga));
conf(gLarga.w >= 240 && gLarga.h >= 240, 'e nunca abaixo de um minimo utilizavel');
// O padrao de estreia tambem: o Detalhe da TR nasce com 1100px, que nao cabe em 1024.
const estreia = novoCtx();
const gPeq = estreia.jfGeometria('moTR', 1024, 700);
conf(gPeq.w <= 1024 - 40, 'o tamanho de estreia tambem cabe na tela pequena', JSON.stringify(gPeq));
conf(gPeq.salva === false, 'e sem nada salvo ele e o padrao');

S('4. O ARMAZENAMENTO BLOQUEADO NAO DERRUBA A JANELA');
// ⚠️ MEDIDO NO NAVEGADOR EM 31/08, no expandir do SGPe: o armazenamento LANCA no modo
// anonimo e com cookies de terceiros barrados. Sem o `try`, a janela deixaria de abrir por
// causa de uma preferencia de posicao — a leitura mataria a abertura inteira.
const bloq = novoCtx(null, true);
let abriu = true, g4 = null;
try { g4 = bloq.jfGeometria('moNL', W, H); } catch (_) { abriu = false; }
conf(abriu === true, 'com o localStorage lancando, a janela ainda abre');
conf(g4 && g4.salva === false, 'e cai no padrao centralizado', JSON.stringify(g4));
let gravou = true;
try { bloq.jfGravarDisco('moNL', { x: 1, y: 1, w: 500, h: 400 }); } catch (_) { gravou = false; }
conf(gravou === true, 'e gravar tambem nao lanca');
// JSON corrompido no armazenamento tem de ser tratado como "nao ha nada salvo".
const sujo = novoCtx('{isso nao e json');
conf(JSON.stringify(sujo.jfLerDisco()) === '{}', 'JSON corrompido vira estado vazio');
const naoObj = novoCtx('42');
conf(JSON.stringify(naoObj.jfLerDisco()) === '{}', 'e um numero solto tambem');

S('5. A GRAVACAO E POR JANELA, e nao apaga as vizinhas');
const dois = novoCtx(JSON.stringify({ moTR: { x: 1, y: 2, w: 300, h: 300 } }));
dois.jfGravarDisco('moNL', { x: 9, y: 9, w: 400, h: 400 });
const m = dois.jfLerDisco();
conf(!!m.moTR && m.moTR.x === 1, 'gravar uma janela nao apaga a outra', JSON.stringify(m));
conf(!!m.moNL && m.moNL.x === 9, 'e a nova entrou');

S('6. AS CINCO JANELAS, E SO ELAS');
// ⚠️ A LISTA E FECHADA. Quem acrescentar uma janela acrescenta a chave aqui — e este teste e
// o lugar em que se ve que um modal de CONFIRMACAO entrou na lista por engano.
const chaves = Object.keys(ctx.JF_TITULO).sort();
conf(chaves.join(',') === 'ciBuscaMo,moNL,moNovImg,moTR,sgpeMo',
     'as cinco chaves sao as classificadas em 31/08', chaves.join(','));
conf(Object.keys(ctx.JF_TAMANHO).sort().join(',') === chaves.join(','),
     'e toda janela tem um tamanho de estreia');

// ⚠️ NENHUM MODAL DE CONFIRMACAO PODE ESTAR NA LISTA. Sao os que travam a tela de proposito.
const CONFIRMACAO = ['moParecer','moPPar','moPSit','moCorrigir','moAss','moDev','moDevM',
  'moPuxarCi','moDesfazerPx','moPcNova','moSolCor','moRepo','moRepoCat','moAfast','moNovForm',
  'moPrimAcesso','moAdmUser','moAdmSenha','moAdmAprovar','moSigef','moProcEd','moNovAviso'];
conf(CONFIRMACAO.every(k => !(k in ctx.JF_TITULO)),
     'nenhum modal de confirmacao virou janela',
     CONFIRMACAO.filter(k => k in ctx.JF_TITULO).join(','));
// ⚠️ O `moSigef`, o `moProcEd` e o `moNovAviso` foram decididos por voce em 31/08 e estao na
// lista acima de proposito: os tres GRAVAM, e a declaracao do SIGEF nem se desmarca.
conf(!('moSigef' in ctx.JF_TITULO) && !('moProcEd' in ctx.JF_TITULO) && !('moNovAviso' in ctx.JF_TITULO),
     'e os tres duvidosos ficaram travando a tela, como voce decidiu');

S('7. NA TELA: A LIGACAO DAS CINCO');
// Cada janela tem de CHAMAR o gerenciador na abertura — sem isso ela abre como modal comum,
// no meio da tela e com o fundo escuro, e nada acusa.
conf(/jfAbrir\('moTR'\)/.test(semComent), 'o Detalhe da TR chama o gerenciador');
conf((semComent.match(/jfAbrir\('moNL'\)/g) || []).length === 3,
     'e as TRES telas que dividem o moNL tambem',
     (semComent.match(/jfAbrir\('moNL'\)/g) || []).length);
conf(/jfAbrir\('moNovImg'\)/.test(semComent), 'a imagem da novidade tambem');
conf(/jfAbrir\('sgpeMo', el\)/.test(semComent), 'o SGPe passa o elemento que acabou de criar');
conf(/jfAbrir\('ciBuscaMo', d\)/.test(semComent), 'e a busca do C.I. tambem');
// ⚠️ E TEM DE AVISAR AO FECHAR, senao a posicao nao chega ao disco e a janela fica na barra
// das minimizadas depois de fechada.
conf(/jfEncerrar\('sgpeMo'\)/.test(semComent), 'o fechar do SGPe avisa o gerenciador');
conf((semComent.match(/jfEncerrar\('ciBuscaMo'\)/g) || []).length === 2,
     'a busca do C.I. avisa nos DOIS caminhos que a removem — Fechar e Localizar',
     (semComent.match(/jfEncerrar\('ciBuscaMo'\)/g) || []).length);
conf(/function fm\(id\)\s*\{[\s\S]{0,160}jfEncerrar\(id\)/.test(semComent),
     'e o fm() avisa pelas tres janelas permanentes');

S('8. A PILHA');
// ⚠️ O MODAL QUE TRAVA TEM DE FICAR ACIMA DA JANELA QUE FLUTUA. O "Detalhe da TR" flutua e
// tem dentro dele os botoes "Registrar parecer" e "Enviar ao CI": com o modal em 200, a
// confirmacao nasceria ATRAS da janela que a pediu — um clique que escurece a tela e nao
// mostra nada.
conf(/\.mo\{[^}]*z-index:1400/.test(semComent), 'o modal que trava esta em 1400');
conf(/JF_Z_BASE = 1250/.test(semComent), 'e a janela flutuante comeca em 1250');
// ⚠️ O TOAST SOBE JUNTO: ele estava acima do modal (999 > 200) e e ele que diz "Erro:" quando
// a gravacao falha. Subir so o modal esconderia a mensagem atras da caixa que a provocou.
conf(/\.toast\{[^}]*z-index:1500/.test(semComent), 'e o toast continua acima do modal');
// A pilha e REORDENADA, nao incrementada: um contador que so sobe passa de 1400 e a janela
// comeca a cobrir os modais de confirmacao — o defeito que o 1400 existe para impedir.
conf(/JF_Z_BASE \+ i/.test(semComent), 'o foco reordena as janelas em vez de incrementar sem fim');
conf(!/_jfZ\+\+|jfZ\s*\+=\s*1/.test(semComent), 'e nao ha contador que so cresce');

S('9. A CAMADA NAO ENGOLE O CLIQUE DA TELA DE TRAS');
// ⚠️ A REGRA QUE DEFINE A JANELA FLUTUANTE. A camada continua sendo `inset:0` — ela cobre a
// tela inteira. Sem `pointer-events:none` nela, a tela de tras deixaria de ser clicavel e a
// janela seria um modal sem fundo escuro, que e pior: parece que da para clicar, e nao da.
conf(/\.mo\.jf\{[^}]*pointer-events:none/.test(semComent), 'a camada nao recebe clique');
conf(/\.mo\.jf \.mc\{[^}]*pointer-events:auto/.test(semComent), 'mas a caixa recebe');
conf(/\.mo\.jf\{[^}]*background:none/.test(semComent), 'e nao ha fundo escuro');
// ⚠️ E A CAMADA SO APARECE COM .open. A classe .jf fica no elemento PARA SEMPRE — as tres
// janelas permanentes nunca saem do documento —, entao um display declarado no .jf venceria
// o .mo{display:none} e a janela FECHADA continuaria desenhada na tela: fechar deixaria de
// fechar. Foi um defeito real desta rodada, pego antes de publicar.
conf(!/\.mo\.jf\{[^}]*display:/.test(semComent), 'o .jf NAO declara display');
conf(/\.mo\.jf\.open\{display:block/.test(semComent), 'so o .jf.open declara, e ele vence o .mo.open');

S('10. A BARRA DE TITULO E A ALCA');
conf(/\.mo\.jf \.mch\{[^}]*cursor:move/.test(semComent), 'o cursor na barra e o de mover');
conf(/\.mo\.jf \.mch\{[^}]*position:sticky/.test(semComent),
     'e ela fica presa no topo — e a alca e os tres botoes nao podem rolar para fora');
// ⚠️ O ARRASTO NAO COMECA EM CIMA DE BOTAO: sem a guarda, clicar em Minimizar com a mao
// tremida arrasta a janela um pixel e o clique vira arrasto. O botao "nao funciona" de vez em
// quando, que e a pior forma de um botao nao funcionar (armadilha 15).
conf(/closest\('button, input, select, textarea, a'\)/.test(semComent),
     'o arrasto nao comeca em cima de botao nem de campo');

S('11. A ROLAGEM INTERNA SAIU');
// ⚠️ O `#sgpeRolagem` ERA A UNICA ROLAGEM INTERNA DO SISTEMA. Na janela flutuante quem rola e
// a janela toda; duas rolagens aninhadas dariam duas barras na mesma caixa.
conf(/\.mo\.jf #sgpeRolagem\{[^}]*overflow:visible !important/.test(semComent),
     'a rolagem interna do SGPe e desligada na janela');
conf(/mc\.style\.overflow\s*=\s*'auto'/.test(semComent), 'e quem rola passa a ser o .mc');
conf(/mc\.style\.display\s*=\s*'block'/.test(semComent),
     'com o display:flex inline do SGPe desfeito, senao o sticky da barra nao pega');
// ⚠️ E A FAIXA DE VINCULACAO TAMBEM PERDEU A DELA (31/08, segunda rodada): eram 330px com
// rolagem propria dentro da janela que ja rola — duas barras, e a roda do mouse escolhendo
// uma sem avisar qual. Agora e uma so, a do .mc.
conf(!/max-height:330px/.test(semComent), 'a faixa de vinculacao nao tem mais rolagem propria');

S('11b. O TOPO PRESO — DUAS CAMADAS, E A MEDIDA DELAS');
// ⚠️ O DEFEITO: a linha de busca do SGPe (sigla, numero, ano, Consultar) era flex-shrink:0
// num .mc que NAO rolava, e por isso ficava parada de graca. Quando a rolagem passou a ser da
// janela inteira, ela virou conteudo comum e saiu da tela junto com o resto — e quem consulta
// o processo seguinte tinha de rolar de volta ao topo para achar o campo.
conf(/<div data-jf-preso style="padding:14px 18px 13px/.test(semComent),
     'a linha de busca do SGPe esta marcada como presa');
conf(/\.mo\.jf \[data-jf-preso\]\{[^}]*position:sticky/.test(semComent), 'e a marca a prende');
conf(/\.mo\.jf \[data-jf-preso\]\{[^}]*background:#fff/.test(semComent),
     'com fundo opaco, senao o conteudo passa por baixo dela');
// ⚠️ ELA SE ENCOSTA NA BARRA DE TITULO, e nao no alto da janela: com top:0 as duas ficariam
// no mesmo lugar, e a de z-index maior cobriria a outra.
conf(/\.mo\.jf \[data-jf-preso\]\{[^}]*top:var\(--jf-titulo,0px\)/.test(semComent),
     'e se encosta na barra de titulo, nao no alto do .mc');
// ⚠️ A ALTURA E MEDIDA, NUNCA ESCRITA. A barra de titulo quebra de linha conforme a largura,
// e a linha de busca tem flex-wrap e um #sgpeIdent que so se enche DEPOIS da consulta — ela
// muda de altura com a janela ja aberta. Um numero fixo acertaria num tamanho e erraria em
// todos os outros, e o erro nao da erro: sobra uma fresta, ou uma camada cobre a outra.
conf(/function jfMedirTopo\(chave\)/.test(semComent), 'ha uma funcao que MEDE o topo preso');
conf(/setProperty\('--jf-titulo'/.test(semComent) && /setProperty\('--jf-topo'/.test(semComent),
     'e ela escreve as DUAS medidas: a barra de titulo e o topo inteiro');
conf(/querySelectorAll\('\[data-jf-preso\]'\)\.forEach\(p => \{ total \+= p\.offsetHeight \}\)/.test(semComent),
     'o topo inteiro soma as camadas presas a barra de titulo');
// ⚠️ E SE REFAZ ONDE A ALTURA PODE TER MUDADO. Minimizada, o .mc fica display:none e tudo
// dentro dele mede ZERO — sem medir de novo ao restaurar, a janela voltaria da barra com o
// topo preso em 0px e o conteudo passaria por baixo do titulo.
const chamadas = (semComent.match(/jfMedirTopo\(chave\)/g) || []).length;
conf(chamadas >= 4, 'ela e chamada ao abrir, ao maximizar, ao restaurar e pelo observador', chamadas);
conf(/function jfRestaurar\(chave\)[\s\S]{0,520}jfMedirTopo\(chave\)/.test(semComent),
     'inclusive ao voltar da barra das minimizadas');
// ⚠️ O ResizeObserver ve o que ninguem avisa: a consulta enchendo o #sgpeIdent, que esta
// DENTRO da linha de busca e pode faze-la quebrar. Lembrar de avisar e o que se esquece.
conf(/new ResizeObserver\(\(\) => jfMedirTopo\(chave\)\)/.test(semComent),
     'um ResizeObserver refaz a medida sozinho');
conf(/typeof ResizeObserver === 'function'/.test(semComent),
     'com guarda, porque nem todo navegador o tem');
conf(/window\.addEventListener\('resize', jfMedirTodas\)/.test(semComent),
     'e o resize da janela fica como rede');

S('12. O EXPANDIR PROPRIO DO SGPe SAIU');
// ⚠️ ELE VIROU O MAXIMIZAR, que e o mesmo botao nas cinco janelas. Dois botoes de maximizar
// na mesma barra de titulo seriam dois estados a manter em acordo.
conf(!/sgpeAplicarTamanho|sgpeEstaCheia|sgpeCheiaLer|sgpeCheiaGravar/.test(semComent),
     'as quatro funcoes do expandir antigo sairam');
conf(!/id="sgpeExp"/.test(semComent), 'e o botao ⤢ tambem');
// ⚠️ MAS A LICAO FICOU: o estado de um elemento que esta na tela sai DELE, nunca do
// armazenamento. Foi lendo do sessionStorage que a janela expandia e nunca mais voltava.
conf(/function jfEstaMax\(mc\)\s*\{\s*return !!mc && mc\.dataset\.jfMax === '1'/.test(semComent),
     'e o maximizar le o estado do ELEMENTO');
conf(/if\(jfEstaMax\(mc\)\)/.test(semComent), 'o clique alterna a partir dele');
conf(!/jfEstaMax\(\)\s*\|\|\s*jfLerDisco/.test(semComent), 'e nunca do armazenamento');

S('13. MINIMIZAR E A BARRA DO RODAPE');
// ⚠️ RESTAURA ONDE ESTAVA: minimizar so esconde o .mc, e left/top/width/height continuam
// escritos nele. Recalcular a posicao no restaurar faria a janela pular a cada ida e volta.
conf(/function jfMinimizar\(chave\)[\s\S]{0,420}st\.mc\.style\.display = 'none'/.test(semComent),
     'minimizar so esconde a caixa');
conf(/function jfRestaurar\(chave\)[\s\S]{0,420}st\.mc\.style\.display = 'block'/.test(semComent),
     'e restaurar so a mostra de volta — na posicao em que estava');
conf(!/function jfRestaurar\(chave\)[\s\S]{0,420}jfGeometria\(/.test(semComent),
     'o restaurar NAO recalcula a posicao');
// ⚠️ A BARRA SO EXISTE ENQUANTO HOUVER MINIMIZADA: uma barra vazia presa no rodape comeria
// altura da tela para nao dizer nada.
conf(/if\(!mins\.length\) \{ if\(barra\) barra\.remove\(\); return \}/.test(semComent),
     'a barra some quando nao ha nenhuma minimizada');
// ⚠️ O TITULO VAI CONGELADO NO MOMENTO DE MINIMIZAR: o moNL troca de nome a cada dono, e o
// item da barra tem de dizer qual dos tres esta ali embaixo.
conf(/st\.titulo = \(h3 && h3\.textContent\.trim\(\)\)/.test(semComent),
     'e o item da barra leva o titulo que a janela tinha na hora');

S('14. FECHAR E CLICAR NO ✕ QUE A JANELA JA TINHA');
// ⚠️ Cada janela fecha de um jeito — fm('moTR'), ciBuscaFechar() (que ainda apaga o destaque
// da fila) e o fechar() interno do SGPe (que tira o ouvinte de tecla). Reimplementar aqui
// seria uma segunda regra de fechamento, e ela esqueceria o que e proprio de cada uma.
conf(/const x = st\.el\.querySelector\('\.mcx'\)\s*\r?\n\s*if\(x\) x\.click\(\)/.test(semComent),
     'o ✕ da janela clica no ✕ original');
conf(/if\(x\) x\.style\.display = 'none'/.test(semComent), 'que continua existindo, so escondido');

S('15. O Esc');
// ⚠️ NA FASE DE BOLHA, DE PROPOSITO. O SGPe e a busca do C.I. ja tem o Esc DELES, na captura
// e com stopPropagation — o evento nem chega ao ouvinte do gerenciador, e cada uma segue
// fechando pelo caminho proprio. Este ouvinte serve as tres que nunca tiveram Esc.
const escBloco = (semComent.match(/document\.addEventListener\('keydown', \(e\) => \{\s*\r?\n\s*if\(e\.key !== 'Escape'\)[\s\S]*?\n\}\)/) || [''])[0];
conf(!!escBloco, 'ha um ouvinte de Esc para as janelas');
conf(!/true\)\s*$/.test(escBloco.trim()), 'e ele NAO e de captura — senao roubaria o Esc do SGPe');
// ⚠️ UM MODAL DE CONFIRMACAO ABERTO POR CIMA MANDA NO Esc: ele e quem esta travando a tela.
conf(/querySelector\('\.mo\.open:not\(\.jf\)'\)/.test(escBloco),
     'e o modal que trava tem prioridade no Esc');
conf(/_jfFoco/.test(escBloco), 'fecha a janela em foco, e nao todas');
// F2 e F4 nao mudaram.
conf(/if\(e\.key !== 'F4'/.test(semComent), 'o F4 continua abrindo o SGPe');
conf(/if\(e\.key !== 'F2'/.test(semComent), 'e o F2 continua abrindo a busca do C.I.');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
