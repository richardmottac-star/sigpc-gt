// O documento para a Nayara: a regra validada, os numeros conferidos e a correcao do quadro.
// Gera o HTML; o `imprimir.js` o transforma em PDF pelo Edge.
const fs = require('fs')
// ⚠️ O JSON e a MEDICAO, nao o documento: quem o produz e o `medir_produtividade_20260927.js`.
// Rodar o gerador sem medir de novo imprime numeros velhos com data de hoje.
const L = require(fs.existsSync('./comparativo.json') ? './comparativo.json' : './comparativo_produtividade_20260927.json')

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const br = (d) => d ? String(d).slice(0, 10).split('-').reverse().join('/') : ''
const n = (v) => v.toLocaleString('pt-BR')
const som = (a, f) => a.reduce((s, x) => s + f(x), 0)

const COORD = { 1: 'Nayara', 2: 'Zadir', 3: 'Gustavo' }
const G = {}
for (const k of ['1', '2', '3']) {
  const t = L.filter((x) => String(x.grupo) === k)
  G[k] = { n: t.length, gente: t,
    metaHoje: som(t, (x) => x.metaHoje), metaNova: som(t, (x) => x.metaNova),
    hoje: som(t, (x) => x.hoje), novo: som(t, (x) => x.novo) }
}
const T = { n: L.length, metaHoje: som(L, (x) => x.metaHoje), metaNova: som(L, (x) => x.metaNova),
  hoje: som(L, (x) => x.hoje), novo: som(L, (x) => x.novo) }
const p = (a, b) => Math.round(a * 100 / b)
const dispensados = L.filter((x) => x.saida)

const linhaPessoa = (l) => `
  <tr>
    <td>${esc(l.nome)}${l.saida ? ' <span class="tag">dispensado</span>' : (l.entrada ? ' <span class="tag2">entrou depois</span>' : '')}</td>
    <td class="c">${l.metaHoje || '—'}</td>
    <td class="c b">${l.metaNova}</td>
    <td class="c">${l.hoje}</td>
    <td class="c b">${l.novo}</td>
    <td class="c">${l.pctHoje == null ? '—' : l.pctHoje + '%'}</td>
    <td class="c b">${l.pctNovo == null ? '—' : l.pctNovo + '%'}</td>
  </tr>`

const tabelaGrupo = (k) => `
  <h3>Grupo ${k} — ${COORD[k]} <span class="leve">(${G[k].n} integrantes)</span></h3>
  <table class="t">
    <thead><tr><th style="width:34%">Analista</th>
      <th class="c">Meta hoje</th><th class="c">Meta nova</th>
      <th class="c">Conta hoje</th><th class="c">Conta nova</th>
      <th class="c">% hoje</th><th class="c">% novo</th></tr></thead>
    <tbody>
      ${G[k].gente.slice().sort((a, b) => b.pctNovo - a.pctNovo).map(linhaPessoa).join('')}
      <tr class="tot"><td>Grupo ${k}</td><td class="c">${n(G[k].metaHoje)}</td><td class="c">${n(G[k].metaNova)}</td>
        <td class="c">${n(G[k].hoje)}</td><td class="c">${n(G[k].novo)}</td>
        <td class="c">${p(G[k].hoje, G[k].metaHoje)}%</td><td class="c">${p(G[k].novo, G[k].metaNova)}%</td></tr>
    </tbody>
  </table>`

