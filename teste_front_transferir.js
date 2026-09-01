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

S('10. A TELA ESCREVE POR DOIS CAMINHOS, E SO POR ELES');
// ⚠️ ESTA SECAO JA MUDOU DE SENTIDO DUAS VEZES, e o registro importa: em 31/08 ela exigia que
// a tela NAO escrevesse (a rota nao existia); em 01/09 passou a exigir UMA escrita; e agora
// sao DUAS — transferir e desfazer. O que ela guarda e sempre o mesmo: que nao aparece uma
// terceira sem ninguem notar.
const escritas = bloco.match(/method: '(POST|PATCH|PUT|DELETE)'/g) || [];
conf(escritas.length === 2, 'ha DUAS escritas nesta tela', escritas.join(', '));
conf(escritas.every((e) => e === "method: 'POST'"), 'e as duas sao POST');
const alvos = bloco.match(/fetch\(`\$\{API_URL\}\/[a-z_/]+/g) || [];
conf(alvos.some((a) => a.endsWith('/transferencia')), 'uma vai para /transferencia');
conf(alvos.some((a) => a.includes('/transferencias/')), 'e a outra para /transferencias/:id/desfazer');
// ⚠️ E NENHUMA ESCREVE DIRETO EM prestacoes_contas: mover PC por PATCH da tela contornaria a
// transacao, a foto e as conferencias da rota — seria transferir sem tudo-ou-nada.
conf(!/\/prestacoes_contas[^`]*`,\s*\{[\s\S]{0,80}method/.test(bloco),
     'e nenhuma escreve direto em prestacoes_contas');
// ⚠️ AS QUATRO LEITURAS SAO GET, e a checagem e por CHAMADA e nao por bloco: a aba Historico
// entrou entre a lista e a confirmacao, entao "o que vem antes" deixou de ser so leitura.
// Medir por posicao no arquivo e fragil — a ordem muda a cada tela nova.
for (const alvo of ['/usuarios`', '/resumo_tr', '/transferencias?usuario_id', '/transferencias/${id}?usuario_id']) {
  const i = bloco.indexOf(alvo);
  const trecho = i < 0 ? '' : bloco.slice(i, i + 120);
  conf(i > 0 && !/method:/.test(trecho), `a leitura ${alvo} vai por GET`);
}

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


S('16. AS DUAS ABAS');
// ⚠️ ELAS DIVIDEM A MESMA TELA porque respondem a mesma pergunta em tempos diferentes: "para
// quem mando" e "o que ja mandei". Dois itens de menu fariam procurar num lugar o que se
// acabou de fazer no outro.
conf(/trfAbaBtn\('nova', 'Nova transferência'\)/.test(bloco), 'ha a aba Nova transferencia');
conf(/trfAbaBtn\('hist', 'Histórico'\)/.test(bloco), 'e a aba Historico');
conf(/_trfAba === 'hist' \? trfHistHtml\(\)/.test(bloco), 'e a tela troca de corpo conforme a aba');

S('17. O HISTORICO');
conf(/\/transferencias\?usuario_id/.test(bloco), 'a lista sai de GET /transferencias');
conf(/id="trfHQ"/.test(bloco) && /id="trfHGrupo"/.test(bloco), 'ha filtro por analista/TR e por grupo');
conf(/id="trfHDe"/.test(bloco) && /id="trfHAte"/.test(bloco), 'e por periodo');
conf(/id="trfHTotais"/.test(bloco), 'e os totais ficam a direita');
// ⚠️ OS TOTAIS SAO DO RECORTE, e nao do acervo: e o que a pessoa esta olhando.
conf(/const lista = trfHistFiltrada\(\)[\s\S]{0,300}?repasses/.test(bloco),
     'e contam o recorte, nao a lista inteira');
// ⚠️ O GRUPO E O DE QUALQUER UMA DAS DUAS PONTAS: um repasse entre grupos aparece nos dois.
conf(/grupoDe\(r\.de && r\.de\.id\) !== g && grupoDe\(r\.para && r\.para\.id\) !== g/.test(bloco),
     'o filtro de grupo olha as DUAS pontas');
for (const col of ['Quando', 'De → Para', 'TRs', 'PCs', 'Executado por', 'Termo']) {
  conf(bloco.includes(`th('${col}'`) || bloco.includes(`th('${col}',`), `a coluna ${col} existe`);
}
conf(/onclick="trfDetalhe\(\$\{r\.id\}\)"/.test(bloco), 'clicar na linha abre o detalhe');

S('18. O TERMO');
// ⚠️ "sem termo" NAO E UM LINK MORTO. Os repasses anteriores a esta rota vieram de um script
// que nao gerou termo nenhum; oferecer um botao que fabricaria o documento agora seria
// produzir papel com data retroativa.
conf(/r\.tem_termo/.test(bloco), 'o termo depende do tem_termo que a rota devolve');
conf(/sem termo/.test(bloco), 'e o repasse antigo mostra "sem termo"');
conf(/application\/msword/.test(bloco), 'o termo e gerado na hora, como os relatorios da CGE');

