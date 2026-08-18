// CAMINHO: sigpc-gt/teste_front_menu.js
//
// Testes do MENU LATERAL em três blocos, extraindo `SB_BLOCOS`, `SB_ITENS` e `sbMontar`
// do próprio index.html. Sem navegador, sem rede, sem login.
//
// ⚠️ O QUE ESTES TESTES PROTEGEM
//
// **O menu não pode mostrar tela que a pessoa não abre, nem esconder tela que ela abre.**
// Os dois erros existiam antes de 12/08: Produtividade e Relatórios estavam na seção
// "Coordenação" e qualquer analista abre as duas — e o Dashboard ainda tinha um botão
// rápido para a Produtividade, ou seja, o analista já chegava lá por fora do menu.
//
// Por isso a suíte confere, item a item, que a regra do MENU é a mesma regra que a TELA
// aplica ao abrir. A tabela `GUARDA_REAL` abaixo foi lida do código em 12/08, função por
// função — não deduzida pelo nome.
//
// USO: node teste_front_menu.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('const SB_BLOCOS = [');
const fim = html.indexOf('function renderSB()');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei a declaracao do menu no index.html.');
  process.exit(1);
}
const ctx = { console };
vm.createContext(ctx);
// ⚠️ `const` NAO vira propriedade do contexto do vm — só declaração de função vira. Por
// isso os ajudantes vão concatenados no MESMO script: assim eles enxergam as constantes
// pelo escopo léxico. É a armadilha registrada no SESSAO.md.
vm.runInContext(html.slice(ini, fim) + `
function _blocos(){ return SB_BLOCOS }
function _itens(){ return SB_ITENS }
`, ctx);
const { sbMontar, _blocos, _itens } = ctx;
const SB_BLOCOS = _blocos();
const SB_ITENS  = _itens();

const analista = { id: 1, perfil: 'analista' };
const coord    = { id: 2, perfil: 'coordenador' };
// ⚠️ O superadmin tem DOIS PAPEIS desde 14/08/2026, e o menu obedece ao papel ATIVO. Sem
// `papelAtivo`, `perfilEfetivo` cai no padrao — que e 'analista', e e o padrao ao entrar.
const superad  = { id: 3, perfil: 'superadmin', papelAtivo: 'tecnico' };
const superAn  = { id: 3, perfil: 'superadmin', papelAtivo: 'analista' };
const ci       = { id: 4, perfil: 'controle_interno' };

const idsDe = (u) => sbMontar(u).flatMap(b => b.itens.map(i => i.id));
const blocosDe = (u) => sbMontar(u).map(b => b.id);

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

console.log('\n═══ 1. TRES BLOCOS, E CADA PERFIL VE OS DE BAIXO ═══');
{
  conf(SB_BLOCOS.length === 3, 'existem tres blocos', String(SB_BLOCOS.length));
  conf(JSON.stringify(blocosDe(analista)) === '["analista"]',
       'analista ve so o bloco dele', JSON.stringify(blocosDe(analista)));
  conf(JSON.stringify(blocosDe(coord)) === '["analista","coordenacao"]',
       'coordenador ve o dele E o do analista', JSON.stringify(blocosDe(coord)));
  conf(JSON.stringify(blocosDe(superad)) === '["analista","coordenacao","superadmin"]',
       'superadmin ve os tres', JSON.stringify(blocosDe(superad)));
  // A ordem importa: o bloco de baixo vem primeiro, porque é o mais usado.
  conf(blocosDe(superad)[0] === 'analista', 'o bloco mais usado vem primeiro');
}

