// ANIME RADIO: streams YouTube playlists/videos through the official embed player (no audio files hosted here).
// Stations are YouTube links; players can add their own. Saved per device.
import { musicDuck } from './sfx.js?v=claude-music-2'
const KEY = 'aut-radio', DEFAULTS = [
  { name: 'Anime Openings', list: 'PLludvM_XF459EPy3u_40KgOkml7UV3PcE' },
]
let S = { stations: DEFAULTS.slice(), cur: 0, vol: 60, shuffle: true }
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.stations) S = { ...S, ...s } } catch { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { } }
let YT = null, player = null, ready = false, playing = false, panel = null, btn = null
function loadAPI() {
  if (YT) return YT
  YT = new Promise(res => { if (window.YT && window.YT.Player) return res(window.YT); const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev && prev(); res(window.YT) }; const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.append(s) })
  return YT
}
// accepts a playlist link, a video link, or a raw id
export function parseLink(u) {
  u = (u || '').trim(); if (!u) return null
  const list = u.match(/[?&]list=([\w-]+)/); if (list) return { list: list[1] }
  const v = u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/); if (v) return { video: v[1] }
  if (/^PL[\w-]{10,}$/.test(u)) return { list: u }
  if (/^[\w-]{11}$/.test(u)) return { video: u }
  return null
}
async function ensurePlayer() {
  if (player) return player
  const Y = await loadAPI(), host = panel.querySelector('.rd-vid')
  const div = document.createElement('div'); host.append(div)
  await new Promise(res => {
    player = new Y.Player(div, { width: 240, height: 135, playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
      events: { onReady: () => { ready = true; player.setVolume(S.vol); res() }, onStateChange: e => { playing = e.data === 1; if (e.data === 1) musicDuck(true); paint() }, onError: () => { try { player.nextVideo() } catch { } } } })
  })
  return player
}
async function playStation(i) {
  S.cur = i; save(); const st = S.stations[i]; if (!st) return
  await ensurePlayer()
  if (st.list) { player.loadPlaylist({ list: st.list, listType: 'playlist', index: 0 }); setTimeout(() => { try { player.setShuffle(!!S.shuffle); if (S.shuffle) player.playVideoAt(0) } catch { } }, 900) }
  else player.loadVideoById(st.video)
  musicDuck(true); paint()
}
function stop() { try { player && player.pauseVideo() } catch { } playing = false; musicDuck(false); paint() }
function paint() {
  if (!panel) return
  let title = ''; try { title = ready && player.getVideoData ? player.getVideoData().title : '' } catch { }
  panel.querySelector('.rd-now').textContent = title || (S.stations[S.cur] ? S.stations[S.cur].name : 'Pick a station')
  panel.querySelector('.rd-pp').textContent = playing ? '❚❚' : '▶'
  panel.querySelector('.rd-sh').classList.toggle('on', !!S.shuffle)
  const L = panel.querySelector('.rd-list'); L.innerHTML = ''
  S.stations.forEach((st, i) => {
    const r = document.createElement('div'); r.className = 'rd-st' + (i === S.cur ? ' on' : '')
    const b = document.createElement('button'); b.className = 'rd-sb'; b.textContent = (i === S.cur && playing ? '🔊 ' : '📻 ') + st.name; b.onclick = () => playStation(i)
    const x = document.createElement('button'); x.className = 'rd-x'; x.textContent = '✕'; x.title = 'Remove station'; x.onclick = () => { S.stations.splice(i, 1); if (S.cur >= S.stations.length) S.cur = 0; save(); paint() }
    r.append(b, x); L.append(r)
  })
  btn && btn.classList.toggle('on', playing)
}
function build() {
  panel = document.createElement('div'); panel.className = 'rd-panel'
  panel.innerHTML = `<header><b>📻 ANIME RADIO</b><button class="rd-close">✕</button></header>
    <div class="rd-vid"></div><div class="rd-now"></div>
    <div class="rd-ctl"><button class="rd-prev">⏮</button><button class="rd-pp">▶</button><button class="rd-next">⏭</button><button class="rd-sh" title="Shuffle">🔀</button><input class="rd-vol" type="range" min="0" max="100"></div>
    <div class="rd-list"></div>
    <div class="rd-add"><input class="rd-in" placeholder="Paste a YouTube playlist or video link"><input class="rd-nm" placeholder="Station name"><button class="rd-ab">+ ADD STATION</button><small class="rd-msg">Tip: search YouTube for e.g. "Naruto openings playlist", open it, copy the link.</small></div>`
  const $ = s => panel.querySelector(s)
  $('.rd-close').onclick = () => panel.classList.remove('open')
  $('.rd-pp').onclick = async () => { if (!player) return playStation(S.cur); if (playing) stop(); else { player.playVideo(); musicDuck(true) } }
  $('.rd-prev').onclick = () => { try { player.previousVideo() } catch { } }
  $('.rd-next').onclick = () => { try { player.nextVideo() } catch { } }
  $('.rd-sh').onclick = () => { S.shuffle = !S.shuffle; save(); try { player.setShuffle(S.shuffle) } catch { } paint() }
  const v = $('.rd-vol'); v.value = S.vol; v.oninput = () => { S.vol = +v.value; save(); try { player.setVolume(S.vol) } catch { } }
  $('.rd-ab').onclick = () => {
    const p = parseLink($('.rd-in').value), m = $('.rd-msg')
    if (!p) { m.textContent = 'That doesn’t look like a YouTube link.'; return }
    S.stations.push({ name: $('.rd-nm').value.trim() || (p.list ? 'My playlist' : 'My track'), ...p }); save()
    $('.rd-in').value = $('.rd-nm').value = ''; m.textContent = 'Station added!'; paint()
  }
  document.body.append(panel)
  setInterval(() => { if (playing) paint() }, 4000)
}
export function radioButton() {
  btn = document.createElement('button'); btn.className = 'cur sndbtn rdbtn'; btn.setAttribute('aria-label', 'Anime Radio'); btn.textContent = '📻'
  btn.onclick = () => { if (!panel) build(); panel.classList.toggle('open'); paint() }
  return btn
}
