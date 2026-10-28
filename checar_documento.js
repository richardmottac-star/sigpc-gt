// CAMINHO: sigpc-gt/checar_documento.js
//
// PROVA QUE O RELATÓRIO DO CGE NÃO USA VARIÁVEL QUE NÃO EXISTE.   (27/10/2026)
//
// USO: node checar_documento.js
//
// ─────────────────────────────────────────────────────────────────────────────
// POR QUE ELE EXISTE
//
// Em 27/10 acrescentei quatro colunas ao rodapé do Quadro 2 — `metaTotalAcum`, `totAcumSec`,
// `totAcumTec`, `totAcum`. A tela gerava e parava em **"metaTotalAcum is not defined"**, com o
// relatório inteiro em branco. Consertei, e o MESMO erro voltou com outro nome
// (**"totAcumSec is not defined"**), porque o caminho tem duas pontas: a `cgeGerar` apura e
// guarda em `_cgeParams`, a `cgeMontarDocumento` lê e desenha. Faltava nas duas.
//
// ⚠️ NEM `node --check` NEM O `checar_tela.js` PEGAM ISSO. `${algoQueNaoExiste}` é
// sintaticamente válido, e o `checar_tela` prova que toda FUNÇÃO chamada existe — variável é
// outra classe de erro. Só estourava ao abrir, escolher o período, esperar a busca das 16 mil
// PCs e clicar em gerar: o custo de descobrir era um minuto por tentativa.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ CADA FUNÇÃO É CONFERIDA CONTRA O PRÓPRIO ESCOPO, E ISSO FOI UM DEFEITO MEU
//
// A primeira versão juntava as duas funções num corpo só. Com isso, uma variável declarada na
// `cgeMontarDocumento` passava a "cobrir" o uso dela na `cgeGerar` — e o teste ficava VERDE
// sobre o erro que existe para pegar. Provado na hora: removi a declaração da `cgeGerar` e ele
// aprovou. Escopo somado é escopo nenhum.
//
// ⚠️ E ELE OLHA TAMBÉM O ATALHO DE OBJETO, que é como o erro apareceu da segunda vez:
// `_cgeParams = { sid, totAcumSec, ... }` não tem `${}` nenhum. O atalho `{ a }` é `a: a` — o
// identificador tem de existir igual, e ninguém o vê ao ler.
//
// ⚠️ É DELIBERADAMENTE CONSERVADOR: na dúvida, aceita. Um teste que acusa o que está certo
// deixa de ser lido na terceira vez — e aí não acusa mais nada.

const fs = require('fs');

const src = fs.readFileSync('index.html', 'utf8');
let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};

// As globais do arquivo: declaradas na margem, sem indentação.
const global = new Set();
for (const m of src.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) global.add(m[1]);
for (const m of src.matchAll(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) global.add(m[1]);

const EMBUTIDOS = new Set(['Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number',
  'Boolean', 'Set', 'Map', 'Promise', 'console', 'document', 'window', 'parseInt',
  'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent', 'fetch', 'localStorage',
  'Intl', 'RegExp', 'Error', 'undefined', 'null', 'true', 'false', 'this', 'new',
  'typeof', 'Infinity', 'NaN', 'await']);

function declaradasEm(corpo) {
  const d = new Set();
  for (const m of corpo.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) d.add(m[1]);
  for (const m of corpo.matchAll(/(?:const|let|var)\s*\{([^}]+)\}/g)) {
    for (const p of m[1].split(',')) {
      const nome = p.split(':').pop().split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nome)) d.add(nome);
    }
  }
  for (const m of corpo.matchAll(/(?:const|let|var)\s*\[([^\]]+)\]/g)) {
    for (const p of m[1].split(',')) {
      const nome = p.split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nome)) d.add(nome);
    }
  }
  for (const m of corpo.matchAll(/\(([^)]*)\)\s*=>/g)) {
    for (const p of m[1].split(',')) {
      const nome = p.split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nome)) d.add(nome);
    }
  }
  // ⚠️ A seta SEM parênteses também — `.map(r => ...)`. Sem isto o teste acusava o `r` do
  // Quadro 3, certo há meses.
  for (const m of corpo.matchAll(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*=>/gm)) d.add(m[1]);
  for (const m of corpo.matchAll(/(?:for|catch)\s*\(\s*(?:const|let|var)?\s*([A-Za-z_$][\w$]*)/g)) d.add(m[1]);
  return d;
}

function usadasEm(corpo) {
  const u = new Set();
  // o PRIMEIRO identificador de cada `${...}` — o resto são propriedades e métodos
  for (const m of corpo.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)/g)) u.add(m[1]);
  // e o atalho de objeto do `_cgeParams`
  for (const m of corpo.matchAll(/_cgeParams\s*=\s*\{([^}]*)\}/g)) {
    for (const p of m[1].split(',')) {
      const nome = p.trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nome)) u.add(nome);
    }
  }
  return u;
}

// ⚠️ AS DUAS PONTAS DO CAMINHO, cada uma no seu escopo. Somá-las foi o defeito da v1.
const ALVOS = [
  { nome: 'cgeGerar — apura e guarda em _cgeParams',
    de: 'async function cgeGerar()', ate: '\nasync function cgeMontarDocumento' },
  { nome: 'cgeMontarDocumento — lê e desenha o papel',
    de: 'async function cgeMontarDocumento(', ate: '\nfunction cgeImprimir' },
  { nome: 'cgeExportExcel — a planilha',
    de: 'function cgeExportExcel(', ate: '\nasync function cgeMontarDocumento' },
];

console.log('\n═══ O RELATÓRIO DO CGE — variável usada e não declarada ═══');

for (const alvo of ALVOS) {
  const i = src.indexOf(alvo.de);
  const j = i >= 0 ? src.indexOf(alvo.ate, i) : -1;
  if (i < 0 || j <= i) { conf(false, `achei a ${alvo.nome}`); continue; }
  const corpo = src.slice(i, j);
  const dec = declaradasEm(corpo);
  const usa = usadasEm(corpo);
  const falta = [...usa].filter((v) => !dec.has(v) && !global.has(v) && !EMBUTIDOS.has(v));
  conf(falta.length === 0, `${alvo.nome} (${usa.size} conferidas)`, falta.join(', '));
}

// ⚠️ E AS QUATRO DO QUADRO 2 POR NOME, NAS DUAS PONTAS — foram elas que quebraram, e um teste
// genérico que um dia afrouxe não pode levar junto o caso que o fez nascer.
{
  const iG = src.indexOf('async function cgeGerar()');
  const corpoG = src.slice(iG, src.indexOf('\nasync function cgeMontarDocumento', iG));
  const iM = src.indexOf('async function cgeMontarDocumento(');
  const corpoM = src.slice(iM, src.indexOf('\nfunction cgeImprimir', iM));
  const decG = declaradasEm(corpoG), decM = declaradasEm(corpoM);
  for (const v of ['metaTotalAcum', 'totAcum', 'totAcumSec', 'totAcumTec']) {
    conf(decG.has(v), `cgeGerar declara \`${v}\``);
    conf(decM.has(v), `cgeMontarDocumento declara \`${v}\``);
  }
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
