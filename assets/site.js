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

// "through the die": a steel die plate with a 40x40 profile-shaped opening rises over the extrusion
// section and the view zooms through the opening into it. Section itself is unchanged underneath.
(function(){
  var sec=document.getElementById('uslugi');
  if(!sec||!window.requestAnimationFrame)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var NS='http://www.w3.org/2000/svg';
  var P='M0 0 L60 0 L60 10 L44 10 L44 30 L116 30 L116 10 L100 10 L100 0 L160 0 L160 60 L150 60 L150 44 L130 44 L130 116 L150 116 L150 100 L160 100 L160 160 L100 160 L100 150 L116 150 L116 130 L44 130 L44 150 L60 150 L60 160 L0 160 L0 100 L10 100 L10 116 L30 116 L30 44 L10 44 L10 60 L0 60 Z';
  var label=(sec.getAttribute('data-die')||'matryca').toUpperCase();
  var bolts='';for(var k=0;k<6;k++){var a=k*Math.PI/3+Math.PI/6,x=80+168*Math.cos(a),y=80+168*Math.sin(a);bolts+='<circle class="bolt" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="9" vector-effect="non-scaling-stroke"/><circle class="ring" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4" vector-effect="non-scaling-stroke"/>';}
  var wrap=document.createElement('div');wrap.className='die';wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML='<svg xmlns="'+NS+'"><defs>'+
    '<linearGradient id="dieg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2d32"/><stop offset=".5" stop-color="#1b1d21"/><stop offset="1" stop-color="#131417"/></linearGradient>'+
    '<mask id="diem" maskUnits="userSpaceOnUse"><rect class="m-bg" fill="#fff"/><g class="zg"><path d="'+P+'" fill="#000"/></g></mask>'+
    '<clipPath id="diec"><rect class="c-r"/></clipPath></defs>'+
    '<rect class="plate" fill="url(#dieg)" mask="url(#diem)"/>'+
    '<g clip-path="url(#diec)"><g class="zg">'+
      '<circle class="ring" cx="80" cy="80" r="122" vector-effect="non-scaling-stroke"/>'+
      '<circle class="ring-d" cx="80" cy="80" r="140" vector-effect="non-scaling-stroke"/>'+
      '<circle class="ring" cx="80" cy="80" r="196" vector-effect="non-scaling-stroke"/>'+bolts+
      '<path class="edge" d="'+P+'" vector-effect="non-scaling-stroke"/>'+
      '<path class="dimd" d="M0 -26 H160 M0 -32 V-20 M160 -32 V-20 M-26 0 V160 M-32 0 H-20 M-32 160 H-20" vector-effect="non-scaling-stroke"/>'+
      '<text class="lbl" x="80" y="-32" text-anchor="middle">40</text>'+
      '<text class="lbl" x="-34" y="82" text-anchor="middle" transform="rotate(-90 -34 82)">40</text>'+
      '<text class="lbl" x="80" y="226" text-anchor="middle">'+label.replace(/[<&]/g,'')+' · PH-40×40</text>'+
    '</g></g></svg>';
  document.body.appendChild(wrap);
  sec.classList.add('die-sec');
  var plate=wrap.querySelector('.plate'),mbg=wrap.querySelector('.m-bg'),clip=wrap.querySelector('.c-r'),gs=wrap.querySelectorAll('.zg'),ticking=false;
  function frame(){
    ticking=false;
    var vh=innerHeight,vw=innerWidth,r=sec.getBoundingClientRect();
    var p=(vh-r.top)/vh;                       // 0: section top at screen bottom, 1: at screen top
    if(p<=0.02||p>=1){wrap.classList.remove('on');return;}
    wrap.classList.add('on');
    var top=Math.max(r.top,0),h=vh-top,rad=parseFloat(getComputedStyle(sec).borderTopLeftRadius)||0;
    [plate,mbg,clip].forEach(function(el){el.setAttribute('x',r.left);el.setAttribute('y',r.top);el.setAttribute('width',r.width);el.setAttribute('height',Math.max(0,Math.min(r.bottom,vh+rad)-r.top));el.setAttribute('rx',rad);});
    var s0=Math.min(vw,vh)*0.34/160, s1=Math.hypot(vw,vh)*1.15/100;   // 1.15: profile core (100 units) must clear the screen diagonal
    var q=Math.max(0,Math.min(1,(p-0.3)/0.58));                       // plate rises first, then the zoom (done by p=0.88)
    q=q*q*(3-2*q);
    var s=s0*Math.pow(s1/s0,q);
    var cx=r.left+r.width/2,cy=top+h/2;
    if(q>0)cy=(top+h/2)*(1-q)+(vh/2)*q;
    var tf='translate('+cx.toFixed(1)+' '+cy.toFixed(1)+') scale('+s.toFixed(4)+') translate(-80 -80)';
    for(var i=0;i<gs.length;i++)gs[i].setAttribute('transform',tf);
    var f=Math.max(0,Math.min(1,(q-0.62)/0.38));wrap.style.opacity=(1-f*f).toFixed(3);   // dissolve while passing through
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);frame();
})();
