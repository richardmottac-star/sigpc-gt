// A PRODUTIVIDADE DE CADA UM: o que a tela mostra HOJE e como fica com a regra da Nayara.
// SO LEITURA — tudo pela API de producao.
//
// ⚠️ O "HOJE" NAO E RECALCULADO AQUI: usa-se `p.sigef_conta`, que o SERVIDOR manda pronto
// (`lib/sigef.js`) e e o mesmo numero da tela Produtividade, do Board e do relatorio do CGE.
// ⚠️ O "NOVO" e o mesmo `sigef_conta` MAIS as duas exigencias da regra nova: a PC tem de estar
// BAIXADA e com PARECER registrado. Assim todos os descontos que o servidor ja aplica (tag do
// SIGEF, baixa anterior ao GT, engenharia, estorno, invalidada) continuam valendo iguais, e a
// diferenca isola exatamente o que a regra muda.
const fs = require('fs')
const API = 'https://sigpc-api-production.up.railway.app'
const HOJE = '2026-09-27'

// A regra da resposta de 17/09: 12 por mes de ago a dez/2025, zero em jan/2026, 10 por mes de
// fev/2026 em diante. Proporcional por DIAS sobre base 30 para quem entrou ou saiu no meio.
const metaDoMes = (ano, mes) => {              // mes 1..12
  if (ano === 2025) return mes >= 8 ? 12 : 0
  if (ano === 2026) return mes === 1 ? 0 : 10
  return 0
}
const INICIO = { ano: 2025, mes: 8 }
const FIM = { ano: 2026, mes: 9 }              // setembro de 2026, o mes corrente
const diasDoMes = (ano, mes) => new Date(Date.UTC(ano, mes, 0)).getUTCDate()

/** A meta acumulada de quem entrou em `de` (ou desde o inicio) e saiu em `ate` (ou continua). */
function metaAcumulada(de, ate) {
  const d = de ? { ano: +de.slice(0, 4), mes: +de.slice(5, 7), dia: +de.slice(8, 10) } : null
  const a = ate ? { ano: +ate.slice(0, 4), mes: +ate.slice(5, 7), dia: +ate.slice(8, 10) } : null
  let t = 0
  for (let ano = INICIO.ano; ano <= FIM.ano; ano++) {
    for (let mes = 1; mes <= 12; mes++) {
      if (ano === INICIO.ano && mes < INICIO.mes) continue
      if (ano === FIM.ano && mes > FIM.mes) break
      const base = metaDoMes(ano, mes)
      if (!base) continue
      const antesDaEntrada = d && (ano < d.ano || (ano === d.ano && mes < d.mes))
      const depoisDaSaida = a && (ano > a.ano || (ano === a.ano && mes > a.mes))
      if (antesDaEntrada || depoisDaSaida) continue
      const mesDaEntrada = d && ano === d.ano && mes === d.mes
      const mesDaSaida = a && ano === a.ano && mes === a.mes
      if (!mesDaEntrada && !mesDaSaida) { t += base; continue }
      // Proporcional: os dias em que a pessoa esteve no grupo naquele mes, sobre 30.
      const de1 = mesDaEntrada ? d.dia : 1
      const ate1 = mesDaSaida ? a.dia : diasDoMes(ano, mes)
      const dias = Math.max(0, ate1 - de1 + 1)
      t += base * dias / 30
    }
  }
  return Math.round(t)
}

// Os quatro numeros que a propria coordenadora informou (item B9). Onde o calculo diverge,
// vale o dela — foi o que o documento de 18/09 registrou.
const INFORMADA = { 52: 35, 72: 17, 75: 12, 74: 12 }

const get = async (p) => {
  const j = await (await fetch(API + p)).json()
  if (j.error) throw new Error(p + ' -> ' + JSON.stringify(j.error).slice(0, 200))
  return j
}

