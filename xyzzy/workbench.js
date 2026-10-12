(() => {
  'use strict';
  const OWNER = 'udeudeude';
  const STORE_LINKS = 'ude-workbench-links-v1';
  const STORE_LOCAL = 'ude-workbench-projects-v1';
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
    'Moire-Lab':'moire-lab'
  };
  const grid = document.getElementById('projects');
  const count = document.getElementById('result-count');
  const message = document.getElementById('message');
  const search = document.getElementById('search');
  let view = 'all';
  let items = [];
  let links = load(STORE_LINKS, {});
  let localProjects = load(STORE_LOCAL, []);

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

  async function initialize() {
    const [curated, repos] = await Promise.all([publishedProjects(), publicRepositories()]);
    const mapped = new Map(curated.map(p => [p.id, p]));
    const extras = [];
    for (const repo of repos) {
      // Public GitHub metadata only; a private repo is never in the published snapshot.
      const target = knownRepoProject[repo.name];
      const repoUrl = httpsLink(repo.url) || 'https://github.com/' + OWNER + '/' + encodeURIComponent(repo.name);
      if (target && mapped.has(target)) {
        const p = mapped.get(target);
        p.repos.push(repoUrl);
        p.links.push({label:'GitHub: ' + repo.name, url:repoUrl});
      } else {
        extras.push({
          id:'repo-' + slug(repo.name), name:repo.name.replace(/-/g, ' '),
          description:repo.description || 'GitHub project; open the repository for README, source and activity.',
          status:'Additional public repository', group:'repos', rank:999, categories:'',
          visual:null, publicUrl:'', repos:[repoUrl],
          links:[{label:'Repository',url:repoUrl},
            {label:'Issues',url:repoUrl+'/issues'},
            {label:'Pull requests',url:repoUrl+'/pulls'},
            {label:'Actions',url:repoUrl+'/actions'},
            ...(repo.homepage && httpsLink(repo.homepage) ? [{label:'Live / homepage',url:repo.homepage}] : [])]
        });
      }
    }
    items = [...curated.sort((a,b)=>a.rank-b.rank),
      ...extras.sort((a,b)=>a.name.localeCompare(b.name))];
    refresh();
  }

  function currentProjects() {
    const locals = Array.isArray(localProjects) ? localProjects.map(normalizeLocalProject).filter(Boolean) : [];
    return [...items, ...locals];
  }

  function refresh() {
    const term = search.value.trim().toLowerCase();
    const all = currentProjects();
    grid.replaceChildren();
    const shown = all.filter(p => {
      if (view !== 'all' && p.group !== view) return false;
      return !term || [p.name,p.description,p.status,p.categories,...(p.repos||[])].join(' ').toLowerCase().includes(term);
    });
    shown.forEach(project => grid.append(renderCard(project)));
    count.textContent = shown.length + ' projects shown · ' + all.length + ' total (' +
      all.filter(p=>p.group==='curated').length + ' curated, ' +
      all.filter(p=>p.group==='repos').length + ' extra public repositories, ' +
      all.filter(p=>p.group==='local').length + ' locally added)';
  }

  function renderCard(project) {
    const card = node('article','tile');
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
    body.append(node('div','kind', project.status),node('h2','',project.name),
      node('p','summary',project.description));
    const mainLinks = node('div','links');
    if (project.publicUrl) addLink(mainLinks,'Public tile',project.publicUrl);
    const unique = new Set();
    for (const source of project.links||[]) {
      const uri=source.url;
      if (!uri || unique.has(uri)) continue;
      unique.add(uri);
      addLink(mainLinks,source.label,uri);
    }
    body.append(mainLinks);

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
    body.append(saved);

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
    details.append(form);body.append(details);
    if(project.group==='local'){
      const remove=node('button','', 'Remove this local project');
      remove.type='button';remove.style.marginTop='12px';
      remove.addEventListener('click',()=>{
        if(!confirm('Remove '+project.name+' from this browser?'))return;
        localProjects=localProjects.filter(p=>p.id!==project.id);
        delete links[project.id];save();refresh();
      });
      body.append(remove);
    }
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
    const payload={version:1,exportedAt:new Date().toISOString(),links,projects:localProjects};
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
      if(payload.version!==1 || !payload.links || !Array.isArray(payload.projects))throw new Error('Not a valid workbench backup');
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
      links=clean;localProjects=projects;save();refresh();
      message.textContent='Private backup imported into this browser.';
    } catch(error){
      message.textContent='Could not import: '+error.message;
    } finally {fileInput.value='';}
  });
  document.getElementById('clear-data').addEventListener('click',()=>{
    if(!confirm('Permanently clear locally saved project links and additions on this browser?'))return;
    links={};localProjects=[];save();refresh();
    message.textContent='Local additions cleared.';
  });
  initialize().catch(error=>{message.textContent='Could not load the project index: '+error.message;});
})();
