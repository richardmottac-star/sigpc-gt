// CAMINHO: sigpc-gt/teste_front_acoes.js
//
// O BOTÃO "AÇÕES" E AS QUATRO FRENTES DE 18/08/2026, na tela.
//   A) corrigir situação · B) puxar do C.I. · C) cadastrar PC · D) pedir ao coordenador
//
// Lê o `index.html` como TEXTO — é o padrão das outras 18 suítes de front deste repositório.
// Não sobe navegador: o que se mede aqui é que a regra certa está escrita no lugar certo.
//
//   node teste_front_acoes.js

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (cond, nome, extra) => {
  if (cond) { ok++; console.log(`  OK    ${nome}`); }
  else { falhou++; console.log(`  FALHA ${nome}${extra ? ' — ' + extra : ''}`); }
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ═════════════════════════════════════════════════════════════════════════════
S('1. O MENU EXISTE, E QUEM DECIDE E O SERVIDOR');

conf(/function pBotaoAcoes\(pa, tr\)/.test(html), 'o botao unico existe');
// ⚠️ Os tres pontinhos sairam do rotulo em 18/08/2026 — decisao do Richard. Ficou "Ações ▾".
conf(/Ações ▾<\/button>/.test(html), 'e ele se chama "Ações ▾"');
conf(!/⋯ Ações/.test(html), 'sem os tres pontinhos no rotulo');
// ⚠️ O NUMERO DA PARCIAL PASSOU A VIAJAR JUNTO. A versao anterior o procurava numa varredura
// de `_planDados` — variavel que NAO EXISTE (a real e `window._planDadosCache`) —, e ler
// identificador nao declarado lanca ReferenceError. O `|| []` nao protegia, porque o erro
// acontece ANTES do `||`. Isso cortava TRES itens do menu de uma vez, em silencio: Ver
// parecer, Encaminhar ao C.I. e Historico, os tres que passavam por aquela funcao.
conf(/async function acAbrir\(ev, codigoPc, tr, parcialNum\)/.test(html),
     'o menu abre por codigo_pc E recebe o numero da parcial do proprio cartao');
// ⚠️ Mede o PADRAO que quebrava, nao o nome: `(_planDados || [])`. Procurar so pelo nome
// daria falso positivo em qualquer comentario que conte esta historia — e este arquivo conta.
conf(!/\(_planDados \|\| \[\]\)/.test(html), 'a varredura da variavel inexistente sumiu');
conf(!/function _acParcialDe/.test(html), 'e a funcao que a fazia foi removida');
conf(/\/parcela\/acoes\?codigo_pc=/.test(html), 'e pergunta ao SERVIDOR o que pode');

// ⚠️ A tela NAO pode repetir a regra de permissao — foi assim que o mapa de nomes curtos
// chegou a TRES copias, duas com chaves mortas.
conf(!/origem_baixa\s*===\s*'recarga_parcial_20260805'/.test(html),
     'a tela NAO repete a regra da recarga');
conf(!/baixado_por\s*===\s*U\.id/.test(html), 'a tela NAO repete a regra do "foi dele"');

S('2. O MENU ENTRA POR codigo_pc, NUNCA POR parcial_num');
const blocoMenu = html.slice(html.indexOf('function acFechar()'), html.indexOf('function renderPlan(rows)'));
conf(/acAbrir\(event,'\$\{escHtml\(pc\)\}'/.test(html), 'o botao passa a codigo_pc da PC');
conf(/pa\.pcs && pa\.pcs\[0\] && pa\.pcs\[0\]\.codigo_pc/.test(html),
     'que sai da primeira PC da parcela');
conf(!/parcial_num:/.test(blocoMenu), 'nenhum corpo de pedido do menu manda parcial_num');
for (const rota of ['corrigir_situacao', 'puxar_ci', 'nova', 'solicitacao_correcao']) {
  const i = html.indexOf(`/parcela/${rota}`) >= 0 ? html.indexOf(`/parcela/${rota}`) : html.indexOf(`/${rota}`);
  conf(i > 0, `a tela chama a rota ${rota}`);
}

S('3. O QUE NAO PODE VIRA "SOLICITAR", NAO ITEM CINZA MUDO');
conf(/Solicitar correção da situação/.test(html), 'corrigir vira "Solicitar correção da situação"');
conf(/Solicitar volta do C\.I\./.test(html), 'puxar vira "Solicitar volta do C.I."');
conf(/scAbrir\(\$\{pc\},'corrigir_situacao'\)/.test(html), 'e o clique abre o pedido');
conf(/scAbrir\(\$\{pc\},'puxar_ci'\)/.test(html), 'nos dois casos');
// Armadilha 15: todo item desabilitado carrega o motivo — agora no title E na segunda linha.
conf(/title="\$\{escHtml\(motivo \|\| rotulo\)\}"/.test(html), 'todo item leva o motivo no title');
// ⚠️ O MOTIVO SAIU DO TEXTO SOLTO DA LINHA e virou letra pequena SOB O ROTULO — pedido do
// Richard, 18/08/2026. Item cinza sem explicacao e o que faz a pessoa procurar o botao que
// sumiu; o motivo tem de estar onde o item esta.
conf(/!ativo && motivo \? `<span style="display:block;font-size:10\.5px/.test(html),
     'e o item indisponivel mostra o motivo embaixo do rotulo, em letra pequena');
conf(/Já existe um pedido pendente com o coordenador/.test(html),
     'pedido pendente aparece como motivo, e o item nao repete o convite');

S('4. O MENU FECHA — clique fora E Esc');
conf(/function acCliqueFora/.test(html), 'fecha clicando fora');
conf(/e\.key === 'Escape'/.test(blocoMenu), 'fecha com Esc');
conf(/document\.removeEventListener\('click', acCliqueFora, true\)/.test(html),
     'e tira os ouvintes ao fechar — senao eles se empilham a cada abertura');
conf(/const jaEra = _acAberto && _acAberto\.dataset\.pc === codigoPc/.test(html),
     'segundo clique no mesmo botao fecha');

// ═════════════════════════════════════════════════════════════════════════════
S('5. A — CORRIGIR SITUACAO');
conf(/id="moCorrigir"/.test(html), 'o modal existe');
conf(/function corSalvar\(\)/.test(html), 'e grava');
conf(/id="corBtn"[\s\S]{0,200}disabled/.test(html), 'o botao NASCE desabilitado (armadilha 15)');
conf(/Esta parcial está baixada[\s\S]{0,200}desfaz a baixa/.test(html),
     'avisa que desfaz a baixa QUANDO esta baixada');
conf(/function corAtualizarAviso\(\)/.test(html), 'e o aviso e condicional, nao fixo');
conf(/t\.length >= 10 && !!dest/.test(html), 'exige motivo de 10 e destino escolhido');

S('6. B — PUXAR DO C.I.');
conf(/id="moPuxarCi"/.test(html), 'o modal existe');
conf(/function pxSalvar\(\)/.test(html), 'e grava');
conf(/id="pxBtn"[\s\S]{0,200}disabled/.test(html), 'o botao NASCE desabilitado');
// Aqui o aviso e FIXO: puxar SEMPRE desfaz a baixa.
conf(/<b>Isto desfaz a baixa\.<\/b>/.test(html), 'o aviso de desfazer a baixa e fixo e vermelho');

S('7. C — CADASTRAR PC: A ABA FINAL NAO PEDE O QUE O SERVIDOR SABE');
conf(/id="moPcNova"/.test(html), 'o modal existe');
conf(/function pnAba\(tipo\)/.test(html), 'tem as duas abas');
const bloco = html.slice(html.indexOf('id="pnCamposFinal"'), html.indexOf('id="pnProcesso"'));
conf(!/id="pnCodigo"/.test(bloco), 'a aba Final NAO pede codigo');
conf(!/id="pnValor"/.test(bloco), 'a aba Final NAO pede valor');
conf(!/id="pnNl"/.test(bloco), 'a aba Final NAO pede NL');
conf(!/id="pnParcial"/.test(bloco), 'a aba Final NAO pede n da parcial');
conf(/não tem valor financeiro/.test(bloco), 'e explica que a final nao tem valor');
conf(/conta produtividade/.test(bloco), 'que ela conta produtividade');
conf(/90 dias após a extinção do convênio/.test(bloco), 'e o prazo de 90 dias');
conf(/-PFINAL/.test(html) && /sequência 999/.test(bloco), 'e mostra o que o servidor vai preencher');
// ⚠️ O corpo do POST na aba final NAO manda os quatro campos.
conf(/if \(_pnTipo === 'parcial'\) \{[\s\S]{0,300}corpo\.codigo_pc/.test(html),
     'so a aba parcial manda codigo/valor/NL no corpo');

S('8. D — O PEDIDO E A CAIXA DO COORDENADOR');
conf(/id="moSolCor"/.test(html), 'o modal do pedido existe');
conf(/function scEnviar\(\)/.test(html), 'e envia');
conf(/Por que passa pelo coordenador/.test(html), 'o modal diz POR QUE passa pelo coordenador');
conf(/function corAprovRender\(c\)/.test(html), 'a fila do coordenador existe');
conf(/id:'correcao',\s*rot:'Correções'/.test(html), 'e virou a TERCEIRA secao de Aprovacoes');
conf(/aprovar EXECUTA a correção na hora/.test(html), 'o subtitulo avisa que aprovar EXECUTA');
conf(/Se aprovar:<\/b> \$\{efeito\}/.test(html), 'e cada cartao diz o efeito antes do clique');
conf(/<b>Estado agora:<\/b>/.test(html), 'o cartao mostra o estado de AGORA, nao a foto do pedido');
conf(/function corDecValidar\(id\)/.test(html), 'os botoes de decisao validam o motivo');
conf(/b\.disabled = !ok; b\.title = ok \? '' : 'O motivo precisa/.test(html),
     'e nascem desabilitados com o motivo no title');
conf(/solicitacao_correcao\?usuario_id=/.test(html), 'a fila vem recortada pelo servidor');
conf(/const \[jv, jd, jc\] = await Promise\.all/.test(html),
     'as TRES filas vem numa ida so — senao os contadores das outras param');

S('9. O QUE NAO PODE REGREDIR');
// ⚠️ O botao do C.I. na linha da parcial foi a correcao de 13/08 que devolveu caminho a
// 2.181 parciais. Ele esta TAMBEM no menu, mas nao pode SAIR da linha.
const bRP = html.slice(html.indexOf('function renderPlan(rows) {'), html.indexOf('function renderPlan(rows) {') + 9000);
// ⚠️ A DECISAO MUDOU EM 18/08/2026: o C.I. saiu da linha e foi para o menu, EM DESTAQUE.
// O que esta secao protege continua sendo o mesmo — que ele nao suma SEM SUBSTITUTO, que foi
// o defeito de 13/08 (2.181 parciais baixadas sem caminho para o C.I.).
conf(!/pBotaoCI/.test(bRP), 'o botao solto do C.I. saiu da linha');
conf(/acItem\('Encaminhar ao C\.I\.', '🏛'/.test(html), 'e o C.I. virou item do menu');
conf((bRP.match(/pBotaoAcoes\(pa, r\.tr\)/g) || []).length === 2,
     'e o menu de acoes tambem');
conf(/'Encaminhar ao C\.I\.', '🏛'/.test(html), 'e o C.I. tambem esta DENTRO do menu');
// Os cinco eventos novos precisam de rotulo, senao a trilha mostra o codigo cru.
for (const ev of ['correcao_situacao', 'puxar_ci', 'pc_nova', 'solicitacao_correcao', 'correcao_negada'])
  conf(new RegExp(`${ev}:'`).test(html), `o evento '${ev}' tem rotulo no historico`);


// ═════════════════════════════════════════════════════════════════════════════
S('10. O TOPO DA MINHA PLANILHA (18/08/2026)');

// ⚠️ A ORDEM. Titulo -> NUMEROS -> alerta. Antes o alerta vinha primeiro e empurrava os
// cards para baixo da dobra: a pessoa abria a propria planilha e via primeiro uma lista de
// dez PCs vencidas ha mais de um ano, que ela nao pode resolver hoje.
const iT = html.indexOf('Minha planilha de análise');
conf(iT > 0, 'o titulo e "Minha planilha de análise"');
conf(html.indexOf('id="planResumo"') > iT
  && html.indexOf('id="planResumo"') < html.indexOf('id="planAlertas"'),
  'e a ordem e titulo -> numeros -> alerta');
conf(/PC\$\{total === 1 \? '' : 's'\} sob sua responsabilidade/.test(html),
     'o total virou contexto no subtitulo, e nao um sexto card');

S('10b. OS CINCO CARDS');
conf(/const PLAN_CARDS = \[/.test(html), 'as cores moram numa lista so');
for (const [ch, bg, fg] of [['analise','#185FA5','#B5D4F4'], ['diligencia','#BA7517','#FAC775'],
                            ['reanalise','#534AB7','#CECBF6'], ['baixada','#3B6D11','#C0DD97'],
                            ['livre','#5F5E5A','#D3D1C7']])
  conf(new RegExp(`chave: '${ch}'[^\n]*bg: '${bg}'[^\n]*fg: '${fg}'`).test(html),
       `card ${ch}: fundo ${bg}, rotulo ${fg}`);
conf(/font-size:36px;font-weight:500;color:#fff;line-height:1/.test(html),
     'o numero e 36px, peso 500, branco, line-height 1');
conf(/grid-template-columns:repeat\(5,1fr\);gap:10px/.test(html), 'grid de 5 colunas, gap 10px');
conf(/border-radius:12px;padding:14px 12px/.test(html), 'raio 12px e padding 14px 12px');
// ⚠️ SEM PERCENTUAL. Era `baixadas / META` colado num numero de PCs, sem dizer o
// denominador: imprimia "27 (31%)" com 440 PCs no acervo, e 27 de 440 e 6%.
conf(!/Math\.round\(baixadas\/meta\*100\)/.test(html), 'o percentual da meta saiu dos cards');
conf(!/function carregarMetaAnalista/.test(html), 'e a meta, que so ele usava, foi removida');

S('10c. AS DUAS FAIXAS DO ALERTA');
conf(!/10 mais críticas/.test(html), 'a lista das 10 mais criticas saiu');
conf(!/max-height:280px;overflow-y:auto/.test(html), 'e o scroll interno junto');
conf(/com prazo vencido há mais de um ano/.test(html), 'faixa 1: o passivo historico');
conf(/Passivo histórico — a maior parte veio da carga inicial/.test(html),
     'com a linha que impede ler o numero como culpa de quem abriu a tela');
conf(/Ver as \$\{contagem\.vencida365\}/.test(html), 'e o botao que leva ao filtro');
conf(/Nenhuma PC vence nos próximos 30 dias/.test(html),
     'faixa 2: aparece TAMBEM no zero — o zero e' + ' uma boa noticia, e some se nao for dita');
// ⚠️ O botao nao monta consulta propria: mexe no MESMO <select> e chama o MESMO buscarPlan.
conf(/function planFiltrarPrazo\(valor\)/.test(html), 'o filtro passa por uma funcao so');
conf(/sel\.value = valor[\s\S]{0,80}buscarPlan\(\)/.test(html),
     'que usa o select da tela, e nao uma segunda definicao de "vencida"');

S('10d. UM BOTAO BUSCAR SO');
const filtros = html.slice(html.indexOf('id="plBusca"'), html.indexOf('btn-limpar" onclick="limparPlan'));
conf((filtros.match(/BTN_BUSCAR\('buscarPlan\(\)'\)/g) || []).length === 1,
     'um unico Buscar, e vindo do helper compartilhado');
conf(!/class="btn-buscar" onclick="buscarPlan\(\)"/.test(html),
     'a copia escrita a mao saiu — ela era a sexta versao de um botao que ja tem dono');


// ⚠️ O RESUMO FICA NO FIM DO ARQUIVO, e nao no meio. Em 18/08/2026 um bloco novo foi
// acrescentado DEPOIS destas duas linhas: as assercoes rodavam, imprimiam OK, e nao
// entravam na contagem nem no exit code — uma falha ali passaria despercebida. Teste
// que nao conta e pior que teste que nao existe, porque parece cobertura.
console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;