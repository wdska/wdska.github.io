document.documentElement.classList.add('js');
(function(){
  // mobile menu
  var b=document.querySelector('.burger'),m=document.getElementById('menu');
  if(b&&m){
    b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',!o);m.classList.toggle('open',!o);document.body.style.overflow=o?'':'hidden';});
    m.addEventListener('click',function(e){if(e.target.closest('a')){b.setAttribute('aria-expanded','false');m.classList.remove('open');document.body.style.overflow='';}});
  }

  // gallery arrows
  document.querySelectorAll('[data-gal]').forEach(function(ctrl){
    var g=document.getElementById(ctrl.dataset.gal);
    var figs=[].slice.call(g.querySelectorAll('figure'));
    // load all photos once the gallery gets close, so the first swipe doesn't wait for images
    var warm=function(){figs.forEach(function(f){var i=f.querySelector('img');if(i)i.loading='eager';});};
    if('IntersectionObserver' in window){var wo=new IntersectionObserver(function(es){if(es[0].isIntersecting){warm();wo.disconnect();}},{rootMargin:'800px 0px'});wo.observe(g);}else warm();
    // arrows step exactly one photo, aligned to the snap points
    ctrl.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click',function(){
        var pad=parseFloat(getComputedStyle(g).scrollPaddingLeft)||0,x=g.scrollLeft,base=figs[0].offsetLeft-pad,cur=0;
        figs.forEach(function(f,k){if(f.offsetLeft-pad-base<=x+4)cur=k;});
        var next=Math.max(0,Math.min(figs.length-1,cur+(btn.dataset.dir==='prev'?-1:1)));
        if(btn.dataset.dir==='prev'&&figs[cur].offsetLeft-pad-base<x-4)next=cur; // partly scrolled: snap back to current first
        g.scrollTo({left:figs[next].offsetLeft-pad-base,behavior:'smooth'});
      });
    });
  });

  // step wizard
  document.querySelectorAll('[data-wizard]').forEach(function(f){
    var steps=[].slice.call(f.querySelectorAll('fieldset')),i=0,
        prev=f.querySelector('[data-prev]'),next=f.querySelector('[data-next]'),send=f.querySelector('[data-send]'),
        bar=f.querySelector('.wz-bar i'),lbl=f.querySelector('[data-step-label]'),tpl=lbl?lbl.dataset.tpl:'';
    function show(){
      steps.forEach(function(s,k){s.hidden=k!==i;});
      prev.style.visibility=i?'visible':'hidden';
      next.hidden=i===steps.length-1; send.hidden=i!==steps.length-1;
      bar.style.width=((i+1)/steps.length*100)+'%';
      if(lbl)lbl.textContent=tpl.replace('{n}',i+1).replace('{t}',steps.length);
    }
    prev.addEventListener('click',function(){if(i>0){i--;show();steps[i].querySelector('input').focus();}});
    next.addEventListener('click',function(){
      var req=steps[i].querySelector('input[type=radio]');
      if(req&&!steps[i].querySelector('input:checked')){steps[i].querySelector('.opts').animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:200});return;}
      i++;show();var first=steps[i].querySelector('input');if(first)first.focus({preventScroll:true});
    });
    show();
  });

  // forms -> Google Apps Script
  // Google Apps Script web app that e-mails the lead to biuro@profilehouse.pl (see apps-script/Code.gs)
  var LEAD_URL='';
  var LIVE=/(^|\.)profilehouse\.pl$|\.github\.io$/.test(location.hostname);
  document.querySelectorAll('form[data-lead]').forEach(function(f){
    var msg=f.querySelector('.form-msg');
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var bad=null;
      f.querySelectorAll('[required]').forEach(function(el){var ok=el.value.trim()!=='' && (!el.checkValidity||el.checkValidity());el.setAttribute('aria-invalid',!ok);if(!ok&&!bad)bad=el;});
      if(bad){msg.className='form-msg err';msg.textContent=f.dataset.errFields;bad.focus();return;}
      var data={form:f.dataset.lead,page:location.pathname};
      new FormData(f).forEach(function(v,k){data[k]=data[k]?data[k]+', '+v:v;});
      var btn=f.querySelector('[type=submit]');btn.disabled=true;
      if(!LEAD_URL){done(!LIVE);return;}
      // text/plain + no-cors: a simple request Apps Script accepts without a CORS preflight
      fetch(LEAD_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)})
        .then(function(){done(true)})
        .catch(function(){done(!LIVE)}); // preview: no backend yet
      function done(ok){
        btn.disabled=false;
        msg.className='form-msg '+(ok?'ok':'err');
        msg.textContent=ok?f.dataset.ok:f.dataset.err;
        if(ok){f.reset();}
      }
    });
  });

  // product dialogs
  document.querySelectorAll('[data-open]').forEach(function(a){
    a.addEventListener('click',function(e){var d=document.getElementById(a.dataset.open);if(d&&d.showModal){e.preventDefault();d.showModal();}});
  });
  document.querySelectorAll('dialog').forEach(function(d){
    d.addEventListener('click',function(e){if(e.target===d||e.target.closest('[data-close]'))d.close();});
  });
})();

