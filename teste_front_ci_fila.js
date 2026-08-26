// CAMINHO: sigpc-gt/teste_front_ci_fila.js
//
// A TELA DO CONTROLE INTERNO — POR PC. Lê o próprio index.html. Sem navegador, sem rede.
//
// ⚠️ REESCRITO EM 25/08/2026 JUNTO COM A TELA. Este arquivo cobria a "Fila de trabalho" por
// TR, de 24/08: uma linha por TR, o responsável pendurado na TR, e as ações assumir/devolver/
// passar sobre a TR inteira. O Richard trocou a unidade — o Controle Interno trabalha por PC —
// e a tela foi reescrita. As checagens do painel por TR que viviam em `teste_front_acoes.js`
// (seções 17 a 17e) vieram para cá, porque agora existe uma suíte da tela do C.I.
//
// O que esta suíte protege:
//   · o cabeçalho, os quatro cards sólidos e os cinco chips, com as cores da especificação;
//   · os DOIS blocos de busca, e o fato de serem EXCLUDENTES;
//   · os três campos do SGPe obrigatórios, e o botão cinza que diz o que falta;
//   · a lista com o PROCESSO SGPe em destaque, os três degraus e a divisória entre blocos;
//   · que ABRIR NÃO É ASSUMIR — a PC só ganha técnico quando o parecer é confirmado;
//   · as duas decisões, com o texto e as cores exatas, e o Confirmar na cor da escolhida;
//   · que nada da tela escreve na baixa.
//
// USO: node teste_front_ci_fila.js

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// O bloco da tela, isolado. Tudo o que se confere aqui tem de estar DENTRO dele — uma
// checagem contra o arquivo inteiro passaria por causa de outra tela qualquer.
const INI = html.indexOf('//  CONTROLE INTERNO — POR PC');
const FIM = html.indexOf('Encaminha a PARCELA ao Controle Interno, do detalhe da TR.');
if (INI < 0 || FIM < 0 || FIM <= INI) {
  console.log('\nFALHA: nao achei o bloco do C.I. por PC no index.html.\n');
  process.exit(1);
}
const B = html.slice(INI, FIM);
const B1 = B.replace(/\n\s*/g, ' ');            // uma linha só, para o CSS quebrado em duas
const semComentario = B.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
const corpo = (fn) => (B.match(new RegExp(`function ${fn}\\([^)]*\\)[\\s\\S]*?\\n\\}`)) || [''])[0];

