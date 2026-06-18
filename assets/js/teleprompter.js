/* ── Teleprompter Engine ─────────────────────────────────────────────────── */
class Teleprompter {
    constructor(segments) {
        this.segments      = segments
        this.wrapper       = document.getElementById('tp-wrapper')
        this.content       = document.getElementById('tp-content')
        this.controls      = document.getElementById('tp-controls')
        this.playBtn       = document.getElementById('tp-play-btn')
        this.badge         = document.getElementById('tp-segment-title')
        this.counter       = document.getElementById('tp-counter')

        this.isPlaying     = false
        this.raf           = null
        this.speed         = 1.5
        this.fontSize      = 52
        this.sidePadding   = 15
        this.lineHeight    = 1.6
        this.letterSpacing = 0
        this.hideTimer     = null
        this.currentSegIdx = 0
        this.sections      = []

        this._buildContent()
        this._bindControls()
        this._bindEvents()
        this._applySettings()
        this._showControls()
    }

    /* ── Content Building ─────────────────────────────────────────────── */
    _buildContent() {
        const total = this.segments.length

        this.content.innerHTML = this.segments.map((seg, i) => `
            <section class="tp-segment" data-index="${i}">
                ${total > 1 ? `
                <div class="tp-seg-divider">
                    <span class="tp-seg-divider-num">${i + 1} / ${total}</span>
                    <span class="tp-seg-divider-title">${escTp(seg.title)}</span>
                </div>` : ''}
                <div class="tp-seg-text">${escTp(seg.content)}</div>
            </section>
        `).join('')

        // Cache section elements for scroll tracking
        this.sections = Array.from(this.content.querySelectorAll('.tp-segment'))

        this._updateBadge(0)
    }

    /* ── Playback ─────────────────────────────────────────────────────── */
    play() {
        this.isPlaying = true
        this.playBtn.textContent = '⏸'
        this.playBtn.title = 'Pause (Space)'
        this._tick()
    }

    pause() {
        this.isPlaying = false
        this.playBtn.textContent = '▶'
        this.playBtn.title = 'Play (Space)'
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = null
    }

    togglePlay() {
        this.isPlaying ? this.pause() : this.play()
    }

    restart() {
        this.pause()
        const overlay = document.getElementById('tp-end-overlay')
        if (overlay) overlay.remove()
        this.wrapper.scrollTop = 0
        this.currentSegIdx = 0
        this._updateBadge(0)
        this.play()
    }

    _tick() {
        if (!this.isPlaying) return

        const maxScroll = this.wrapper.scrollHeight - this.wrapper.clientHeight
        if (this.wrapper.scrollTop >= maxScroll) {
            this.pause()
            this._showEndOverlay()
            return
        }

        this.wrapper.scrollTop += this.speed
        this._trackSegment()
        this.raf = requestAnimationFrame(() => this._tick())
    }

    /* ── Segment Tracking ─────────────────────────────────────────────── */
    _trackSegment() {
        const readingY = this.wrapper.scrollTop + this.wrapper.clientHeight * 0.5
        let active = 0
        for (let i = 0; i < this.sections.length; i++) {
            if (this.sections[i].offsetTop <= readingY) active = i
        }
        if (active !== this.currentSegIdx) {
            this.currentSegIdx = active
            this._updateBadge(active)
        }
    }

    _updateBadge(idx) {
        const seg   = this.segments[idx]
        const total = this.segments.length
        if (!seg) return

        this.badge.textContent = total > 1
            ? `${idx + 1} / ${total}  —  ${seg.title}`
            : seg.title

        this.counter.textContent = total > 1 ? `${idx + 1} / ${total}` : ''
    }

    /* ── Settings ─────────────────────────────────────────────────────── */
    setSpeed(v) {
        this.speed = parseFloat(v)
        document.getElementById('speed-value').textContent = parseFloat(v).toFixed(1) + 'x'
    }

    setFontSize(v) {
        this.fontSize = parseInt(v)
        this.content.style.fontSize = v + 'px'
        document.getElementById('font-value').textContent = v + 'px'
    }

    setSidePadding(v) {
        this.sidePadding = parseInt(v)
        this.content.style.paddingLeft  = v + '%'
        this.content.style.paddingRight = v + '%'
        document.getElementById('pad-value').textContent = v + '%'
    }

    setLineHeight(v) {
        this.lineHeight = parseFloat(v)
        this.content.style.lineHeight = v
        document.getElementById('line-value').textContent = parseFloat(v).toFixed(1)
    }

    setLetterSpacing(v) {
        this.letterSpacing = parseFloat(v)
        this.content.style.letterSpacing = v + 'px'
        document.getElementById('letter-value').textContent = parseFloat(v).toFixed(1) + 'px'
    }

    _applySettings() {
        this.setFontSize(this.fontSize)
        this.setSidePadding(this.sidePadding)
        this.setSpeed(this.speed)
        this.setLineHeight(this.lineHeight)
        this.setLetterSpacing(this.letterSpacing)

        document.getElementById('speed-slider').value  = this.speed
        document.getElementById('font-slider').value   = this.fontSize
        document.getElementById('pad-slider').value    = this.sidePadding
        document.getElementById('line-slider').value   = this.lineHeight
        document.getElementById('letter-slider').value = this.letterSpacing
    }

