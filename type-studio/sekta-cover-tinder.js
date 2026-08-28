const STORE="sekta-cover-tinder-v2",LEGACY="sekta-system-cell-v1";
const $=s=>document.querySelector(s),clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),copy=o=>JSON.parse(JSON.stringify(o));
const headlines=["Пропустили пять дней? Ничего не сломалось","После паузы хочется догнать","Компенсация превращает движение в долг","Возвращаем не форму. Возвращаем контакт","Выберите знакомые 10–15 минут","Снизьте привычную интенсивность","Закончите раньше, чем захочется доказать","Хорошее возвращение хочется повторить","Знакомо · коротко · посильно","Движение не обязано быть полезным всегда"];
const pairs=[
  {id:"onest-golos",head:"Onest",body:"Golos Text",weight:760,leading:.89,tracking:-.028,min:8.4,max:15.4,case:"upper",label:"Ясно и современно"},
  {id:"geologica-golos",head:"Geologica",body:"Golos Text",weight:760,leading:.87,tracking:-.026,min:8.2,max:15.1,case:"upper",label:"Живая кириллица"},
  {id:"commissioner-golos",head:"Commissioner",body:"Golos Text",weight:740,leading:.91,tracking:-.022,min:8.2,max:14.8,case:"upper",label:"Редакционный голос"},
  {id:"unbounded-manrope",head:"Unbounded",body:"Manrope",weight:620,leading:.96,tracking:-.012,min:6.8,max:10.5,case:"upper",label:"Короткий манифест"},
  {id:"literata-golos",head:"Literata",body:"Golos Text",weight:610,leading:.96,tracking:-.014,min:8.6,max:14.3,case:"original",label:"Личная интонация"},
  {id:"manrope-golos",head:"Manrope",body:"Golos Text",weight:780,leading:.9,tracking:-.03,min:8.2,max:15.3,case:"upper",label:"Чистая спортивная база"},
  {id:"prata-golos",head:"Prata",body:"Golos Text",weight:400,leading:.98,tracking:-.012,min:7.8,max:13.1,case:"original",label:"Журнальный контраст"},
  {id:"cormorant-onest",head:"Cormorant",body:"Onest",weight:650,leading:.88,tracking:-.02,min:9,max:16.2,case:"original",label:"Эмоциональный редакционный"},
  {id:"shantell-golos",head:"Shantell Sans",body:"Golos Text",weight:680,leading:.94,tracking:-.012,min:8,max:14.4,case:"original",label:"Живая заметка"},
  {id:"geologica-onest",head:"Geologica",body:"Onest",weight:690,leading:.9,tracking:-.024,min:8.3,max:15.2,case:"original",label:"Мягче и разговорнее"},
  {id:"commissioner-manrope",head:"Commissioner",body:"Manrope",weight:820,leading:.88,tracking:-.028,min:8.1,max:14.7,case:"upper",label:"Собранный плакат"},
  {id:"onest-onest",head:"Onest",body:"Onest",weight:690,leading:.92,tracking:-.022,min:8.3,max:15.7,case:"original",label:"Один спокойный голос"}
];
const palettes=[
  {id:"coal-lime",name:"Уголь + лайм",text:"#fbf7ef",accent:"#e4f58b",accentText:"#17221f",field:"#e4f58b",shade:58},
  {id:"milk-yellow",name:"Молочный + жёлтый",text:"#fffaf0",accent:"#ffe36a",accentText:"#17221f",field:"#ffe36a",shade:50},
  {id:"pink-coal",name:"Розовый + уголь",text:"#fbf7ef",accent:"#f481b5",accentText:"#17221f",field:"#f481b5",shade:54},
  {id:"mint-ink",name:"Мята + уголь",text:"#ffffff",accent:"#62d9a4",accentText:"#17221f",field:"#62d9a4",shade:56},
  {id:"blue-milk",name:"Синий + молочный",text:"#fffaf0",accent:"#3959e8",accentText:"#ffffff",field:"#3959e8",shade:59},
  {id:"sky-yellow",name:"Небо + жёлтый",text:"#ffffff",accent:"#c8edf2",accentText:"#17221f",field:"#c8edf2",shade:52},
  {id:"mono-lime",name:"Чёрный + лайм",text:"#ffffff",accent:"#d7ff3f",accentText:"#101512",field:"#d7ff3f",shade:68},
  {id:"rose-milk",name:"Роза + молочный",text:"#fffaf0",accent:"#efb6ca",accentText:"#3b242d",field:"#efb6ca",shade:48}
];
const scenes=[{id:"photo",name:"Текст на фото"},{id:"plate",name:"Большая плашка"},{id:"split",name:"Фото + поле"},{id:"editorial",name:"Редакционный титр"}];
const staticPhotos=[
  {id:"ideal-gym",name:"Оля · зал",category:"Тело и тренировки",src:"../assets/ideal/18_gym.jpg"},
  {id:"ideal-balance",name:"Баланс",category:"Тело и тренировки",src:"../assets/ideal/21_balance.jpg"},
  {id:"ideal-halo",name:"Портрет",category:"Оля · портреты",src:"../assets/ideal/20_halo.jpg"}
];

