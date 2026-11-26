import { validGrant } from './player-grants.js?v=1'
// AUT accounts: Firebase Auth (email/password + Google) and Firestore (private save + public profile).
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/'
let A, F, auth, db, USER = null, PROFILE = null

const css = `
.acc{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;padding:16px;background:radial-gradient(60% 50% at 50% 30%,#2a1430,#07070b 75%);font-family:Nunito,system-ui,sans-serif;color:#fff}
.acc-card{width:min(400px,100%);padding:30px 26px 24px;border-radius:22px;background:linear-gradient(160deg,#1f1a2c,#120f1a);box-shadow:0 30px 70px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.1)}
.acc h1{margin:0 0 2px;font:italic 900 40px/.9 "Sofia Sans Extra Condensed",sans-serif;background:linear-gradient(90deg,#ff7ab8,#ffd36a,#6affc0,#6ac8ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.acc p{margin:0 0 18px;font-weight:700;font-size:13px;color:rgba(255,255,255,.6)}
.acc input{width:100%;box-sizing:border-box;height:48px;margin-bottom:10px;padding:0 14px;border:0;border-radius:12px;background:rgba(0,0,0,.4);color:#fff;font:700 15px Nunito,sans-serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);outline:none}
.acc input:focus{box-shadow:inset 0 0 0 2px #ffb627}
.acc button{width:100%;height:50px;border:0;border-radius:12px;cursor:pointer;font:italic 900 22px "Sofia Sans Extra Condensed",sans-serif;letter-spacing:.05em}
.acc .go{background:linear-gradient(180deg,#ffd36a,#ffa53a);color:#2a1400;margin-top:4px}
.acc .gg{margin-top:10px;background:#fff;color:#222;display:flex;align-items:center;justify-content:center;gap:10px;font-size:19px}
.acc .sw{margin-top:14px;height:auto;background:none;color:rgba(255,255,255,.7);font:800 13px Nunito,sans-serif;letter-spacing:0}
.acc .or{display:flex;align-items:center;gap:10px;margin:14px 0 4px;font:900 10px Nunito;letter-spacing:.2em;color:rgba(255,255,255,.35)}.acc .or:before,.acc .or:after{content:"";flex:1;height:1px;background:rgba(255,255,255,.12)}
.acc .err{min-height:18px;margin:6px 0 0;font:800 12px Nunito;color:#ff7a85}
.acc .fp{margin-top:6px}.acc .busy{opacity:.6;pointer-events:none}`

function overlay(html) { if (!document.getElementById('acc-css')) { const s = document.createElement('style'); s.id = 'acc-css'; s.textContent = css; document.head.append(s) } const o = document.createElement('div'); o.className = 'acc'; o.innerHTML = `<div class="acc-card">${html}</div>`; document.body.append(o); return o }
const nice = e => ({ 'auth/invalid-credential': 'Wrong email or password.', 'auth/email-already-in-use': 'That email already has an account. Sign in instead.', 'auth/weak-password': 'Password needs at least 6 characters.', 'auth/invalid-email': 'That email address looks wrong.', 'auth/popup-closed-by-user': 'Google sign-in was closed.', 'auth/too-many-requests': 'Too many tries. Wait a minute and try again.' }[e.code] || e.message || 'Something went wrong.')