S('18b. O TERMO NO PADRAO DA BUSCA GLOBAL (01/09/2026)');
const termo = semComent.slice(semComent.indexOf('function trfMontarTermo'),
                              semComent.indexOf('function docScriptTermo'));
conf(!!termo, 'ha a funcao que monta o termo');
// ⚠️ MESMA FOLHA TIMBRADA, e nao uma parecida: DOC_CSS, DOC_CABECALHO e DOC_ACOES sao os do
// documento da Busca global. Uma segunda copia divergiria no primeiro ajuste, e um termo com
// o cabecalho de uma versao anterior so se descobre depois de assinado.
conf(/<style>\$\{DOC_CSS\}/.test(termo), 'usa o CSS compartilhado');
conf(/\$\{docCabecalho\(\)\}/.test(termo), 'e o cabecalho compartilhado — brasao e os quatro titulos');
// ⚠️ E O CABECALHO E FUNCAO, nao constante: como constante ele interpolaria o base64 do brasao
// na CARGA do arquivo, dependendo da ordem de declaracao. Duas suites quebraram assim em
// 01/09 — elas rodam pedacos do index.html num vm onde o LOGO_SC nao existe.
conf(/function docCabecalho\(\)/.test(semComent), 'o cabecalho e funcao, avaliada so ao montar');
conf(!/const DOC_CABECALHO/.test(semComent), 'e nao uma constante avaliada na carga');
conf(/\$\{DOC_ACOES\}/.test(termo), 'e os dois botoes do topo');
conf(!/ESTADO DE SANTA CATARINA/.test(termo), 'e NAO tem uma copia do brasao');
conf(/Termo de repasse de prestações de contas/.test(termo), 'o titulo e TERMO DE REPASSE');

S('18c. A IDENTIFICACAO E O TEXTO');
conf(/Analista de origem:/.test(termo) && /Analista de destino:/.test(termo), 'as duas pontas');
// ⚠️ "dispensado em" VIROU "dispensa em" em 01/09/2026. O participio concorda com a pessoa, e
// o termo e emitido para o quadro inteiro — mesma correcao que tirou "o analista Fabiana
// Vieira" e "produtividade a ele" do corpo do documento.
conf(/dispensa em/.test(termo), 'com a dispensa da origem quando houver');
conf(!/dispensado em/.test(termo), 'e sem participio que dependa de genero');
conf(/Repasse registrado no sistema em:/.test(termo) && /Técnico do Sistema/.test(termo),
     'quando foi registrado e quem executou');
conf(/Portaria FCEE nº 285\/2025 · Processo CGE nº 727\/2025 · Decreto nº 1\.008\/2025/.test(termo),
     'e o fundamento completo');
// ⚠️ A VIGENCIA MUDOU DE FONTE em 01/09/2026, e a conferencia mudou junto. Ela lia
// `d.portaria_destino_em`, que vem da tabela `substituicao` e guarda a portaria da DISPENSA da
// ORIGEM — o numero costuma coincidir, e por isso o erro nao aparecia. Agora sai do CADASTRO do
// destino: campos PORTARIA e DATA DE INGRESSO NO GT.
conf(/const vigencia = trfDataBr\(uPara && uPara\.data_ingresso\)/.test(termo),
     'a vigencia e a data de ingresso do DESTINO, lida do cadastro');
conf(/const portariaPara = \(uPara && uPara\.portaria\)/.test(termo),
     'e a portaria tambem vem do cadastro do destino');
conf(!/d\.portaria_destino/.test(termo),
     'e a portaria da substituicao NAO e mais usada no termo');
conf(/A partir de \$\{escHtml\(vigencia\)\}/.test(termo), 'e abre o texto');
// ⚠️ O TEXTO PERDEU O GENERO em 01/09/2026. Ele dizia "o analista Fabiana Vieira" e
// "produtividade a ele" — dois desacordos num documento assinado. A saida nao foi "o(a)
// analista" nem "a pessoa analista": foi escrever a frase de um jeito em que a concordancia
// nao aparece — o nome sozinho como sujeito, e "em seu nome" no lugar do pronome.
conf(/a produtividade delas não é alterada por este repasse/.test(termo),
     'o texto diz que a baixada fica');
// ⚠️ O RECORTE ACEITA A QUEBRA DE LINHA. A frase vive num template literal indentado, e o
// texto do documento quebra onde o codigo quebra — casar a frase inteira numa linha so
// reprovaria por causa da indentacao, nao do que o termo diz.
conf(/passarão a gerar produtividade em seu nome na medida\s+em que forem baixadas no SIGEF/.test(termo),
     'e que a repassada passa a gerar para o destino');
conf(!/produtividade a ele/.test(termo) && !/o analista \$\{escHtml\(nomePara\)\}/.test(termo),
     'e nao sobrou concordancia de genero no corpo');
