import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Serve an isolated, read-only fixture through the real playback page and assets.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const work = await mkdtemp(path.join(tmpdir(), '601media-promo-'))
const framesDir = path.join(work, 'frames')
await mkdir(framesDir)
const script = 'Welcome to 601MEDIA.\n\nYour next production\nstarts here.\n\nOrganize your scripts.\nQueue your segments.\nRead at your pace.\n\nAdjust the speed.\nStay on message.\nKeep your eyes\non the lens.\n\n601MEDIA\nBring your story\ninto focus.'
const routes = new Map([
  ['/teleprompter.php', ['teleprompter.php', 'text/html; charset=utf-8']],
  ['/assets/css/style.css', ['assets/css/style.css', 'text/css; charset=utf-8']],
  ['/assets/js/teleprompter.js', ['assets/js/teleprompter.js', 'text/javascript; charset=utf-8']]
])
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/api.php') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, data: { id: 1, title: '601MEDIA / Production Demo', content: script } }))
      return
    }
    if (url.pathname === '/montserrat.otf') {
      res.writeHead(200, { 'Content-Type': 'font/otf' })
      res.end(await readFile('C:/Windows/Fonts/Montserrat-Regular.otf'))
      return
    }
    const route = routes.get(url.pathname)
    if (!route) {
      res.writeHead(404).end()
      return
    }
    let body = await readFile(path.join(root, route[0]), 'utf8')
    if (url.pathname.endsWith('.css')) {
      body = body.replace(/^@import[^;]+;/m, '@font-face { font-family: Montserrat; src: url(/montserrat.otf); font-weight: 100 900; }')
    }
    res.writeHead(200, { 'Content-Type': route[1] })
    res.end(body)
  } catch (error) {
    console.error('Demo server:', error.message)
    res.writeHead(500).end('Unable to render demo')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--disable-lcd-text', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${path.join(work, 'chrome')}`, 'about:blank'
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let socket
try {
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = ''
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 20000)
    chrome.on('error', reject)
    chrome.on('exit', code => reject(new Error(`Chrome exited: ${code}`)))
    chrome.stderr.on('data', chunk => {
      stderr += chunk
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (match) {
        clearTimeout(timeout)
        resolve(match[1])
      }
    })
  })
  socket = new WebSocket(endpoint)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let nextId = 0
  const pending = new Map()
  socket.onmessage = event => {
    const message = JSON.parse(event.data)
    const handler = pending.get(message.id)
    if (!handler) return
    pending.delete(message.id)
    clearTimeout(handler.timeout)
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result)
  }
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId
    const timeout = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`${method} timed out`))
    }, 20000)
    pending.set(id, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const cdp = (method, params) => send(method, params, sessionId)
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  await cdp('Page.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1600, height: 640, deviceScaleFactor: 1, mobile: false })
  // Fullscreen is browser chrome behavior and is excluded from this embedded capture.
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'Element.prototype.requestFullscreen = async function () {}' })
  await cdp('Page.navigate', { url: `${origin}/teleprompter.php?id=1` })
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('Boolean(window._tp)')) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  if (!await evaluate('Boolean(window._tp)')) throw new Error('Playback failed to initialize')
  await evaluate(`(async () => {
    await document.fonts.ready
    window._tp.setFontSize(64)
    document.getElementById('font-slider').value = '64'
    window._tp.setSidePadding(13)
    document.getElementById('pad-slider').value = '13'
    window._tp.setSpeed(3.0)
    document.getElementById('speed-slider').value = '3.0'
    clearTimeout(window._tp.hideTimer)
    const style = document.createElement('style')
    style.textContent = '* { transition: none !important; animation: none !important }'
    document.head.appendChild(style)
    const range = document.createRange()
    range.selectNodeContents(document.querySelector('.tp-seg-text').firstChild)
    window._tp.wrapper.scrollTop += range.getBoundingClientRect().top - 200
  })()`)
  await new Promise(resolve => setTimeout(resolve, 300))
  // Advance the real engine by deterministic 60 Hz ticks for consistent GIF timing.
  await evaluate('window.requestAnimationFrame = () => 0')
  const capture = async name => {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    await writeFile(path.join(framesDir, name), Buffer.from(data, 'base64'))
  }
  await capture('ready.png')
  await evaluate('window._tp.play()')
  for (let i = 0; i < 160; i++) {
    await evaluate(`(() => {
      const tp = window._tp
      for (let tick = 0; tick < 3; tick++) tp._tick()
      tp.controls.classList.toggle('hidden', ${i >= 24})
      document.body.classList.toggle('controls-visible', ${i < 24})
    })()`)
    await capture(`${String(i).padStart(3, '0')}.png`)
    if (i % 40 === 0) console.log(`Captured ${i + 1}/160 scrolling frames`)
  }
  await evaluate(`(() => {
    window._tp.pause()
    window._tp.controls.classList.remove('hidden')
    document.body.classList.add('controls-visible')
  })()`)
  await capture('paused.png')
  console.log(`Capture complete: ${framesDir}`)
  console.log(`Build the GIF with: python tools/build-promo.py "${framesDir}"`)
  await send('Browser.close')
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close()
  chrome.kill()
  server.close()
}