console.log('\n═══ 2. A REGRA DO MENU E A MESMA DA TELA ═══');
{
  // Lida do index.html em 12/08, funcao por funcao. Se alguma tela mudar de regra, este
  // teste falha e obriga a mexer nas duas.
  const GUARDA_REAL = {
    dash:'todos', perfil:'todos',
    // ⚠️ Estas cinco ganharam guarda em 12/08 contra `controle_interno`: o tecnico do C.I.
    // nao trabalha o acervo, e de Estoque se assume TR. Tirar do menu sem por a guarda
    // repetiria o defeito do Relatorios.
    est:['analista','coordenador','superadmin'],
    plan:['analista','coordenador','superadmin'],
    prod:['analista','coordenador','superadmin'],
    repo:['analista','coordenador','superadmin'],
    meuspedidos:['analista','coordenador','superadmin'],
    // irRel GANHOU guarda em 12/08: a tela e de coordenacao, e antes abria para qualquer um.
    rel:['coordenador','superadmin'],
    // ⚠️ SO SUPERADMIN desde 18/08/2026 — era ['analista','coordenador','superadmin'].
    // O estorno em lote e o caminho SEM RASTRO: grava motivo_estorno na PC, mas nao abre
    // linha em parcela_historico. Analista e coordenador passam pelo "Corrigir situacao",
    // que desfaz a mesma baixa com motivo obrigatorio e trilha.
    estornar:['superadmin'],
    board:['coordenador','superadmin'],
    coord:['coordenador','superadmin'],
    aprov:['coordenador','superadmin'],
    afast:['coordenador','superadmin'],
    estlog:['coordenador','superadmin'],
    faixa:['coordenador','superadmin'],
    recado:['coordenador','superadmin'],
    admin:['coordenador','superadmin'],
    prior:['superadmin'],
    config:['superadmin'],
  };
  const PERFIS = ['analista','coordenador','superadmin','controle_interno'];

  Object.entries(GUARDA_REAL).forEach(([id, regra]) => {
    const itens = SB_ITENS.filter(i => i.id === id && i.bloco !== 'analista' || (i.id === id && i.bloco === 'analista'));
    const item = SB_ITENS.find(i => i.id === id);
    if (!item) { conf(false, `item '${id}' existe no menu`); return; }
    const erra = PERFIS.filter(p => {
      // O superadmin e testado no papel TECNICO: e nele que as telas de superadmin existem.
      const veNoMenu = idsDe({ id: 9, perfil: p, papelAtivo: 'tecnico' }).includes(id);
      const podeNaTela = regra === 'todos' ? true : regra.includes(p);
      return veNoMenu !== podeNaTela;
    });
    conf(erra.length === 0, `'${id}' aparece exatamente para quem pode abrir`,
         erra.length ? `diverge em: ${erra.join(', ')}` : '');
  });
}

console.log('\n═══ 2b. O PAPEL ATIVO MANDA NO MENU ═══');
{
  // ⚠️ 12 itens somem no papel analista. E uma regra so — o menu recebe o usuario com o
  // perfil EFETIVO — porque um `pode:` que eu esquecesse de ajustar seria justamente o que
  // deixaria a Busca global a vista.
  // Sao 15, e nao 12: alem dos 12 que o Richard listou, somem tambem a 'prior' (Prioridades)
  // e a 'config' (Configuracoes) — as duas ja eram so-superadmin, e no papel analista elas
  // caem pela mesma regra, sem excecao escrita a mao.
  // ⚠️ E a 15a entrou em 18/08/2026: 'estornar' (Estornar Baixa) passou a ser so-superadmin,
  // porque o estorno em lote nao deixa linha em parcela_historico. Quem precisa desfazer uma
  // baixa usa "Corrigir situacao", que tem motivo obrigatorio e trilha.
  const SOMEM = ['board','rel','vercomo','coord','aprov','afast','estlog','ci','faixa','recado',
                 'admin','bglobal','prior','config','estornar'];
  const comoTec = idsDe(superad);
  const comoAn  = idsDe(superAn);

  SOMEM.forEach(id => {
    conf(comoTec.includes(id) && !comoAn.includes(id),
         `'${id}' aparece no tecnico e SOME no analista`,
         `tec=${comoTec.includes(id)} an=${comoAn.includes(id)}`);
  });
  conf(comoTec.length - comoAn.length === SOMEM.length,
       `somem exatamente ${SOMEM.length} itens`, `sumiram ${comoTec.length - comoAn.length}`);

  // O que FICA e a carteira do analista, e e igual a de um analista de verdade.
  conf(JSON.stringify(comoAn) === JSON.stringify(idsDe(analista)),
       'no papel analista o menu e IGUAL ao de um analista');

  // ⚠️ Sem `papelAtivo`, cai no padrao — que e analista, o padrao ao entrar.
  conf(JSON.stringify(idsDe({ id: 3, perfil: 'superadmin' })) === JSON.stringify(comoAn),
       'sem papelAtivo, o padrao e analista');

  // E papelAtivo em quem NAO e superadmin nao da poder nenhum.
  conf(JSON.stringify(idsDe({ id: 1, perfil: 'analista', papelAtivo: 'tecnico' })) === JSON.stringify(idsDe(analista)),
       'papelAtivo num analista nao abre nada');
}