// ⚠️ SEM VIGENCIA O TERMO NAO SAI. Um termo que nao diz de quando vale nao afirma nada — e
// desde 01/09 a RECUSA DIZ QUAL CAMPO FALTA, porque quem le "nao pode ser emitido" sem saber o
// que preencher fica parado no mesmo lugar.
conf(/uParaCad\.portaria \? null : 'a portaria'/.test(bloco), 'sem portaria o termo e recusado');
conf(/uParaCad\.data_ingresso \? null : 'a data de ingresso no GT'/.test(bloco),
     'e sem a data de ingresso, tambem');
conf(/faltaCad\.join\(' nem '\)/.test(bloco), 'e a recusa nomeia o campo que falta');

S('18d. OS CONTADORES E O BLOCO POR TR');
for (const c of ['TRs', 'PCs no total', 'repassadas', 'baixadas que permanecem', 'prazos vencidos']) {
  conf(termo.includes(c), `o contador "${c}"`);
}
conf(/const blocos = cards\.map/.test(termo), 'ha um bloco por TR');
conf(/CNPJ/.test(termo) && /Processo SGPe \(mãe\)/.test(termo), 'com CNPJ e processo mae');
for (const col of ['Parcial', 'Código da PC', 'NL', 'Situação', 'Parecer', 'Repasse']) {
  conf(termo.includes('>' + col + '<'), `a coluna ${col}`);
}
// ⚠️ A COLUNA REPASSE TRAZ O NOME, e nao "sim/nao": quem le o termo quer saber COM QUEM cada
// prestacao fica, e e essa a pergunta que o documento existe para responder.
conf(/const fica = foiRepassada \? nomePara : \(pc\.baixada \? nomeDe : '—'\)/.test(termo),
     'a coluna Repasse traz o NOME de quem fica com cada PC');
