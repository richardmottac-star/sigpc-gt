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

S('9. O BOTAO, E O MOTIVO AO LADO QUANDO ELE ESTA CINZA');
// ⚠️ A ROTA SUBIU EM 01/09/2026 e o motivo "a gravacao ainda nao existe" saiu junto. O que
// fica sao os DOIS motivos reais de o botao estar cinza.
conf(/Transferir \$\{n\} \$\{n === 1 \? 'PC' : 'PCs'\}/.test(bloco), 'o numero acompanha a selecao');
conf(/Escolha para quem transferir\./.test(bloco), 'sem "Para", o motivo diz isso');
conf(/Marque ao menos uma TR\./.test(bloco), 'sem TR marcada, diz isso');
conf(!/A gravação ainda não existe/.test(bloco), 'e o motivo da rota inexistente SAIU');
// ⚠️ CINZA SEM `onclick`, e a versao habilitada e OUTRO elemento. So `disabled` ainda
// dispararia se o atributo fosse tirado pelo devtools — e o Assumir com reserva pendente
// segue o mesmo padrao.
conf(/<button class="btn-acao" disabled title=/.test(bloco), 'o cinza nasce desabilitado');
conf(/cursor:not-allowed/.test(bloco), 'com o cursor de bloqueado');
conf(/margin-left:9px/.test(bloco), 'e o motivo escrito AO LADO, nao so no title');
conf(/if\(motivo\) \{[\s\S]{0,400}?return\s*\n\s*\}/.test(bloco),
     'e o caminho cinza sai antes — o botao com onclick e outro elemento');
conf(/onclick="trfCancelar\(\)"/.test(bloco), 'e ha o Cancelar');

S('9b. O BOTAO LIGADO NA ROTA');
conf(/onclick="trfConfirmar\(\)"/.test(bloco), 'com "Para" e TR marcada, o botao chama a gravacao');
conf(/fetch\(`\$\{API_URL\}\/transferencia`/.test(bloco), 'e ela vai para POST /transferencia');
conf(/method: 'POST'/.test(bloco), 'por POST');
conf(/de_id: deId, para_id: paraId, trs/.test(bloco), 'mandando de_id, para_id e as TRs marcadas');
conf(/usuario_id: U\.id/.test(bloco), 'e o usuario_id — e por ele que o servidor le o perfil no BANCO');
// ⚠️ SO AS TRs MARCADAS VAO, e nao a lista inteira: a selecao e o que a pessoa conferiu.
conf(/_trfTrs\.filter\(t => _trfSel\.has\(t\.tr\)\)\.map\(t => t\.tr\)/.test(bloco),
     'so as TRs marcadas entram no corpo');
// ⚠️ A PERGUNTA ANTES: a transferencia e reversivel (o estado_anterior guarda a foto), mas
// desfazer hoje e script, nao botao. Por isso a confirmacao traz os numeros.
conf(/await moConfirm\(/.test(bloco), 'ha confirmacao antes de gravar');
conf(/As PCs já baixadas não são transferidas/.test(bloco.slice(bloco.indexOf('moConfirm'))),
     'e ela repete a regra do que fica');
// ⚠️ RECARREGA DEPOIS: aquelas TRs nao sao mais do "De", e deixar a lista de pe convidaria a
// clicar de novo sobre um estado que ja mudou.
conf(/_trfSel = new Set\(\)\s*\n\s*trfDeMudou\(\)/.test(bloco), 'e a lista se refaz depois de gravar');
conf(/bt\.textContent = 'Transferindo\.\.\.'/.test(bloco), 'o botao avisa enquanto grava');

S('10. A TELA ESCREVE POR UM CAMINHO SO');
// ⚠️ ATE 31/08 ESTA SECAO EXIGIA QUE NADA ESCREVESSE — a rota nao existia. Agora ela existe,
// e o que se guarda mudou de "nao escreve" para "escreve por UM caminho, e so por ele".
const escritas = bloco.match(/method: '(POST|PATCH|PUT|DELETE)'/g) || [];
conf(escritas.length === 1, 'ha UMA escrita nesta tela', escritas.join(', '));
conf(escritas[0] === "method: 'POST'", 'e ela e um POST');
const urls = bloco.match(/fetch\(`\$\{API_URL\}[^`]*`/g) || [];
conf(urls.length === 3, 'tres chamadas ao servidor: usuarios, resumo_tr e a transferencia',
     urls.length);
// ⚠️ AS DUAS LEITURAS NAO PODEM VIRAR ESCRITA por descuido: um `method` no fetch dos usuarios
// ou do resumo_tr passaria despercebido, porque as duas rotas respondem a GET e a POST no
// Express so se declaradas — mas o erro apareceria como 404, tarde demais.
const leitura = bloco.slice(0, bloco.indexOf('async function trfConfirmar'));
conf(!/method:/.test(leitura), 'e nada antes da confirmacao manda method — as duas sao GET');
conf(/\/transferencia`/.test(bloco), 'a escrita vai para /transferencia');
conf(!/\/prestacoes_contas\/[^`]*`,\s*\{/.test(bloco), 'e nao ha PATCH direto em prestacoes_contas');

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
