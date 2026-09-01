// CAMINHO: sigpc-gt/teste_front_transferir.js
//
// A TELA TRANSFERIR PRESTACOES DE CONTAS (31/08/2026) — o desenho. A rota que grava ainda
// nao existe, e o botao fica cinza com o motivo ao lado.
//
// ⚠️ O QUE ELE GUARDA: quem VE a tela, e o que a tela PROMETE. A guarda e de perfil — nem
// coordenador entra —, e a promessa e a regra do que vai e do que fica: as PCs baixadas nao
// sao transferidas, e a produtividade delas continua com quem analisou. Um erro em qualquer
// das duas nao da erro: a primeira abre o acervo alheio a quem nao devia, a segunda faz o
// analista achar que perdeu o trabalho.
//
// USO: node teste_front_transferir.js

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

const bloco = semComent.slice(semComent.indexOf('let _trfUsuarios'), semComent.indexOf('let PRIOR_DADOS'));
if (!bloco) { console.error('FALHA: nao achei o bloco da tela no index.html.'); process.exit(1); }

S('1. SO O SUPERADMIN — E NEM COORDENADOR');
// ⚠️ O ITEM MORA NO BLOCO DA COORDENACAO, mas o `pode` e do superadmin. As duas coisas
// juntas sao a decisao do Richard: o item fica onde a pessoa procura, e quem pode move-lo e
// outra pergunta.
conf(/id:'transf', bloco:'coordenacao'/.test(semComent), 'o item vive no bloco da coordenacao');
conf(/id:'transf'[\s\S]{0,200}?pode:\(u\)=>u\.perfil === 'superadmin'/.test(semComent),
     'mas so o superadmin o ve — nem coordenador');
// ⚠️ ESCONDER O MENU NAO E A GUARDA. A funcao recusa na origem, para quem chegar pela acao.
conf(/function irTransferir\(\)[\s\S]{0,400}?perfilEfetivo\(U\) !== 'superadmin'/.test(semComent),
     'e a funcao recusa na origem, nao so o menu');
// ⚠️ `perfilEfetivo`, E NAO `U.perfil`: no papel analista o superadmin E analista em toda
// parte, e esta tela move o acervo de outra pessoa.
conf(!/function irTransferir\(\)[\s\S]{0,300}?U\.perfil !== 'superadmin'/.test(semComent),
     'pelo perfil EFETIVO, que respeita o papel ativo');

S('2. ABAIXO DE GESTAO GRUPO');
const iCoord = semComent.indexOf("id:'coord'");
const iTransf = semComent.indexOf("id:'transf'");
const iAprov = semComent.indexOf("id:'aprov'");
conf(iCoord > 0 && iTransf > iCoord, 'o item vem DEPOIS de Gestao Grupo');
conf(iAprov > iTransf, 'e antes de Aprovacoes — e o vizinho de baixo dela');

S('3. A REGRA DO QUE VAI E DO QUE FICA, ESCRITA NA TELA');
// ⚠️ ELA FICA NA TELA, e nao so no comentario do codigo: e ela que responde a pergunta que o
// analista faz depois — "perdi minha produtividade?".
conf(/As PCs já baixadas não são transferidas\. A produtividade delas continua com quem analisou\./.test(bloco),
     'a frase esta no texto da tela, palavra por palavra');
