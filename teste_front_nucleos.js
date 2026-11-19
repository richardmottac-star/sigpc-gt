// CAMINHO: sigpc-gt/teste_front_nucleos.js
//
// OS CONTATOS DOS NÚCLEOS — o card do Dashboard e o item do menu.  Só leitura.
//
//   node teste_front_nucleos.js
//
// ─────────────────────────────────────────────────────────────────────────────
// O QUE ISTO PROTEGE
//
// São dois caminhos para o MESMO endereço (19/11/2026, pedido do Richard): o card na primeira
// dobra do Dashboard, que é o que faz alguém descobrir, e o item do menu, que é o que serve a
// quem já sabe. O jeito de isso apodrecer é um dos dois ficar para trás.
//
// ⚠️ O TESTE QUE IMPORTA É O 4. Se alguém escrever a URL à mão no card em vez de usar
// `${URL_NUCLEOS}`, nada quebra HOJE — e no dia em que o endereço mudar, um dos dois caminhos
// continua apontando para o vazio. O que ninguém clica é o que ninguém descobre que quebrou.

const fs = require('fs');
const S = fs.readFileSync('index.html', 'utf8');

let ok = 0, x = 0;
const t = (nome, cond, detalhe) => {
  if (cond) { console.log(`  OK    ${nome}`); ok++; }
  else { console.log(`  X     ${nome}${detalhe ? ' -> ' + detalhe : ''}`); x++; }
};

const conta = (re) => (S.match(re) || []).length;

console.log('\n═══ CONTATOS DOS NÚCLEOS — card do Dashboard e item do menu ═══');

// 1. A constante existe, e existe UMA vez.
t('URL_NUCLEOS declarada uma única vez',
  conta(/const URL_NUCLEOS\s*=/g) === 1,
  `${conta(/const URL_NUCLEOS\s*=/g)} declarações`);

// 2. `irNucleos` abre em aba nova COM noopener.
//
// ⚠️ SEM `noopener` A PÁGINA ABERTA RECEBE `window.opener` e pode navegar a aba do sistema
// para onde quiser. É destino de terceiro — a regra vale mesmo confiando nele.
const fn = (S.match(/function irNucleos\(\)\s*\{[\s\S]*?\n\}/) || [''])[0];
t('irNucleos existe', !!fn);
t('irNucleos usa noopener', /noopener/.test(fn), fn ? 'sem noopener' : 'função não achada');
t('irNucleos abre em aba nova', /_blank/.test(fn));
t('irNucleos usa a constante, não a URL escrita à mão',
  /URL_NUCLEOS/.test(fn) && !/https?:\/\//.test(fn));

// 3. O item do menu: bloco do analista, visível a TODOS os perfis.
//
// ⚠️ `pode:()=>true` INCLUI O CONTROLE INTERNO, que fica de fora de quase tudo no bloco
// Principal por `naoEhCI`. Aquela regra existe para telas que só lhe ofereceriam ações que não
// são dele; esta não oferece ação nenhuma — é um endereço, e ele também liga para o Núcleo.
const item = (S.match(/\{ id:'nucleos',[\s\S]*?\},/) || [''])[0];
t('item nucleos existe no SB_ITENS', !!item);
t('item nucleos vive no bloco do analista', /bloco:'analista'/.test(item));
t('item nucleos é visível a todos os perfis', /pode:\(\)=>true/.test(item),
  'está com guarda de perfil — o C.I. perderia o acesso');
t('item nucleos chama irNucleos()', /acao:'irNucleos\(\)'/.test(item));
t('item nucleos tem ícone', /icone:'M/.test(item));

// ⚠️ E ELE VEM DEPOIS DO REPOSITÓRIO: os dois são material de CONSULTA, não acervo de
// trabalho. A ordem é a decisão, e é por isso que ela é testada.
t('item nucleos vem depois do Repositório no menu',
  S.indexOf("{ id:'nucleos'") > S.indexOf("{ id:'repo'"));

// 4. O card do Dashboard — ⚠️ O TESTE QUE IMPORTA.
const iCard = S.indexOf('Precisa falar com o Núcleo da região?');
const iManual = S.indexOf('<div class="mn" id="manualCard">');
t('o card está no Dashboard', iCard > -1);
t('o card vem ANTES do Manual do Analista', iCard > -1 && iManual > -1 && iCard < iManual,
  'o manual se lê uma vez; o endereço se consulta toda semana');
t('o card usa ${URL_NUCLEOS} no href, e não a URL à mão',
  /href="\$\{URL_NUCLEOS\}"/.test(S));
t('o card abre em aba nova com noopener',
  /href="\$\{URL_NUCLEOS\}" target="_blank" rel="noopener"/.test(S));
t('o botão do card diz "Clique aqui"', /Clique aqui/.test(S));

// 5. ⚠️ A URL APARECE UMA VEZ SÓ NO ARQUIVO INTEIRO — fora dos comentários. É o que garante
// que os dois caminhos acima apontam para o mesmo lugar para sempre.
const urlCrua = conta(/https:\/\/ngcnucleos\.abacusai\.app/g);
t('a URL literal aparece uma vez só no arquivo', urlCrua === 1,
  `${urlCrua} ocorrências — a segunda é a que vai ficar velha`);

// 6. ⚠️ O CARD NÃO PODE ROUBAR O `id` DO MANUAL. `manualCardTg` procura `#manualCard` pelo id;
// dois elementos com o mesmo id fariam o clique no manual abrir o card errado.
t('o card não tem id="manualCard"', conta(/id="manualCard"/g) === 1,
  `${conta(/id="manualCard"/g)} elementos com esse id`);

console.log(`\n═══ RESULTADO: ${ok} passaram · ${x} falharam ═══\n`);
process.exit(x ? 1 : 0);
