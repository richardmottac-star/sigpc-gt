// CAMINHO: sigpc-gt/medir_passo2.js
//
// AS PARCIAIS PARADAS NO PASSO 2 — baixadas, com parecer, e ainda não encaminhadas ao C.I.
//
// ⚠️ POR QUE ISTO EXISTE: em 27/09/2026 foram enviados 33 recados pessoais, cada analista com o
// SEU número e as SUAS TRs, ensinando o encaminhamento em lote. Sem medir depois, não se sabe se
// o recado virou ação ou só leitura — e essa é a única pergunta que importa sobre um aviso.
//
// ⚠️ A REGRA DA CONTAGEM É A MESMA DA TELA: a parcela conta quando TODAS as PCs dela estão
// baixadas, TODAS têm parecer e NENHUMA foi ao C.I. Medir por PC daria outro número, e a tela
// fala em parcial — comparar coisas diferentes é como se inventa progresso.
//
// USO:  node medir_passo2.js                  compara com o retrato guardado
//       node medir_passo2.js --salvar         grava o retrato de hoje (a base da comparação)
const fs = require('fs')
const path = require('path')

const API = 'https://sigpc-api-production.up.railway.app'
const BASE = path.join(__dirname, 'baseline_passo2.json')
const SALVAR = process.argv.includes('--salvar')

const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`

async function medir() {
  const pcs = []; let off = 0
  for (;;) {
    const j = await (await fetch(`${API}/prestacoes_contas?limit=2000&offset=${off}&arquivamento=1`)).json()
    const r = j.data || []; if (!r.length) break
    pcs.push(...r); off += r.length; if (r.length < 2000) break
  }
  const par = new Map()
  for (const r of pcs) {
    if (r.tipo === 'final') continue
    const k = `${r.setorial_id}|${r.tr}|${r.parcial_num}`
    if (!par.has(k)) par.set(k, { tr: r.tr, num: r.parcial_num, id: r.analista_id, dono: r.analista_nome, pcs: [], arq: r.arquivamento || null })
    par.get(k).pcs.push(r)
  }
  const todas = [...par.values()]
  const passo2 = todas.filter((p) => (!p.arq || p.arq.estado !== 'arquivada')
    && p.pcs.every((x) => x.baixada) && p.pcs.every((x) => x.parecer_tipo) && p.pcs.every((x) => !x.ci_situacao)
    && p.id != null && String(p.id) !== '4')
  const naFila = todas.filter((p) => (!p.arq || p.arq.estado !== 'arquivada') && p.pcs.some((x) => x.ci_situacao === 'na_fila'))
  const prontas = todas.filter((p) => p.arq && p.arq.estado === 'pronta')
  const arquivadas = todas.filter((p) => p.arq && p.arq.estado === 'arquivada')

  const porAnalista = {}
  for (const p of passo2) {
    const a = porAnalista[p.id] = porAnalista[p.id] || { nome: p.dono, parcelas: 0, pcs: 0 }
    a.parcelas++; a.pcs += p.pcs.length
  }
  return {
    em: new Date().toISOString(),
    passo2: passo2.length, passo2_pcs: passo2.reduce((s, p) => s + p.pcs.length, 0),
    analistas: Object.keys(porAnalista).length,
    na_fila: naFila.length, prontas: prontas.length, arquivadas: arquivadas.length,
    por_analista: porAnalista,
  }
}

;(async () => {
  const hoje = await medir()
  if (SALVAR) {
    fs.writeFileSync(BASE, JSON.stringify(hoje, null, 1))
    console.log('retrato guardado em baseline_passo2.json —', hoje.passo2, 'parciais no passo 2,',
      hoje.analistas, 'analistas ·', hoje.na_fila, 'na fila ·', hoje.prontas, 'prontas ·', hoje.arquivadas, 'arquivadas')
    return
  }
  if (!fs.existsSync(BASE)) { console.log('sem retrato anterior — rode antes: node medir_passo2.js --salvar'); return }
  const antes = JSON.parse(fs.readFileSync(BASE, 'utf8'))
  const dias = ((Date.parse(hoje.em) - Date.parse(antes.em)) / 86400000).toFixed(1)
  const d = (a, b) => { const x = b - a; return `${b} (${x === 0 ? 'igual' : (x > 0 ? '+' : '') + x})` }

  console.log(`PARCIAIS NO PASSO 2 — ${dias} dias depois do recado de ${antes.em.slice(0, 10)}\n`)
  console.log('  paradas no passo 2 :', d(antes.passo2, hoje.passo2))
  console.log('  analistas com elas :', d(antes.analistas, hoje.analistas))
  console.log('  na fila do C.I.    :', d(antes.na_fila, hoje.na_fila))
  console.log('  prontas p/ arquivar:', d(antes.prontas, hoje.prontas))
  console.log('  arquivadas         :', d(antes.arquivadas, hoje.arquivadas))

  const linhas = []
  for (const [id, a] of Object.entries(antes.por_analista)) {
    const ag = hoje.por_analista[id]
    const saiu = a.parcelas - (ag ? ag.parcelas : 0)
    if (saiu !== 0) linhas.push({ nome: a.nome, antes: a.parcelas, agora: ag ? ag.parcelas : 0, saiu })
  }
  linhas.sort((x, y) => y.saiu - x.saiu)
  console.log('\nQUEM MEXEU:')
  if (!linhas.length) console.log('  ninguém encaminhou nada — o recado não virou ação')
  linhas.forEach((l) => console.log('  ' + String(l.nome).slice(0, 26).padEnd(28)
    + String(l.antes).padStart(4) + ' -> ' + String(l.agora).padStart(4)
    + (l.saiu > 0 ? `   encaminhou ${plural(l.saiu, 'parcial', 'parciais')}` : `   ACRESCENTOU ${-l.saiu}`)))

  const parados = Object.entries(antes.por_analista)
    .filter(([id, a]) => hoje.por_analista[id] && hoje.por_analista[id].parcelas === a.parcelas)
  console.log(`\nSEM MEXER: ${parados.length} de ${Object.keys(antes.por_analista).length} analistas`)
  parados.sort((a, b) => b[1].parcelas - a[1].parcelas).slice(0, 8)
    .forEach(([, a]) => console.log('  ' + String(a.nome).slice(0, 26).padEnd(28) + String(a.parcelas).padStart(4)))
})()
