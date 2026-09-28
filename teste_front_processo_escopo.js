// CAMINHO: sigpc-gt/teste_front_processo_escopo.js
//
// O MODAL DO LAPIS PERGUNTA O QUE CORRIGIR  (27/09/2026)
//
// ⚠️ O QUE ELE GUARDA: que corrigir o processo de uma parcial nao mexa nas vizinhas sem a
// pessoa saber. Caso do Valderi (G1): na 2022TR000848 as parciais 2, 3 e 4 estavam com
// `SCC 3123/2023`, e corrigir uma mudava as tres. Da cadeira dele: "quando tento alterar ele
// muda nas tres PCs".
//
// ⚠️ E O DEFEITO E ESPELHADO DO DE 22/09: la a correcao alcancava de MENOS (1 PC, e a TR
// continuava mostrando o numero velho), e o conserto daquele dia a fez alcancar de MAIS. Os
// dois aparecem como "salvei e nao mudou o que eu queria".
//
// ⚠️ ESTREITAR SEM PERGUNTAR TAMBEM SERIA DEFEITO: um processo do SGPe pode carregar varias
// parcelas do SIGEF de verdade (armadilha 14) — 138 pares no acervo, em 96 TRs. Por isso a
// escolha existe nos dois sentidos, e o padrao e o recorte estreito.
//
// USO: node teste_front_processo_escopo.js

const fs = require('fs');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

const html = fs.readFileSync('index.html', 'utf8');

// ⚠️ A janela termina num MARCO DO PROPRIO CODIGO, nunca num numero (armadilha 30).
const entre = (de, ate) => {
  const i = html.indexOf(de);
  if (i < 0) throw new Error('nao achei o inicio: ' + de);
  const f = html.indexOf(ate, i);
  if (f < 0) throw new Error('nao achei o fim: ' + ate);
  return html.slice(i, f);
};
const escopo = entre('async function procEdEscopo(', 'function procEdAlcance()');
const alcance = entre('function procEdAlcance()', 'async function procEdSalvar()');
const salvar = entre('async function procEdSalvar()', 'async function procEdSalvarLink()');
const abrir = entre('async function procEditar(', 'function procPartes(');

S('1. O MODAL PERGUNTA AO SERVIDOR O QUE A CORRECAO ALCANCA');
{
  conf(/procEdEscopo\(codigo_pc, campo\)/.test(abrir), 'ao abrir o lapis, ele consulta');
  conf(/processo_escopo\?campo=processo_pc/.test(escopo), 'pela rota de leitura do servidor');
  conf(/if\(campo !== 'processo_pc'\) return/.test(escopo),
       'e nao pergunta nada para o processo mae — a TR tem um so');
  conf(/!j\.data \|\| !j\.data\.escolhe/.test(escopo), 'so desenha quando ha escolha a fazer');
  // ⚠️ A RESPOSTA PODE CHEGAR DEPOIS de a pessoa fechar e abrir outro lapis — e ai o bloco
  // falaria de outra PC, com outros numeros. Acontece com um clique rapido.
  conf(/_procEd\.codigo_pc !== codigo_pc/.test(escopo), 'e so se o modal ainda for o mesmo');
  conf(/catch\(e\)/.test(escopo), 'sem a conferencia, o modal segue com o padrao');
}

S('2. A ESCOLHA, COM OS NUMEROS NA MAO');
{
  conf(/d\.outras_parciais/.test(escopo), 'diz QUAIS sao as outras parciais');
  // ⚠️ QUEM CONTA AS PCs E O SERVIDOR (armadilha 16): a tela mostra o numero que veio.
  conf(/d\.pcs_na_parcela/.test(escopo) && /d\.pcs_na_tr/.test(escopo),
       'com a contagem de PCs de cada opcao, contada pelo servidor');
  conf(!/\.length\s*\+\s*1|reduce\(/.test(escopo), 'e a tela nao soma PC nenhuma');
  conf(/value="parcela" checked/.test(escopo), '"so esta parcial" ja vem marcado');
  conf(/value="tr"/.test(escopo), 'e a outra opcao alcanca as demais parciais');
  // ⚠️ A FRASE TEM DE CONCORDAR: "na parcial 12" e "nas parciais 2, 4".
  conf(/outras_parciais\.length > 1 \? 'nas parciais' : 'na parcial'/.test(escopo),
       'a frase concorda com o numero de parciais');
  conf(/pode ter mais de uma parcial de verdade/.test(escopo),
       'e o modal explica por que a escolha e dela, e nao do sistema');
}

S('3. O QUE VAI PARA O SERVIDOR, E O QUE VOLTA');
{
  conf(/alcance: procEdAlcance\(\)/.test(salvar), 'o salvar manda a escolha');
  conf(/return m \? m\.value : 'parcela'/.test(alcance),
       'e sem escolha na tela o alcance e a parcela — o mesmo padrao do servidor');
  // ⚠️ O QUE FICOU DE FORA TAMBEM E RESPOSTA: sem isso, a duvida "sera que salvou?" volta
  // pelo outro lado — agora do lado de quem esperava que as vizinhas mudassem.
  conf(/d\.fora_da_parcela/.test(salvar), 'o aviso de sucesso le o que ficou de fora');
  conf(/continua\$\{.*\? 'm' : ''\}/.test(salvar) || /continuam/.test(salvar),
       'e o plural acompanha');
  conf((salvar.match(/\$\{fora\}/g) || []).length === 2,
       'nos DOIS caminhos do sucesso: com link e sem link', (salvar.match(/\$\{fora\}/g) || []).length);
}

S('4. E O TEXTO DO MODAL DEIXOU DE PROMETER A TR INTEIRA');
{
  conf(/desta parcial<\/b> que hoje têm este mesmo processo/.test(abrir),
       'a linha do alcance fala da parcial');
  conf(!/Vale para as PCs desta TR que hoje têm/.test(html), 'e a promessa antiga saiu do arquivo');
  // A mae nao mudou: uma TR tem UM processo mae, e corrigir e dizer qual e o certo.
  conf(/todas as PCs desta TR<\/b> — o processo mãe é um só por TR/.test(abrir),
       'o processo mae continua valendo para a TR inteira');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
