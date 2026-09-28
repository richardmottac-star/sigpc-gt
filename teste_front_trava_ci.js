// CAMINHO: sigpc-gt/teste_front_trava_ci.js
//
// A TELA DA TRAVA — a parcial cujo processo ainda esta com o C.I.  (23/09/2026)
//
// ⚠️ O QUE ELE GUARDA: que a tela nao volte a oferecer o botao de arquivar sobre um processo
// que o Controle Interno ainda nao devolveu. Ate 23/09 ela dizia "pronta para arquivar",
// pintava a pilula verde do acordo e mostrava o botao aceso — em 634 das 797 parciais que
// chamava de prontas, uma delas parada no C.I. havia 167 dias.
//
// ⚠️ E A TELA NAO DECIDE NADA DISTO (armadilha 16): ela recebe `ci_no_sgpe` pronto no estado
// do arquivamento. Ha checagem abaixo de que nenhuma regra de setor foi escrita aqui.
//
// USO: node teste_front_trava_ci.js

const fs = require('fs');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

const html = fs.readFileSync('index.html', 'utf8');

// ⚠️ A JANELA TERMINA NUM MARCO DO PROPRIO CODIGO, nunca num numero de caracteres — fatia fixa
// mente quando a funcao cresce, e foram 11 falhas assim em 03/09 (armadilha 30).
const entre = (de, ate) => {
  const i = html.indexOf(de);
  if (i < 0) throw new Error('nao achei o inicio: ' + de);
  const f = html.indexOf(ate, i);
  if (f < 0) throw new Error('nao achei o fim: ' + ate);
  return html.slice(i, f);
};
const faixa = entre('function arqFaixaCi(r, pa) {', 'function arqPilulaParcial(');
const pilula = entre('function arqPilulaParcial(', 'function arqSecretario(');
const bloco = entre('function pCiBloco(r, pa) {', '// ── ARQUIVAMENTO');
const conversa = entre('function pCiConversaHtml(', 'function ciBolha(');

S('1. A TELA NAO DECIDE O QUE E "SETOR DO C.I."');
{
  conf(!/CONIN/.test(html), 'o index.html nao escreve "CONIN" em lugar nenhum');
  conf(/const arqNoCi = \(a\) => \(a && a\.ci_no_sgpe\) \|\| null/.test(html),
       'ela so le o `ci_no_sgpe` que o servidor manda pronto');
  conf(/arqNoCi\(a\)/.test(faixa) && /arqNoCi\(a\)/.test(pilula) && /arqNoCi\(pa\.arquivamento\)/.test(bloco),
       'e os tres lugares perguntam pelo MESMO auxiliar — nao por tres condicoes parecidas');
}

