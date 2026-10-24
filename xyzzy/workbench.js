(() => {
  'use strict';
  const OWNER = 'udeudeude';
  const STORE_LINKS = 'ude-workbench-links-v1';
  const STORE_LOCAL = 'ude-workbench-projects-v1';
  const STORE_TODOS = 'ude-workbench-todos-v1';
  const STORE_DONE = 'ude-workbench-done-v1';
  const validKinds = new Set(['ChatGPT', 'Work', 'Codex', 'Other']);
  const knownRepoProject = {
    'LightHouse':'lighthouse',
    'Anaglyph-and-Friends':'anaglyph-friends',
    'Living-Patterns-Podcast':'living-patterns',
    '1AM-wisdom':'wisdom-watch',
    'Sorting-Algorithms-with-Playing-Cards':'sorting-cards',
    'TouchBarpalooza':'touchbarpalooza',
    'sc-web':'supercollider',
    'AI-on-Kindle':'ai-kindle',
    'Print-as-PocketMod-for-Mac':'print-pocketmod',
    'Biofeedback-Play':'biofeedback-play',
    'TV-b-goner':'tv-b-goner',
    'Escape-Pod-Cast':'escape-pod-cast',
    'GoLocal-on-a-Map-Asheville':'asheville-golocal-maps',
    'PnP-o-matic':'pnp-o-matic',
    'Moire-Lab':'moire-lab',
    'Temporarily-Leave-the-Universe':'temporarily-leave-the-universe',
    'Th-die-s-Cast':'thdies-cast',
    'Play-by-Ear-GameCast':'repo-play-by-ear-gamecast'
  };
  const grid = document.getElementById('projects');
  const count = document.getElementById('result-count');
  const message = document.getElementById('message');
  const search = document.getElementById('search');
  let view = 'all';
  let items = [];
  let links = load(STORE_LINKS, {});
  let localProjects = load(STORE_LOCAL, []);
  let customTodos = load(STORE_TODOS, {});
  let completed = load(STORE_DONE, {});
  let projectMetadata = {};

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  }
  function save() {
    try {
      localStorage.setItem(STORE_LINKS, JSON.stringify(links));
      localStorage.setItem(STORE_LOCAL, JSON.stringify(localProjects));
      localStorage.setItem(STORE_TODOS, JSON.stringify(customTodos));
      localStorage.setItem(STORE_DONE, JSON.stringify(completed));
      return true;
    } catch {
      message.textContent = 'Local storage is unavailable. Export your changes before leaving.';
      return false;
    }
  }
  function httpsLink(text) {
    try {
      const u = new URL(text);
      return u.protocol === 'https:' ? u.href : null;
    } catch { return null; }
  }
  function slug(text) { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function node(name, cls, text) {
    const n = document.createElement(name);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function link(label, url) {
    const a = node('a', '', label);
    // The public portfolio can contain calendar subscribe schemes and relative URLs.
    try {
      const resolved = new URL(url, location.origin + '/');
      if (!['https:', 'http:', 'webcal:'].includes(resolved.protocol)) return null;
      a.href = resolved.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      return a;
    } catch { return null; }
  }
  function addLink(container, label, url) {
    const a = link(label, url);
    if (a) container.append(a);
  }

  async function publishedProjects() {
    const response = await fetch('/', {cache:'no-cache'});
    if (!response.ok) throw new Error('Unable to read the public portfolio');
    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    return [...html.querySelectorAll('#project-grid .project')].map(card => ({
      id: card.dataset.key,
      name: card.querySelector('.caption h2')?.textContent?.trim() || card.dataset.key,
      status: card.querySelector('.caption .status')?.textContent?.trim() || 'Public project',
      description: card.querySelector('.expand > p')?.textContent?.trim() || '',
      group: 'curated',
      rank: Number(card.dataset.rank) || 999,
      categories: card.dataset.categories || '',
      // Clone only authored project artwork, never entire interactive cards.
      visual: card.querySelector('.visual')?.cloneNode(true) || null,
      publicUrl: location.origin + '/#project-' + card.dataset.key,
      links: [...card.querySelectorAll('.expand .links a')].map(a => ({
        label: a.textContent.trim(), url:a.getAttribute('href')
      })),
      repos:[]
    }));
  }

  async function workshopProjects() {
    const response = await fetch('/workshop/', {cache:'no-cache'});
    if (!response.ok) return [];
    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    return [...html.querySelectorAll('.projects .project')].map((card, rank) => {
      const name = card.querySelector('h2')?.textContent?.trim() || card.id;
      const visual = card.querySelector('.banner img');
      let picture = null;
      if (visual) {
        picture = node('div', 'visual');
        const img = node('img');
        img.src = visual.src;
        img.alt = visual.alt;
        img.loading = 'lazy';
        picture.append(img);
      }
      return {
        id: card.id === 'key-scratch' ? 'repo-key-scratch' : 'repo-' + card.id,
        name, description:card.querySelector('.description')?.textContent?.trim() || '',
        status:card.querySelector('.status')?.textContent?.trim() || 'Workshop',
        group:'workshop',rank:rank+1,categories:'',visual:picture,
        publicUrl:location.origin+'/workshop/#'+card.id,
        links:[...card.querySelectorAll('.actions a')].map(a=>({label:a.textContent.trim(),url:a.href})),
        repos:[]
      };
    });
  }

  async function publicRepositories() {
    const snapshotResponse = await fetch('/xyzzy/repositories.json', {cache:'no-cache'});
    const snapshot = snapshotResponse.ok ? (await snapshotResponse.json()).repositories : [];
    try {
      const response = await fetch('https://api.github.com/users/' + OWNER + '/repos?per_page=100&type=owner&sort=updated', {
        headers: {'Accept':'application/vnd.github+json'},
        signal:AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error('Public GitHub API unavailable');
      const fetched = await response.json();
      if (!Array.isArray(fetched)) throw new Error('Invalid repository data');
      return fetched.filter(repo => !repo.private && !repo.archived).map(repo => ({
        name:repo.name,
        url:repo.html_url,
        description:repo.description || '',
        homepage:repo.homepage || ''
      }));
    } catch {
      message.textContent = 'Using saved public repository list. GitHub live listing was unavailable.';
      return snapshot;
    }
  }

  function normalizeLocalProject(p) {
    if (!p || typeof p.name !== 'string' || typeof p.id !== 'string') return null;
    return {
      id:p.id.slice(0,130), name:p.name.slice(0,120), description:String(p.description||'').slice(0,300),
      status:'Local addition', group:'local', rank:999, categories:'', visual:null,
      links: p.url && httpsLink(p.url) ? [{label:'Project / repository',url:httpsLink(p.url)}] : [],
      repos:[], publicUrl:''
    };
  }

  async function loadMetadata() {
    try {
      const response = await fetch('/xyzzy/project-metadata.json', {cache:'no-cache'});
      if (!response.ok) throw new Error('No metadata file');
      const data = await response.json();
      if (data.version !== 1 || !data.projects || typeof data.projects !== 'object') return {};
      return data.projects;
    } catch {
      message.textContent = 'Curated link and backlog metadata could not be loaded.';
      return {};
    }
  }

  function enriched(project) {
    const meta = projectMetadata[project.id] || {};
    if (typeof meta.name === 'string' && meta.name) project.name = meta.name;
    if (project.group !== 'curated') {
      if (typeof meta.status === 'string' && meta.status) project.status = meta.status;
      if (typeof meta.description === 'string' && meta.description) project.description = meta.description;
      if (!project.visual && typeof meta.image === 'string' &&
          /^https:\/\/raw\.githubusercontent\.com\/udeudeude\//.test(meta.image)) {
        const visual = node('div','visual');
        const picture = node('img');
        picture.src = meta.image;
        picture.alt = meta.imageAlt || ('Image from ' + project.name + ' repository');
        picture.loading = 'lazy';
        visual.append(picture);
        project.visual = visual;
      }
    }
    project.tasks = Array.isArray(meta.tasks) ? meta.tasks.filter(x=>typeof x==='string').slice(0,30) : [];
    const ordinary = project.links||[];
    const explicitlyCurated = Array.isArray(meta.links)?meta.links:[];
    const clean = new Map();
    for(const [group, items] of [[false,ordinary],[true,explicitlyCurated]]) {
      for(const candidate of items) {
        if (!candidate || !candidate.url || !candidate.label) continue;
        let url;
        try { url = new URL(candidate.url, location.origin + '/').href; } catch { continue; }
        if (!['https:', 'http:', 'webcal:'].includes(new URL(url).protocol)) continue;
        if (!clean.has(url) || group) clean.set(url, {label:candidate.label, url});
      }
    }
    project.links = [...clean.values()];
    return project;
  }

  // Keep personal links and completed checklists when a project moves from
  // "additional repository" into the curated exhibition.
  function migratePromotedProject() {
    const oldId='repo-temporarily-leave-the-universe';
    const newId='temporarily-leave-the-universe';
    let changed=false;
    for(const store of [links,customTodos]) {
      if(Array.isArray(store[oldId])){
        const previous=Array.isArray(store[newId])?store[newId]:[];
        const existingIds=new Set(previous.map(x=>x.id));
        store[newId]=[...previous,...store[oldId].filter(x=>!existingIds.has(x.id))];
        delete store[oldId];
        changed=true;
      }
    }
    if(Array.isArray(completed[oldId])){
      completed[newId]=[...new Set([...(Array.isArray(completed[newId])?completed[newId]:[]),...completed[oldId]])];
      delete completed[oldId];
      changed=true;
    }
    if(changed) save();
  }

  function migrateProjectId(oldId,newId) {
    let changed=false;
    for (const store of [links,customTodos,completed]) {
      if (Array.isArray(store[oldId])) {
        store[newId]=[...(Array.isArray(store[newId])?store[newId]:[]),...store[oldId]];
        delete store[oldId];
        changed=true;
      }
    }
    if (changed) save();
  }

  async function initialize() {
    const [curated, repos, metadata, workshop] = await Promise.all([publishedProjects(), publicRepositories(), loadMetadata(), workshopProjects()]);
    projectMetadata = metadata;
    migratePromotedProject();
    migrateProjectId('repo-th-die-s-cast','thdies-cast');
    const mapped = new Map([...curated, ...workshop].map(p => [p.id, p]));
    const extras = [];
    for (const repo of repos) {
      // Public GitHub metadata only; a private repo is never in the published snapshot.
      const target = ({
        'Key-Scratch':'repo-key-scratch',
        'Maze-Seedling-Rejuvenation':'repo-maze-seedling-rejuvenation',
        'Sphero-Laboratory':'repo-sphero-laboratory',
        'MPK249-Universal-Map':'repo-mpk249-universal-map',
        'Escape-Team-Activate':'repo-escape-team-activate',
        'Pocket-Operations-Manual':'repo-pocket-operations-manual',
        'Play-by-Ear-GameCast':'repo-play-by-ear-gamecast'
      })[repo.name] || knownRepoProject[repo.name];
      const repoUrl = httpsLink(repo.url) || 'https://github.com/' + OWNER + '/' + encodeURIComponent(repo.name);
      if (target && mapped.has(target)) {
        const p = mapped.get(target);
        p.repos.push(repoUrl);
        p.links.push({label:'GitHub: ' + repo.name, url:repoUrl});
        p.links.push({label:'Issues / backlog',url:repoUrl+'/issues'});
        p.links.push({label:'Releases / downloads',url:repoUrl+'/releases'});
      } else {
        // A temporarily uncurated project keeps its original ID, so saved
        // ChatGPT/Codex links follow it between public and workbench-only views.
        const moire = repo.name === 'Moire-Lab';
        let visual = null;
        if (moire) {
          visual = node('div','visual');
          const img = node('img');
          img.src = '/assets/screenshots/moire-lab.webp';
          img.alt = 'Actual moiré drawing from the optical workshop';
          visual.append(img);
        }
        extras.push({
          id:target || 'repo-' + slug(repo.name),
          name:moire ? 'Moiré Lab' : repo.name.replace(/-/g, ' '),
          description:moire
            ? 'True moiré, barrier-grid animation and printable SVG experiments. Currently kept out of the public portfolio while it is developed.'
            : (repo.description || 'GitHub project; open the repository for README, source and activity.'),
          status:moire ? 'Unpublished · optical experiments' : 'Additional public repository',
          group:'repos', rank:999, categories:moire?'visual print':'',
          visual, publicUrl:'', repos:[repoUrl],
          links:[...(moire ? [{label:'Open web workshop',url:'https://moire-lab.onrender.com/'}] : []),
            {label:'Repository',url:repoUrl},
            {label:'Issues',url:repoUrl+'/issues'},
            {label:'Pull requests',url:repoUrl+'/pulls'},
            {label:'Actions',url:repoUrl+'/actions'},
            {label:'Releases / downloads',url:repoUrl+'/releases'},
            ...(!moire && repo.homepage && httpsLink(repo.homepage) ? [{label:'Live / homepage',url:repo.homepage}] : [])]
        });
      }
    }
    items = [...curated.sort((a,b)=>a.rank-b.rank), ...workshop,
      ...extras.sort((a,b)=>a.name.localeCompare(b.name))].map(enriched);
    refresh();
  }

  function currentProjects() {
    const locals = Array.isArray(localProjects) ? localProjects.map(normalizeLocalProject).filter(Boolean) : [];
    return [...items, ...locals];
  }

  function refresh(focus = null) {
    const term = search.value.trim().toLowerCase();
    const all = currentProjects();
    const shown = all.filter(p => {
      if (view !== 'all' && p.group !== view) return false;
      const todoText = [...(p.tasks||[]),
        ...((customTodos[p.id]||[]).map(t=>t.text))].join(' ');
      return !term || [p.name,p.description,p.status,p.categories,todoText,
        ...(p.repos||[]),...(p.links||[]).map(l=>l.label)].join(' ').toLowerCase().includes(term);
    });
    const scrollY = window.scrollY;
    grid.replaceChildren();
    shown.forEach(project => grid.append(renderCard(project)));
    if (focus) {
      const card = [...grid.querySelectorAll('.tile')].find(el=>el.dataset.projectId===focus.id);
      const target = card?.querySelector(focus.selector);
      if (target) target.focus({preventScroll:true});
      window.scrollTo(0,scrollY);
    }
    count.textContent = shown.length + ' projects shown · ' + all.length + ' total (' +
      all.filter(p=>p.group==='curated').length + ' exhibition, ' +
      all.filter(p=>p.group==='workshop').length + ' workshop, ' +
      all.filter(p=>p.group==='repos').length + ' extra public repositories, ' +
      all.filter(p=>p.group==='local').length + ' locally added)';
  }

  function renderBacklog(project) {
    const section = node('section','backlog');
    const sourced = Array.isArray(project.tasks) ? project.tasks : [];
    const userTasks = Array.isArray(customTodos[project.id]) ? customTodos[project.id] : [];
    const done = new Set(Array.isArray(completed[project.id]) ? completed[project.id] : []);
    const total = sourced.length + userTasks.length;
    const open = sourced.filter((item,i)=>!done.has('source-'+i)).length +
      userTasks.filter(item=>!done.has(item.id)).length;
    section.append(node('h3','', 'Backlog / to-dos · ' + open + (total ? ' open of ' + total : ' recorded')));
    if (total) {
      const list = node('ul','backlog-items');
      const entries = [
        ...sourced.map((text,i)=>({id:'source-'+i,text,editable:false})),
        ...userTasks.map(item=>({...item,editable:true}))
      ];
      for(const item of entries) {
        const li=node('li');
        const label=node('label');
        const check=node('input');
        check.type='checkbox';
        check.checked=done.has(item.id);
        check.setAttribute('aria-label','Complete: '+item.text);
        check.addEventListener('change',()=>{
          if(check.checked) done.add(item.id);
          else done.delete(item.id);
          completed[project.id]=[...done];
          save();refresh({id:project.id,selector:'input[data-task-id="'+item.id+'"]'});
        });
        check.dataset.taskId=item.id;
        const wording=node('span',check.checked?'done':'',item.text);
        label.append(check,wording);
        li.append(label);
        if(item.editable){
          const remove=node('button','remove-task','×');
          remove.type='button';remove.title='Remove this locally saved task';
          remove.setAttribute('aria-label','Remove task: '+item.text);
          remove.addEventListener('click',()=>{
            customTodos[project.id]=(customTodos[project.id]||[]).filter(x=>x.id!==item.id);
            completed[project.id]=(completed[project.id]||[]).filter(x=>x!==item.id);
            save();refresh();
          });
          li.append(remove);
        }
        list.append(li);
      }
      section.append(list);
    } else {
      section.append(node('p','backlog-empty','No recorded to-dos yet. Add one below or open the project’s issue tracker.'));
    }
    const tools=node('div','backlog-tools');
    const form=node('form');
    const input=node('input');input.name='todo';input.type='text';
    input.required=true;input.maxLength=300;
    input.placeholder='Add a private to-do';
    input.setAttribute('aria-label','Add a to-do for '+project.name);
    const button=node('button','','Add');button.type='submit';
    form.append(input,button);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const text=input.value.trim();
      if(!text)return;
      if(!customTodos[project.id])customTodos[project.id]=[];
      customTodos[project.id].push({
        id:'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),
        text:text.slice(0,300)
      });
      save();message.textContent='To-do saved in this browser for '+project.name+'.';
      refresh({id:project.id,selector:'input[name="todo"]'});
    });
    tools.append(form);
    const repo = (project.repos||[]).find(href=>href.includes('github.com/'));
    if(repo){
      addLink(tools,'GitHub issues ↗',repo+'/issues');
    }
    section.append(tools);
    return section;
  }

  function renderCard(project) {
    const card = node('article','tile');
    card.dataset.projectId = project.id;
    if(project.visual){
      const visual = project.visual.cloneNode(true);
      for (const image of visual.querySelectorAll('img')) {
        const original = image.getAttribute('src');
        if (original) image.src = new URL(original, location.origin + '/').href;
        image.loading = 'lazy';
      }
      card.append(visual);
    } else card.append(node('div','visual fallback', '⌘'));
    const body = node('div','inside');
    const disclosure = node('button','tile-disclosure');
    disclosure.type='button';
    disclosure.setAttribute('aria-expanded','false');
    disclosure.setAttribute('aria-label','Expand '+project.name);
    disclosure.append(node('h2','',project.name),node('p','summary',project.description));
    const more = node('div','tile-more');
    more.hidden=true;
    disclosure.addEventListener('click',()=>{
      more.hidden=!more.hidden;
      disclosure.setAttribute('aria-expanded',String(!more.hidden));
      disclosure.setAttribute('aria-label',(more.hidden?'Expand ':'Collapse ')+project.name);
    });
    body.append(disclosure);
    const mainLinks = node('div','links');
    if (project.publicUrl) addLink(mainLinks,'Public tile',project.publicUrl);
    const unique = new Set();
    for (const source of project.links||[]) {
      const uri=source.url;
      if (!uri || unique.has(uri)) continue;
      unique.add(uri);
      addLink(mainLinks,source.label,uri);
    }
    more.append(node('div','kind',project.status));
    more.append(mainLinks);
    more.append(renderBacklog(project));

    const saved = node('div','');
    const ownLinks = Array.isArray(links[project.id]) ? links[project.id] : [];
    if(ownLinks.length){
      saved.append(node('div','kind','Your ChatGPT / Work / Codex links'));
      const list = node('ul','personal');
      ownLinks.forEach(entry => {
        const li=node('li');
        addLink(li,(entry.kind||'Other')+': '+entry.title,entry.url);
        const remove=node('button','', 'Remove');
        remove.type='button';remove.title='Remove this locally saved link';
        remove.addEventListener('click',()=>{
          links[project.id]=(links[project.id]||[]).filter(x=>x.id!==entry.id);
          save();refresh();
        });
        li.append(remove);list.append(li);
      });
      saved.append(list);
    } else saved.append(node('p','small','No personal chat or Codex links attached yet.'));
    more.append(saved);

    const details=node('details','');
    details.append(node('summary','', 'Attach a ChatGPT chat, Work or Codex link'));
    const form=node('form','edit-links');
    const fields=node('div','row');
    const kind=node('select');kind.name='kind';kind.setAttribute('aria-label','Link type');
    for(const val of ['ChatGPT','Work','Codex','Other']){
      const option=node('option','',val);option.value=val;kind.append(option);
    }
    const title=node('input');title.name='title';title.required=true;title.maxLength=120;
    title.placeholder='Link title';title.setAttribute('aria-label','Link title');
    fields.append(kind,title);form.append(fields);
    const url=node('input');url.type='url';url.name='url';url.required=true;
    url.placeholder='https://chatgpt.com/c/… or another direct URL';
    url.setAttribute('aria-label','Direct link URL');
    form.append(url);
    const submit=node('button','', 'Save privately in this browser');
    submit.type='submit';form.append(submit);
    form.addEventListener('submit', event=>{
      event.preventDefault();
      const href=httpsLink(url.value.trim());
      if(!href){message.textContent='Use a full https:// link.';return;}
      if(!links[project.id])links[project.id]=[];
      links[project.id].push({
        id:Date.now().toString(36)+Math.random().toString(36).slice(2),
        kind:validKinds.has(kind.value)?kind.value:'Other',
        title:title.value.trim().slice(0,120),url:href
      });
      save();message.textContent='Link saved on this device for '+project.name+'.';refresh();
    });
    details.append(form);more.append(details);
    if(project.group==='local'){
      const remove=node('button','', 'Remove this local project');
      remove.type='button';remove.style.marginTop='12px';
      remove.addEventListener('click',()=>{
        if(!confirm('Remove '+project.name+' from this browser?'))return;
        localProjects=localProjects.filter(p=>p.id!==project.id);
        delete links[project.id];
        delete customTodos[project.id];
        delete completed[project.id];
        save();refresh();
      });
      more.append(remove);
    }
    body.append(more);
    card.append(body);return card;
  }

  search.addEventListener('input', refresh);
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    view=button.dataset.view;
    for(const candidate of document.querySelectorAll('[data-view]')){
      candidate.setAttribute('aria-pressed',String(candidate===button));
    }
    refresh();
  }));
  document.getElementById('custom-form').addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const name=form.elements.name.value.trim();
    if(!name)return;
    const entered=form.elements.url.value.trim();
    const url=entered?httpsLink(entered):null;
    if(entered&&!url){message.textContent='Only full HTTPS project URLs can be added.';return;}
    localProjects.push({
      id:'local-'+Date.now().toString(36)+Math.random().toString(36).slice(2),
      name, url:url||'', description:form.elements.description.value.trim()
    });
    save();form.reset();view='all';
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='all')));
    message.textContent='Personal project added locally.';refresh();
  });

  document.getElementById('export').addEventListener('click',()=>{
    const payload={version:2,exportedAt:new Date().toISOString(),links,projects:localProjects,
      todos:customTodos,done:completed};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='ude-workbench-private-backup.json';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    message.textContent='Backup generated. It contains personal URLs: keep it private.';
  });
  const fileInput=document.getElementById('import-file');
  document.getElementById('import-trigger').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',async ()=>{
    const file=fileInput.files?.[0];if(!file)return;
    try{
      if(file.size>2000000)throw new Error('Backup is too large');
      const payload=JSON.parse(await file.text());
      if(![1,2].includes(payload.version) || !payload.links || !Array.isArray(payload.projects))
        throw new Error('Not a valid workbench backup');
      const clean={};
      for(const [key,entries] of Object.entries(payload.links)){
        if(key.length>140 || !Array.isArray(entries))continue;
        clean[key]=entries.slice(0,150).filter(x=>x&&typeof x.title==='string'&&httpsLink(x.url)).map(x=>({
          id:String(x.id||Date.now()).slice(0,100),
          kind:validKinds.has(x.kind)?x.kind:'Other',
          title:x.title.slice(0,120),url:httpsLink(x.url)
        }));
      }
      const projects=payload.projects.slice(0,200).map(x=>({
        id:String(x.id||'local-'+Date.now()).slice(0,130),
        name:String(x.name||'').slice(0,120),
        url:x.url && httpsLink(x.url) || '',
        description:String(x.description||'').slice(0,300)
      })).filter(x=>x.name);
      if(!confirm('Replace this browser’s personal links and additions with the imported backup?'))return;
      const importedTodos = {};
      const importedDone = {};
      if (payload.version === 2 && payload.todos && typeof payload.todos === 'object') {
        for(const [key,entries] of Object.entries(payload.todos)){
          if(key.length>140 || !Array.isArray(entries))continue;
          importedTodos[key]=entries.slice(0,100).filter(v=>v && typeof v.text==='string').map(v=>({
            id:String(v.id||'custom').slice(0,110),text:v.text.slice(0,300)
          }));
        }
      }
      if(payload.version===2 && payload.done && typeof payload.done==='object'){
        for(const [key,values] of Object.entries(payload.done)){
          if(key.length>140 || !Array.isArray(values))continue;
          importedDone[key]=values.filter(v=>typeof v==='string').slice(0,200).map(v=>v.slice(0,110));
        }
      }
      // Older v1 backups contain only links/projects. Never clear newer
      // local to-do data merely because that older format lacks it.
      links=clean;localProjects=projects;
      if (payload.version===2) {
        customTodos=importedTodos;completed=importedDone;
      }
      save();refresh();
      message.textContent=payload.version===1
        ? 'Older backup imported. Existing local to-dos were preserved.'
        : 'Private backup imported into this browser.';
    } catch(error){
      message.textContent='Could not import: '+error.message;
    } finally {fileInput.value='';}
  });
  document.getElementById('clear-data').addEventListener('click',()=>{
    if(!confirm('Permanently clear locally saved project links and additions on this browser?'))return;
    links={};localProjects=[];customTodos={};completed={};save();refresh();
    message.textContent='Local additions cleared.';
  });
  initialize().catch(error=>{message.textContent='Could not load the project index: '+error.message;});
})();