;(async () => {
  const [us, metas, subs] = await Promise.all([
    get('/usuarios'), get('/metas_analistas?vigente=true'), get('/substituicao'),
  ])

  // Quem entra na apuracao: a mesma regra da tela (`contaProdutividade`) — coordenador e
  // tecnico do C.I. NAO aparecem em relatorio de produtividade.
  const conta = (u) => u.perfil === 'analista' || u.perfil === 'superadmin'
  const pessoas = new Map()
  for (const u of (us.data || [])) if (conta(u)) pessoas.set(Number(u.id), {
    id: Number(u.id), nome: u.nome, grupo: u.grupo == null ? '—' : String(u.grupo),
    perfil: u.perfil, entrada: null, saida: null, portEntrada: null, portSaida: null,
    metaHoje: 0, hoje: 0, novo: 0, baixadasSemParecer: 0, soCi: 0, acervo: 0,
  })

  for (const m of (metas.data || [])) {
    const p = pessoas.get(Number(m.analista_id))
    if (p) p.metaHoje += parseInt(m.meta) || 0
  }

  // As portarias: a data de publicacao e a entrada do substituto e a saida do substituido.
  for (const l of (subs.data || [])) {
    const dd = pessoas.get(Number(l.dispensado_id)), ss = pessoas.get(Number(l.substituto_id))
    if (dd && (!dd.saida || l.data_publicacao < dd.saida)) { dd.saida = String(l.data_publicacao).slice(0, 10); dd.portSaida = l.portaria }
    if (ss && (!ss.entrada || l.data_publicacao < ss.entrada)) { ss.entrada = String(l.data_publicacao).slice(0, 10); ss.portEntrada = l.portaria }
  }

  // O acervo, paginado. Uma passada so.
  let off = 0, n = 0
  for (;;) {
    const j = await get(`/prestacoes_contas?limit=2000&offset=${off}`)
    const rows = j.data || []
    if (!rows.length) break
    for (const p of rows) {
      const q = pessoas.get(Number(p.analista_id))
      if (!q) continue
      q.acervo++
      if (p.sigef_conta !== true) continue
      q.hoje++
      const comParecer = !!p.parecer_tipo
      if (p.baixada === true && comParecer) q.novo++
      else if (p.baixada === true) q.baixadasSemParecer++
      else q.soCi++
    }
    n += rows.length; off += rows.length
    if (rows.length < 2000) break
  }

  const linhas = [...pessoas.values()].map((p) => {
    const calc = metaAcumulada(p.entrada, p.saida)
    const metaNova = INFORMADA[p.id] != null ? INFORMADA[p.id] : calc
    return { ...p, metaCalc: calc, metaNova,
      pctHoje: p.metaHoje ? Math.round(p.hoje * 100 / p.metaHoje) : null,
      pctNovo: metaNova ? Math.round(p.novo * 100 / metaNova) : null }
  }).sort((a, b) => (a.grupo === b.grupo ? a.nome.localeCompare(b.nome) : String(a.grupo).localeCompare(String(b.grupo))))

  console.log('PCs lidas:', n, '| pessoas na apuracao:', linhas.length)
  console.log('\nGRP NOME                                  METAhoje METAnova  CONTAhoje CONTAnova   soCI  bxSemPar   %hoje  %novo')
  for (const l of linhas) console.log(
    ` ${String(l.grupo).padEnd(2)} ${l.nome.slice(0, 36).padEnd(36)} ${String(l.metaHoje).padStart(7)} ${String(l.metaNova).padStart(8)} `
    + `${String(l.hoje).padStart(9)} ${String(l.novo).padStart(9)} ${String(l.soCi).padStart(6)} ${String(l.baixadasSemParecer).padStart(9)} `
    + `${String(l.pctHoje == null ? '—' : l.pctHoje + '%').padStart(7)} ${String(l.pctNovo == null ? '—' : l.pctNovo + '%').padStart(6)}`)

  const som = (f) => linhas.reduce((s, l) => s + f(l), 0)
  console.log('\nTOTAIS  meta hoje', som(l => l.metaHoje), '| meta nova', som(l => l.metaNova),
    '| conta hoje', som(l => l.hoje), '| conta nova', som(l => l.novo),
    '| so C.I.', som(l => l.soCi), '| baixada sem parecer', som(l => l.baixadasSemParecer))

  // Conferencia contra a tabela do documento de 18/09 — se divergir, a divergencia e o achado.
  const DOC = { Elquier:60, Guilherme:124, Higor:104, 'Maria Goreti Korb':127, Marilza:71, Samoel:95,
    'Richard Motta Coelho':113, Willian:98, 'Scheila Zimmermann Furtado':80, Franciani:70,
    'Eduardo Pizolati':36, 'Jeisson Klein Garcia':17, 'Carla Goedert Xavier':14, 'Fabiana Vieira':14 }
  console.log('\nCONFERENCIA com a tabela do documento de 18/09 (meta calculada):')
  let div = 0
  for (const [nome, v] of Object.entries(DOC)) {
    const l = linhas.find(x => x.nome === nome || x.nome.startsWith(nome.split(' ')[0]))
    if (!l) { console.log('  SEM CADASTRO:', nome, '(doc:', v + ')'); continue }
    if (l.metaCalc !== v) { div++; console.log('  DIVERGE:', l.nome, 'doc', v, 'agora', l.metaCalc) }
  }
  console.log(div ? `  ${div} divergencia(s)` : '  as 14 batem')

  fs.writeFileSync('comparativo.json', JSON.stringify(linhas, null, 1))
})()