S('2. A FAIXA DIZ O MOTIVO, E O BOTAO NAO ACEITA CLIQUE');
{
  conf(/Ainda não dá para arquivar: o processo está no Controle Interno/.test(faixa),
       'a faixa abre dizendo o que impede');
  conf(/noCi\.setor/.test(faixa) && /noCi\.desde/.test(faixa) && /arqNoCiDias\(noCi\)/.test(faixa),
       'com o setor, desde quando e ha quantos dias');
  // A janela do ramo novo termina no marco do ramo generico que vem logo depois.
  const botao = faixa.slice(faixa.indexOf('if(noCi) return'), faixa.indexOf('background:#fff;border:0.5px solid var(--borda-suave)'));
  conf(/<button class="btn-acao" disabled/.test(botao), 'o botao de arquivar nasce DESABILITADO');
  conf(!/onclick=/.test(botao), 'e sem onclick: botao que aceita clique e nao responde e pior que botao cinza');
  // ⚠️ BOTAO CINZA NUNCA E MUDO (armadilha 19): o motivo fica ao LADO, em texto. O `title` so
  // aparece para quem passa o mouse e espera.
  conf(/o C\.I\. ainda não devolveu<\/span>/.test(botao), 'o motivo fica ao lado, em texto');
  conf(/title="O Controle Interno ainda não devolveu/.test(botao), 'e tambem no title, para quem passa o mouse');
  conf(/procHtml\(ref\.processo_pc, ref\.codigo_pc\)/.test(botao),
       'o processo vira link para conferir no SGPe — pelo procHtml de sempre (armadilha 17)');
  conf(/leitura do SGPe de \$\{escHtml\(noCi\.lido_em\)\}/.test(botao),
       'e a tela diz de quando e a leitura que sustenta a afirmacao');
}

S('3. A PILULA DA LINHA PAROU DE DIZER "PRONTA PARA ARQUIVAR"');
{
  const i = pilula.indexOf("if(a.estado === 'pronta')"), j = pilula.indexOf('const noCi = arqNoCi(a)');
  conf(i > 0 && j > i, 'o ramo do C.I. vem depois do "pronta" — quem esta no C.I. nao chega la',
       `pronta@${i} noCi@${j}`);
  // ⚠️ ESTA CHECAGEM MUDOU EM 27/09 PORQUE A DECISAO MUDOU, e nao porque a tela quebrou: com o
  // processo chegado no mesmo dia a pilula dizia "ha 0 dias", e a faixa, "desde 24/09, ha 0
  // dias". Quem viu foi a previa. Agora o tempo so entra quando ha o que dizer.
  conf(/no Controle Interno\$\{arqNoCiDias\(noCi\) \? ' ' \+ escHtml\(arqNoCiDias\(noCi\)\) : ''\}/.test(pilula),
       'a pilula diz ha quanto tempo o processo esta la — quando ha o que dizer');
  conf(/d\.dias <= 0 \? 'desde hoje'/.test(html), 'e "ha 0 dias" virou "desde hoje"');
  conf(/noCi\.dias > 0 \?/.test(faixa), 'na faixa, a data sozinha basta para quem chegou hoje');
  conf(/#FFF4F4/.test(pilula) && /#7A2E2E/.test(pilula), 'na mesma cor do resto do bloco');
}

S('4. O CABECALHO DO BLOCO NAO AFIRMA MAIS O ACORDO');
{
  conf(/const vis = noCi \? \{ fundo:'#FFF4F4'/.test(bloco), 'o bloco inteiro muda de cor');
  conf(!/\$\{est\.borda\}/.test(bloco) && !/\$\{est\.fundo\}/.test(bloco),
       'e a moldura passa a sair do `vis`, nao mais do `est`');
  conf(/\$\{noCi \? `<span[^`]*no C\.I\./.test(bloco.replace(/\r?\n/g, ' ')),
       'a pilula verde do acordo da lugar a "no C.I. desde ..."');
  conf(/sem devolução registrada/.test(bloco), 'com a etiqueta de que nada foi devolvido');
  // ⚠️ A ETIQUETA DE 22/09 NAO SOMA COM A NOVA: "sem tecnico registrado" ao lado de "sem
  // devolucao registrada" e o mesmo recado duas vezes.
  conf(/\$\{!noCi && pa\.arquivamento\?\.ci_opcao_deduzida \?/.test(bloco),
       'e a etiqueta "sem tecnico registrado" sai de cena, para nao repetir o recado');
}

S('5. O SILENCIO DO C.I. TEM TRES MOTIVOS');
{
  conf(/function pCiConversaHtml\(msgs, deduzida, noCi\)/.test(html), 'a conversa recebe o terceiro caso');
  conf(/o processo ainda está com eles no SGPe/.test(conversa),
       'e diz que o C.I. nao escreveu porque ainda esta com o processo');
  conf(/pCiConversaHtml\(msgs, pa\.arquivamento\?\.ci_opcao_deduzida, noCi\)/.test(bloco),
       'e quem desenha o bloco passa o caso adiante');
  // Os dois motivos antigos continuam: a carga de 16/08 e a conversa que so nao comecou.
  conf(/carga de 16\/08\/2026, e não houve conversa registrada/.test(conversa), 'o motivo da carga fica');
  conf(/Nada ainda\. O parecer está no SIGEF\./.test(conversa), 'e o "ainda nao comecou" tambem');
}

S('6. O CAMINHO PARA DESTRAVAR, DENTRO DA PROPRIA FAIXA');
{
  const bloco = entre('function arqSgpeConsultaHtml(', 'async function arqSgpeConsultar(');
  const fn = entre('async function arqSgpeConsultar(', 'A pílula da parcial na linha');
  // ⚠️ "NAO DA PARA ARQUIVAR" SEM O CAMINHO e o mesmo beco do botao cinza mudo (armadilha 19).
  conf(/Como liberar o arquivamento/.test(bloco), 'a faixa diz o que fazer, e nao so o que impede');
  conf(/1\. Confira no SGPe/.test(bloco) && /2\. Clique em/.test(bloco) && /3\. Tendo saído/.test(bloco),
       'em tres passos numerados');
  conf(/sgpeLogoImg\(16\)/.test(bloco), 'o botao leva a logo do SGPe que o sistema ja tem');
  conf(/Consultar o SGPe agora/.test(bloco), 'e diz exatamente o que faz');
  conf(/arqSgpeConsultaHtml\(r, pa, noCi, a\)/.test(faixa), 'e sai DENTRO da faixa do bloqueio');
  // ⚠️ A FINAL TEM UM PASSO A MAIS, e ele nao pode sumir: a baixa do Secretario no SIGEF e
  // exigencia da final desde 13/09, e a pessoa precisa saber disso ANTES de clicar.
  conf(/a\.final \? `<br>/.test(bloco) && /baixa do Secretário no SIGEF/.test(bloco),
       'na PC final entra o passo 4: a data da baixa do Secretario');
  conf(/if\(!proc\) return ''/.test(bloco), 'sem processo nenhum, o bloco nem aparece');
}

S('7. O BOTAO SO RELE O SGPe — ele nao arquiva e nao julga o setor');
{
  const fn = entre('async function arqSgpeConsultar(', 'A pílula da parcial na linha');
  conf(/sgpe\/situacao\/atualizar/.test(fn), 'chama a MESMA rota do "Atualizar agora" da Gestao');
  // ⚠️ MISTURAR AS DUAS COISAS NUM CLIQUE SO seria arquivar por conta de uma leitura que
  // ninguem conferiu. Quem arquiva continua sendo a pessoa.
  conf(!/arqAbrir|\/parcela\/arquivar/.test(fn), 'e nao arquiva nada');
  // ⚠️ A REGRA DE "SETOR DO C.I." NAO PODE SER ESCRITA AQUI — seria a segunda copia dela.
  conf(!/CONIN/.test(fn), 'a tela nao decide se o setor que voltou e do C.I.');
  conf(/arqRecarregar\(\)/.test(fn), 'ela recarrega e deixa o servidor recalcular o estado');
  conf(/bt\.disabled = true/.test(fn), 'o botao trava enquanto consulta');
  conf(/bt\.disabled = false/.test(fn), 'e volta a funcionar quando o portal falha');
  conf(/setor_sigla/.test(fn) && /Agora no SGPe/.test(fn), 'e a tela mostra o setor que voltou');
}

S('8. A MESMA FAIXA CONFIRMA, DO OUTRO LADO');
{
  const pos = entre('function arqSgpePosHtml(', 'O CAMINHO PARA DESTRAVAR');
  const pronta = faixa.slice(faixa.indexOf("if(a.estado === 'pronta')"), faixa.indexOf("if(a.estado === 'arquivada')"));
  conf(/arqSgpePosHtml\(a\)/.test(pronta), 'a faixa de quem JA PODE arquivar diz onde o processo esta');
  conf(/já saiu do Controle Interno/.test(pos), 'e confirma que saiu do C.I.');
  conf(/Pode arquivar/.test(pos), 'com a frase que o analista precisa ler');
  conf(/p\.setor/.test(pos) && /p\.desde/.test(pos), 'nomeando o setor e desde quando');
  conf(/leitura do SGPe de/.test(pos), 'e dizendo de quando e a leitura');
  // ⚠️ A TELA NAO JULGA O SETOR: o `no_ci` vem decidido do servidor.
  conf(/p\.no_ci/.test(pos) && !/CONIN/.test(pos), 'quem diz se o setor e do C.I. continua sendo o servidor');
  // ⚠️ O CASO DA LEITURA VENCIDA aparece em vez de sumir: liberado, mas com a contradicao a vista.
  conf(/ainda mostra o processo em/.test(pos), 'e a leitura vencida vira aviso, nao silencio');
  conf(/if\(!p \|\| !p\.setor\) return ''/.test(pos), 'sem leitura nenhuma, nada e afirmado');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
