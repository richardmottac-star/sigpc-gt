// CAMINHO: sigpc-gt/teste_front_busca_global.js
//
// BUSCA GLOBAL — o lado da tela. Lê o index.html servido; confere PRESENÇA e ORDEM.

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (c, n) => { c ? (ok++, console.log('  OK    ' + n)) : (falhou++, console.log('  FALHA  ' + n)); };
const secao = t => console.log('\n═══ ' + t + ' ═══');

// ─────────────────────────────────────────────────────────────
secao('1. SÓ SUPERADMIN — e a guarda de verdade é do servidor');
conf(/id:'bglobal', bloco:'superadmin'/.test(html), 'o item vive no bloco superadmin');
conf(/id:'bglobal'[\s\S]{0,160}?pode:\(u\)=>u\.perfil === 'superadmin'/.test(html), 'e so o superadmin o ve');
const ir = html.slice(html.indexOf('function irBuscaGlobal'), html.indexOf('function irBuscaGlobal') + 500);
conf(/U\.perfil !== 'superadmin'/.test(ir), 'a funcao tambem recusa na origem');
// ⚠️ Esconder o menu nao e' a guarda: a rota devolve o acervo de QUALQUER analista.
conf(/A GUARDA É DO SERVIDOR/.test(html), 'e o codigo diz onde a garantia mora');

secao('2. UMA CHAMADA, E O SERVIDOR AGREGA');
const busc = html.slice(html.indexOf('async function bgBuscar'), html.indexOf('async function bgBuscar') + 2400);
conf(/\/busca_global\?\$\{p\}/.test(busc), 'chama GET /busca_global');
conf(/new URLSearchParams\(\{ usuario_id: U\.id \}\)/.test(busc), 'mandando o usuario_id');
conf(/sgpeAbsorver/.test(busc), 'e absorve o mapa de links do SGPe');
conf(!/prestacoes_contas\?/.test(busc), 'a tela NAO busca as PCs por conta propria');

