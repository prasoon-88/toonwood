// Floating logo: click reopens the main window, drag moves the bubble.
const DRAG_THRESHOLD_PX = 4

const el = document.getElementById('bubble')!
let start: { x: number; y: number } | null = null
let dragging = false

el.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  el.setPointerCapture(e.pointerId)
  start = { x: e.screenX, y: e.screenY }
  dragging = false
})

el.addEventListener('pointermove', (e) => {
  if (!start) return
  const dx = e.screenX - start.x
  const dy = e.screenY - start.y
  if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
    dragging = true
    el.classList.add('dragging')
    window.api.bubbleDragStart()
  }
  if (dragging) window.api.bubbleDrag(dx, dy)
})

el.addEventListener('pointerup', () => {
  if (!start) return
  if (dragging) window.api.bubbleDragEnd()
  else window.api.bubbleClick()
  start = null
  dragging = false
  el.classList.remove('dragging')
})

export {}
