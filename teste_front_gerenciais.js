// CAMINHO: sigpc-gt/teste_front_gerenciais.js
//
// A ABA GERENCIAIS DA TELA DE RELATORIOS  (27/09/2026)
//
// ⚠️ NASCEU DE UM PEDIDO QUE JA ERA UM DIAGNOSTICO: o Richard pediu "um relatorio de analista
// que nunca acessou o sistema" e completou — "isso deveria ja ter em alguma aba". A tela de
// Relatorios so sabia fazer o do CGE, e todo levantamento gerencial virava arquivo solto fora
// do sistema, gerado a mao e sem como refazer.
//
// ⚠️ E O RELATORIO SO SERVE COM A COLUNA DA PORTARIA. Medido em 27/09: os CINCO que nunca
// acessaram eram, todos, dispensados do GT por portaria. Sem essa coluna, o mesmo numero vira
// uma lista de gente que "ignora o sistema" — e cobranca indevida e pior que nenhum relatorio.
//
// USO: node teste_front_gerenciais.js

const fs = require('fs');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

const html = fs.readFileSync('index.html', 'utf8');
const entre = (de, ate) => {
  const i = html.indexOf(de); if (i < 0) throw new Error('nao achei: ' + de);
  const f = html.indexOf(ate, i); if (f < 0) throw new Error('nao achei o fim: ' + ate);
  return html.slice(i, f);
};
const painel = entre('function relPainelGerHtml()', 'async function gerAcesso()');
const acesso = entre('async function gerAcesso()', 'let _cgeDados = []');
const troca = entre('function relMudaAba(aba)', 'const GER_RELATORIOS');
const tela = entre('function irRel()', 'function relMudaTipo');

S('1. A ABA EXISTE, E SO PARA A COORDENACAO');
{
  conf(/relMudaAba\('ger'\)/.test(tela), 'o botao "Gerenciais" esta na barra de abas');
  // ⚠️ A tela ja recusa quem nao e coordenacao no `irRel`; a aba segue a mesma regra dos outros.
  conf(/\$\{\(isAdmin\|\|isCoordi\)\?`<button onclick="relMudaAba\('ger'\)/.test(tela),
       'e so aparece para coordenador e superadmin, como a do CGE');
  conf(/\$\{\(isAdmin\|\|isCoordi\) \? relPainelGerHtml\(\) : ''\}/.test(tela),
       'e o painel so e desenhado para eles');
  conf(/pGer\.style\.display = aba==='ger'/.test(troca), 'a troca de aba mostra e esconde o painel');
  conf(/if\(pGer\)/.test(troca), 'e nao estoura quando o painel nao existe — o analista nao o tem');
}

S('2. A LISTA DE RELATORIOS E UMA SO');
{
  // ⚠️ Uma LISTA, e nao cartoes escritos a mao: o proximo relatorio entra com uma linha, e o
  // desenho continua igual em todos. Cartao copiado e colado diverge no primeiro ajuste.
  conf(/const GER_RELATORIOS = \[/.test(html), 'os relatorios saem de uma lista');
  conf(/GER_RELATORIOS\.map\(r =>/.test(painel), 'e o painel desenha a partir dela');
  conf(/id:'acesso'/.test(html), 'o primeiro e o de acesso ao sistema');
  conf(/gerar:'gerAcesso\(\)'/.test(html), 'com a funcao que o gera');
}

S('3. O DOCUMENTO USA O TIMBRE DO SISTEMA');
{
  // ⚠️ Um segundo papel timbrado divergiria no primeiro ajuste, e documento oficial com
  // cabecalho de outra versao e erro que so aparece depois de assinado.
  conf(/\$\{DOC_CSS\}/.test(acesso), 'o CSS e o dos documentos, nao um novo');
  conf(/\$\{docCabecalho\(\)\}/.test(acesso), 'e o cabecalho tambem');
  conf(/\$\{DOC_ACOES\}/.test(acesso), 'com os dois botoes: imprimir/PDF e baixar .doc');
  conf(!/<style>[^<]*hdr-tbl/.test(acesso), 'e nao ha estilo de timbre escrito aqui dentro');
}

S('4. O QUE O RELATORIO AFIRMA, E O QUE ELE NAO AFIRMA');
{
  conf(/ultimo_acesso/.test(acesso), 'a fonte e o campo do cadastro, e o documento diz isso');
  // ⚠️ A COLUNA DA PORTARIA E O QUE IMPEDE A COBRANCA INDEVIDA.
  conf(/Dispensado pela Portaria/.test(acesso), 'quem saiu por portaria aparece com ela na linha');
  conf(/substituicao/.test(acesso), 'buscada da rota das substituicoes');
  // ⚠️ E A CONCLUSAO MUDA CONFORME O DADO: afirmar "ninguem esta sem acessar" quando ha alguem
  // sem portaria seria o relatorio mentindo para ficar bonito.
  conf(/nunca\.filter\(u=>!u\.saiu\)\.length \?/.test(acesso.replace(/\s+/g, ' ')),
       'a conclusao muda quando ha alguem SEM portaria de saida');
  conf(/não há, nesta data, integrante em exercício sem acesso/i.test(acesso),
       'e so diz "ninguem em exercicio sem acesso" quando e verdade');
  conf(/há \$\{u\.dias\} dias/.test(acesso), 'o quadro 2 mostra ha quantos dias foi o ultimo acesso');
}

S('5. O SEGUNDO RELATORIO: AS PARCIAIS PARADAS NO PASSO 2');
{
  const p2 = entre('async function gerPasso2()', 'let _cgeDados = []');
  conf(html.includes("id:'passo2'") && html.includes("gerar:'gerPasso2()'"), 'entrou na mesma lista, com uma linha');
  // ⚠️ A CONTAGEM E POR PARCELA, como a tela fala — medir por PC daria outro numero.
  conf(p2.includes("x.pcs.every(p => p.baixada)") && p2.includes("x.pcs.every(p => p.parecer_tipo)")
    && p2.includes("x.pcs.every(p => !p.ci_situacao)"),
    'a parcela so conta com TODAS baixadas, TODAS com parecer e NENHUMA no C.I.');
  conf(p2.includes("p.tipo === 'final') return"), 'e a PC final fica de fora, porque tem regra propria');
  conf(/estado !== 'arquivada'/.test(p2), 'a arquivada tambem nao entra');
  // ⚠️ NUMERO QUE NAO DIZ O QUE FAZER NAO MUDA NADA: o numero ja estava na tela de cada um
  // havia meses, e ninguem tinha visto.
  conf(/Na Minha Planilha, abrir a TR, marcar a caixinha/.test(p2), 'o documento ensina o caminho do lote');
  conf(/A baixa não é desfeita/.test(p2), 'e desfaz a duvida que trava a acao');
  conf(/já na fila do C.I./.test(p2), 'com o contexto do que ja esta na mao do Controle Interno');
  conf(/cadastro de suporte/.test(p2), 'o cadastro do superadmin aparece marcado, e nao escondido');
  conf(p2.includes("${DOC_CSS}") && p2.includes("${docCabecalho()}"), 'no mesmo timbre do sistema');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
