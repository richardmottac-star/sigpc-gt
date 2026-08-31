// CAMINHO: sigpc-gt/teste_front_vinculo.js
//
// A FAIXA DE VINCULACAO MAE/PARCIAIS do modal do SGPe (F4), executando de verdade num DOM de
// mentira. Sem navegador, sem rede.
//
// ⚠️ O QUE ELA GUARDA: a faixa diz o TAMANHO da TR. Os numeros chegam prontos da rota
// (`GET /sgpe/vinculo`) e a tela NAO recalcula nenhum — recontar aqui daria o que coube na
// resposta, nao o que a TR tem, e um numero menor se le como o total.
//
// USO: node teste_front_vinculo.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const semComent = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

// ── extrair o que a faixa precisa ───────────────────────────────────────────
const fatia = (ini, fimMarca) => {
  const i = html.indexOf(ini);
  const f = html.indexOf('\n}', html.indexOf(fimMarca, i)) + 2;
  if (i < 0 || f <= i) throw new Error('nao achei: ' + ini);
  return html.slice(i, f);
};
const iV = html.indexOf('const VINC_AMBAR');
const fV = html.indexOf('function sgpeConsultaAbrir(bruto) {');
if (iV < 0 || fV < 0) { console.error('FALHA: nao achei o bloco da faixa no index.html.'); process.exit(1); }

// ⚠️ `campoProcPartir` E `campoAno4` VEM JUNTO, e nao como dubles: sao elas que quebram o
// processo nos tres pedacos que o link carrega (`data-s`/`data-n`/`data-a`). Um duble aqui
// faria o teste provar que o link tem OS ATRIBUTOS, e nao que eles levam os valores certos —
// que e a unica coisa que importa quando o clique preenche as caixas do topo.
const codigo = (
  fatia('function normalizarProcesso(str) {', 'return `${siglaBase} ${numero}/${mNum[2]}`') + '\n' +
  fatia('const PROC_RE =', 'function procInvalido(bruto)').replace(/\n\}[\s\S]*$/, '\n}') + '\n' +
  fatia('function campoProcPartir(txt) {', 'return { sigla, numero, ano: mA[2] }') + '\n' +
  fatia('function campoAno4(a) {', "return d.length === 2 ? '20' + d : d") + '\n' +
  html.slice(iV, fV)
).replace(/^(let|const) /gm, 'var ');

const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let els = {};
const ctx = {
  console, escHtml, API_URL: '',
  fetch: async () => ({ json: async () => ({ data: null }) }),
  document: { getElementById: (id) => els[id] || null },
};
vm.createContext(ctx);
vm.runInContext(codigo, ctx);

// ── o `data` da rota, como ela devolve ──────────────────────────────────────
const BLOCO = {
  encontrado: true, papel: 'parcial', tr: '2020TR000623', entidade: 'APAE DE PINHALZINHO',
  processo_mae: 'FCEE559/2020', total_pcs: 75, total_processos_parciais: 3, pcs_sem_processo: 1,
  processos: [
    { processo: 'SCC11160/2020', qtd: 12, parciais: ['1','2','3','4','5','6','7','8','9','10','11','12'], atual: true },
    { processo: 'SCC9460/2021',  qtd: 5,  parciais: ['41','42','43','44','final'], atual: false },
    { processo: 'AR355478172',   qtd: 2,  parciais: ['7','9'], atual: false },
  ],
};
const comPapel = (p) => ({ ...BLOCO, papel: p });

S('1. AS PARCIAIS');
const pp = ctx.sgpeVincParciais;
conf(pp(['1','2','3','4','5','6','7','8','9','10','11','12']) === 'parciais 1 a 12', 'contiguas viram intervalo', pp(['1','2','3']));
conf(pp(['41','42','43','44','final']) === 'parciais 41 a 44, final', 'e a final vai depois do intervalo', pp(['41','42','43','44','final']));
// ⚠️ NAO CONTIGUAS SAO LISTADAS, e nao viram "1 a 7": o intervalo afirmaria que a 3 esta la.
conf(pp(['1','3','7']) === 'parciais 1, 3, 7', 'nao contiguas saem como estao', pp(['1','3','7']));
conf(pp(['10','2','1']) === 'parciais 1, 2, 10', 'e saem ordenadas por NUMERO, nao por texto', pp(['10','2','1']));
conf(pp(['5']) === 'parcial 5', 'uma so vira singular', pp(['5']));
conf(pp(['final']) === 'final', 'so a final');
conf(pp([]) === '' && pp(null) === '', 'lista vazia nao escreve nada');

