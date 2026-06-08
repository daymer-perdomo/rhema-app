import { ref, watch } from 'vue'

const EMOTION_EMOJIS = {
  tristeza:     '😢',
  miedo:        '😨',
  ansiedad:     '😟',
  soledad:      '😔',
  ira:          '😤',
  culpa:        '😞',
  duda_de_fe:   '🤔',
  gratitud:     '🙏',
  paz:          '😌',
  desesperanza: '💔',
  confusión:    '😵',
  vergüenza:    '😳',
}
const DEFAULT_EMOJI = '✦'

const EMOTION_LABELS = {
  tristeza:     'Tristeza',
  miedo:        'Miedo',
  ansiedad:     'Ansiedad',
  soledad:      'Soledad',
  ira:          'Enojo',
  culpa:        'Culpa',
  duda_de_fe:   'Duda de fe',
  gratitud:     'Gratitud',
  paz:          'Paz',
  desesperanza: 'Desesperanza',
  confusión:    'Confusión',
  vergüenza:    'Vergüenza',
}

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif'

export function useLifeCanvas(canvasRef, entriesGetter, emit) {
  let ctx = null
  let animId = null
  let observer = null
  let particles = []
  let nodes = []
  let hoveredNode = null
  let time = 0
  let dashOffset = 0
  let logW = 0
  let logH = 0
  let dpr = 1
  let colors = {}
  const activeNodeId = ref(null)

  // ─── Colors ───────────────────────────────────────────────────────────────
  function readColors() {
    const s = getComputedStyle(document.documentElement)
    const get = (v, fb) => s.getPropertyValue(v).trim() || fb
    colors = {
      bg:          get('--canvas-bg',      '#080e18'),
      particle:    get('--particle-color', 'rgba(201,168,76,0.15)'),
      lifeline:    get('--lifeline-color', 'rgba(201,168,76,0.6)'),
      lifelineGlow:get('--lifeline-glow',  'rgba(201,168,76,0.2)'),
      gold: '#c9a84c',
      emotions: {
        tristeza:    get('--emotion-tristeza',  '#5b8dd9'),
        miedo:       get('--emotion-miedo',     '#9b72cf'),
        ansiedad:    get('--emotion-ansiedad',  '#d4956a'),
        soledad:     get('--emotion-soledad',   '#6a9bb5'),
        ira:         get('--emotion-ira',       '#d46a6a'),
        culpa:       get('--emotion-culpa',     '#8b7355'),
        duda_de_fe:  get('--emotion-duda',      '#7a8fa6'),
        gratitud:    get('--emotion-gratitud',  '#c9a84c'),
        paz:         get('--emotion-paz',       '#6ab58b'),
        desesperanza:get('--emotion-tristeza',  '#5b8dd9'),
        confusión:   get('--emotion-duda',      '#7a8fa6'),
        vergüenza:   get('--emotion-culpa',     '#8b7355'),
      },
    }
  }

  function nodeColor(emotion) { return colors.emotions?.[emotion] || colors.gold }
  function nodeSize(intensity) {
    return { leve: 18, moderada: 22, intensa: 26, crisis: 28 }[intensity] || 20
  }

  // ─── Particles ────────────────────────────────────────────────────────────
  function initParticles() {
    particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * logW,
      y: Math.random() * logH,
      r: 0.5 + Math.random() * 1,
      a: 0.1 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
    }))
  }

  function updateParticles() {
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = colors.particle
      ctx.globalAlpha = p.a
      ctx.fill()
      ctx.globalAlpha = 1
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0) p.x = logW
      if (p.x > logW) p.x = 0
      if (p.y < 0) p.y = logH
      if (p.y > logH) p.y = 0
    }
  }

  // ─── Layout ───────────────────────────────────────────────────────────────
  function calculateLayout(entries) {
    if (!entries?.length) return []
    const sorted = [...entries].sort((a, b) =>
      new Date(a.entry_date) - new Date(b.entry_date)
    )
    const n = sorted.length
    const mobile = logW <= 600

    return sorted.map((entry, i) => ({
      entry,
      x: mobile
        ? logW / 2 + (i % 2 === 0 ? -40 : 40)
        : logW * 0.075 + (i / Math.max(n - 1, 1)) * (logW * 0.85),
      y: mobile
        ? 60 + i * 90
        : logH / 2 + Math.sin(i * 1.2) * (logH * 0.28),
      baseSize: nodeSize(entry.intensity),
      color:    nodeColor(entry.emotion),
      phase:    (i * 2.4) % (Math.PI * 2),
    }))
  }

  // ─── Draw: life line ──────────────────────────────────────────────────────
  function drawLifeLine() {
    if (nodes.length < 2) return
    ctx.save()
    ctx.strokeStyle = colors.lifeline
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 8
    ctx.shadowColor = colors.lifelineGlow
    ctx.setLineDash([6, 3])
    ctx.lineDashOffset = -dashOffset
    ctx.beginPath()
    ctx.moveTo(nodes[0].x, nodes[0].y)
    for (let i = 1; i < nodes.length; i++) {
      const p = nodes[i - 1], c = nodes[i]
      ctx.quadraticCurveTo(p.x, p.y, (p.x + c.x) / 2, (p.y + c.y) / 2)
    }
    ctx.lineTo(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y)
    ctx.stroke()
    ctx.restore()
    dashOffset += 0.5
  }

  // ─── Draw: nodes ──────────────────────────────────────────────────────────
  function drawNodes() {
    for (const node of nodes) {
      const highlighted = hoveredNode === node || activeNodeId.value === node.entry.id
      const pulse = Math.sin(time * 0.8 + node.phase) * 1.5
      const size  = node.baseSize + pulse + (highlighted ? 4 : 0)
      const emoji = EMOTION_EMOJIS[node.entry.emotion] || DEFAULT_EMOJI

      // Glow halo behind emoji
      ctx.save()
      ctx.shadowBlur = highlighted ? 32 : 16
      ctx.shadowColor = node.color
      ctx.beginPath()
      ctx.arc(node.x, node.y, size * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.globalAlpha = highlighted ? 0.22 : 0.10
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.restore()

      // Emoji
      ctx.save()
      if (emoji === DEFAULT_EMOJI) {
        ctx.font = `${size}px serif`
        ctx.fillStyle = colors.gold
        ctx.shadowBlur = 12
        ctx.shadowColor = colors.gold
      } else {
        ctx.font = `${size}px ${EMOJI_FONT}`
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = highlighted ? 1.0 : 0.88
      ctx.fillText(emoji, node.x, node.y)
      ctx.globalAlpha = 1
      ctx.restore()

      // Store hit radius for click/hover detection
      node.hitRadius = size * 0.6 + 8
    }
  }

  // ─── Draw: tooltip ────────────────────────────────────────────────────────
  function drawTooltip(node) {
    const emoji   = EMOTION_EMOJIS[node.entry.emotion] || DEFAULT_EMOJI
    const emLabel = EMOTION_LABELS[node.entry.emotion] || ''
    const d = node.entry.entry_date
      ? new Date(node.entry.entry_date + 'T00:00:00').toLocaleDateString('es', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
      : ''
    const title = node.entry.title || 'Entrada del día'
    const pad   = 12

    ctx.font = '500 12px Inter,sans-serif'
    const lw1 = ctx.measureText(emLabel).width + 26
    const lw2 = ctx.measureText(d).width
    const lw3 = ctx.measureText(title).width
    const bw  = Math.max(lw1, lw2, lw3) + pad * 2
    const bh  = 66

    let tx = node.x + 22, ty = node.y - bh / 2
    if (tx + bw > logW - 8) tx = node.x - bw - 22
    ty = Math.max(8, Math.min(ty, logH - bh - 8))

    ctx.save()
    ctx.fillStyle = 'rgba(14,21,32,0.94)'
    ctx.strokeStyle = 'rgba(201,168,76,0.45)'
    ctx.lineWidth = 1
    roundRect(ctx, tx, ty, bw, bh, 6)
    ctx.fill()
    ctx.stroke()

    // Line 1 — emoji + emotion label
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    if (emoji !== DEFAULT_EMOJI) {
      ctx.font = `15px ${EMOJI_FONT}`
    } else {
      ctx.font = '14px serif'
      ctx.fillStyle = colors.gold
    }
    ctx.fillText(emoji, tx + pad, ty + 14)
    ctx.font = '500 12px Inter,sans-serif'
    ctx.fillStyle = '#c9a84c'
    ctx.fillText(emLabel, tx + pad + 22, ty + 14)

    // Line 2 — date
    ctx.font = '11px Inter,sans-serif'
    ctx.fillStyle = 'rgba(107,107,122,1)'
    ctx.fillText(d, tx + pad, ty + 33)

    // Line 3 — title
    ctx.font = '500 12px Inter,sans-serif'
    ctx.fillStyle = '#e2e2e8'
    ctx.fillText(title, tx + pad, ty + 51)

    ctx.restore()
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath()
    c.moveTo(x + r, y)
    c.lineTo(x + w - r, y)
    c.arcTo(x + w, y, x + w, y + r, r)
    c.lineTo(x + w, y + h - r)
    c.arcTo(x + w, y + h, x + w - r, y + h, r)
    c.lineTo(x + r, y + h)
    c.arcTo(x, y + h, x, y + h - r, r)
    c.lineTo(x, y + r)
    c.arcTo(x, y, x + r, y, r)
    c.closePath()
  }

  // ─── Draw: empty state ────────────────────────────────────────────────────
  function drawEmptyState() {
    const cx = logW / 2, cy = logH / 2
    const pulse = Math.sin(time * 0.8) * 2
    const size  = 32 + pulse

    ctx.save()
    ctx.font = `${size}px ${EMOJI_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.65 + Math.sin(time * 0.5) * 0.2
    ctx.fillText('🕊️', cx, cy)
    ctx.globalAlpha = 1
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.4 + Math.sin(time * 0.5) * 0.2
    ctx.font = 'italic 15px "Cormorant Garamond",Georgia,serif'
    ctx.fillStyle = colors.gold
    ctx.textAlign = 'center'
    ctx.fillText('Tu historia comienza hoy.', cx, cy - 44)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  function drawWatermark() {
    ctx.save()
    ctx.font = 'italic 12px "Cormorant Garamond",Georgia,serif'
    ctx.fillStyle = colors.gold
    ctx.globalAlpha = 0.35
    ctx.textAlign = 'left'
    ctx.fillText('Tu camino espiritual', 20, 28)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // ─── Main loop ────────────────────────────────────────────────────────────
  function draw() {
    if (!ctx) return
    ctx.clearRect(0, 0, logW, logH)
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, logW, logH)
    updateParticles()
    if (nodes.length === 0) {
      drawEmptyState()
    } else {
      drawLifeLine()
      drawNodes()
      if (hoveredNode) drawTooltip(hoveredNode)
      drawWatermark()
    }
    time += 0.016
    animId = requestAnimationFrame(draw)
  }

  // ─── Events ───────────────────────────────────────────────────────────────
  function getPos(e) {
    const rect = canvasRef.value.getBoundingClientRect()
    const src = e.changedTouches?.[0] || e.touches?.[0] || e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  function findNode(x, y) {
    for (const node of nodes) {
      const dx = node.x - x, dy = node.y - y
      const r  = node.hitRadius ?? (node.baseSize * 0.6 + 8)
      if (dx * dx + dy * dy <= r * r) return node
    }
    return null
  }

  function onMouseMove(e) {
    if (!canvasRef.value) return
    const { x, y } = getPos(e)
    hoveredNode = findNode(x, y)
    canvasRef.value.style.cursor = hoveredNode ? 'pointer' : 'default'
  }

  function onClick(e) {
    const { x, y } = getPos(e)
    const node = findNode(x, y)
    if (node) emit('nodeClick', node.entry.id)
  }

  // ─── Resize ───────────────────────────────────────────────────────────────
  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    dpr = window.devicePixelRatio || 1
    logW = rect.width
    logH = rect.height
    canvas.width  = Math.round(logW * dpr)
    canvas.height = Math.round(logH * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    initParticles()
    nodes = calculateLayout(entriesGetter() || [])
  }

  // ─── Watch entries ────────────────────────────────────────────────────────
  watch(entriesGetter, (newEntries) => {
    nodes = calculateLayout(newEntries || [])
  }, { deep: true })

  // ─── Public API ───────────────────────────────────────────────────────────
  function highlightNode(entryId) {
    activeNodeId.value = entryId
    setTimeout(() => { if (activeNodeId.value === entryId) activeNodeId.value = null }, 800)
  }

  function initCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    ctx = canvas.getContext('2d')
    readColors()
    resize()

    if (animId) cancelAnimationFrame(animId)
    draw()

    observer = new ResizeObserver(() => resize())
    observer.observe(canvas)

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchmove', onMouseMove, { passive: true })
    canvas.addEventListener('touchend', onClick)
  }

  function destroyCanvas() {
    if (animId) cancelAnimationFrame(animId)
    observer?.disconnect()
    const canvas = canvasRef.value
    if (!canvas) return
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('touchmove', onMouseMove)
    canvas.removeEventListener('touchend', onClick)
    ctx = null
    animId = null
  }

  return { initCanvas, destroyCanvas, highlightNode }
}
