// CAMINHO: sigpc-gt/teste_front_ci_fila.js
//
// A FILA DE TRABALHO DO CONTROLE INTERNO, na tela.  (24/08/2026)
//
// POR QUE ESTA SUÍTE EXISTE
// Os três técnicos olhavam a MESMA fila — 214 TRs e 1.144 PCs medidos no dia — e nada dizia
// quem estava com o quê. Dois podiam abrir a mesma TR ao mesmo tempo; ou nenhum abrir, cada
// um supondo que o outro já tinha pegado.
//
// Lê o `index.html` como TEXTO e roda as funções puras num contexto isolado — é o padrão das
// outras suítes de front deste repositório.
//
//   node teste_front_ci_fila.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// As funções puras da fila, extraídas do próprio arquivo.
const ini = html.indexOf('let _ciFila = []');
// ⚠️ A JANELA VAI ATE DEPOIS DE `ciFilaLinha`: `ciFilaVisiveis` e `ciFilaLinha` nascem
// DEPOIS de `irCIFila` no arquivo, e fechar antes delas deixava o teste sem as duas funcoes
// que ele mede. As que ficam no meio (irCIFila, ciFilaCarregar, ciFilaRender) so sao
// DEFINIDAS aqui — corpo de funcao nao roda na definicao, entao `document` e `fetch`
// ausentes nao atrapalham.
const fim = html.indexOf('async function ciFilaAssumir');
if (ini < 0 || fim < 0 || fim < ini) {
  console.error('FALHA: nao achei o bloco da fila de trabalho no index.html.');
  process.exit(1);
}
// ⚠️ `ciCorTecnico` e `ciIniciais` sao `const` (arrow), e `const` nao vira propriedade do
// contexto do vm — so `function` vira. Por isso as duas sao chamadas por `runInContext`, e
// nao por `ctx.`: foi assim que a primeira versao desta suite morreu com "is not a function".
const chamar = (expr) => vm.runInContext(expr, ctx);
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);

console.log('\n═══ 1. A COR SAI DA POSICAO, NUNCA DO NOME ═══');
{
  // ⚠️ Fixar "azul = Marcia" quebraria no dia em que a equipe mudasse — e ela ja mudou uma vez.
  vm.runInContext(`_ciFilaTecnicos = [{id:62,nome:'Marcia'},{id:63,nome:'Atemilson'},{id:64,nome:'Sirene'}]`, ctx);
  conf(chamar('ciCorTecnico(62)') === '#185FA5', 'o primeiro tecnico e azul');
  conf(chamar('ciCorTecnico(63)') === '#534AB7', 'o segundo, roxo');
  conf(chamar('ciCorTecnico(64)') === '#BA7517', 'o terceiro, ambar');
  conf(chamar('ciCorTecnico(null)') === '#7A8A80', 'sem responsavel e cinza neutro');
  conf(chamar('ciCorTecnico(999)') === '#7A8A80', 'quem nao esta na equipe cai no cinza, sem quebrar');
  // Trocando a ordem da equipe, as cores acompanham — e e isso que se quer.
  vm.runInContext(`_ciFilaTecnicos = [{id:64,nome:'Sirene'},{id:62,nome:'Marcia'}]`, ctx);
  conf(chamar('ciCorTecnico(64)') === '#185FA5', 'com outra ordem, outra cor — a cor e da POSICAO');
  conf(!/Marcia|Atemilson|Sirene/.test(html.slice(html.indexOf('const CI_CORES'), html.indexOf('const CI_CORES') + 400)),
       'e nenhum nome aparece na definicao das cores');

  conf(chamar("ciIniciais('Marcia Terezinha Miranda')") === 'MT', 'as iniciais sao as duas primeiras');
  conf(chamar("ciIniciais('Sirene')") === 'S', 'nome de uma palavra da uma letra');
  // Vazio cai no mesmo '?' do nulo, de proposito: um avatar em branco nao diz nada, e
  // 'undefined' diria a coisa errada.
  conf(chamar("ciIniciais('')") === '?', 'nome vazio vira ? igual ao nulo');
  conf(chamar('ciIniciais(null)') === '?', 'nulo vira interrogacao, nao "undefined"');
}

