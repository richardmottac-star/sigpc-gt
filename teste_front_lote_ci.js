// CAMINHO: sigpc-gt/teste_front_lote_ci.js
//
// O PAINEL DA SELECAO EM LOTE  (12/10/2026)
//
// ⚠️ O QUE ELE GUARDA: que o painel continue SENDO VISTO. Ele era uma barra colada na borda da
// janela, e o print do Richard mostrou o caso real — ela ficava EMBAIXO DA BARRA DE TAREFAS DO
// WINDOWS, quase invisivel, com os dois botoes no mesmo peso. Quem seleciona parcial e nao ve o
// que fazer depois desiste da acao.
//
// ⚠️ E NAO VIROU MODAL, apesar de ter sido esse o pedido: modal bloqueia a tela, e aqui a pessoa
// precisa continuar marcando parciais depois da primeira. As DUAS ACOES ja abrem `moConfirm` ao
// clicar — isso nao mudou, e ha checagem aqui para que nao mude.
//
// USO: node teste_front_lote_ci.js

const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('./index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ⚠️ A janela termina num MARCO DO PROPRIO CODIGO, nunca num numero — armadilha 30.
const i = html.indexOf('function ciLoteBarra() {');
const fonte = i < 0 ? '' : html.slice(i, html.indexOf('/**', i));

// ── O painel montado de verdade, num DOM de mentira ──────────────────────────
// ⚠️ EXECUTA, e nao casa texto: casar texto prova que a frase existe no arquivo, nao que ela
// chega na tela. O que se quer garantir aqui e o que a pessoa VE.
const el = { id: '', style: { cssText: '' }, innerHTML: '', remove() { this.removido = true; } };
const ctx = {
  _ciLote: new Set(['1', '2']), _ciLoteTr: '2021TR002114',
  window: { _planDadosCache: [{ tr: '2021TR002114', entidade: 'ASSOCIACAO DOS PAIS E AMIGOS DO AUTISTA',
    parciais: [{ num: '1', qtd: 1, valor: '40428' }, { num: '2', qtd: 1, valor: '40428' }] }] },
  document: { getElementById: () => null, createElement: () => el, body: { appendChild() {} } },
  plural: (n, s, p) => (n === 1 ? s : p), artigo: (n) => (n === 1 ? 'a' : 'as'),
  planMoeda: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  escHtml: (s) => String(s == null ? '' : s), console,
};
let montou = true;
try { vm.createContext(ctx); new vm.Script(fonte + '\nciLoteBarra();').runInContext(ctx); }
catch (e) { montou = e.message; }

S('1. O PAINEL SE FAZ VER');
{
  conf(montou === true, 'o painel monta sem erro', typeof montou === 'string' ? montou : null);
  // ⚠️ DESCOLADO DA BORDA: e isto que o tira de debaixo da barra de tarefas do Windows.
  conf(/bottom:18px/.test(el.style.cssText), 'nao fica colado na borda de baixo', el.style.cssText.slice(0, 60));
  conf(!/bottom:0/.test(el.style.cssText), 'e o bottom:0 antigo saiu');
  conf(/box-shadow:0 10px 34px/.test(el.style.cssText), 'tem sombra forte, de coisa que flutua');
  conf(/border-top:5px solid var\(--v\)/.test(el.style.cssText), 'e a faixa verde no topo');
  conf(/left:18px/.test(el.style.cssText) && /right:18px/.test(el.style.cssText), 'descolado tambem dos lados');
}

S('2. O QUE FOI SELECIONADO APARECE EM NUMERO');
{
  const texto = el.innerHTML.replace(/<[^>]+>/g, ' ');
  // ⚠️ O NUMERO MORA NA BOLHA, separado do rotulo — e de proposito: e ele que a pessoa acha com
  // o canto do olho quando a tela rola. O teste mede os dois, e nao o texto colado.
  conf(/parciais selecionadas/.test(texto), 'diz que ha parciais selecionadas');
  conf(/border-radius:50%[\s\S]*?>2<\/div>/.test(el.innerHTML), 'e a bolha traz o numero');
  conf(/2021TR002114/.test(texto), 'diz qual TR');
  conf(/ASSOCIACAO DOS PAIS/.test(texto), 'e qual entidade — a TR sozinha nao diz de quem e');
  // ⚠️ O NUMERO DE PCs VAI JUNTO DO DE PARCIAIS: o encaminhamento leva a parcela INTEIRA, e ha
  // parcela com 7 PCs. "2 parciais" esconderia o tamanho do ato.
  conf(/prestações/.test(texto), 'mostra tambem quantas prestacoes');
  conf(/R\$ 80\.856,00/.test(texto), 'e o valor somado', (texto.match(/R\$ [\d.,]+/) || [])[0]);
  conf(/limpar seleção/.test(texto), 'e ha como limpar a selecao');
}

S('3. OS DOIS BOTOES TEM PESOS DIFERENTES');
{
  // ⚠️ COM O MESMO PESO, COMO ERA, a pessoa nao sabia qual era qual — os dois eram contorno
  // branco sobre azul.
  conf(/background:var\(--v\);color:#fff/.test(el.innerHTML), 'a acao de sempre vem em verde cheio');
  conf(/background:#EAF1F9;color:#1A4E8A/.test(el.innerHTML), 'e a do SGPe em azul claro');
  conf(/Encaminhar as 2 ao C\.I\./.test(el.innerHTML), 'o botao do C.I. diz quantas');
  conf(/Registrar devolutiva pelo SGPe/.test(el.innerHTML), 'e o outro diz o que faz');
  // As duas acoes continuam as mesmas — o painel so mudou de forma.
  conf(/onclick="ciLoteSgpe\(\)"/.test(el.innerHTML) && /onclick="ciLoteEnviar\(\)"/.test(el.innerHTML),
    'e as duas chamam as funcoes de sempre');
}

S('4. A LINHA QUE DIZ O QUE CADA BOTAO FAZ');
{
  const texto = el.innerHTML.replace(/<[^>]+>/g, ' ');
  // ⚠️ QUATRO ANALISTAS PERGUNTARAM NA MESMA SEMANA para que servia a devolutiva pelo SGPe. A
  // explicacao tem de estar onde se decide, e nao num manual que ninguem abre.
  conf(/manda a parcial para o Controle Interno analisar/.test(texto), 'explica o encaminhamento');
  conf(/já foi ao C\.I\.[\s\S]{0,40}já voltou/.test(texto), 'e explica a devolutiva pelo SGPe');
  conf(/sem precisar encaminhar de novo/.test(texto), 'dizendo o que ela evita');
}

S('5. O QUE NAO MUDOU');
{
  // ⚠️ SEM SELECAO, SEM PAINEL: ele nasce e morre com a selecao, e nao fica na tela vazio.
  const el2 = { style: { cssText: '' }, innerHTML: '', remove() { this.removido = true; } };
  const ctx2 = { ...ctx, _ciLote: new Set(),
    document: { getElementById: () => el2, createElement: () => el2, body: { appendChild() {} } } };
  vm.createContext(ctx2);
  new vm.Script(fonte + '\nciLoteBarra();').runInContext(ctx2);
  conf(el2.removido === true, 'sem selecao, o painel e removido');
  // ⚠️ AS DUAS ACOES CONFIRMAM ANTES DE ESCREVER — e isso nao e do painel, e das funcoes.
  const iEnv = html.indexOf('async function ciLoteEnviar()');
  const env = html.slice(iEnv, html.indexOf('async function', iEnv + 10));
  conf(/moConfirm\(/.test(env), 'encaminhar ao C.I. continua confirmando antes');
  conf(/Vai a parcial INTEIRA/.test(env), 'e continua avisando que vai a parcela inteira');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
