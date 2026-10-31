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
  function renderCompare() {
    const box = $('compare-list');
    box.replaceChildren();
    const packageId = $('compare-package').value;
    const entries = state.proposals.filter(p => p.packageId === packageId);
    if (!entries.length) box.append(node('p', '该工作包还没有提案。', 'muted'));
    entries.forEach(p => {
      const card = node('article', undefined, 'entry');
      card.append(node('h3', state.agencies.find(a => a.id === p.agencyId)?.name || '未知机构'));
      line(card, '方法', p.approach);
      line(card, '周期', p.timeline);
      line(card, '报价', p.quote);
      box.append(card);
    });
    proposalOptions();
    const decision = state.decisions[packageId];
    $('decision-current').textContent = decision && entries.some(p => p.id === decision.proposalId)
      ? '已记录的人工选择：' + (state.agencies.find(a => a.id === entries.find(p => p.id === decision.proposalId).agencyId)?.name || '未知机构') + '；理由：' + decision.reason + '。可重新选择。'
      : '尚未记录人工选择。系统不自动评分、排序或授予合同。';
  }
  function render() {
    $('project-name').textContent = state.project.name;
    $('project-brief').textContent = state.project.brief;
    $('package-list').replaceChildren();
    state.packages.forEach(p => {
      const entry = node('article', undefined, 'entry');
      entry.append(node('h3', p.title));
      line(entry, '验收标准', p.criteria);
      $('package-list').append(entry);
    });
    $('agency-list').replaceChildren();
    state.agencies.forEach(a => {
      const entry = node('li', a.name + ' · 仅为本地模拟邀请，未发送通知');
      $('agency-list').append(entry);
    });
    options($('agency-select'), state.agencies, '机构');
    options($('proposal-package'), state.packages, '工作包');
    options($('compare-package'), state.packages, '工作包');
    const allowed = view() === 'buyer';
    document.querySelectorAll('[data-buyer]').forEach(form => form.querySelectorAll('input,textarea,select,button').forEach(control => { control.disabled = !allowed; }));
    document.querySelectorAll('[data-agency]').forEach(form => form.querySelectorAll('input,textarea,select,button').forEach(control => { control.disabled = allowed; }));
    $('decision-proposal').disabled = !allowed;
    $('agency-select').disabled = allowed;
    $('compare-package').disabled = false;
    $('view-hint').textContent = allowed ? '采购方可编辑需求、模拟邀请并记录决定。切换视角不代表真实授权。' : '机构视角可提交本地模拟提案；不代表受邀机构已登录或确认。';
    renderCompare();
  }
  $('view').addEventListener('change', render);
  $('compare-package').addEventListener('change', renderCompare);
  $('project-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly()) return;
    const data = new FormData(event.currentTarget);
    const name = tidy(data.get('name'), 80), brief = tidy(data.get('brief'), 600);
    if (!name || !brief) return;
    state.project = { name, brief };
    event.currentTarget.reset();
    persist();
  });
  $('package-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly()) return;
    const data = new FormData(event.currentTarget);
    const title = tidy(data.get('title'), 80), criteria = tidy(data.get('criteria'), 400);
    if (!title || !criteria) return;
    state.packages.push({ id: newId(), title, criteria });
    event.currentTarget.reset();
    persist();
  });
  $('invite-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly()) return;
    const name = tidy(new FormData(event.currentTarget).get('agency'), 80);
    if (!name) return;
    state.agencies.push({ id: newId(), name });
    event.currentTarget.reset();
    persist();
  });
  $('proposal-form').addEventListener('submit', event => {
    event.preventDefault();
    if (view() !== 'agency') return;
    const data = new FormData(event.currentTarget);
    const agencyId = $('agency-select').value;
    const packageId = tidy(data.get('packageId'), 120);
    const approach = tidy(data.get('approach'), 500), timeline = tidy(data.get('timeline'), 120), quote = tidy(data.get('quote'), 120);
    if (!state.agencies.some(a => a.id === agencyId) || !state.packages.some(p => p.id === packageId) || !approach || !timeline || !quote) { note('先选有效的机构和工作包，并填写完整提案。'); return; }
    state.proposals.push({ id: newId(), agencyId, packageId, approach, timeline, quote });
    event.currentTarget.reset();
    persist();
  });
  $('decision-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!buyerOnly()) return;
    const packageId = $('compare-package').value, proposalId = $('decision-proposal').value;
    const reason = tidy(new FormData(event.currentTarget).get('reason'), 400);
    if (!state.proposals.some(p => p.packageId === packageId && p.id === proposalId) || !reason) { note('请选择该工作包的提案并说明理由。'); return; }
    state.decisions[packageId] = { proposalId, reason };
    event.currentTarget.reset();
    persist();
  });
  $('reset-demo').addEventListener('click', () => {
    if (!buyerOnly() || !confirm('清除本浏览器的采购演示记录并恢复虚构示例？')) return;
    state = example();
    persist();
  });
  render();
})();