// CAMINHO: sigpc-gt/teste_front_manutencao.js
//
// MODO MANUTENÇÃO — o lado da tela.
//
// Lê o index.html servido. Não roda o navegador: o que se confere aqui é PRESENÇA e ORDEM,
// que é onde os defeitos de 10–12/08 moraram.

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

let ok = 0, falhou = 0;
function conf(cond, nome) {
  if (cond) { ok++; console.log('  OK    ' + nome); }
  else      { falhou++; console.log('  FALHA  ' + nome); }
}
function secao(t) { console.log('\n═══ ' + t + ' ═══'); }

// ─────────────────────────────────────────────────────────────
secao('1. A TELA DE LOGIN');

conf(/id="loginManut"[\s\S]{0,200}display:none/.test(html),
     'o painel de manutencao nasce ESCONDIDO');
conf(/id="loginForm"/.test(html), 'o formulario esta num container proprio, para poder sumir');

// ⚠️ VERMELHO, nao ambar (decisao do Richard, 12/08): ambar le-se como aviso, e o que se
// quer e' que ninguem perca tempo tentando entrar.
const painel = html.slice(html.indexOf('id="loginManut"'), html.indexOf('id="loginManut"') + 1400);
conf(/#DC2626|#991B1B/.test(painel), 'o painel e VERMELHO');
conf(!/#FFF8E1|#FFE0B2|var\(--am\)/.test(painel), 'e nao ambar');
conf(/color:#fff/.test(painel), 'com texto branco');

// ⚠️ O formulario tem de ficar escondido: deixa-lo a vista fazia a pessoa digitar CPF e
// senha para so entao ser recusada — e a recusa parecia senha errada.
conf(/function manutTelaLogin[\s\S]{0,700}?fm\.style\.display = 'none'/.test(html),
     'manutTelaLogin ESCONDE o formulario');
conf(/function manutTelaLogin[\s\S]{0,700}?cx\.style\.display = ''/.test(html),
     'e mostra o painel');

// o superadmin precisa de um caminho de volta ao formulario
conf(/manutRevelarLogin/.test(painel), 'ha o link "Acesso do administrador"');
conf(/Acesso do administrador/.test(painel), 'com esse texto');
conf(/function manutRevelarLogin[\s\S]{0,300}?fm\.style\.display = ''/.test(html),
     'e o link revela o formulario');

// ─────────────────────────────────────────────────────────────
secao('2. SABER ANTES DE DIGITAR');

// ⚠️ A CONFERENCIA E' NA CARGA DA PAGINA, nao so depois de um login recusado.
conf(/window\.addEventListener\('load'[\s\S]{0,400}?manutVigiarLogin\(\)/.test(html),
     'a tela de login confere a manutencao NA CARGA — ninguem tenta em vao');
conf(/function manutVigiarLogin[\s\S]{0,600}?setInterval\(olhar, PREP_SEG \* 1000\)/.test(html),
     'e revigia a cada PREP_SEG — "esta tela sai sozinha" e verdade');
conf(/function manutVigiarLogin[\s\S]{0,600}?else manutTelaLoginSair\(\)/.test(html),
     'ao reabrir, o formulario volta sozinho');

// quem entrou por sessao salva nao precisa do vigia do login — quem vigia e' o prepIniciar
conf(/if\(!entrou\) manutVigiarLogin\(\)/.test(html),
     'so vigia pelo login quando NAO se entrou por sessao salva');
conf(/function iniciarApp[\s\S]{0,400}?clearInterval\(_manutLoginTimer\)/.test(html),
     'e o vigia do login para quando se entra — dois vigias seriam duas chamadas iguais');

// ─────────────────────────────────────────────────────────────
secao('3. A QUEDA DE QUEM JA ESTAVA DENTRO');

conf(/function manutBarra[\s\S]{0,200}?U\.perfil !== 'superadmin'/.test(html),
     'so o superadmin escapa — coordenador NAO');
const iniciar = html.slice(html.indexOf('function prepIniciar'), html.indexOf('function prepIniciar') + 1400);
conf(/manutBarra\(\)/.test(iniciar), 'o ciclo confere a manutencao');
conf(iniciar.indexOf('manutBarra()') < iniciar.indexOf('prepRestrito() !== antes'),
     'e confere ANTES da preparacao — a manutencao poe para fora, a preparacao so limita');
conf(/manutBarra\(\)[\s\S]{0,140}?clearInterval\(_prepTimer\)/.test(iniciar),
     'para o proprio ciclo ao derrubar — senao continuaria batendo depois de sair');
conf(/function manutDerrubar[\s\S]{0,400}?sair\(\)/.test(html),
     'manutDerrubar chama sair(), que avisa o servidor e limpa a sessao');
conf(/function manutDerrubar[\s\S]{0,600}?manutTelaLogin\(msg\)/.test(html),
     'e cai no login JA com o painel vermelho');
conf(/function manutDerrubar[\s\S]{0,700}?semCancelar: true/.test(html),
     'o aviso nao tem botao Cancelar — nao ha o que cancelar');
conf(/nao foi perdido|nada do que voce gravou|Nada do que você gravou/i.test(html),
     'e diz que nada foi perdido — e a primeira duvida de quem e derrubado');

// o modal precisa saber esconder o Cancelar
conf(/\$\{o\.semCancelar \? '' :/.test(html), 'o moDialogo aceita semCancelar');

// ─────────────────────────────────────────────────────────────
secao('4. O LOGIN RECUSADO PELO SERVIDOR');

const login = html.slice(html.indexOf('async function login()'), html.indexOf('async function login()') + 1800);
conf(/j\.error\.manutencao/.test(login), 'o login trata a recusa por manutencao a parte');
conf(/j\.error\.manutencao[\s\S]{0,120}?manutTelaLogin/.test(login),
     'e mostra o painel em vez da faixa de erro — nao e erro DA PESSOA');

// ─────────────────────────────────────────────────────────────
secao('5. A ABA EM CONFIGURACOES');

conf(/id: 'manut',\s+rotulo: 'Modo manutenção'/.test(html), 'a aba existe');
conf(/function cfgRenderManutencao/.test(html), 'e tem render proprio');
const aba = html.slice(html.indexOf('function cfgRenderManutencao'), html.indexOf('function cfgRenderManutencao') + 3600);
conf(/cfgManutAlternar\(\$\{on \? 'false' : 'true'\}\)/.test(aba),
     'o botao alterna para o oposto do estado atual');
conf(/pessoas online|pessoa online/.test(aba), 'mostra o numero de online');
conf(/function cfgManutContarOnline[\s\S]{0,300}?usuarios\/online/.test(html),
     'e le esse numero DE VERDADE, do servidor');
conf(/if\(id === 'manut'\) cfgManutContarOnline\(\)/.test(html),
     'relido ao abrir a aba — fora dela ninguem o ve e ele envelhece em segundos');
conf(/async function cfgManutAlternar[\s\S]{0,1800}?cfgManutContarOnline\(\)/.test(html),
     'e relido DEPOIS de ligar — e a prova de que a janela abriu');

conf(/async function cfgManutAlternar[\s\S]{0,700}?moConfirm/.test(html),
     'ligar e desligar passam pela confirmacao do sistema');
conf(/async function cfgManutAlternar[\s\S]{0,700}?perigo: !!ligar/.test(html),
     'e ligar e marcado como acao de risco');

// ⚠️ armadilha 12 do CLAUDE.md: botao aceso que nao responde e pior que botao cinza
const alternar = html.slice(html.indexOf('async function cfgManutAlternar'),
                            html.indexOf('async function cfgManutAlternar') + 1800);
const catchPos = alternar.indexOf('catch(e)');
conf(catchPos > 0 && alternar.slice(catchPos).includes('cfgRender()'),
     'no ERRO tambem repinta — senao o botao ficaria "Salvando..." para sempre');

// ─────────────────────────────────────────────────────────────
secao('6. O QUE NAO PODE ACONTECER');

// a mensagem vem do Richard e e' texto de usuario: tem de ser escapada
conf(/escHtml\(_prep\.mensagem_manutencao\|\|''\)/.test(html),
     'a mensagem e escapada no textarea da aba');
// no painel do login usa-se textContent, que nao interpreta HTML
conf(/tx\.textContent = /.test(html), 'e no painel do login usa textContent, nao innerHTML');

// falha aberta: sem config, o sistema abre
conf(/let _prep = \{ modo_preparacao: false/.test(html), 'o estado local nasce DESLIGADO');

console.log(`\n═══ RESULTADO: ${ok} passaram · ${falhou} falharam ═══`);
process.exit(falhou ? 1 : 0);
