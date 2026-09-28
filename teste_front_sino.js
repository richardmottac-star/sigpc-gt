// CAMINHO: sigpc-gt/teste_front_sino.js
//
// O SINO QUE NAO ENTOPE  (27/09/2026)
//
// ⚠️ O QUE ELE GUARDA: que o recado novo apareca no TOPO. Ate 27/09 a ordem era "urgente e nao
// lido primeiro, depois por data" — e, como so o CLIQUE marcava como lido, o urgente ficava
// grudado no topo para sempre. Medido: **465 avisos urgentes nao lidos**, em **49 das 56
// pessoas**, o mais velho de 12/08. Na caixa da Geisa as OITO primeiras posicoes eram de
// agosto, e o recado daquele dia nascia na NONA linha.
//
// ⚠️ QUANTO MAIS SE MARCAVA COMO URGENTE, MENOS SE VIA O QUE ERA NOVO — o contrario do que a
// etiqueta promete. Foi o Richard quem viu: "mandou no sino mas nao aparece no topo e ai se perde".
//
// USO: node teste_front_sino.js

const fs = require('fs');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || detalhe == null ? '' : `   [${detalhe}]`}`);
};
const S = (t) => console.log(`\n═══ ${t} ═══`);

const html = fs.readFileSync('index.html', 'utf8');
const entre = (de, ate) => {
  const i = html.indexOf(de); if (i < 0) throw new Error('nao achei: ' + de);
  const f = html.indexOf(ate, i); if (f < 0) throw new Error('nao achei o fim: ' + ate);
  return html.slice(i, f);
};
const vistas = entre('async function sinoMarcarVistas()', 'async function sinoMarcarTodas()');
const abrir = entre('function sinoAbrir(ev)', 'function sinoRender()');
const tique = entre('function sinoTique()', 'function sinoAbrir(ev)');

S('1. ABRIR O SINO MARCA O QUE ELE MOSTROU');
{
  conf(/sinoCarregar\(\)\.then\(\(\) => sinoMarcarVistas\(\)\)/.test(abrir),
       'a marcacao vem DEPOIS da carga — antes dela nao havia o que marcar');
  conf(/notificacao\/marcar_lidas/.test(vistas), 'pela rota em lote, e nao uma chamada por aviso');
  // ⚠️ SO O QUE ESTA NA TELA, e nao a caixa inteira: os ids vao daqui.
  conf(/ids: JSON|ids \}\)|destinatario_id: U\.id, ids/.test(vistas.replace(/\s+/g, ' ')),
       'mandando os ids do que apareceu');
  conf(!/marcar_todas/.test(vistas), 'e nao o "marcar todas", que alcanca o que ninguem viu');
  conf(/if\(verComoAtivo\(\)\) return/.test(vistas),
       'no modo "agir pela conta de" nao marca nada — comecaria o relogio de 60 dias de outra pessoa');
  conf(/Number\(n\.destinatario_id\) === Number\(U\.id\)/.test(vistas),
       'e so marca o que e do proprio usuario logado');
}

S('2. A LISTA NAO SOME DEBAIXO DE QUEM ESTA LENDO');
{
  // ⚠️ O CLIQUE tira da frente ("ja tratei disto"); ABRIR e "estou lendo agora".
  conf(!/_notifs = _notifs\.filter/.test(vistas), 'marcar ao abrir NAO remove a lista da tela');
  conf(/sinoPintar\(\)/.test(vistas) && !/sinoRender\(\)/.test(vistas),
       'so o contador cai; a lista fica como esta');
  // A carga traz so as nao lidas: sem pausa, a recarga de 60 s esvaziaria o painel aberto.
  conf(/if\(document\.getElementById\('sinoPainel'\)\) return/.test(tique),
       'e a recarga automatica espera enquanto o painel esta aberto');
  conf(/setInterval\(sinoTique, SINO_SEG \* 1000\)/.test(html), 'o relogio chama o tique, nao a carga direta');
}

S('3. A GUARDA ACOMPANHA O SERVIDOR');
{
  // ⚠️ "lida" deixou de significar "lida" e passou a significar "esteve na sua frente".
  // Apagar isso em 15 dias faria sumir recado que ninguem leu de fato.
  conf(/const NOTIF_GUARDA_DIAS = 60/.test(html), 'a tela fala em 60 dias');
  conf(!/apagada em.*15|15 dias são apagadas/.test(html), 'e nao sobrou 15 escrito em lugar nenhum');
  conf(/Lidas há mais de \$\{NOTIF_GUARDA_DIAS\} dias/.test(html),
       'o texto da tela sai da constante, e nao de um numero digitado');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exitCode = falhou ? 1 : 0;