// services process animation
(function(){
  var fig=document.querySelector('[data-proc]'),list=document.querySelector('[data-proc-chips]');
  if(!fig||!list)return;
  var stages=[].slice.call(fig.querySelectorAll('.stage')),chips=[].slice.call(list.querySelectorAll('.chip')),
      nameEl=fig.querySelector('[data-proc-name]'),descEl=fig.querySelector('[data-proc-desc]'),
      numEl=fig.querySelector('[data-proc-num]'),bar=fig.querySelector('[data-proc-bar]'),
      DUR=3800,n=stages.length,cur=0,timer=null,hold=false,visible=false,
      reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  list.style.setProperty('--dur',DUR+'ms');
  function show(i){
    cur=(i+n)%n;
    stages.forEach(function(s,k){s.classList.remove('on');});
    void fig.offsetWidth; // restart CSS animations
    stages[cur].classList.add('on');
    chips.forEach(function(c,k){c.setAttribute('aria-pressed',k===cur);c.classList.remove('run');});
    void list.offsetWidth;
    if(!hold&&!reduce)chips[cur].classList.add('run');
    nameEl.textContent=chips[cur].textContent;descEl.textContent=chips[cur].dataset.desc;
    numEl.textContent=(numEl.dataset.tpl||'{n}/{t}').replace('{n}',cur+1).replace('{t}',n);bar.style.width=((cur+1)/n*100)+'%';
  }
  function loop(){clearTimeout(timer);if(hold||!visible||reduce)return;timer=setTimeout(function(){show(cur+1);loop();},DUR);}
  chips.forEach(function(c,k){
    c.addEventListener('mouseenter',function(){hold=true;clearTimeout(timer);show(k);});
    c.addEventListener('focus',function(){hold=true;clearTimeout(timer);show(k);});
    c.addEventListener('click',function(){hold=false;show(k);loop();});
  });
  list.addEventListener('mouseleave',function(){hold=false;show(cur);loop();});
  list.addEventListener('focusout',function(e){if(!list.contains(e.relatedTarget)){hold=false;loop();}});
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v&&!visible){visible=true;show(cur);loop();}else if(!v){visible=false;clearTimeout(timer);}},{threshold:.35}).observe(fig);
  }else{visible=true;loop();}
  show(0);
})();

// network diagram: respect reduced motion
(function(){if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;document.querySelectorAll('.net-svg,.jit-svg').forEach(function(s){if(s.pauseAnimations)s.pauseAnimations();});})();

