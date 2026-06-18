<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teleprompter — 601MEDIA</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        html, body { margin: 0; padding: 0; background: #000; height: 100vh; overflow: hidden; }
    </style>
</head>
<body class="tp-page" id="tp-page">

    <!-- Loading Screen -->
    <div class="tp-loading" id="tp-loading">LOADING…</div>

    <!-- Scrollable text container -->
    <div class="tp-wrapper" id="tp-wrapper">
        <div class="tp-content" id="tp-content"></div>
    </div>

    <!-- Center reading guide line -->
    <div class="tp-guide" id="tp-guide"></div>

    <!-- Segment title badge -->
    <div class="tp-segment-title" id="tp-segment-title"></div>

    <!-- Controls overlay -->
    <div class="tp-controls" id="tp-controls">

        <!-- Row 1: Sliders -->
        <div class="tp-controls-row">
            <div class="tp-control-group">
                <span class="tp-control-label">Speed</span>
                <input type="range" id="speed-slider" min="0.1" max="10" step="0.1" value="1.5">
                <span class="tp-control-value" id="speed-value">1.5x</span>
            </div>
            <div class="tp-control-group">
                <span class="tp-control-label">Font</span>
                <input type="range" id="font-slider" min="24" max="120" step="2" value="52">
                <span class="tp-control-value" id="font-value">52px</span>
            </div>
            <div class="tp-control-group">
                <span class="tp-control-label">Padding</span>
                <input type="range" id="pad-slider" min="0" max="40" step="1" value="15">
                <span class="tp-control-value" id="pad-value">15%</span>
            </div>
            <div class="tp-control-group">
                <span class="tp-control-label">Line</span>
                <input type="range" id="line-slider" min="1" max="3" step="0.1" value="1.6">
                <span class="tp-control-value" id="line-value">1.6</span>
            </div>
            <div class="tp-control-group">
                <span class="tp-control-label">Letter</span>
                <input type="range" id="letter-slider" min="-2" max="10" step="0.5" value="0">
                <span class="tp-control-value" id="letter-value">0px</span>
            </div>
        </div>

        <!-- Row 2: Buttons + segment counter -->
        <div class="tp-controls-row tp-controls-btns">
            <button class="tp-btn" id="tp-restart-btn" title="Restart (R)">⟳</button>
            <button class="tp-btn" id="tp-reverse-btn" title="Reverse Scroll (X)" onclick="window._tp.toggleReverse()">⇅</button>
            <button class="tp-btn play-btn" id="tp-play-btn" title="Play/Pause (Space)">▶</button>
            <div class="tp-counter" id="tp-counter"></div>
            <button class="tp-btn" id="tp-fs-btn" title="Fullscreen (F)" onclick="toggleFullscreen()">⛶</button>
            <button class="tp-btn exit-btn" id="tp-exit-btn" title="Exit (Esc)">✕</button>
        </div>

    </div>

    <script>
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen()
            } else {
                document.exitFullscreen()
            }
        }

        document.addEventListener('fullscreenchange', () => {
            const btn = document.getElementById('tp-fs-btn')
            btn.textContent = document.fullscreenElement ? '⛶' : '⛶'
            btn.title = document.fullscreenElement ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'
        })
    </script>
    <script src="assets/js/teleprompter.js"></script>
</body>
</html>
