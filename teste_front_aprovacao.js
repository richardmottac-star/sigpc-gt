// CAMINHO: sigpc-gt/teste_front_aprovacao.js
//
// A FILA "AGUARDANDO APROVAÇÃO" DO PAINEL SUPERADMIN — os três botões, e o que cada um diz.
//
// ⚠️ POR QUE ISTO EXISTE (24/08/2026)
//
// Os três botões tinham nome e nada mais, e os três nomes enganam:
//   "Aprovar"  soa como o caminho normal — e é o que CRIA a conta duplicada;
//   "Mesclar"  soa técnico — e é o certo quando há aviso de duplicidade;
//   "Rejeitar" parece marcar como recusado — e APAGA a solicitação, sem volta.
//
// O caso que revelou isso foi a Scheila: id 49 com 161 PCs e sem CPF, id 73 pendente com o
// nome completo e o CPF. Aprovar ali teria deixado o trabalho preso na conta velha, e quem
// clicasse não teria como saber pelo texto do botão.
//
// Lê o `index.html` como TEXTO — é o padrão das outras suítes de front deste repositório.
//
//   node teste_front_aprovacao.js

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let ok = 0, falhou = 0;
const conf = (passou, rotulo, detalhe) => {
  passou ? ok++ : falhou++;
  console.log(`  ${passou ? 'OK  ' : 'FALHA'}  ${rotulo}${passou || !detalhe ? '' : `   [${detalhe}]`}`);
};

// A janela é o cartão do pendente: do aviso de duplicidade até o fim do bloco de botões.
const i0 = html.indexOf('const aviso = dupl ?');
const i1 = html.indexOf('function admAprovarPendBloco');
const cartao = html.slice(i0, i1);

console.log('\n═══ 1. CADA BOTÃO EXPLICA O QUE FAZ ═══');
{
  conf(i0 > 0 && i1 > i0, 'o cartao do pendente foi localizado no index.html');

  conf(/Mantém a conta antiga com as PCs e o histórico\./.test(cartao),
       'MESCLAR: diz que a conta antiga fica, com as PCs e o historico');
  conf(/O cadastro novo é descartado, mas a senha escolhida agora passa a valer\./.test(cartao),
       'MESCLAR: e que a senha nova passa a valer — o que mudou em 24/08');

  conf(/Cria uma segunda conta separada\. As PCs continuam na conta antiga\./.test(cartao),
       'APROVAR: com aviso, diz que cria conta separada e as PCs ficam onde estao');
  conf(/Libera o acesso\. A pessoa passa a entrar com o CPF e a senha que cadastrou\./.test(cartao),
       'APROVAR: sem aviso, diz o que de fato acontece — nao repete o texto da duplicidade');

  // ⚠️ REJEITAR APAGA. A rota é `PATCH /usuarios/:id/rejeitar` e ela roda
  // `DELETE FROM usuarios WHERE id = $1 AND aguardando_aprovacao = true`.
  // Escrever "marca como recusado" seria descrever um estado que a tabela não guarda.
  conf(/Apaga a solicitação, e só ela/.test(cartao), 'REJEITAR: diz que APAGA, que e o que a rota faz');
  conf(/nenhuma conta, PC ou baixa é tocada/.test(cartao),
       'REJEITAR: e diz o que NAO e tocado — a duvida de quem hesita em clicar');
  conf(/A pessoa pode se cadastrar de novo/.test(cartao), 'REJEITAR: e que da para refazer o cadastro');
  conf(!/marca(do)? como recusado/i.test(cartao), 'e NAO promete um estado "recusado" que nao existe');
}

console.log('\n═══ 2. A HIERARQUIA MUDA COM O AVISO ═══');
{
  // Com duplicidade, o erro caro é aprovar. O Mesclar é o botão cheio; o Aprovar vira
  // secundário — dois botões igualmente chamativos deixam a escolha para o acaso.
  conf(/\$\{dupl \? '' : 'btn-ass'\}/.test(cartao),
       'APROVAR perde o verde (btn-ass) quando ha aviso de duplicidade');
  conf(/dupl \? 'background:#fff;color:var\(--ct\);border:1\.5px solid var\(--cb\)/.test(cartao),
       'e vira botao de contorno, secundario');
  conf(/background:#991B1B;color:#fff;font-weight:700/.test(cartao),
       'MESCLAR continua o botao cheio, em vermelho escuro');

  // O Mesclar só existe quando há candidato — sem aviso não há em que mesclar.
  conf(/\$\{dupl \? `<div>[\s\S]{0,400}?admMesclar/.test(cartao),
       'o MESCLAR so e desenhado quando ha candidato');

  // A ordem na tela: Mesclar, Aprovar, Rejeitar.
  const iM = cartao.indexOf('admMesclar'), iA = cartao.indexOf('admAbrirAprovar'), iR = cartao.indexOf('admRejeitar');
  conf(iM > 0 && iA > iM && iR > iA, 'a ordem e Mesclar → Aprovar → Rejeitar',
       `mesclar ${iM}, aprovar ${iA}, rejeitar ${iR}`);

  // ⚠️ O aviso vem ANTES dos botões — depois deles seria lido tarde demais.
  conf(cartao.indexOf('Já existe cadastro de') < iM, 'o aviso de duplicidade vem antes dos botoes');
}

console.log('\n═══ 3. O MODAL DA MESCLAGEM DIZ A VERDADE NOVA ═══');
{
  const j0 = html.indexOf('async function admMesclar');
  const modal = html.slice(j0, html.indexOf('function admAbrirAprovar', j0));
  conf(j0 > 0, 'admMesclar foi localizada');

  conf(/a senha que ela escolheu no Primeiro Acesso/.test(modal),
       'o modal lista a senha entre o que sera copiado');
  conf(/o nome completo/.test(modal) && /se isso não mudar o nome que as PCs já usam/.test(modal),
       'e o nome completo, com a condicao que o servidor aplica');

  // ⚠️ Mesclar deixou de ser só juntar dados: entrega o ACESSO da conta antiga.
  conf(/quem souber a senha de \$\{novo\.nome\} entra na conta id \$\{velho\.id\}/.test(modal),
       'o modal avisa que a mesclagem entrega acesso, nao so dado');
  conf(/Confira que são a mesma pessoa/.test(modal), 'e pede a conferencia de identidade');

  // O que o servidor recusou copiar não pode sumir em silêncio.
  conf(/nao_copiado/.test(modal), 'a tela le o `nao_copiado` da resposta');
  conf(/Não copiado: /.test(modal), 'e mostra o motivo no toast');

  // A senha nunca chega à tela — `auth.semSegredo` a tira de toda resposta.
  conf(!/novo\.senha_hash/.test(modal), 'a tela NAO tenta ler senha_hash, que nunca chega ate ela');
}

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══\n`);
process.exit(falhou ? 1 : 0);