conf(/#FDF6E9/.test(bloco) && /#BA7517/.test(bloco), 'numa faixa bege, a mesma do resto do sistema');
conf(/A TR vai para o novo analista e as PCs abertas vão junto/.test(bloco),
     'e a tela diz o que VAI: a TR e as PCs abertas');
conf(/As baixadas ficam no nome de/.test(bloco), 'e o que FICA: as baixadas, com quem analisou');

S('4. OS DOIS SELETORES');
// ⚠️ O "DE" TRAZ OS DISPENSADOS — e e o caso principal da tela: o acervo parado e o de quem
// saiu. O "PARA" nao: mandar PC para quem saiu e o problema que esta tela existe para
// desfazer.
conf(/id="trfDe"/.test(bloco) && /id="trfPara"/.test(bloco), 'ha um "De" e um "Para"');
conf(/_trfUsuarios\.map\(u =>/.test(bloco), 'o "De" lista todos os analistas, sem filtrar');
conf(/_trfUsuarios\.filter\(u => u\.ativo && !ehDispensado\(u\)\)/.test(bloco),
     'e o "Para" corta os dispensados');
// ⚠️ O CORTE E POR `data_saida`, NUNCA POR `ativo` — nos sete dispensados o `ativo` continua
// `true`, por decisao do Richard: quem saiu precisa terminar o que ficou em curso. Sao
// colunas diferentes e podem discordar, e deduzir a dispensa do `ativo` daria sete respostas
// erradas.
conf(/ehDispensado\(/.test(bloco), 'quem responde "esta dispensado?" e a ehDispensado que ja existia');
conf(!/const trfDispensado/.test(semComent), 'e a tela NAO fez uma segunda copia dela');
conf(/function ehDispensado\(u\) \{ return !!\(u && u\.data_saida\)/.test(semComent),
     'e ela le data_saida, nao ativo');

S('5. A FAIXA DA DISPENSA');
// Grupo, data de saida e portaria — em cinza, abaixo do seletor. So aparece quando o
// escolhido e um dispensado.
conf(/id="trfDispensa"/.test(bloco), 'ha o lugar da faixa');
conf(/Grupo \$\{escHtml\(String\(u\.grupo/.test(bloco), 'ela diz o grupo');
conf(/saiu em \$\{escHtml\(dataBr\(u\.data_saida\)\)\}/.test(bloco), 'a data de saida');
conf(/Portaria \$\{escHtml\(String\(u\.portaria/.test(bloco), 'e a portaria');
conf(/\(u && ehDispensado\(u\)\)[\s\S]{0,40}\?/.test(bloco), 'e so aparece para dispensado');
{
  // ⚠️ O RECORTE E A FUNCAO, e nao uma janela de N caracteres a partir do id: o id aparece
  // primeiro no template da tela e so depois em quem o preenche. Uma janela curta mede o
  // bloco errado e passa — ou reprova — por acidente.
  const deMudou = bloco.slice(bloco.indexOf('function trfDeMudou'), bloco.indexOf('async function trfCarregarTrs'));
  conf(/color:var\(--ct\)/.test(deMudou), 'em cinza');
}

S('6. A LISTA VEM DE ROTA QUE JA EXISTE');
// ⚠️ NENHUMA ROTA NOVA PARA LER. O `resumo_tr` devolve uma linha por TR com `total_pcs` e
// `baixadas`; as ABERTAS sao a diferenca.
conf(/prestacoes_contas\/resumo_tr/.test(bloco), 'a lista sai do resumo_tr');
conf(/\(Number\(t\.total_pcs\) \|\| 0\) - \(Number\(t\.baixadas\) \|\| 0\)/.test(bloco),
     'e as abertas sao total_pcs menos baixadas');
// ⚠️ TR SEM PC ABERTA NAO ENTRA: nao ha o que transferir nela, e uma linha "0 PCs" convidaria
// a marca-la para nada.
conf(/\.filter\(t => t\.abertas > 0\)/.test(bloco), 'TR sem PC aberta nao entra na lista');

S('7. O CABECALHO E AS LINHAS');
conf(/id="trfTodas"/.test(bloco), 'ha a caixa de marcar todas');
conf(/PCs abertas'\}\s*em/.test(bloco) || /PC aberta' : 'PCs abertas'/.test(bloco),
     'o cabecalho diz N PCs abertas em N TRs');
conf(/'selecionada' : 'selecionadas'/.test(bloco), 'e a direita, quantas estao selecionadas');
conf(/onchange="trfMarcar\('/.test(bloco), 'cada TR tem a sua caixa');
conf(/t\.entidade/.test(bloco), 'a linha traz a entidade');
// ⚠️ NA LINHA E SO "N abertas": em 92px o "2 PCs abertas" quebrava em duas e desalinhava as
// vizinhas. A unidade fica dita UMA vez, no cabecalho da lista, em cima de todas — repeti-la
// em cada linha e a palavra ocupando o lugar do numero.
conf(/\$\{t\.abertas\} \$\{t\.abertas === 1 \? 'aberta' : 'abertas'\}/.test(bloco),
     'e quantas abertas ela tem, sem repetir "PCs"');
// ⚠️ E O nowrap E O QUE FECHA O CASO, nao a largura: com flex:0 0 a celula nao estica, entao
// so encurtar o texto torna a quebra improvavel — nao impossivel.
conf(/flex:0 0 84px;text-align:right;white-space:nowrap/.test(bloco),
     'e a celula nao pode quebrar de jeito nenhum');
// ⚠️ A LISTA ROLA A PARTIR DE ~5 TRs: quem transfere um dispensado pega dezenas delas, e sem
// teto os botoes do rodape sairiam da tela — a pessoa marcaria sem ver o que vai mover.
conf(/max-height:230px;overflow-y:auto/.test(bloco), 'e a lista rola depois de umas 5 TRs');

S('8. A CONTA DA SELECAO, NUM LUGAR SO');
// ⚠️ O CABECALHO E O BOTAO LEEM DA MESMA FUNCAO. Duas contas divergiriam no primeiro ajuste,
// e o botao prometeria um numero que a lista nao mostra.
conf(/function trfPcsSelecionadas\(\)/.test(bloco), 'ha UMA funcao que conta as PCs selecionadas');
conf((bloco.match(/trfPcsSelecionadas\(\)/g) || []).length >= 3,
     'e o cabecalho e o botao leem dela', (bloco.match(/trfPcsSelecionadas\(\)/g) || []).length);

S('9. O BOTAO CINZA, E O MOTIVO AO LADO');
// ⚠️ NESTA RODADA ELE NAO GRAVA — a rota nao existe. Mas a CONTA continua viva: o numero
// acompanha a selecao, e o motivo muda conforme o que falta.
conf(/Transferir \$\{n\} \$\{n === 1 \? 'PC' : 'PCs'\}/.test(bloco), 'o numero acompanha a selecao');
conf(/Escolha para quem transferir\./.test(bloco), 'sem "Para", o motivo diz isso');
conf(/Marque ao menos uma TR\./.test(bloco), 'sem TR marcada, diz isso');
conf(/A gravação ainda não existe/.test(bloco), 'e com os dois prontos, diz que a rota nao existe');
// ⚠️ CINZA E SEM `onclick`, nao so com `disabled`: um clique rapido ainda dispararia se o
// atributo fosse tirado pelo devtools. E o mesmo padrao do Assumir com reserva pendente.
conf(/<button class="btn-acao" disabled title=/.test(bloco), 'o botao nasce desabilitado');
conf(!/Transferir[\s\S]{0,200}?onclick=/.test(bloco), 'e sem onclick nenhum — nada nesta tela grava');
conf(/cursor:not-allowed/.test(bloco), 'com o cursor de bloqueado');
conf(/margin-left:9px/.test(bloco), 'e o motivo escrito AO LADO, nao so no title');
conf(/onclick="trfCancelar\(\)"/.test(bloco), 'e ha o Cancelar');

S('10. NADA NESTA TELA ESCREVE');
// ⚠️ A RODADA E SO O DESENHO. Um POST/PATCH aqui seria a rota nascendo por acidente.
conf(!/method:\s*'(POST|PATCH|PUT|DELETE)'/.test(bloco), 'nenhum POST, PATCH, PUT ou DELETE');
conf((bloco.match(/fetch\(/g) || []).length === 2,
     'so duas leituras: os usuarios e o resumo_tr', (bloco.match(/fetch\(/g) || []).length);

S('11. O ROTULO QUE FALTAVA NOS DOIS MAPAS');
// ⚠️ `transferencia_dispensa` NAO TINHA ROTULO, e as 32 linhas da transferencia do Samoel
// (28/08/2026) apareciam como o CODIGO CRU na tela do analista. Achado ao desenhar esta tela.
// Sao DUAS copias do mapa, e o rotulo tinha de entrar nas duas.
conf((semComent.match(/transferencia_dispensa:'👥 PC transferida'/g) || []).length === 2,
     'o rotulo entrou nas DUAS copias do mapa de eventos',
     (semComent.match(/transferencia_dispensa:'/g) || []).length);
conf(/const AC_EV_LABEL = \{[\s\S]{0,900}?transferencia_dispensa:/.test(semComent),
     'no AC_EV_LABEL');
conf(/const evLabel = \{[\s\S]{0,900}?transferencia_dispensa:/.test(semComent),
     'e no evLabel do ver parecer');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
