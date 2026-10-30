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

// "through the die" (v4): the extrusion panel arrives as a steel die plate with a 40x40 profile-shaped
// opening; the view zooms through the opening into the real panel underneath. Drawn on one fixed canvas
// (fast on phones, crisp at any zoom), only inside the panel's own rounded box, so nothing spills onto
// the panel above. The canvas uses the largest viewport height, so iOS toolbars never leave a gap.
(function(){
  var sec=document.getElementById('uslugi');
  if(!sec||!window.requestAnimationFrame||!document.createElement('canvas').getContext)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var T='M0 0 L60 0 L60 10 L44 10 L44 30 L116 30 L116 10 L100 10 L100 0 L160 0 L160 60 L150 60 L150 44 L130 44 L130 116 L150 116 L150 100 L160 100 L160 160 L100 160 L100 150 L116 150 L116 130 L44 130 L44 150 L60 150 L60 160 L0 160 L0 100 L10 100 L10 116 L30 116 L30 44 L10 44 L10 60 L0 60 Z';
  var pts=T.replace(/[MLZ]/g,' ').trim().split(/\s+/).map(Number);
  var label=(sec.getAttribute('data-die')||'matryca').toUpperCase();
  var cv=document.createElement('canvas');cv.className='die-cv';cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);sec.classList.add('die-sec');
  var c=cv.getContext('2d'),W=0,H=0,DPR=1,ticking=false,shown=false,last='';
  function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);last='';}
  function rr(x,y,w,h,r){c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}
  function frame(){
    ticking=false;
    var vh=innerHeight,r=sec.getBoundingClientRect(),p=(vh-r.top)/vh;   // 0: panel top at screen bottom, 1: at screen top
    if(p<=0.01||p>=1){if(shown){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);cv.style.visibility='hidden';shown=false;last='';}return;}
    if(!shown){cv.style.visibility='visible';shown=true;}
    var q=Math.max(0,Math.min(1,(p-0.3)/0.58));q=q*q*(3-2*q);
    var f=Math.max(0,Math.min(1,(q-0.62)/0.38)),alpha=1-f*f;
    var key=r.top.toFixed(1)+'|'+W+'|'+H;if(key===last)return;last=key;
    var rad=parseFloat(getComputedStyle(sec).borderTopLeftRadius)||0;
    var bx=r.left,by=r.top,bw=r.width,bh=Math.min(r.bottom,H+rad)-r.top;    // panel box, cut below the canvas
    var top=Math.max(r.top,0),vis=vh-top;
    var s0=Math.min(bw,vh)*0.34/160,s1=Math.hypot(bw,vh)*1.15/100,s=s0*Math.pow(s1/s0,q);
    var cx=bx+bw/2,cy=top+vis/2;if(q>0)cy=cy*(1-q)+(vh/2)*q;
    var ox=cx-80*s,oy=cy-80*s;function X(u){return ox+u*s}function Y(u){return oy+u*s}
    function hole(){c.moveTo(X(pts[0]),Y(pts[1]));for(var i=2;i<pts.length;i+=2)c.lineTo(X(pts[i]),Y(pts[i+1]));c.closePath();}
    c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);c.globalAlpha=alpha;
    c.save();c.beginPath();rr(bx,by,bw,bh,rad);c.clip();
    var g=c.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(bw,vh)*0.7);
    g.addColorStop(0,'#2d3036');g.addColorStop(.5,'#1d1f23');g.addColorStop(1,'#131417');
    c.beginPath();c.rect(bx,by,bw,bh);hole();c.fillStyle=g;c.fill('evenodd');
    var gl=c.createRadialGradient(X(80),Y(80),70*s,X(80),Y(80),150*s);
    gl.addColorStop(0,'rgba(255,90,20,0)');gl.addColorStop(.35,'rgba(255,90,20,.2)');gl.addColorStop(1,'rgba(255,60,10,0)');
    c.beginPath();c.rect(bx,by,bw,bh);hole();c.fillStyle=gl;c.fill('evenodd');
    c.lineWidth=1.4;c.strokeStyle='rgba(255,255,255,.6)';c.beginPath();hole();c.stroke();
    function ring(rr_,a,dash){c.beginPath();c.setLineDash(dash||[]);c.strokeStyle='rgba(255,255,255,'+a+')';c.lineWidth=1.1;c.arc(X(80),Y(80),rr_*s,0,7);c.stroke();}
    ring(122,.16);ring(140,.12,[6,6]);ring(196,.14);ring(330,.07);c.setLineDash([]);
    for(var k=0;k<6;k++){var a=k*Math.PI/3+Math.PI/6,px=X(80+168*Math.cos(a)),py=Y(80+168*Math.sin(a));
      c.beginPath();c.arc(px,py,9*s,0,7);c.fillStyle='#121316';c.fill();c.strokeStyle='rgba(255,255,255,.22)';c.stroke();
      c.beginPath();c.arc(px,py,4*s,0,7);c.strokeStyle='rgba(255,255,255,.3)';c.stroke();}
    c.strokeStyle='rgba(255,72,80,.7)';c.lineWidth=1.2;c.beginPath();
    c.moveTo(X(0),Y(-26));c.lineTo(X(160),Y(-26));c.moveTo(X(0),Y(-33));c.lineTo(X(0),Y(-19));c.moveTo(X(160),Y(-33));c.lineTo(X(160),Y(-19));
    c.moveTo(X(-26),Y(0));c.lineTo(X(-26),Y(160));c.moveTo(X(-33),Y(0));c.lineTo(X(-19),Y(0));c.moveTo(X(-33),Y(160));c.lineTo(X(-19),Y(160));c.stroke();
    var fs=Math.max(10,Math.min(13,7*s));c.font='500 '+fs+'px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';c.fillStyle='rgba(255,72,80,.88)';c.textAlign='center';
    c.fillText('40',X(80),Y(-33));c.save();c.translate(X(-33),Y(80));c.rotate(-Math.PI/2);c.fillText('40',0,0);c.restore();
    c.fillText(label+' · PH-40×40',X(80),Y(226));
    c.restore();c.globalAlpha=1;
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
  resize();frame();
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',function(){resize();req();});
})();