S('1. O CABECALHO');
conf(/async function irCI\(\)/.test(B), 'a tela abre por irCI()');
// ⚠️ O escudo em quadrado #0F6E56 é a identidade da tela — o mesmo de 18/08, que sobreviveu
// às duas reescritas porque é o que o técnico reconhece de longe.
conf(/border-radius:11px;background:#0F6E56/.test(B1), 'escudo em quadrado #0F6E56');
conf(/const CI_ESCUDO = 'M12 1L3 5v6/.test(B), 'com o caminho do escudo');
conf(/Controle interno<\/div>/.test(B), 'o titulo e "Controle interno"');
// O subtítulo é [nome do técnico] · [N] PCs encaminhadas aguardando.
const sub = corpo('ciRender');
conf(/\$\{U\.nome\} · \$\{n\.toLocaleString\('pt-BR'\)\}/.test(sub), 'subtitulo com o nome de quem esta olhando');
conf(/PC\$\{n === 1 \? '' : 's'\} encaminhada\$\{n === 1 \? '' : 's'\} aguardando/.test(sub),
     'e o numero de PCs aguardando, com o plural no lugar');
// ⚠️ `procRecarregar` procura `#ciPainel` para saber que a pessoa está nesta tela. Trocar o id
// sem trocar lá faria o lápis do SGPe corrigir o processo e não repintar nada.
conf(/id="ciPainel"/.test(B), 'o painel guarda o id que o procRecarregar procura');
conf(/if\(typeof ciCarregar === 'function' && document\.getElementById\('ciPainel'\)\)/.test(html),
     'e o procRecarregar continua achando a tela');

S('2. OS QUATRO CARDS SOLIDOS');
conf(/const CI_CARDS = \[/.test(B), 'os quatro cards numa lista so');
for (const [chave, cor] of [['fila', '#BA7517'], ['espera_media', '#A32D2D'],
                            ['com_analista', '#185FA5'], ['encerradas', '#3B6D11']])
  conf(new RegExp(`chave:'${chave}',\\s*cor:'${cor}'`).test(B), `card ${chave} em ${cor}`);
conf(/font-size:25px;font-weight:800/.test(B1), 'o numero em destaque');
// ⚠️ UM CARD QUE ACEITA CLIQUE E NAO FAZ NADA E A ARMADILHA 15. A média não é um conjunto de
// linhas, então ela é o único card que não filtra — e por isso não nasce clicável.
conf(/chip:null, dias:true/.test(B), 'a media nao leva a lugar nenhum — nao e um conjunto de linhas');
conf(/\$\{clic \? `onclick="ciChip\('\$\{k\.chip\}'\)"/.test(B), 'os outros tres levam ao recorte deles');
conf(/title="\$\{clic \? 'Ver estas PCs' : 'Média de dias de espera/.test(B1),
     'e o title diz o que cada um faz — inclusive o que nao clica');
// ⚠️ Os números são da FILA INTEIRA, não do filtro: um número que muda quando você digita
// deixa de ser o retrato do serviço e vira o eco do campo de texto.
conf(/O RESUMO NÃO RECEBE O FILTRO/.test(
       fs.readFileSync(path.join(__dirname, '..', 'sigpc-api', 'server.js'), 'utf8')),
     'e o servidor registra que o resumo nao sofre o filtro');

S('3. OS CINCO CHIPS');
conf(/const CI_CHIPS = \[/.test(B), 'os chips numa lista so');
for (const [id, rot] of [['fila', 'Na fila'], ['minhas', 'Comigo'], ['outros', 'Com outros'],
                         ['mais30', 'Mais de 30 dias'], ['encerradas', 'Encerradas']])
  conf(new RegExp(`id:'${id}',\\s*rot:'${rot}'`).test(B), `chip "${rot}"`);
// O "Mais de 30 dias" carrega a cor da faixa crítica — a mesma da etiqueta da linha.
conf(/bg:'#FCEBEB', fg:'#A32D2D'/.test(B), 'o chip de mais de 30 dias em vermelho claro');
conf(/_ciChip = id/.test(corpo('ciChip')), 'clicar troca o recorte');
conf(/_ciAberto = null; _ciDecisao = null/.test(corpo('ciChip')), 'e fecha a PC que estava aberta');

S('4. AS TRES FAIXAS DE ESPERA');
conf(/ok:\s*\{ bg:'#EAF3DE', fg:'#27500A' \}/.test(B), 'ate 15 dias: verde');
conf(/atencao: \{ bg:'#FAEEDA', fg:'#854F0B' \}/.test(B), '16 a 30: ambar');
conf(/critica: \{ bg:'#FCEBEB', fg:'#A32D2D' \}/.test(B), 'mais de 30: vermelho');
// ⚠️ AS BORDAS FICAM NO SERVIDOR. Duas contas para a mesma faixa divergiriam, e a etiqueta
// diria uma coisa enquanto o chip contaria outra.
conf(/CI_ESPERA\[l\.faixa_espera\]/.test(B), 'a tela pinta a faixa que veio do servidor');
conf(!/dias > 30|dias > 15/.test(semComentario), 'e nao recalcula a faixa aqui');

S('5. OS DOIS BLOCOS DE BUSCA SAO EXCLUDENTES');
conf(/Localizar pelo processo SGPe/.test(B), 'o bloco de cima e o do processo');
conf(/Ou procurar na fila/.test(B), 'e o de baixo e a busca geral');
const sg = corpo('ciBuscarSgpe'), ge = corpo('ciBuscarGeral');
// ⚠️ Combinar os dois pareceria mais poderoso e devolveria vazio silencioso toda vez que o
// processo digitado não fosse o da entidade digitada — e a pessoa leria "não existe" para
// uma PC que existe.
conf(/_ciGeral = \{ q:'', analista_id:'', espera:'' \}/.test(sg), 'buscar o processo limpa os filtros de baixo');
conf(/ciQ'\); if\(q\) q\.value = ''/.test(sg), 'e apaga o campo de texto na tela');
conf(/_ciSgpe = \{ sigla:_ciSgpe\.sigla \|\| 'SCC', num:'', ano:'' \}/.test(ge),
     'buscar na fila limpa o numero e o ano do processo');
conf(/_ciModo = 'sgpe'/.test(sg) && /_ciModo = 'geral'/.test(ge), 'e so um modo vale por vez');
// A sigla NÃO é apagada pela outra busca: ela é a única com um padrão útil, e reescrever
// "SCC" toda vez seria atrito sem resposta a dar.
conf(/sigla:_ciSgpe\.sigla \|\| 'SCC'/.test(ge), 'a sigla sobrevive — e o unico campo com padrao');

S('6. OS TRES CAMPOS DO SGPe — CURTOS, LADO A LADO, E OS TRES OBRIGATORIOS');
conf(/id="ciSgSigla" value="SCC" maxlength="10"/.test(B), 'a sigla nasce SCC');
conf(/text-transform:uppercase/.test(B1), 'e sobe para maiusculas na tela');
conf(/id="ciSgNum" maxlength="10"/.test(B), 'o numero aceita 10 digitos');
conf(/id="ciSgAno" maxlength="4"/.test(B), 'e o ano, 4');
// ⚠️ AS LARGURAS SAO FIXAS, E O QUE SOBRA DA LINHA FICA VAZIO (Richard, 26/08/2026).
// Antes o Numero esticava com `flex:1 1 190px` ate ocupar a linha inteira: um campo de dez
// digitos com 400px de largura promete um texto longo que ele nao aceita, e some com a
// relacao entre os tres. A tela ensina o formato pelo TAMANHO de cada caixa.
conf(/flex:0 0 80px;">\$\{rot\('Sigla'\)\}/.test(B1), 'sigla em 80px');
conf(/flex:0 0 120px;">\$\{rot\('Número'\)\}/.test(B1), 'numero em 120px');
conf(/flex:0 0 90px;">\$\{rot\('Ano'\)\}/.test(B1), 'ano em 90px');
// ⚠️ SÓ NO BLOCO DO SGPe: a explicação de POR QUE o Número deixou de esticar cita a largura
// antiga do campo, e uma busca no bloco inteiro acharia o próprio comentário.
const blocoSgpe = B1.slice(B1.indexOf('Localizar pelo processo SGPe'), B1.indexOf('Ou procurar na fila'));
conf(!/flex:1 1 190px;/.test(blocoSgpe), 'e nenhum deles estica');
conf(/<div style="flex:1 1 0;min-width:0;"><\/div>/.test(B1), 'o espaco que sobra fica vazio');
conf(/onclick="ciBuscarSgpe\(\)" disabled/.test(B), 'o botao Buscar vem logo depois, e nasce cinza');
conf(/letter-spacing:\.05em;margin-bottom:3px;font-weight:600/.test(B1), 'com o rotulo pequeno em cima de cada um');
// ⚠️ OS TRES SAO OBRIGATORIOS: buscar so pelo numero devolveria o SCC 7537 de sete anos
// diferentes — a armadilha 19 dita como interface.
const mud = corpo('ciSgpeMudou');
conf(/bt\.disabled = falta\.length > 0/.test(mud), 'e so acende com os tres');
conf(/bt\.title = falta\.length \?/.test(mud), 'e o cinza DIZ o que falta (armadilha 15)');
for (const c of ['a sigla', 'o número', 'o ano']) conf(mud.includes(`'${c}'`), `sabe apontar "${c}"`);
conf(/Pontuação e zeros à esquerda não importam/.test(B), 'e a tela explica a normalizacao');

S('7. A LISTA — O PROCESSO SGPe E O ELEMENTO PRINCIPAL');
// ⚠️ O TECNICO DO C.I. NAO PROCURA PELO CODIGO DA PC: ele procura pelo PROCESSO, porque e com
// o processo aberto no SGPe que ele confere. A primeira versao punha `2020PC000448` em
// destaque e o processo escondido dentro do cartao — o numero que a pessoa tem na mao era o
// unico que ela nao via na lista.
conf(/const CI_COLS = '1fr 150px 90px 130px 92px'/.test(B), 'as larguras: o processo toma o espaco livre');
conf(/background:#173404;color:#C0DD97/.test(B1), 'a faixa de cabecalho verde escuro, mantida');
for (const t of ['Processo SGPe', 'Analista', 'Espera', 'Técnico C.I.'])
  conf(B.includes(`<div>${t}</div>`), `coluna "${t}"`);
conf(!/<div>PC<\/div>/.test(B), 'e "PC" deixou de ser coluna — virou subtitulo');
// Os tres degraus da esquerda.
conf(/font-size:20px;font-weight:500;color:var\(--te\)/.test(B1), '1o degrau: o processo em 20px, weight 500, cor primaria');
conf(/font-size:12px;color:var\(--ct\);margin-top:2px/.test(B1), '2o degrau: PC · TR · parcela em 12px, cor secundaria');
conf(/\$\{escHtml\(l\.codigo_pc\)\} · \$\{escHtml\(l\.tr\)\} · parcela/.test(B), 'com os tres, nessa ordem');
conf(/font-size:12px;color:#9AA8A0;overflow:hidden/.test(B1), '3o degrau: a entidade em 12px, cor mais fraca');
// ⚠️ AS COLUNAS DA DIREITA CAEM PARA 13px de proposito: competir em tamanho com o processo
// desfaria o degrau que a primeira linha acabou de construir.
conf((B1.match(/font-size:13px/g) || []).length >= 3, 'as colunas da direita em 13px');
// ⚠️ PC SEM PROCESSO MOSTRA UM TRACO NO MESMO LUGAR E NO MESMO TAMANHO. Encolher ou esconder
// desalinharia a coluna toda, e quem varre a lista de cima a baixo perderia o fio.
conf(/const semProc = !l\.processo_pc/.test(B), 'PC sem processo e detectada');
conf(/\? `<span style="color:#9AA8A0;">—<\/span>`/.test(B), 'e mostra um traco, no mesmo lugar');
conf(/String\(l\.processo_pc\)\.trim\(\) === '-'/.test(B), 'inclusive quando o dado gravado e o literal "-"');
// ⚠️ SEM ZEBRA (26/08/2026): cada PC e um bloco separado por uma divisoria de 1px na cor de
// borda padrao. A zebra pintava a linha inteira e competia com a hierarquia dos tres degraus.
conf(!/i % 2 === 0/.test(B), 'a zebra saiu');
conf(!/#F2F8EC/.test(B), 'e o verde alternado tambem');
conf(/\$\{i === 0 \? '' : 'border-top:1px solid var\(--cb\);'\}/.test(B),
     'divisoria de 1px entre os blocos — sem borda no topo do primeiro');
conf(/<span style="color:#9AA8A0;font-size:13px;">—<\/span>/.test(B), '"—" quando ninguem esta com ela');
conf(/Mostrando as <b>\$\{_ciDados\.length\.toLocaleString\('pt-BR'\)\}<\/b> mais antigas de/.test(B1),
     'e o corte continua sendo dito');

S('8. ABRIR NAO E ASSUMIR');
// ⚠️ ATE 25/08 EXPANDIR A LINHA GRAVAVA A PC no nome de quem clicou — `POST /ci/pc/abrir`. A
// ideia era coordenar os tres tecnicos; o efeito foi que **olhar virou tomar**. No primeiro
// dia o nome do superadmin, que nao e do C.I., apareceu numa PC que ele nao analisa.
const exp = corpo('ciExpandir');
conf(exp.length > 0, 'ciExpandir existe');
conf(!/async function ciExpandir/.test(B), 'e nao e mais async — nao ha rota a esperar');
conf(!/fetch/.test(exp), 'nao chama rota nenhuma');
conf(!/ci_tecnico_id/.test(exp), 'nao grava ci_tecnico_id');
conf(!/ci_tecnico_em/.test(exp), 'nem ci_tecnico_em');
conf(!/API_URL\}\/ci\/pc\/abrir/.test(B), 'e a chamada a /ci/pc/abrir sumiu da tela inteira');
conf(/_ciAberto = _ciAberto === codigo_pc \? null : codigo_pc/.test(exp), 'ela so alterna qual cartao esta aberto');
conf(/ciListaRender\(\)/.test(exp), 'e repinta');
// O botao "Abrir"/"Fechar" no lugar da seta.
conf(!/\$\{aberta \? '▲' : '▼'\}/.test(B), 'a seta saiu');
conf(/>\$\{aberta \? 'Fechar' : 'Abrir'\}<\/button>/.test(B1), 'e virou um botao Abrir / Fechar');
conf(/onclick="ciExpandir\('\$\{escHtml\(l\.codigo_pc\)\}'\)" class="btn-sec"/.test(B),
     'pequeno, no estilo secundario');
conf(/padding:4px 12px;font-size:12px/.test(B1), 'em 12px');
conf(/<div style="text-align:right;">\s*<button onclick="ciExpandir/.test(B1), 'alinhado a direita da linha');
// ⚠️ A LINHA INTEIRA DEIXOU DE SER CLICAVEL. Com abrir sendo so abrir isso seria inofensivo,
// mas o processo SGPe da primeira linha e um LINK: clicar nele abriria o cartao junto.
conf(!/<div onclick="ciExpandir/.test(B), 'e a linha inteira nao e mais um botao');
// ⚠️ O QUE A TELA PROMETE: fechar sem decidir nao deixa rastro.
conf(/fechar sem decidir não deixa rastro/.test(B), 'e a tela diz que fechar sem decidir nao deixa rastro');

S('9. O CARTAO ABERTO');
const det = corpo('ciDetalhe');
for (const [rot, campo] of [['Valor', 'planMoeda(l.valor)'], ['Nota de liquidação', 'l.codigo_nl'],
                            ['Baixada em', 'l.data_baixa']])
  conf(det.includes(`'${rot}'`) && det.includes(campo), `o dado "${rot}"`);
// ⚠️ O LINK DO SGPe E O QUE FAZ O NUMERO SERVIR PARA ALGUMA COISA. `procHtml` e um Map.get:
// sem o mapa de links, o processo sai em texto puro e ninguem percebe (armadilha 20).
conf(/procHtml\(l\.processo_pc, l\.codigo_pc, 'processo_pc'\)/.test(det), 'e o processo SGPe como link, com o lapis');
conf(/border-left:3px solid #BA7517/.test(B1), 'o parecer da analista em bloco ambar com borda a esquerda');
conf(/Parecer da analista/.test(B), 'com o rotulo');
// ⚠️ O parecer e RARO — 26 de 958 medidos em 18/08. A tela precisa distinguir "a analista nao
// escreveu nada" de "nao veio na consulta".
conf(/A analista baixou a parcela sem escrever um texto de parecer/.test(B),
     'e diz quando a analista nao escreveu, em vez de ficar vazio');

S('10. AS DUAS DECISOES');
conf(/const CI_DECISOES = \[/.test(B), 'as duas numa lista so');
conf(/id:'de_acordo', cor:'#3B6D11', bg:'#EAF3DE'/.test(B), 'a primeira em verde');
conf(/rot:'Parecer do analista em acordo, baixado'/.test(B), 'com o texto exato do Richard');
conf(/sub:'Encerra o ciclo\. A PC sai da fila e vai para Encerradas\.'/.test(B), 'e a consequencia embaixo');
conf(/id:'ressalva',\s*cor:'#BA7517', bg:'#FAEEDA'/.test(B), 'a segunda em ambar');
conf(/rot:'Parecer para correção, verificar o processo no SGPe'/.test(B), 'com o texto exato');
// ⚠️ E o "a baixa dela permanece" e o que impede a leitura de que devolver a analista desfaz
// a produtividade dela.
conf(/sub:'Volta para a analista corrigir\. A baixa dela permanece\.'/.test(B), 'e a garantia da baixa');
conf(/font-size:11\.5px;color:var\(--ct\);margin-top:2px/.test(B1), 'o subtexto em 11.5px cinza');
conf(/border:1\.5px solid \$\{on \? d\.cor : 'var\(--cb\)'\}/.test(B), 'a opcao escolhida ganha a borda na cor dela');
conf(/background:\$\{on \? d\.bg : '#fff'\}/.test(B), 'e o fundo claro correspondente');
conf(/accent-color:\$\{d\.cor\}/.test(B), 'o proprio radio na cor da opcao');
conf(/type="radio" name="ciDec"/.test(B), 'sao radios, e so um vale por vez');

S('11. A OBSERVACAO E O CONFIRMAR');
conf(/Observação \(opcional\)/.test(B), 'a caixa e OPCIONAL, nas duas decisoes');
conf(/id="ciObs"/.test(B), 'e tem um campo so');
// ⚠️ O TEXTO E GUARDADO E DEVOLVIDO ao repintar. Sem isto, quem escrevesse a observacao antes
// de escolher a opcao perderia o que digitou — calado, que e a pior maneira de perder texto.
const esc = corpo('ciEscolher');
conf(/const obs = document\.getElementById\('ciObs'\)\?\.value \|\| ''/.test(esc), 'a escolha guarda o texto');
conf(/if\(el\) el\.value = obs/.test(esc), 'e devolve depois de repintar');
// ⚠️ O BOTAO NASCE CINZA E DIZ POR QUE (armadilha 15). Botao que aceita clique e nao responde
// e pior que botao cinza.
conf(/id="ciBtConf"[\s\S]{0,160}\$\{pode \? '' : 'disabled'\}/.test(B), 'o Confirmar nasce desabilitado');
conf(/title="\$\{escHtml\(motivo\)\}"/.test(B), 'com o motivo no title');
for (const m of ['Esta PC já foi encerrada no Controle Interno.',
                 'Esta PC está com a analista, aguardando a correção.',
                 'Escolha uma das duas opções acima.',
                 'O parecer do Controle Interno é dado por um técnico do C.I.'])
  conf(B.includes(m), `o motivo "${m.slice(0, 34)}..."`);
// ⚠️ O BOTAO TOMA A COR DA OPCAO ESCOLHIDA — e o que liga a escolha ao ato.
conf(/background:\$\{pode \? escolhida\.cor : '#B6C2BB'\}/.test(B), 'e o botao toma a cor da opcao escolhida');
conf(B1.includes("Ao confirmar, esta PC passa a levar o seu nome: <b>${escHtml(U.nome)}</b>, ${hoje}."),
     'e o rodape diz que confirmar e o que carimba o nome');

S('12. O PARECER E DADO POR UM TECNICO DO C.I. — SUPERADMIN INCLUIDO NA RECUSA');
const pode = corpo('ciPodeDecidir');
conf(/if\(verComoAtivo\(\)\) return false/.test(pode), 'no modo "agir pela conta de", ninguem decide');
// ⚠️ MUDOU EM 26/08/2026. O parecer **carimba o nome de quem o deu** na PC, e o nome que fica
// ali tem de ser o de alguem do Controle Interno. Um superadmin decidindo poria o nome dele
// numa PC que ele nao analisa — que foi o que aconteceu no primeiro dia da tela.
conf(/return U\.perfil === 'controle_interno'/.test(pode), 'so o perfil controle_interno decide');
conf(!/U\.perfil === 'superadmin'/.test(pode), 'e o superadmin NAO tem passe livre aqui');
// ⚠️ A POSSE SAIU DA CONDICAO: ela virou CONSEQUENCIA do parecer, e exigi-la antes travaria a
// fila inteira — nenhuma PC tem dono ate alguem dar o primeiro parecer.
conf(!/l\.ci_tecnico_id/.test(pode), 'e a posse da PC nao e mais pre-requisito');
// ⚠️ E A TELA NAO E A TRANCA: o servidor recusa do mesmo jeito.
const srv = fs.readFileSync(path.join(__dirname, '..', 'sigpc-api', 'server.js'), 'utf8');
conf(/ciFila\.podeDecidir\(autor, null\)/.test(srv), 'e o servidor confere a mesma coisa');
conf(/ciFila\.motivoNaoDecide\(\)/.test(srv), 'com a mesma frase de recusa');

S('13. AS DUAS ACOES SOBRE A DEMANDA');
conf(/id="moCiDevolver"/.test(B) && /id="moCiPassar"/.test(B), 'os dois modais existem');
conf(/API_URL\}\/ci\/pc\/devolver/.test(B), 'devolver chama a rota por PC');
conf(/API_URL\}\/ci\/pc\/passar/.test(B), 'e passar tambem');
// ⚠️ O botao so acende com o motivo, e o title diz quantos caracteres faltam.
for (const fn of ['ciDevChecar', 'ciPassChecar']) {
  const c = corpo(fn);
  conf(/b\.disabled =/.test(c), `${fn} nasce com o botao cinza`);
  conf(/Faltam \$\{10 - v\.length\} caractere/.test(c), `${fn} diz quantos caracteres faltam`);
}
// ⚠️ A LISTA SAO OS OUTROS TECNICOS — o proprio nao entra: para ficar com a PC basta abri-la,
// e oferecer "passar para mim mesmo" seria um caminho que o servidor recusa.
conf(/_ciTecnicos\.filter\(t => String\(t\.id\) !== String\(U\.id\)\)/.test(corpo('ciAbrirPassar')),
     'e o proprio nao aparece na lista de destinos');

S('14. O QUE A TELA NUNCA FAZ');
// ⚠️ NADA AQUI TOCA NA BAIXA. Nem a decisao, nem a devolucao a fila, nem o passar a outro.
const enviado = (semComentario.match(/body: JSON\.stringify\([^)]*\)/g) || []).join(' | ');
conf(enviado.length > 0, 'a tela envia corpos JSON — o recorte achou o que conferir');
conf(!/baixada|data_baixa|enviado_ci/.test(enviado), 'e nenhum deles carrega baixada, data_baixa ou enviado_ci');
conf(!/ci_situacao *[:=]/.test(enviado), 'nem ci_situacao — quem move no ciclo e o servidor');
// ⚠️ E A TELA NAO FILTRA LOCALMENTE. Sao 2.928 PCs no ciclo; baixar todas para recortar aqui e
// o problema das seis telas listadas nas Pendencias do CLAUDE.md.
conf(!/_ciDados\.filter\(/.test(semComentario), 'a tela nao recorta a lista no navegador');
conf(/sgpeAbsorver\(await r\.json\(\)\)/.test(corpo('ciCarregar')),
     'e absorve o mapa de links ANTES de pintar, na forma canonica do projeto');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exitCode = falhou ? 1 : 0;