function loginScreen() {
  return new Promise(res => {
    let mode = 'in'
    const o = overlay(`<h1>ANIME ULTIMATE TEAM</h1><p class="sub">Sign in to play. Your club saves to your account.</p>
      <input class="em" type="email" placeholder="Email" autocomplete="email"><input class="pw" type="password" placeholder="Password" autocomplete="current-password">
      <button class="go">SIGN IN</button><div class="err"></div>
      <div class="or">OR</div><button class="gg"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>CONTINUE WITH GOOGLE</button>
      <button class="sw">No account? Create one</button><button class="sw fp">Forgot password? / Set a password for your Google account</button>`)
    const $ = s => o.querySelector(s), err = t => $('.err').textContent = t || ''
    const busy = b => o.querySelector('.acc-card').classList.toggle('busy', b)
    $('.sw').onclick = () => { mode = mode === 'in' ? 'up' : 'in'; $('.go').textContent = mode === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT'; $('.sw').textContent = mode === 'in' ? 'No account? Create one' : 'Have an account? Sign in'; $('.pw').autocomplete = mode === 'in' ? 'current-password' : 'new-password'; err() }
    const done = u => { o.remove(); res(u) }
    const submit = async () => {
      const em = $('.em').value.trim(), pw = $('.pw').value; if (!em || !pw) return err('Enter your email and password.')
      busy(true); err()
      try { const r = mode === 'in' ? await A.signInWithEmailAndPassword(auth, em, pw) : await A.createUserWithEmailAndPassword(auth, em, pw); done(r.user) } catch (e) { err(nice(e)); busy(false) }
    }
    $('.fp').onclick = async () => { const em = $('.em').value.trim(); if (!em) return err('Type your email above first, then tap this again.'); busy(true); try { await A.sendPasswordResetEmail(auth, em); $('.err').style.color = '#6affc0'; err('Check your email (and spam) for a link to set your password.') } catch (x) { err(nice(x)) } busy(false) }
    $('.go').onclick = submit; $('.pw').onkeydown = e => { if (e.key === 'Enter') submit() }
    $('.gg').onclick = async () => { busy(true); err(); try { const r = await A.signInWithPopup(auth, new A.GoogleAuthProvider()); done(r.user) } catch (e) { err(nice(e)); busy(false) } }
  })
}

function pickName() {
  return new Promise(res => {
    const o = overlay(`<h1>PICK A NAME</h1><p class="sub">This is how other players see you. 3–16 letters, numbers or _.</p><input class="nm" maxlength="16" placeholder="Username" autocomplete="off"><button class="go">LET'S GO</button><div class="err"></div>`)
    const $ = s => o.querySelector(s)
    const go = async () => {
      const name = $('.nm').value.trim(); if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) { $('.err').textContent = 'Use 3–16 letters, numbers or _.'; return }
      o.querySelector('.acc-card').classList.add('busy'); $('.err').textContent = ''
      try {
        const lower = name.toLowerCase(), nref = F.doc(db, 'usernames', lower), pref = F.doc(db, 'profiles', USER.uid)
        await F.runTransaction(db, async tx => {
          const ex = await tx.get(nref); if (ex.exists() && ex.data().uid !== USER.uid) throw new Error('taken')
          tx.set(nref, { uid: USER.uid })
          tx.set(pref, { name, nameLower: lower, level: 1, cards: 0, packs: 0, cleared: 0, wins: 0, losses: 0, rating: 0, team: [], showcase: [], friends: [], updatedAt: Date.now() })
        })
        o.remove(); res((await F.getDoc(pref)).data())
      } catch (e) { $('.err').textContent = e.message === 'taken' ? 'That name is taken. Try another.' : nice(e); o.querySelector('.acc-card').classList.remove('busy') }
    }
    $('.go').onclick = go; $('.nm').onkeydown = e => { if (e.key === 'Enter') go() }; $('.nm').focus()
  })
}

export async function initAccount(cfg) {
  const [{ initializeApp }, a, f] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')])
  A = a; F = f
  const app = initializeApp(cfg); auth = A.getAuth(app); db = F.getFirestore(app)
  USER = await new Promise(r => { const off = A.onAuthStateChanged(auth, u => { off(); r(u) }) })
  if (!USER) USER = await loginScreen()
  const p = await F.getDoc(F.doc(db, 'profiles', USER.uid))
  PROFILE = p.exists() ? p.data() : await pickName()
  return { uid: USER.uid, profile: PROFILE }
}
export const me = () => ({ uid: USER && USER.uid, profile: PROFILE })
export async function loadSave() { const d = await F.getDoc(F.doc(db, 'users', USER.uid)); return d.exists() ? JSON.parse(d.data().data) : null }
export async function storeSave(S) {
  const ref = F.doc(db, 'users', USER.uid)
  const revision = S.playerGrantRevision || 0
  const data = { data: JSON.stringify(S), savedAt: S.savedAt || Date.now() }
  if (!window.AUT_CONFIG?.playerGrantsEnabled) { await F.setDoc(ref, data); return }
  data.playerGrantRevision = revision
  await F.runTransaction(db, async tx => {
    const existing = await tx.get(ref)
    if ((existing.data()?.playerGrantRevision || 0) > revision) {
      const error = new Error('This save predates a player grant.')
      error.code = 'stale-player-grant'
      throw error
    }
    tx.set(ref, data)
  })
}
export async function canSendPlayerGrants() {
  if (!USER || PROFILE?.nameLower !== 'aspext') return false
  const owner = await F.getDoc(F.doc(db, 'usernames', 'aspext'))
  return owner.data()?.uid === USER.uid
}