// scroll reveal: panels rise in, then their content follows with a short stagger
(function(){
  if(!('IntersectionObserver' in window))return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var groups=[
    ['.hero h1,.hero .lead,.hero .btns,.hero .hero-facts,.hero .spec',0.12],
    ['.h-block > *',0.08],
    ['.mission .statement,.mission .split > *',0.12],
    ['.svc-list li',0.04],
    ['.certs > *',0.1],
    ['.jit-points li',0.07],
    ['.steps > li',0.08],
    ['.docs > *',0.12],
    ['.contact-grid > form,.ask > form',0],
    ['.phead h1,.phead .lead',0.1]
  ];
  var els=[];
  groups.forEach(function(gr){
    var seen=new Map();
    document.querySelectorAll(gr[0]).forEach(function(el){
      if(el.classList.contains('rv'))return;
      var p=el.parentNode,k=seen.get(p)||0;seen.set(p,k+1);
      el.classList.add('rv');el.style.setProperty('--rv-d',Math.min(k*gr[1],.6)+'s');els.push(el);
    });
  });
  document.querySelectorAll('.proc,.jit,.ceo,.docs .pic,.person img').forEach(function(el){
    if(el.closest('.rv'))return;el.classList.add('rv');els.push(el);
  });
  document.querySelectorAll('.docs .pic').forEach(function(el){el.classList.add('rv-pic');});
  document.querySelectorAll('main > .sec').forEach(function(el){if(el.id==='uslugi'){el.classList.add('in');return;}el.classList.add('rv-panel');els.push(el);});
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{rootMargin:'0px 0px -8% 0px',threshold:0});
  els.forEach(function(el){io.observe(el);});
  // safety net: anything still hidden after load + 4s (e.g. printed or odd viewport) becomes visible
  window.addEventListener('load',function(){setTimeout(function(){els.forEach(function(el){var r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)el.classList.add('in');});},4000);});
})();

// blueprint drawings drift slightly slower than the page (subtle parallax)
(function(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var arts=[].slice.call(document.querySelectorAll('.bp-art'));if(!arts.length)return;
  var ticking=false;
  function upd(){ticking=false;var vh=innerHeight;arts.forEach(function(a){var r=a.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;var c=(r.top+r.height/2-vh/2)/vh;a.style.setProperty('--bp-shift',(c*-60).toFixed(1)+'px');});}
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});
  addEventListener('resize',upd);upd();
})();

