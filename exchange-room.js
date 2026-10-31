/* OI EXCHANGE procurement concept. Local browser simulation only; no network calls. */
(() => {
  'use strict';
  const key = 'oi-exchange-procurement-demo-v1';
  const example = () => ({
    project: { name: '虚构案例 · 社区空间研究', brief: '比较社区空间调研方案。所有机构、报价与决定均为虚构演示。' },
    packages: [{ id: 'p1', title: '访谈与需求梳理', criteria: '交付访谈提纲、匿名化发现摘要。' }, { id: 'p2', title: '可行性方案', criteria: '交付方案比较和风险说明。' }],
    agencies: [{ id: 'a1', name: '示例机构 A' }, { id: 'a2', name: '示例机构 B' }],
    proposals: [{ id: 'r1', packageId: 'p1', agencyId: 'a1', approach: '线上访谈与主题归纳（示例）', timeline: '4 周（示例）', quote: '虚构报价 A' }, { id: 'r2', packageId: 'p1', agencyId: 'a2', approach: '现场观察与小组讨论（示例）', timeline: '6 周（示例）', quote: '虚构报价 B' }],
    decisions: {}
  });
  const $ = id => document.getElementById(id);
  const tidy = (value, max) => String(value || '').trim().slice(0, max);
  const newId = () => 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    state = saved && saved.project && Array.isArray(saved.packages) && Array.isArray(saved.agencies) && Array.isArray(saved.proposals) && saved.decisions && typeof saved.decisions === 'object' ? saved : example();
  } catch (_) { state = example(); }
  function node(tag, text, className) {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  }
  function line(parent, title, value) {
    const p = node('p');
    p.append(node('strong', title + '：'), document.createTextNode(value || '—'));
    parent.append(p);
  }
  function options(select, data, label) {
    const before = select.value;
    select.replaceChildren();
    if (!data.length) {
      const option = node('option', '暂无' + label);
      option.value = '';
      select.append(option);
    } else data.forEach(item => {
      const option = node('option', item.title || item.name || item.approach);
      option.value = item.id;
      select.append(option);
    });
    if (data.some(item => item.id === before)) select.value = before;
  }
  function note(text) { $('status').textContent = text; }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(state)); note('已保存到本浏览器；没有发送给任何机构。'); }
    catch (_) { note('浏览器无法保存数据；当前页面仍可演示，刷新后可能丢失。'); }
    render();
  }
  function view() { return $('view').value; }
  function buyerOnly() { if (view() !== 'buyer') { note('请先切换到采购方演示视角。'); return false; } return true; }
  function proposalOptions() {
    const entries = state.proposals.filter(p => p.packageId === $('compare-package').value).map(p => ({ id: p.id, title: (state.agencies.find(a => a.id === p.agencyId)?.name || '未知机构') + ' · ' + p.approach }));
    options($('decision-proposal'), entries, '提案');
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