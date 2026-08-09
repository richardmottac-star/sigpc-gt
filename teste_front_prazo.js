// CAMINHO: sigpc-gt/teste_front_prazo.js
//
// Testes do PRAZO DE ANÁLISE — dias, faixa de cor, célula e balão de ajuda.
// Extrai as funções do próprio index.html e roda em Node. Sem navegador, sem rede.
//
// O que protege: a cor da tabela e o texto do balão saem da MESMA função. Se um dia
// divergirem, a tela mostra a data em vermelho dizendo "dentro do prazo".
//
// USO: node teste_front_prazo.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const ini = html.indexOf('const planData  =');
const fim = html.indexOf('let _prazoBalao = null');
if (ini < 0 || fim < 0) {
  console.error('FALHA: nao achei o bloco do prazo no index.html.');
  process.exit(1);
}
const ctx = { console, escHtml: (s) => String(s ?? '') };
vm.createContext(ctx);
vm.runInContext(html.slice(ini, fim), ctx);
const { prazoDias, prazoSituacao, prazoCelula, prazoIcone } = ctx;

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// data relativa a hoje, no formato que o banco devolve
const emDias = (n) => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

console.log('\n═══ 1. prazoDias — sinal igual ao da API (CURRENT_DATE - dt_limite_pc) ═══');
{
  conf(prazoDias(emDias(-10)) === 10, 'venceu ha 10 dias -> +10 (positivo = vencida)');
  conf(prazoDias(emDias(0)) === 0, 'vence hoje -> 0');
  conf(prazoDias(emDias(10)) === -10, 'vence em 10 dias -> -10');
  conf(prazoDias(null) === null && prazoDias('') === null, 'sem data -> null');
  // formato que a API devolve de verdade, com hora e Z
  conf(prazoDias(emDias(-5) + 'T03:00:00.000Z') === 5, 'aceita o timestamp completo da API');
}

console.log('\n═══ 2. AS TRES FAIXAS ═══');
{
  const v = prazoSituacao(emDias(-2323));
  conf(v.faixa === 'vencida' && v.cor === 'var(--r)', 'vencida -> vermelho');
  conf(v.texto === 'Venceu há 2323 dias. Continua analisável, mas com risco de prescrição.', 'texto da vencida', v.texto);

  const h = prazoSituacao(emDias(0));
  conf(h.faixa === 'avencer' && h.cor === 'var(--am)', 'vence hoje -> amarelo');
  conf(h.texto === 'Vence hoje.', 'nao diz "vence em 0 dias"', h.texto);

  const a = prazoSituacao(emDias(30));
  conf(a.faixa === 'avencer' && a.cor === 'var(--am)', 'vence em 30 dias -> amarelo (borda inclusiva)');
  conf(a.texto === 'Vence em 30 dias.', 'texto do a vencer', a.texto);

  const n = prazoSituacao(emDias(31));
  conf(n.faixa === 'noprazo' && n.cor === 'var(--ct)', 'vence em 31 dias -> cinza');
  conf(n.texto === 'Dentro do prazo.', 'texto do no prazo', n.texto);

  const s = prazoSituacao(null);
  conf(s.faixa === null && s.cor === 'var(--ct)', 'sem prazo -> cinza, sem faixa');
  conf(/Sem prazo informado/.test(s.texto), 'texto do sem prazo');
}

console.log('\n═══ 3. SINGULAR E PLURAL ═══');
{
  conf(prazoSituacao(emDias(-1)).texto.includes('há 1 dia.'), '1 dia, nao "1 dias"', prazoSituacao(emDias(-1)).texto);
  conf(prazoSituacao(emDias(-2)).texto.includes('há 2 dias.'), '2 dias');
  conf(prazoSituacao(emDias(1)).texto === 'Vence em 1 dia.', 'vence em 1 dia', prazoSituacao(emDias(1)).texto);
}

