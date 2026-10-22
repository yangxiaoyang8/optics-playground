const el=id=>document.getElementById(id);
const canvas=el('scene');
let ctx=canvas.getContext('2d');
const layers=[canvas];
let layerIndex=0;
function nextLayer(blur=0){
  layerIndex++;
  let layer=layers[layerIndex];
  if(!layer){
    layer=document.createElement('canvas');
    layer.width=canvas.width;
    layer.height=canvas.height;
    layer.className='scene-layer';
    canvas.parentElement.appendChild(layer);
    layers.push(layer);
  }
  layer.style.display='block';
  layer.style.filter=blur>0?`blur(${(blur*canvas.getBoundingClientRect().width/canvas.width).toFixed(2)}px)`:'none';
  ctx=layer.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
}
const W=960,H=600,CX=480,HORIZON=275,PERSON_DIST_AT_50=3.8,PIXELS_PER_M_AT_SUBJECT=108;
const targets={flower:{z:-.75,label:'花朵',marker:'9%'},person:{z:0,label:'人物',marker:'38%'},house:{z:8,label:'房屋',marker:'87%'}};
let selected='person';
const state=()=>({f:+el('focal').value,n:+el('aperture').value,camera:PERSON_DIST_AT_50*(+el('focal').value/50)});
function depth(z,s){return Math.max(.12,s.camera+z)}
function scale(z,s){return PIXELS_PER_M_AT_SUBJECT*s.camera/depth(z,s)}
function project(x,y,z,s){const k=scale(z,s);return [CX+x*k,HORIZON+(1.55-y)*k]}
function blurAt(z,s){
  const f=s.f,focus=depth(targets[selected].z,s)*1000,object=depth(z,s)*1000;
  const coc=(f*f/s.n)*Math.abs(object-focus)/(object*Math.max(1,focus-f));
  return Math.min(18,coc*(W/36)*1.7);
}
function withDepth(z,s,draw){
  const blur=blurAt(z,s);
  if(blur<.1){draw();return}
  nextLayer(blur);
  draw();
  nextLayer();
}
function poly(points,fill,stroke,width=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function line(points,color,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function drawSky(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#85b8cf');g.addColorStop(.48,'#f4d6aa');g.addColorStop(1,'#567d75');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ellipse(780,135,62,62,'#fff1beaa');ctx.fillStyle='#ffffff44';for(let i=0;i<8;i++)ellipse(115+i*107,90+(i%3)*19,67,11,'#ffffff45')}
function drawMountain(s){withDepth(30,s,()=>{const p=(x,y)=>project(x,y,30,s);poly([p(-15,0),p(-9,6.5),p(-6,2.2),p(-2,10),p(1,4.5),p(5,8),p(12,0)],'#71929a');poly([p(-3.2,7.4),p(-2,10),p(-.7,7.2),p(-2,7.9)],'#dce3d7');poly([p(4,6.4),p(5,8),p(6,6.2)],'#dbe2d8')})}
function drawGround(s){const y=project(0,0,80,s)[1];let g=ctx.createLinearGradient(0,y,0,H);g.addColorStop(0,'#688e73');g.addColorStop(1,'#1d483f');ctx.fillStyle=g;ctx.fillRect(0,y,W,H-y);withDepth(12,s,()=>{for(let i=-12;i<=12;i++)ellipse(...project(i*.8,0,12,s),32,10,'#8aa27a33')})}
function drawRoad(s){const far=project(0,0,80,s),nearZ=-1.08;poly([project(-1.25,0,nearZ,s),project(-1.05,0,80,s),project(1.05,0,80,s),project(1.25,0,nearZ,s)],'#686b62');line([project(-1.25,0,nearZ,s),project(-1.05,0,80,s)],'#d7ccb0',3);line([project(1.25,0,nearZ,s),project(1.05,0,80,s)],'#d7ccb0',3);for(const z of [28,13,6,2,0,-.6]){const z2=z+Math.max(.3,depth(z,s)*.1);poly([project(-.025,0,z,s),project(-.025,0,z2,s),project(.025,0,z2,s),project(.025,0,z,s)],'#f8dea3')}}
function drawFence(s){for(const side of [-1,1]){let pts=[];for(const z of [-.8,0,2,5,10,18]){let p=project(side*1.8,0,z,s),k=scale(z,s);pts.push([p[0],p[1]-.6*k]);withDepth(z,s,()=>{line([[p[0],p[1]],[p[0],p[1]-.85*k]],'#514b3d',Math.max(2,.075*k));ellipse(p[0],p[1]-.85*k,Math.max(2,.07*k),Math.max(2,.04*k),'#eed4aa')})}line(pts,'#b59f78',3)}}
function drawHouse(s){withDepth(8,s,()=>{const z=8,p=(x,y)=>project(x,y,z,s),k=scale(z,s);poly([p(3,0),p(7.4,0),p(7.4,3),p(3,3)],'#e5ab78','#854b44',Math.max(1,k*.04));poly([p(2.7,3),p(5.2,4.6),p(7.7,3)],'#793e43');poly([p(4.7,0),p(5.8,0),p(5.8,2)],'#79544d');poly([p(6.35,1.1),p(7.1,1.1),p(7.1,2.2),p(6.35,2.2)],'#8cc7d2','#fff1c9',Math.max(1,k*.06));ellipse(...p(5.25,4.5),k*.13,k*.13,'#f4cb9d')})}
function drawTree(x,z,s){withDepth(z,s,()=>{const p=project(x,0,z,s),k=scale(z,s);line([[p[0],p[1]],[p[0],p[1]-2.6*k]],'#513c2c',Math.max(2,.19*k));ellipse(p[0],p[1]-2.85*k,.9*k,1.2*k,'#315c4c');ellipse(p[0]-.44*k,p[1]-2.7*k,.53*k,.8*k,'#4b8061');ellipse(p[0]+.38*k,p[1]-3.1*k,.58*k,.75*k,'#60916d')})}
function drawPerson(s){withDepth(0,s,()=>{const [x,y]=project(0,0,0,s),k=scale(0,s);ellipse(x,y+4,k*.65,k*.16,'#09261b66');ctx.fillStyle='#283b52';ctx.fillRect(x-.23*k,y-1.05*k,.18*k,1.06*k);ctx.fillRect(x+.06*k,y-1.05*k,.18*k,1.06*k);poly([[x-.45*k,y-1.06*k],[x+.45*k,y-1.06*k],[x+.34*k,y-2.35*k],[x-.34*k,y-2.35*k]],'#eb755d');line([[x-.37*k,y-2.2*k],[x-.58*k,y-1.45*k]],'#efab85',Math.max(2,.16*k));line([[x+.37*k,y-2.2*k],[x+.58*k,y-1.5*k]],'#efab85',Math.max(2,.16*k));ellipse(x,y-2.65*k,.31*k,.37*k,'#e8a67d');ellipse(x,y-2.91*k,.32*k,.17*k,'#493838')})}
function drawFlower(s){withDepth(-.75,s,()=>{const p=project(-1.25,0,-.75,s),k=scale(-.75,s);line([[p[0],p[1]],[p[0],p[1]-1.25*k]],'#437c4d',Math.max(2,.07*k));ellipse(p[0]-.25*k,p[1]-.55*k,.27*k,.12*k,'#5b995f');for(let i=0;i<6;i++){let a=i*Math.PI/3;ellipse(p[0]+Math.cos(a)*.28*k,p[1]-1.35*k+Math.sin(a)*.28*k,.26*k,.17*k,'#f17c9a')}ellipse(p[0],p[1]-1.35*k,.2*k,.2*k,'#ffe385')})}
function drawLabels(s){ctx.filter='none';ctx.font='bold 16px system-ui';ctx.textAlign='center';const items=[['flower',-1.25,-.75,'近处花朵'],['person',0,0,'人物'],['house',5.2,8,'远处房屋']];for(const [key,x,z,label] of items){let [px,py]=project(x,0,z,s),height=key==='person'?3.3:key==='house'?4.8:1.9,y=py-height*scale(z,s)-28;px=Math.max(65,Math.min(W-65,px));y=Math.max(63,Math.min(H-48,y));let active=selected===key;ctx.fillStyle=active?'#143a53dd':'#0b1b2bbb';ctx.strokeStyle=active?'#a9e8ff':'#ffffff80';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(px-52,y-16,104,30,9);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(label,px,y+5);if(active){ctx.strokeStyle='#bcefff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py-height*.45*scale(z,s),key==='person'?48:28,0,Math.PI*2);ctx.stroke()}}}
function render(){const s=state();layerIndex=0;ctx=canvas.getContext('2d');ctx.clearRect(0,0,W,H);drawSky();drawMountain(s);drawGround(s);drawRoad(s);drawFence(s);drawHouse(s);drawTree(-6,6,s);drawTree(9,13,s);drawTree(-3,2,s);drawPerson(s);drawFlower(s);drawLabels(s);for(let i=layerIndex+1;i<layers.length;i++)layers[i].style.display='none';updateUI(s)}
function fmt(m){return m.toFixed(1)+' m'}
function updateUI(s){const focus=depth(targets[selected].z,s),Hf=s.f*s.f/(s.n*.03)+s.f,mm=focus*1000,near=Hf*mm/(Hf+(mm-s.f)),far=Hf<=mm-s.f?Infinity:Hf*mm/(Hf-(mm-s.f)),range=far===Infinity?'远至无限远':fmt((far-near)/1000);const angle=2*Math.atan(36/(2*s.f))*180/Math.PI;const mRatio=scale(30,s)/scale(0,s);el('focalValue').textContent=s.f+' mm';el('apertureValue').textContent='f/'+s.n.toFixed(1);el('cameraDistance').textContent=fmt(s.camera);el('viewTag').textContent=s.f+' mm · '+(s.f<35?'广角透视':s.f>100?'长焦压缩':'自然视角');el('perspectiveLabel').textContent=s.f<35?'近大远小更明显':s.f>100?'远景显得更近、更大':'自然透视';el('angleValue').textContent=angle.toFixed(1)+'°';el('mountainValue').textContent=(mRatio*100).toFixed(0)+'%';el('dofValue').textContent=range;el('focusReadout').textContent='正在对焦：'+targets[selected].label+' · '+fmt(focus);el('flowerDist').textContent=fmt(depth(-.75,s));el('personDist').textContent=fmt(s.camera);el('houseDist').textContent=fmt(depth(8,s));el('depthMarker').style.left=targets[selected].marker;document.querySelectorAll('.focus-choice').forEach(b=>{const active=b.dataset.focus===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});const bg=blurAt(8,s),subject=blurAt(0,s),score=Math.min(100,Math.round((selected==='person'?35:0)+Math.min(45,bg*4)+Math.max(0,20-subject*6)));el('score').textContent=score+' 分';let won=selected==='person'&&score>=85;el('challenge').classList.toggle('won',won);el('challengeText').textContent=won?'成功！人物清楚，房屋柔化。再切换广角与长焦，比较山和房屋的大小。':'让人物清楚、房屋虚化：先对焦人物，再试试长焦与大光圈。'}
el('focal').addEventListener('input',render);el('aperture').addEventListener('input',render);document.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.focus;render()}));document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const [f,n,focus]=b.dataset.preset.split(',');el('focal').value=f;el('aperture').value=n;selected=focus;render()}));canvas.addEventListener('click',event=>{const box=canvas.getBoundingClientRect(),x=(event.clientX-box.left)/box.width*W,y=(event.clientY-box.top)/box.height*H,s=state();let spots=[['flower',-1.25,-.75,1.3],['person',0,0,2],['house',5.2,8,3]];let nearest=spots.map(([key,wx,z,high])=>{let p=project(wx,0,z,s),cy=p[1]-high*scale(z,s),d=Math.hypot((x-p[0])*.9,y-cy);return {key,d}}).sort((a,b)=>a.d-b.d)[0];if(nearest.d<160){selected=nearest.key;render()}});render();