S('2. O CABECALHO');
let h = ctx.sgpeVincHtml(BLOCO);
conf(h.includes('2020TR000623') && h.includes('APAE DE PINHALZINHO'), 'TR e entidade em destaque');
conf(/75 PCs/.test(h) && /3 processos/.test(h), 'os numeros vem PRONTOS da rota');
conf(/1 sem processo/.test(h), 'e o "sem processo" aparece quando ha');
// ⚠️ A TELA NAO RECALCULA NADA: a soma das qtd desta amostra e 19, e o cabecalho diz 75.
// E o certo — a rota viu as 75 PCs da TR, e a lista traz so os processos.
conf(BLOCO.processos.reduce((n, p) => n + p.qtd, 0) !== BLOCO.total_pcs && /75 PCs/.test(h),
     'e diz o total da ROTA, nao a soma do que esta na lista');
const semZero = ctx.sgpeVincHtml({ ...BLOCO, pcs_sem_processo: 0 });
conf(!/sem processo/.test(semZero), 'com zero sem processo, essa parte NAO aparece');

S('3. A FAIXA DA MAE');
conf(/>mãe</.test(h), 'tem a etiqueta "mãe"');
conf(h.includes('#EAF1F9'), 'e fundo azul claro quando o consultado e um parcial');
conf(!/>mãe</.test(ctx.sgpeVincHtml({ ...BLOCO, processo_mae: null })), 'sem processo_mae, a faixa NAO aparece');
// ⚠️ AZUL E SO DA MAE — nenhuma linha da lista o usa.
const linhasSo = h.slice(h.indexOf('flex-direction:column'));
conf(!linhasSo.includes('#EAF1F9'), 'e o azul nao vaza para a lista');