export async function sendPlayerGrant(recipient, reward) {
  if (!validGrant(reward) || !await canSendPlayerGrants()) throw new Error('Invalid or unauthorized grant.')
  await F.addDoc(F.collection(db, 'playerGrants'), {
    ...reward, to: recipient, from: USER.uid, pending: true, createdAt: F.serverTimestamp()
  })
}

export async function claimPlayerGrants(initial, apply) {
  const queue = F.query(F.collection(db, 'playerGrants'), F.where('to', '==', USER.uid),
    F.where('pending', '==', true))
  let current = initial
  for (const pending of (await F.getDocs(queue)).docs) {
    const next = await F.runTransaction(db, async tx => {
      const grant = (await tx.get(pending.ref)).data()
      if (!grant?.pending || grant.to !== USER.uid || !validGrant(grant)) return null
      const owner = await tx.get(F.doc(db, 'usernames', 'aspext'))
      if (owner.data()?.uid !== grant.from) return null
      const ref = F.doc(db, 'users', USER.uid)
      const record = await tx.get(ref)
      const cloud = record.exists() ? JSON.parse(record.data().data) : null
      const latest = cloud && ((cloud.playerGrantRevision || 0) > (current.playerGrantRevision || 0) ||
        (cloud.savedAt || 0) >= (current.savedAt || 0)) ? cloud : current
      const updated = structuredClone(latest)
      if (!apply(updated, grant)) return null
      updated.savedAt = Math.max(Date.now(), (latest.savedAt || 0) + 1)
      updated.playerGrantRevision = (record.data()?.playerGrantRevision || 0) + 1
      tx.set(ref, { data: JSON.stringify(updated), savedAt: updated.savedAt, playerGrantRevision: updated.playerGrantRevision })
      tx.update(pending.ref, { pending: false })
      return updated
    })
    if (next) current = next
  }
  return current
}

export async function claimCoinGrant(localSave) {
  const name = PROFILE?.nameLower
  if (name !== 'soapy' && name !== 'antiminx') return null
  const username = F.doc(db, 'usernames', name)
  const save = F.doc(db, 'users', USER.uid)
  const grants = [name + '-coins-20261125']
  if (name === 'antiminx') grants.push('antiminx-coins-20261125-second')
  return F.runTransaction(db, async tx => {
    const owner = await tx.get(username)
    if (owner.data()?.uid !== USER.uid) return null
    const record = await tx.get(save)
    const cloud = record.exists() ? JSON.parse(record.data().data) : null
    if (grants.every(grant => cloud?.profile?.gifts?.[grant])) {
      if (grants.every(grant => localSave.profile.gifts?.[grant])) return null
      return cloud
    }
    const current = cloud && (cloud.savedAt || 0) >= (localSave.savedAt || 0) ? cloud : localSave
    const next = structuredClone(current)
    next.profile.gifts ||= {}
    for (const grant of grants) {
      if (next.profile.gifts[grant]) continue
      if (cloud?.profile?.gifts?.[grant] || localSave.profile.gifts?.[grant]) {
        next.profile.gifts[grant] = 1
        continue
      }
      next.profile.gifts[grant] = 1
      next.profile.coins += 500000
      next.notices ||= []
      next.notices.push({ text: 'You received 500,000 coins.', kind: 'ok', t: Date.now() })
      if (next.notices.length > 30) next.notices.shift()
    }
    next.savedAt = Math.max(Date.now(), (current.savedAt || 0) + 1)
    tx.set(save, { data: JSON.stringify(next), savedAt: next.savedAt })
    return next
  })
}
let pubT = 0
export async function publish(sum, force) {
  if (!force && Date.now() - pubT < 20000) return; pubT = Date.now()
  Object.assign(PROFILE, sum, { updatedAt: Date.now() })
  try { await F.setDoc(F.doc(db, 'profiles', USER.uid), { ...sum, updatedAt: Date.now() }, { merge: true }) } catch { }
}
export async function leaderboard(field = 'level') { const q = F.query(F.collection(db, 'profiles'), F.orderBy(field, 'desc'), F.limit(50)); return (await F.getDocs(q)).docs.map(d => ({ uid: d.id, ...d.data() })) }
export async function profile(uid) { const d = await F.getDoc(F.doc(db, 'profiles', uid)); return d.exists() ? { ...d.data(), uid } : null }
export async function findByName(name) { const d = await F.getDoc(F.doc(db, 'usernames', name.trim().toLowerCase())); return d.exists() ? profile(d.data().uid) : null }
export async function addFriend(uid) { if (uid === USER.uid) return; await F.updateDoc(F.doc(db, 'profiles', USER.uid), { friends: F.arrayUnion(uid) }); PROFILE.friends = [...new Set([...(PROFILE.friends || []), uid])] }
export async function removeFriend(uid) { await F.updateDoc(F.doc(db, 'profiles', USER.uid), { friends: F.arrayRemove(uid) }); PROFILE.friends = (PROFILE.friends || []).filter(x => x !== uid) }
export async function friends() { return (await Promise.all((PROFILE.friends || []).map(profile))).filter(Boolean) }
export async function signOut() { await A.signOut(auth); location.reload() }