conf(/class="trepasse"/.test(termo), 'a linha repassada leva fundo amarelo');
conf(/\.trepasse td\{background:#FFF8E1/.test(semComent), 'e a cor esta no CSS do documento');
conf(/BG_CI\[p\.ci\.situacao\]/.test(termo), 'a secao do C.I. e a mesma da Busca global');
// ⚠️ A FAIXA VERMELHA JUNTA OS TRES MOTIVOS NUMA LINHA SO: tres faixas empilhadas na mesma TR
// fariam o documento parecer um erro.
conf(/prazo vencido há/.test(termo) && /prestação no Controle Interno/.test(termo)
     && /processo arquivado com prestação em aberto/.test(termo),
     'a faixa de atencao cobre os tres casos');
conf(/class="aviso"/.test(termo), 'numa faixa vermelha');

S('18e. A LEGENDA E AS ASSINATURAS');
// ⚠️ A LEGENDA VEM ANTES DA PRIMEIRA TABELA: a coluna Repasse traz dois nomes, e sem dizer o
// que cada um significa ela se le como "de quem era" — o contrario do que e.
conf(termo.indexOf('class="legenda"') < termo.indexOf('${blocos}'), 'a legenda vem antes das tabelas');
conf(/Coluna Repasse:/.test(termo), 'ela explica a coluna');
conf(/As linhas em amarelo são as repassadas/.test(termo), 'e o amarelo');
conf(/Analista de destino, Grupo/.test(termo) && /Coordenador do Grupo/.test(termo)
     && /Técnico do Sistema, SIGPC-GT/.test(termo), 'as tres assinaturas, nomeadas');
// ⚠️ O COORDENADOR SAIA SEMPRE COMO TRAVESSAO ate 01/09/2026, e a conferencia nao pegava: o
// termo procurava `perfil === 'coordenador'` dentro de `_trfUsuarios`, que e filtrada por
// `trfEhAnalista` — so `perfil === 'analista'` entra nela, e o `find` procurava alguem que ja
// tinha sido removido da lista. Agora ha `_trfCoords`, montada na MESMA resposta de
// `GET /usuarios`, e uma funcao unica que le pelo grupo do destino.
conf(/const coord = trfCoordDoGrupo\(grupo\)/.test(termo),
     'e o coordenador sai do grupo do destino');
conf(/function trfCoordDoGrupo\(grupo\)/.test(html), 'por uma funcao unica');
conf(/_trfCoords\.filter\(x => String\(x\.grupo\) === String\(grupo\) && !ehDispensado\(x\)\)/.test(html),
     'que le a lista propria dos coordenadores, e descarta o dispensado');
conf(/_trfCoords = \(j\.data \|\| \[\]\)\.filter\(u => u && u\.perfil === 'coordenador'\)/.test(html),
     'montada na MESMA resposta de GET /usuarios, sem segunda chamada');
// ⚠️ E O NOME E O COMPLETO, de `usuarios.nome`. O `COORD_GRUPO` do arquivo guarda o apelido do
// rotulo do seletor ("Grupo 3 — Gustavo"), que serve para escolher numa lista e nao para
// assinar um documento.
conf(!/COORD_GRUPO/.test(termo), 'e o termo NAO usa o apelido do rotulo do grupo');
conf(/Emitido por/.test(termo) && /SIGPC-GT/.test(termo), 'o rodape traz quem emitiu');

S('18f. OS DADOS DE CADA TR VEM DA BUSCA GLOBAL');
// ⚠️ ELA E A UNICA ROTA QUE DEVOLVE O CARD INTEIRO, e e o card que o termo reproduz. Montar
// uma segunda consulta com os mesmos campos seria duas fontes para o mesmo documento.
conf(/busca_global\?tr=\$\{encodeURIComponent\(tr\)\}/.test(bloco), 'uma chamada por TR');
conf(/Promise\.all\(trs\.map/.test(bloco), 'as chamadas vao juntas, nao uma de cada vez');

S('18g. A PORTARIA DO DESTINO NA TELA');
// ⚠️ A `substituicao` RESPONDE PRIMEIRO. Pedir sempre faria digitar o que o banco ja sabe;
// nunca pedir faria o repasse ser recusado sem a pessoa poder resolver.
conf(/function trfPortariaDe\(paraId\)/.test(bloco), 'a tela sabe quando o banco ja tem a portaria');
conf(/\/substituicao/.test(bloco), 'lendo da substituicao');
conf(/id="trfPortariaBox"/.test(bloco), 'ha a caixa dos dois campos');
conf(/box\.style\.display = \(paraId && !tem\) \? '' : 'none'/.test(bloco),
     'e ela so aparece quando FALTA');
conf(/id="trfPortaria"/.test(bloco) && /id="trfPortariaEm"/.test(bloco), 'o numero e a data');
conf(/faltaPortaria \? 'Informe o número e a data de publicação da portaria\.'/.test(bloco),
     'e sem eles o botao fica cinza com o motivo');

S('19. O DESFAZER');
// ⚠️ A CONFIRMACAO E MODAL, E NAO JANELA FLUTUANTE — ordem do Richard: desfazer move o acervo
// de volta ao estoque e nao tem botao de refazer. Travar a tela e o que a confirmacao existe
// para fazer; as janelas flutuantes sao as de CONSULTA.
conf(/await moConfirm\([\s\S]{0,400}?perigo: true/.test(bloco), 'pede confirmacao em modal, com o tom de perigo');
conf(/voltam ao ESTOQUE e ficam livres para qualquer analista do grupo/.test(bloco),
     'dizendo que as TRs voltam ao estoque e ficam livres');
conf(/desfazer`, \{/.test(bloco) || /\/desfazer`/.test(bloco), 'e chama a rota do desfazer');
// ⚠️ A RECUSA POR MOVIMENTACAO POSTERIOR VEM COM A LISTA, e e ela que a pessoa precisa ver:
// "3 PCs impediram" sem dizer quais obriga a procurar no escuro.
conf(/pcs_impedidas/.test(bloco), 'a recusa traz a lista de PCs que impediram');
conf(/function trfImpedidas/.test(bloco), 'e ela e mostrada na tela');
// ⚠️ NA TELA, E NAO NUM TOAST: o toast some, e a lista e o que se precisa ler com calma.
conf(/insertAdjacentHTML\('afterbegin'/.test(bloco), 'na propria tela, nao num toast que some');

S('20. A PILULA DO ESTOQUE');
// ⚠️ A MARCA E DERIVADA, NAO GRAVADA — decisao do Richard. Nao ha coluna veio_de_dispensado, e
// nao pode haver: ela mudaria sozinha a cada desfazer e ficaria mentindo ate alguem rodar um
// script. E o mesmo motivo pelo qual nao existe sigef_tag.
conf(/EST_DEVOLVIDAS/.test(semComent), 'ha o mapa das TRs devolvidas');
conf(/\/transferencias\/devolvidas/.test(semComent), 'lido da rota que deriva do historico');
conf(/estDevolvidasCarregar\(\),/.test(semComent), 'e carregado junto com as reservas');
// ⚠️ NO MESMO Promise.all: as duas pintam a MESMA linha, e carregar uma depois da outra faria
// a lista aparecer e depois ganhar a pilula — um pisca que se le como se a tela tivesse
// mudado de ideia.
conf(/Promise\.all\(\[[\s\S]{0,400}?estDevolvidasCarregar\(\)/.test(semComent),
     'no MESMO Promise.all das reservas');
conf(/\.est-disp\{[^}]*background:#EF9F27[^}]*color:#412402/.test(semComent),
     'a pilula tem fundo #EF9F27 e texto #412402');
conf(/\.est-linha-disp > td\{background:#FAEEDA/.test(semComent), 'a faixa da linha e #FAEEDA');
conf(/\.est-linha-disp > td:first-child\{border-left:4px solid #EF9F27/.test(semComent),
     'e a barra de 4px na borda esquerda');
// ⚠️ AO LADO DO "Livre", E NAO NO LUGAR DELE: a TR devolvida E livre, e trocar o rotulo faria
// a pessoa achar que ela nao pode ser assumida.
conf(/\$\{infoSt\.label\}<\/span>\$\{estPilulaDispensado\(t\.tr\)\}/.test(semComent),
     'a pilula fica AO LADO do Livre, nao no lugar dele');
// O balao: de quem veio, a portaria, quando voltou, e o que fica.
conf(/Veio de \$\{d\.de_nome/.test(semComent), 'o balao diz de quem veio');
conf(/Portaria \$\{d\.portaria\}/.test(semComent), 'a portaria');
conf(/Voltou ao estoque em/.test(semComent), 'quando voltou ao estoque');
conf(/As PCs já baixadas continuam com quem as analisou/.test(semComent), 'e que as baixadas ficam');


S('O AVISO DE REPASSE NO SINO (01/09/2026)');
{
  // ⚠️ O DESTAQUE SAI DO MECANISMO QUE JA EXISTE. O servidor grava o aviso com urgente:true, e
  // o ORDER BY do notificacao.listar ja o poe no TOPO — aqui so se escolhe a COR da barra.
  conf(/const NOTIF_ICO = \{[^}]*repasse:/.test(html), "'repasse' tem icone proprio no sino");
  conf(/const NOTIF_BARRA = \{ repasse: 'var\(--v\)' \}/.test(html),
       'e a barra da borda esquerda dele e a VERDE, nao a vermelha do alarme');
  conf(/border-left:3px solid '\+notifBarra\(n\)\+';/.test(html),
       'a linha do sino usa a cor por tipo, e nao a vermelha fixa');

  // ⚠️ QUEM DECIDE OS BOTOES E O ref_tipo, gravado pelo servidor — nunca o texto do titulo.
  conf(/repasse: +\['planilha', 'termo'\]/.test(html),
       'o aviso do analista de destino tem DOIS botoes');
  conf(/repasse_coord: +\['termo'\]/.test(html),
       'e o da coordenacao tem UM — o acervo nao e dela');
  // ⚠️ A ORIGEM NAO TEM "VER NA MINHA PLANILHA", e a ausencia e o recado: as PCs sairam
  // justamente de la. Um botao que a levasse a planilha para nao encontrar nada seria pior
  // que botao nenhum.
  conf(/repasse_origem: +\['termo'\]/.test(html),
       'e o da origem tambem tem UM — as PCs sairam da planilha dela');
  conf(/Ver na minha planilha/.test(html) && /Abrir o termo de repasse/.test(html),
       'e os dois textos sao os que o Richard pediu');

  // ⚠️ SEM O stopPropagation, clicar num botao dispararia TAMBEM o sinoClicar da linha, que
  // navega para o termo — a pessoa apertaria um botao e chegaria no outro lugar.
  const iB = html.indexOf('function notifBotoes(n)');
  const bot = html.slice(iB, html.indexOf('async function notifAgir', iB));
  conf(/event\.stopPropagation\(\)/.test(bot), 'os botoes param o clique da linha');
  // ⚠️ SEM O ID NO LINK NAO HA BOTAO DE TERMO: um botao que abre um repasse que nao se sabe
  // qual e seria o clique aceito que nao responde (armadilha 12).
  conf(/quais\.includes\('termo'\) && id/.test(bot), 'sem o id no link, o botao do termo nao sai');
  conf(/return ''/.test(bot), 'e num aviso que nao e de repasse nao ha barra de botoes');

  // O link carrega o id do repasse, e a LINHA tambem leva ao termo — clique aceito que nao vai
  // a lugar nenhum e a armadilha 15.
  conf(/\^#repasse:\(\\d\+\)\$/.test(html), 'o link do aviso e #repasse:{id}');
  const iS = html.indexOf('async function sinoClicar');
  conf(/else if\(repId\) +trfTermo\(repId\)/.test(html.slice(iS, iS + 1400)),
       'e o clique na linha abre o termo');

  // ⚠️ trfTermo PASSOU A SER CHAMADA DE FORA DA TELA DE TRANSFERENCIA: vinda do sino, a
  // irTransferir nunca rodou e _trfUsuarios esta VAZIA. Sem a carga, o termo recusaria com
  // "nao encontrei o cadastro do analista de destino" — verdade sobre a lista, mentira sobre
  // o banco.
  const iT = html.indexOf('async function trfTermo(id)');
  conf(/if\(!_trfUsuarios\.length\) await trfCarregarUsuarios\(\)/.test(html.slice(iT, iT + 1600)),
       'a trfTermo carrega os usuarios quando vem de fora da tela');
  // ⚠️ E O repasse_id ABRE O CAMINHO RESTRITO da busca global: sem ele, o botao do sino daria
  // 403 no analista e no coordenador.
  conf(/busca_global\?tr=\$\{encodeURIComponent\(tr\)\}&repasse_id=\$\{id\}/.test(html),
       'e manda o repasse_id na busca global, que e o que abre a porta para as pontas');
}

S('A CIENCIA DO REPASSE — O MODAL DE ENTRADA (01/09/2026)');
{
  // ⚠️ MODAL COMUM, TRAVANDO A TELA — e nao a janela flutuante de 31/08. Aquelas sao de
  // CONSULTA E TRABALHO e existem para a pessoa continuar mexendo na tela atras; ciencia e o
  // contrario: e a unica coisa a fazer naquele instante.
  conf(/<div class="mo" id="moCiencia">/.test(html), 'o modal e .mo, o que trava a tela');
  const iMk = html.indexOf('<div class="mo" id="moCiencia">');
  const mk = html.slice(iMk, html.indexOf('</div>\n\n<div class="mo" id="moNovImg">', iMk) + 40);
  conf(!/class="jf"|jfAbrir|id="moCiencia" class="jf"/.test(mk), 'e nao e janela flutuante');
  // ⚠️ SEM ✕ NO CABECALHO, de proposito: as duas saidas sao botoes escritos, e "Ver depois"
  // diz o que faz. Um ✕ ao lado seria uma terceira porta sem rotulo.
  conf(!/class="mcx"/.test(mk), 'e nao ha ✕ no cabecalho — as saidas sao botoes escritos');

  // ⚠️ QUEM DIZ O QUE FALTA E O SERVIDOR. A tela nao deduz "esta pessoa deve ciencia".
  const iIni = html.indexOf('async function cieInicial');
  const ini = html.slice(iIni, html.indexOf('function cieAbrir', iIni));
  conf(/transferencias\/ciencia_pendente\?usuario_id=/.test(ini),
       'a fila vem do servidor, e a tela nao deduz quem deve');
  // ⚠️ NAO ABRE NO MODO "AGIR PELA CONTA DE OUTRO": o modal fala na PRIMEIRA PESSOA, e quem
  // esta lendo nao e quem assume. A guarda de verdade e do servidor, que recusa a gravacao.
  conf(/if\(verComoAtivo\(\)\) return/.test(ini), 'e nao abre no modo "agir pela conta de"');
  conf(ini.indexOf('verComoAtivo()') < ini.indexOf('ciencia_pendente'),
       'e a guarda vem ANTES de pedir a lista');
  conf(/_cieMostrado/.test(ini), 'abre uma vez por sessao, como o aviso de Novidades');
  // ⚠️ O RECORTE NAO PODE DEPENDER DO TERMINADOR DE LINHA: o index.html esta em CRLF, e casar
  // por '...()\n' devolvia -1 aqui, com a janela saindo vazia e a conferencia falhando por
  // defeito do teste. E a armadilha 25 do sigpc-api noutra roupa.
  const iLogin = html.indexOf('  novAvisoInicial()');
  conf(iLogin > 0 && /cieInicial\(\)/.test(html.slice(iLogin, iLogin + 600)),
       'e e chamado ao entrar no sistema');

  // ── os dois textos, e a diferenca e de QUEM FALA
  const iR = html.indexOf('function cieRender(r)');
  const rd = html.slice(iR, html.indexOf('function cieBotao', iR));
  conf(/Você recebeu \$\{r\.pcs\}/.test(rd), 'o titulo do analista de destino');
  conf(/Repasse de prestações no Grupo \$\{grupoRep\}/.test(rd),
       'e o da coordenacao traz o grupo DO REPASSE');
  conf(/aguardando sua ciência/.test(rd), 'o subtitulo diz que aguarda a ciencia');
  // ⚠️ PRIMEIRA PESSOA para quem assume, TERCEIRA para quem toma conhecimento. Trocar um pelo
  // outro faria a coordenacao declarar que vai analisar as PCs.
  conf(/você assume a análise de/.test(rd), 'o analista de destino le na primeira pessoa');
  conf(/Comunicamos que <b>\$\{escHtml\(nomePara\)\}<\/b> assume a análise/.test(rd),
       'e a coordenacao, na terceira');

  // ⚠️ A ORIGEM E O TERCEIRO RAMO, e a perspectiva dela e a de QUEM ENTREGA. Reaproveitar o
  // texto do destino faria quem PERDEU o acervo ler que o recebeu; o da coordenacao a poria a
  // falar de si mesma na terceira pessoa.
  conf(/const ehOrigem = r\.condicao === 'analista de origem'/.test(rd),
       'ha o ramo da origem');
  // ⚠️ A CONDICAO VEM DO SERVIDOR: e o mesmo texto que vai gravado na ciencia. Deduzir aqui,
  // comparando U.id com as pontas, seria a segunda definicao de quem e quem.
  conf(!/U\.id === \(r\.de/.test(rd) && !/r\.de\.id === U\.id/.test(rd),
       'e ela nao e deduzida comparando U.id com as pontas');
  conf(/sob sua\s+responsabilidade, passaram para <b>\$\{escHtml\(nomePara\)\}<\/b>/.test(rd),
       'a origem le "sob sua responsabilidade, passaram para"');
  conf(/prestações passaram' \} para \$\{nomePara\}/.test(rd) || /para \$\{nomePara\}`/.test(rd),
       'e o titulo dela nomeia o destino');
  // ⚠️ PARA A ORIGEM, "em nome de {origem}" VIRA "em SEU nome" — e ela lendo sobre si —, e a
  // segunda frase NOMEIA o destino em vez de dizer "em seu nome", que ali apontaria para a
  // pessoa errada. A parte que AFIRMA A REGRA continua a do termo, palavra por palavra.
  conf(/permanecem registradas em <b>seu nome<\/b>/.test(rd),
       'e as baixadas ficam explicitamente NO NOME DELA');
  conf(/passarão a gerar produtividade em nome de\s+<b>\$\{escHtml\(nomePara\)\}<\/b>/.test(rd),
       'e a segunda frase NOMEIA o destino, sem "em seu nome" ambiguo');
  // ⚠️ O PARAGRAFO DA PRODUTIVIDADE E O MESMO DO TERMO, palavra por palavra — inclusive por
  // nao depender de genero. Divergirem seria o sistema dizendo duas coisas sobre um repasse so.
  conf(/a produtividade delas não é alterada por este repasse/.test(rd),
       'o paragrafo da produtividade e o do termo');
  conf(/passarão a gerar produtividade em\s+seu nome/.test(rd), 'e a parte final tambem');

  // ── as tres caixas, e a bege so quando ha
  conf(/cx\(r\.trs,/.test(rd) && /cx\(r\.pcs,/.test(rd) && /cx\(r\.vencidas,/.test(rd),
       'as tres caixas: TRs, prestacoes e prazos vencidos');
  // ⚠️ BEGE COM ZERO treinaria a pessoa a nao olhar a cor — e ai ela deixa de funcionar no dia
  // em que houver prazo estourado.
  conf(/r\.vencidas > 0\)/.test(rd), 'e a bege so acende quando ha prazo vencido');
  conf(/#FAEEDA/.test(rd), 'o bege e o mesmo da pilula do Estoque');

  conf(/Abrir o termo de repasse/.test(rd), 'ha o botao do termo');
  conf(/cieTermo\(\$\{r\.id\}\)/.test(rd), 'e ele leva ao termo daquele repasse');

  // ── a caixa de marcar
  conf(/Declaro ciência do repasse acima e assumo a análise das prestações relacionadas, a partir desta data\./.test(rd),
       'a declaracao do analista e a que o Richard escreveu');
  // ⚠️ O GRUPO DA DECLARACAO DA COORDENACAO E O **DELE**, nao o do repasse. Quem assina declara
  // na condicao que ocupa; o grupo do repasse ja esta no titulo.
  conf(/na condição de coordenação do Grupo \$\{r\.meu_grupo/.test(rd),
       'e a da coordenacao usa o grupo de QUEM ASSINA, nao o do repasse');
  conf(/Declaro ciência do repasse acima, na condição de analista de origem\./.test(rd),
       'e a da origem e a que o Richard escreveu');

  // ⚠️ O BOTAO NASCE DESABILITADO e so a caixa marcada o acende (armadilha 12); e o motivo fica
  // AO LADO, em texto — botao cinza nunca e mudo (armadilha 19).
  conf(/id="cieBt" disabled/.test(rd), 'o botao de registrar nasce desabilitado');
  const iBt = html.indexOf('function cieBotao');
  const btn = html.slice(iBt, html.indexOf('function cieDepois', iBt));
  conf(/bt\.disabled = !cb\.checked/.test(btn), 'e a caixa marcada e a unica condicao');
  conf(/Marque a declaração para registrar/.test(rd) && /id="cieMotivo"/.test(rd),
       'o motivo do cinza fica AO LADO, em texto, nao so no title');

  // ⚠️ "VER DEPOIS" NAO GRAVA NADA, nem "adiado". O que o faz voltar e a ausencia da ciencia no
  // banco — um "adiado" gravado seria um estado a mais para envelhecer.
  const iD = html.indexOf('function cieDepois()');
  const dep = html.slice(iD, iD + 200);
  conf(/fm\('moCiencia'\)/.test(dep) && !/fetch\(/.test(dep), '"Ver depois" fecha sem gravar nada');

  // ── o registro
  const iReg = html.indexOf('async function cieRegistrar');
  const reg = html.slice(iReg, iReg + 1600);
  conf(/transferencias\/\$\{id\}\/ciencia/.test(reg), 'o registro chama POST /transferencias/:id/ciencia');
  conf(/usuario_id: U\.id/.test(reg), 'e manda o proprio id');
  // ⚠️ O MODAL FICA ABERTO NO ERRO, com o botao de volta: fechar deixaria a pessoa achando que
  // registrou (armadilha 12).
  conf(/bt\.disabled = false; bt\.textContent = 'Registrar ciência'/.test(reg),
       'no erro o modal fica aberto e o botao volta');
  // ⚠️ HAVENDO MAIS DE UM PENDENTE, O PROXIMO ABRE NA SEQUENCIA.
  conf(/_cieFila = _cieFila\.slice\(1\)/.test(reg) && /cieAbrir\(\)/.test(reg),
       'e o proximo pendente abre na sequencia');
}

S('AS CIENCIAS NO TERMO E NO HISTORICO');
{
  // ⚠️ QUEM NAO DEU APARECE, e essa e a metade que importa: um bloco so com as dadas leria
  // como "todos tomaram ciencia", e o que a coordenacao precisa saber ao assinar e quem falta.
  const iB = html.indexOf('function trfCienciasBloco(d)');
  const bl = html.slice(iB, html.indexOf('function docScriptTermo', iB));
  conf(iB > 0, 'ha o bloco "Ciencias registradas" no termo');
  conf(/Ciências registradas/.test(bl), 'com esse titulo');
  conf(/<th>Nome<\/th>/.test(bl) && /Condição/.test(bl) && /Data e hora/.test(bl),
       'nome, condicao e data\/hora de cada um');
  conf(/<b>pendente<\/b>/.test(bl), 'e quem nao deu aparece como pendente');
  // ⚠️ O PENDENTE E UMA LINHA DA MESMA TABELA, e nao uma nota de rodape: quem le a coluna
  // "Quando" de cima para baixo encontra a lacuna no lugar onde ela existe.
  conf(bl.indexOf('const pend') > 0 && /\$\{linhas\}\$\{pend\}/.test(bl),
       'na mesma tabela das ciencias dadas');
  conf(/d\.ciencias_pendentes/.test(bl) && /d\.ciencias/.test(bl),
       'e as duas listas vem da MESMA resposta do servidor');
  conf(/if\(!dadas\.length && !faltam\.length\) return ''/.test(bl),
       'sem ciencia nenhuma e sem pendente, o bloco nao aparece');

  // ⚠️ SAI NO PDF E NO .doc SEM NADA A MAIS: os dois nascem do mesmo #doc. Um bloco que
  // dependesse de JavaScript apareceria na tela e sumiria nos dois documentos.
  const iT = html.indexOf('function trfMontarTermo');
  const termo = html.slice(iT, html.indexOf('function trfCienciasBloco', iT));
  conf(/\$\{trfCienciasBloco\(d\)\}/.test(termo), 'o bloco entra no HTML do termo');
  conf(termo.indexOf('trfCienciasBloco(d)') < termo.indexOf('<table class="assin">'),
       'e vem ANTES das assinaturas — quem assina no pe assina tendo lido tudo');

  // ── o Historico
  const iH = html.indexOf('function trfHistRender');
  const hist = html.slice(iH, html.indexOf('function dataHoraBr', iH));
  conf(/th\('Ciências','center'\)/.test(hist), 'a lista do Historico ganhou a coluna Ciencias');
  conf(/r\.ciencias_esperadas/.test(hist) && /faltam \$\{/.test(hist),
       'e ela diz quantas foram e quantas faltam');
  // ⚠️ "3 de 4" DIZ O QUE "3" SOZINHO NAO DIZ, e o repasse velho mostra "—", nao "0 de 0":
  // zero sobre zero se le como pendencia, e ali nao ha nenhuma.
  conf(/: '<span style="color:var\(--ct\);">—<\/span>'/.test(hist),
       'e o repasse que nao pede ciencia mostra — , nao 0 de 0');
}

S('O REPASSE DESFEITO NO HISTORICO (01/09/2026)');
{
  const iH = html.indexOf('function trfHistRender');
  const hist = html.slice(iH, html.indexOf('function dataHoraBr', iH));
  // ⚠️ O DESFEITO SE ANUNCIA NA LINHA, e nao so pela coluna Ciencias mostrando "—". Sem a
  // etiqueta, um repasse revogado se le como um repasse em vigor — e a diferenca e justamente a
  // que importa: as PCs dele estao no ESTOQUE, nao com o destino.
  conf(/r\.desfeito \?/.test(hist), 'a linha do Historico marca o repasse desfeito');
  conf(/>DESFEITO<\/span>/.test(hist), 'com a etiqueta escrita');
  // ⚠️ E O QUE ELE MOSTRA NA COLUNA CIENCIAS NAO E "—" QUANDO ALGUEM DECLAROU ANTES: as
  // ciencias dadas antes do desfazer aconteceram, e o termo as lista. Um travessao apagaria o
  // registro de que alguem declarou.
  conf(/antes do desfazer/.test(hist),
       'e as ciencias dadas antes do desfazer continuam a vista');
  conf(hist.indexOf('r.desfeito') < hist.indexOf('r.ciencias_esperadas'),
       'o ramo do desfeito e conferido antes da cobranca normal');
}
console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