S('4. O CONSULTADO');
conf(h.includes('#FAEEDA') && />consultado</.test(h), 'o atual leva fundo ambar e a etiqueta');
// ⚠️ O NUMERO VALIDO SAI NORMALIZADO — `SCC11160/2020` vira `SCC 00011160/2020` pelo
// `normalizarProcesso`, que e o mesmo de todas as listas do sistema. So o INVALIDO sai cru
// (secao 6), porque ali normalizar seria a tela consertando texto que ela nao entendeu.
const alvoAtual = ctx.normalizarProcesso('SCC11160/2020');
conf(h.includes(alvoAtual), 'o processo valido sai normalizado', alvoAtual);
const iAtual = h.indexOf(alvoAtual);
const linhaAtual = h.slice(Math.max(0, iAtual - 400), iAtual + 400);
conf(/#FAEEDA/.test(linhaAtual) && />consultado</.test(linhaAtual), 'e e a linha do processo consultado');
conf((h.match(/>consultado</g) || []).length === 1, 'so UM "consultado" na faixa inteira',
     (h.match(/>consultado</g) || []).length);

S('5. CONSULTANDO PELA MAE');
// ⚠️ O AMBAR VAI PARA A FAIXA AZUL, e NENHUMA linha da lista se destaca (decisao do Richard).
const hm = ctx.sgpeVincHtml(comPapel('mae'));
const blocoMae = hm.slice(0, hm.indexOf('flex-direction:column'));
conf(/#FAEEDA/.test(blocoMae) && />mãe</.test(blocoMae), 'a faixa da mae fica ambar');
conf(/>consultado</.test(blocoMae), 'e ganha a etiqueta "consultado" junto com a de "mãe"');
conf((hm.match(/>consultado</g) || []).length === 1, 'e ha UM so na faixa toda',
     (hm.match(/>consultado</g) || []).length);
// O `atual: true` do SCC11160 continua vindo da rota, e mesmo assim a linha nao se destaca.
const listaMae = hm.slice(hm.indexOf('flex-direction:column'));
conf(!/>consultado</.test(listaMae), 'nenhuma linha da lista fica destacada, mesmo com atual=true');

S('6. O PROCESSO INVALIDO');
// `AR355478172` nao forma processo — e o `procInvalido` da tela que decide, o mesmo das listas.
conf(ctx.procInvalido('AR355478172') === true, 'o AR355478172 e invalido para a tela');
const linhaInv = h.slice(h.indexOf('AR355478172') - 500, h.indexOf('AR355478172') + 300);
conf(/line-through/.test(linhaInv), 'o numero sai riscado');
conf(/#8A5A00/.test(linhaInv), 'em #8A5A00');
conf(/processo inválido/.test(linhaInv), 'com o texto "processo inválido"');
conf(/#FAEEDA/.test(linhaInv), 'e fundo #FAEEDA');
conf(linhaInv.includes('AR355478172'), 'e o valor CRU, sem a tela tentar consertar');
// ⚠️ INVALIDO QUE TAMBEM E O CONSULTADO MOSTRA AS DUAS COISAS — o fundo e o mesmo, e e a
// ETIQUETA que separa (decisao do Richard).
const hInvAtual = ctx.sgpeVincHtml({ ...BLOCO,
  processos: [{ processo: 'AR355478172', qtd: 2, parciais: ['7'], atual: true }] });
conf(/line-through/.test(hInvAtual) && />consultado</.test(hInvAtual),
     'invalido E consultado mostra o riscado e a etiqueta');

S('7. O RODAPE');
conf(/1 PC sem processo gravado/.test(h), 'diz quantas PCs nao tem processo', 'singular');
conf(/3 PCs sem processo gravado/.test(ctx.sgpeVincHtml({ ...BLOCO, pcs_sem_processo: 3 })), 'no plural tambem');
conf(!/sem processo gravado/.test(semZero), 'e some quando nao ha nenhuma');

S('8. NA TELA');
conf(/<div id="sgpeVinculo"><\/div>/.test(semComent), 'o lugar da faixa existe no modal');
// ⚠️ DENTRO DO MIOLO QUE ROLA: fora dele viraria uma segunda area fixa, e numa TR de 58
// processos empurraria a linha do tempo para fora da janela.
const iRol = semComent.indexOf('id="sgpeRolagem"');
const iVin = semComent.indexOf('id="sgpeVinculo"');
const iRec = semComent.indexOf('id="sgpeRecentes"');
conf(iRol > 0 && iVin > iRol, 'dentro do miolo que rola');
conf(iVin > semComent.indexOf('id="sgpeSaida"') && iVin < iRec, 'ABAIXO do resultado e acima das recentes');
// ⚠️ CARREGA SOZINHA na consulta que deu certo, e some no comeco de CADA consulta.
conf(/sgpeVincCarregar\(`\$\{s\} \$\{n\}\/\$\{a\}`\)/.test(semComent), 'a consulta que deu certo chama a faixa');
conf(/sgpeVincLimpar\(\)/.test(semComent), 'e cada consulta limpa a anterior antes');
const iLimpa = semComent.indexOf('sgpeVincLimpar()');
const iCarrega = semComent.indexOf('sgpeVincCarregar(`');
conf(iLimpa > 0 && iCarrega > iLimpa, 'e o limpar vem ANTES do carregar');
// ⚠️ SEM `await`: o resultado que a pessoa pediu nao espera pela faixa.
conf(!/await sgpeVincCarregar/.test(semComent), 'e a faixa nao segura o resultado da consulta');

S('9. NAO ACHOU: SILENCIO');
// ⚠️ `encontrado: false` APAGA E NAO DIZ NADA — o processo pode ser de outro orgao e nao
// estar no acervo do GT. Escrever "nao encontrado" afirmaria uma ausencia que a rota nao
// conhece. Idem para falha de rede: a consulta ao SGPe ja respondeu logo acima.
const corpo = (html.match(/async function sgpeVincCarregar[\s\S]*?\n\}/) || [''])[0];
conf(/if\(!d \|\| !d\.encontrado\) return/.test(corpo), 'nao encontrado devolve sem desenhar');
conf(/catch\(_\) \{/.test(corpo), 'e a falha de rede e engolida');
conf(!/toast\(|sgpeCaixa\(/.test(corpo), 'sem toast e sem caixa de erro');
// A janela pode ter fechado enquanto a resposta voltava.
conf(/const alvo = document\.getElementById\('sgpeVinculo'\)/.test(corpo),
     'e o alvo e relido depois do await — a janela pode ter fechado');

S('9b. OS NUMEROS SAO LINK');
{
  const hL = ctx.sgpeVincHtml(BLOCO);            // consultado = SCC11160/2020, papel=parcial
  const link = (txt) => {
    const i = hL.indexOf(ctx.normalizarProcesso(txt));
    return hL.slice(Math.max(0, i - 420), i + 60);
  };
  // ⚠️ NAO SAO `<a href>`: um href navegaria, e a regra e "tudo dentro do modal". Sao botoes
  // com `data-f`, atendidos pelo MESMO ouvinte das consultas recentes.
  conf(/data-f="vinc"/.test(hL), 'os links saem com data-f="vinc"');
  conf(!/<a [^>]*href/.test(hL), 'e NAO sao <a href> — nada navega para fora');
  conf(!/target="_blank"/.test(hL), 'nem abre aba nova');

  const l1 = link('SCC9460/2021');
  conf(/data-f="vinc"/.test(l1), 'um processo qualquer da lista e link');
  conf(/class="proc-link"/.test(l1), 'com o estilo azul sublinhado que ja existe');
  conf(/cursor:pointer/.test(l1), 'e cursor de mao');
  // ⚠️ OS TRES PEDACOS TEM DE CHEGAR CERTOS — e o que o clique poe nas caixas do topo.
  conf(/data-s="SCC"/.test(l1) && /data-n="9460"/.test(l1) && /data-a="2021"/.test(l1),
       'e leva sigla, numero e ano separados', l1.match(/data-[sna]="[^"]*"/g));

  // ⚠️ O CONSULTADO NAO E LINK: ele ja e o que esta na tela.
  const lAtual = link('SCC11160/2020');
  conf(!/data-f="vinc"/.test(lAtual), 'o consultado NAO e link');
  conf(!/proc-link/.test(lAtual), 'e sai em texto normal, sem sublinhado');

  // ⚠️ O INVALIDO NAO E LINK: nao ha o que consultar. Fica com o bege que ja tinha.
  const iInv = hL.indexOf('AR355478172');
  const lInv = hL.slice(Math.max(0, iInv - 420), iInv + 200);
  conf(!/data-f="vinc"/.test(lInv), 'o invalido NAO e link');
  conf(/line-through/.test(lInv) && /#FAEEDA/.test(lInv), 'e mantem o tratamento bege riscado');

  // ⚠️ A MAE E LINK QUANDO NAO E A CONSULTADA, e deixa de ser quando e.
  const maeParcial = hL.slice(0, hL.indexOf('flex-direction:column'));
  conf(/data-f="vinc"/.test(maeParcial), 'a mae e link quando o consultado e um parcial');
  const maeMae = ctx.sgpeVincHtml(comPapel('mae'));
  conf(!/data-f="vinc"/.test(maeMae.slice(0, maeMae.indexOf('flex-direction:column'))),
       'e deixa de ser link quando ela mesma e a consultada');

  // ⚠️ CONSULTANDO PELA MAE, a lista inteira vira link — nenhuma linha e a consultada.
  const listaMae2 = maeMae.slice(maeMae.indexOf('flex-direction:column'));
  conf((listaMae2.match(/data-f="vinc"/g) || []).length === 2,
       'e as duas linhas validas da lista viram link (a invalida nao)',
       (listaMae2.match(/data-f="vinc"/g) || []).length);
}

S('9c. O CLIQUE NAO TEM CAMINHO PROPRIO');
// ⚠️ UM RAMO SO PARA `rec` E `vinc`. Sao o mesmo pedido — "preencha os tres campos e
// consulte" —, e o que a `consultar()` faz depois (limpar a faixa, gravar a recente, rolar ao
// topo, tratar os quatro erros da rota) nao se copia sem esquecer um pedaco.
conf(/if\(f === 'rec' \|\| f === 'vinc'\) \{/.test(semComent), 'rec e vinc dividem UM ramo');
conf(!/if\(f === 'vinc'\) \{/.test(semComent), 'e nao ha um segundo ramo so para o vinc');
{
  const ramo = semComent.slice(semComent.indexOf("if(f === 'rec' || f === 'vinc')"));
  const fim = ramo.indexOf('}');
  const corpo = ramo.slice(0, fim + 1);
  conf(/cSig\.value = alvo\.getAttribute\('data-s'\)/.test(corpo), 'ele preenche a sigla');
  conf(/cNum\.value/.test(corpo) && /cAno\.value/.test(corpo), 'o numero e o ano');
  conf(/return consultar\(\)/.test(corpo), 'e chama a MESMA `consultar` do botao Consultar');
}
// E a faixa se redesenha porque a `consultar` ja limpa e recarrega — nada novo para isso.
conf(/sgpeVincLimpar\(\)/.test(semComent) && /sgpeVincCarregar\(/.test(semComent),
     'e a faixa se redesenha pelo caminho que ja existia');

S('10. A CORRIDA ENTRE DUAS CONSULTAS');
//
// ⚠️ SEM `await`, LIMPAR NAO CANCELA — so apaga o que esta na tela. A resposta que ja estava
// voltando escreve por cima depois, e a TR do processo ANTERIOR aparece embaixo do resultado
// do NOVO. E facil de provocar: consultar A, consultar B, e A demorar mais.
//
// Este teste roda os dois carregamentos de verdade, com a resposta de A chegando DEPOIS da
// de B, e exige que o que fique na tela seja o de B.
(async () => {
  const respostas = {
    'A': { ...BLOCO, tr: '2020TR000AAA', entidade: 'ENTIDADE A' },
    'B': { ...BLOCO, tr: '2020TR000BBB', entidade: 'ENTIDADE B' },
  };
  let atrasoDeA = null;
  els = { sgpeVinculo: { innerHTML: '' } };
  ctx.fetch = async (url) => {
    const qual = /A$/.test(url) ? 'A' : 'B';
    if (qual === 'A') await new Promise(r => { atrasoDeA = r; });   // A fica presa
    return { json: async () => ({ data: respostas[qual], error: null }) };
  };

  const pA = ctx.sgpeVincCarregar('A');     // pede A — fica presa
  const pB = ctx.sgpeVincCarregar('B');     // pede B — volta na hora
  await pB;
  conf(/2020TR000BBB/.test(els.sgpeVinculo.innerHTML), 'B chegou e desenhou');

  atrasoDeA();                              // agora A volta, ATRASADA
  await pA;
  conf(/2020TR000BBB/.test(els.sgpeVinculo.innerHTML) && !/2020TR000AAA/.test(els.sgpeVinculo.innerHTML),
       'e a resposta ATRASADA de A NAO escreve por cima de B');

  // ⚠️ E O LIMPAR CANCELA DE VERDADE: quem estiver voltando depois dele nao escreve mais.
  els.sgpeVinculo.innerHTML = '';
  let solta = null;
  ctx.fetch = async () => { await new Promise(r => { solta = r; });
                            return { json: async () => ({ data: respostas['A'], error: null }) }; };
  const pC = ctx.sgpeVincCarregar('C');
  ctx.sgpeVincLimpar();                     // a pessoa consultou outra coisa
  solta();
  await pC;
  conf(els.sgpeVinculo.innerHTML === '', 'depois do limpar, a resposta em voo nao desenha nada',
       els.sgpeVinculo.innerHTML.slice(0, 60));

  // A janela fechada continua protegida pela segunda guarda.
  els = {};
  ctx.fetch = async () => ({ json: async () => ({ data: respostas['A'], error: null }) });
  let caiu = false;
  try { await ctx.sgpeVincCarregar('A'); } catch (_) { caiu = true; }
  conf(!caiu, 'e a janela fechada no meio do caminho nao derruba nada');

  console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
  process.exit(falhou ? 1 : 0);
})();