// "through the die" (v6, iPhone-friendly): the die plate is built from plain solid-colour blocks around a
// 40x40 profile-shaped opening. Solid blocks are moved/scaled by the GPU without repainting, so edges stay
// sharp and scrolling stays smooth. The plate lives INSIDE the extrusion panel (clipped by its rounded box)
// and covers it to the very bottom, so nothing shows through whatever the phone's toolbar does.
(function(){
  var sec=document.getElementById('uslugi');
  if(!sec||!window.requestAnimationFrame)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var T='M0 0 L60 0 L60 10 L44 10 L44 30 L116 30 L116 10 L100 10 L100 0 L160 0 L160 60 L150 60 L150 44 L130 44 L130 116 L150 116 L150 100 L160 100 L160 160 L100 160 L100 150 L116 150 L116 130 L44 130 L44 150 L60 150 L60 160 L0 160 L0 100 L10 100 L10 116 L30 116 L30 44 L10 44 L10 60 L0 60 Z';
  // plate parts that reach into the opening's 160x160 box (the four slots): x, y, w, h in profile units
  var CAV=[[60,0,40,10],[44,10,72,20],[150,60,10,40],[130,44,20,72],[60,150,40,10],[44,130,72,20],[0,60,10,40],[10,44,20,72]];
  var label=(sec.getAttribute('data-die')||'matryca').toUpperCase().replace(/[<&]/g,'');
  var bolts='';for(var k=0;k<6;k++){var a=k*Math.PI/3+Math.PI/6,x=(80+168*Math.cos(a)).toFixed(1),y=(80+168*Math.sin(a)).toFixed(1);
    bolts+='<circle cx="'+x+'" cy="'+y+'" r="9" fill="#121316" stroke="rgba(255,255,255,.24)"/><circle cx="'+x+'" cy="'+y+'" r="4" fill="none" stroke="rgba(255,255,255,.3)"/>';}
  var box=document.createElement('div');box.className='die2';box.setAttribute('aria-hidden','true');
  var html='';for(k=0;k<4+CAV.length;k++)html+='<i></i>';
  html+='<div class="die-glow"></div><svg class="die-art" viewBox="-240 -240 640 640" fill="none">'+
    '<path d="'+T+'" stroke="rgba(255,255,255,.6)" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<g stroke="rgba(255,255,255,.15)" stroke-width="1.1"><circle cx="80" cy="80" r="122"/><circle cx="80" cy="80" r="196"/></g>'+
    '<circle cx="80" cy="80" r="140" stroke="rgba(255,255,255,.12)" stroke-dasharray="6 6"/>'+bolts+
    '<path d="M0 -26 H160 M0 -33 V-19 M160 -33 V-19 M-26 0 V160 M-33 0 H-19 M-33 160 H-19" stroke="rgba(255,72,80,.75)" stroke-width="1.2"/>'+
    '<g fill="rgba(255,72,80,.9)" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="9" text-anchor="middle">'+
    '<text x="80" y="-33">40</text><text x="-36" y="83" transform="rotate(-90 -36 83)">40</text><text x="80" y="230">'+label+' · PH-40×40</text></g></svg>';
  box.innerHTML=html;sec.insertBefore(box,sec.firstChild);sec.classList.add('die-sec');
  var parts=box.querySelectorAll('i'),glow=box.querySelector('.die-glow'),art=box.querySelector('.die-art');
  var ticking=false,shown=false,s0=1,bw=0,artPx=0,glowPx=0;
  function resize(){
    bw=sec.clientWidth;var vh=innerHeight;
    s0=Math.min(bw,vh)*0.34/160;
    artPx=640*s0;art.style.width=art.style.height=artPx+'px';
    glowPx=320*s0;glow.style.width=glow.style.height=glowPx+'px';
  }
  function put(el,x,y,w,h){el.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale('+Math.max(0,w).toFixed(2)+','+Math.max(0,h).toFixed(2)+')';}
  function frame(){
    ticking=false;
    var vh=innerHeight,r=sec.getBoundingClientRect(),p=(vh-r.top)/vh;   // 0: panel top at screen bottom, 1: at screen top
    if(p<=0.01||p>=1){if(shown){box.style.visibility='hidden';shown=false;}return;}
    if(!shown){box.style.visibility='visible';shown=true;}
    var q=Math.max(0,Math.min(1,(p-0.3)/0.58));q=q*q*(3-2*q);
    var f=Math.max(0,Math.min(1,(q-0.62)/0.38));
    var s1=Math.hypot(bw,vh)*1.15/100,z=Math.pow(s1/s0,q),s=s0*z;
    var top=Math.max(r.top,0),vis=vh-top,cyV=top+vis/2;if(q>0)cyV=cyV*(1-q)+(vh/2)*q;
    var H=sec.offsetHeight,cx=bw/2,cy=cyV-r.top,ox=cx-80*s,oy=cy-80*s,e=160*s;   // panel-local coordinates
    put(parts[0],0,0,bw,oy);                       // above the opening
    put(parts[1],0,oy+e,bw,H-(oy+e));              // below the opening, down to the panel's end
    put(parts[2],0,oy-1,ox,e+2);                   // left
    put(parts[3],ox+e,oy-1,bw-(ox+e),e+2);         // right
    for(var k=0;k<CAV.length;k++){var c=CAV[k];put(parts[4+k],ox+c[0]*s-.5,oy+c[1]*s-.5,c[2]*s+1,c[3]*s+1);}
    art.style.transform='translate3d('+(cx-artPx/2).toFixed(2)+'px,'+(cy-artPx/2).toFixed(2)+'px,0) scale('+z.toFixed(4)+')';
    glow.style.transform='translate3d('+(cx-glowPx/2).toFixed(2)+'px,'+(cy-glowPx/2).toFixed(2)+'px,0) scale('+z.toFixed(4)+')';
    var gq=Math.max(0,Math.min(1,(q-0.3)/0.3));glow.style.opacity=(1-gq).toFixed(3);   // heat glow gone before it can tint the panel
    box.style.opacity=(1-f*f).toFixed(3);
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
  resize();frame();
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',function(){resize();req();});
})();