// ---- trades between friends (collection 'trades') ----
export async function tradeCreate(t) { const r = await F.addDoc(F.collection(db, 'trades'), { ...t, from: USER.uid, fromName: PROFILE.name, status: 'open', at: Date.now() }); return r.id }
export async function tradesIn() { const q = F.query(F.collection(db, 'trades'), F.where('to', '==', USER.uid)); return (await F.getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() })) }
export async function tradesOut() { const q = F.query(F.collection(db, 'trades'), F.where('from', '==', USER.uid)); return (await F.getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() })) }
export async function tradeSet(id, status) { await F.updateDoc(F.doc(db, 'trades', id), { status, upd: Date.now() }) }

// ---- raid weekends: each player's total damage lives at raids/{id}/players/{uid}; the boss HP is the sum ----
export async function raidPost(rid, total) { if (!USER) return; await F.setDoc(F.doc(db, 'raids', rid, 'players', USER.uid), { name: (PROFILE && PROFILE.name) || 'Player', dmg: Math.round(total), at: Date.now() }, { merge: true }) }
export async function raidStatus(rid) {
  const col = F.collection(db, 'raids', rid, 'players')
  let sum = 0; try { const agg = await F.getAggregateFromServer(col, { t: F.sum('dmg') }); sum = agg.data().t || 0 } catch { }
  let top = []; try { top = (await F.getDocs(F.query(col, F.orderBy('dmg', 'desc'), F.limit(10)))).docs.map(d => ({ uid: d.id, ...d.data() })) } catch { }
  return { sum, top }
}

// ---------------- LIVE PVP ----------------
const clean = o => JSON.parse(JSON.stringify(o))
export async function pvpCreate(data) {
  const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
  await F.setDoc(F.doc(db, 'matches', code), clean({ ...data, host: USER.uid, hostName: (PROFILE && PROFILE.name) || 'Player', status: 'open', at: Date.now(), seed: Math.floor(Math.random() * 2147483647) }))
  return code
}
export async function pvpJoin(code, data) {
  code = String(code || '').trim().toUpperCase(); const ref = F.doc(db, 'matches', code), d = await F.getDoc(ref)
  if (!d.exists()) throw new Error('No match with that code.'); const m = d.data()
  if (m.host === USER.uid) throw new Error('That is your own match. Send the code to a mate.')
  if (m.status !== 'open') throw new Error('That match has already started or finished.')
  const add = clean({ ...data, guest: USER.uid, guestName: (PROFILE && PROFILE.name) || 'Player', status: 'live' }); await F.updateDoc(ref, add)
  return { code, ...m, ...add }
}
export function pvpWatch(code, cb) { return F.onSnapshot(F.doc(db, 'matches', code), d => cb(d.exists() ? d.data() : null)) }
export function pvpMoves(code, cb) { return F.onSnapshot(F.query(F.collection(db, 'matches', code, 'moves'), F.orderBy('seq')), s => s.docChanges().forEach(c => { if (c.type === 'added') cb(c.doc.data()) })) }
export async function pvpSend(code, role, n, a) { await F.setDoc(F.doc(db, 'matches', code, 'moves', role + String(n).padStart(5, '0')), { seq: Date.now() * 2 + (role === 'h' ? 0 : 1), n, by: USER.uid, a, at: Date.now() }) }
export async function pvpFinish(code, winner) { try { await F.updateDoc(F.doc(db, 'matches', code), { status: 'done', winner, end: Date.now() }) } catch { } }
export async function pvpCancel(code) { try { await F.updateDoc(F.doc(db, 'matches', code), { status: 'cancelled' }) } catch { } }
