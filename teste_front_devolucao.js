// CAMINHO: sigpc-gt/teste_front_devolucao.js
//
// DEVOLVER TR, DATA DE ASSUNCAO E ETIQUETA DE NOVA — o lado da tela.
//
// Le o index.html servido. Confere PRESENCA e ORDEM, que e onde os defeitos moraram.

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let ok = 0, falhou = 0;
function conf(cond, nome) {
  if (cond) { ok++; console.log('  OK    ' + nome); }
  else      { falhou++; console.log('  FALHA  ' + nome); }
}
function secao(t) { console.log('\n═══ ' + t + ' ═══'); }

// ─────────────────────────────────────────────────────────────
secao('1. UMA CHAMADA, NAO 83');

const conf_ = html.slice(html.indexOf('async function confDevM'), html.indexOf('async function confDevM') + 2000);
conf(/\/tr\/devolver/.test(conf_), 'confDevM chama POST /tr/devolver');
// ⚠️ O DEFEITO N.1: um PATCH por PC, em serie. Rede caindo no meio deixava metade da TR
// no estoque e metade com o analista.
conf(!/for\s*\(\s*const pc of/.test(conf_), 'NAO ha laco de PCs — acabou o PATCH por PC');
conf(!/prestacoes_contas\/\$\{encodeURIComponent\(pc/.test(conf_), 'e nenhum PATCH por codigo_pc');
conf((conf_.match(/await fetch\(/g) || []).length === 1, 'exatamente UMA requisicao');

// ─────────────────────────────────────────────────────────────
secao('2. OS NUMEROS VEM DO SERVIDOR');

const abrir = html.slice(html.indexOf('async function abrirDevM'), html.indexOf('async function abrirDevM') + 3600);
conf(/\/tr\/\$\{encodeURIComponent\(tr\)\}\/devolucao/.test(abrir), 'a previa vem de GET /tr/:tr/devolucao');
// Antes a tela filtrava analista_id === U.id e contava sozinha: se a conta da tela e a do
// banco divergissem, o modal prometia 71 e o banco devolvia outro numero.
conf(!/String\(p\.analista_id\) === String\(U\.id\)/.test(abrir), 'a tela NAO conta mais sozinha');
conf(!/filter\(p => p\.baixada/.test(abrir), 'nem filtra baixadas por conta propria');
conf(/DEVM_PREVIA = j\.data/.test(abrir), 'guarda o que o servidor respondeu');
conf(/p\.motivos/.test(abrir), 'e ate a lista de motivos vem de la — uma fonte so');

// ─────────────────────────────────────────────────────────────
secao('3. O BOTAO NASCE DESABILITADO (armadilha 15)');

conf(/function devMBotao\(ativo, motivo\)/.test(html), 'ha uma funcao unica de estado do botao');
conf(/devMBotao\(false, 'Carregando as PCs desta TR\.\.\.'\)/.test(abrir), 'nasce desabilitado ao abrir');
conf(/devMBotao\(false, 'Selecione o motivo da devolução'\)/.test(abrir), 'segue desabilitado sem motivo');
const btn = html.slice(html.indexOf('function devMBotao'), html.indexOf('function devMBotao') + 700);
conf(/b\.title = ativo \? '' : \(motivo \|\| ''\)/.test(btn), 'com o motivo no title quando cinza');
conf(/Devolver \$\{n\} PC/.test(btn), 'e o numero vai NO BOTAO');
// erro tem de repintar, senao fica "Devolvendo..." para sempre
conf(/catch\(e\)[\s\S]{0,220}?devMMudouMotivo\(\)/.test(conf_), 'no erro repinta — botao aceso que nao responde e pior que cinza');

// ─────────────────────────────────────────────────────────────
secao('4. MOTIVO OBRIGATORIO, E "OUTRO" EXIGE DESCRICAO');

const mudou = html.slice(html.indexOf('function devMMudouMotivo'), html.indexOf('function devMMudouMotivo') + 800);
conf(/if\(!mot\) return devMBotao\(false/.test(mudou), 'sem motivo o botao nao acende');
conf(/ehOutro && det\.value\.trim\(\)\.length < 10/.test(mudou), 'Outro exige ao menos 10 caracteres');
conf(/id="devMOutroBox"/.test(html), 'ha campo livre para Outro');
conf(/id="devMDetalhe"/.test(html) && /maxlength="200"/.test(html), 'com limite de 200');
conf(/devMConta/.test(mudou), 'e contador de caracteres');

// ─────────────────────────────────────────────────────────────
secao('5. O IMPEDIMENTO DO CONTROLE INTERNO');

conf(/p\.impedimento/.test(abrir), 'a tela respeita o impedimento do servidor');
conf(/Não dá para devolver agora/.test(abrir), 'e explica que nao da');
conf(/devMBotao\(false, p\.impedimento\)/.test(abrir), 'com a razao no botao cinza');
// com a TR travada, escolher motivo nao tem sentido
conf(/if\(p\.impedimento\)[\s\S]{0,600}?return/.test(abrir), 'e nem mostra os campos de motivo');
conf(/no Controle Interno/.test(abrir), 'o quadro mostra quantas estao no C.I.');

// ─────────────────────────────────────────────────────────────
secao('6. A GUARDA DA TELA E CONVENIENCIA, NAO GARANTIA');

conf(/U\.perfil !== 'superadmin'[\s\S]{0,80}?Ação restrita ao superadmin/.test(abrir),
     'a tela recusa quem nao e superadmin');
conf(/verComoAtivo\(\)[\s\S]{0,120}?Modo leitura/.test(abrir),
     'e o modo "ver como" tambem — devolver e acao');
// o servidor e' quem garante; a tela so evita desenhar o que nao serve
conf(/DEVOLVER TR AO ESTOQUE — só superadmin/.test(html), 'o cabecalho diz de quem e a garantia');

// ─────────────────────────────────────────────────────────────
secao('7. O BOTAO NO CARTAO DA TR');

const cartao = html.slice(html.indexOf('const baixadaTr = planTrConcluida(r)'),
                          html.indexOf('const baixadaTr = planTrConcluida(r)') + 4200);
conf(/abrirDevM\('\$\{escHtml\(r\.tr\)\}'\)/.test(cartao), 'o cartao tem o botao Devolver');
conf(/U\.perfil === 'superadmin' && !baixadaTr && !verComoAtivo\(\)/.test(cartao),
     'so superadmin, so em TR nao concluida, e nao no modo leitura');
conf(/event\.stopPropagation\(\);abrirDevM/.test(cartao),
     'e o clique nao expande a TR junto');

// ─────────────────────────────────────────────────────────────
secao('8. dt_assumida NO CABECALHO');

conf(/function planAssumidaEm\(r\)/.test(html), 'ha leitura de dt_assumida');
conf(/p\.dt_assumida/.test(html), 'do campo certo');
conf(/assumida em \$\{planData\(assumida\)\}/.test(cartao), 'e o cabecalho mostra "assumida em"');
// ⚠️ sem data nao inventa: as 761 TRs de antes de 12/08 nao tem, e e melhor omitir
conf(/\$\{assumida \? ` · assumida em/.test(cartao), 'sem data, a linha simplesmente nao aparece');
conf(/planInicioAnalise\(r\)/.test(cartao), 'e "analise desde" continua ao lado — sao duas datas diferentes');

// ─────────────────────────────────────────────────────────────
secao('9. A ETIQUETA ✨ NOVA — 7 dias');

conf(/const DIAS_TR_NOVA = 7/.test(html), 'o criterio e 7 dias, num lugar so');
const nova = html.slice(html.indexOf('function planTrNova'), html.indexOf('function planTrNova') + 400);
conf(/if\(!d\) return false/.test(nova), 'SEM DATA NAO E NOVA — vazio nao e recente');
conf(/dias >= 0 && dias <= DIAS_TR_NOVA/.test(nova), 'e a janela e de 0 a 7 dias');
conf(/✨ NOVA/.test(cartao), 'a etiqueta aparece no cabecalho');
conf(/const trNova\s*=\s*!baixadaTr && planTrNova\(r\)/.test(cartao),
     'TR CONCLUIDA NAO E NOVA — ja acabou, por mais recente que seja a assuncao');
conf(/background:var\(--az\)/.test(cartao), 'em azul — nao compete com o verde de concluida nem com o vermelho de prazo');
conf(/function planHaQuantoTempo/.test(html), 'e diz ha quanto tempo foi assumida');
conf(/some sozinha depois de \$\{DIAS_TR_NOVA\} dias/.test(cartao), 'o title explica que ela sai sozinha');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