console.log('\n═══ 2. OS CINCO CHIPS, E "TODAS" ABRE ACESO ═══');
{
  const chips = vm.runInContext('CI_FILA_CHIPS', ctx);
  conf(chips.length === 5, 'sao cinco chips', String(chips.length));
  conf(chips.map(c => c.rot).join(' · ') === 'Todas · Livres · Minhas · Com outros · Mais de 30 dias',
       'na ordem pedida', chips.map(c => c.rot).join(' · '));
  // ⚠️ DECISAO DO RICHARD: a tela SEMPRE abre em "Todas". Abrir em "Minhas" esconderia as TRs
  // sem responsavel, e ninguem veria as paradas — que e o problema que a tela resolve.
  conf(vm.runInContext('_ciFilaChip', ctx) === 'todas', 'o chip inicial e "todas"');
  conf(/let _ciFilaChip = 'todas'/.test(html), 'e o padrao esta escrito no codigo, nao numa chamada');

  // O recorte de cada chip.
  vm.runInContext(`U = { id: 62 }; _ciFila = [
     {tr:'A', tecnico_id:null, faixa_espera:'critica'},
     {tr:'B', tecnico_id:62,   faixa_espera:'ok'},
     {tr:'C', tecnico_id:63,   faixa_espera:'critica'},
     {tr:'D', tecnico_id:null, faixa_espera:'ok'}]`, ctx);
  const conta = (id) => { vm.runInContext(`_ciFilaChip = '${id}'`, ctx); return ctx.ciFilaVisiveis().length; };
  conf(conta('todas') === 4, 'todas traz as quatro');
  conf(conta('livres') === 2, 'livres traz as sem dono');
  conf(conta('minhas') === 1, 'minhas traz so a do 62');
  conf(conta('outros') === 1, 'com outros traz a do 63');
  conf(conta('mais30') === 2, 'mais de 30 dias traz as duas criticas');
  conf(conta('livres') + conta('minhas') + conta('outros') === conta('todas'),
       'e os tres primeiros recortes fecham o total');
}