console.log('\n═══ 4. A CELULA ═══');
{
  const c = prazoCelula(emDias(-100));
  conf(/color:var\(--r\)/.test(c), 'vencida sai em vermelho');
  conf(/font-weight:700/.test(c), 'e em negrito');
  conf(/class="prazo-ajuda"/.test(c), 'traz o icone de ajuda');
  conf(/data-prazo="/.test(c), 'o icone carrega a data');

  const c2 = prazoCelula(emDias(300));
  conf(/color:var\(--ct\)/.test(c2), 'no prazo sai em cinza');
  conf(!/font-weight:700/.test(c2), 'e sem negrito');

  const c3 = prazoCelula(null);
  conf(/—/.test(c3), 'sem data mostra travessao');
}

console.log('\n═══ 5. COERENCIA — a cor da celula e a do balao vem da MESMA fonte ═══');
{
  // Se alguem duplicar a regra, este teste continua passando; o que ele trava e a
  // divergencia de VALOR entre o que a celula pinta e o que a situacao diz.
  for (const n of [-2323, -1, 0, 1, 30, 31, 500]) {
    const s = prazoSituacao(emDias(n));
    const celula = prazoCelula(emDias(n));
    conf(celula.includes(`color:${s.cor};`), `dia ${n}: celula usa a cor da situacao (${s.cor})`);
  }
}

console.log('\n═══ 6. O BALAO, NO CODIGO ═══');
{
  const bloco = html.slice(html.indexOf('function prazoAjuda(ev, el)'), html.indexOf('// Clique em qualquer lugar fora'));
  conf(/ev\.stopPropagation\(\)/.test(bloco), 'o clique no icone nao sobe para o document');
  conf(/prazoAjudaFechar\(\)/.test(bloco), 'fecha o balao anterior antes de abrir outro');
  conf(/jaAberto/.test(bloco), 'clicar de novo no mesmo icone fecha');
  conf(/bal\.addEventListener\('click'/.test(bloco), 'clicar DENTRO do balao nao fecha');
  conf(/offsetWidth/.test(bloco) && /offsetHeight/.test(bloco), 'posiciona conferindo se cabe na tela');

  conf(/document\.addEventListener\('click', prazoAjudaFechar\)/.test(html), 'clique fora fecha');
  conf(/e\.key === 'Escape'/.test(html), 'Escape fecha');
  conf(/class="pb-x"/.test(html), 'tem botao X');
  conf(/position:absolute/.test(html.slice(html.indexOf('.prazo-balao {'), html.indexOf('.prazo-balao h4'))),
       'o balao e absolute no body — nao seria cortado pelo overflow da tabela');
}

console.log('\n═══ 7. CONTEUDO DO BALAO, NA ORDEM PEDIDA ═══');
{
  const bloco = html.slice(html.indexOf('bal.innerHTML = `'), html.indexOf('bal.addEventListener'));
  const ordem = ['Prazo de análise', 'Data-limite para a FCEE analisar esta PC',
                 'definida por lote na origem', 'pb-sit', 'pb-leg'];
  let pos = -1, emOrdem = true;
  for (const t of ordem) {
    const p = bloco.indexOf(t);
    if (p < 0 || p < pos) emOrdem = false;
    pos = p;
  }
  conf(emOrdem, 'titulo -> explicacao -> situacao -> legenda');
  conf(/não é recebimento mais 150 dias/.test(bloco), 'diz que NAO e recebimento + 150 dias');
  conf((bloco.match(/<hr>/g) || []).length === 2, 'duas linhas separadoras', String((bloco.match(/<hr>/g) || []).length));
  for (const cor of ['vermelho', 'amarelo', 'cinza']) conf(bloco.includes(cor), `legenda cita ${cor}`);
}

console.log('\n═══ 8. ONDE O ICONE APARECE ═══');
{
  conf(/\$\{prazoCelula\(p\.dt_limite_pc\)\}/.test(html), 'Minha Planilha: coluna do prazo');
  conf(/\$\{prazoIcone\(r\.dt_limite_pc\)\}/.test(html), 'Alertas de prazo: ao lado do atraso');
  conf(!/Prazo PC/.test(html), 'o cabecalho antigo "Prazo PC" nao existe mais');
  conf(/>Prazo de análise</.test(html), 'o cabecalho novo esta la');
  // o calculo antigo, inline, tem de ter saido — senao haveria duas formulas
  conf(!/const vencida = dias !== null && dias > 0/.test(html), 'o calculo inline duplicado foi removido');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
