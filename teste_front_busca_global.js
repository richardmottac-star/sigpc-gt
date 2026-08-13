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
const busc = html.slice(html.indexOf('async function bgBuscar'), html.indexOf('async function bgBuscar') + 1200);
conf(/\/busca_global\?termo=/.test(busc), 'chama GET /busca_global');
conf(/usuario_id=\$\{U\.id\}/.test(busc), 'mandando o usuario_id');
conf(/sgpeAbsorver/.test(busc), 'e absorve o mapa de links do SGPe');
conf(!/prestacoes_contas\?/.test(busc), 'a tela NAO busca as PCs por conta propria');
conf(/termo\.length < 2/.test(busc), 'exige 2 caracteres antes de ir ao servidor');

secao('3. UM CARD POR TR');
const card = html.slice(html.indexOf('function bgCard'), html.indexOf('function bgCard') + 3100);
conf(/total_parciais/.test(card) && /total_pcs/.test(card) && /baixadas/.test(card) && /faltam/.test(card),
     'os QUATRO contadores: parciais, PCs, baixadas, faltam');
conf(/bgBadge\(c\.situacao\)/.test(card), 'a badge da situacao no cabecalho');
conf(/c\.cnpj_cpf/.test(card), 'o CNPJ');
conf(/Grupo \$\{escHtml\(String\(c\.grupo\)\)\}/.test(card), 'o analista COM o grupo');
conf(/sem analista/.test(card) && /no estoque/.test(card), 'e "sem analista · no estoque" quando livre');
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
conf(/window\.print\(\)/.test(doc), 'o PDF sai por window.print(), como o relatorio CGE');
conf(/application\/msword/.test(doc), "e o .doc por Blob 'application/msword'");
conf(!/jspdf|pdfmake|html2pdf|require\('docx'\)/i.test(html), 'NENHUMA biblioteca de documento foi trazida');
conf(/LOGO_SC/.test(doc), 'usa a marca do Governo de SC');
conf(/ESTADO DE SANTA CATARINA/.test(doc) && /FUNDAÇÃO CATARINENSE DE EDUCAÇÃO ESPECIAL/.test(doc),
     'com o cabecalho institucional');
conf(/Busca global do sistema/.test(doc), 'o titulo e "Busca global do sistema"');
conf(/@page \{ size:A4 portrait/.test(doc), 'em A4');
conf(/Emitido por/.test(doc) && /U\.nome/.test(doc), 'o rodape traz quem emitiu');
conf(/toLocaleDateString\('pt-BR'\)/.test(doc) && /toLocaleTimeString/.test(doc), 'com data e hora');
conf(/@media print\{\.acoes\{display:none;\}/.test(doc), 'e os botoes somem no papel');
// o codigo completo tambem no documento
conf(/\.cod\{font-family:"Courier New",monospace;white-space:nowrap;\}/.test(doc),
     'no documento o codigo tambem nao quebra linha');
conf(/Código da PC/.test(doc), 'com o mesmo rotulo da tela');
conf(/blocoCi/.test(doc), 'o bloco do C.I. entra no documento');
conf(/linkSgpe/.test(doc), 'e o link do SGPe');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
