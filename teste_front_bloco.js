// CAMINHO: sigpc-gt/teste_front_bloco.js
//
// Testes da SELEÇÃO E AÇÃO EM BLOCO do Painel ADMIN, extraindo as funções do próprio
// index.html. Sem navegador, sem rede, sem login.
//
// ⚠️ O QUE ESTES TESTES PROTEGEM
//
// A regra que segura tudo: **a ação só alcança quem está na tela.** A marcação sobrevive à
// troca de filtro — senão buscar um nome no meio da reunião apagaria o que já foi marcado —
// mas quem sai do filtro para de ser afetado.
//
// Sem isso, "Aprovar 12 selecionados" poderia liberar 30 pessoas, 18 delas invisíveis no
// momento do clique. Numa reunião de abertura isso é irreparável: a pessoa entra e ninguém
// percebeu.
//
// Protegem também:
//   · o superadmin não se desativa por engano num "desativar todos";
//   · o botão conta só quem está REALMENTE aguardando aprovação, não os selecionados;
//   · falha de rede no meio do lote não some: volta no relatório.
//
// USO: node teste_front_bloco.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('let _admSel = new Set()');
const fim = html.indexOf('async function admAprovarBloco(');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco de selecao em massa no index.html.');
  process.exit(1);
}

// ── DOM mínimo ──────────────────────────────────────────────────────────────
// Só o que estas funções tocam. Um DOM de verdade não acrescentaria nada ao que se quer
// provar aqui, que é quem entra na conta e quem não entra.
function novoEl(extra) {
  const el = { style:{}, textContent:'', title:'', disabled:false,
               checked:false, indeterminate:false, value:'', ...(extra||{}) };
  el.closest = () => ({ style:{} });
  return el;
}
const els = {};
const idsFixos = ['admBarraBloco','admBlocoTxt','admBlocoFora','admBtnAprovar',
                  'admBtnAtivar','admBtnDesativar','admSelTodos'];
idsFixos.forEach(id => { els[id] = novoEl() });

let caixas = [];   // as .admChk que estariam na tela
const doc = {
  getElementById: id => els[id] || null,
  querySelectorAll: sel => (sel === '.admChk' ? caixas : []),
  querySelector: () => null,
};

const ctx = { console, document: doc, toast: () => {} };
vm.createContext(ctx);

// As funções ficam com as `let` no MESMO escopo léxico — por isso os ajudantes vão
// concatenados no mesmo script. `let` não vira propriedade do contexto do vm; função vira.
vm.runInContext(html.slice(ini, fim) + `
function _setVis(v){ _admVisiveis = v.map(String) }
function _setSel(v){ _admSel = new Set(v.map(String)) }
function _getSel(){ return [..._admSel] }
function _setUsers(v){ _admUsers = v }
`, ctx);

const { admSelVisiveis, admSelToggle, admSelTodos, admBarraAtualizar,
        admSelTodosEstado, admEmLotes, _setVis, _setSel, _getSel, _setUsers } = ctx;

// `_admUsers` é declarado antes do trecho extraído; o vm precisa dele para a contagem.
vm.runInContext('var _admUsers = []', ctx);

const caixa = (id, marcada) => ({ dataset:{ id:String(id) }, checked: !!marcada,
                                  closest: () => ({ style:{} }) });

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

