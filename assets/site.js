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

// "through the die" (v5): the extrusion panel arrives as a steel die plate whose opening is the FIRST LETTER
// of the panel's own heading (W / A / П / A, so every language adapts by itself), cut with the heading's real
// font. Scrolling flies the opening onto that letter in the heading while the plate dissolves.
// One fixed canvas, drawn only inside the panel's rounded box; 100lvh tall so iOS toolbars leave no gap.
(function(){
  var sec=document.getElementById('uslugi'),h2=sec&&sec.querySelector('h2');
  if(!sec||!h2||!window.requestAnimationFrame||!document.createElement('canvas').getContext)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var tn=h2.firstChild;while(tn&&tn.nodeType!==3)tn=tn.firstChild;
  if(!tn||!tn.data.trim())return;
  var off=tn.data.search(/\S/),L=tn.data.charAt(off);
  h2.classList.remove('rv');h2.classList.add('in');                 // heading stays put: it is the landing target
  var label=(sec.getAttribute('data-die')||'matryca').toUpperCase();
  var cv=document.createElement('canvas');cv.className='die-cv';cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);sec.classList.add('die-sec');
  var c=cv.getContext('2d'),W=0,H=0,DPR=1,ticking=false,shown=false,last='',fam='',wt='700',ready=false;
  var hasStretch='fontStretch' in c;
  function fontAt(px){return wt+' '+px.toFixed(2)+'px '+fam;}
  function resize(){
    DPR=Math.min(window.devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;
    cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);last='';
    var cs=getComputedStyle(h2);fam=cs.fontFamily;wt=cs.fontWeight;
  }
  function rr(x,y,w,h,r){c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}
  var range=document.createRange();
  function lerp(a,b,t){return a+(b-a)*t}
  function frame(){
    ticking=false;
    var vh=innerHeight,r=sec.getBoundingClientRect(),p=(vh-r.top)/vh;    // 0: panel top at screen bottom, 1: at screen top
    if(!ready||p<=0.01||p>=1.05){if(shown){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);cv.style.visibility='hidden';shown=false;last='';}return;}
    if(!shown){cv.style.visibility='visible';shown=true;}
    range.setStart(tn,off);range.setEnd(tn,off+1);var g=range.getBoundingClientRect();   // the real letter on the page
    var key=r.top.toFixed(1)+'|'+g.left.toFixed(1)+'|'+g.top.toFixed(1)+'|'+W+'|'+H;if(key===last)return;last=key;
    c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);
    if(hasStretch)c.fontStretch='expanded';
    var fsT=parseFloat(getComputedStyle(h2).fontSize);
    c.font=fontAt(100);var m=c.measureText(L),wR=m.width/100,asc=(m.actualBoundingBoxAscent||72)/100,fAsc=(m.fontBoundingBoxAscent||92)/100;
    var rad=parseFloat(getComputedStyle(sec).borderTopLeftRadius)||0;
    var bx=r.left,by=r.top,bw=r.width,bh=Math.min(r.bottom,H+rad)-r.top;
    var top=Math.max(r.top,0),vis=vh-top;
    // start: a big letter centred in the visible part of the plate; end: exactly on the heading's first letter
    var fsS=Math.min(bw*0.62/wR,Math.max(vis,vh*0.5)*0.55/asc);
    var xS=bx+bw/2-fsS*wR/2,yS=top+vis/2+fsS*asc/2;                  // baseline
    var xT=g.left,yT=g.top+fsT*fAsc;
    var q=Math.max(0,Math.min(1,(p-0.38)/0.52));q=q*q*(3-2*q);
    var fs=Math.exp(lerp(Math.log(fsS),Math.log(fsT),q)),x=lerp(xS,xT,q),y=lerp(yS,yT,q);
    var alpha=1-Math.max(0,Math.min(1,(q-0.82)/0.18));alpha=alpha*alpha*(3-2*alpha);   // plate stays solid until the letter lands
    if(alpha<=0.003)return;
    var lw=fs*wR,lh=fs*asc,lcx=x+lw/2,lcy=y-lh/2,R=Math.max(lw,lh)/2;
    c.globalAlpha=alpha;c.save();c.beginPath();rr(bx,by,bw,bh,rad);c.clip();
    var gr=c.createRadialGradient(lcx,lcy,0,lcx,lcy,Math.hypot(bw,vh)*0.7);
    gr.addColorStop(0,'#2d3036');gr.addColorStop(.5,'#1d1f23');gr.addColorStop(1,'#131417');
    c.fillStyle=gr;c.fillRect(bx,by,bw,bh);
    // die rings, bolts and dimension lines around the opening
    function ring(k,a,dash){c.beginPath();c.setLineDash(dash||[]);c.strokeStyle='rgba(255,255,255,'+a+')';c.lineWidth=1.1;c.arc(lcx,lcy,R*k,0,7);c.stroke();}
    ring(1.35,.16);ring(1.55,.12,[6,6]);ring(2.1,.14);ring(3.4,.07);c.setLineDash([]);
    for(var k=0;k<6;k++){var a=k*Math.PI/3+Math.PI/6,px=lcx+R*1.83*Math.cos(a),py=lcy+R*1.83*Math.sin(a),br=Math.max(3,R*.1);
      c.beginPath();c.arc(px,py,br,0,7);c.fillStyle='#121316';c.fill();c.strokeStyle='rgba(255,255,255,.22)';c.stroke();
      c.beginPath();c.arc(px,py,br*.42,0,7);c.strokeStyle='rgba(255,255,255,.3)';c.stroke();}
    var d=Math.max(8,R*.16),t=Math.max(5,R*.07);
    c.strokeStyle='rgba(255,72,80,.7)';c.lineWidth=1.2;c.beginPath();
    c.moveTo(x,y-lh-d);c.lineTo(x+lw,y-lh-d);c.moveTo(x,y-lh-d-t);c.lineTo(x,y-lh-d+t);c.moveTo(x+lw,y-lh-d-t);c.lineTo(x+lw,y-lh-d+t);
    c.moveTo(x-d,y-lh);c.lineTo(x-d,y);c.moveTo(x-d-t,y-lh);c.lineTo(x-d+t,y-lh);c.moveTo(x-d-t,y);c.lineTo(x-d+t,y);c.stroke();
    var mf=Math.max(10,Math.min(13,R*.09));c.font='500 '+mf+'px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    c.fillStyle='rgba(255,72,80,.88)';c.textAlign='center';c.textBaseline='alphabetic';
    c.fillText(label+' · '+L,lcx,lcy+R*1.83+R*.1+mf*1.6);
    // hot glow, then cut the letter-shaped opening with the heading's real font
    c.textAlign='left';c.font=fontAt(fs);if(hasStretch)c.fontStretch='expanded';
    c.save();c.shadowColor='rgba(255,90,20,.75)';c.shadowBlur=Math.max(12,fs*.12);c.fillStyle='rgba(255,90,20,.35)';c.fillText(L,x,y);c.restore();
    c.globalCompositeOperation='destination-out';c.fillStyle='#000';c.fillText(L,x,y);c.globalCompositeOperation='source-over';
    c.lineWidth=1.4;c.strokeStyle='rgba(255,255,255,.6)';c.lineJoin='round';c.strokeText(L,x,y);
    c.restore();c.globalAlpha=1;
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
  resize();
  var go=function(){ready=true;resize();frame();};
  if(document.fonts&&document.fonts.load){document.fonts.load(wt+' 100px '+fam,L).then(go,go);setTimeout(go,2500);}else go();
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',function(){resize();req();});
})();
