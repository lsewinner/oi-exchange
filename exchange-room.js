/* OI EXCHANGE: fictional procurement simulation; browser storage only. */
(() => {
  'use strict';
  const key = 'oi-exchange-procurement-demo-v2';
  const orgs = [{ id: 'atlas', name: 'Atlas Sourcing' }, { id: 'meridian', name: 'Meridian Research' }, { id: 'north', name: 'North Logistics' }];
  const empty = () => ({ requirement: '', packages: [], invitations: [], proposals: [], decisions: {}, events: [] });
  const example = () => ({
    requirement: 'Fictional community-space research procurement. Compare scoped proposals; no real tender exists.',
    packages: [{ id: 'p1', title: 'Stakeholder interviews', criterion: 'Interview plan and anonymised findings summary.' }, { id: 'p2', title: 'Feasibility options', criterion: 'Options comparison with assumptions and risks.' }],
    invitations: ['atlas', 'meridian'],
    proposals: [
      { id: 'r1', packageId: 'p1', orgId: 'atlas', approach: 'Remote interviews and thematic synthesis (fictional).', price: 2400, evidence: 'Assumes eight interviews; buyer reviews interview plan.', conditions: 'Recruitment and translation excluded.' },
      { id: 'r2', packageId: 'p1', orgId: 'meridian', approach: 'Workshop and observations (fictional).', price: 3100, evidence: 'Assumes one workshop and two site visits.', conditions: 'Travel costs excluded.' }
    ],
    decisions: {}, events: [{ action: 'Loaded fictional example', at: new Date().toISOString() }]
  });
  const $ = id => document.getElementById(id);
  const tidy = (value, max) => String(value ?? '').trim().slice(0, max);
  const newId = () => 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  const orgName = id => orgs.find(o => o.id === id)?.name || 'Unknown organisation';
  const pkgName = id => state.packages.find(p => p.id === id)?.title || 'Unknown package';
  const actor = () => $('actor').value;
  let state = empty();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved.requirement === 'string' && Array.isArray(saved.packages) && Array.isArray(saved.invitations) && Array.isArray(saved.proposals) && saved.decisions && !Array.isArray(saved.decisions) && typeof saved.decisions === 'object' && Array.isArray(saved.events)) state = saved;
  } catch (_) { /* Storage may be unavailable. */ }
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = String(text);
    if (className) el.className = className;
    return el;
  }
  function line(parent, title, value) {
    const p = node('p');
    p.append(node('strong', title + ': '), document.createTextNode(String(value ?? '—')));
    parent.append(p);
  }
  function options(select, entries, placeholder) {
    const before = select.value;
    select.replaceChildren();
    const first = node('option', placeholder); first.value = ''; select.append(first);
    entries.forEach(({ id, label }) => { const o = node('option', label); o.value = id; select.append(o); });
    if (entries.some(entry => entry.id === before)) select.value = before;
  }
  function note(text) { $('message').textContent = text; }
  function eventLog(action) { state.events.push({ action, at: new Date().toISOString() }); }
  function persist(message) {
    try { localStorage.setItem(key, JSON.stringify(state)); render(); note(message + ' Saved only in this browser.'); }
    catch (_) { render(); note(message + ' Browser storage unavailable; refresh may erase changes.'); }
  }
  function buyerOnly() {
    if (actor() === 'buyer') return true;
    note('Switch to the simulated buyer role first.');
    return false;
  }
  function setControls(form, enabled) {
    form.querySelectorAll('input,textarea,select,button').forEach(control => { control.disabled = !enabled; });
  }
  function render() {
    const buyer = actor() === 'buyer';
    const invited = state.invitations.includes(actor());
    const ready = !!state.requirement.trim();
    const packages = state.packages.filter(p => p && typeof p.id === 'string' && typeof p.title === 'string');
    const proposals = state.proposals.filter(p => p && packages.some(pkg => pkg.id === p.packageId) && orgs.some(o => o.id === p.orgId));
    const packBox = $('packages');
    packBox.replaceChildren(node('p', ready ? 'Current requirement: ' + state.requirement : 'No requirement set. Set a fictional requirement first.', 'muted'));
    packages.forEach(p => {
      const card = node('article', undefined, 'item');
      card.append(node('h3', p.title)); line(card, 'Acceptance criterion', p.criterion);
      packBox.append(card);
    });
    options($('invite-org'), orgs.filter(o => !state.invitations.includes(o.id)).map(o => ({ id: o.id, label: o.name })), 'Choose an organisation');
    const inviteBox = $('invites'); inviteBox.replaceChildren();
    if (!state.invitations.length) inviteBox.append(node('p', 'No simulated invitations yet.', 'muted'));
    state.invitations.forEach(id => inviteBox.append(node('p', orgName(id) + ' · invitation recorded locally; nothing was sent.')));
    options($('proposal-package'), packages.map(p => ({ id: p.id, label: p.title })), 'Choose a work package');
    const compare = $('comparison'); compare.replaceChildren();
    if (!packages.length) compare.append(node('p', 'Add a work package to compare proposals.', 'muted'));
    packages.forEach(pkg => {
      const block = node('div', undefined, 'item'); block.append(node('h3', pkg.title));
      line(block, 'Acceptance criterion', pkg.criterion);
      const entries = proposals.filter(p => p.packageId === pkg.id);
      if (!entries.length) block.append(node('p', 'No proposals recorded for this package.', 'muted'));
      entries.forEach(p => {
        const detail = node('details', undefined, 'item');
        detail.append(node('summary', orgName(p.orgId) + ' · GBP ' + Number(p.price).toFixed(2)));
        line(detail, 'Approach', p.approach); line(detail, 'Basis / evidence', p.evidence);
        line(detail, 'Conditions / exclusions', p.conditions);
        block.append(detail);
      });
      const selected = state.decisions[pkg.id];
      const picked = entries.find(p => p.id === selected?.proposalId);
      block.append(node('p', picked ? 'Simulated buyer choice: ' + orgName(picked.orgId) + ' · Reason: ' + selected.reason : 'No simulated selection. No automatic ranking or contract award.', 'small'));
      compare.append(block);
    });
    options($('decision-proposal'), proposals.map(p => ({ id: p.id, label: pkgName(p.packageId) + ' · ' + orgName(p.orgId) + ' · GBP ' + Number(p.price).toFixed(2) })), 'Choose a proposal');
    setControls($('project-form'), buyer);
    setControls($('package-form'), buyer && ready);
    setControls($('invite-form'), buyer && ready && !!packages.length && state.invitations.length < orgs.length);
    setControls($('proposal-form'), !buyer && ready && invited && !!packages.length);
    setControls($('decision-form'), buyer && !!proposals.length);
    $('example').disabled = !buyer; $('reset').disabled = !buyer;
    $('authority').textContent = buyer
      ? 'Simulated buyer: can set the requirement, add packages, record invitations and select a proposal. Nothing is sent or binding.'
      : orgName(actor()) + (invited ? ': invited locally; may record a proposal for a work package.' : ': not invited; proposal submission is unavailable.');
    const events = $('events'); events.replaceChildren();
    if (!state.events.length) events.append(node('li', 'No local actions recorded yet.'));
    state.events.slice(-30).reverse().forEach(e => {
      const date = new Date(e.at);
      events.append(node('li', (Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString()) + ' · ' + e.action));
    });
  }
  $('actor').addEventListener('change', () => { render(); note('Demo role changed; this is not identity verification.'); });
  $('project-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly()) return;
    const requirement = tidy(new FormData(event.currentTarget).get('requirement'), 500);
    if (!requirement) { note('Enter a fictional requirement first.'); return; }
    if (state.requirement === requirement) { note('This requirement is already set.'); return; }
    if (state.requirement && (state.packages.length || state.invitations.length || state.proposals.length) &&
        !confirm('Changing the requirement clears existing packages, invitations, proposals and selections. Continue?')) return;
    state = empty();
    state.requirement = requirement;
    eventLog('Set demo project requirement');
    event.currentTarget.reset();
    persist('Requirement recorded.');
  });
  $('package-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly() || !state.requirement.trim()) return;
    const data = new FormData(event.currentTarget);
    const title = tidy(data.get('title'), 90), criterion = tidy(data.get('criterion'), 250);
    if (!title || !criterion) { note('Enter a package title and acceptance criterion.'); return; }
    state.packages.push({ id: newId(), title, criterion });
    eventLog('Added work package: ' + title);
    event.currentTarget.reset();
    persist('Work package recorded.');
  });
  $('invite-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly() || !state.requirement.trim() || !state.packages.length) return;
    const orgId = tidy(new FormData(event.currentTarget).get('organisation'), 30);
    if (!orgs.some(o => o.id === orgId) || state.invitations.includes(orgId)) { note('Choose an organisation that has not yet been invited.'); return; }
    state.invitations.push(orgId);
    eventLog('Recorded local invitation: ' + orgName(orgId));
    event.currentTarget.reset();
    persist('Demo invitation recorded; nothing was sent.');
  });
  $('proposal-form').addEventListener('submit', event => {
    event.preventDefault();
    const orgId = actor();
    if (orgId === 'buyer' || !state.invitations.includes(orgId) || !state.requirement.trim()) { note('Select an invited fictional supplier role first.'); return; }
    const data = new FormData(event.currentTarget);
    const packageId = tidy(data.get('package'), 120);
    const approach = tidy(data.get('approach'), 500), evidence = tidy(data.get('evidence'), 350);
    const conditions = tidy(data.get('conditions'), 350), price = Number(data.get('price'));
    if (!state.packages.some(p => p.id === packageId) || !approach || !evidence || !conditions ||
        data.get('price') === '' || !Number.isFinite(price) || price < 0 || price > 100000000 || Math.round(price * 100) !== price * 100) {
      note('Select a valid package and enter the approach, GBP quote, basis and conditions.'); return;
    }
    if (state.proposals.some(p => p.packageId === packageId && p.orgId === orgId)) {
      note('This supplier already has a proposal for this package in the demo.'); return;
    }
    state.proposals.push({ id: newId(), packageId, orgId, approach, price, evidence, conditions });
    eventLog('Recorded proposal: ' + orgName(orgId) + ' / ' + pkgName(packageId));
    event.currentTarget.reset();
    persist('Fictional proposal recorded.');
  });
  $('decision-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly()) return;
    const data = new FormData(event.currentTarget);
    const proposalId = tidy(data.get('proposal'), 120), reason = tidy(data.get('reason'), 350);
    const proposal = state.proposals.find(p => p.id === proposalId && state.packages.some(pkg => pkg.id === p.packageId));
    if (!proposal || !reason || data.get('ack') !== 'on') { note('Choose a valid proposal, explain the choice and confirm the demo disclaimer.'); return; }
    if (!confirm('Record this simulated buyer selection? No organisation will be notified or bound.')) return;
    state.decisions[proposal.packageId] = { proposalId, reason };
    eventLog('Simulated buyer selection: ' + orgName(proposal.orgId) + ' / ' + pkgName(proposal.packageId));
    event.currentTarget.reset();
    persist('Simulated selection recorded; no contract or transaction was created.');
  });
  $('example').addEventListener('click', () => {
    if (!buyerOnly() || (state.requirement && !confirm('Replace this local demo with the fictional example?'))) return;
    state = example();
    persist('Fictional example loaded.');
  });
  $('reset').addEventListener('click', () => {
    if (!buyerOnly() || !confirm('Clear all local procurement demo data in this browser?')) return;
    state = empty();
    persist('Local procurement demo reset.');
  });
  render();
})();