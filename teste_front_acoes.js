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
conf(/async function planFiltrarPrazo\(valor\)/.test(html), 'o filtro passa por uma funcao so');
// A janela era de 400 e estourou em 24/08, quando o `window._planPag = 0` e o comentario
// dele entraram entre as duas linhas. Janela por tamanho mede o tamanho do comentario.
conf(/sel\.value = valor[\s\S]{0,900}await buscarPlan\(\)/.test(html),
     'que usa o select da tela, e nao uma segunda definicao de "vencida"');
// ⚠️ COM `await`: sem esperar, o scrollIntoView rodava sobre a lista ANTIGA e mirava uma
// altura que ia mudar meio segundo depois.
// ⚠️ E A ANCORA E `alvoEl.scrollIntoView`, A CHAMADA: o comentario acima do `await` cita
// "scrollIntoView" em prosa, e casar com a palavra solta media o comentario, nao o codigo.
conf(/await buscarPlan\(\)[\s\S]{0,700}alvoEl\.scrollIntoView/.test(html), 'e so rola DEPOIS de buscar');

// ⚠️ O BOTAO DA FAIXA VERMELHA APLICA O RECORTE QUE ELE PROMETE. Ate 19/08/2026 a faixa
// contava "vencidas ha MAIS DE UM ANO" e o clique filtrava `venc` — "todas as vencidas",
// outro conjunto. Filtrava mesmo (56 TRs -> 31 no acervo do Richard), mas o resultado nunca
// correspondia ao numero do botao, e nao havia como conferir se tinha funcionado.
// O `return` entrou em 24/08: sem ele a funcao nao devolve a promessa, e quem espera por ela
// mede a lista ANTIGA — foi o que fez um teste de bancada "reproduzir" um defeito que nao havia.
conf(/function planIrParaVencidas\(\) \{ return planFiltrarPrazo\('venc365'\) \}/.test(html),
     'o botao do passivo aplica venc365, e nao venc');
conf(/<option value="venc365">/.test(html), 'a opcao existe no select');
// A conta e a MESMA da rota alertas_prazo no servidor (dias > 365).
conf(/prazo === 'venc365' && !\(pa\.maxDias > 365\)/.test(html),
     'e usa a mesma conta do servidor: mais de 365 dias');

S('10d. UM BOTAO BUSCAR SO');
const filtros = html.slice(html.indexOf('id="plBusca"'), html.indexOf('btn-limpar" onclick="limparPlan'));
conf((filtros.match(/BTN_BUSCAR\('buscarPlan\(\)'\)/g) || []).length === 1,
     'um unico Buscar, e vindo do helper compartilhado');
conf(!/class="btn-buscar" onclick="buscarPlan\(\)"/.test(html),
     'a copia escrita a mao saiu — ela era a sexta versao de um botao que ja tem dono');

// ═════════════════════════════════════════════════════════════════════════════
S('11. NUMEROS DO SETORIAL — a faixa e os quatro cards (18/08/2026)');

// ⚠️ OS NUMEROS ESTAVAM DUPLICADOS: a faixa verde mostrava os MESMOS quatro dos cards logo
// abaixo — o mesmo dado, duas vezes, na mesma dobra. Quem le dois numeros iguais em lugares
// diferentes desconfia dos dois.
for (const id of ['d-bnParcelas', 'd-bnLivres', 'd-bnAnalise', 'd-bnRepo'])
  conf(!html.includes(id), `o numero ${id} saiu da faixa`);
conf(/id="d-bnAnalistas"/.test(html), 'a faixa ficou com a contagem de analistas');
conf(/id="d-frescorDot"/.test(html) && /id="d-frescorTxt"/.test(html),
     'e com o indicador de atualizacao');

