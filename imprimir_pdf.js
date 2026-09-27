// HTML -> PDF pelo Edge headless (CDP). Sem biblioteca.
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const ENTRADA = path.resolve(process.argv[2] || 'doc_nayara.html')
const SAIDA = process.argv[3] || 'C:/Users/Richard/Downloads/saida.pdf'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9333
const zz = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/Richard/AppData/Local/Temp/sigpc-pdf2', 'about:blank'], { stdio: 'ignore' })
  try {
    let alvo
    for (let i = 0; i < 60 && !alvo; i++) {
      try { alvo = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') }
      catch { await zz(250) }
    }
    if (!alvo) throw new Error('Edge nao respondeu')
    const ws = new WebSocket(alvo.webSocketDebuggerUrl)
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
    let seq = 0; const pend = new Map()
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pend.has(m.id)) {
        const p = pend.get(m.id); pend.delete(m.id)
        m.error ? p.rej(new Error(m.error.message)) : p.res(m.result)
      }
    }
    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = ++seq; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })) })
    const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value

    await send('Page.enable')
    await send('Page.navigate', { url: 'file:///' + ENTRADA.split(String.fromCharCode(92)).join('/') })
    for (let i = 0; i < 60; i++) { await zz(200); if (await ev('document.readyState === "complete"')) break }
    await zz(500)
    const r = await send('Page.printToPDF', {
      printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%;font-size:8pt;color:#777;font-family:Calibri,sans-serif;'
        + 'padding:0 16mm;display:flex;justify-content:space-between;">'
        + '<span>SIGPC-GT — Produtividade, números conferidos · 27/09/2026</span>'
        + '<span><span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
    })
    fs.writeFileSync(SAIDA, Buffer.from(r.data, 'base64'))
    const kb = (fs.statSync(SAIDA).size / 1024).toFixed(0)
    console.log('PDF gerado:', SAIDA, kb + ' KB')
    ws.close()
  } catch (e) { console.log('ERRO', e.message); process.exitCode = 1 }
  finally { edge.kill() }
})()