    /* ── End of Script ────────────────────────────────────────────────── */
    _showEndOverlay() {
        const existing = document.getElementById('tp-end-overlay')
        if (existing) return

        const overlay = document.createElement('div')
        overlay.id = 'tp-end-overlay'
        overlay.innerHTML = `
            <div class="tp-end-box">
                <div class="tp-end-icon">✓</div>
                <div class="tp-end-label">End of Script</div>
                <button class="tp-btn" onclick="window._tp.restart()" style="margin-top:16px;width:auto;padding:0 20px;border-radius:8px;font-size:13px;">⟳ Restart</button>
            </div>`
        document.body.appendChild(overlay)

        setTimeout(() => overlay.classList.add('visible'), 50)
        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                overlay.remove()
                this._showControls()
            }
        })
    }

    /* ── Controls Visibility ──────────────────────────────────────────── */
    _showControls() {
        this.controls.classList.remove('hidden')
        document.body.classList.add('controls-visible')
        clearTimeout(this.hideTimer)
        this.hideTimer = setTimeout(() => this._hideControls(), 3500)
    }

    _hideControls() {
        this.controls.classList.add('hidden')
        document.body.classList.remove('controls-visible')
    }

    /* ── Event Binding ────────────────────────────────────────────────── */
    _bindControls() {
        document.getElementById('tp-play-btn').addEventListener('click',    () => this.togglePlay())
        document.getElementById('tp-restart-btn').addEventListener('click', () => this.restart())
        document.getElementById('tp-exit-btn').addEventListener('click', () => {
            this.pause()
            window.close()
            setTimeout(() => window.history.back(), 200)
        })

        document.getElementById('speed-slider').addEventListener('input',  e => this.setSpeed(e.target.value))
        document.getElementById('font-slider').addEventListener('input',   e => this.setFontSize(e.target.value))
        document.getElementById('pad-slider').addEventListener('input',    e => this.setSidePadding(e.target.value))
        document.getElementById('line-slider').addEventListener('input',   e => this.setLineHeight(e.target.value))
        document.getElementById('letter-slider').addEventListener('input', e => this.setLetterSpacing(e.target.value))
    }

    _bindEvents() {
        document.addEventListener('mousemove', () => this._showControls())
        document.addEventListener('click',     () => this._showControls())

        document.addEventListener('keydown', e => {
            // Don't intercept when typing in a control
            if (e.target.tagName === 'INPUT') return
            this._showControls()

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault()
                    this.togglePlay()
                    break
                case 'r':
                case 'Home':
                    e.preventDefault()
                    this.restart()
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    this.setSpeed(Math.max(0.1, this.speed - 0.2).toFixed(1))
                    document.getElementById('speed-slider').value = this.speed
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    this.setSpeed(Math.min(10, this.speed + 0.2).toFixed(1))
                    document.getElementById('speed-slider').value = this.speed
                    break
                case '+':
                case '=':
                    e.preventDefault()
                    this.setFontSize(Math.min(120, this.fontSize + 4))
                    document.getElementById('font-slider').value = this.fontSize
                    break
                case '-':
                    e.preventDefault()
                    this.setFontSize(Math.max(24, this.fontSize - 4))
                    document.getElementById('font-slider').value = this.fontSize
                    break
                case 'Escape':
                    this.pause()
                    window.close()
                    break
                case 'f':
                    toggleFullscreen()
                    break
            }
        })

        document.addEventListener('wheel', e => {
            e.preventDefault()
            this._showControls()
            const delta = e.deltaY > 0 ? 0.2 : -0.2
            this.setSpeed(Math.min(10, Math.max(0.1, this.speed + delta)).toFixed(1))
            document.getElementById('speed-slider').value = this.speed
        }, { passive: false })

        let lastTouchY = null
        document.addEventListener('touchstart', e => { lastTouchY = e.touches[0].clientY })
        document.addEventListener('touchmove', e => {
            if (lastTouchY === null) return
            this.wrapper.scrollTop += lastTouchY - e.touches[0].clientY
            lastTouchY = e.touches[0].clientY
        })
    }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function escTp(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
}

/* ── Bootstrap ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
    const params    = new URLSearchParams(window.location.search)
    const loading   = document.getElementById('tp-loading')

    async function fetchJSON(url) {
        const res  = await fetch(url)
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        return json.data
    }

    try {
        let segments = []

        if (params.get('ids')) {
            segments = await fetchJSON(`api.php?action=get_segments_by_ids&ids=${encodeURIComponent(params.get('ids'))}`)
        } else if (params.get('project_id')) {
            segments = await fetchJSON(`api.php?action=get_segments&project_id=${encodeURIComponent(params.get('project_id'))}`)
        } else if (params.get('id')) {
            const seg = await fetchJSON(`api.php?action=get_segment&id=${encodeURIComponent(params.get('id'))}`)
            segments = [seg]
        } else {
            throw new Error('No segment or project specified.')
        }

        if (!segments.length) throw new Error('No segments found.')

        document.title = (segments.length > 1 ? segments[0].title + ' +' + (segments.length - 1) + ' more' : segments[0].title) + ' — Teleprompter'

        loading.style.display = 'none'

        try { await document.documentElement.requestFullscreen() } catch (_) {}

        window._tp = new Teleprompter(segments)

    } catch (err) {
        loading.textContent = 'Error: ' + err.message
    }
})
