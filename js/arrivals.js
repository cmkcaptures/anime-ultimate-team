// NEW ARRIVALS: full-screen cinematic for every card (and every new Ascension) added since the player last saw it.
// Plays once after the patch notes. New accounts start "caught up" so they are not flooded.
const RCOL = { X: '#ff5ad1', M: '#c08cff', L: '#ffc94a', E: '#6fc8ff', R: '#9ae4ff', U: '#8fe8a0', C: '#d8d0f0' }
const RNAME = { X: '♛ RAINBOW SECRET', M: '★★ MYTHIC', L: '★ LEGENDARY', E: 'EPIC', R: 'RARE', U: 'UNCOMMON', C: 'COMMON' }
const wait = ms => new Promise(r => setTimeout(r, ms))

export async function showArrivals({ P, POOL, cardImg, eff, ANAME, act, ascPreview }) {
  // players who have never seen a reveal start from the first batch that shipped with this feature
  const since = P.arrivalsV === 1 && P.seenCardsAt != null ? P.seenCardsAt : 1795787583151 // v1 reset: everyone sees the first batch once
  const cards = POOL.filter(c => (c.added || 0) > since && !c.campaignEnemy && !c.campaignUnlock).sort((a, b) => 'XMLERUC'.indexOf(a.r) - 'XMLERUC'.indexOf(b.r) || b.ovr - a.ovr).map(c => ({ c, at: c.added }))
  const ascs = POOL.filter(c => c.ascension && (c.ascension.added || 0) > since).map(c => ({ c, at: c.ascension.added, asc: true }))
  const items = [...ascs, ...cards]
  if (!items.length) return
  const newest = Math.max(...items.map(x => x.at || 0)), show = items.slice(0, 10)
  const head = ascs.length && !cards.length ? 'ASCENSION' : 'NEW ARRIVALS'
  const sub = [cards.length && cards.length + (cards.length > 1 ? ' NEW FIGHTERS' : ' NEW FIGHTER'), ascs.length && ascs.length + (ascs.length > 1 ? ' ASCENSIONS' : ' ASCENSION')].filter(Boolean).join('  ·  ')
  await new Promise(async done => {
    const ov = document.createElement('div'); ov.className = 'arv2'
    ov.innerHTML = `<i class="a2-bar t"></i><i class="a2-bar b"></i>
      <div class="a2-intro"><small>新登場 · INCOMING</small><b>${head}</b><span>${sub}</span></div>
      <div class="a2-shot"><div class="a2-art"><img alt=""></div><i class="a2-lines"></i><i class="a2-sweep"></i><i class="a2-flash"></i>
        <div class="a2-title"><small class="a2-tag"></small><b class="a2-name"></b><em class="a2-ver"></em></div>
        <div class="a2-card"></div></div>
      <div class="a2-hud"><div class="a2-dots"></div><button class="a2-skip">SKIP ›</button></div>`
    document.body.append(ov)
    const shot = ov.querySelector('.a2-shot'), art = ov.querySelector('.a2-art img'), slot = ov.querySelector('.a2-card'), dots = ov.querySelector('.a2-dots')
    show.forEach(() => dots.append(document.createElement('i')))
    const view = x => x.asc && ascPreview ? ascPreview(x.c) : eff(x.c)
    let i = -1, timer = 0, finished = false
    const finish = () => {
      if (finished) return; finished = true; clearTimeout(timer)
      ov.classList.remove('shot-on'); ov.classList.add('finale')
      const fin = document.createElement('div'); fin.className = 'a2-fin'
      fin.innerHTML = `<i class="a2-rays"></i><div class="a2-fhead"><small>新登場</small><b>${head}</b><span>${sub}</span></div><div class="a2-row"></div><div class="a2-foot"><span>${items.length > show.length ? '+' + (items.length - show.length) + ' more · ' : ''}${ascs.length ? 'Ascend them from the card page · ' : ''}${cards.some(x => x.c.crucibleReward) ? 'Earn it by clearing The Crucible · ' : ''}${cards.some(x => x.c.chronicleReward) ? 'Earn them in Chronicle Break (Battle) · ' : ''}${cards.some(x => !x.c.crucibleReward && !x.c.chronicleReward) ? 'Now in packs & events' : ''}</span><button class="a2-go">CONTINUE</button></div>`
      const row = fin.querySelector('.a2-row')
      show.forEach((x, k) => { const w = document.createElement('div'); w.className = 'a2-fc' + (x.asc ? ' asc' : ''); w.style.setProperty('--k', k - (show.length - 1) / 2); w.style.setProperty('--d', (.15 + k * .08) + 's'); w.append(cardImg(view(x), 300)); row.append(w) })
      ov.append(fin)
      fin.querySelector('.a2-go').onclick = async () => { ov.classList.add('out'); await act('seenCards', { at: newest }); setTimeout(() => { ov.remove(); done() }, 500) }
    }
    const next = () => {
      clearTimeout(timer); i++
      if (i >= show.length) return finish()
      const x = show[i], c = view(x), col = x.asc ? '#ffd36a' : (RCOL[c.r] || '#fff')
      ov.style.setProperty('--rc', col); ov.classList.toggle('is-asc', !!x.asc)
      art.src = c.url; art.style.objectPosition = Math.round((c.fx ?? .5) * 100) + '% ' + Math.round((c.fy ?? .25) * 100) + '%'
      ov.querySelector('.a2-tag').textContent = (x.asc ? '⬆ ASCENSION UNLOCKED' : (RNAME[c.r] || '')) + '  ·  ' + (ANAME(c.anime) || c.anime || '').toUpperCase()
      ov.querySelector('.a2-name').textContent = c.name
      ov.querySelector('.a2-ver').textContent = c.ver + '  ·  ' + c.ovr + ' OVR'
      slot.innerHTML = ''; slot.append(cardImg(c, 420))
      shot.classList.remove('go'); void shot.offsetWidth; shot.classList.add('go')
      ;[...dots.children].forEach((d, k) => d.classList.toggle('on', k === i))
      timer = setTimeout(next, 3600)
    }
    ov.querySelector('.a2-skip').onclick = e => { e.stopPropagation(); finish() }
    ov.onclick = e => { if (!finished && ov.classList.contains('shot-on') && !e.target.closest('button')) next() }
    await wait(40); ov.classList.add('open')
    await wait(1700); ov.classList.add('shot-on'); next()
  })
}