console.log('\n═══ 2c. A CAIXA DO PAPEL E O CABECALHO ═══');
{
  const iC = html.indexOf('function papelCaixa()');
  const bC = html.slice(iC, html.indexOf('function papelFaixa()'));

  // ⚠️ A BARRA E VERDE ESCURO (#00512D). As cores da paleta clara sumiam nela — o bloco
  // nasceu ILEGIVEL, e foi o Richard quem viu na tela, nao o teste.
  // ⚠️ So o CODIGO conta: o comentario do proprio bloco CITA `var(--v)` para explicar por que
  // nao usa-lo, e a primeira versao deste teste reprovou a si mesma por causa disso.
  const codigoC = bC.replace(/\/\/[^\n]*/g, '');
  conf(!/var\(--am\)|var\(--v\)|var\(--ct\)/.test(codigoC),
       'a caixa NAO usa cor da paleta clara sobre o verde escuro');
  conf(/#FFD98A/.test(bC) && /#C4E6D3/.test(bC), 'usa as cores que se leem na barra');
  conf(/color:#93D2B0/.test(bC), 'e o subtexto na cor dos rotulos da barra');
  conf(/background:#fff;color:#00512D/.test(bC), 'o botao e branco solido — o maior contraste ali');

  // O cabecalho mostra o PAPEL ATIVO, nao o perfil do cadastro.
  const iR = html.indexOf('function rotuloPerfil()');
  const bR = html.slice(iR, iR + 420);
  conf(/TÉCNICO DO SISTEMA/.test(bR), 'o cabecalho diz TECNICO DO SISTEMA no papel tecnico');
  conf(/'ANALISTA'/.test(bR), 'e ANALISTA no papel analista');
  // Escopado ao cabecalho: 'SUPERADMIN' continua existindo no Painel ADMIN, onde e o
  // rotulo do PERFIL cadastrado — e ali esta certo.
  conf(!/SUPERADMIN/.test(bR), 'a palavra SUPERADMIN saiu do cabecalho');

  // ⚠️ Sem repintar na troca, o cabecalho ficaria dizendo o papel anterior.
  const iT = html.indexOf('async function papelTrocar(');
  const bT = html.slice(iT, iT + 2200);
  conf(/atualizarCabecalhoPerfil\(\)/.test(bT), 'e a troca REPINTA o cabecalho');
}

console.log('\n═══ 3. PRODUTIVIDADE: DESCEU E FICOU ═══');
{
  // Estava em "Coordenação" e o analista abre. O menu escondia o que a pessoa alcançava
  // por outro caminho — a Produtividade tem botão no proprio Dashboard.
  conf(idsDe(analista).includes('prod'), 'PRODUTIVIDADE aparece para o analista');
  conf(SB_ITENS.find(i=>i.id==='prod').bloco === 'analista', 'e mora no bloco do analista');
  // ⚠️ ESTE TESTE CASAVA A REDACAO — "Produtividade (NL)" — e quebrou quando o Richard
  // renomeou o botao para "SUA PRODUTIVIDADE" em 16/08/2026, sem que nada tivesse sumido.
  // O que ele quer provar e que o CAMINHO existe, nao como o botao se chama. O rotulo em si
  // e conferido no `teste_front_faixa.js`, num lugar so.
  conf(/onclick="irProd\(\)"[\s\S]{0,400}?<\/button>/.test(html),
       'o botao rapido do Dashboard continua la, e o menu concorda com ele');
}

console.log('\n═══ 3b. RELATORIOS: VOLTOU PARA A COORDENACAO, COM GUARDA ═══');
{
  conf(SB_ITENS.find(i=>i.id==='rel').bloco === 'coordenacao', 'mora no bloco da coordenacao');
  conf(!idsDe(analista).includes('rel'), 'NAO aparece para o analista');
  conf(idsDe(coord).includes('rel'), 'aparece para o coordenador');
  conf(idsDe(superad).includes('rel'), 'e para o superadmin');
  // ⚠️ O que importa: tirar do menu SEM por a guarda deixaria a tela alcancavel por quem
  // soubesse o caminho — a mesma incoerencia que a reorganizacao veio corrigir.
  conf(/function irRel\(\)\s*\{[\s\S]{0,400}?if\(!\['coordenador','superadmin'\]\.includes\(U\.perfil\)\)[\s\S]{0,120}?return \}/.test(html),
       'IR REL TEM GUARDA DE ENTRADA — nao basta sumir do menu');
  // E a guarda vem antes de qualquer coisa que a tela desenhe.
  const i = html.indexOf('function irRel()');
  const bloco = html.slice(i, i + 700);
  conf(bloco.indexOf('U.perfil') < bloco.indexOf('ativarMenu'),
       'e a guarda vem ANTES de a tela comecar a montar');
}

console.log('\n═══ 4. PAINEL ADMIN — NAO E ITEM DE SUPERADMIN ═══');
{
  // `irAdmin` aceita coordenador e superadmin. O que confunde e o rotulo.
  const admin = SB_ITENS.find(i => i.id === 'admin');
  conf(admin.bloco === 'coordenacao', 'mora no bloco da coordenacao, nao no de superadmin');
  conf(idsDe(coord).includes('admin'), 'e o coordenador o ve');
  conf(typeof admin.rotulo === 'function', 'o rotulo muda conforme o perfil');
  conf(admin.rotulo(superad) === 'Painel ADMIN', 'superadmin le "Painel ADMIN"');
  conf(admin.rotulo(coord) === 'Gestão de Usuários', 'coordenador le "Gestão de Usuários"');
}

console.log('\n═══ 5. SO O SUPERADMIN ═══');
{
  ['prior','config'].forEach(id => {
    conf(idsDe(superad).includes(id), `'${id}' aparece para o superadmin`);
    conf(!idsDe(coord).includes(id), `'${id}' NAO aparece para o coordenador`);
    conf(!idsDe(analista).includes(id), `'${id}' NAO aparece para o analista`);
  });
}

console.log('\n═══ 6. CONTROLE INTERNO ═══');
{
  // irCI aceita superadmin, coordenador e controle_interno.
  conf(idsDe(ci).includes('ci'), 'quem E do controle interno ve o item');
  conf(blocosDe(ci)[0] === 'analista', 'e no primeiro bloco — para ele e a tela de trabalho');
  // O menu do tecnico do C.I. e curto de proposito: ele nao assume TR nem baixa PC.
  conf(JSON.stringify(idsDe(ci)) === '["dash","perfil","ci"]',
       'e ve SO Dashboard, Meu Perfil e Controle Interno', JSON.stringify(idsDe(ci)));
  // E as cinco telas do acervo recusam o perfil, nao so somem do menu.
  ['irEst','irPlanilha','irProd','irRepo','irMeusPedidos'].forEach(fn => {
    const i = html.indexOf(`function ${fn}(`);
    const bloco = html.slice(i, i + 700);
    conf(/U\.perfil === 'controle_interno'/.test(bloco), `${fn} recusa o controle_interno`);
  });
  conf(idsDe(coord).includes('ci'), 'coordenador tambem ve');
  conf(!idsDe(analista).includes('ci'), 'analista comum NAO ve');
  // Dois itens com o mesmo id, mas em blocos que nunca coexistem: o perfil e um so.
  const cis = SB_ITENS.filter(i => i.id === 'ci');
  conf(cis.length === 2, 'ha duas declaracoes de CI (uma por bloco)');
  conf(idsDe(ci).filter(x=>x==='ci').length === 1, 'e nenhum perfil ve as duas ao mesmo tempo');
  conf(idsDe(coord).filter(x=>x==='ci').length === 1, 'nem o coordenador');
  conf(idsDe(superad).filter(x=>x==='ci').length === 1, 'nem o superadmin');
}

console.log('\n═══ 7. NADA FICOU SOLTO NEM SE PERDEU ═══');
{
  // Antes, quatro itens ficavam fora de qualquer seção rotulada.
  const soltos = ['aprov','faixa','recado','meuspedidos'];
  soltos.forEach(id => {
    const it = SB_ITENS.find(i => i.id === id);
    conf(!!it && SB_BLOCOS.some(b => b.id === it.bloco),
         `'${id}' agora vive num bloco (${it ? it.bloco : '—'})`);
  });
  // Todo item declara bloco conhecido, regra e ação.
  const ruins = SB_ITENS.filter(i =>
    !SB_BLOCOS.some(b => b.id === i.bloco) || typeof i.pode !== 'function' || !i.acao || !i.icone);
  conf(ruins.length === 0, 'todo item tem bloco, regra, acao e icone',
       ruins.map(i=>i.id).join(', '));
  // O superadmin vê tudo o que existe (menos o item exclusivo do controle interno).
  const todos = SB_ITENS.filter(i => !(i.bloco==='analista' && i.id==='ci')).length;
  conf(idsDe(superad).length === todos, 'o superadmin ve todos os itens do menu',
       `${idsDe(superad).length} de ${todos}`);
}

console.log('\n═══ 8. O BADGE DE APROVACOES SOBREVIVEU ═══');
{
  const aprov = SB_ITENS.find(i => i.id === 'aprov');
  conf(aprov.badge === 'sbAprovBadge', 'o item declara o badge');
  conf(/id="\$\{i\.badge\}"/.test(html), 'e o render desenha o span com esse id');
  conf(/getElementById\('sbAprovBadge'\)/.test(html), 'aprovAtualizarBadge continua achando o span');
}

console.log('\n═══ 9. ONLINE AGORA SAIU DO MENU E FOI PARA O CABECALHO ═══');
{
  conf(!/sbOnlineLista/.test(html), 'a lista do rodape do menu nao existe mais');
  conf(!/carregarOnline/.test(html), 'e a funcao antiga tambem nao');
  conf(/id="onlineBox"/.test(html), 'o botao esta no cabecalho');
  conf(/onclick="onlineAbrir\(event\)"/.test(html), 'abre por clique, como o sino');
  // Fechar ao clicar fora, com `once` — senão empilha um ouvinte por abertura.
  conf(/function onlineAbrir[\s\S]{0,1600}?addEventListener\('click'[\s\S]{0,120}?\{ once:true \}/.test(html),
       'fecha ao clicar fora, com once');
  // Erro de rede não pode zerar o contador: número velho é melhor que "0 online" falso.
  conf(/catch\(e\) \{[\s\S]{0,220}?return\s*\}\s*onlinePintar\(\)/.test(html),
       'erro de rede nao zera a lista');
  // Um relógio só, mesmo com o menu redesenhado várias vezes.
  conf(/if\(_onlineTimer\) return/.test(html), 'nao empilha um relogio a cada renderSB');

  // ── O botao precisa PARECER botao (12/08/2026) ──────────────────────────
  // Antes eram so a bolinha e o numero, e ninguem descobria que abria uma lista.
  // ⚠️ A JANELA CRESCEU DE 1600 PARA 2800 EM 16/08/2026, e o motivo importa: o icone de
  // pessoas entrou com um `path` de SVG longo, e o rotulo "Usuários online" saiu do recorte.
  // Os TRES testes abaixo falharam sem que nada tivesse sumido da tela. Recorte de tamanho
  // fixo sobre marcacao que cresce mede o tamanho do bloco, nao o conteudo dele.
  const btn = html.slice(html.indexOf('id="onlineBox"'), html.indexOf('id="onlineBox"') + 2800);
  conf(/Usuários online/.test(btn), 'o rotulo "Usuários online" esta no botao');
  conf(/id="onlineSeta"/.test(btn), 'e ha uma seta indicando que abre');
  // O icone de pessoas, ao lado do ponto verde (16/08/2026). O ponto sozinho dizia que algo
  // estava ligado, mas nao dizia do que.
  conf(/<svg[^>]*>\s*<path[^>]*d="M16 11c1\.66/.test(btn), 'o icone de pessoas esta no botao');
  conf(btn.indexOf('<svg') < btn.indexOf('background:#7BE38B'),
       'e o icone vem ANTES do ponto verde, nao depois');
  conf(/class="online-rot"/.test(btn) && /@media\(max-width:900px\)\{ \.online-rot\{display:none;\} \}/.test(html),
       'o rotulo sai em tela estreita — o cabecalho ja leva sino, nome, perfil, avatar e Sair');
  conf(/aria-expanded="false"/.test(btn), 'nasce com aria-expanded=false');

  // ⚠️ A ARMADILHA DESTA TELA: o painel fecha por TRES caminhos — o proprio botao, o clique
  // fora e o Esc. Girar a seta dentro do onclick cobriria um e deixaria a seta apontando
  // para cima com a lista fechada nos outros dois. Tem de haver UM lugar so.
  conf(/function onlineSeta\(aberto\)/.test(html), 'ha uma funcao unica de estado da seta');
  conf(/function onlineFechar[\s\S]{0,400}?onlineSeta\(false\)/.test(html),
       'onlineFechar devolve a seta');
  const abrir = html.slice(html.indexOf('function onlineAbrir'), html.indexOf('function onlineAbrir') + 1600);
  conf(/if\(document\.getElementById\('onlinePainel'\)\) \{ onlineFechar\(\); return \}/.test(abrir),
       'clicar no botao de novo fecha PELA funcao, nao por remove() solto');
  conf(/addEventListener\('click', onlineFechar/.test(abrir), 'clicar fora fecha pela mesma funcao');
  conf(/onlineSeta\(true\)/.test(abrir), 'e abrir gira a seta');
  conf(!/onlinePainel'\)[\s\S]{0,40}?\.remove\(\)[\s\S]{0,30}?\}, \{ once:true \}/.test(html),
       'nenhum caminho de fechar remove o painel sem passar por onlineFechar');

  // Esc fecha, como em qualquer menu suspenso — e o ouvinte sai no fechar, senao cada
  // abertura deixaria um vivo.
  conf(/_onlineEsc = \(e\) =>/.test(html), 'Esc fecha o painel');
  conf(/function onlineFechar[\s\S]{0,400}?removeEventListener\('keydown', _onlineEsc\)/.test(html),
       'e o ouvinte de Esc e removido ao fechar, por qualquer caminho');

  // se o botao vai sumir com o painel aberto, fecha antes: o painel e filho do box e sumiria
  // junto, mas o estado ficaria "aberto" e a seta voltaria virada na proxima vez
  conf(/if\(some && document\.getElementById\('onlinePainel'\)\) onlineFechar\(\)/.test(html),
       'esvaziar a lista com o painel aberto fecha antes de esconder o botao');
}

console.log('\n═══ 9b. O CONTROLE INTERNO FICA FORA DOS RELATORIOS DE PRODUTIVIDADE ═══');
{
  // Regra do Richard (12/08): os tecnicos do C.I. sao efetivos, nao analisam PC. Nao e meta
  // zero — e nao aparecer. Meta zero ainda os poria na lista, com "0%" ao lado do nome.
  const ctxP = { console };
  vm.createContext(ctxP);
  const iniP = html.indexOf('const FORA_DA_PRODUTIVIDADE');
  const fimP = html.indexOf('const SB_ITENS');
  vm.runInContext(html.slice(iniP, fimP) + `
function _fora(){ return FORA_DA_PRODUTIVIDADE }
function _conta(u){ return contaProdutividade(u) }`, ctxP);

  conf(ctxP._conta({ perfil:'analista' }) === true, 'analista conta');
  conf(ctxP._conta({ perfil:'superadmin' }) === true, 'superadmin conta (ele analisa)');
  conf(ctxP._conta({ perfil:'coordenador' }) === false, 'coordenador NAO conta');
  conf(ctxP._conta({ perfil:'controle_interno' }) === false, 'CONTROLE INTERNO NAO CONTA');
  conf(ctxP._conta(null) === false, 'usuario nulo nao quebra');

  // As tres listas usam a mesma regra — uma copia divergiria em silencio.
  const usos = (html.match(/contaProdutividade\(u\)/g) || []).length;
  conf(usos >= 3, 'Produtividade, Gestao Grupo e Board usam a MESMA funcao', `${usos} usos`);
  conf(!/if\(u\.perfil !== 'coordenador'\) usuariosPorId/.test(html),
       'nao sobrou a regra antiga, que so excluia coordenador');
  // O Board agrega por PC: sem exclusao explicita, dependeria de "o C.I. nunca ter PC".
  conf(/foraDaProd\.has\(String\(r\.analista_id\)\)/.test(html),
       'o Board exclui EXPLICITAMENTE, nao por acidente');

  // ⚠️ O Quadro 2 do CGE resolve por outro caminho: lista de INCLUSAO. Se um dia virar
  // lista de exclusao, o C.I. entra no relatorio oficial sem ninguem perceber.
  const iCge = html.indexOf('function cgeAgregar(');
  const blocoCge = html.slice(iCge, iCge + 900);
  conf(/if\(u\.perfil === 'analista'\) usuariosPorId\[u\.id\] = u/.test(blocoCge),
       'o Quadro 2 do CGE e lista de INCLUSAO — so analista entra');
}

console.log('\n═══ 10. TODO onclick APONTA PARA FUNCAO QUE EXISTE ═══');
{
  // ⚠️ ESTE TESTE NASCEU DE UM ESTRAGO. Em 12/08, ao trocar a tela do Controle Interno, eu
  // extrai um trecho do arquivo "do irCI ate a proxima secao" — e o trecho engolia
  // `enviarAoCI` e `verProdDetalhe`, que moravam ali no fim. As duas sumiram do arquivo e
  // continuaram sendo chamadas por `onclick` em quatro lugares. Nenhuma suite acusou:
  // `node --check` valida sintaxe, nao referencia.
  //
  // O botao so quebraria nas maos de quem clicasse.
  const chamadas = new Set([...html.matchAll(/onclick="([a-zA-Z_][a-zA-Z0-9_]*)\(/g)].map(m => m[1]));
  const definidas = new Set([...html.matchAll(/^\s*(?:async\s+)?function ([a-zA-Z_][a-zA-Z0-9_]*)/gm)].map(m => m[1]));
  const faltando = [...chamadas].filter(f => !definidas.has(f));
  conf(faltando.length === 0,
       `as ${chamadas.size} funcoes chamadas por onclick existem`, faltando.join(', '));

  // As duas que sumiram, nomeadas — para o caso de o teste acima ser afrouxado um dia.
  ['verProdDetalhe', 'enviarAoCI'].forEach(f =>
    conf(definidas.has(f), `'${f}' esta definida`));
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
