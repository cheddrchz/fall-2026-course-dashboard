/* Separate mobile presentation; original data and persistence are shared. */
(() => {
  const root = document.createElement('section');
  root.id = 'mobilePlanner';
  root.setAttribute('aria-label', 'Course planner');
  document.body.append(root);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const today = () => iso(new Date());
  const dateFor = value => new Date(`${value}T12:00:00`);
  const keyFor = item => `checked-${item.date}-${item.course.code}-${item.title}`;
  const colors = [['#b9a7f5','#72549a'],['#88cbbb','#28735f'],['#e3ce8a','#846819'],['#e7b182','#9c5d24']];
  let focus = today();
  let mode = 'agenda';
  const visibleItems = () => all().filter(x => x.date >= today() && (selected === 'all' || x.course.code === selected) && localStorage.getItem(keyFor(x)) !== '1').sort((a,b) => a.date.localeCompare(b.date));
  function draw() {
    const list = visibleItems();
    const cursor = dateFor(focus);
    const start = new Date(cursor); start.setDate(start.getDate()-start.getDay());
    const week = Array.from({length:7},(_,i) => {const d=new Date(start);d.setDate(d.getDate()+i);return d;});
    const monthList = list.filter(x => mode === 'day' ? x.date === focus : x.date.startsWith(focus.slice(0,7)));
    const grouped = new Map();
    monthList.forEach(x => {if(!grouped.has(x.date)) grouped.set(x.date,[]);grouped.get(x.date).push(x);});
    root.innerHTML = `<div class="mobile-heading"><div class="mobile-eyebrow">FALL SEMESTER / 2026</div><h1>Your semester.</h1><div class="mobile-subtitle">Less juggling. More breathing room.</div><button class="mobile-add" aria-label="Add assignment">+</button></div>
      <div class="mobile-tabs" role="tablist" aria-label="Planner view"><button class="mobile-tab" data-mode="agenda" role="tab" aria-selected="${mode==='agenda'}">Agenda</button><button class="mobile-tab" data-mode="day" role="tab" aria-selected="${mode==='day'}">Day view</button><button class="mobile-tab" data-today>Today</button></div>
      <div class="mobile-month-row"><h2>${cursor.toLocaleDateString('en-US',{month:'long'})} <span>${cursor.getFullYear()}</span></h2><div><button class="mobile-arrow" data-month="-1" aria-label="Previous month">‹</button><button class="mobile-arrow" data-month="1" aria-label="Next month">›</button></div></div>
      <div class="mobile-week-navigation"><button class="mobile-arrow" data-week="-1" aria-label="Previous week">‹</button><span>Week of ${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span><button class="mobile-arrow" data-week="1" aria-label="Next week">›</button></div><div class="mobile-week" aria-label="Week">${week.map(d => `<button class="mobile-day" aria-label="${d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}" aria-pressed="${iso(d)===focus}" data-date="${iso(d)}">${d.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase()}<b>${d.getDate()}</b><i style="opacity:${list.some(x=>x.date===iso(d))?1:0}"></i></button>`).join('')}</div>
      <div class="mobile-filters" aria-label="Filter by class">${[['all','All classes'],...courses.map(c=>[c.code,c.code.startsWith('MGT')?'MGT':c.code])].map(([code,label])=>`<button class="mobile-filter" data-filter="${escape(code)}" aria-pressed="${selected===code}">${escape(label)}</button>`).join('')}</div>
      <div class="mobile-range">${mode==='day'?'Selected day':'Upcoming this month'}</div><div id="mobileAgenda">${grouped.size?[...grouped].map(([date,items])=>`<section class="mobile-group" data-group="${date}"><h3>${dateFor(date).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}<span>${date===today()?'Today':''}</span></h3>${items.map(x=>{const ci=courses.indexOf(x.course),ii=x.course.items.findIndex(v=>v[0]===x.title&&v[1]===x.date);return `<article class="mobile-card" style="--course-color:${colors[ci%colors.length][0]};--course-day:${colors[ci%colors.length][1]}"><button class="mobile-complete" data-ci="${ci}" data-ii="${ii}" aria-label="Complete ${escape(x.title)}"><span></span></button><button class="mobile-card-link" data-ci="${ci}" data-ii="${ii}"><span class="mobile-course-label">${escape(x.course.code)}</span><span class="mobile-card-title">${escape(x.title)}</span><span class="mobile-card-time">◷ &nbsp; ${escape(x.time)}</span></button></article>`;}).join('')}</section>`).join(''):`<div class="mobile-empty">${mode==='day'?'Nothing due on this day.':'No upcoming assignments this month.'}</div>`}</div>`;
  }
  const toast = document.createElement('div');
  toast.className='mobile-toast';toast.hidden=true;toast.setAttribute('role','status');
  toast.innerHTML='<span>Assignment completed</span><button id="mobileUndo">Undo</button>';
  document.body.append(toast);
  let lastCompleted=null, toastTimer;
  toast.querySelector('button').onclick=()=>{if(lastCompleted){localStorage.setItem(lastCompleted,'0');lastCompleted=null;toast.hidden=true;draw();render();renderChecklist();}};
  const nav=document.createElement('nav');nav.id='mobileNav';nav.setAttribute('aria-label','Main navigation');
  const icons={planner:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2"/>',checklist:'<path d="m3 6 2 2 3-4m3 2h10M3 13l2 2 3-4m3 2h10M3 20l2 2 3-4m3 2h10"/>',assignments:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',theme:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'};
  nav.innerHTML=[['planner','Planner'],['checklist','Checklist'],['assignments','Assignments'],['theme','Day mode']].map(([id,label])=>`<button data-nav="${id}" ${id==='planner'?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg><span>${label}</span></button>`).join('');
  document.body.append(nav);
  const setNav=active=>nav.querySelectorAll('[data-nav]').forEach(b=>{if(b.dataset.nav===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const originalDashboard=showDashboard,originalAssignments=showAssignmentScreen,originalChecklist=showChecklist;
  showDashboard=function(){originalDashboard();root.hidden=false;draw();setNav('planner');};
  showAssignmentScreen=function(c){originalAssignments(c);root.hidden=true;setNav('assignments');};
  showChecklist=function(){document.getElementById('assignmentScreen').style.display='none';originalChecklist();root.hidden=true;setNav('checklist');window.scrollTo(0,0);};
  document.getElementById('todayChecklist').onclick=showChecklist;
  document.getElementById('backToDashboard').onclick=showDashboard;
  const themeLabel=()=>{nav.querySelector('[data-nav="theme"] span').textContent=document.body.classList.contains('dayMode')?'Night mode':'Day mode';};
  nav.onclick=event=>{const b=event.target.closest('[data-nav]');if(!b)return;switch(b.dataset.nav){case 'planner':showDashboard();break;case 'checklist':showChecklist();break;case 'assignments':showAssignmentScreen(courses.find(c=>c.code===selected)||courses[0]);break;case 'theme':toggleTheme();themeLabel();break;}};
  themeLabel();
  // Rendering the original app also refreshes mobile data after edits/checklist actions.
  const originalRender=render;
  render=function(){originalRender();draw();};
  const mq=matchMedia('(max-width:950px)');
  mq.addEventListener('change',()=>{root.hidden=document.getElementById('assignmentScreen').style.display==='block'||document.getElementById('todayScreen').style.display==='block';draw();});
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if(button.classList.contains('mobile-add')){addAssignment(Math.max(0,courses.findIndex(c=>c.code===selected)));return;}
    if(button.classList.contains('mobile-card-link')){showAssignmentScreen(courses[Number(button.dataset.ci)]);return;}
    if(button.classList.contains('mobile-complete')) {
      const c=courses[Number(button.dataset.ci)], item=c.items[Number(button.dataset.ii)];
      lastCompleted=keyFor({date:item[1],course:c,title:item[0]});
      localStorage.setItem(lastCompleted,'1');render();renderChecklist();
      toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},8000);
    }
    if (button.hasAttribute('data-filter')) {selected=button.dataset.filter; document.getElementById('filter').value=selected;render();}
    if (button.hasAttribute('data-month')) {const d=dateFor(focus);d.setDate(1);d.setMonth(d.getMonth()+Number(button.dataset.month));focus=iso(d);}
    if (button.hasAttribute('data-week')) {const d=dateFor(focus);d.setDate(d.getDate()+7*Number(button.dataset.week));focus=iso(d);}
    if (button.hasAttribute('data-date')) focus=button.dataset.date;
    if (button.hasAttribute('data-mode')) mode=button.dataset.mode;
    if (button.hasAttribute('data-today')) focus=today();
    draw();
    if(button.hasAttribute('data-date') && mode==='agenda') root.querySelector(`[data-group="${focus}"]`)?.scrollIntoView({block:'start',behavior:'smooth'});
  });
  draw();
})();