(async () => {

console.log('\n═══ 1. A ACAO SO ALCANCA QUEM ESTA NA TELA ═══');
{
  _setSel([1,2,3,4,5]);
  _setVis([1,2,9]);
  const alvo = admSelVisiveis();
  conf(alvo.length === 2, 'de 5 marcados, so os 2 visiveis entram', `veio ${alvo.length}`);
  conf(alvo.includes('1') && alvo.includes('2'), 'e sao exatamente os que o filtro deixou');
  conf(!alvo.includes('3') && !alvo.includes('4') && !alvo.includes('5'),
       'OS MARCADOS FORA DO FILTRO FICAM DE FORA');
  conf(!alvo.includes('9'), 'e visivel sem marcacao tambem nao entra');
}

console.log('\n═══ 2. A MARCACAO SOBREVIVE A TROCA DE FILTRO ═══');
{
  // Buscar um nome no meio da reunião não pode apagar o que já foi marcado.
  _setSel([1,2,3]);
  _setVis([1]);
  conf(admSelVisiveis().length === 1, 'com o filtro estreito, so 1 e afetado');
  _setVis([1,2,3]);
  conf(admSelVisiveis().length === 3, 'ao alargar o filtro, os 3 voltam a valer');
  conf(_getSel().length === 3, 'nada foi perdido no caminho');
}

console.log('\n═══ 3. A BARRA CONTA CERTO, E DIZ QUEM FICOU DE FORA ═══');
{
  _setUsers([
    { id:1, nome:'A', aguardando_aprovacao:true },
    { id:2, nome:'B', aguardando_aprovacao:true },
    { id:3, nome:'C', aguardando_aprovacao:false },
    { id:8, nome:'H', aguardando_aprovacao:true },
  ]);
  _setSel([1,2,3,8]);
  _setVis([1,2,3]);
  caixas = [caixa(1,true), caixa(2,true), caixa(3,true)];
  admBarraAtualizar();

  conf(els.admBarraBloco.style.display === 'flex', 'a barra aparece');
  conf(els.admBlocoTxt.textContent === '3 selecionados', 'conta os 3 visiveis', els.admBlocoTxt.textContent);
  conf(/1 marcado fora do filtro/.test(els.admBlocoFora.textContent),
       'AVISA o que ficou fora do filtro', els.admBlocoFora.textContent);
  // O 3 está selecionado e visível, mas não aguarda aprovação — o botão não pode contá-lo.
  conf(els.admBtnAprovar.textContent === '✓ Aprovar 2 selecionados',
       'o botao conta so quem AGUARDA aprovacao, nao os selecionados', els.admBtnAprovar.textContent);
  conf(els.admBtnAtivar.textContent === '✅ Ativar 3', 'ativar conta todos os visiveis marcados');
  conf(els.admBtnDesativar.textContent === '🚫 Desativar 3', 'desativar idem');
}

console.log('\n═══ 4. SEM NINGUEM AGUARDANDO, O BOTAO DE APROVAR NAO CLICA ═══');
{
  _setUsers([{ id:1, nome:'A', aguardando_aprovacao:false }]);
  _setSel([1]); _setVis([1]);
  caixas = [caixa(1,true)];
  admBarraAtualizar();
  conf(els.admBtnAprovar.disabled === true, 'fica desabilitado');
  conf(els.admBtnAprovar.textContent === '✓ Aprovar selecionados', 'e sem numero mentiroso');
  conf(/Nenhum dos selecionados/.test(els.admBtnAprovar.title), 'com o motivo no title');
}

console.log('\n═══ 5. SINGULAR E PLURAL ═══');
{
  _setUsers([{ id:1, nome:'A', aguardando_aprovacao:true }]);
  _setSel([1]); _setVis([1]);
  caixas = [caixa(1,true)];
  admBarraAtualizar();
  conf(els.admBlocoTxt.textContent === '1 selecionado', 'um so nao vira "1 selecionados"');
  conf(els.admBtnAprovar.textContent === '✓ Aprovar 1 selecionado', 'no botao tambem');
}

console.log('\n═══ 6. A BARRA SOME QUANDO NAO HA NADA ═══');
{
  _setSel([]); _setVis([1,2]);
  caixas = [caixa(1,false), caixa(2,false)];
  admBarraAtualizar();
  conf(els.admBarraBloco.style.display === 'none', 'escondida — barra com "0" vira paisagem');
}

console.log('\n═══ 7. A CAIXA DO CABECALHO TEM OS TRES ESTADOS ═══');
{
  caixas = [caixa(1,true), caixa(2,true)];
  admSelTodosEstado();
  conf(els.admSelTodos.checked === true && els.admSelTodos.indeterminate === false, 'todas marcadas → marcada');

  caixas = [caixa(1,true), caixa(2,false)];
  admSelTodosEstado();
  conf(els.admSelTodos.indeterminate === true, 'algumas → indeterminada');

  caixas = [caixa(1,false), caixa(2,false)];
  admSelTodosEstado();
  conf(els.admSelTodos.checked === false && els.admSelTodos.indeterminate === false, 'nenhuma → vazia');

  caixas = [];
  admSelTodosEstado();
  conf(els.admSelTodos.checked === false, 'tabela vazia nao deixa a caixa marcada');
}

console.log('\n═══ 8. MARCAR TODOS PEGA SO OS VISIVEIS ═══');
{
  _setSel([]);
  _setUsers([{ id:1, aguardando_aprovacao:true },{ id:2, aguardando_aprovacao:true }]);
  _setVis([1,2]);
  caixas = [caixa(1,false), caixa(2,false)];
  admSelTodos(true);
  conf(_getSel().length === 2, 'marcou os 2 da tela');
  // O 7 nem tem caixa: está fora do filtro, e "marcar todos" não pode alcançá-lo.
  conf(!_getSel().includes('7'), 'nao alcancou quem esta fora do filtro');

  admSelTodos(false);
  conf(_getSel().length === 0, 'desmarcar limpa os visiveis');
}

console.log('\n═══ 9. MARCAR TODOS NAO APAGA MARCACAO DE FORA DO FILTRO ═══');
{
  _setSel([5,6]);            // marcados, hoje fora da tela
  _setVis([1,2]);
  caixas = [caixa(1,false), caixa(2,false)];
  admSelTodos(true);
  const sel = _getSel();
  conf(sel.includes('5') && sel.includes('6'), 'os de fora continuam marcados');
  conf(sel.includes('1') && sel.includes('2'), 'e os visiveis entraram');
  admSelTodos(false);
  const sel2 = _getSel();
  conf(sel2.includes('5') && sel2.includes('6'), 'desmarcar os visiveis nao mexe nos de fora');
  conf(!sel2.includes('1'), 'e limpa os visiveis');
}

console.log('\n═══ 10. UM CLIQUE MARCA E DESMARCA ═══');
{
  _setSel([]); _setVis([4]);
  admSelToggle(4, true);
  conf(_getSel().includes('4'), 'marcou');
  admSelToggle(4, false);
  conf(!_getSel().includes('4'), 'desmarcou');
  // O id chega como string do HTML e como número do teste: os dois têm de casar.
  _setSel([]); admSelToggle('7', true); _setVis([7]);
  conf(admSelVisiveis().includes('7'), 'id em texto e id em numero sao a mesma pessoa');
}

console.log('\n═══ 11. OS LOTES: 47 PEDIDOS NAO SAEM DE UMA VEZ ═══');
{
  const ids = Array.from({ length: 47 }, (_, i) => String(i + 1));
  let simultaneos = 0, pico = 0;
  const r = await admEmLotes(ids, async () => {
    simultaneos++; pico = Math.max(pico, simultaneos);
    await new Promise(res => setTimeout(res, 1));
    simultaneos--;
  });
  conf(r.ok.length === 47, 'os 47 foram processados');
  conf(pico <= 5, 'nunca passa de 5 ao mesmo tempo', `pico ${pico}`);
}

console.log('\n═══ 12. FALHA NO MEIO DO LOTE NAO SOME ═══');
{
  const ids = ['1','2','3','4','5','6','7'];
  const r = await admEmLotes(ids, async id => {
    if (id === '3' || id === '6') throw new Error('rede caiu');
    return true;
  });
  conf(r.ok.length === 5, '5 passaram');
  conf(r.falhou.length === 2, '2 falharam e VOLTAM no relatorio', `veio ${r.falhou.length}`);
  conf(r.falhou[0].erro === 'rede caiu', 'com a mensagem original, para dar para agir');
  // O que falhou não pode ser dado como feito: o lote continua, mas o placar é honesto.
  conf(r.ok.length + r.falhou.length === 7, 'ninguem se perde entre os dois lados');
}

console.log('\n═══ 13. TRAVAS NO index.html ═══');
{
  const src = html;
  // O superadmin não se desativa: sem isto, um "desativar todos" com o próprio nome na
  // lista tira o superadmin do ar e não há quem religue pela tela.
  conf(/const alvoIds = ids\.filter\(id => id !== String\(U\.id\)\)/.test(src),
       'admAtivarBloco TIRA a propria conta do alvo');
  conf(/admAprovarBloco[\s\S]{0,900}?await moConfirm/.test(src),
       'aprovar em bloco passa pelo modal de confirmacao');
  conf(/admAtivarBloco[\s\S]{0,900}?await moConfirm/.test(src),
       'ativar/desativar em bloco tambem');
  // A confirmação precisa dizer o NÚMERO, não "os selecionados".
  conf(/Liberar o acesso de \$\{alvo\.length\} pessoa/.test(src),
       'a confirmacao diz quantas pessoas serao liberadas');
  conf(/option value="pend"/.test(src), 'o filtro "aguardando aprovacao" existe');
  conf(/white-space:pre-line/.test(src), 'o detalhe do modal respeita quebra de linha');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
})();
