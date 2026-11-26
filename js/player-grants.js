export function validGrant(grant) {
  const limit = { coins: 100000000, shards: 1000000, item: 1000, card: 100 }[grant.type]
  return !!limit && Number.isSafeInteger(grant.amount) && grant.amount > 0 && grant.amount <= limit &&
    typeof grant.key === 'string' && grant.key.length <= 200 &&
    (['item', 'card'].includes(grant.type) ? !!grant.key : grant.key === '')
}

export function playerGrantsPage(el, { account, h, cards, items }) {
  const heading = h('h2', '', 'Player Grants')
  const form = h('form', 'panel pad grant-form')
  form.style.cssText = 'display:grid;gap:12px;max-width:640px'
  const player = h('input', 'field')
  player.required = true
  player.maxLength = 16
  player.pattern = '[A-Za-z0-9_]{3,16}'
  const type = h('select', 'field')
  const asset = h('select', 'field')
  const count = h('input', 'field')
  count.type = 'number'
  count.required = true
  count.min = '1'
  count.step = '1'
  count.value = '1'
  const submit = h('button', 'btn gold', 'Send grant')
  const status = h('p', '', '')
  status.setAttribute('role', 'status')
  const label = (name, input) => {
    const node = h('label', '', name)
    node.style.cssText = 'display:grid;gap:5px'
    node.append(input)
    return node
  }
  const assetLabel = label('Item or card', asset)
  const option = (select, key, name) => {
    const node = h('option', '')
    node.textContent = name
    node.value = key
    select.append(node)
  }
  for (const [key, name] of [['coins', 'Coins'], ['shards', 'Shards'], ['item', 'Item'], ['card', 'Card']]) option(type, key, name)
  const choices = {
    item: Object.entries(items).map(([key, item]) => [key, item.name]),
    card: cards.map(c => [c.key, c.name + ' · ' + c.ver + ' · ' + c.ovr + ' OVR']).sort((a, b) => a[1].localeCompare(b[1]))
  }
  type.onchange = () => {
    const list = choices[type.value] || []
    assetLabel.hidden = asset.disabled = !list.length
    assetLabel.style.display = list.length ? 'grid' : 'none'
    asset.replaceChildren()
    for (const [key, name] of list) option(asset, key, name)
    count.max = { coins: 100000000, shards: 1000000, item: 1000, card: 100 }[type.value]
  }
  type.onchange()
  form.append(label('Player username', player), label('Reward type', type), assetLabel, label('Amount', count), submit, status)
  const history = h('section', 'qol-hero grant-history')
  const historyRows = h('div', 'grant-history-rows')
  const refresh = h('button', 'btn dark sm', 'REFRESH HISTORY')
  refresh.type = 'button'
  async function loadHistory() {
    refresh.disabled = true
    historyRows.replaceChildren(h('p', 'muted', 'Loading grants…'))
    try {
      const rows = await account.sentPlayerGrants()
      historyRows.replaceChildren()
      if (!rows.length) historyRows.append(h('p', 'muted', 'No grants sent yet.'))
      for (const grant of rows) {
        const row = h('div','grant-history-row')
        const who = h('b',''); who.textContent = grant.recipient
        const reward = h('span','')
        const asset = choices[grant.type]?.find(([key]) => key === grant.key)?.[1] || grant.type
        reward.textContent = grant.amount.toLocaleString() + ' × ' + asset
        row.append(who,reward,h('small',grant.pending ? 'queued' : 'claimed',grant.pending ? 'QUEUED' : 'CLAIMED'))
        historyRows.append(row)
      }
    } catch (error) {
      historyRows.replaceChildren(h('p', 'muted', error.code === 'permission-denied' ?
        'Grant history needs sender read access in Firestore.' : 'Could not load grant history.'))
    } finally { refresh.disabled = false }
  }
  refresh.onclick = loadHistory
  history.append(h('h3','','Grant History'),refresh,historyRows)
  form.onsubmit = async event => {
    event.preventDefault()
    const grant = { type: type.value, key: asset.disabled ? '' : asset.value, amount: Number(count.value) }
    if (!validGrant(grant)) { status.textContent = 'Enter a valid reward and amount.'; return }
    const reward = asset.disabled ? type.selectedOptions[0].textContent : asset.selectedOptions[0].textContent
    submit.disabled = true
    try {
      const recipient = await account.findByName(player.value)
      if (!recipient) { status.textContent = 'Player not found.'; return }
      if (!confirm('Send ' + grant.amount.toLocaleString() + ' × ' + reward + ' to ' + recipient.name + '?')) return
      await account.sendPlayerGrant(recipient.uid, grant)
      status.textContent = 'Queued for ' + recipient.name + '. They receive it the next time they load the game.'
      count.value = '1'
      loadHistory()
    } catch (error) {
      status.textContent = error.code === 'permission-denied' ? 'Grant access is unavailable.' : 'Grant could not be sent. ' + error.message
    } finally { submit.disabled = false }
  }
  el.append(heading, form, history)
  loadHistory()
}
