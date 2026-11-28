// Home screen life: featured carousel, live news ticker, animated leader (tilt + aura motes).
export function homeLife({ el, ST, P, POOL, BYKEY, go, cardDetail, leaderboard, now }) {
  const DAY = 864e5, t = now()
  const fresh = POOL.filter(c => c.added && t - c.added < 10 * DAY).sort((a, b) => b.added - a.added)
  const asc = POOL.filter(c => c.ascension && c.ascension.added && t - c.ascension.added < 14 * DAY)
  const mode = m => () => { try { sessionStorage.setItem('bmode', m) } catch { } go('battle') }
  const B = ST.banner, top = POOL.slice().sort((a, b) => b.ovr - a.ovr)
  // ---- featured carousel ----
  const slides = []
  if (B && B.ends > t) { const c = BYKEY[B.featured[0]]; slides.push({ c, k: 'LIMITED BANNER', t: c ? c.name : 'Banner', s: 'Ends in <span data-until="' + B.ends + '" data-done="Ended"></span>', fn: () => go('shop'), col: '#ff4fd8' }) }
  for (const c of asc.slice(0, 2)) slides.push({ c, k: '⬆ NEW ASCENSION', t: c.name, s: 'A new kit has awakened', fn: () => cardDetail(c.key), col: '#ffd36a' })
  if (fresh.length) slides.push({ c: fresh[0], k: 'NEW ARRIVALS', t: fresh.length + ' new fighter' + (fresh.length > 1 ? 's' : ''), s: fresh.slice(0, 3).map(c => c.name).join(' · '), fn: () => cardDetail(fresh[0].key), col: '#9ae4ff' })
  slides.push({ c: top.find(c => c.r === 'X') || top[0], k: 'DEAD ZONE', t: 'Conquer the Dead Zones', s: 'Elite bosses · Mythic rewards', fn: mode('redzone'), col: '#ff5a5a' })
  slides.push({ c: top.find(c => c.r === 'M') || top[1], k: 'THE CRUCIBLE', t: '50 stages of pain', s: 'Gear drops · huge rewards', fn: mode('crucible'), col: '#ff9a3c' })
  const car = document.createElement('section'); car.className = 'hl-car'
  car.innerHTML = slides.map((s, i) => `<button class="hl-sl${i ? '' : ' on'}" style="--c:${s.col};--art:url('${s.c ? s.c.url : ''}');--fy:${Math.round(((s.c && s.c.fy) ?? .22) * 100)}%"><i class="hl-im"></i><i class="hl-sw"></i><span><small>${s.k}</small><b>${s.t}</b><em>${s.s}</em></span><i class="hl-go">›</i></button>`).join('') + `<div class="hl-dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`
  const sl = [...car.querySelectorAll('.hl-sl')], dots = [...car.querySelectorAll('.hl-dots i')]
  sl.forEach((b, i) => b.onclick = slides[i].fn)
  let cur = 0; const show = n => { sl[cur].classList.remove('on'); dots[cur].classList.remove('on'); cur = (n + sl.length) % sl.length; sl[cur].classList.add('on'); dots[cur].classList.add('on') }
  dots.forEach((d, i) => d.onclick = e => { e.stopPropagation(); show(i) })
  let sx = null; car.onpointerdown = e => sx = e.clientX; car.onpointerup = e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) { show(cur + (e.clientX < sx ? 1 : -1)); e.preventDefault() } sx = null }
  const tm = setInterval(() => { if (!car.isConnected) return clearInterval(tm); if (!document.hidden) show(cur + 1) }, 5500)
  // ---- news ticker ----
  const news = []
  if (B && B.ends > t) news.push('🔥 LIMITED BANNER LIVE: ' + (BYKEY[B.featured[0]]?.name || ''))
  for (const c of fresh.slice(0, 5)) news.push('✨ NEW: ' + c.name + (c.ver ? ' (' + c.ver + ')' : ''))
  for (const c of asc) news.push('⬆ ASCENSION UNLOCKED: ' + c.name)
  const mine = (P.last || []).map(k => BYKEY[k]).filter(c => c && 'MX'.includes(c.r))[0]
  if (mine) news.push('🎉 You pulled ' + mine.name + '!')
  news.push('⚔ ' + POOL.length + ' fighters in the game', '💀 Dead Zones & the Crucible drop gear')
  const tk = document.createElement('div'); tk.className = 'hl-tick'
  const fill = () => { const s = news.map(n => `<span>${n}</span>`).join('<i>◆</i>'); tk.innerHTML = `<b>LIVE</b><div class="hl-tr"><div class="hl-run" style="--d:${Math.max(20, news.length * 6)}s">${s}<i>◆</i>${s}<i>◆</i></div></div>` }
  fill()
  leaderboard('level').then(L => { const p = L && L[0]; if (p && p.name) { news.splice(1, 0, '👑 ' + p.name + ' tops the leaderboard at level ' + p.level); fill() } }).catch(() => { })
  // ---- animated leader card ----
  const fc = el.querySelector('.lb-feat')
  if (fc) {
    const m = document.createElement('i'); m.className = 'hl-motes'; m.innerHTML = Array.from({ length: 14 }, (_, i) => `<b style="--x:${(i * 37) % 100}%;--d:${4 + (i % 5)}s;--w:${(i * 0.7) % 4}s"></b>`).join(''); fc.append(m)
    fc.onpointermove = e => { const r = fc.getBoundingClientRect(); fc.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -8 + 'deg'); fc.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg') }
    fc.onpointerleave = () => { fc.style.setProperty('--rx', '0deg'); fc.style.setProperty('--ry', '0deg') }
  }
  const lob = el.querySelector('.lobby')
  if (lob) { lob.before(tk); lob.after(car) } else el.prepend(tk, car)
}
