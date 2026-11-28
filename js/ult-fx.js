// Full-screen anime Ultimate cut-in (Mythic / Rainbow) and the post-win Victory Pose.
const pos = c => Math.round((c.fx ?? .5) * 100) + '% ' + Math.round((c.fy ?? .25) * 100) + '%'
const KANJI = { STRIKER: '撃', FIGHTER: '闘', TANK: '盾', SHOOTER: '砲', ASSASSIN: '殺', SUPPORT: '癒' }
export function ultraCut(card, move, col, foe) {
  return new Promise(res => {
    const c = document.createElement('div'); c.className = 'uc' + (foe ? ' foe' : ''); c.style.setProperty('--cc', col || '#ffd36a')
    c.innerHTML = `<i class="uc-flash"></i><i class="uc-lines"></i>
      <div class="uc-band b1"><i style="background-image:url('${card.url}');background-position:${pos(card)}"></i></div>
      <div class="uc-band b2"><i style="background-image:url('${card.url}');background-position:${pos(card)}"></i></div>
      <div class="uc-main"><i style="background-image:url('${card.url}');background-position:${pos(card)}"></i></div>
      <div class="uc-port"><i style="background-image:url('${card.url}')"></i><span></span></div>
      <b class="uc-kanji">${KANJI[card.role] || '極'}</b>
      <div class="uc-txt"><small>${foe ? 'ENEMY ' : ''}ULTIMATE</small><b></b><span></span></div>`
    c.querySelector('.uc-txt b').textContent = move || 'ULTIMATE'
    c.querySelector('.uc-txt span').textContent = card.name + ' · ' + (card.ver || '')
    document.body.append(c)
    const done = () => { if (!c.isConnected) return; c.classList.add('out'); setTimeout(() => { c.remove(); res() }, 260) }
    c.onclick = done; setTimeout(done, 1650)
  })
}
const QUOTES = {
  GOKU: ['I’m just getting warmed up!', 'That was a good fight!'], VEGETA: ['Remember the name: Vegeta, Prince of all Saiyans!'], GOHAN: ['I won’t let you hurt anyone else.'],
  NARUTO: ['I never go back on my word, believe it!'], SASUKE: ['You’re not even worth my time.'], LUFFY: ['I’m gonna be King of the Pirates!'], ZORO: ['Nothing happened.'],
  ICHIGO: ['I’ll protect them, no matter what.'], GOJO: ['Throughout heaven and earth, I alone am the honored one.'], SUKUNA: ['Know your place, fool.'],
  TANJIRO: ['Set your heart ablaze!'], DEKU: ['Plus Ultra!'], GUTS: ['I’ll keep struggling.'], MADARA: ['Wake up to reality.'], AIZEN: ['All of it was according to plan.'],
}
const ROLEQ = { FIGHTER: 'Is that all you’ve got?', TANK: 'Nothing gets past me.', SHOOTER: 'Locked on. Target down.', ASSASSIN: 'You never saw me coming.', SUPPORT: 'We won this together.', STRIKER: 'Too slow!' }
export function victoryPose(mvp) {
  return new Promise(res => {
    const card = mvp.card, first = (card.name || '').split(/[ &]/)[0]
    const q = (QUOTES[first] || [ROLEQ[card.role] || 'Victory!'])[Math.floor(Math.random() * (QUOTES[first] || [1]).length)]
    const v = document.createElement('div'); v.className = 'vp'
    v.innerHTML = `<i class="vp-rays"></i><div class="vp-art"><i style="background-image:url('${card.url}');background-position:${pos(card)}"></i></div>
      <div class="vp-info"><small>勝利 · VICTORY · MVP</small><b></b><em></em><p class="vp-q"></p>
      <div class="vp-stats"><span><b>${Math.round(mvp.dealt || 0).toLocaleString()}</b>DAMAGE</span><span><b>${mvp.kos || 0}</b>KOs</span><span><b>${Math.max(0, Math.round((mvp.hp / mvp.max) * 100) || 0)}%</b>HP LEFT</span></div>
      <small class="vp-tap">TAP TO CONTINUE</small></div>`
    v.querySelector('.vp-info b').textContent = card.name; v.querySelector('.vp-info em').textContent = card.ver || ''; v.querySelector('.vp-q').textContent = '“' + q + '”'
    document.body.append(v)
    const done = () => { if (!v.isConnected) return; v.classList.add('out'); setTimeout(() => { v.remove(); res() }, 300) }
    setTimeout(() => { v.onclick = done }, 500); setTimeout(done, 4200)
  })
}

// TEAM ATTACK: split-screen dual cut-in
export function teamCut(c1, c2, name, moment) {
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'tcut'
    o.innerHTML = `<i class="tc-flash"></i><i class="tc-lines"></i>
      <div class="tc-p l"><i style="background-image:url('${c1.url}');background-position:${pos(c1)}"></i></div>
      <div class="tc-p r"><i style="background-image:url('${c2.url}');background-position:${pos(c2)}"></i></div>
      <i class="tc-slash"></i>
      <div class="tc-txt"><small>TEAM ATTACK</small><b></b><span></span><p class="tc-m"></p></div>`
    o.querySelector('.tc-txt b').textContent = name
    o.querySelector('.tc-txt span').textContent = c1.name + '  ×  ' + c2.name; o.querySelector('.tc-m').textContent = moment || ''
    document.body.append(o)
    const done = () => { if (!o.isConnected) return; o.classList.add('out'); setTimeout(() => { o.remove(); res() }, 280) }
    o.onclick = done; setTimeout(done, 2600)
  })
}