secao('2b. A BARRA ENTROU NO PADRAO DAS OUTRAS SETE (31/08/2026)');
// ⚠️ ESTA TELA FICOU DE FORA DA PADRONIZACAO porque NAO E MODAL: e uma tela inteira (#BODY),
// e a rodada anterior varreu os filtros das telas de lista. Aqui a busca era um campo livre
// so, e a TR e o processo iam misturados no meio do texto.
const bar = html.slice(html.indexOf('function irBuscaGlobal'), html.indexOf('function bgLimpar'));
conf(/campoProcHtml\('bgPr'/.test(bar) && /campoTrHtml\('bgTr'/.test(bar),
     'a TR e o processo tem caixa propria, pelos MESMOS helpers das outras barras');
// ⚠️ O SGPe VEM PRIMEIRO por ser o mais consultado, e a ordem no HTML e a ordem na tela.
conf(bar.indexOf("campoProcHtml('bgPr'") < bar.indexOf("campoTrHtml('bgTr'"),
     'e o SGPe vem antes do SIGEF, como nas outras');
// ⚠️ A .cmp-linha ocupa a linha inteira (flex:0 0 100%) — e ela que joga o campo livre e os
// botoes para a SEGUNDA linha, sem nenhuma quebra escrita a mao.
conf(/<div class="cmp-linha">/.test(bar), 'as duas caixas dividem a primeira linha');
conf(/class="filtros"/.test(bar), 'e a barra usa a caixa de filtro padrao');
conf(/id="bgTermo" placeholder="Entidade, NL ou PC"/.test(bar),
     'o campo livre ficou com entidade, NL e PC');
conf(/data-colagem/.test(bar), 'e aceita colagem normalizada, como as outras');
// ⚠️ UM PAR DE BOTOES PARA A BARRA INTEIRA. O Limpar e novo nesta tela.
conf(/BTN_BUSCAR\('bgBuscar\(\)'\)/.test(bar) && /bgLimpar\(\)/.test(bar),
     'um par de botoes para a barra toda');
// ⚠️ A FRASE SOBRE AS QUATRO GRAFIAS SAIU: ela existia porque o campo era LIVRE e a pessoa
// tinha de adivinhar o formato. Com as caixas, o formato esta desenhado na tela.
conf(!/Digite como preferir/.test(html), 'a frase de ajuda das quatro grafias saiu');
// ⚠️ E O CAMPO LIVRE NAO PODE VOLTAR A PEDIR TR NEM PROCESSO no placeholder — seria a tela
// convidando a digitar ali o que agora tem caixa propria.
conf(!/placeholder="TR, PC, NL, processo SGPe ou entidade"/.test(html),
     'e o campo livre nao pede mais TR nem processo');

secao('2c. TR E PROCESSO VAO SEPARADOS PARA A ROTA');
// ⚠️ COMO AS OUTRAS SETE BARRAS, e a rota combina os tres com AND. Antes eles iam no meio do
// campo livre, e procurar a TR 704 E o processo SCC 11160 juntos era impossivel — a busca
// livre e um OR sobre varios campos, e um OR nunca estreita.
conf(/const tr = campoTrTermo\('bgTr'\)/.test(busc), 'a TR sai pelo campoTrTermo');
conf(/const processo = campoProcTermo\('bgPr'\)/.test(busc), 'e o processo pelo campoProcTermo');
conf(/p\.set\('tr', tr\)/.test(busc) && /p\.set\('processo', processo\)/.test(busc),
     'e os dois vao SEPARADOS na URL');
// ⚠️ SO O QUE ESTA PREENCHIDO ENTRA NA URL: um tr= vazio nao muda a resposta, mas apareceria
// no log do servidor como se a caixa tivesse sido usada.
conf(/if\(tr\) p\.set/.test(busc) && /if\(processo\) p\.set/.test(busc) && /if\(termo\) p\.set/.test(busc),
     'e caixa vazia nao vira parametro');
// ⚠️ BASTA UMA DAS TRES, e o minimo de 2 caracteres e SO do campo livre — ele varre entidade,
// NL e PC, e uma letra sozinha traria milhares de TRs. A TR e o processo sao filtros de
// COLUNA, e "2021" na caixa do ano e uma busca inteira, nao um comeco.
conf(/if\(!termo && !tr && !processo\)/.test(busc), 'basta uma das tres caixas');
conf(/if\(termo && termo\.length < 2\)/.test(busc),
     'e o minimo de 2 caracteres vale so para o campo livre');

secao('2d. O ECO DO QUE FOI PROCURADO');
// ⚠️ O ECO SAI DO QUE A TELA MANDOU, e nao do d.termo que a rota devolve: numa busca por TR
// ou por processo o termo vem VAZIO, e a frase viraria 'Nada encontrado para ""'.
conf(/_bgAlvo = \[termo, tr, processo\]\.filter\(Boolean\)\.join/.test(busc),
     'a tela guarda o que foi procurado');
const pint = html.slice(html.indexOf('function bgPintar'), html.indexOf('const BG_SIT'));
conf(!/escHtml\(d\.termo\)/.test(pint), 'e o resultado NAO ecoa o d.termo da rota');
conf((pint.match(/escHtml\(_bgAlvo\)/g) || []).length === 2,
     'nos dois lugares: o "nada encontrado" e a contagem',
     (pint.match(/escHtml\(_bgAlvo\)/g) || []).length);

secao('2e. O LIMPAR');
const limp = html.slice(html.indexOf('function bgLimpar'), html.indexOf('async function bgBuscar'));
conf(/'bgTermo','bgTrAno','bgTrNum','bgPrSigla','bgPrNum','bgPrAno'/.test(limp),
     'apaga as SEIS caixas — as tres do processo, as duas da TR e a livre');
conf(/campoMarcar\(campoGrupo\('bgPr'\)\)/.test(limp), 'e desmarca o aviso de sigla');
// ⚠️ O LIMPAR NAO REBUSCA, e e a diferenca desta tela para as outras. No Estoque o Limpar
// redesenha uma lista JA CARREGADA; aqui a busca e uma consulta ao servidor sobre 14.652 PCs,
// e "limpar tudo e buscar" seria pedir o acervo inteiro — ou, com tudo vazio, um erro.
conf(!/bgBuscar\(\)/.test(limp), 'e NAO dispara uma busca nova');

secao('3. UM CARD POR TR');
// ⚠️ O RECORTE VAI ATE A PROXIMA FUNCAO, e nao ate um numero de caracteres. A janela fixa de
// 3100 deixava o `faltam` a 3.267 caracteres do inicio — fora por 167 —, e a checagem
// reprovava por causa do tamanho do recorte, nao do que a funcao faz. Medir por marco e
// medir a coisa; medir por contagem e medir o acaso.
const iCard = html.indexOf('function bgCard');
const card = html.slice(iCard, html.indexOf('\nfunction ', iCard + 10));
conf(/total_parciais/.test(card) && /total_pcs/.test(card) && /baixadas/.test(card) && /faltam/.test(card),
     'os QUATRO contadores: parciais, PCs, baixadas, faltam');
conf(/bgBadge\(c\.situacao\)/.test(card), 'a badge da situacao no cabecalho');
conf(/c\.cnpj_cpf/.test(card), 'o CNPJ');
conf(/Grupo \$\{escHtml\(String\(c\.grupo\)\)\}/.test(card), 'o analista COM o grupo');
conf(/Sem analista/.test(card) && /no estoque/.test(card), 'e "Sem analista · no estoque" quando livre');
// ⚠️ A DATA SÓ APARECE NAS DEVOLVIDAS. Medido em 13/08: das 795 TRs sem dono, 793 nunca
// tiveram um — para essas não existe "desde quando", e inventar a data da carga seria
// mostrar um número que não quer dizer o que parece.
conf(/no_estoque_desde \?/.test(card), 'a data e condicional, nao fixa');
conf(/no_estoque_desde[\s\S]{0,80}?: ''/.test(card), 'e sem data nao sobra texto solto');
conf(/assumida em/.test(card) && /em análise há/.test(card), 'assumida em, e ha quantos dias');
conf(/parciais_casaram/.test(card), 'e diz quantas parciais a busca encontrou');

secao('4. O PRAZO ANTIGO NAO APARECE');
conf(/prazo não definido/.test(card), 'sem prazo valido, diz "prazo nao definido"');
conf(/color:var\(--r\);">\$\{c\.prazo\.dias_atraso\}/.test(card), 'e o atraso sai em VERMELHO');
conf(/dt_limite_pc do acervo antigo não é prazo/.test(card), 'com o porque escrito ao lado');

secao('5. A TABELA DE PARCIAIS');
const tab = html.slice(html.indexOf('function bgTabela'), html.indexOf('function bgTabela') + 2900);
conf(/TODAS as parciais, sempre/.test(tab), 'todas abertas, sem "ver todas"');
// ⚠️ Procurar o texto 'ver todas' acusava o COMENTARIO da propria funcao, que explica por
// que ele nao existe. A checagem tem de olhar um BOTAO que expanda, nao a palavra.
conf(!/onclick="[a-zA-Z]*(Expandir|VerTodas|Mais)\(/.test(tab), 'e nao ha botao de expandir');
conf(/Código da PC/.test(tab), 'a coluna se chama "Codigo da PC"');
// ⚠️ dimensionada pela FINAL: 19 caracteres contra 12 da parcial
conf(/width:176px;">Código da PC/.test(tab), 'com largura dimensionada pela PC final');
conf(/dimensionados pela PC FINAL/.test(tab), 'e o porque escrito no codigo');
conf(/white-space:nowrap;">\s*\$\{escHtml\(pc\.codigo_pc\)\}/.test(tab), 'o codigo nunca quebra linha');
conf(/pc\.codigo_nl \? escHtml\(pc\.codigo_nl\) : '—'/.test(tab), 'a final entra com — na coluna NL');
conf(/procHtml\(pa\.processo_pc/.test(tab), 'o SGPe vai como link');
conf(/pc\.casou \? 'background:#FFF8E1;'/.test(tab), 'e o que casou vem destacado');
// SEM coluna de valor
conf(!/valor|Valor/.test(tab), 'NAO ha coluna de valor');

secao('6. O BLOCO DO C.I.');
const bci = html.slice(html.indexOf('function bgBlocoCi'), html.indexOf('function bgBlocoCi') + 1400);
conf(/c\.parciais\.filter\(p => p\.ci\)/.test(bci), 'uma linha por parcial encaminhada');
conf(/encaminhada em/.test(bci), 'com a data');
conf(/BG_CI\[p\.ci\.situacao\]/.test(bci), 'e o ponto do ciclo em portugues');
conf(/na_fila: 'Na fila do C\.I\.'/.test(html), 'espelhando as SITUACOES de lib/ci.js');
conf(/rodada/.test(bci), 'mostrando a rodada quando ha mais de uma');
conf(/if\(!noCi\.length\) return ''/.test(bci), 'e o bloco some quando nao ha C.I.');

secao('7. O ENCAMINHAMENTO — PDF e .doc, sem biblioteca');
const doc = html.slice(html.indexOf('function bgMontarDoc'), html.indexOf('function bgMontarDoc') + 8000);
// ⚠️ O TIMBRE SAIU DAQUI EM 01/09/2026, e nao sumiu: virou DOC_CSS, DOC_CABECALHO e DOC_ACOES,
// compartilhados com o TERMO DE REPASSE. Duas copias do brasao divergiriam no primeiro ajuste,
// e um documento oficial com o cabecalho de uma versao anterior so se descobre depois de
// assinado. As checagens abaixo passaram a medir a DEFINICAO, e a do documento e que ele a USA.
const timbre = html.slice(html.indexOf('const DOC_CSS ='), html.indexOf('function bgMontarDoc'));
conf(/window\.print\(\)/.test(timbre), 'o PDF sai por window.print(), como o relatorio CGE');
conf(/application\/msword/.test(doc), "e o .doc por Blob 'application/msword'");
conf(!/jspdf|pdfmake|html2pdf|require\('docx'\)/i.test(html), 'NENHUMA biblioteca de documento foi trazida');
conf(/LOGO_SC/.test(timbre), 'usa a marca do Governo de SC');
conf(/ESTADO DE SANTA CATARINA/.test(timbre) && /FUNDAÇÃO CATARINENSE DE EDUCAÇÃO ESPECIAL/.test(timbre),
     'com o cabecalho institucional');
conf(/GABINETE DA PRESIDÊNCIA/.test(timbre) && /SETOR DE PRESTAÇÃO DE CONTAS — GRUPO DE TRABALHO/.test(timbre),
     'e as quatro linhas do timbre');
conf(/Busca global do sistema/.test(doc), 'o titulo e "Busca global do sistema"');
conf(/@page \{ size:A4 portrait/.test(timbre), 'em A4');
conf(/Emitido por/.test(doc) && /U\.nome/.test(doc), 'o rodape traz quem emitiu');
conf(/toLocaleDateString\('pt-BR'\)/.test(doc) && /toLocaleTimeString/.test(doc), 'com data e hora');
conf(/@media print\{\.acoes\{display:none;\}/.test(timbre), 'e os botoes somem no papel');
// o codigo completo tambem no documento
conf(/\.cod\{font-family:"Courier New",monospace;white-space:nowrap;\}/.test(timbre),
     'no documento o codigo tambem nao quebra linha');
// ⚠️ E O DOCUMENTO TEM DE USAR A DEFINICAO, nao ter uma copia dela: e o unico jeito de as
// duas nao divergirem.
conf(/<style>\$\{DOC_CSS\}/.test(doc), 'o documento le o CSS compartilhado');
conf(/\$\{docCabecalho\(\)\}/.test(doc), 'e o cabecalho compartilhado');
conf(/\$\{DOC_ACOES\}/.test(doc), 'e os botoes compartilhados');
// ⚠️ A CHECAGEM E SOBRE ESTE DOCUMENTO, e nao sobre o arquivo inteiro: o relatorio da CGE e o
// de Monitoramento tem cada um o seu timbre, escrito antes desta extracao e com CSS proprio.
// Unifica-los e outra frente — contar o arquivo todo reprovaria por causa deles, que nao sao
// o assunto aqui.
conf(!/ESTADO DE SANTA CATARINA/.test(doc), 'o documento NAO tem uma copia do brasao');
conf(!/@page \{ size:A4 portrait/.test(doc), 'nem uma copia do CSS');
conf(/Código da PC/.test(doc), 'com o mesmo rotulo da tela');
conf(/blocoCi/.test(doc), 'o bloco do C.I. entra no documento');
conf(/linkSgpe/.test(doc), 'e o link do SGPe');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