console.log('\n═══ 3. O BOTAO DE CADA ESTADO ═══');
{
  vm.runInContext(`U = { id: 62 }; _ciFilaTecnicos = [{id:62,nome:'Marcia'},{id:63,nome:'Atemilson'}]`, ctx);
  vm.runInContext(`escHtml = (s) => String(s ?? '')`, ctx);
  const linha = (o) => ctx.ciFilaLinha(Object.assign({
    tr:'2020TR000657', entidade:'APAE', parcelas:5, pcs:9, analista_nome:'Claudia',
    dias_espera:55, faixa_espera:'critica', tecnico_id:null, tecnico_nome:null }, o), 0);

  const livre = linha({});
  conf(/>Assumir</.test(livre), 'TR livre mostra "Assumir"');
  conf(/background:#0F6E56;color:#fff/.test(livre), 'no verde da especificacao');
  conf(/ciFilaAssumir\('2020TR000657'\)/.test(livre), 'e o clique chama ciFilaAssumir');

  const minha = linha({ tecnico_id:62, tecnico_nome:'Marcia Terezinha Miranda' });
  conf(/>Abrir</.test(minha), 'TR minha mostra "Abrir"');
  conf(/ciFilaAbrir\('2020TR000657'\)/.test(minha), 'e abre a tela de decisao');
  conf(/border-left:3px solid #185FA5/.test(minha), 'e ganha a borda esquerda na cor do tecnico');

  // ⚠️ ABRIR EXISTE EM TODO ESTADO (25/08/2026). O tecnico precisava ver as parcelas, o
  // parecer da analista e o processo SGPe ANTES de decidir se assume — e antes disso a unica
  // porta para a TR era assumi-la.
  conf(/>Abrir</.test(livre), 'TR livre tambem oferece Abrir, ao lado do Assumir');
  conf((livre.match(/<button/g) || []).length === 2, 'sao dois botoes na livre',
       String((livre.match(/<button/g) || []).length));
  conf(livre.indexOf('>Abrir<') < livre.indexOf('>Assumir<'), 'e Abrir vem primeiro');
  conf(/background:#fff;color:var\(--te\)[^"]*"\s*\n?\s*onclick="event\.stopPropagation\(\);ciFilaAbrir/.test(livre)
       || /background:#fff;color:var\(--te\)/.test(livre), 'o Abrir da livre e neutro');

  const doOutro = linha({ tecnico_id:63, tecnico_nome:'Atemilson Bispo dos Santos' });
  // ⚠️ O BOTAO CINZA "Com [nome]" SAIU EM 25/08. Ele ocupava a coluna inteira sem fazer nada,
  // e a informacao que carregava — de quem e a TR — ja esta na coluna Responsavel, com avatar
  // e nome. Botao desabilitado que repete o que a linha ja diz e ruido; no lugar dele entrou
  // o Abrir, que faz algo: ver sem decidir.
  conf(/>Abrir</.test(doOutro), 'TR de outro oferece Abrir — ver sem decidir');
  conf(!/disabled/.test(doOutro), 'e NAO ha mais botao desabilitado ocupando a coluna');
  conf(!/ciFilaAssumir/.test(doOutro), 'nem caminho para assumir a TR de outro');
  conf(/Atemilson/.test(doOutro), 'e o nome de quem esta com ela continua na linha');
  // ⚠️ O Abrir da TR de outro e NEUTRO; so o da propria e verde.
  conf(!/background:#0F6E56/.test(doOutro), 'o Abrir da TR de outro e neutro');

  // A zebra e a etiqueta de espera
  conf(/background:#FCEBEB/.test(livre) && /color:#A32D2D/.test(livre), 'acima de 30 dias: etiqueta vermelha');
  const ok15 = linha({ faixa_espera:'ok', dias_espera:10 });
  conf(/background:#EAF3DE/.test(ok15) && /color:#27500A/.test(ok15), 'ate 15 dias: etiqueta verde');
  const at = linha({ faixa_espera:'atencao', dias_espera:20 });
  conf(/background:#FAEEDA/.test(at) && /color:#854F0B/.test(at), '16 a 30: etiqueta ambar');
  conf(/55 dias/.test(livre), 'a etiqueta diz os dias');
  const semData = linha({ dias_espera:null, faixa_espera:null });
  conf(/>—</.test(semData), 'sem data de envio, a etiqueta mostra travessao e nao "null dias"');
}

console.log('\n═══ 4. A TELA E O CAMINHO ═══');
{
  // ⚠️ SAO DOIS ITENS DE MENU COM O MESMO ROTULO, e OS DOIS tem de abrir a Fila:
  //   bloco 'analista'    → os tres tecnicos do C.I.
  //   bloco 'coordenacao' → coordenador e superadmin
  // Em 24/08 so o primeiro foi trocado, e o superadmin continuou caindo na tela antiga sem
  // entender por que: a Fila estava publicada e nao havia porta para ele. Esta CONTAGEM e a
  // trava — se um dia alguem trocar so um dos dois, ela quebra.
  const itensCi = (html.match(/rotulo:'Controle Interno', acao:'irCIFila\(\)'/g) || []).length;
  conf(itensCi === 2, 'os DOIS itens de menu do C.I. abrem a fila de trabalho', String(itensCi));
  conf(!/rotulo:'Controle Interno', acao:'irCI\(\)'/.test(html),
       'e nenhum item de menu abre a tela de decisao direto');
  conf(/async function irCIFila\(\)/.test(html), 'irCIFila existe');
  conf(/async function irCI\(trAlvo\)/.test(html), 'e irCI aceita a TR de destino');
  conf(/function ciFilaAbrir\(tr\) \{ irCI\(tr\) \}/.test(html), 'a fila abre a decisao com a TR');
  // Sem `trAlvo` a tela de decisao continua sendo a de sempre — e assim o coordenador e o
  // superadmin, que nao passam pela fila, nao perdem nada.
  conf(/if\(trAlvo\) \{/.test(html), 'sem TR, a tela de decisao segue como era');

  // ⚠️ A janela fecha na PROXIMA FUNCAO, e nao num numero: era 2.200 e estourou em 25/08,
  // quando a faixa ganhou o "Assumir esta demanda" e a etiqueta da TR de outro. Janela por
  // tamanho mede o tamanho do arquivo, nao a funcao.
  const iC = html.indexOf('async function ciFaixaTrRender');
  const faixa = html.slice(iC, html.indexOf('\nasync function irCI(', iC));
  conf(iC > 0, 'a faixa da TR existe');
  conf(/background:#0F6E56/.test(faixa), 'no verde da especificacao');
  conf(/◀ Fila/.test(faixa), 'com o caminho de volta');
  conf(/enviada por/.test(faixa), 'diz quem encaminhou');
  conf(/com você desde/.test(faixa), 'e desde quando esta com o tecnico');
  conf(/↩ Devolver à fila/.test(faixa) && /⇄ Passar a outro/.test(faixa), 'e as duas saidas');
  // Sem responsavel nao ha o que devolver nem a quem passar.
  conf(/l && l\.tecnico_id && meu \? `/.test(faixa), 'devolver e passar so aparecem quando a TR e MINHA');
  // ⚠️ NA TR LIVRE O BOTAO PRINCIPAL E ASSUMIR (25/08): quem abriu para examinar e decidiu
  // pegar nao pode ter de voltar a fila so para isso.
  conf(/✓ Assumir esta demanda/.test(faixa), 'a TR livre mostra "Assumir esta demanda" em destaque');
  conf(/ciFaixaAssumir\('\$\{escHtml\(tr\)\}'\)/.test(faixa), 'e ele chama ciFaixaAssumir');
  // ⚠️ REAPROVEITA `ciFilaAssumir`: um caminho proprio seria uma segunda definicao de
  // "assumir", com a propria confirmacao e o proprio tratamento do 409 de "outro chegou antes".
  const iFA = html.indexOf('async function ciFaixaAssumir');
  conf(/await ciFilaAssumir\(tr\)/.test(html.slice(iFA, iFA + 400)),
       'que reaproveita o assumir da fila, e nao duplica a regra');
  conf(/irCI\(tr\)/.test(html.slice(iFA, iFA + 400)),
       'e redesenha a tela — e o que troca os botoes de decisao de cinza para ativos');
  // TR de outro: a faixa diz com quem esta e desde quando.
  conf(/com \$\{escHtml\(\(l\.tecnico_nome\|\|''\)\.split\(' '\)\[0\]\)\}/.test(faixa),
       'e a TR de outro mostra "com [nome] desde DD/MM"');
}

console.log('\n═══ 4-B. ABRIR E SO LEITURA — DECIDIR EXIGE TER ASSUMIDO (25/08/2026) ═══');
{
  // ⚠️ A MESMA REGRA DO SERVIDOR (`ciFila.podeDecidir`), simples o bastante para caber nos
  // dois lados sem divergir. A tela desabilita e diz por que; o servidor recusa. Uma sem a
  // outra deixaria ou o botao morto sem explicacao, ou a explicacao sem trava.
  conf(/function ciPodeDecidir\(tr\)/.test(html), 'ciPodeDecidir existe na tela');
  const iP = html.indexOf('function ciPodeDecidir');
  const pd = html.slice(iP, iP + 400);
  conf(/perfilEfetivo\(U\) === 'superadmin'/.test(pd), 'o superadmin decide sem restricao');
  conf(/String\(l\.tecnico_id\) === String\(U\.id\)/.test(pd), 'e os demais so a TR que assumiram');

  conf(/function ciMotivoNaoDecide\(tr\)/.test(html), 'e ha o motivo para o botao cinza dizer');
  const iM = html.indexOf('function ciMotivoNaoDecide');
  const mt = html.slice(iM, iM + 400);
  conf(/Assuma a demanda para poder decidir/.test(mt), 'TR livre: "Assuma a demanda para poder decidir"');
  conf(/passe a demanda para você/.test(mt), 'TR de outro: diz com quem esta e o que fazer');

  // ── o cartao de decisao
  const iC = html.indexOf('function ciParcelaAberta');
  const cartao = html.slice(iC, html.indexOf('function ciConversaHtml'));
  conf(/const minha = ciPodeDecidir\(g\.tr\)/.test(cartao), 'o cartao pergunta se a TR e minha');
  conf(/const podeDecidir = naFila && minha/.test(cartao),
       'e so libera os botoes quando esta na fila E e minha');
  // ⚠️ OS BOTOES APARECEM CINZAS, com o motivo AO LADO — nao somem. Sumindo, quem abriu para
  // examinar nao descobriria que existe um passo antes (assumir): acharia que a tela e de
  // leitura e pronto. Botao cinza com o porque ensina o caminho; ausente esconde que ha um.
  conf(/naFila && !minha \? `/.test(cartao), 'sem posse, ha um ramo proprio de botoes cinzas');
  conf(/cursor:not-allowed/.test(cartao), 'os botoes vem desabilitados');
  conf((cartao.match(/ciMotivoNaoDecide\(g\.tr\)/g) || []).length >= 3,
       'com o motivo no title dos dois E numa etiqueta ao lado',
       String((cartao.match(/ciMotivoNaoDecide\(g\.tr\)/g) || []).length));
  conf(/✓ C\.I\. de acordo<\/button>[\s\S]{0,400}↩ Devolver com ressalvas/.test(cartao),
       'e os dois botoes cinzas tem os mesmos rotulos dos ativos');
}

console.log('\n═══ 5. O MOTIVO TRAVA O BOTAO ANTES DO CLIQUE ═══');
{
  // ⚠️ Quem confere de verdade e o servidor. Isto aqui existe para o erro nao chegar DEPOIS
  // do clique — e o motivo do bloqueio fica no `title`, nunca so na cor (armadilha 15).
  conf(/id="ciDevBtn" disabled/.test(html), 'o botao de devolver nasce desabilitado');
  conf(/id="ciPassBtn" disabled/.test(html), 'o de passar tambem');
  const iD = html.indexOf('function ciDevChecar');
  const dev = html.slice(iD, iD + 500);
  conf(/v\.length < 10/.test(dev), 'e so acende com 10 caracteres');
  conf(/Faltam \$\{10 - v\.length\}/.test(dev), 'dizendo quantos faltam');
  const iP = html.indexOf('function ciPassChecar');
  const pas = html.slice(iP, iP + 600);
  conf(/!d/.test(pas) && /Escolha para quem/.test(pas), 'passar tambem exige o destino, e diz isso');
  // ⚠️ O PROPRIO NAO ENTRA NA LISTA: para ficar com a TR existe o Assumir, e oferecer
  // "passar para mim" seria um caminho que o servidor recusa.
  conf(/filter\(t => String\(t\.id\) !== String\(U\.id\)\)/.test(html),
       'a lista de destinos exclui quem esta passando');
}

console.log('\n═══ 6. OS TRES EVENTOS NO HISTORICO ═══');
{
  // ⚠️ Rotulo proprio, para nao se confundir com `assumir_tr` — que e a ANALISTA assumindo a
  // TR para analisar. Outra coisa, outra pessoa.
  ['ci_assumiu', 'ci_devolveu', 'ci_passou'].forEach(ev => {
    const n = (html.match(new RegExp(`${ev}:'`, 'g')) || []).length;
    conf(n === 2, `${ev} tem rotulo nas DUAS copias do mapa de eventos`, String(n));
  });
  conf(/ci_assumiu:'🏛 C\.I\. assumiu a demanda'/.test(html), 'assumiu a demanda');
  conf(/ci_devolveu:'🏛 C\.I\. devolveu à fila'/.test(html), 'devolveu a fila');
  conf(/ci_passou:'🏛 C\.I\. passou a demanda'/.test(html), 'passou a demanda');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