const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Produtividade — números conferidos</title>
<style>
  @page { size: A4; margin: 18mm 16mm 16mm; }
  *{box-sizing:border-box}
  body{font-family:"Calibri","Segoe UI",sans-serif;font-size:10.5pt;color:#1A1A1A;line-height:1.45;margin:0}
  .cab{text-align:center;margin-bottom:14px}
  .cab .org{color:#0B6B3A;font-size:10pt;font-weight:700;letter-spacing:.02em}
  .cab h1{font-size:16pt;margin:4px 0 2px;color:#111}
  .cab .sub{font-size:9.5pt;color:#555}
  table{width:100%;border-collapse:collapse}
  .ident td{border:1px solid #CFD8D3;padding:4px 7px;font-size:9.5pt}
  .ident td:first-child{background:#F1F5F2;font-weight:700;width:22%}
  .ident tr:first-child td{background:#0B6B3A;color:#fff;border-color:#0B6B3A}
  .ident tr:first-child td:first-child{background:#0B6B3A}
  h2{color:#0B6B3A;font-size:12pt;margin:16px 0 6px;padding-bottom:2px;border-bottom:1px solid #D8E3DC}
  h3{font-size:10.5pt;margin:12px 0 4px;color:#14281D}
  .leve{font-weight:400;color:#666;font-size:9.5pt}
  .t{margin:4px 0 8px}
  .t thead{display:table-header-group}
  .t th{background:#0B6B3A;color:#fff;font-size:8.5pt;padding:4px 6px;text-align:left;font-weight:700}
  .t td{border:1px solid #DDE4E0;padding:3px 6px;font-size:9pt}
  .t tr:nth-child(even) td{background:#FAFCFB}
  .c{text-align:center;white-space:nowrap}
  .b{font-weight:700}
  .tot td{background:#EDF3EF !important;font-weight:700;border-top:1.5px solid #0B6B3A}
  .tag{background:#F3E8E8;color:#7A2E2E;font-size:7.5pt;padding:1px 5px;border-radius:8px;white-space:nowrap}
  .tag2{background:#EAF1F9;color:#1A4E8A;font-size:7.5pt;padding:1px 5px;border-radius:8px;white-space:nowrap}
  .box{border:1px solid #E8C88A;background:#FDF8EC;border-radius:5px;padding:8px 11px;margin:8px 0;font-size:9.5pt;color:#6B4A0B}
  .boxv{border:1px solid #C5E1A5;background:#F4F9EE;border-radius:5px;padding:8px 11px;margin:8px 0;font-size:9.5pt;color:#2E5D2E}
  ul{margin:5px 0 5px 0;padding-left:16px}
  li{margin:2px 0}
  .ass{margin-top:26px;text-align:center;font-size:10pt}
  .ass .l{border-top:1px solid #555;width:62%;margin:0 auto 3px}
  .rod{margin-top:14px;font-size:8.5pt;color:#666;line-height:1.5;border-top:1px solid #DDE4E0;padding-top:6px}
  .quebra{page-break-before:always}
  .nq{page-break-inside:avoid}
</style></head><body>

<div class="cab">
  <div class="org">GRUPO DE TRABALHO DE PRESTAÇÃO DE CONTAS — SIGPC-GT</div>
  <h1>PRODUTIVIDADE — NÚMEROS CONFERIDOS</h1>
  <div class="sub">Regra validada, efeito por analista e correção do quadro do documento anterior</div>
</div>

<table class="ident">
  <tr><td>Destinatário</td><td>Coordenação do Grupo de Trabalho — Nayara Limas (Grupo 1 / relatórios da CGE)</td></tr>
  <tr><td>Emitente</td><td>SIGPC-GT — suporte técnico</td></tr>
  <tr><td>Data</td><td>27/09/2026</td></tr>
  <tr><td>Assunto</td><td>Conferência dos números antes da aplicação da regra de produtividade validada</td></tr>
</table>

<h2>1. O que este documento é</h2>
<p>O documento de 18/09 foi conferido pela coordenação, que não apontou correções: a regra está validada e a
lista de entradas e saídas está correta. <b>Antes da aplicação</b>, os números foram medidos novamente no
acervo. A regra não muda em nada.</p>
<p>O que muda é o <b>quadro de números</b>. O quadro do item 5 daquele documento continha dois erros, e ambos
aumentavam a queda anunciada. Este relatório os corrige e apresenta o efeito, analista por analista.</p>

<div class="boxv"><b>Nenhuma prestação de contas, baixa ou parecer é alterado.</b> O que muda é a forma de
contar e o que a tela compara, como já constava do documento validado.</div>

<h2>2. A correção do quadro</h2>
<p>O quadro anterior indicava que o GT passaria de <b>98%</b> para <b>67%</b>, com meta nova de <b>6.336</b>.
A coluna <i>Quadro de 18/09</i> reproduz o que foi afirmado naquele documento; a coluna
<i>Conferido em 27/09</i> traz o resultado da medição no acervo:</p>

<table class="t nq">
  <thead><tr><th>&nbsp;</th><th class="c">Quadro de 18/09</th><th class="c">Conferido em 27/09</th><th>O que houve</th></tr></thead>
  <tbody>
    <tr><td>Meta nova do GT</td><td class="c">6.336</td><td class="c b">${n(T.metaNova)}</td>
      <td>erro de soma: o Grupo 2 estava certo (1.891), o Grupo 1 e o Grupo 3 vinham inflados em 193 e 225</td></tr>
    <tr><td>% do GT hoje</td><td class="c">98%</td><td class="c b">${p(T.hoje, T.metaHoje)}%</td>
      <td>o 98% foi calculado <b>sem os 7 analistas dispensados</b>, e o % novo os incluía — duas populações diferentes</td></tr>
    <tr><td>% do GT com a regra nova</td><td class="c">67%</td><td class="c b">${p(T.novo, T.metaNova)}%</td>
      <td>consequência dos dois itens acima</td></tr>
  </tbody>
</table>

<div class="box"><b>As metas individuais da tabela de entradas e saídas estavam corretas.</b> As catorze foram
recalculadas uma a uma e todas confirmaram, inclusive os números informados pela coordenação no item B9. O erro
restringe-se à soma do quadro-resumo: não alcança a régua nem as datas.</div>

<p><b>Por que a segunda correção importa.</b> Pela regra validada (itens B4 e B8), o analista dispensado
<b>continua somando no grupo</b>: a meta congela na data de saída e a produção segue contando. Ele precisa,
portanto, entrar nas duas leituras — ou em nenhuma. São sete pessoas:
${dispensados.map((d) => `${esc(d.nome.split(' ')[0])} (G${d.grupo}, saída ${br(d.saida)})`).join(', ')}.
Com elas nas duas colunas, a queda efetiva do GT é de <b>${p(T.hoje, T.metaHoje)}% para ${p(T.novo, T.metaNova)}%</b>, e não de 98% para 67%.</p>

<h2>3. Os números conferidos</h2>
<table class="t nq">
  <thead><tr><th>Grupo</th><th class="c">Meta hoje</th><th class="c">Meta nova</th>
    <th class="c">Conta hoje</th><th class="c">Conta nova</th><th class="c">% hoje</th><th class="c">% novo</th></tr></thead>
  <tbody>
    ${['1', '2', '3'].map((k) => `<tr><td>Grupo ${k} — ${COORD[k]}</td>
      <td class="c">${n(G[k].metaHoje)}</td><td class="c b">${n(G[k].metaNova)}</td>
      <td class="c">${n(G[k].hoje)}</td><td class="c b">${n(G[k].novo)}</td>
      <td class="c">${p(G[k].hoje, G[k].metaHoje)}%</td><td class="c b">${p(G[k].novo, G[k].metaNova)}%</td></tr>`).join('')}
    <tr class="tot"><td>GT inteiro — ${T.n} integrantes</td>
      <td class="c">${n(T.metaHoje)}</td><td class="c">${n(T.metaNova)}</td>
      <td class="c">${n(T.hoje)}</td><td class="c">${n(T.novo)}</td>
      <td class="c">${p(T.hoje, T.metaHoje)}%</td><td class="c">${p(T.novo, T.metaNova)}%</td></tr>
  </tbody>
</table>

<div class="box"><b>A produção quase não muda — quem muda é a meta.</b> Deixar de contar o encaminhamento ao
Controle Interno tira <b>${T.hoje - T.novo} PCs</b> do GT inteiro: só <b>7</b> contavam apenas por terem ido ao C.I. sem
baixa, e <b>24</b> estão baixadas sem parecer registrado. A meta é que sobe de ${n(T.metaHoje)} para ${n(T.metaNova)},
porque a gravada hoje cobria seis meses e a nova cobre desde 01/08/2025, mês a mês.</div>

<h2 class="nq">4. O efeito em cada analista</h2>
<p>Ordenado pelo percentual com a regra nova. A etiqueta <span class="tag">dispensado</span> indica saída por
portaria, com a meta congelada na data de saída; <span class="tag2">entrou depois</span> indica ingresso
posterior a 01/08/2025, com meta proporcional.</p>

${tabelaGrupo('1')}
${tabelaGrupo('2')}
${tabelaGrupo('3')}

<div class="box nq"><b>Quatro integrantes hoje aparecem sem meta na tela</b> — entraram por portaria depois da
última carga de metas. Com a régua nova cada um passa a ter a sua:
Eduardo Pizolati <b>35</b>, Jeisson Klein Garcia <b>17</b>, Carla Goedert Xavier <b>12</b> e Fabiana Vieira <b>12</b>,
conforme informado pela coordenação no item B9.</div>

<h2>5. O que muda em cada tela</h2>
<ul>
  <li><b>Produtividade</b> — passa a contar a PC baixada com parecer registrado, e a comparar com a meta
      calculada mês a mês. É a tela onde os percentuais acima aparecem.</li>
  <li><b>Board da Coordenação</b> — o rótulo "Total" passa a dizer <b>"PCs recebidas"</b>, porque é isso que ele
      mostra, e a meta aparece em linha própria, com o mesmo número da tela Produtividade.</li>
  <li><b>Relatório do CGE</b> — lê a mesma regra, para que o trimestre e o acumulado nunca divirjam da tela.</li>
</ul>
<p>A meta é calculada pelo sistema, e não digitada: quando a reunião com a CGE alterar o valor de um mês,
altera-se aquele mês e todo o histórico se recalcula sozinho, sem novo levantamento.</p>

<h2>6. Próximo passo</h2>
<p>Acolhida esta correção, a regra será aplicada na ordem já descrita: primeiro a regra única no servidor, em
seguida as três telas lendo essa mesma regra e, por último, a conferência dos números antes da publicação.
<b>Não havendo observação da coordenação, a implantação segue.</b></p>

<div class="rod">
  <b>Como os números foram medidos.</b> Leitura do acervo de produção em 27/09/2026: 16.478 prestações de
  contas e ${T.n} integrantes (coordenadores e o Controle Interno não entram em apuração de produtividade).
  A contagem de hoje é a que a tela Produtividade já apresenta; a contagem nova exige, além dela, a PC
  baixada e o parecer registrado, mantendo iguais todos os descontos atuais — conferência do SIGEF, baixa
  anterior ao GT, engenharia, estorno e PC invalidada. A meta nova segue a régua validada: 12 por mês de
  agosto a dezembro de 2025, zero em janeiro de 2026, 10 por mês de fevereiro em diante, proporcional por
  dias sobre base 30 para entradas e saídas, congelada na data de saída.
</div>

<div style="margin-top:14px;font-size:10pt;">Observações da coordenação:</div>
<div style="border-bottom:1px solid #888;height:20px;width:70%"></div>
<div style="border-bottom:1px solid #888;height:20px;width:70%"></div>

<div class="ass">
  <div class="l"></div>
  <b>Richard Motta Coelho</b><br>
  <span style="font-size:9pt;color:#555">Técnico responsável pelo SIGPC-GT</span>
</div>

</body></html>`

fs.writeFileSync('doc_nayara.html', html)
console.log('HTML do documento gerado —', (html.length / 1024).toFixed(0), 'KB')
console.log('numeros:', JSON.stringify({ metaHoje: T.metaHoje, metaNova: T.metaNova, hoje: T.hoje, novo: T.novo,
  pctHoje: p(T.hoje, T.metaHoje), pctNovo: p(T.novo, T.metaNova) }))
