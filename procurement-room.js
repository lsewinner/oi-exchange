/* OI EXCHANGE: fictional procurement workflow. No network, identity or real approvals. */
(() => {
  'use strict';
  const key = 'oi-exchange-room-v3';
  const orgs = [{id:'atlas',name:'Atlas Sourcing'}, {id:'meridian',name:'Meridian Research'}, {id:'north',name:'North Logistics'}];
  const empty = () => ({requirement:'',packages:[],invitations:[],proposals:[],decisions:{},events:[]});
  const example = () => ({
    requirement:'Fictional community-space research procurement. Compare scoped proposals; no real tender exists.',
    packages:[{id:'p1',title:'Stakeholder interviews',criterion:'Interview plan and anonymised findings summary.'},{id:'p2',title:'Feasibility options',criterion:'Options comparison with assumptions and risks.'}],
    invitations:['atlas','meridian'],
    proposals:[{id:'r1',packageId:'p1',orgId:'atlas',approach:'Remote interviews and thematic synthesis (fictional).',price:2400,evidence:'Assumes eight interviews; buyer reviews interview plan.',conditions:'Recruitment and translation excluded.'},{id:'r2',packageId:'p1',orgId:'meridian',approach:'Workshop and observations (fictional).',price:3100,evidence:'Assumes one workshop and two site visits.',conditions:'Travel costs excluded.'}],
    decisions:{},events:[{action:'Loaded fictional example',at:new Date().toISOString()}]
  });
  const $ = id => document.getElementById(id);
  const clean = (value,max) => String(value ?? '').trim().slice(0,max);
  const uid = () => 'local-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
  const name = id => orgs.find(o => o.id === id)?.name || 'Unknown organisation';
  const money = n => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
  const el = (tag,text,klass) => {const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(klass)n.className=klass;return n;};
  const line = (parent,label,value) => {const p=el('p');p.append(el('strong',label+': '),document.createTextNode(String(value)));parent.append(p);};
  const role = () => $('actor').value;
  let state=empty();
  try {const saved=JSON.parse(localStorage.getItem(key));if(saved && typeof saved.requirement==='string' && Array.isArray(saved.packages) && Array.isArray(saved.invitations) && Array.isArray(saved.proposals) && saved.decisions && typeof saved.decisions==='object' && !Array.isArray(saved.decisions) && Array.isArray(saved.events))state=saved;} catch (_) { /* Private browsing may block storage. */ }
  $('project-form').elements.requirement.value=state.requirement;
  const note = text => {$('message').textContent=text;};
  const log = action => {state.events.push({action,at:new Date().toISOString()});state.events=state.events.slice(-60);};
  function save(message) {
    try {localStorage.setItem(key,JSON.stringify(state));render();note(message+' Saved in this browser only.');}
    catch (_) {render();note(message+' Browser storage unavailable; refresh may erase these changes.');}
  }
  function buyer() {if(role()==='buyer')return true;note('Switch to the simulated buyer role first.');return false;}
  function options(select,entries,placeholder) {
    const previous=select.value;select.replaceChildren();const first=el('option',placeholder);first.value='';select.append(first);
    entries.forEach(({id,label})=>{const opt=el('option',label);opt.value=id;select.append(opt);});
    if(entries.some(item=>item.id===previous))select.value=previous;
  }
  function enable(form,allowed) {form.querySelectorAll('input,textarea,select,button').forEach(input=>{input.disabled=!allowed;});}
  function renderPackages() {
    const box=$('packages');box.replaceChildren();
    if(!state.packages.length)box.append(el('p','No work packages yet.','muted'));
    state.packages.forEach(p=>{const card=el('article',undefined,'item');card.append(el('h3',p.title));line(card,'Acceptance criterion',p.criterion);box.append(card);});
  }
  function renderComparison() {
    const box=$('comparison');box.replaceChildren();
    if(!state.packages.length)box.append(el('p','Add a work package to compare proposals.','muted'));
    state.packages.forEach(pkg=>{
      const group=el('div',undefined,'item');group.append(el('h3',pkg.title));line(group,'Buyer acceptance criterion',pkg.criterion);
      const proposals=state.proposals.filter(p=>p.packageId===pkg.id);
      if(!proposals.length){group.append(el('p','No proposals for this package yet.','muted'));box.append(group);return;}
      const table=el('table');const caption=el('caption','Proposals for '+pkg.title);caption.className='small';table.append(caption);
      const head=el('thead'),hrow=el('tr');['Organisation','Approach','Quote (demo)','Basis & conditions','Buyer selection'].forEach(t=>hrow.append(el('th',t)));head.append(hrow);table.append(head);
      const body=el('tbody');proposals.forEach(p=>{
        const row=el('tr');row.append(el('td',name(p.orgId)),el('td',p.approach),el('td',money(p.price)));
        const more=el('td'),details=el('details');details.append(el('summary','Inspect stated basis & conditions'));line(details,'Basis / evidence',p.evidence);line(details,'Conditions / exclusions',p.conditions);more.append(details);row.append(more);
        row.append(el('td',state.decisions[pkg.id]?.proposalId===p.id?'Selected in local demo':'Not selected'));body.append(row);
      });table.append(body);group.append(table);const choice=state.decisions[pkg.id];
      if(choice){line(group,'Recorded buyer reason',choice.reason);group.append(el('p','This local selection is not a contract award or acceptance.','small muted'));}
      box.append(group);
    });
  }
  function render() {
    renderPackages();
    const inviteBox=$('invites');inviteBox.replaceChildren();
    if(!state.invitations.length)inviteBox.append(el('p','No fictional invitations recorded.','muted'));
    state.invitations.forEach(id=>inviteBox.append(el('p',name(id)+' · local invitation only; no message sent','small')));
    options($('invite-org'),orgs.filter(o=>!state.invitations.includes(o.id)).map(o=>({id:o.id,label:o.name})),'Choose an organisation');
    options($('proposal-package'),state.packages.map(p=>({id:p.id,label:p.title})),'Choose a work package');
    options($('decision-proposal'),state.proposals.map(p=>({id:p.id,label:(state.packages.find(pkg=>pkg.id===p.packageId)?.title||'Unknown package')+' · '+name(p.orgId)+' · '+money(p.price)})),'Choose a proposal');
    renderComparison();
    const isBuyer=role()==='buyer',invited=state.invitations.includes(role());
    enable($('project-form'),isBuyer);enable($('package-form'),isBuyer && !!state.requirement);enable($('invite-form'),isBuyer && !!state.requirement && !!state.packages.length && state.invitations.length<orgs.length);
    enable($('proposal-form'),!isBuyer && invited && !!state.packages.length);enable($('decision-form'),isBuyer && !!state.proposals.length);
    const authority=$('authority');authority.replaceChildren();
    line(authority,'Viewing as',isBuyer?'Buyer (simulated)':name(role())+' (fictional)');
    line(authority,'Invitation',isBuyer?'Buyer may record local invitations':invited?'Recorded locally; proposal entry enabled':'Not recorded; proposal entry disabled');
    line(authority,'Decision',isBuyer?'Buyer may record a local selection':'Only the simulated buyer may record a selection');
    const events=$('events');events.replaceChildren();
    [...state.events].reverse().forEach(entry=>{const when=new Date(entry.at);events.append(el('li',(Number.isNaN(when.getTime())?'Unknown time':when.toLocaleString())+' · '+entry.action));});
    if(!state.events.length)events.append(el('li','No local actions yet.'));
  }
  $('actor').addEventListener('change',render);
  $('project-form').addEventListener('submit',event=>{
    event.preventDefault();if(!buyer())return;
    const requirement=clean(new FormData(event.currentTarget).get('requirement'),500);
    if(!requirement){note('Enter a fictional requirement.');return;}
    if(requirement!==state.requirement && (state.packages.length||state.invitations.length||state.proposals.length) && !confirm('Changing the requirement will clear all work packages, invitations, proposals and selections in this local demo. Continue?'))return;
    if(requirement!==state.requirement){state=empty();state.requirement=requirement;log('Set demo requirement; reset dependent records');}
    save('Requirement recorded.');
  });
  $('package-form').addEventListener('submit',event=>{
    event.preventDefault();if(!buyer()||!state.requirement)return;
    const data=new FormData(event.currentTarget),title=clean(data.get('title'),90),criterion=clean(data.get('criterion'),250);
    if(!title||!criterion||state.packages.length>=12){note('Enter a title and criterion (up to 12 packages).');return;}
    state.packages.push({id:uid(),title,criterion});log('Added work package: '+title);event.currentTarget.reset();save('Work package added.');
  });
  $('invite-form').addEventListener('submit',event=>{
    event.preventDefault();if(!buyer()||!state.requirement||!state.packages.length)return;
    const orgId=clean(new FormData(event.currentTarget).get('organisation'),30);
    if(!orgs.some(o=>o.id===orgId)||state.invitations.includes(orgId)){note('Select an organisation not already invited.');return;}
    state.invitations.push(orgId);log('Recorded fictional invitation: '+name(orgId));save('Invitation recorded locally; nothing was sent.');
  });
  $('proposal-form').addEventListener('submit',event=>{
    event.preventDefault();const orgId=role();if(!state.invitations.includes(orgId)){note('This fictional supplier has no recorded invitation.');return;}
    const data=new FormData(event.currentTarget),packageId=clean(data.get('package'),100),approach=clean(data.get('approach'),500),evidence=clean(data.get('evidence'),350),conditions=clean(data.get('conditions'),350),price=Number(data.get('price'));
    if(!state.packages.some(p=>p.id===packageId)||!approach||!evidence||!conditions||!Number.isFinite(price)||price<0||price>100000000||state.proposals.length>=100){note('Choose a package and complete all proposal fields (maximum 100 proposals).');return;}
    if(state.proposals.some(p=>p.packageId===packageId&&p.orgId===orgId)){note('This supplier already submitted for this package in the local demo.');return;}
    state.proposals.push({id:uid(),packageId,orgId,approach,evidence,conditions,price:Math.round(price*100)/100});
    if(state.decisions[packageId]){delete state.decisions[packageId];log('Cleared prior local selection after a new proposal');}
    log('Recorded proposal: '+name(orgId)+' for '+(state.packages.find(p=>p.id===packageId)?.title||'package'));event.currentTarget.reset();save('Proposal recorded locally.');
  });
  $('decision-form').addEventListener('submit',event=>{
    event.preventDefault();if(!buyer())return;
    const data=new FormData(event.currentTarget),proposal=state.proposals.find(p=>p.id===data.get('proposal')),reason=clean(data.get('reason'),350);
    if(!proposal||!reason||data.get('ack')!=='on'){note('Choose a proposal, explain your reason and acknowledge the demo boundary.');return;}
    if(!confirm('Record this simulated buyer selection? No contract, message or payment will be created.'))return;
    state.decisions[proposal.packageId]={proposalId:proposal.id,reason};log('Buyer recorded local selection for '+(state.packages.find(p=>p.id===proposal.packageId)?.title||'package')+': '+name(proposal.orgId));
    event.currentTarget.reset();save('Simulated selection recorded; no offer accepted or contract awarded.');
  });
  $('example').addEventListener('click',()=>{if(!buyer()||!confirm('Replace current local demo data with the fictional example?'))return;state=example();$('project-form').elements.requirement.value=state.requirement;save('Fictional example loaded.');});
  $('reset').addEventListener('click',()=>{if(!confirm('Clear all local Exchange Room demo data?'))return;state=empty();$('project-form').elements.requirement.value='';save('Local demo reset.');});
  render();
})();