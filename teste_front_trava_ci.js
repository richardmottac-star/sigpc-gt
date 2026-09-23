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
  conf(/no Controle Interno \$\{escHtml\(arqNoCiDias\(noCi\)\)\}/.test(pilula),
       'e a pilula passa a dizer ha quanto tempo o processo esta la');
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

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