S('11b. OS QUATRO CARDS, E O TOTAL POR ULTIMO');
conf(/const DASH_CARDS = \[/.test(html), 'as cores moram numa lista so');
for (const [ch, bg, fg] of [['baixadas', '#3B6D11', '#C0DD97'], ['analise', '#185FA5', '#B5D4F4'],
                            ['livres', '#5F5E5A', '#D3D1C7'], ['total', '#0F6E56', '#9FE1CB']])
  conf(new RegExp(`chave: '${ch}'[^\\n]*bg: '${bg}'[^\\n]*fg: '${fg}'`).test(html),
       `card ${ch}: fundo ${bg}, rotulo ${fg}`);
// ⚠️ O total e o DENOMINADOR, nao a noticia — por isso e o ultimo da lista.
const ordemDash = ['baixadas', 'analise', 'livres', 'total'].map(c => html.indexOf(`chave: '${c}'`));
conf(ordemDash.every((v, i) => i === 0 || v > ordemDash[i - 1]), 'e o total vem por ULTIMO');
conf(/font-size:36px;font-weight:500;color:#fff;line-height:1/.test(html),
     'mesma especificacao visual dos cards da Minha Planilha');

S('11c. NUMEROS VIVOS');
conf(/function dashShimmer\(\)/.test(html), 'ha shimmer enquanto busca');
conf(/@keyframes dashShine/.test(html), 'com o keyframe no CSS — nao da para animar em style inline');
conf(/function dashContarAte\(el, de, para\)/.test(html), 'o numero sobe contando');
conf(/1 - Math\.pow\(1 - p, 3\)/.test(html), 'com easing (easeOutCubic)');
conf(/dur = 700/.test(html), 'em ~700ms');
// ⚠️ requestAnimationFrame, e nao setInterval: o rAF para sozinho com a aba escondida.
conf(/requestAnimationFrame\(passo\)/.test(html), 'por requestAnimationFrame');
conf(/else el\.textContent = para\.toLocaleString/.test(html),
     'e o ultimo quadro crava o valor exato — easing chega perto, nao em cima');
conf(/carregando…/.test(html) && /atualizado agora/.test(html) && /sem conexão/.test(html),
     'o indicador tem os tres estados');

S('11d. O RELOGIO DE 60s PAUSA FORA DA ABA');
conf(/setInterval\(\(\) => \{ if\(!document\.hidden\) \{ carregarContadores\(\); carregarPainelDash\(\) \} \}, 60000\)/.test(html),
     'bate a cada 60s, e so com a aba visivel — cards E os dois blocos');
conf(/document\.addEventListener\('visibilitychange'/.test(html), 'e escuta a troca de aba');
conf(/if\(document\.hidden\) \{ dashRelogioParar\(\); return \}/.test(html),
     'para ao esconder a aba — sem isso sao 51 abas batendo no Railway a toa');
conf(/if\(id !== 'dash' && typeof dashRelogioParar/.test(html),
     'e morre ao SAIR do Dashboard');

S('11e. FALHA NAO ZERA O NUMERO');
// ⚠️ Zero e uma AFIRMACAO. Dizer "0 PCs baixadas" porque a rede caiu e mentir com cara de dado.
conf(/if\(el && DASH_ANIM\[c\.chave\] != null\) el\.textContent = DASH_ANIM/.test(html),
     'no erro, o ultimo numero bom fica na tela');
conf(/dashFrescor\('erro'\)/.test(html), 'e o indicador vai para "sem conexao"');
conf(/if\(alvoVal == null\) return/.test(html), 'sem dado, o card nao e reescrito');

S('11f. AS CINCO ACOES ATUALIZAM OS NUMEROS');
conf(/function dashAtualizar\(\)/.test(html), 'ha uma porta so para atualizar');
conf((html.match(/dashAtualizar\(\)/g) || []).length >= 6,
     'e as cinco acoes a chamam (parecer, C.I., corrigir, puxar, cadastrar)');

// ═════════════════════════════════════════════════════════════════════════════
S('12. PRODUTIVIDADE — o card grande do analista (18/08/2026)');

conf(/function prodCardGrande\(d\)/.test(html), 'o card grande existe');
// O analista vê UM card só, na largura toda; coordenador e superadmin seguem na grade.
conf(/if\(perfilEfetivo\(U\) === 'analista' \|\| verComoAtivo\(\)\) \{/.test(html),
     'o analista cai no card grande');
conf(/cont\.innerHTML = prodCardGrande\(dados\[0\]\)/.test(html), 'e vê so o dele');
conf(/function prodAbrirCard\(id\)/.test(html), 'coordenador e superadmin abrem pelo clique');
conf(/onclick="prodAbrirCard\(\$\{u\.id\}\)"/.test(html), 'o card pequeno leva ao grande');
conf(/Voltar à lista/.test(html), 'e ha caminho de volta');

S('12b. O CABECALHO');
// ⚠️ AS CORES VIRARAM VARIAVEIS EM 28/08/2026, e o teste passou a olhar a ORIGEM delas: o
// card do DISPENSADO e cinza (#4A544E) e o do analista em atividade continua verde (#173404).
// Fixar o literal no HTML do cabecalho recusaria a variacao que agora e o certo.
conf(/const cabBg = disp \? '#4A544E' : '#173404'/.test(html), 'fundo #173404, e #4A544E no dispensado');
conf(/const cabIni = disp \? '#6C7A72' : '#3B6D11'/.test(html), 'a inicial acompanha a cor do cabecalho');
conf(/width:44px;height:44px;border-radius:50%;background:\$\{cabIni\};color:#EAF3DE/.test(html),
     'circulo de 44px com as iniciais');
conf(/function prodIniciais\(nome\)/.test(html), 'e as iniciais saem do nome');
conf(/font-size:17px;font-weight:500;color:#fff/.test(html), 'nome 17px peso 500 branco');
conf(/Grupo \$\{grupo \|\| '—'\} · coordenação de/.test(html), 'grupo e coordenacao abaixo');
conf(/apurado às \$\{agora\}/.test(html), 'e o "apurado as HH:MM" a direita');

S('12c. O ANEL DA META');
conf(/const RAIO_ANEL = 52/.test(html), 'raio 52');
conf(/stroke-width="13"/.test(html), 'stroke-width 13');
conf(/stroke-linecap="round"/.test(html), 'linecap round');
conf(/stroke="var\(--surface-1, #E4EAE6\)"/.test(html), 'trilho var(--surface-1), com reserva');
conf(/stroke="#3B6D11"/.test(html), 'preenchimento #3B6D11');
conf(/transition:stroke-dashoffset 1\.1s cubic-bezier\(\.22,1,\.36,1\)/.test(html),
     'anima o dashoffset em 1,1s com a curva pedida');
// ⚠️ Nasce VAZIO e anima ate o valor: desenhar cheio e recuar faria o anel piscar.
conf(/stroke-dashoffset="\$\{VOLTA_ANEL\.toFixed\(2\)\}"/.test(html),
     'e nasce vazio — o CSS leva ate o alvo');
conf(/font-size="32" font-weight="500"/.test(html), 'percentual 32px peso 500 no centro');
conf(/da meta<\/text>/.test(html), 'com "da meta" abaixo');
conf(/font-size:30px;font-weight:500;color:#3B6D11/.test(html), 'o N das baixadas em 30px #3B6D11');

S('12d. META BATIDA OU FALTANDO');
conf(/Faltam \$\{faltam\} PC/.test(html), 'faixa ambar quando falta');
conf(/#FAEEDA;color:#633806/.test(html), 'nas cores ambar');
// ⚠️ ERA `baixadas - meta` ATE 27/08/2026, e mudou DE PROPOSITO: a meta passou a ser medida
// pela conta CONCILIADA com o SIGEF (`conta`), e nao por `status = 'baixada'`. Eram dois
// numeros diferentes — a regra escrita do projeto sempre disse `baixada OU enviado_ci`, e
// esta tela contava outra coisa. Ver `lib/sigef.js`, no sigpc-api.
conf(/Meta batida — \$\{conta - meta\} PC/.test(html), 'faixa verde quando bateu');
conf(/#EAF3DE;color:#27500A/.test(html), 'nas cores verdes');
// ⚠️ O aviso do Quadro 2 DESCEU do topo: ressalva longe do numero que ela explica nao e lida.
conf(/Quadro 2 do relatório CGE/.test(html), 'o aviso da CGE esta no card');
conf(/if\(carimbo\) carimbo\.style\.display = 'none'/.test(html),
     'e o carimbo solto do topo some para o analista');

S('12e. O CAMINHO DAS BAIXADAS');
conf(/Caminho das \$\{baixadas\} PC/.test(html), 'o titulo conta as baixadas');
conf(/#EAF3DE', '#27500A'\)/.test(html) || /'#EAF3DE', '#27500A'/.test(html), 'bloco 1 verde');
conf(/'#FAEEDA', '#633806'/.test(html), 'bloco 2 ambar');
conf(/'#E6F1FB', '#0C447C'/.test(html), 'bloco 3 azul');
conf(/const seta =/.test(html), 'com seta entre eles');
conf(/o passo 3 de 3 continua aberto/.test(html), 'a linha final quando falta encaminhar');
conf(/Todas as baixadas já foram encaminhadas ao Controle Interno/.test(html),
     'e a variante para zero');
// ⚠️ enviado_ci e' contado A PARTE do status: PC baixada pode ou nao ter ido ao C.I.
conf(/if\(p\.status==='baixada' && p\.enviado_ci===true\) s\.noCi\+\+/.test(html),
     'o "no C.I." conta sobre as baixadas, fora do else-if do status');

S('12f. SITUACAO E CASCATA');
conf(/const PROD_SIT = \[/.test(html), 'as quatro situacoes numa lista so');
for (const [ch, bg, fg] of [['analise', '#185FA5', '#B5D4F4'], ['dilig', '#BA7517', '#FAC775'],
                            ['reanalise', '#534AB7', '#CECBF6'], ['total', '#5F5E5A', '#D3D1C7']])
  conf(new RegExp(`chave: '${ch}'[^\\n]*bg: '${bg}'[^\\n]*fg: '${fg}'`).test(html),
       `situacao ${ch}: ${bg} / ${fg}`);
conf(/function prodAnimar\(\)/.test(html), 'ha a cascata');
conf(/roda\(meta, 0\); roda\(caminho, 260\); roda\(sit, 520\)/.test(html),
     'meta -> caminho -> situacao, nessa ordem');
// ⚠️ O MESMO contador do Dashboard. Dois contadores na mesma tela envelheceriam diferente.
conf(/dashContarAte\(el, 0, parseInt\(el\.dataset\.conta\)/.test(html),
     'e reusa o dashContarAte do Dashboard');

S('12g. ⚠️ O COORDENADOR VE OS TRES GRUPOS — MAS SO VE');
// A trava de VISAO saiu da tela.
conf(!/U\.perfil === 'coordenador' && String\(d\.grupo\) !== String\(U\.grupo/.test(html),
     'a trava de grupo saiu do filtro da Produtividade');
conf(/ISTO LIBERA A VISÃO, E SÓ A VISÃO/.test(html), 'e ficou escrito que e' + ' so a visao');
// ⚠️⚠️ E A DECISAO NAO FOI TOCADA. A tela nao decide nada: quem decide e' o servidor, e a
// regra continua sendo "coordenador DO GRUPO do analista". Se alguem afrouxar isso um dia,
// e' aqui e nos testes do sigpc-api que tem de quebrar.
// O bloco da Produtividade nao tem logica de decisao nenhuma — ele so filtra o que MOSTRAR.
// ⚠️ SEM AS LINHAS DE COMENTARIO. O bloco CITA `podeDecidir` de proposito, para dizer que
// nao a tocou — medir a palavra daria falso positivo justamente no comentario que explica a
// regra. Mede-se o CODIGO. E o mesmo erro que ja aconteceu com `_planDados` nesta suite.
const bProd = html.slice(html.indexOf('async function prodCarregar'),
                         html.indexOf('function prodAbrirCard'))
  .split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
conf(!/odeDecidir/.test(bProd), 'o bloco da Produtividade nao decide nada');
conf(!/analista_grupo/.test(bProd), 'e nao encosta na chave que a decisao usa');

// ⚠️⚠️ E O ESPELHO DA DECISAO NA FILA DE DEVOLUCAO CONTINUA PRESO AO GRUPO. Liberar a VISAO
// da Produtividade nao podia afrouxar isto — se um dia alguem tirar a comparacao de grupo
// daqui, um coordenador passa a decidir pedido de equipe que nao e a dele. A tranca de
// verdade e a do servidor (lib/solicitacao-correcao.js e lib/devolucao-pedido.js), e esta
// linha existe para o espelho da tela nao divergir dela em silencio.
conf(/function devPodeDecidir\(s\)/.test(html), 'o espelho da decisao existe');
conf(/String\(U\.grupo \?\? ''\) === String\(s\.analista_grupo \?\? ''\) && String\(U\.grupo \?\? ''\) !== ''/
     .test(html), 'e ele exige o MESMO grupo — intacto');
conf(/if\(proprio\) return false/.test(html), 'e o solicitante continua sem decidir o proprio');

// ═════════════════════════════════════════════════════════════════════════════
S('13. DASHBOARD — a faixa da FCEE e os dois blocos (18/08/2026)');

// ⚠️ A faixa dizia "FCEE / Setorial FCEE": a sigla duas vezes, e nenhuma diz o que a
// instituicao e. O quadrado branco existe porque o logo tem fundo claro e sumia no verde.
conf(/Fundação Catarinense de Educação Especial/.test(html), 'o nome por extenso na faixa');
// ⚠️ A LOGO TROCOU EM 18/08/2026: entrou a `logo-fcee-branca.png`, branco puro com canal
// alfa, e o quadrado branco de 56px SAIU junto. Ele so existia porque a `fcee.png` tem fundo
// claro proprio e sumia sobre o verde; com a branca transparente a moldura deixou de ter
// funcao e virava so uma caixa em volta da marca.
conf(/assets\/logos\/logo-fcee-branca\.png/.test(html), 'a logo branca transparente na faixa');
conf(/height:40px;width:auto/.test(html), 'com altura 40px e largura automatica');
const bFaixa = html.slice(html.indexOf('class="banner"'), html.indexOf('banner-nums'));
conf(!/width:56px;height:56px/.test(bFaixa), 'sem o quadrado branco de 56px');
conf(!/border-radius:12px/.test(bFaixa), 'sem borda arredondada em volta da logo');
conf(!/logos\/fcee\.png/.test(bFaixa), 'e a logo antiga saiu da faixa');
// A `fcee.png` continua viva no rodape da governanca — nao ficou orfa.
conf(/ft-lg"><img src="assets\/logos\/fcee\.png"/.test(html),
     'a fcee.png segue no rodape da governanca — nao ficou orfa');
conf(/font-size:18px;font-weight:500;color:#fff/.test(html), 'nome 18px peso 500 branco');
conf(/font-size:12px;color:#9FE1CB/.test(html), 'e "Setorial" em 12px #9FE1CB');
// A contagem de analistas e o indicador seguem na direita, do ciclo anterior.
conf(/id="d-bnAnalistas"/.test(html) && /id="d-frescorTxt"/.test(html),
     'a direita continua com analistas e indicador');

S('13b. OS DOIS BOTOES REDUNDANTES SAIRAM');
conf(!/>\s*SUA PRODUTIVIDADE\s*<\/button>/.test(html), 'o botao "SUA PRODUTIVIDADE" saiu');
conf(!/Estoque de TRs\s*<\/button>/.test(html), 'e o "Estoque de TRs" tambem');
// ⚠️ E O CSS DELES FOI JUNTO. `.btn-rap` sem nenhum elemento e' peso que ninguem revisa —
// conferido: zero usos da classe no HTML depois da remocao.
conf(!/^\.btn-rap\{/m.test(html), 'e a classe .btn-rap saiu do CSS');
conf(!/class="btns-rap"/.test(html), 'sem nenhum elemento orfao usando a classe');
conf(/id="dashPrecisa"/.test(html) && /id="dashCi"/.test(html), 'e os dois blocos ocuparam o lugar');
// ⚠️ Lado a lado onde couber, empilhados em tela estreita.
conf(/repeat\(auto-fit,minmax\(330px,1fr\)\)/.test(html), 'lado a lado, empilhando em tela estreita');

S('13c. BLOCO A — PRECISA DE VOCE');
conf(/const DASH_PRECISA = \[/.test(html), 'os quatro mini-cards numa lista so');
for (const [ch, bg, num, lbl] of [['falta_ci', '#FAEEDA', '#633806', '#854F0B'],
                                  ['dilig_vencendo', '#FCEBEB', '#791F1F', '#A32D2D'],
                                  ['pedidos', '#EEEDFE', '#26215C', '#3C3489'],
                                  ['ci_com_analista', '#E6F1FB', '#042C53', '#185FA5']])
  conf(new RegExp(`chave: '${ch}'[^\\n]*bg: '${bg}', num: '${num}', lbl: '${lbl}'`).test(html),
       `card ${ch}: ${bg} / ${num} / ${lbl}`);
conf(/icone:/.test(html), 'cada um com icone');
conf(/vai: 'irPlanilha\(\)'/.test(html) && /vai: 'irMeusPedidos\(\)'/.test(html),
     'e todos clicaveis, levando ao filtro correspondente');
// ⚠️ ZERO NAO SOME — vira cinza. Esconder faria o layout DANCAR a cada 60s.
conf(/const DASH_NEUTRO = /.test(html), 'ha um estado neutro');
conf(/const zero = n === 0/.test(html) && /\(n === null \|\| zero\) \? DASH_NEUTRO : c/.test(html),
     'e o zero vira cinza em vez de sumir');

S('13d. BLOCO B — SUAS PCs NO C.I.');
conf(/Suas PCs no Controle Interno/.test(html), 'o bloco existe');
for (const [rot, cor] of [['Aguardando análise', '#BA7517'], ['C.I. de acordo', '#3B6D11'],
                          ['Voltou com ressalvas', '#A32D2D']])
  conf(new RegExp(`rotulo: '${rot}'[^\\n]*cor: '${cor}'`).test(html), `barra "${rot}" em ${cor}`);
// ⚠️ A proporcao e sobre o MAIOR, nao sobre a soma: 1 de 20 daria uma barra de 5% invisivel.
conf(/const maior = Math\.max\(1, \.\.\.barras\.map/.test(html),
     'a barra compara com o MAIOR, nao com a soma');
conf(/A mais antiga está lá há/.test(html), 'a linha da mais antiga');
conf(/Espera média do setorial/.test(html), 'e a espera media do setorial');
conf(/Nenhuma PC sua está no Controle Interno agora/.test(html), 'com variante para o vazio');

S('13e. A TELA DEGRADA SE A ROTA NAO ESTIVER NO AR');
// ⚠️ O deploy do Railway estava atrasado quando isto foi escrito. Uma tela que quebra
// enquanto o servidor nao sobe e, para quem abre, uma tela quebrada.
conf(/DASH_PAINEL = null/.test(html), 'sem a rota, o painel fica null');
conf(/n === null \? '—' : n/.test(html), 'os numeros viram travessao');
conf(/dependem de uma atualização do servidor que ainda não subiu/.test(html),
     'e o bloco explica por que');
conf(/console\.warn\('painel do dashboard indisponivel/.test(html),
     'a falha e registrada, nao engolida');
// ⚠️ E nunca inventa zero: zero e uma AFIRMACAO.
conf(/nunca inventam zero/.test(html), 'e esta escrito que nao se inventa zero');

S('13f. DE ONDE VEM CADA NUMERO');
conf(/prestacoes_contas\/painel\?/.test(html), 'cinco numeros vem da rota nova');
// ⚠️ "pedidos aguardando" vem das DUAS filas, que ja sao recortadas pelo perfil no BANCO.
// Traze-lo pela rota nova seria uma segunda definicao de "meus pedidos", sem a guarda.
conf(/solicitacao_correcao\?usuario_id=\$\{id\}&status=pendente/.test(html),
     'e "pedidos" vem da fila de correcao');
conf(/solicitacao_devolucao\?usuario_id=\$\{id\}&status=pendente/.test(html),
     'somada a de devolucao — as duas com o recorte do servidor');
conf(/carregarPainelDash\(\)/.test(html), 'e o painel entra no ciclo de atualizacao');

// ═════════════════════════════════════════════════════════════════════════════
S('14. REPOSITORIO — a lista (18/08/2026)');

conf(/border-radius:11px;background:#0F6E56/.test(html.replace(/\n\s*/g, ' ')),
     'cabecalho com o quadrado #0F6E56');
conf(/id="repoSub"/.test(html) && /categoria' : 'categorias'/.test(html),
     'subtitulo com itens e categorias');
conf(/id="repoBusca"/.test(html), 'campo de busca');
conf(/\+ Adicionar<\/button>/.test(html), 'e o botao verde Adicionar');

S('14b. OS CHIPS');
conf(/Tudo \(\$\{_repoItens\.length\}\)/.test(html), 'chip "Tudo" com contador');
conf(/background:\$\{tudoOn \? '#173404'/.test(html), 'ativo por padrao em #173404');
conf(/border:1\.5px dashed var\(--cl\)/.test(html), 'chip tracejado de nova categoria');
conf(/function repoAbrirCategoria\(\)/.test(html), 'que abre o modal');
conf(/id="rcPaleta"/.test(html), 'com paleta de cores');
// ⚠️ PALETA FECHADA: as TRES cores de uma categoria tem de combinar entre si.
conf(/const REPO_PALETA = \[/.test(html), 'e a paleta e fechada, nao seletor livre');

S('14c. OS CARTOES');
conf(/grid-template-columns:repeat\(auto-fill,minmax\(230px,1fr\)\);gap:10px/.test(html),
     'grid minmax(230px,1fr) gap 10');
conf(/border-left:3px solid \$\{c\.cor\}/.test(html), 'borda esquerda de 3px na cor');
conf(/border-radius:0 12px 12px 0/.test(html), 'raio 0 12 12 0');
conf(/width:32px;height:32px;border-radius:8px;background:\$\{c\.cor_bg\}/.test(html),
     'icone em quadrado 32px no fundo claro');
conf(/font-size:13\.5px;font-weight:500/.test(html), 'titulo 13.5px peso 500');
conf(/font-size:10\.5px;color:#9AA8A0/.test(html), 'rodape com quem adicionou e data em 10.5px');
// ⚠️ O ALFINETE E SVG. O emoji 📌 e vermelho em todo sistema e nao aceita cor — o Richard
// pediu AMBAR. E a mesma razao pela qual `planAlfinete` ja e SVG, e ha teste no painel que
// falha se um 📌 for renderizado.
conf(/fill:#BA7517/.test(html), 'alfinete ambar');
conf(!/>📌</.test(html), 'e em SVG, nao emoji');
// Fixados primeiro DENTRO da categoria.
conf(/\(b\.fixado === true\) - \(a\.fixado === true\)/.test(html), 'fixados aparecem primeiro');

S('14d. O TIPO SAI DA URL');
conf(/function repoTipoDe\(url\)/.test(html), 'ha deteccao de tipo');
for (const [re, rot] of [[/docs\\\.google\\\.com\\\/document/, 'Docs'],
                         [/docs\\\.google\\\.com\\\/spreadsheets/, 'Sheets'],
                         [/drive\\\.google\\\.com\\\/drive\\\/folders/, 'pasta'],
                         [/\\\.pdf/, 'PDF']])
  conf(re.test(html), `reconhece ${rot}`);
conf(/REPO_TIPOS/.test(html), 'e os icones moram numa lista so');

S('14e. NUNCA ESCONDIDO — "Sem categoria"');
// ⚠️ 2 dos 4 itens estao com categoria NULA no banco. O Richard pediu que aparecessem numa
// categoria cinza, nunca escondidos — e o dado NAO foi reescrito.
conf(/const REPO_SEM_CAT = 'Sem categoria'/.test(html), 'ha a categoria neutra');
conf(/\(item\?\.categoria \|\| ''\)\.trim\(\) \|\| REPO_SEM_CAT/.test(html),
     'nulo e vazio caem nela');
conf(/#5F5E5A/.test(html), 'em cinza');

S('15. REPOSITORIO — o visualizador');
conf(/async function irRepoVer\(id\)/.test(html), 'a tela existe');
// ⚠️ SUBSTITUI a area de conteudo — nao e modal nem aba nova.
conf(/irRepoVer[\s\S]{0,600}getElementById\('BODY'\)\.innerHTML/.test(html),
     'e substitui o BODY, nao abre modal');
conf(/ativarMenu\('repo'\)[\s\S]{0,900}◀ Repositório/.test(html),
     'com o menu lateral vivo e o botao de volta');
conf(/flex:0 0 190px/.test(html), 'coluna esquerda de 190px');
conf(/function repoIndice\(atualId\)/.test(html), 'com o indice de todos os itens');
conf(/border-left:3px solid \$\{on \? c\.cor : 'transparent'\}/.test(html),
     'e o atual destacado com borda colorida');

S('15b. OS DOIS ESTADOS DO DOCUMENTO');
conf(/function repoEhDrive\(url\)/.test(html), 'ha deteccao de Drive');
// ⚠️ POR DOMINIO, e nunca por tentativa e erro: o navegador NAO entrega ao JavaScript o erro
// de um site que recusa ser embutido. O onload dispara igual e o onerror nao vem.
conf(/new URL\(String\(url\)\)\.hostname/.test(html), 'pelo DOMINIO do link');
conf(/h === 'drive\.google\.com' \|\| h === 'docs\.google\.com'/.test(html), 'drive e docs');
conf(/function repoDriveEmbed\(url\)/.test(html), 'e converte para o endereco de visualizacao');
conf(/\/preview/.test(html), 'usando /preview, nao /edit');
conf(/embeddedfolderview/.test(html), 'e a visao propria de pasta');
conf(/<iframe src="\$\{escHtml\(repoDriveEmbed/.test(html), 'o Drive vai para iframe');
// A tela de bloqueio.
conf(/Este site não permite exibição dentro do SIGPC/.test(html), 'e o resto cai no bloqueio');
conf(/Não é erro do repositório/.test(html),
     'que diz que a recusa e do site de origem, nao defeito do repositorio');
conf(/Abrir em nova aba/.test(html), 'com botao azul de nova aba');
conf(/function repoDominio\(url\)/.test(html), 'e o dominio embaixo, em cinza');

S('16. REPOSITORIO — permissoes');
conf(/function repoPodeEditar\(\)/.test(html), 'ha uma porta so para "pode mexer"');
conf(/pe === 'superadmin' \|\| pe === 'coordenador'/.test(html), 'superadmin e coordenador');
// ⚠️ perfilEfetivo, e nao U.perfil: no papel analista o superadmin tambem perde os botoes.
conf(/const pe = perfilEfetivo\(U\)[\s\S]{0,120}pe === 'superadmin'/.test(html),
     'pelo perfilEfetivo, nao pelo perfil do cadastro');
conf(/\$\{pode \? `<button class="btn-acao" title="Editar"/.test(html),
     'e os botoes nem sao desenhados para quem nao pode');
// ⚠️ E A TELA NAO E A TRAVA. A tranca esta no servidor.
conf(/esconder botão NÃO é a trava|Esconder botão na tela|esconder botão nunca foi a trava/i.test(html),
     'com o aviso de que esconder botao nao e a trava');
// O DELETE mandava `perfil`, que a rota ignora desde 14/08 — toda exclusao levava 403.
conf(/JSON\.stringify\(\{ usuario_id: U\.id \}\)/.test(html),
     'o excluir manda usuario_id, e nao mais perfil');

// ═════════════════════════════════════════════════════════════════════════════
S('17. CONTROLE INTERNO — a tela mudou de unidade (25/08/2026)');

// ⚠️ AS SEÇÕES 17 A 17e MUDARAM DE ARQUIVO, e não sumiram. Elas cobriam o painel por TR de
// 18/08 — cabeçalho, cards, filtros, agrupamento por TR e o cartão de decisão da PARCELA.
// Em 25/08 o Richard trocou a unidade: o Controle Interno trabalha por PC, e a tela inteira
// foi reescrita. As checagens equivalentes vivem agora em `teste_front_ci_fila.js`, que é a
// suíte da tela do C.I.
//
// O que fica aqui são as três garantias que ATRAVESSAM a mudança — as que valeriam qualquer
// que fosse a unidade, e que por isso não podem morar só na suíte da tela nova.

// ⚠️ O AGRUPAMENTO POR TR SAIU INTEIRO. Enquanto `ciGrupos` existisse, a tela teria duas
// respostas para "qual é a unidade do C.I." — e um dia alguém chamaria a errada.
conf(!/function ciGrupos\(\)/.test(html), 'o agrupamento por TR saiu do index.html');
conf(!/irCIFila\(\)/.test(html), 'e a Fila de trabalho por TR tambem');
conf(!html.includes('${API_URL}' + '/ci/tr/'), 'nenhuma CHAMADA as rotas por TR sobrou');

// ⚠️ A BAIXA NUNCA É TOCADA PELA TELA. É a regra que o ciclo do C.I. inteiro protege, e ela
// não depende de a unidade ser a TR ou a PC: nem a decisão, nem a devolução à fila, nem o
// passar a outro mexem em `baixada`, `data_baixa` ou `enviado_ci`.
{
  const ini = html.indexOf('//  CONTROLE INTERNO — POR PC');
  const fim = html.indexOf('Encaminha a PARCELA ao Controle Interno, do detalhe da TR.');
  conf(ini > 0 && fim > ini, 'o bloco do C.I. foi localizado');
  const bloco = html.slice(ini, fim).split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  // ⚠️ LER `data_baixa` PARA MOSTRAR "Baixada em" É O CONTRÁRIO DE tocar nela — o técnico
  // precisa saber quando a analista baixou. O que não pode existir é a tela MANDANDO qualquer
  // uma das três de volta ao servidor, que é o que este recorte procura.
  const enviado = (bloco.match(/body: JSON.stringify([^)]*)/g) || []).join(' | ');
  conf(!/baixada|data_baixa|enviado_ci/.test(enviado),
       'a tela do C.I. nunca ENVIA baixada, data_baixa nem enviado_ci');
  conf(bloco.includes("'Baixada em', l.data_baixa"), 'e a data da baixa e so LIDA, para o cartao');
}

// ⚠️ E DECIDIR CONTINUA SENDO DO TÉCNICO. No modo "agir pela conta de", o superadmin lê a
// tela e não decide por ninguém — a mesma trava que `ciDecidir` tinha, agora em `ciConfirmar`.
conf(/function ciConfirmar\(codigo_pc\)[\s\S]{0,200}if\(verComoAtivo\(\)\)/.test(html),
     'ciConfirmar recusa no modo "agir pela conta de"');

// ═════════════════════════════════════════════════════════════════════════════
S('18. AGIR PELA CONTA DE — a busca quebrada (19/08/2026)');

// ⚠️ O DEFEITO, e por que ele era invisivel:
//     termoBusca(u.nome).includes(b) || soDigitos(u.cpf).includes(soDigitos(b))
// Digitando um NOME, soDigitos(b) vira string VAZIA — e "11122233344".includes("") e TRUE.
// O segundo lado do OU passava para TODO MUNDO, e a lista voltava inteira. Buscar "zzzzz"
// devolvia os 46. So funcionava por CPF, e por acidente.
conf(/const bDig = soDigitos\(bruto\)/.test(html), 'os digitos do termo sao extraidos a parte');
conf(/return !!bDig && soDigitos\(u\.cpf\)\.includes\(bDig\)/.test(html),
     'e o CPF so e comparado quando ha digitos — o conserto');
// ⚠️ SEM AS LINHAS DE COMENTARIO: o codigo CITA a comparacao velha de proposito, para
// registrar o defeito. Medir a string crua da falso positivo no comentario que a explica —
// e' o terceiro caso deste padrao nesta suite (ver `_planDados` e `podeDecidir`).
const vcSoCodigo = html.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
conf(!/soDigitos\(u\.cpf\)\.includes\(soDigitos\(b\)\)/.test(vcSoCodigo),
     'a comparacao velha, que casava com tudo, sumiu do codigo');
// Sem acento e sem maiuscula: `termoBusca` ja fazia isso, e continua no caminho do nome.
conf(/termoBusca\(u\.nome\|\|''\)\.includes\(b\)/.test(html), 'nome continua sem acento e sem caixa');

S('18b. O CABECALHO E OS FILTROS');
conf(/border-radius:11px;background:#3C3489/.test(html.replace(/\n\s*/g, ' ')),
     'olho em quadrado #3C3489');
conf(/fill:#CECBF6/.test(html), 'com o icone em #CECBF6');
conf(/O trabalho fica <strong>no nome dela<\/strong>/.test(html),
     'e o texto mantem a garantia em destaque');
conf(/id="vcOrdem"/.test(html), 'ordenar por');
for (const o of ['Menor produtividade', 'Mais PCs paradas', 'Sem acesso há mais tempo'])
  conf(html.includes(o), `opcao "${o}"`);
conf(/id="vcSit"/.test(html), 'filtro de situacao');
conf(/surface-2/.test(html), 'a linha de filtros em bloco var(--surface-2)');

S('18c. OS CHIPS');
conf(/function verComoChip\(c\)/.test(html), 'os chips filtram');
conf(/mk\('todos','Todos',cont\.todos\)/.test(html), 'chip Todos');
conf(/#FCEBEB','#A32D2D'\)/.test(html), 'chip "Com pendencia" em vermelho');
conf(/#E1F5EE','#0F6E56'\)/.test(html), 'chip "Online" em verde');
// ⚠️ Os contadores contam sobre a lista JA filtrada por busca e situacao — senao o numero
// do chip nao bateria com o que ele mostra ao ser clicado.
conf(/todos: lista\.length/.test(html), 'e contam sobre a lista ja filtrada');

S('18d. A LINHA DO ANALISTA');
conf(/function vcLinha\(u, i\)/.test(html), 'a linha existe, e recebe o indice para a zebra');
// ⚠️ TAMANHOS SUBIRAM em 19/08/2026 — a tela tinha ficado pequena demais para ser lida.
conf(/flex:0 0 44px;width:44px;height:44px/.test(html), 'avatar de 44px');
// ⚠️ A FOTO passou a ser usada: `foto_base64` JA vinha em GET /usuarios e a tela so mostrava
// as iniciais — o `onlineAvatar` usa desde sempre. Quem nao tem continua nas iniciais.
conf(/u\.foto_base64/.test(html), 'com a foto de quem tem uma cadastrada');
conf(/object-fit:cover/.test(html), 'cortada em circulo');
conf(/prodIniciais\(u\.nome\)/.test(html), 'e as iniciais para quem nao tem');
conf(/width:10px;height:10px;border-radius:50%;background:#0F6E56/.test(html),
     'bolinha verde de 10px quando online');
conf(/font-size:15px;font-weight:500;color:var\(--te\)/.test(html), 'nome 15px peso 500');
conf(/font-size:12px;color:var\(--ct\);">\s*\$\{u\.grupo/.test(html), 'contexto abaixo em 12px');
conf(/flex:0 0 130px/.test(html), 'coluna de meta com 130px');
conf(/p <= 30 \? '#BA7517' : p <= 70 \? '#639922' : '#3B6D11'/.test(html),
     'a barra muda de cor por faixa');
conf(/height:7px;background:var\(--cl\)/.test(html), 'barra com 7px de altura');
conf(/font-size:14px;font-weight:500;color:var\(--te\);">\$\{bx\}/.test(html),
     'numero da meta em 14px peso 500');
conf(/font-size:12px;color:var\(--ct\);"> \/ \$\{meta/.test(html), 'o "/ meta" em 12px cinza');
conf(/font-weight:500;font-size:13px;">\$\{p == null/.test(html), 'e o percentual em 13px peso 500');
conf(/font-size:12px;\s*font-weight:700;padding:4px 11px/.test(html),
     'etiquetas em 12px com padding 4px 11px');
conf(/faltam ir ao C\.I\./.test(html) && /vencidas/.test(html), 'etiquetas de pendencia real');
conf(/em análise/.test(html) && /no C\.I\./.test(html), 'e as informativas');
conf(/meta batida/.test(html), 'e "meta batida" para quem bateu');
conf(/flex:0 0 130px;background:#3C3489;color:#fff/.test(html), 'botao #3C3489 com 130px');
conf(/font-size:13px;padding:9px;/.test(html), 'fonte 13px e padding 9px');

S('18d-2. ZEBRA, DIVISORIA E CABECALHO DE COLUNA');
// ⚠️ Zebra por INDICE, e nao `:nth-child` — as linhas saem de um `map` num template literal,
// nao ha folha de estilo para elas.
conf(/const fundo = \(i % 2 === 0\)/.test(html), 'linhas alternadas por indice');
conf(/#F2F8EC/.test(html), 'as pares no verde bem claro');
conf(/border-bottom:0\.5px solid var\(--cl\)/.test(html), 'com divisoria de 0.5px entre todas');
conf(/background:#173404;display:flex;gap:11px;padding:9px 15px/.test(html),
     'cabecalho de coluna em faixa #173404');
conf(/color:#C0DD97;font-weight:700/.test(html), 'com os rotulos em #C0DD97');
conf(/font-size:11\.5px;\s*text-transform:uppercase/.test(html), 'em 11.5px maiusculo');
// ⚠️ O `overflow:hidden` e o que faz a faixa e a primeira linha respeitarem o raio.
conf(/border-radius:12px;overflow:hidden/.test(html), 'e a tabela com raio 12 e overflow hidden');
conf(/Agir por \$\{vcPronome\(u\)\}/.test(html), 'com "Agir por ela/ele"');
// ⚠️ Nao ha coluna `genero` em usuarios — deduzir do nome erraria em nome ambiguo.
conf(/O CADASTRO NÃO GUARDA GÊNERO/.test(html), 'e o porque do padrao esta escrito');

S('18e. OS ESTADOS DA LINHA');
conf(/border-left:3px solid #A32D2D/.test(html), 'com pendencia: borda esquerda vermelha');
// ⚠️ O RAIO POR LINHA SAIU EM 19/08/2026, e nao por descuido: com a zebra e o cabecalho em
// faixa, as linhas deixaram de ser cartoes separados e viraram uma tabela continua. O raio
// agora e do CONTEINER (12px + overflow:hidden), e um raio por linha dentro dele nao apareceria
// — ou pior, cortaria a barra vermelha da pendencia no meio.
conf(!/temPend \? '0 var\(--radius/.test(html), 'o raio por linha saiu — a tabela e continua');
conf(/border-radius:12px;overflow:hidden/.test(html), 'e o raio e do conteiner');
conf(/ferias \? 'opacity:\.7;' : ''/.test(html), 'ferias: opacidade .7');
conf(/etiq\('férias', '#EEEDFE', '#3C3489'\)/.test(html), 'e etiqueta ao lado do nome');

S('18f. DE ONDE VEM CADA DADO');
// ⚠️ FERIAS SAEM DA MESMA FONTE DA TELA "Ferias e Afastamentos" — decisao do Richard. Uma
// segunda fonte divergiria da primeira no dia em que alguem corrigisse uma data so de um lado.
conf(/API_URL\}\/afastamentos/.test(html), 'ferias vem de /afastamentos, a mesma tela de Ferias');
conf(/function vcFerias\(u\)/.test(html), 'com o afastamento em curso por data civil');
conf(/painel_equipe/.test(html), 'os numeros vem da rota nova painel_equipe');
conf(/metas_analistas\?vigente=true/.test(html), 'a meta vem das metas vigentes');
// ⚠️ Online REUSA `_online`, que vem da rota onde a regra mora: "ativo ha menos de 30 min E
// nao encerrou a sessao depois". Recalcular por ultimo_acesso repetiria so a metade facil.
conf(/function estaOnline\(u\)/.test(html), 'e online reusa a lista do servidor');
conf(/_online[\s\S]{0,120}some\(o => String\(o\.id\) === String\(u\.id\)\)/.test(html),
     'sem recalcular por ultimo_acesso');








// ⚠️ O RESUMO FICA NO FIM DO ARQUIVO, e nao no meio. Em 18/08/2026 um bloco novo foi
// acrescentado DEPOIS destas duas linhas: as assercoes rodavam, imprimiam OK, e nao
// entravam na contagem nem no exit code — uma falha ali passaria despercebida. Teste
// que nao conta e pior que teste que nao existe, porque parece cobertura.
console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;