function buildPhotos(){
  const items=window.SEKTA_LIBRARY?.items||[];
  const bad=/(before|after|progress|comparison|скрин|screenshot|горизонталь|обложк[аи] курс|трус|бель[её]|(^|[^а-я])до([^а-я]|$)|после)/i;
  const eligible=items.filter(i=>!i.isUtility&&(i.agentScore||0)>.69&&!bad.test([i.folderLabel,i.fileName,i.sourceCategory,i.contentThemes,i.carouselRoles,String(i.folderLabel).toLowerCase()==="дизайнерские снепы"?"снеп":""].flat().join(" "))&&i.width>650&&i.height>700);
  const buckets={camp:[],body:[],portrait:[],mother:[],neuro:[],other:[]};
  for(const i of eligible){
    const hay=[i.folderLabel,i.sourceCategory,i.contentThemes,i.carouselRoles,i.collections].flat().join(" ").toLowerCase();
    const key=/camp|лагер/.test(hay)?"camp":/беремен|материн|ребен|семь/.test(hay)?"mother":/трен|спорт|движ|тело/.test(hay)?"body":/нейро|ai|генер/.test(hay)?"neuro":/портрет|личн|olya|оля/.test(hay)?"portrait":"other";
    buckets[key].push(i);
  }
  Object.values(buckets).forEach(a=>a.sort((x,y)=>(y.agentScore||0)-(x.agentScore||0)));
  const picked=[];
  for(let round=0;round<8;round++)for(const key of ["camp","body","portrait","mother","neuro","other"]){
    const i=buckets[key][round];if(i)picked.push({id:i.id,name:String(i.fileName||i.id).replace(/\.[^.]+$/,"") ,category:i.folderLabel||i.sourceCategory||"Медиатека",src:`../${i.thumb}`});
  }
  return [...staticPhotos,...picked];
}
const photos=buildPhotos();
const fallback={layoutVersion:4,cursor:0,photoId:photos[0].id,pairId:"geologica-golos",paletteId:"coal-lime",sceneId:"photo",headline:headlines[0],service:"Без наказания и нового понедельника",titleX:8,titleY:46,titleWidth:84,photoX:50,photoY:52,zoom:100,shade:58,plateOpacity:94,autoSize:true,size:13,computedSize:13,titleWeight:760,titleLeading:.87,titleTracking:-.026,titleCase:"upper",liked:[],removedPairs:[],rejected:[],history:[],systemPairId:"geologica-golos",gridSeed:0,gridPreviewCells:null,savedSystems:[]};
function load(){
  try{const saved=JSON.parse(localStorage.getItem(STORE));if(saved){const merged={...fallback,...saved};if((saved.layoutVersion||0)<3){merged.titleY=merged.sceneId==="split"?62:merged.sceneId==="plate"?44:46;merged.autoSize=true}merged.layoutVersion=4;return merged}}catch{}
  try{const old=JSON.parse(localStorage.getItem(LEGACY));if(old)return {...fallback,headline:old.headline||fallback.headline,service:old.service||fallback.service,pairId:old.system==="onest"?"onest-golos":fallback.pairId,paletteId:old.plateColor==="#f481b5"?"pink-coal":fallback.paletteId,sceneId:old.surface==="plate"?"plate":"photo",titleY:old.copyY||fallback.titleY,shade:Number(old.shade)<1?Math.round(Number(old.shade)*100):Number(old.shade)||fallback.shade}}catch{}
  return copy(fallback);
}
let state=load(),fitToken=0,gridFitToken=0,photoStripStart=0;
const lockedPair=pairs.find(p=>p.id===state.systemPairId)||pairs.find(p=>p.id==="geologica-golos")||pairs[0];state.systemPairId=lockedPair.id;state.pairId=lockedPair.id;state.titleWeight=Number.isFinite(state.titleWeight)?state.titleWeight:lockedPair.weight;state.titleLeading=Number.isFinite(state.titleLeading)?state.titleLeading:lockedPair.leading;state.titleTracking=Number.isFinite(state.titleTracking)?state.titleTracking:lockedPair.tracking;state.titleCase=["upper","original"].includes(state.titleCase)?state.titleCase:lockedPair.case;
const cell=$("#postCell"),photo=$("#postPhoto"),headline=$("#headline"),layer=$("#titleLayer"),service=$("#service");
const pair=()=>pairs.find(p=>p.id===state.pairId)||pairs[0],palette=()=>palettes.find(p=>p.id===state.paletteId)||palettes[0],scene=()=>scenes.find(s=>s.id===state.sceneId)||scenes[0],currentPhoto=()=>photos.find(p=>p.id===state.photoId)||photos[0];
function maxTitleY(){return cell.clientHeight?clamp(96-layer.scrollHeight/cell.clientHeight*100,8,87):87}
function persist(){localStorage.setItem(STORE,JSON.stringify(state));$("#saveStatus").classList.add("is-saved");$("#saveStatus").textContent="Сохранено автоматически"}
function rgba(hex,alpha){const v=hex.replace("#","");const n=parseInt(v.length===3?v.split("").map(x=>x+x).join(""):v,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${alpha})`}
function setVars(){
  const p=pair(),c=palette();
  cell.style.setProperty("--head",`"${p.head}"`);cell.style.setProperty("--body",`"${p.body}"`);cell.style.setProperty("--title-size",state.computedSize||state.size);cell.style.setProperty("--title-weight",state.titleWeight);cell.style.setProperty("--title-leading",state.titleLeading);cell.style.setProperty("--title-tracking",`${state.titleTracking}em`);cell.style.setProperty("--title-x",state.titleX);cell.style.setProperty("--title-y",state.titleY);cell.style.setProperty("--title-width",state.titleWidth);cell.style.setProperty("--photo-x",`${state.photoX}%`);cell.style.setProperty("--photo-y",`${state.photoY}%`);cell.style.setProperty("--shade",state.shade/100);cell.style.setProperty("--text",c.text);cell.style.setProperty("--accent",rgba(c.accent,state.plateOpacity/100));cell.style.setProperty("--accent-text",c.accentText);cell.style.setProperty("--field",c.field);cell.dataset.scene=state.sceneId;cell.dataset.case=state.titleCase;
  photo.src=currentPhoto().src;photo.style.transform=`scale(${state.zoom/100})`;headline.textContent=state.headline;service.textContent=state.service;
}
function fitHeadline(force=false){
  clearTimeout(fitToken);fitToken=setTimeout(()=>{
    const p=pair();let size=state.autoSize||force?p.max:state.size;const maxH=cell.clientHeight*Math.max(.18,(86-state.titleY)/100);
    for(let i=0;i<44;i++){cell.style.setProperty("--title-size",size);if(layer.scrollHeight<=maxH&&headline.scrollWidth<=layer.clientWidth+2)break;size-=.25;if(size<=p.min){size=p.min;break}}
    state.computedSize=Number(size.toFixed(2));if(state.autoSize)state.size=state.computedSize;cell.style.setProperty("--title-size",state.computedSize);
    const safeY=maxTitleY();if(state.titleY>safeY){state.titleY=safeY;cell.style.setProperty("--title-y",state.titleY)}
    const availableH=cell.clientHeight*Math.max(0,(96-state.titleY)/100),overflow=layer.scrollHeight>availableH+3||headline.scrollWidth>layer.clientWidth+2;
    $("#fitState").textContent=overflow?"Тексту тесно":"Размер подобран";$("#fitState").classList.toggle("warn",overflow);$("#likeButton").disabled=overflow;$("#likeButton").title=overflow?"Уменьшите текст или поднимите заголовок":"";$("#effectiveSize").textContent=`≈ ${Math.round(state.computedSize*10.8)} px в PNG`;$("#sizeValue").textContent=`${state.computedSize.toFixed(1)}%`;$("#sizeInput").value=state.computedSize;persist();
  },40);
}
function renderPhotos(){const visible=[];for(let i=0;i<6;i++)visible.push(photos[(photoStripStart+i)%photos.length]);$("#photoStrip").innerHTML=visible.map(p=>`<button type="button" class="photo-choice${p.id===state.photoId?" is-active":""}" data-photo="${p.id}" aria-label="${p.name}"><img src="${p.src}" alt=""></button>`).join("")}
function renderTypeControls(){
  $("#lockedTypeName").textContent=lockedPair.head;$("#lockedTypeName").style.fontFamily=`"${lockedPair.head}"`;$("#lockedTypeCompanion").textContent=`заголовок · ${lockedPair.body} для служебного текста`;$("#weightInput").value=state.titleWeight;$("#weightValue").textContent=Math.round(state.titleWeight);$("#leadingInput").value=state.titleLeading;$("#leadingValue").textContent=state.titleLeading.toFixed(2);$("#trackingInput").value=state.titleTracking;$("#trackingValue").textContent=state.titleTracking.toFixed(3).replace("-","−");document.querySelectorAll("[data-title-case]").forEach(b=>b.classList.toggle("is-active",b.dataset.titleCase===state.titleCase));
}
function renderPalettes(){$("#paletteSwatches").innerHTML=palettes.map(p=>`<button type="button" class="swatch${p.id===state.paletteId?" is-active":""}" style="--swatch:${p.accent}" data-palette="${p.id}" aria-label="${p.name}" title="${p.name}"></button>`).join("")}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c])}
function mini(v){const p=pairs.find(x=>x.id===v.pairId)||lockedPair,c=palettes.find(x=>x.id===v.paletteId)||palettes[0],ph=photos.find(x=>x.id===v.photoId)||photos[0],titleCase=v.titleCase||p.case;return `<div class="mini" data-scene="${v.sceneId}" style="--mini-accent:${c.accent};--mini-ink:${c.accentText};--mini-text:${c.text};--mini-font:'${p.head}';--mini-weight:${v.titleWeight||p.weight};--mini-leading:${v.titleLeading||p.leading};--mini-tracking:${Number.isFinite(v.titleTracking)?v.titleTracking:p.tracking}em;--mini-case:${titleCase==='upper'?'uppercase':titleCase==='lower'?'lowercase':'none'};--mini-y:${v.titleY}%"><img src="${ph.src}" alt=""><div class="mini-title">${escapeHtml(v.headline)}</div></div>`}
function renderSaved(){const grid=$("#savedGrid");grid.innerHTML=state.liked.length?state.liked.map((v,i)=>`<article class="saved-card">${mini(v)}<div class="saved-meta"><strong>${(pairs.find(p=>p.id===v.pairId)||pairs[0]).head} · ${(palettes.find(p=>p.id===v.paletteId)||palettes[0]).name}</strong><div class="saved-actions"><button type="button" data-open="${i}">Открыть</button><button class="delete" type="button" data-delete="${i}">Удалить</button></div></div></article>`).join(""):`<div class="saved-empty">Пока пусто. Нажмите «Нравится — сохранить», и первая обложка появится здесь.</div>`;$("#likedCount").textContent=state.liked.length}
function pairStats(){
  const groups=new Map();
  for(const v of state.liked){const source=pairs.find(p=>p.id===v.pairId)||pairs[0],preferred=pairs.find(p=>p.head===source.head&&p.body==="Golos Text")||source,current=groups.get(source.head)||{...preferred,count:0};current.count++;groups.set(source.head,current)}
  return [...groups.values()].sort((a,b)=>b.count-a.count||a.head.localeCompare(b.head,"ru"));
}
function buildGridCells(){
  if(Array.isArray(state.gridPreviewCells)&&state.gridPreviewCells.length===9)return copy(state.gridPreviewCells).map(v=>({...v,pairId:lockedPair.id,titleWeight:state.titleWeight,titleLeading:state.titleLeading,titleTracking:state.titleTracking,titleCase:state.titleCase}));
  const liked=state.liked.length?state.liked:[snapshot()],photoSources=[],seenPhotos=new Set();
  for(const source of liked){if(!seenPhotos.has(source.photoId)){photoSources.push(copy(source));seenPhotos.add(source.photoId)}}
  for(const item of photos){if(photoSources.length>=9)break;if(!seenPhotos.has(item.id)){photoSources.push({...copy(liked[0]),photoId:item.id});seenPhotos.add(item.id)}}
  const uniqueHeads=[...new Set([...liked.map(v=>v.headline),...headlines])],offset=(state.gridSeed*3)%photoSources.length,headOffset=(state.gridSeed*2)%uniqueHeads.length;
  const scenesGrid=["photo","plate","photo","photo","plate","photo","photo","plate","photo"];
  const paletteGrid=["milk-yellow","pink-coal","mint-ink","mint-ink","milk-yellow","pink-coal","pink-coal","mint-ink","milk-yellow"];
  const positions=[62,62,62,41,41,41,18,18,18],cells=[];
  for(let i=0;i<9;i++){
    const source=copy(photoSources[(offset+i)%photoSources.length]);
    cells.push({...source,pairId:state.systemPairId,headline:uniqueHeads[(headOffset+i)%uniqueHeads.length],sceneId:scenesGrid[i],paletteId:paletteGrid[i],titleX:7,titleWidth:86,titleY:positions[i],titleWeight:state.titleWeight,titleLeading:state.titleLeading,titleTracking:state.titleTracking,titleCase:state.titleCase,gridIndex:i+1});
  }
  return cells;
}
function gridCell(v){const p=pairs.find(x=>x.id===v.pairId)||pairs[0],c=palettes.find(x=>x.id===v.paletteId)||palettes[0],ph=photos.find(x=>x.id===v.photoId)||photos[0],weight=v.titleWeight||p.weight,leading=v.titleLeading||p.leading,tracking=Number.isFinite(v.titleTracking)?v.titleTracking:p.tracking,titleCase=v.titleCase||p.case;return `<article class="feed-cell" data-grid-scene="${v.sceneId}" data-grid-case="${titleCase}" data-anchor-y="${v.titleY}" style="--grid-head:'${p.head}';--grid-weight:${weight};--grid-leading:${leading};--grid-tracking:${tracking}em;--grid-text:${c.text};--grid-accent:${c.accent};--grid-ink:${c.accentText};--grid-y:${v.titleY}%;--crop-x:${v.photoX||50}%;--crop-y:${v.photoY||50}%"><img src="${ph.src}" alt=""><div class="feed-cell-shade"></div><div class="feed-cell-field"></div><span class="feed-brand">@SEKTASCHOOL</span><i class="feed-accent" aria-hidden="true"></i><div class="feed-copy">${escapeHtml(v.headline)}</div><span class="feed-index">${String(v.gridIndex).padStart(2,"0")}</span></article>`}
function fitGridCells(){
  const cells=[...document.querySelectorAll(".feed-cell")],fitted=[];let hasOverflow=false;
  for(const gridCellEl of cells){const copyEl=gridCellEl.querySelector(".feed-copy"),height=gridCellEl.clientHeight,width=gridCellEl.clientWidth;if(!height||!width)continue;const requestedY=parseFloat(gridCellEl.style.getPropertyValue("--grid-y"))||45,bottom=height*.94,minSize=width*.052;let size=width*.083;
    for(let i=0;i<50;i++){copyEl.style.setProperty("--grid-size",`${size}px`);const top=height*requestedY/100;if(copyEl.scrollHeight<=bottom-top&&copyEl.scrollWidth<=copyEl.clientWidth+1)break;size-=.4;if(size<=minSize){size=minSize;break}}
    fitted.push(size);
  }
  const systemSize=fitted.length?Math.min(...fitted):0;
  for(const gridCellEl of cells){const copyEl=gridCellEl.querySelector(".feed-copy"),height=gridCellEl.clientHeight;if(!height)continue;copyEl.style.setProperty("--grid-size",`${systemSize}px`);const requestedY=Number(gridCellEl.dataset.anchorY)||parseFloat(gridCellEl.style.getPropertyValue("--grid-y"))||45,bottom=height*.94,safeY=clamp((bottom-copyEl.scrollHeight)/height*100,7,requestedY);gridCellEl.style.setProperty("--grid-y",`${safeY}%`);const available=bottom-height*safeY/100,overflow=copyEl.scrollHeight>available+1||copyEl.scrollWidth>copyEl.clientWidth+1;gridCellEl.dataset.overflow=overflow;hasOverflow=hasOverflow||overflow}
  state.gridHasOverflow=hasOverflow;$("#saveGridButton").disabled=!state.liked.length||hasOverflow;if(hasOverflow)$("#gridNotice").textContent="Одной ячейке тесно — выберите другой шрифт или раскладку";else if($("#gridNotice").textContent.includes("тесно"))$("#gridNotice").textContent="";
}
function scheduleGridFit(){$("#saveGridButton").disabled=true;cancelAnimationFrame(gridFitToken);gridFitToken=requestAnimationFrame(()=>{fitGridCells();if(document.fonts?.ready)document.fonts.ready.then(fitGridCells)})}
function renderGridLab(){
  state.systemPairId=lockedPair.id;state.pairId=lockedPair.id;$("#gridSystemName").textContent=`${lockedPair.head} × ${lockedPair.body}`;$("#gridSystemReason").textContent="типографика зафиксирована";
  $("#systemFonts").innerHTML=`<div class="system-font is-active"><strong style="font-family:'${lockedPair.head}'">${lockedPair.head}</strong><span>единая система</span></div>`;
  const cells=buildGridCells();$("#feedGrid").innerHTML=state.liked.length?cells.map(gridCell).join(""):`<div class="saved-empty">Сначала сохраните хотя бы одну обложку выше.</div>`;
  scheduleGridFit();
  $("#savedSystems").innerHTML=state.savedSystems.length?`<div class="saved-system-title">Сохранённые девятки</div>`+state.savedSystems.map((g,i)=>`<div class="saved-system"><div><strong>Сетка ${String(i+1).padStart(2,"0")} · ${(pairs.find(p=>p.id===g.pairId)||pairs[0]).head}</strong><span>${new Date(g.savedAt).toLocaleDateString("ru-RU")}</span></div><button type="button" data-open-system="${i}">Открыть</button></div>`).join(""):"";
}
function render(){
  state.pairId=lockedPair.id;state.systemPairId=lockedPair.id;
  const p=pair(),c=palette(),s=scene(),ph=currentPhoto();state.pairId=lockedPair.id;state.systemPairId=lockedPair.id;setVars();$("#headlineInput").value=state.headline;$("#autoSizeInput").checked=state.autoSize;$("#sizeInput").disabled=state.autoSize;$("#widthInput").value=state.titleWidth;$("#widthValue").textContent=`${state.titleWidth}%`;$("#zoomInput").value=state.zoom;$("#zoomValue").textContent=`${state.zoom}%`;$("#shadeInput").value=state.shade;$("#shadeValue").textContent=`${state.shade}%`;$("#plateInput").value=state.plateOpacity;$("#plateValue").textContent=`${state.plateOpacity}%`;$("#ideaName").textContent=`Идея ${String(state.cursor+1).padStart(2,"0")}`;$("#ideaMeta").textContent=`${ph.category} · ${p.head} × ${p.body}`;$("#photoCategory").textContent=ph.category;$("#photoQuick").textContent=ph.name;$("#paletteQuick").textContent=c.name;$("#pairQuick").textContent=p.head;$("#sceneQuick").textContent=s.name;renderPhotos();renderTypeControls();renderPalettes();renderSaved();renderGridLab();fitHeadline();
}
function snapshot(){return {cursor:state.cursor,photoId:state.photoId,pairId:state.pairId,paletteId:state.paletteId,sceneId:state.sceneId,headline:state.headline,service:state.service,titleX:state.titleX,titleY:state.titleY,titleWidth:state.titleWidth,photoX:state.photoX,photoY:state.photoY,zoom:state.zoom,shade:state.shade,plateOpacity:state.plateOpacity,autoSize:state.autoSize,size:state.size,computedSize:state.computedSize,titleWeight:state.titleWeight,titleLeading:state.titleLeading,titleTracking:state.titleTracking,titleCase:state.titleCase,savedAt:new Date().toISOString()}}
function signature(v=state){return [v.photoId,v.pairId,v.paletteId,v.sceneId,v.headline].join("|")}
function pushHistory(){state.history=(state.history||[]).slice(-9);state.history.push(snapshot())}
function nextIdea(reject=false){
  if(reject&&!state.rejected.includes(signature()))state.rejected.push(signature());pushHistory();let tries=0;
  do{state.cursor++;state.photoId=photos[(state.cursor*7)%photos.length].id;state.pairId=lockedPair.id;state.paletteId=palettes[(state.cursor*3)%palettes.length].id;state.sceneId=scenes[(state.cursor*3+1)%scenes.length].id;state.headline=headlines[state.cursor%headlines.length];state.titleX=state.sceneId==="editorial"?6:8;state.titleY=state.sceneId==="split"?62:state.sceneId==="plate"?44:46;state.titleWidth=state.sceneId==="editorial"?67:84;state.autoSize=true;state.zoom=100;state.photoX=50;state.photoY=52;state.shade=palette().shade;tries++}while(state.rejected.includes(signature())&&tries<80);
  photoStripStart=(state.cursor*6)%photos.length;render();persist();
}
function step(kind){
  if(kind==="photo"){const at=photos.findIndex(p=>p.id===state.photoId);state.photoId=photos[(at+1)%photos.length].id;photoStripStart=(at+1)%photos.length}
  else if(kind==="photo-page"){photoStripStart=(photoStripStart+6)%photos.length;renderPhotos();return}
  else if(kind==="palette"){const at=palettes.findIndex(p=>p.id===state.paletteId);state.paletteId=palettes[(at+1)%palettes.length].id;state.shade=palette().shade}
  else if(kind==="scene"){const at=scenes.findIndex(s=>s.id===state.sceneId);state.sceneId=scenes[(at+1)%scenes.length].id;state.titleY=state.sceneId==="split"?62:state.sceneId==="plate"?44:46}
  render();persist();
}

document.addEventListener("click",e=>{
  const q=e.target.closest("[data-step]");if(q)step(q.dataset.step);
  const ph=e.target.closest("[data-photo]");if(ph){state.photoId=ph.dataset.photo;render();persist()}
  const pa=e.target.closest("[data-palette]");if(pa){state.paletteId=pa.dataset.palette;state.shade=palette().shade;render();persist()}
  const tc=e.target.closest("[data-title-case]");if(tc){state.titleCase=tc.dataset.titleCase;state.gridPreviewCells=null;renderTypeControls();setVars();renderGridLab();fitHeadline();persist()}
});
$("#nextButton").addEventListener("click",()=>nextIdea(false));
$("#rejectButton").addEventListener("click",()=>nextIdea(true));
$("#likeButton").addEventListener("click",()=>{const sig=signature(),at=state.liked.findIndex(v=>signature(v)===sig);if(at>=0)state.liked[at]=snapshot();else state.liked.push(snapshot());state.gridPreviewCells=null;$("#notice").textContent="Сохранено в сетку";renderSaved();renderGridLab();persist();setTimeout(()=>{$("#notice").textContent="";nextIdea(false)},450)});
$("#headlineInput").addEventListener("input",e=>{state.headline=e.target.value;headline.textContent=state.headline;fitHeadline();persist()});
headline.addEventListener("input",()=>{state.headline=headline.textContent.trim();$("#headlineInput").value=state.headline;fitHeadline();persist()});
service.addEventListener("input",()=>{state.service=service.textContent.trim();persist()});
$("#autoSizeInput").addEventListener("change",e=>{state.autoSize=e.target.checked;$("#sizeInput").disabled=state.autoSize;fitHeadline(true);persist()});
$("#autoFitButton").addEventListener("click",()=>{state.autoSize=true;$("#autoSizeInput").checked=true;$("#sizeInput").disabled=true;fitHeadline(true)});
$("#sizeInput").addEventListener("input",e=>{state.autoSize=false;state.size=Number(e.target.value);state.computedSize=state.size;$("#autoSizeInput").checked=false;e.target.disabled=false;setVars();fitHeadline();persist()});
for(const [id,key] of [["#widthInput","titleWidth"],["#zoomInput","zoom"],["#shadeInput","shade"],["#plateInput","plateOpacity"]])$(id).addEventListener("input",e=>{state[key]=Number(e.target.value);render();persist()});
for(const [id,key,label,format] of [["#weightInput","titleWeight","#weightValue",v=>Math.round(v)],["#leadingInput","titleLeading","#leadingValue",v=>v.toFixed(2)],["#trackingInput","titleTracking","#trackingValue",v=>v.toFixed(3).replace("-","−")]]){
  $(id).addEventListener("input",e=>{state[key]=Number(e.target.value);$(label).textContent=format(state[key]);setVars();fitHeadline();persist()});
  $(id).addEventListener("change",()=>{state.gridPreviewCells=null;renderGridLab();persist()});
}
$("#savedGrid").addEventListener("click",e=>{const o=e.target.closest("[data-open]"),d=e.target.closest("[data-delete]");if(o){const v=copy(state.liked[Number(o.dataset.open)]);Object.assign(state,v);render();persist();window.scrollTo({top:0,behavior:"smooth"})}if(d){state.liked.splice(Number(d.dataset.delete),1);state.gridPreviewCells=null;renderSaved();renderGridLab();persist()}});
$("#remixGridButton").addEventListener("click",()=>{state.gridSeed++;state.gridPreviewCells=null;renderGridLab();persist()});
$("#saveGridButton").addEventListener("click",()=>{if(!state.liked.length||state.gridHasOverflow)return;const cells=buildGridCells();state.savedSystems.push({pairId:state.systemPairId,seed:state.gridSeed,cells:copy(cells),savedAt:new Date().toISOString()});$("#gridNotice").textContent="Девятка сохранена как цельная система";renderGridLab();persist()});
$("#savedSystems").addEventListener("click",e=>{const b=e.target.closest("[data-open-system]");if(!b)return;const g=state.savedSystems[Number(b.dataset.openSystem)];state.systemPairId=g.pairId;state.gridSeed=g.seed;state.gridPreviewCells=copy(g.cells);renderGridLab();persist()});
$("#exportButton").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:4,exportedAt:new Date().toISOString(),liked:state.liked,systemPairId:lockedPair.id,typography:{weight:state.titleWeight,leading:state.titleLeading,tracking:state.titleTracking,case:state.titleCase},savedSystems:state.savedSystems},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sekta-cover-tinder-liked.json";a.click();URL.revokeObjectURL(a.href)});
$("#importButton").addEventListener("click",()=>$("#importInput").click());
$("#importInput").addEventListener("change",async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data.liked))throw Error();state.liked=data.liked;state.systemPairId=lockedPair.id;state.pairId=lockedPair.id;if(data.typography){state.titleWeight=Number(data.typography.weight)||state.titleWeight;state.titleLeading=Number(data.typography.leading)||state.titleLeading;state.titleTracking=Number.isFinite(Number(data.typography.tracking))?Number(data.typography.tracking):state.titleTracking;state.titleCase=["upper","original"].includes(data.typography.case)?data.typography.case:state.titleCase}state.savedSystems=Array.isArray(data.savedSystems)?data.savedSystems:state.savedSystems;state.gridPreviewCells=null;render();persist();$("#notice").textContent="Сетка загружена"}catch{$("#notice").textContent="Не удалось прочитать этот JSON"}e.target.value=""});

function dragTitle(){
  let start=null;
  layer.addEventListener("pointerdown",e=>{if(e.button!==0)return;start={id:e.pointerId,x:e.clientX,y:e.clientY,tx:state.titleX,ty:state.titleY,moved:false};layer.setPointerCapture(e.pointerId)});
  layer.addEventListener("pointermove",e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y,dist=Math.hypot(dx,dy);if(dist<5)return;start.moved=true;layer.classList.add("is-dragging");const sensitivity=e.shiftKey?.25:Math.min(1,.5+dist/140);state.titleX=clamp(start.tx+dx/cell.clientWidth*100*sensitivity,2,98-state.titleWidth);state.titleY=clamp(start.ty+dy/cell.clientHeight*100*sensitivity,8,maxTitleY());setVars();fitHeadline()});
  const end=e=>{if(!start||e.pointerId!==start.id)return;layer.classList.remove("is-dragging");if(start.moved)e.preventDefault();start=null;persist()};layer.addEventListener("pointerup",end);layer.addEventListener("pointercancel",end);
}
function dragPhoto(){
  let start=null;cell.addEventListener("pointerdown",e=>{if(e.target.closest(".title-layer,.service"))return;start={id:e.pointerId,x:e.clientX,y:e.clientY,px:state.photoX,py:state.photoY};cell.setPointerCapture(e.pointerId)});
  cell.addEventListener("pointermove",e=>{if(!start||e.pointerId!==start.id)return;state.photoX=clamp(start.px-(e.clientX-start.x)/cell.clientWidth*55,0,100);state.photoY=clamp(start.py-(e.clientY-start.y)/cell.clientHeight*55,0,100);setVars()});
  const end=e=>{if(start&&e.pointerId===start.id){start=null;persist()}};cell.addEventListener("pointerup",end);cell.addEventListener("pointercancel",end);
}
photo.addEventListener("error",()=>{photo.src=staticPhotos[0].src});window.addEventListener("resize",()=>{fitHeadline();scheduleGridFit()});if("ResizeObserver" in window){new ResizeObserver(()=>fitHeadline()).observe(cell);new ResizeObserver(scheduleGridFit).observe($("#feedGrid"))}dragTitle();dragPhoto();render();persist();
