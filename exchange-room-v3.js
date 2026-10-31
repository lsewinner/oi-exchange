/* Fictional browser-only procurement walkthrough. No identity, messaging or contract. */
(() => {
  'use strict';
  const key = 'oi-exchange-procurement-demo-v3';
  const orgs = [
    { id: 'atlas', name: 'Atlas Sourcing' },
    { id: 'meridian', name: 'Meridian Research' },
    { id: 'north', name: 'North Logistics' }
  ];
  const fresh = () => ({ requirement: '', packages: [], invitations: [], proposals: [], decisions: {}, events: [] });
  const sample = () => ({
    requirement: 'Fictional community-space research procurement. No real tender exists.',
    packages: [
      { id: 'p1', title: 'Stakeholder interviews', criterion: 'Interview plan and anonymised findings summary.' },
      { id: 'p2', title: 'Feasibility options', criterion: 'Options comparison with assumptions and risks.' }
    ],
    invitations: ['atlas', 'meridian'],
    proposals: [
      { id: 'r1', packageId: 'p1', orgId: 'atlas', approach: 'Remote interviews and thematic synthesis (fictional).', price: 2400, evidence: 'Assumes eight interviews; buyer reviews interview plan.', conditions: 'Recruitment and translation excluded.' },
      { id: 'r2', packageId: 'p1', orgId: 'meridian', approach: 'Workshop and observations (fictional).', price: 3100, evidence: 'Assumes one workshop and two site visits.', conditions: 'Travel costs excluded.' }
    ],
    decisions: {}, events: [{ action: 'Loaded fictional example', at: new Date().toISOString() }]
  });
  const $ = id => document.getElementById(id);
  const trim = (value, max) => String(value ?? '').trim().slice(0, max);
  const uid = () => 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  const name = id => orgs.find(o => o.id === id)?.name || 'Unknown fictional organisation';
  const elem = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = String(text);
    if (cls) e.className = cls;
    return e;
  };
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved.requirement === 'string' && Array.isArray(saved.packages) &&
        Array.isArray(saved.invitations) && Array.isArray(saved.proposals) &&
        saved.decisions && typeof saved.decisions === 'object' && !Array.isArray(saved.decisions) &&
        Array.isArray(saved.events)) state = saved;
  } catch (_) { /* Private browsing may block storage. */ }
  const actor = () => $('actor').value;
  const alertUser = message => { $('message').textContent = message; };
  const log = action => state.events.push({ action, at: new Date().toISOString() });
  function save(message) {
    try { localStorage.setItem(key, JSON.stringify(state)); render(); alertUser(message + ' Saved in this browser only.'); }
    catch (_) { render(); alertUser(message + ' Browser storage unavailable; changes may disappear on refresh.'); }
  }
  function buyer() {
    if (actor() === 'buyer') return true;
    alertUser('Switch to the simulated buyer role first. This is not authentication.');
    return false;
  }
  function controls(form, enabled) {
    form.querySelectorAll('input,select,textarea,button').forEach(el => { el.disabled = !enabled; });
  }
  function choices(select, items, placeholder) {
    const selected = select.value;
    select.replaceChildren();
    const first = elem('option', placeholder); first.value = ''; select.append(first);
    items.forEach(item => { const opt = elem('option', item.label); opt.value = item.id; select.append(opt); });
    if (items.some(item => item.id === selected)) select.value = selected;
  }
  function field(parent, label, value) {
    const p = elem('p');
    p.append(elem('strong', label + ': '), document.createTextNode(String(value ?? '—')));
    parent.append(p);
  }
  function render() {
    const isBuyer = actor() === 'buyer';
    const invited = state.invitations.includes(actor());
    controls($('project-form'), isBuyer);
    controls($('package-form'), isBuyer && !!state.requirement);
    controls($('invite-form'), isBuyer && !!state.requirement);
    controls($('proposal-form'), !isBuyer && invited && state.packages.length > 0);
    controls($('decision-form'), isBuyer && state.proposals.length > 0);
    $('example').disabled = !isBuyer;
    $('reset').disabled = !isBuyer;
    $('authority').textContent = isBuyer
      ? 'Simulated buyer: may edit the requirement, invite fictional organisations and record selections. No real buyer authority is verified.'
      : invited
        ? name(actor()) + ' is locally marked invited. This role can propose but cannot select. No invitation was sent.'
        : name(actor()) + ' is not locally invited. Switch to the buyer role to record a fictional invitation.';
    const packages = $('packages'); packages.replaceChildren();
    if (!state.packages.length) packages.append(elem('p', 'No work packages yet.', 'muted'));
    state.packages.forEach(p => {
      const article = elem('article', undefined, 'item');
      article.append(elem('strong', p.title)); field(article, 'Acceptance criterion', p.criterion);
      packages.append(article);
    });
    choices($('invite-org'), orgs.filter(o => !state.invitations.includes(o.id)).map(o => ({ id: o.id, label: o.name })), 'Select fictional organisation');
    choices($('proposal-package'), state.packages.map(p => ({ id: p.id, label: p.title })), 'Select work package');
    const invites = $('invites'); invites.replaceChildren();
    invites.append(elem('p', state.invitations.length
      ? 'Locally invited (no notification sent): ' + state.invitations.map(name).join(', ')
      : 'No fictional organisations invited yet.', 'small'));
    const comparison = $('comparison'); comparison.replaceChildren();
    if (!state.packages.length) comparison.append(elem('p', 'Create a work package to compare proposals.', 'muted'));
    state.packages.forEach(p => {
      const section = elem('section');
      section.append(elem('h3', p.title)); field(section, 'Acceptance criterion', p.criterion);
      const proposals = state.proposals.filter(r => r.packageId === p.id);
      if (!proposals.length) { section.append(elem('p', 'No proposals for this package.', 'muted')); comparison.append(section); return; }
      const table = elem('table'); const head = elem('thead'); const header = elem('tr');
      ['Organisation', 'Approach', 'Quote (GBP)', 'Basis / evidence', 'Conditions / exclusions', 'Buyer decision'].forEach(text => header.append(elem('th', text)));
      head.append(header); table.append(head);
      const body = elem('tbody');
      proposals.forEach(r => {
        const row = elem('tr');
        [name(r.orgId), r.approach, Number(r.price).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }), r.evidence, r.conditions,
          state.decisions[p.id]?.proposalId === r.id ? 'Selected in local demo' : 'Not selected'].forEach(value => row.append(elem('td', value)));
        body.append(row);
      });
      table.append(body); section.append(table);
      const decision = state.decisions[p.id];
      if (decision) field(section, 'Recorded buyer reason (local only)', decision.reason);
      comparison.append(section);
    });
    choices($('decision-proposal'), state.proposals.filter(r => state.packages.some(p => p.id === r.packageId))
      .map(r => ({ id: r.id, label: (state.packages.find(p => p.id === r.packageId)?.title || 'Package') + ' / ' + name(r.orgId) + ' / ' + Number(r.price).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) })), 'Select proposal');
    const events = $('events'); events.replaceChildren();
    if (!state.events.length) events.append(elem('li', 'No local actions recorded.'));
    state.events.slice().reverse().forEach(entry => events.append(elem('li', entry.action + ' · ' + new Date(entry.at).toLocaleString())));
  }
  $('actor').addEventListener('change', render);
  $('project-form').addEventListener('submit', e => {
    e.preventDefault(); if (!buyer()) return;
    const requirement = trim(new FormData(e.currentTarget).get('requirement'), 500);
    if (!requirement) return alertUser('Enter a fictional requirement.');
    if (state.requirement && state.requirement !== requirement && !confirm('Replacing the requirement clears packages, invitations, proposals and decisions. Continue?')) return;
    if (state.requirement !== requirement) {
      state = fresh(); state.requirement = requirement; log('Simulated buyer set fictional project requirement');
    }
    e.currentTarget.elements.requirement.value = requirement;
    save('Demo requirement recorded.');
  });
  $('package-form').addEventListener('submit', e => {
    e.preventDefault(); if (!buyer() || !state.requirement) return;
    const data = new FormData(e.currentTarget);
    const title = trim(data.get('title'), 90), criterion = trim(data.get('criterion'), 250);
    if (!title || !criterion) return alertUser('Enter a package title and acceptance criterion.');
    state.packages.push({ id: uid(), title, criterion }); log('Simulated buyer added package: ' + title);
    e.currentTarget.reset(); save('Work package added.');
  });
  $('invite-form').addEventListener('submit', e => {
    e.preventDefault(); if (!buyer() || !state.requirement) return;
    const id = new FormData(e.currentTarget).get('organisation');
    if (!orgs.some(o => o.id === id) || state.invitations.includes(id)) return alertUser('Choose an uninvited fictional organisation.');
    state.invitations.push(id); log('Simulated buyer recorded local invitation for ' + name(id));
    save('Fictional invitation recorded; no message was sent.');
  });
  $('proposal-form').addEventListener('submit', e => {
    e.preventDefault(); const id = actor();
    if (id === 'buyer' || !state.invitations.includes(id)) return alertUser('Only a locally invited fictional supplier role can propose.');
    const data = new FormData(e.currentTarget);
    const packageId = data.get('package'), approach = trim(data.get('approach'), 500);
    const evidence = trim(data.get('evidence'), 350), conditions = trim(data.get('conditions'), 350);
    const rawPrice = data.get('price'), price = Number(rawPrice);
    if (!state.packages.some(p => p.id === packageId) || !approach || !evidence || !conditions || rawPrice === '' ||
        !Number.isFinite(price) || price < 0 || price > 100000000) return alertUser('Complete a valid package, approach, GBP quote, evidence and conditions.');
    state.proposals.push({ id: uid(), packageId, orgId: id, approach, price, evidence, conditions });
    log(name(id) + ' entered fictional proposal for ' + (state.packages.find(p => p.id === packageId)?.title || 'package'));
    e.currentTarget.reset(); save('Local proposal recorded; nothing was sent.');
  });
  $('decision-form').addEventListener('submit', e => {
    e.preventDefault(); if (!buyer()) return;
    const data = new FormData(e.currentTarget); const proposalId = data.get('proposal');
    const proposal = state.proposals.find(p => p.id === proposalId);
    const reason = trim(data.get('reason'), 350);
    if (!proposal || !state.packages.some(p => p.id === proposal.packageId) || !reason || !data.get('ack')) return alertUser('Choose a valid proposal, give a reason and acknowledge the demo limitation.');
    if (!confirm('Record this simulated buyer selection for this work package? No contract or message will be created.')) return;
    state.decisions[proposal.packageId] = { proposalId, reason };
    log('Simulated buyer selected ' + name(proposal.orgId) + ' for ' + (state.packages.find(p => p.id === proposal.packageId)?.title || 'package'));
    e.currentTarget.reset(); save('Buyer selection recorded locally; not a binding acceptance.');
  });
  $('example').addEventListener('click', () => {
    if (!buyer() || !confirm('Replace all local procurement demo data with the fictional example?')) return;
    state = sample(); $('project-form').elements.requirement.value = state.requirement;
    save('Fictional example loaded.');
  });
  $('reset').addEventListener('click', () => {
    if (!buyer() || !confirm('Erase all local procurement demo data in this browser?')) return;
    state = fresh(); $('project-form').reset(); save('Local demo reset.');
  });
  $('project-form').elements.requirement.value = state.requirement;
  render();
})();