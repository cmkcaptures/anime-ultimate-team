const pages = document.getElementById('pages')
let scrollLeft = 0

function addControls(tabs) {
  const rail = document.createElement('nav')
  rail.className = 'battle-tab-rail'
  rail.setAttribute('aria-label', 'Battle modes')

  function arrow(direction, label, icon) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'mtab battle-tab-arrow'
    button.textContent = icon
    button.setAttribute('aria-label', label)
    button.onclick = () => tabs.scrollBy({
      left: direction * Math.max(200, tabs.clientWidth * .65),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
    return button
  }

  const left = arrow(-1, 'Scroll battle modes left', '‹')
  const right = arrow(1, 'Scroll battle modes right', '›')
  function update() {
    if (!tabs.isConnected) return
    left.disabled = tabs.scrollLeft <= 1
    right.disabled = tabs.scrollWidth - tabs.clientWidth - tabs.scrollLeft <= 1
  }

  tabs.before(rail)
  rail.append(left, tabs, right)
  tabs.scrollLeft = scrollLeft
  const selected = tabs.querySelector('.mtab.on')
  if (selected) {
    selected.setAttribute('aria-current', 'page')
    const viewport = tabs.getBoundingClientRect()
    const active = selected.getBoundingClientRect()
    if (active.left < viewport.left) tabs.scrollLeft += active.left - viewport.left - 4
    else if (active.right > viewport.right) tabs.scrollLeft += active.right - viewport.right + 4
  }
  tabs.addEventListener('scroll', update, { passive: true })
  tabs.addEventListener('click', () => { scrollLeft = tabs.scrollLeft }, { capture: true })
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (tabs.isConnected) update()
      else observer.disconnect()
    })
    observer.observe(tabs)
  }
  update()
}

function updateBattleTabs() {
  if (document.body.dataset.page !== 'battle') return
  const tabs = pages.querySelector('.page:last-child > .mtabs')
  if (tabs) addControls(tabs)
}
new MutationObserver(updateBattleTabs).observe(pages, { childList: true, subtree: true })
updateBattleTabs()
