// Safety check before every push:  node tools/check.js
// 1) every JS file parses  2) JSON files are valid  3) card IDs are unique
// 4) every changed JS/CSS file had its ?v= cache tag bumped (otherwise phones keep the old cached copy)
const fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process')
const ROOT = path.join(__dirname, '..'); process.chdir(ROOT)
let bad = 0; const fail = m => { bad++; console.log('  ✖ ' + m) }

console.log('1. JS syntax')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autchk-'))
for (const f of ['config.js', 'sw.js', ...fs.readdirSync('js').filter(f => f.endsWith('.js')).map(f => 'js/' + f)]) {
  const t = path.join(tmp, f.replace(/\//g, '_') + '.mjs'); fs.copyFileSync(f, t)
  try { execSync(`node --check "${t}"`, { stdio: 'pipe' }) } catch (e) { fail(f + '\n' + String(e.stderr).split('\n').slice(0, 5).join('\n')) }
}

console.log('2. JSON files')
for (const f of fs.readdirSync('.').filter(f => f.endsWith('.json'))) { try { JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { fail(f + ': ' + e.message) } }

console.log('3. Card IDs')
const L = JSON.parse(fs.readFileSync('cards-list.json', 'utf8')), seen = {}
for (const c of L) { if (!c.id) fail('card without id: ' + c.name); else if (seen[c.id]) fail('duplicate id ' + c.id + ' (' + seen[c.id] + ' / ' + c.name + ')'); seen[c.id] = c.name }
console.log('   ' + L.length + ' cards')

console.log('3b. Same module imported with one tag everywhere')
{ const tags = {}
  for (const f of ['index.html', ...fs.readdirSync('js').filter(f => f.endsWith('.js')).map(f => 'js/' + f)])
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/([\w.-]+\.(?:js|css))\?v=([\w.-]+)/g)) (tags[m[1]] = tags[m[1]] || new Set()).add(m[2])
  for (const [mod, set] of Object.entries(tags)) if (set.size > 1) fail(mod + ' is imported with different ?v= tags (' + [...set].join(', ') + '): that loads two separate copies') }

console.log('4. Cache tags bumped for changed files')
let base = 'origin/main'
try { execSync('git fetch -q origin main', { stdio: 'pipe' }) } catch { }
const changed = execSync(`git diff --name-only ${base}`, { maxBuffer: 1 << 28 }).toString().split('\n').filter(f => /\.(js|css)$/.test(f) && !f.startsWith('tools/') && f !== 'sw.js' && f !== 'config.js')
const diff = execSync(`git diff ${base} -- "*.js" "*.css" "*.html"`, { maxBuffer: 1 << 28 }).toString().split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).join('\n')
for (const f of changed) {
  const name = path.basename(f).replace(/\./g, '\\.')
  if (!new RegExp(name + '\\?v=').test(diff)) fail(f + ' changed but no importer bumped "' + path.basename(f) + '?v=..." (also bump each file up the import chain to index.html)')
}
if (!changed.length) console.log('   no JS/CSS changes')

fs.rmSync(tmp, { recursive: true, force: true })
console.log(bad ? `\n✖ ${bad} problem(s). Do NOT push.` : '\n✔ All good, safe to push.')
process.exit(bad ? 1 : 0)
