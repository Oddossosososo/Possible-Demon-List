/* Possible — application logic. Supabase and YouTube libraries load before this file. */
const SUPABASE_URL = "https://pzjnoahhugdtdqlscvgp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TN3lOfoZFNGY7A7-CtBXbw_JqUCRnvF";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const API = {
  levels: SUPABASE_URL + "/functions/v1/get-possible-levels",
  changes: SUPABASE_URL + "/functions/v1/get-possible-changelog",
  community: SUPABASE_URL + "/functions/v1/community-lists",
  submissions: SUPABASE_URL + "/functions/v1/submission-api",
  staff: SUPABASE_URL + "/functions/v1/staff-api",
  admin: SUPABASE_URL + "/functions/v1/admin-api",
  completions: SUPABASE_URL + "/functions/v1/completion-api"
};

const COUNTRY_CODES=["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"];
const COUNTRY_DISPLAY_NAMES=new Intl.DisplayNames(["en"],{type:"region"});
function countryFlag(value){const code=String(value||"").trim().toUpperCase();return /^[A-Z]{2}$/.test(code)?String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0))):"🌐";}
const COUNTRY_OPTIONS=COUNTRY_CODES.map(code=>({value:code,label:COUNTRY_DISPLAY_NAMES.of(code)||code,flag:countryFlag(code)})).sort((a,b)=>a.label.localeCompare(b.label));
function countryCode(value){const raw=String(value||"").trim();if(!raw)return "";const upper=raw.toUpperCase();if(COUNTRY_CODES.includes(upper))return upper;const match=COUNTRY_OPTIONS.find(x=>x.label.toLowerCase()===raw.toLowerCase());return match?.value||"";}
function countryName(value){const code=countryCode(value);return code?(COUNTRY_OPTIONS.find(x=>x.value===code)?.label||code):String(value||"").trim();}
function countryOption(code){const x=COUNTRY_OPTIONS.find(v=>v.value===code);return x?x.flag+" "+x.label:"";}

const $ = id => document.getElementById(id);
const escapeHTML = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const completionCountrySelect=$("completionCountry");
if(completionCountrySelect){completionCountrySelect.innerHTML='<option value="">Choose your country</option>'+COUNTRY_OPTIONS.map(x=>'<option value="'+x.value+'">'+x.flag+' '+escapeHTML(x.label)+'</option>').join("");}
function normalizeCurrentWR(value){
  let s=String(value??"").trim();
  if(!s)return "";
  if(/^\d+(?:\.\d+)?%$/.test(s)) return s;
  if(/^\d+(?:\.\d+)?$/.test(s)) return s+"%";
  const m=s.match(/^(.*?)(\d+(?:\.\d+)?)\s*%?$/);
  if(m && /[A-Za-z]/.test(m[1])) return m[1].trimEnd()+" "+m[2]+"%";
  return s;
}
function bindPercentInput(){
  document.querySelectorAll('#adminDialogBody input[data-normalize="percent"]').forEach(el=>{
    el.addEventListener("blur",()=>{
      el.value=normalizeCurrentWR(el.value);
    });
  });
}
const toast = msg => { const x=$("toast"); x.textContent=msg; x.classList.add("show"); clearTimeout(window.__toast); window.__toast=setTimeout(()=>x.classList.remove("show"),3000); };

function debounce(fn,ms=450){
  let t=0;
  return (...args)=>{
    clearTimeout(t);
    t=setTimeout(()=>fn(...args),ms);
  };
}



let __adminDialogResolve=null;
let __adminDialogFields=[];

function closeAdminDialog(result=null){
  const modal=$("adminDialog");
  if(!modal)return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  if(__adminDialogResolve){const resolve=__adminDialogResolve;__adminDialogResolve=null;resolve(result);}
}

function openAdminDialog({title,subtitle="",fields=[],confirmText="Save",danger=false}){
  return new Promise(resolve=>{
    __adminDialogResolve=resolve;
    __adminDialogFields=fields;
    $("adminDialogTitle").textContent=title||"Admin action";
    $("adminDialogSubtitle").textContent=subtitle;
    $("adminDialogSubmit").textContent=confirmText;
    $("adminDialogSubmit").classList.toggle("dialog-danger",!!danger);

    const body=$("adminDialogBody");
    body.innerHTML='<div class="admin-dialog-grid">'+fields.map((f,i)=>`
      <div class="${f.wide?'wide':''}">
        <label>${escapeHTML(f.label||"Field")}</label>
        ${f.type==="textarea"
          ? `<textarea data-dialog-index="${i}" placeholder="${escapeHTML(f.placeholder||"")}">${escapeHTML(f.value??"")}</textarea>`
          : f.type==="select"
            ? `<select data-dialog-index="${i}" aria-label="${escapeHTML(f.label||"Choose an option")}">${(f.options||[]).map(o=>`<option value="${escapeHTML(o.value)}" ${String(o.value)===String(f.value)?"selected":""}>${escapeHTML(o.label)}</option>`).join("")}</select>`
            : `<input data-dialog-index="${i}" type="${f.type||"text"}" value="${escapeHTML(f.value??"")}" placeholder="${escapeHTML(f.placeholder||"")}" min="${f.min??""}" max="${f.max??""}" ${f.readonly?"readonly":""}>`}
      </div>`).join("")+'</div>';

    body.querySelectorAll('input[data-dialog-index],textarea[data-dialog-index]').forEach((el,i)=>{
      if(fields[i]?.normalize) el.dataset.normalize=fields[i].normalize;
    });
    $("adminDialog").classList.add("show");
    $("adminDialog").setAttribute("aria-hidden","false");
    bindPercentInput();
    const first=body.querySelector("input,textarea");
    setTimeout(()=>first?.focus(),0);
  });
}

$("adminDialogClose").onclick=()=>closeAdminDialog();
$("adminDialogCancel").onclick=()=>closeAdminDialog();
$("adminDialog").addEventListener("click",e=>{if(e.target.id==="adminDialog")closeAdminDialog();});
$("adminDialogSubmit").onclick=()=>{
  const result={};
  document.querySelectorAll("#adminDialogBody [data-dialog-index]").forEach(el=>{
    result[__adminDialogFields[Number(el.dataset.dialogIndex)]?.key]=el.value;
  });
  closeAdminDialog(result);
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if($("adminDialog")?.classList.contains("show"))closeAdminDialog();if($("videoModal")?.classList.contains("show"))closeVideo();}});
const fmtTime = v => { try { return new Date(v).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}); } catch { return v; } };
function youtubeId(url){
  const s=String(url||"").trim();
  if(!s)return "";
  const m=s.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  return m?m[1]:"";
}
function youtubeThumbnail(url){
  const id=youtubeId(url);
  return id ? "https://i.ytimg.com/vi/"+id+"/hqdefault.jpg" : "";
}
let __ytPlayer=null;
let __ytPlayerReady=false;
function initYouTubePlayer(){
  const frame=$("videoFrame");
  if(!frame || !window.YT?.Player || __ytPlayer)return;
  __ytPlayer=new YT.Player(frame,{
    host:"https://www.youtube-nocookie.com",
    playerVars:{autoplay:0,controls:1,rel:0,playsinline:1},
    events:{onReady:()=>{__ytPlayerReady=true;}}
  });
}
const __previousYouTubeReady=window.onYouTubeIframeAPIReady;
window.onYouTubeIframeAPIReady=function(){
  if(typeof __previousYouTubeReady==="function")__previousYouTubeReady();
  initYouTubePlayer();
};
if(window.YT?.Player)initYouTubePlayer();

function setupVideoPlayer(id){
  const frame=$("videoFrame");
  if(!frame || !id)return;
  if(__ytPlayerReady && __ytPlayer){
    // These calls happen directly inside the thumbnail click handler,
    // allowing the browser to treat playback as user-initiated.
    __ytPlayer.unMute();
    __ytPlayer.setVolume(100);
    __ytPlayer.loadVideoById(id);
    return;
  }
  frame.src="https://www.youtube.com/embed/"+encodeURIComponent(id)+"?autoplay=1&mute=0&controls=1&rel=0&playsinline=1";
}

function watchLevelVideo(url,title,levelName){
  const id=youtubeId(url);
  if(!id){toast("No YouTube video is attached to this level.");return;}
  const modal=$("videoModal");
  const titleEl=$("videoTitle");
  if(!modal)return;
  if(titleEl)titleEl.textContent=title||"Level video";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setupVideoPlayer(id);
}

function closeVideo(){
  const frame=$("videoFrame");
  if(__ytPlayerReady && __ytPlayer){__ytPlayer.stopVideo();}
  else if(frame)frame.src="about:blank";
  const modal=$("videoModal");
  if(modal){
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
  }
  document.body.style.overflow="";
}

const videoCloseButton=$("videoClose");
if(videoCloseButton)videoCloseButton.onclick=closeVideo;
const videoModal=$("videoModal");
if(videoModal)videoModal.addEventListener("click",e=>{if(e.target===videoModal)closeVideo()});

async function showView(name){
  if(name==="admin"){
    const s=await session();
    if(!s || !(await checkAdmin(s))){
      name="rankings";
      toast("Admin access required.");
    }
  }
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));
  document.querySelectorAll(".nav-btn[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  location.hash=name;
  if(name==="rankings") loadLevels();
  if(name==="creators" || name==="players") loadCommunity();
  if(name==="changes") loadChanges();
  if(name==="time-machine") initTimeMachine();
  if(name==="submit") loadSubmit();
  if(name==="staff") loadStaff();
  if(name==="admin") loadAdmin();
  if(name==="account") loadAccount();
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",e=>{
  e.preventDefault();
  const target=b.dataset.view;
  const menu=$("moreMenu");
  if(menu)menu.style.display="none";
  showView(target).catch(error=>{console.error("Navigation failed:",error);toast("That section could not be opened.");});
}));
document.querySelectorAll("[data-view-jump]").forEach(b=>b.addEventListener("click",e=>{
  e.preventDefault();
  showView(b.dataset.viewJump).catch(error=>{console.error("Navigation failed:",error);toast("That section could not be opened.");});
}));
window.addEventListener("popstate",()=>showView((location.hash||"#rankings").slice(1)));


window.copyLevelId=async function(value){const id=String(value||"").trim();if(!id){toast("No Geometry Dash ID is available.");return;}try{await navigator.clipboard.writeText(id);toast("Level ID "+id+" copied.");}catch(error){const field=document.createElement("textarea");field.value=id;field.style.position="fixed";field.style.opacity="0";document.body.appendChild(field);field.select();const copied=document.execCommand("copy");field.remove();toast(copied?"Level ID "+id+" copied.":"Could not copy this ID.");}};

let __levelsPromise=null;
let __allLevels=[];
let __myLevelProgress=new Map();

async function loadMyProgress(){
  __myLevelProgress=new Map();
  // Never let an auth/session request hold the public rankings hostage.
  const current=await Promise.race([
    session().catch(()=>null),
    new Promise(resolve=>setTimeout(()=>resolve(null),2200))
  ]);
  if(!current?.access_token)return;
  try{
    const response=await fetch(API.completions,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+current.access_token},cache:"no-store",signal:AbortSignal.timeout(7000)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Could not load personal progress");
    for(const row of result.data||[]){
      if(row.status!=="approved")continue;
      const key=String(row.level_id),old=__myLevelProgress.get(key);
      if(!old||Number(row.progress)>Number(old.progress))__myLevelProgress.set(key,row);
    }
  }catch(error){console.warn("Personal progress unavailable",error);}
}
let __levelFilter="all";
let __difficultyFilter="all";
const GD_DIFFICULTIES=["Grandpa Demon","Impossible Demon","Death Demon","WHY Demon","Easy","Normal","Hard","Harder","Insane","Easy Demon","Medium Demon","Hard Demon","Insane Demon","Extreme Demon"];
const DIFFICULTY_POINT_MULTIPLIERS={
  "extreme demon":1.0,
  "grandpa demon":1.9,"impossible demon":1.5,"death demon":1.2,"why demon":1.1,
  "insane demon":0.7,
  "hard demon":0.6,
  "medium demon":0.6,
  "easy demon":0.6,
  "insane":0.6,
  "harder":0.6,
  "hard":0.6,
  "normal":0.6,
  "easy":0.6
};
function getDifficultyMultiplier(difficulty){
  const key=String(difficulty??"").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DIFFICULTY_POINT_MULTIPLIERS,key)
    ? DIFFICULTY_POINT_MULTIPLIERS[key]
    : 1.0;
}
function getMaxPoints(rank,difficulty){
  const r=Number(rank);
  if(!Number.isInteger(r)||r<1||r>150)return 0;
  const baseRankPoints=350*Math.exp(-0.032*(r-1));
  return baseRankPoints*getDifficultyMultiplier(difficulty);
}

function levelDifficulty(level){
  const value=String(level.difficulty||level.gd_difficulty||"Extreme Demon").trim();
  return GD_DIFFICULTIES.find(d=>d.toLowerCase()===value.toLowerCase())||"Extreme Demon";
}
function renderLevels(){
  const el=$("rankings");
  const featuredBanner=$("featuredLevelBanner");
  if(featuredBanner){
    const featured=[...__allLevels].filter(x=>x.status!=="archived").sort((a,b)=>Number(a.current_rank||999999)-Number(b.current_rank||999999))[0];
    if(featured){
      const image=youtubeThumbnail(featured.verification_url)||featured.thumbnail_url||"";
      const featuredRank=Number(featured.current_rank)||1;
      featuredBanner.hidden=false;
      featuredBanner.innerHTML=`<button class="featured-level-inner" type="button" data-featured-level-id="${escapeHTML(featured.id)}">
        ${image?'<img class="featured-level-image" src="'+escapeHTML(image)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<div class="featured-level-image featured-level-placeholder"></div>'}
        <span class="featured-level-shade"></span>
        <span class="featured-level-copy"><span class="featured-eyebrow">CURRENT #1 · FEATURED LEVEL</span><strong>${escapeHTML(featured.name||"Unnamed level")}</strong><span>by ${escapeHTML(featured.creator||"Unknown creator")} · ${escapeHTML(levelDifficulty(featured))}</span><span class="featured-cta">VIEW LEVEL PROFILE <b>↗</b></span></span>
        <span class="featured-rank">#${featuredRank}</span>
      </button>`;
    }else{featuredBanner.hidden=true;featuredBanner.innerHTML="";}
  }
  const q=String($("levelSearch")?.value||"").trim().toLowerCase();
  // Read the live controls on every render so filtering never depends on
  // whether the data request finished before the user changed a selector.
  const statusFilter=String($("levelStatusFilter")?.value||__levelFilter||"all").toLowerCase();
  const difficultyFilter=String($("levelDifficultyFilter")?.value||__difficultyFilter||"all").trim().toLowerCase();
  const rows=__allLevels.filter(l=>{
    const personal=__myLevelProgress.get(String(l.id));
    const status=Number(personal?.progress)===100?"beaten":"unbeaten";
    const difficulty=levelDifficulty(l);
    const matchesStatus=statusFilter==="all" || status===statusFilter;
    const matchesDifficulty=difficultyFilter==="all" || difficulty.toLowerCase()===difficultyFilter;
    const hay=[l.name,l.creator,l.gd_level_id,l.current_wr,difficulty].join(" ").toLowerCase();
    return matchesStatus && matchesDifficulty && (!q || hay.includes(q));
  });
  const beaten=__allLevels.filter(x=>Number(__myLevelProgress.get(String(x.id))?.progress)===100).length;
  const unbeaten=__allLevels.length-beaten;
  $("levelCount").textContent=rows.length+" shown · "+unbeaten+" unbeaten · "+beaten+" beaten";
  el.innerHTML=rows.length?GD_DIFFICULTIES.filter(d=>rows.some(l=>levelDifficulty(l)===d)).map(d=>{
    const group=rows.filter(l=>levelDifficulty(l)===d).sort((a,b)=>Number(a.current_rank||999999)-Number(b.current_rank||999999));
    return `<section class="difficulty-group"><div class="difficulty-group-head"><h3>${d}</h3><span>${group.length} level${group.length===1?"":"s"} · independent ranking</span></div><div class="cards">${group.map((l,i)=>{
      const personal=__myLevelProgress.get(String(l.id));
      const isBeaten=Number(personal?.progress)===100;
      const rank=i+1;
      const thumbnail=youtubeThumbnail(l.verification_url)||l.thumbnail_url||"";
      return `<article class="level ${isBeaten?"level-beaten":""}" data-level-id="${escapeHTML(l.id)}" tabindex="0" aria-label="Open details for ${escapeHTML(l.name||"level")}">
        ${thumbnail?'<img class="level-card-background" src="'+escapeHTML(thumbnail)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':""}
        <div class="rank ${rank===1?"top":""}">#${rank}</div>
        ${thumbnail?'<div class="level-thumb" role="button" tabindex="0" aria-label="Watch '+escapeHTML(l.name||"Level")+'" onclick="event.stopPropagation();watchLevelVideo(this.dataset.url,this.dataset.title,this.dataset.levelName)" onkeydown="if(event.key===\'Enter\'||event.key===\' \')watchLevelVideo(this.dataset.url,this.dataset.title,this.dataset.levelName)" data-url="'+escapeHTML(l.verification_url||"")+'" data-title="'+escapeHTML(l.name||"Level")+'" data-level-name="'+escapeHTML(l.name||"")+'"><img src="'+escapeHTML(thumbnail)+'" alt="'+escapeHTML(l.name||"Level")+' thumbnail" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest(\'.level-thumb\').remove()"></div>':""}
        <div class="level-main"><div class="level-name">${escapeHTML(l.name||"Unnamed Level")}</div><div class="level-meta">by ${escapeHTML(l.creator||"Unknown Creator")}</div><div class="level-id">GD ID ${escapeHTML(l.gd_level_id??"—")}</div>${l.current_wr?'<div class="level-wr"><span>WR</span>'+escapeHTML(l.current_wr)+'</div>':""}</div>
        <div class="status ${isBeaten?"status-beaten":"status-unbeaten"}">${isBeaten?"✓ YOU BEAT IT":personal?"YOUR "+Number(personal.progress)+"%":"● NOT BEATEN"}</div>
      </article>`;
    }).join("")}</div></section>`;
  }).join(""):'<div class="empty">'+(__allLevels.length?'No levels match those filters. Try another search or difficulty.':'No levels ranked yet — check back soon!')+'</div>';
}
function bindRankingFilters(){
  const search=$("levelSearch"),status=$("levelStatusFilter"),difficulty=$("levelDifficultyFilter");
  if(search&&!search.dataset.bound){search.dataset.bound="1";search.addEventListener("input",renderLevels);}
  if(status&&!status.dataset.bound){status.dataset.bound="1";status.addEventListener("change",()=>{__levelFilter=status.value;renderLevels();});}
  if(difficulty&&!difficulty.dataset.bound){difficulty.dataset.bound="1";difficulty.addEventListener("change",()=>{__difficultyFilter=difficulty.value;renderLevels();});}
}
bindRankingFilters();

$("featuredLevelBanner")?.addEventListener("click",e=>{
  const button=e.target.closest("[data-featured-level-id]");
  if(!button)return;
  const level=__allLevels.find(x=>String(x.id)===button.dataset.featuredLevelId);
  if(level)openLevelDetails(level);
});
$("rankings").addEventListener("click",e=>{
  if(e.target.closest(".level-thumb"))return;
  const card=e.target.closest(".level[data-level-id]");
  if(card){const level=__allLevels.find(x=>String(x.id)===card.dataset.levelId);if(level)openLevelDetails(level);}
});
$("rankings").addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ")return;
  if(e.target.closest(".level-thumb"))return;
  const card=e.target.closest(".level[data-level-id]");
  if(card){e.preventDefault();const level=__allLevels.find(x=>String(x.id)===card.dataset.levelId);if(level)openLevelDetails(level);}
});

async function loadLevels(){
  if(__levelsPromise)return __levelsPromise;
  const el=$("rankings");
  __levelsPromise=(async()=>{
    el.innerHTML='<div class="empty">Loading the level list…</div>';
    try{
      const r=await fetch(API.levels+"?t="+Date.now(),{
        headers:{apikey:SUPABASE_PUBLISHABLE_KEY},
        cache:"no-store",
        signal:AbortSignal.timeout(12000)
      });
      const json=await r.json();
      if(!r.ok)throw new Error(json?.error||"Could not load levels (HTTP "+r.status+").");
      __allLevels=(Array.isArray(json)?json:(json.data||[])).filter(x=>x.status!=="archived");
      bindRankingFilters();
      renderLevels();
      // Personal progress is optional; load it after public levels are visible.
      loadMyProgress().then(renderLevels).catch(error=>console.warn("Progress refresh skipped",error));
    }catch(e){
      console.error("Possible level list failed:",e);
      el.innerHTML='<div class="empty">The level list couldn’t load. <button class="secondary" type="button" id="retryLevels">Try again</button><div class="muted" style="margin-top:8px">'+escapeHTML(e?.message||"Network error")+'</div></div>';
      $("retryLevels")?.addEventListener("click",()=>loadLevels());
    }
  })().finally(()=>{__levelsPromise=null});
  return __levelsPromise;
}

let activeCompletionLevel=null;
function openLevelDetails(level){
  activeCompletionLevel=level;
  const detailImage=youtubeThumbnail(level.verification_url)||level.thumbnail_url||"";
  const bannerImage=$("detailsBannerImage");
  if(bannerImage){bannerImage.src=detailImage;bannerImage.alt=(level.name||"Level")+" level banner";bannerImage.style.display=detailImage?"block":"none";}
  $("detailsBannerName").textContent=level.name||"Unnamed level";
  $("detailsBannerRank").textContent=Number(level.current_rank)>0?"RANK #"+Number(level.current_rank):"UNRANKED";
  $("detailsTitle").textContent=level.name||"Unnamed level";
  $("detailsCreator").textContent=(level.creator||"Unknown creator")+" · GD ID "+(level.gd_level_id??"—")+" · "+levelDifficulty(level);
  $("detailsDescription").textContent=level.description||"No description has been added for this level yet.";
  const rank=Number(level.current_rank)||0;
  const minRequirement=rank>0&&rank<=25?50:rank<=75&&rank>0?60:rank<=150&&rank>0?75:100;
  $("detailsMeta").textContent=rank>0
    ? "Rank #"+rank+" · 100% value: "+getMaxPoints(rank,levelDifficulty(level)).toFixed(2)+" points · Minimum progress: "+minRequirement+"%"
    : "This level needs a ranked position before it can earn points.";
  $("detailsStats").innerHTML=`
    <div class="detail-stat"><span>LIST POSITION</span><strong>${rank>0?"#"+rank:"—"}</strong></div>
    <div class="detail-stat"><span>DIFFICULTY</span><strong>${escapeHTML(levelDifficulty(level))}</strong></div>
    <div class="detail-stat"><span>GD LEVEL ID</span><strong>${escapeHTML(level.gd_level_id??"—")}</strong></div>
    <div class="detail-stat"><span>MINIMUM PROGRESS</span><strong>${escapeHTML(level.min_progress!=null?level.min_progress+"%":minRequirement+"%")}</strong></div>
    <div class="detail-stat detail-stat-wide"><span>CURRENT WORLD RECORD</span><strong>${escapeHTML(level.current_wr||"Not listed")}</strong></div>`;
  const ownProgress=__myLevelProgress.get(String(level.id));
  $("myLevelProgress").textContent=ownProgress
    ? (Number(ownProgress.progress)===100?"✓ You have beaten this level. ":"Your best approved progress: "+ownProgress.progress+"%. ")+
      "Your points are calculated on the Players leaderboard."
    : "Your personal progress appears here after staff approval. Sign in to track your own records.";
  $("completionRequirement").textContent=rank>0
    ? "Automatic minimum: "+minRequirement+"% for rank #"+rank+". Progress below this threshold can be submitted but earns 0 points."
    : "This level is unranked and earns 0 points until it receives a list rank.";
  $("completionProgress").min="0";
  $("completionProgress").value="";
  $("completionPlayer").value="";
  $("completionCountry").value="";
  $("completionVideo").value="";
  $("completionState").textContent="";
  $("completionSubmit").disabled=false;
  const id=youtubeId(level.verification_url);
  $("detailsVideoWrap").innerHTML=id
    ? '<iframe title="Verification video" src="https://www.youtube.com/embed/'+encodeURIComponent(id)+'?rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>'
    : '<div class="empty">No verification video attached.</div>';
  $("detailsVideoName").textContent=id?"Loading video title…":(level.verification_url?"Verification link":"No verification video");
  if(id){
    fetch("https://www.youtube.com/oembed?format=json&url="+encodeURIComponent(level.verification_url))
      .then(r=>r.ok?r.json():null).then(j=>{
        if(activeCompletionLevel?.id===level.id)$("detailsVideoName").textContent=j?.title||"Watch verification video";
      }).catch(()=>{if(activeCompletionLevel?.id===level.id)$("detailsVideoName").textContent="Watch verification video";});
  }
  $("levelDetailsModal").classList.add("show");
  $("levelDetailsModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function closeLevelDetails(){
  activeCompletionLevel=null;
  $("levelDetailsModal").classList.remove("show");
  $("levelDetailsModal").setAttribute("aria-hidden","true");
  $("detailsVideoWrap").innerHTML='<div class="empty">No verification video attached.</div>';
  document.body.style.overflow="";
}
$("detailsClose").onclick=closeLevelDetails;
$("levelDetailsModal").addEventListener("click",e=>{if(e.target.id==="levelDetailsModal")closeLevelDetails();});
$("completionForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const level=activeCompletionLevel;
  if(!level)return;
  const player_name=$("completionPlayer").value.trim();
  const country=countryName($("completionCountry").value);
  const progress=Number($("completionProgress").value);
  const video_url=$("completionVideo").value.trim();
  if(!player_name||!country||!Number.isInteger(progress)||progress<0||progress>100){$("completionState").textContent="Enter a player name, country and whole-number progress from 0 to 100.";return;}
  if(level.min_progress!=null&&progress<Number(level.min_progress)){$("completionState").textContent="This level requires at least "+level.min_progress+"% progress.";return;}
  $("completionSubmit").disabled=true;
  $("completionState").textContent="Submitting…";
  try{
    const current=await session();
    const headers={"Content-Type":"application/json","apikey":SUPABASE_PUBLISHABLE_KEY};
    if(current?.access_token)headers.Authorization="Bearer "+current.access_token;
    const response=await fetch(API.completions,{method:"POST",headers,body:JSON.stringify({level_id:level.id,player_name,country,progress,video_url})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Could not submit progress.");
    $("completionState").textContent="Submitted! Your progress is waiting for review. Sign in to track it on your account.";
    $("completionForm").reset();
  }catch(error){$("completionState").textContent=error.message||"Submission failed.";}
  finally{$("completionSubmit").disabled=false;}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("levelDetailsModal")?.classList.contains("show"))closeLevelDetails();});

let __communityPromise=null;
async function loadCommunity(){
  if(__communityPromise)return __communityPromise;
  __communityPromise=(async()=>{
    const creatorEl=$("creators"),playerEl=$("players");
    creatorEl.innerHTML=playerEl.innerHTML='<div class="empty">Loading leaderboards…</div>';
    try{
      const r=await fetch(API.community,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:"no-store"});
      const j=await r.json();
      if(!r.ok || j?.message!=="success") throw new Error(j?.data?.error||j?.message||"Leaderboard request failed.");
      const creators=Array.isArray(j?.data?.creators)?j.data.creators:[];
      const players=Array.isArray(j?.data?.players)?j.data.players:[];
      creators.sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0)||String(a.username||"").localeCompare(String(b.username||"")));
      players.sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0)||String(a.username||"").localeCompare(String(b.username||"")));
      creatorEl.innerHTML=creators.length?creators.map(p=>personCard(p,"Creator")).join(""):'<div class="empty">No creators have ranked levels yet.</div>';
      playerEl.innerHTML=players.length?players.map(p=>personCard(p,"Player")).join(""):'<div class="empty">No players have approved progress or current world records yet.</div>';
    }catch(e){
      const message=escapeHTML(e?.message||"Couldn’t load community lists.");
      creatorEl.innerHTML=playerEl.innerHTML='<div class="empty">Leaderboard unavailable: '+message+'</div>';
      console.error("Leaderboard loading failed",e);
    }
  })().finally(()=>{__communityPromise=null});
  return __communityPromise;
}
function youtubeChannelAvatar(url){
  const s=String(url||"").trim();
  const m=s.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]+)/i);
  return m ? "https://banner.yt/"+m[1]+"/avatar" : "";
}
function personCard(p,role){
  let sub=role==="Player" && p.primary_icon_type ? `${p.primary_icon_type.toUpperCase()} #${p.primary_icon_id||1}` : role;
  if(role==="Creator"){
    const count=Number(p.level_count||0);
    sub=`${Number(p.points||0).toFixed(2).replace(/\\.00$/,"")} points · `+count+` level${count===1?"":"s"} on Possible`;
  }
  if(role==="Player"){
    const count=Number(p.level_count||0);
    sub=`${Number(p.points||0).toFixed(2)} points · `+count+` level${count===1?"":"s"} with progress / WR`;
  }
  const levelNames=role==="Creator" && Array.isArray(p.levels) && p.levels.length
    ? `<div class="person-bio">${escapeHTML(p.levels.map(x=>x.name).join(" • "))}</div>` : "";
  const wrHolder=role==="Player" && Array.isArray(p.wrs) && p.wrs.length
    ? `<div class="wr-holder">
        <div class="wr-holder-title">WR HOLDER</div>
        ${p.wrs.map(x=>`<div class="wr-holder-row"><span class="wr-holder-level">${escapeHTML(x.level_name)}</span><span class="wr-holder-record">${escapeHTML(x.record||x.current_wr||"WR")}</span></div>`).join("")}
      </div>` : "";
  const avatar=p.avatar_url||youtubeChannelAvatar(p.youtube_url);
  const playerCountry=role==="Player"&&p.country?`<span class="person-country" title="${escapeHTML(countryName(p.country))}">${countryFlag(p.country)} ${escapeHTML(countryName(p.country))}</span>`:"";
  const avatarHTML=avatar
    ? `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(p.username||role)} profile picture" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" onerror="this.parentElement.textContent='${escapeHTML((p.username||"?").slice(0,1).toUpperCase())}'">`
    : escapeHTML((p.username||"?").slice(0,1).toUpperCase());
  const youtube=p.youtube_url
    ? `<div class="form-actions" style="margin-top:12px"><a class="mini" href="${escapeHTML(p.youtube_url)}" target="_blank" rel="noopener">YouTube Profile</a></div>`
    : "";
  const profileDesc=p.youtube_description && role==="Creator"
    ? `<div class="person-sub" style="margin-top:5px">${escapeHTML(p.youtube_description)}</div>` : "";
  return `<article class="person"><div class="person-top"><div class="avatar">${avatarHTML}</div><div><div class="person-name">${escapeHTML(p.username)}</div>${playerCountry}<div class="person-sub">${escapeHTML(sub)}</div>${profileDesc}</div></div>${p.bio?`<div class="person-bio">${escapeHTML(p.bio)}</div>`:""}${levelNames}${wrHolder}${youtube}</article>`;
}

async function loadSubmit(){
  const gate=$("submitGate");
  const form=$("submitForm");
  const mine=$("mySubmissions");
  const s=await session();
  if(!s){
    gate.textContent="Sign in to submit a level.";
    form.style.display="none";
    mine.innerHTML="";
    return;
  }
  gate.textContent="Submit a level for staff review.";
  form.style.display="block";
  try{
    const r=await fetch(API.submissions,{headers:{Authorization:"Bearer "+s.access_token},cache:"no-store"});
    const j=await r.json();
    const rows=j?.data||[];
    mine.innerHTML=rows.length
      ? "<div class='muted'><strong>Your submissions</strong></div>"+rows.map(x=>"<div class='admin-card' style='margin-top:8px'><b>"+escapeHTML(x.level_name)+"</b><div class='person-sub'>"+escapeHTML(x.status)+"</div></div>").join("")
      : "";
  }catch(e){
    mine.innerHTML="";
  }
}

const autoSubmitGD=debounce(()=>autoFindGDLevelId($("submitName"),$("submitCreator"),$("submitGD"),$("submitGDState")));
$("submitName").addEventListener("input",autoSubmitGD);
$("submitCreator").addEventListener("input",autoSubmitGD);

$("submitLevelBtn").onclick=async()=>{
  const s=await session();
  if(!s){toast("Sign in first.");return}
  const payload={
    gd_level_id:Number($("submitGD").value),
    level_name:$("submitName").value.trim(),
    creator:$("submitCreator").value.trim(),
    verification_url:$("submitVideo").value.trim(),
    notes:$("submitNotes").value.trim()
  };
  if(!Number.isInteger(payload.gd_level_id)||payload.gd_level_id<0||!payload.level_name||!payload.creator||!payload.verification_url){
    if(!Number.isInteger(payload.gd_level_id)){ $("submitGDState").textContent="Enter a valid level name/creator so Possible can find the GD ID."; }

    $("submitState").textContent="GD ID, level name, creator and verification URL are required.";
    return;
  }
  $("submitState").textContent="Submitting…";
  try{
    const r=await fetch(API.submissions,{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.access_token},
      body:JSON.stringify(payload)
    });
    const j=await r.json();
    if(!r.ok){
      $("submitState").textContent=j?.data?.error||j?.message||"Submission failed.";
      return;
    }
    $("submitState").textContent="Submitted for staff review.";
    $("submitGD").value="";
    $("submitName").value="";
    $("submitCreator").value="";
    $("submitVideo").value="";
    $("submitNotes").value="";
    $("submitGDState").textContent="";
    loadSubmit();
  }catch(e){
    $("submitState").textContent="Submission request failed.";
  }
};

let __changesPromise=null;
async function loadChanges(){
  if(__changesPromise)return __changesPromise;
  const el=$("changes");
  __changesPromise=(async()=>{ el.innerHTML='<div class="empty">Loading changelog…</div>';
  try{
    const r=await fetch(API.changes+"?limit=60&t="+Date.now(),{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:"no-store"}); const data=await r.json(); if(!r.ok) throw new Error();
    const items=Array.isArray(data)?data:(data.data||[]);
    el.innerHTML=items.length?items.map(c=>`
      <article class="change">
        <div class="change-dot"></div>
        <div><div class="change-title">${escapeHTML(labelChange(c.change_type))}${c.level_name?" — "+escapeHTML(c.level_name):""}</div>
        <div class="change-detail">${escapeHTML(c.details||"Possible list updated.")}</div>
        <div class="change-time">${escapeHTML(fmtTime(c.created_at))}</div></div>
      </article>`).join(""):'<div class="empty">No changes recorded yet.</div>';
  }catch(e){el.innerHTML='<div class="empty">Couldn’t load the changelog.</div>';}
  })().finally(()=>{__changesPromise=null});
  return __changesPromise;
}
function labelChange(t){return ({added:"Level added",updated:"Level updated",rank_changed:"Rank changed",beaten:"Level beaten",archived:"Level archived",restored:"Level restored",deleted:"Level removed"})[t]||"List update";}

let __tmReady=false;

async function loadShortestReign(){
  const out=$("reignRecord"); if(!out)return;
  try{
    const r=await fetch(API.changes+"?limit=200&t="+Date.now(),{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:"no-store"});
    const j=await r.json(); if(!r.ok)throw new Error(j?.error||"Changelog unavailable");
    const rows=Array.isArray(j)?j:(j.data||[]), sorted=rows.slice().sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    const active=new Map(), completed=[];
    for(const x of sorted){
      const key=String(x.level_id||x.level_name||"").trim().toLowerCase(); if(!key)continue;
      const oldRank=Number(x.old_rank), newRank=Number(x.new_rank);
      if(newRank===1&&oldRank!==1)active.set(key,{name:x.level_name||key,creator:x.creator||"Unknown",start:new Date(x.created_at)});
      if(oldRank===1&&newRank!==1){const start=active.get(key);if(start){completed.push({...start,end:new Date(x.created_at)});active.delete(key);}}
    }
    completed.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
    const format=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return (h?h+"h ":"")+(m?m+"m ":"")+sec+"s"};
    if(completed.length){const x=completed[0];out.innerHTML="<b>"+escapeHTML(x.name)+"</b> · "+escapeHTML(x.creator)+"<br><span style='font-size:22px;font-weight:1000'>"+format(x.end-x.start)+"</span><br><span class='person-sub'>Shortest completed #1 reign · "+x.start.toLocaleString()+" → "+x.end.toLocaleString()+"</span>";}else out.textContent="No completed #1 reigns are recorded yet.";
  }catch(e){console.error(e);out.textContent="Couldn’t load #1 reign history.";}
}

function initTimeMachine(){
  if(__tmReady)return;
  __tmReady=true;
  const d=$("tmDate");
  d.max=new Date().toISOString().slice(0,16);
  $("tmLoad").onclick=loadTimeMachine;
  $("tmLive").onclick=()=>showView("rankings");
}
async function loadTimeMachine(){
  const date=$("tmDate").value;
  const out=$("tmRankings"),state=$("tmState");
  if(!date){state.textContent="Select a snapshot date first.";return;}
  state.textContent="Loading historical snapshot…";
  out.innerHTML="";
  try{
    const localDate=new Date(date);
    if(Number.isNaN(localDate.getTime())){state.textContent="Select a valid snapshot time first.";return;}
    const at=localDate.toISOString();
    const r=await fetch(API.levels+"?at="+encodeURIComponent(at)+"&t="+Date.now(),{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:"no-store"});
    const json=await r.json();
    if(!r.ok)throw new Error(json?.error||"Snapshot unavailable");
    const levels=Array.isArray(json)?json:(json.data||[]);
    if(!levels.length){
      state.textContent="No recorded snapshot is available for that date.";
      return;
    }
    state.textContent="Historical snapshot • "+localDate.toLocaleString()+" • "+levels.length+" levels";
    out.innerHTML=levels.map((l,i)=>`<article class="level">
      <div class="rank ${(l.current_rank??i+1)===1?'top':''}">#${l.current_rank??i+1}</div>
      <div class="level-main">
        <div class="level-name">${escapeHTML(l.name||"Unnamed Level")}</div>
        <div class="level-meta">by ${escapeHTML(l.creator||"Unknown Creator")}</div>
        <div class="level-id">GD ID ${escapeHTML(l.gd_level_id)}</div>
        ${l.current_wr?'<div class="level-wr"><span>WR</span>'+escapeHTML(l.current_wr)+'</div>':''}
      </div>
      <div class="status">HISTORICAL</div>
    </article>`).join("");
  }catch(e){
    console.error(e);
    state.textContent="This date isn't available yet. Historical snapshots require the backend to support the `at` date query.";
  }
}
let __sessionCache=null;
let __sessionCacheAt=0;
let __sessionPromise=null;
let __authRefreshSeq=0;

async function session(force=false){
  if(!force && __sessionCacheAt && Date.now()-__sessionCacheAt<3000) return __sessionCache;
  if(__sessionPromise && !force) return __sessionPromise;
  const request=(async()=>{
    const {data,error}=await sb.auth.getSession();
    if(error) throw error;
    const live=data?.session||null;
    __sessionCache=live;
    __sessionCacheAt=Date.now();
    return live;
  })();
  if(!force) __sessionPromise=request;
  try{return await request}
  finally{if(!force) __sessionPromise=null}
}

async function refreshAuth(force=false){
  const seq=++__authRefreshSeq;
  let s=null;
  try{s=await session(!!force)}catch(e){console.error("Possible auth session check failed:",e)}
  if(seq!==__authRefreshSeq)return;
  $("authBtn").textContent=s?"Sign Out":"Sign In";
  $("staffApplication").style.display=s?"block":"none";
  const admin=s ? await checkAdmin(s) : false;
  if(seq!==__authRefreshSeq)return;
  $("adminNav").classList.toggle("show",admin);
}
async function checkAdmin(s){
  if(!s) return false;
  if(s.user?.email === "lennylion444@gmail.com") return true;
  try{
    const response=await fetch(API.admin+"?access-check="+Date.now(),{
      method:"GET",
      headers:{Authorization:"Bearer "+s.access_token},
      cache:"no-store"
    });
    return response.ok;
  }catch(e){
    return false;
  }
}
function createAccount(){
  $("signupState").textContent="";
  $("signupForm").reset();
  $("signupModal").classList.add("show");
  $("signupModal").setAttribute("aria-hidden","false");
  setTimeout(()=>$("signupUsername").focus(),0);
}
function closeSignup(){
  $("signupModal").classList.remove("show");
  $("signupModal").setAttribute("aria-hidden","true");
}
$("createBtn").onclick=createAccount;
$("signupClose").onclick=closeSignup;
$("signupCancel").onclick=closeSignup;
$("signupToLogin").onclick=()=>{closeSignup();openLogin();};
$("signupModal").addEventListener("click",e=>{if(e.target.id==="signupModal")closeSignup();});
$("signupForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const username=$("signupUsername").value.trim();
  const password=$("signupPassword").value;
  const confirmPassword=$("signupPasswordConfirm").value;
  const state=$("signupState");
  if(!/^[A-Za-z0-9_]{3,20}$/.test(username)){state.textContent="Username must be 3–20 characters using letters, numbers or underscores.";return;}
  if(password.length<8){state.textContent="Use a password with at least 8 characters.";return;}
  if(password!==confirmPassword){state.textContent="Your passwords do not match.";return;}
  $("signupSubmit").disabled=true;
  state.textContent="Creating your account…";
  try{
    const response=await fetch(SUPABASE_URL+"/functions/v1/username-signup",{
      method:"POST",
      headers:{"Content-Type":"application/json",apikey:SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify({username,password})
    });
    const result=await response.json();
    if(!response.ok||!result?.session)throw new Error(result?.error||"Account creation failed. Please try again.");
    const {data,error}=await sb.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});
    if(error)throw error;
    __sessionCache=data.session;
    __sessionCacheAt=Date.now();
    closeSignup();
    toast("Account created and signed in as "+username+".");
    await refreshAuth(true);
    loadAccount();
  }catch(error){
    state.textContent=error?.message||"Account creation failed. Please try again.";
  }finally{
    $("signupSubmit").disabled=false;
  }
});
$("moreNav").onclick=e=>{e.stopPropagation();const m=$("moreMenu");m.style.display=m.style.display==="none"?"block":"none"};
document.addEventListener("click",e=>{if(!e.target.closest(".nav-more")) $("moreMenu").style.display="none"});
$("createBtn").onclick=createAccount;
function openLogin(){
  $("loginState").textContent="";
  $("loginModal").classList.add("show"); $("loginModal").setAttribute("aria-hidden","false");
  setTimeout(()=>$("loginUsername").focus(),0);
}
function closeLogin(){ $("loginModal").classList.remove("show"); $("loginModal").setAttribute("aria-hidden","true"); }
$("loginClose").onclick=closeLogin; $("loginCancel").onclick=closeLogin;
$("loginModal").addEventListener("click",e=>{if(e.target.id==="loginModal")closeLogin()});
$("loginSubmit").onclick=async()=>{
  const username=$("loginUsername").value.trim(),password=$("loginPassword").value;
  if(!username||!password){$("loginState").textContent="Enter your username and password.";return;}
  if(!/^[A-Za-z0-9_]{3,20}$/.test(username)){$("loginState").textContent="Enter a valid username.";return;}
  $("loginState").textContent="Signing in…"; $("loginSubmit").disabled=true;
  try{
    const response=await fetch(SUPABASE_URL+"/functions/v1/username-login",{
      method:"POST",
      headers:{"Content-Type":"application/json",apikey:SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify({username,password})
    });
    const result=await response.json();
    if(!response.ok||!result?.session)throw new Error(result?.error||"Invalid username or password.");
    const {data,error}=await sb.auth.setSession({
      access_token:result.session.access_token,
      refresh_token:result.session.refresh_token
    });
    if(error)throw error;
    __sessionCache=data.session;
    __sessionCacheAt=Date.now();

    closeLogin();
    toast("Signed in as "+username+".");
    await refreshAuth(true);
    loadAccount();
  }catch(error){
    $("loginState").textContent=error?.message||"Unable to sign in.";
  }finally{
    $("loginSubmit").disabled=false;
  }
};
$("authBtn").onclick=async()=>{
  const s=await session();
  if(s){await sb.auth.signOut(); toast("Signed out."); await refreshAuth(); return;}
  openLogin();
};
sb.auth.onAuthStateChange((event,authSession)=>{
  if(event==="SIGNED_OUT"){
    __sessionCache=null;
    __sessionCacheAt=Date.now();
    setTimeout(()=>refreshAuth(true),0);
    return;
  }
  if(authSession){
    __sessionCache=authSession;
    __sessionCacheAt=Date.now();
  }
  // INITIAL_SESSION can briefly report null while storage restoration finishes.
  // Re-read the real persisted session instead of treating that event as a logout.
  setTimeout(()=>refreshAuth(true),0);
});

$("submitStaff").onclick=async()=>{
  const s=await session(); if(!s){toast("Sign in first.");return}
  const payload={action:"submit_application",possible_username:$("appPossible").value.trim(),gd_username:$("appGD").value.trim(),reason:$("appReason").value.trim(),experience:"Good moderator: "+$("appExperience").value.trim()+"\nPrevious moderation experience: "+$("appPrevious").value.trim(),availability:$("appAvailability").value.trim()};
  const r=await fetch(API.staff,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.access_token},body:JSON.stringify(payload)});
  const j=await r.json();
  if(!r.ok){toast(j.message||"Application failed.");return}
  toast("Staff application submitted."); loadStaff();
};

let __staffPromise=null;
async function loadStaff(){
  if(__staffPromise)return __staffPromise;
  const box=$("staffMembers");
  __staffPromise=(async()=>{
    box.innerHTML='<div class="empty">Loading staff…</div>';
    try{
      const r=await fetch(API.staff+"?view=staff&t="+Date.now(),{cache:"no-store"}); const j=await r.json();
      if(!r.ok)throw new Error(j?.message||"Staff unavailable");
      const list=j.data||[];
      box.innerHTML=list.length?list.map(s=>`<div class="admin-card"><h3>${escapeHTML(String(s.role||"").replaceAll("_"," ").toUpperCase())}</h3><p>Staff user: ${escapeHTML(s.user_id)}</p></div>`).join(""):'<div class="empty">No public staff members yet.</div>';
      const me=await session();
      $("myApplications").innerHTML="";
      $("staffApplication").style.display=me?"block":"none";
      if(me){
        const rr=await fetch(API.staff+"?view=my_applications",{headers:{Authorization:"Bearer "+me.access_token}});
        const jj=await rr.json();
        if(rr.ok&&jj.data?.length) $("myApplications").innerHTML="<div class='muted'><strong>Your applications</strong></div>"+jj.data.map(a=>`<div class="admin-card" style="margin-top:8px"><b>MODERATOR</b> · ${escapeHTML(a.status)}<div class="person-sub">${escapeHTML(a.reason)}</div>${a.reviewer_notes?'<div class="person-sub" style="margin-top:6px">Decision: '+escapeHTML(a.reviewer_notes)+'</div>':''}</div>`).join("");
      }
      const canModerate=!!me&&list.some(s=>s.user_id===me.user.id&&["moderator","admin","owner"].includes(s.role));
      if(canModerate) await loadModeratorTools(); else $("moderatorTools").style.display="none";
    }catch(e){box.innerHTML='<div class="empty">Couldn’t load staff.</div>'; $("staffApplication").style.display="none";}
  })().finally(()=>{__staffPromise=null});
  return __staffPromise;
}

async function adminPost(payload){
  const s=await session();
  if(!s){toast("Sign in first.");return null}
  try{
    const r=await fetch(API.admin+"?t="+Date.now(),{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.access_token},
      body:JSON.stringify(payload)
    });
    let j={}; try{j=await r.json()}catch{}
    if(!r.ok){toast(j?.data?.error||j?.message||"Admin action failed.");return null}
    return j;
  }catch(e){
    toast("Admin request failed."); return null;
  }
}

let adminState={data:null,tab:"overview"};

function adminTabButtons(){
  document.querySelectorAll("[data-admin-tab]").forEach(btn=>{
    btn.onclick=()=>{
      adminState.tab=btn.dataset.adminTab;
      document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.toggle("active",x.dataset.adminTab===adminState.tab));
      renderAdminTab();
    };
  });
}

async function staffFetch(view){
  const s=await session();
  if(!s){toast("Sign in first.");return null}
  try{
    const r=await fetch(API.staff+"?view="+encodeURIComponent(view)+"&t="+Date.now(),{headers:{Authorization:"Bearer "+s.access_token},cache:"no-store"});
    const j=await r.json();
    if(!r.ok) throw new Error(j?.data?.error||j?.message||"Request failed");
    return j.data||null;
  }catch(e){toast(e.message||"Staff request failed.");return null}
}
async function staffPost(payload){
  const s=await session();
  if(!s){toast("Sign in first.");return null}
  try{
    const r=await fetch(API.staff,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.access_token},body:JSON.stringify(payload)});
    const j=await r.json();
    if(!r.ok){toast(j?.data?.error||j?.message||"Staff action failed.");return null}
    return j.data||j;
  }catch(e){toast("Staff request failed.");return null}
}
async function reviewStaffApplication(id,status){
  const result=await openAdminDialog({
    title:status==="approved"?"Approve Moderator":"Reject Moderator",
    subtitle:"Record an optional decision note.",
    confirmText:status==="approved"?"Approve":"Reject",
    fields:[{key:"note",label:"Decision note",type:"textarea",placeholder:"Optional note",wide:true}]
  });
  if(!result)return;
  const j=await staffPost({action:"review_application",id,status,reviewer_notes:result.note||""});
  if(j){toast(status==="approved"?"Moderator approved.":"Application rejected.");renderAdminTab();}
}
async function setStaffActive(userId,active){
  const result=await openAdminDialog({
    title:active?"Restore Staff":"Remove Staff",
    subtitle:active?"Restore this staff member's access.":"Remove this staff member's active access.",
    confirmText:active?"Restore":"Remove",
    fields:[{key:"reason",label:"Reason",type:"textarea",placeholder:"Optional reason",wide:true}]
  });
  if(!result)return;
  const j=await staffPost({action:"set_active",user_id:userId,active,reason:result.reason||""});
  if(j){toast(active?"Staff restored.":"Staff removed.");renderAdminTab();}
}
async function loadModeratorTools(){
  const box=$("moderationQueue"),toolsBox=$("moderatorTools");
  if(!box||!toolsBox)return;
  const d=await staffFetch("moderation");
  if(!d){toolsBox.style.display="none";return}
  toolsBox.style.display="block";
  const submissions=(d.submissions||[]).map(x=>`<div class="admin-card" style="margin-top:8px"><h3>${escapeHTML(x.level_name||"Unnamed level")}</h3><p>By ${escapeHTML(x.creator||"Unknown")} · GD #${escapeHTML(x.gd_level_id)}</p><div class="mini-actions" style="margin-top:10px"><button class="mini success" onclick="moderatorReviewSubmission('${escapeHTML(x.id)}','approved')">Approve</button><button class="mini danger" onclick="moderatorReviewSubmission('${escapeHTML(x.id)}','rejected')">Reject</button><button class="mini" onclick="moderatorReviewSubmission('${escapeHTML(x.id)}','needs_review')">Needs review</button></div></div>`).join("");
  const reports=(d.reports||[]).map(x=>`<div class="admin-card" style="margin-top:8px"><h3>Profile report #${x.id}</h3><p>${escapeHTML(x.reason||"No reason")} · ${escapeHTML(x.details||"")}</p><div class="mini-actions" style="margin-top:10px"><button class="mini success" onclick="moderatorReviewReport(${Number(x.id)},'resolved')">Resolve</button><button class="mini" onclick="moderatorReviewReport(${Number(x.id)},'dismissed')">Dismiss</button></div></div>`).join("");
  box.innerHTML=(submissions?'<div><b>Pending level submissions</b>'+submissions+'</div>':'')+(reports?'<div style="margin-top:16px"><b>Pending profile reports</b>'+reports+'</div>':'')||'<div class="empty">No moderation work is waiting.</div>';
}
async function moderatorReviewSubmission(id,status){
  const result=await openAdminDialog({title:"Review Submission",subtitle:"Optional moderation note.",confirmText:"Save",fields:[{key:"note",label:"Note",type:"textarea",placeholder:"Optional",wide:true}]});
  if(!result)return;
  const j=await staffPost({action:"moderator_review_submission",id,status,reviewer_notes:result.note||""});
  if(j){toast("Submission updated.");loadModeratorTools();}
}
async function moderatorReviewReport(id,status){
  const result=await openAdminDialog({title:"Review Profile Report",subtitle:"Optional moderation note.",confirmText:"Save",fields:[{key:"note",label:"Note",type:"textarea",placeholder:"Optional",wide:true}]});
  if(!result)return;
  const j=await staffPost({action:"moderator_review_report",id,status,reviewer_note:result.note||""});
  if(j){toast("Profile report updated.");loadModeratorTools();}
}
async function renderStaffAdminTab(tab){
  const box=$("adminContent");
  if(tab==="staff-applications"){
    const d=await staffFetch("applications"); if(!d)return;
    const pending=d.filter(x=>x.status==="pending");
    box.innerHTML=`<div class="panel"><h3 style="margin-top:0">Staff Applications</h3><p class="muted">${pending.length} pending moderator application${pending.length===1?"":"s"}.</p>${pending.length?pending.map(a=>`<div class="admin-card" style="margin-top:10px"><h3>${escapeHTML(a.possible_username||"Unknown")} <span class="tag">MODERATOR</span></h3><p><b>GD:</b> ${escapeHTML(a.gd_username||"—")}</p><p style="margin-top:8px"><b>Why:</b> ${escapeHTML(a.reason||"—")}</p><p style="margin-top:8px"><b>Moderator experience:</b> ${escapeHTML(a.experience||"—")}</p><p style="margin-top:8px"><b>Availability:</b> ${escapeHTML(a.availability||"—")}</p><p class="person-sub" style="margin-top:8px">Submitted ${new Date(a.created_at).toLocaleString()}</p><div class="mini-actions" style="margin-top:10px"><button class="mini success" onclick="reviewStaffApplication('${escapeHTML(a.id)}','approved')">Accept</button><button class="mini danger" onclick="reviewStaffApplication('${escapeHTML(a.id)}','rejected')">Reject</button></div></div>`).join(""):'<div class="empty">No pending moderator applications.</div>'}</div>`;
    return;
  }
  if(tab==="staff-management"){
    const d=await staffFetch("staff"); if(!d)return;
    box.innerHTML=`<div class="panel"><h3 style="margin-top:0">Staff Management</h3><p class="muted">Active staff members and their roles.</p>${d.map(s=>`<div class="admin-row"><div><b>${escapeHTML(String(s.role||"").replaceAll("_"," ").toUpperCase())}</b><div class="person-sub">${escapeHTML(s.user_id)}</div></div><div class="mini-actions">${s.role==="owner"?'<span class="tag">PROTECTED</span>':`<button class="mini danger" onclick="setStaffActive('${escapeHTML(s.user_id)}',false)">Remove</button>`}</div></div>`).join("")||'<div class="empty">No staff members.</div>'}</div>`;
    return;
  }
  if(tab==="staff-actions"){
    const d=await staffFetch("actions"); if(!d)return;
    box.innerHTML=`<div class="panel"><h3 style="margin-top:0">Staff History</h3>${d.map(a=>`<div class="admin-row"><div><b>${escapeHTML(a.action||"Action")}</b><div class="person-sub">Target ${escapeHTML(a.target_user_id||"—")} · Actor ${escapeHTML(a.actor_user_id||"—")}</div></div><div class="person-sub">${new Date(a.created_at).toLocaleString()}</div></div>`).join("")||'<div class="empty">No staff actions recorded.</div>'}</div>`;
  }
}
async function renderAdminAccessTab(){
  const box=$("adminContent");
  const d=adminState.data||{};
  if(d.admin?.role!=="owner"){
    box.innerHTML='<div class="empty">Only the Possible owner can manage administrator access.</div>';
    return;
  }
  const profiles=new Map((d.profiles||[]).map(p=>[p.user_id,p.username]));
  const admins=(d.admins||[]).filter(a=>a.active);
  box.innerHTML=`
    <div class="panel">
      <h3 style="margin-top:0">Grant Administrator Access</h3>
      <p class="muted">Enter an existing Possible username. The user does not need to be logged in. They must already have created an account.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div style="flex:1;min-width:200px"><label for="adminGrantUsername">Possible username</label><input id="adminGrantUsername" maxlength="20" placeholder="Username" autocomplete="off"></div>
        <button class="primary" id="adminGrantButton" type="button">Grant Admin</button>
      </div>
      <div id="adminGrantState" class="muted" style="margin-top:10px" aria-live="polite"></div>
    </div>
    <div class="panel" style="margin-top:12px">
      <h3 style="margin-top:0">Administrator Access</h3>
      <p class="muted">${admins.length} active administrator${admins.length===1?"":"s"}.</p>
      ${admins.map(a=>{
        const name=profiles.get(a.user_id)||"Account";
        return `<div class="admin-row">
          <div><b>${escapeHTML(name)}</b><div class="person-sub">${escapeHTML(a.role)} · ${escapeHTML(a.user_id)}</div></div>
          <div class="mini-actions"><button class="mini danger" onclick="setAdminAccess('${escapeHTML(a.user_id)}',false)">Remove Admin</button></div>
        </div>`;
      }).join("")||'<div class="empty">No active admin grants.</div>'}
    </div>`;
  $("adminGrantButton").onclick=async()=>{
    const input=$("adminGrantUsername");
    const state=$("adminGrantState");
    const username=input.value.trim();
    if(!/^[A-Za-z0-9_]{3,20}$/.test(username)){state.textContent="Enter a valid username (3–20 letters, numbers or underscores).";return;}
    $("adminGrantButton").disabled=true;
    state.textContent="Applying admin access…";
    const result=await adminPost({action:"set_admin",username,active:true});
    $("adminGrantButton").disabled=false;
    if(result){
      toast("Admin access granted to "+username+".");
      adminState.data=null;
      await loadAdmin();
      adminOpenTab("admin-access");
    }else state.textContent="Could not grant admin access. Check the message above.";
  };
}
window.setAdminAccess=async(userId,active)=>{
  if(!confirm("Remove administrator access from this account?"))return;
  const result=await adminPost({action:"set_admin",user_id:userId,active});
  if(result){
    toast("Administrator access removed.");
    adminState.data=null;
    await loadAdmin();
    adminOpenTab("admin-access");
  }
};

function renderAdminTab(){
  const d=adminState.data||{};
  const box=$("adminContent");
  if(!box)return;

  if(adminState.tab==="overview"){
    box.innerHTML=`
      <div class="admin-stat-grid">
        <div class="admin-stat"><div class="person-sub">LEVELS</div><b>${d.levels?.length||0}</b></div>
        <div class="admin-stat"><div class="person-sub">SUBMISSIONS</div><b>${d.submissions?.length||0}</b></div>
        <div class="admin-stat"><div class="person-sub">COMPLETIONS</div><b>${d.completions?.length||0}</b></div>
        <div class="admin-stat"><div class="person-sub">PROFILES</div><b>${d.profiles?.length||0}</b></div>
        <div class="admin-stat"><div class="person-sub">CHANGES</div><b>${d.changes?.length||0}</b></div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div><h3 style="margin:0">Quick actions</h3><div class="person-sub">Common administrator actions.</div></div>
          <button class="primary" onclick="createLevel()">+ Add Level</button>
        </div>
        <div class="form-actions" style="margin-top:16px">
          <button class="mini" onclick="adminOpenTab('levels')">Manage Levels</button>
          <button class="mini" onclick="adminOpenTab('submissions')">Review Submissions</button>
          <button class="mini" onclick="adminOpenTab('completions')">Review Completions</button>
          <button class="mini" onclick="adminOpenTab('profiles')">Moderate Profiles</button>
        </div>
      </div>`;
    return;
  }

  if(adminState.tab==="admin-access"){
    renderAdminAccessTab(); return;
  }
  if(["staff-applications","staff-management","staff-actions"].includes(adminState.tab)){
    renderStaffAdminTab(adminState.tab); return;
  }

  if(adminState.tab==="levels"){
    box.innerHTML=`
      <div class="panel">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div><h3 style="margin:0">Level Manager</h3><div class="person-sub">${d.levels?.length||0} levels loaded.</div></div>
          <button class="primary" onclick="createLevel()">+ Add Level</button>
        </div>
        <div style="margin-top:12px">
          ${(d.levels||[]).slice(0,100).map(x=>`
            <div class="admin-row">
              <div style="min-width:220px">
                <b>#${x.current_rank||"—"} · ${escapeHTML(x.name)}</b>
                <div class="person-sub">${escapeHTML(x.creator)} · ${escapeHTML(x.status)} · GD ${escapeHTML(x.gd_level_id)}</div>
              </div>
              <div class="mini-actions">
                <input id="rank-${x.id}" type="number" min="1" value="${x.current_rank||""}" style="width:76px;padding:7px 8px">
                <button class="mini" onclick="updateLevelRank('${x.id}')">Save Rank</button>
                <button class="mini" onclick="editLevel('${x.id}')">Edit</button>
                <button class="mini success" onclick="setLevelStatus('${x.id}','unbeaten')">Unbeaten</button>
                <button class="mini" onclick="setLevelStatus('${x.id}','beaten')">Beaten</button>
                <button class="mini" onclick="setLevelStatus('${x.id}','archived')">Archive</button>
                <button class="mini danger" onclick="deleteLevel('${x.id}')">Delete</button>
              </div>
            </div>`).join("")||'<div class="empty">No levels.</div>'}
        </div>
      </div>`;
    return;
  }

  if(adminState.tab==="submissions"){
    box.innerHTML=`
      <div class="panel"><h3 style="margin-top:0">Submission Review</h3>
      ${(d.submissions||[]).slice(0,100).map(x=>`
        <div class="admin-row">
          <div><b>${escapeHTML(x.level_name)}</b><div class="person-sub">${escapeHTML(x.creator)} · ${escapeHTML(x.status)}</div></div>
          <div class="mini-actions"><button class="mini success" onclick="reviewSubmission('${x.id}','approved')">Approve</button><button class="mini danger" onclick="reviewSubmission('${x.id}','rejected')">Reject</button></div>
        </div>`).join("")||'<div class="empty">No submissions.</div>'}
      </div>`;
    return;
  }

  if(adminState.tab==="completions"){
    box.innerHTML=`
      <div class="panel"><h3 style="margin-top:0">Progress & Completion Review</h3>
      <div class="person-sub">Guest and account submissions appear here for approval.</div>
      ${(d.completions||[]).slice(0,200).map(x=>`
        <div class="admin-row">
          <div style="min-width:0">
            <b>${escapeHTML(x.player_name)} · ${escapeHTML(x.progress)}%</b>
            <div class="person-sub">${escapeHTML(x.levels?.name||"Level")} · ${escapeHTML(x.country)} · ${escapeHTML(x.status)} · ${fmtTime(x.created_at)}</div>
            ${x.video_url?'<a href="'+escapeHTML(x.video_url)+'" target="_blank" rel="noopener" class="person-sub">Open proof video</a>':""}
          </div>
          <div class="mini-actions"><button class="mini success" onclick="reviewCompletion('${x.id}','approved')">Approve</button><button class="mini danger" onclick="reviewCompletion('${x.id}','rejected')">Reject</button></div>
        </div>`).join("")||'<div class="empty">No progress submissions yet.</div>'}
      </div>`;
    return;
  }

  if(adminState.tab==="profiles"){
    box.innerHTML=`
      <div class="panel"><h3 style="margin-top:0">Profile Moderation</h3>
      ${(d.profiles||[]).slice(0,100).map(x=>`
        <div class="admin-row">
          <div><b>${escapeHTML(x.username)}</b><div class="person-sub">${escapeHTML(x.moderation_status)}</div></div>
          <div class="mini-actions"><button class="mini success" onclick="moderateProfile('${x.user_id}','approved')">Approve</button><button class="mini danger" onclick="moderateProfile('${x.user_id}','restricted')">Restrict</button></div>
        </div>`).join("")||'<div class="empty">No profiles.</div>'}
      </div>`;
  }

  if(adminState.tab==="creators"){
    const stored=new Map((d.creators||[]).map(x=>[String(x.username||"").trim().toLowerCase(),x]));
    const names=new Map();
    (d.levels||[]).forEach(x=>{
      String(x.creator||"").split(",").map(v=>v.trim()).filter(Boolean).forEach(name=>{
        names.set(name.toLowerCase(),name);
      });
    });
    (d.creators||[]).forEach(x=>{
      const name=String(x.username||"").trim();
      if(name) names.set(name.toLowerCase(),name);
    });

    const rows=[...names.values()].sort((a,b)=>a.localeCompare(b));
    box.innerHTML=`
      <div class="panel">
        <div><h3 style="margin:0">Creator Profiles</h3><div class="person-sub">Creators are generated from levels. Edit the trusted YouTube @handle directly.</div></div>
        <div style="margin-top:12px">
          ${rows.map(name=>{
            const p=stored.get(name.toLowerCase());
            const handle=String(p?.youtube_handle||"").trim() ||
              ((String(p?.youtube_url||"").match(/youtube\.com\/@([^/?#]+)/i)||[])[1] ? "@"+String(p.youtube_url).match(/youtube\.com\/@([^/?#]+)/i)[1] : "");
            const channel=String(p?.youtube_channel_id||"").trim();
            const label=handle || channel || (p?.youtube_url ? "YouTube linked" : "");
            return `<div class="admin-row">
              <div>
                <b>${escapeHTML(name)}</b>
                <div class="person-sub">${label ? "YouTube · "+escapeHTML(label) : "No YouTube profile set"}</div>
              </div>
              <div class="mini-actions">
                <button class="mini ${handle?"success":""}" data-edit-creator="${escapeHTML(name)}">Edit Profile</button>
              </div>
            </div>`;
          }).join("") || '<div class="empty">No creators yet.</div>'}
        </div>
      </div>`;
    box.querySelectorAll("[data-edit-creator]").forEach(btn=>{
      btn.onclick=()=>editCreatorProfile(btn.dataset.editCreator||"");
    });
    return;
  }

  if(adminState.tab==="players"){
    const stored=new Map((d.players||[]).map(x=>[String(x.username||"").trim().toLowerCase(),x]));
    const names=new Map();

    function extractWRPlayer(value){
      const raw=String(value||"").trim();
      if(!raw) return "";
      const parts=raw.split(/\s+[—–-]\s+/);
      const candidate=(parts[0]||"").trim();
      return candidate && /[A-Za-z]/.test(candidate) ? candidate : "";
    }

    (d.levels||[]).forEach(x=>{
      const player=extractWRPlayer(x.current_wr);
      if(player) names.set(player.toLowerCase(),player);
    });
    (d.players||[]).forEach(x=>{
      const player=String(x.username||"").trim();
      if(player) names.set(player.toLowerCase(),player);
    });

    const rows=[...names.values()].sort((a,b)=>a.localeCompare(b));
    box.innerHTML=`
      <div class="panel">
        <div><h3 style="margin:0">Player Profiles</h3><div class="person-sub">Players are generated from Current WRs. Edit the trusted YouTube @handle directly.</div></div>
        <div style="margin-top:12px">
          ${rows.map(name=>{
            const p=stored.get(name.toLowerCase());
            const linked=!!p?.youtube_url;
            return `<div class="admin-row">
              <div>
                <b>${escapeHTML(name)}</b>
                <div class="person-sub">${linked ? "YouTube linked · "+escapeHTML(p.youtube_handle||p.youtube_channel_id||p.youtube_url) : "No YouTube profile linked"}</div>
              </div>
              <div class="mini-actions">
                <button class="mini ${linked?"success":""}" data-edit-player="${escapeHTML(name)}">${linked?"Change YouTube":"Link YouTube"}</button>
              </div>
            </div>`;
          }).join("") || '<div class="empty">No players yet.</div>'}
        </div>
      </div>`;
    box.querySelectorAll("[data-edit-player]").forEach(btn=>{
      btn.onclick=()=>editPlayerProfile(btn.dataset.editPlayer||"");
    });
    return;
  }
}

function adminOpenTab(tab){
  adminState.tab=tab;
  document.querySelectorAll("[data-admin-tab]").forEach(x=>x.classList.toggle("active",x.dataset.adminTab===tab));
  renderAdminTab();
}

async function loadAdmin(){
  const box=$("adminContent");
  if(!box)return;
  box.innerHTML='<div class="empty">Checking access…</div>';
  const s=await session();
  if(!s){box.innerHTML='<div class="empty">Sign in with an admin account.</div>';return}
  const r=await fetch(API.admin+"?t="+Date.now(),{cache:"no-store",headers:{Authorization:"Bearer "+s.access_token}});
  const j=await r.json();
  if(!r.ok){box.innerHTML='<div class="empty">Admin access required.</div>';return}
  adminState.data=j.data||{};
  const adminAccessTab=$("adminAccessTab");
  if(adminAccessTab) adminAccessTab.style.display=adminState.data.admin?.role==="owner"?"block":"none";
  adminTabButtons();
  renderAdminTab();
}

window.reviewCompletion=async(id,status)=>{
  const j=await adminPost({action:"review_completion",id,status});
  if(j){toast("Progress submission "+status+".");adminState.data=null;loadAdmin();}
};

window.reviewSubmission=async(id,status)=>{
  const j=await adminPost({action:"review_submission",id,status});
  if(j){toast("Submission updated."); adminState.data=null; loadAdmin();}
};

window.editPlayerProfile=async(username)=>{
  const p=(adminState.data?.players||[]).find(x=>String(x.username||"").trim().toLowerCase()===String(username||"").trim().toLowerCase())||{};
  let current=String(p.youtube_handle||"").trim();
  if(!current){
    const m=String(p.youtube_url||"").match(/youtube\.com\/@([^/?#]+)/i);
    if(m) current="@"+m[1];
  }
  const currentCountry=countryCode(p.country);
  const result=await openAdminDialog({
    title:"Edit Player Profile",
    subtitle:"Set the player's country and optional YouTube profile.",
    confirmText:"Save Profile",
    fields:[
      {key:"country",label:"Country / flag",type:"select",value:currentCountry,options:[{value:"",label:"🌐 Not set"},...COUNTRY_OPTIONS.map(x=>({value:x.value,label:x.flag+" "+x.label}))],wide:true},
      {key:"youtube_handle",label:"YouTube @handle",value:current,placeholder:"@example",wide:true}
    ]
  });
  if(!result)return;
  let handle=String(result.youtube_handle||"").trim();
  if(handle && !handle.startsWith("@")) handle="@"+handle;
  if(handle && !/^@[A-Za-z0-9._-]{2,30}$/.test(handle)){
    toast("Enter a valid YouTube @handle.");
    return;
  }
  const youtubeUrl=handle?"https://www.youtube.com/"+handle:(p.youtube_url||"");
  const j=await adminPost({action:"link_player_youtube",username,country:result.country||"",youtube_url:youtubeUrl,youtube_channel_id:handle?"":(p.youtube_channel_id||""),youtube_handle:handle});
  if(j){
    toast("Player profile updated.");
    adminState.data=null;
    loadAdmin();
    loadCommunity();
  }
};

window.editCreatorProfile=async(username)=>{
  const p=(adminState.data?.creators||[]).find(x=>String(x.username||"").trim().toLowerCase()===String(username||"").trim().toLowerCase())||{};
  let current=String(p.youtube_handle||"").trim();
  if(!current) current=String(p.youtube_url||"").trim();
  const result=await openAdminDialog({
    title:"Edit Creator Profile",
    subtitle:"Set a YouTube @handle or channel URL for "+username+".",
    confirmText:"Save Profile",
    fields:[{key:"youtube",label:"YouTube handle or channel URL",value:current,placeholder:"@example or https://www.youtube.com/channel/UC...",wide:true}]
  });
  if(!result)return;
  const raw=String(result.youtube||"").trim();
  let handle="",youtubeUrl="",channelId="";
  if(raw){
    if(/^UC[A-Za-z0-9_-]+$/.test(raw)){
      channelId=raw;
      youtubeUrl="https://www.youtube.com/channel/"+channelId;
    }else if(/^@?[A-Za-z0-9._-]{2,30}$/.test(raw)){
      handle=raw.startsWith("@")?raw:"@"+raw;
      youtubeUrl="https://www.youtube.com/"+handle;
    }else{
      try{
        const u=new URL(raw), host=u.hostname.toLowerCase(), parts=u.pathname.split("/").filter(Boolean);
        if((host==="youtube.com"||host==="www.youtube.com")&&parts[0]?.toLowerCase()==="channel"&&/^UC[A-Za-z0-9_-]+$/.test(parts[1]||"")){
          channelId=parts[1]; youtubeUrl="https://www.youtube.com/channel/"+channelId;
        }else if((host==="youtube.com"||host==="www.youtube.com")&&/^@[A-Za-z0-9._-]{2,30}$/.test(parts[0]||"")){
          handle=parts[0]; youtubeUrl="https://www.youtube.com/"+handle;
        }else{
          toast("Enter a YouTube @handle or /channel/UC... URL."); return;
        }
      }catch{
        toast("Enter a valid YouTube @handle or channel URL."); return;
      }
    }
  }
  const j=await adminPost({action:"link_creator_youtube",username,youtube_url:youtubeUrl,youtube_channel_id:channelId,youtube_handle:handle});
  if(j){
    toast("Creator profile updated.");
    adminState.data=null;
    loadAdmin();
    loadCommunity();
  }
};
window.moderateProfile=async(id,status)=>{
  const result=await openAdminDialog({
    title:status==="approved"?"Approve profile":"Restrict profile",
    subtitle:"Add an optional moderation note.",
    fields:[{key:"reason",label:"Moderation note",type:"textarea",value:"",placeholder:"Why is this action being taken?",wide:true}],
    confirmText:status==="approved"?"Approve":"Restrict",
    danger:status!=="approved"
  });
  if(!result)return;
  const j=await adminPost({action:"moderate_profile",user_id:id,status,reason:result.reason||""});
  if(j){toast("Profile updated."); adminState.data=null; loadAdmin();}
};

window.setLevelStatus=async(id,status)=>{
  const j=await adminPost({action:"set_level_status",id,status});
  if(j){toast("Level status updated."); adminState.data=null; loadAdmin(); loadLevels();}
};

window.updateLevelRank=async(id)=>{
  const rank=Number($("rank-"+id)?.value);
  if(!Number.isInteger(rank)||rank<1){toast("Enter a valid rank.");return}
  const j=await adminPost({action:"update_rank",id,rank});
  if(j){toast("Rank updated."); adminState.data=null; loadAdmin(); loadLevels();}
};

window.deleteLevel=async(id)=>{
  const result=await openAdminDialog({
    title:"Delete level",
    subtitle:"This permanently removes the level and its stored history.",
    fields:[{key:"confirm",label:"Type DELETE to confirm",type:"text",placeholder:"DELETE",wide:true}],
    confirmText:"Delete",
    danger:true
  });
  if(!result || result.confirm.trim()!=="DELETE"){if(result)toast("Deletion cancelled.");return}
  const j=await adminPost({action:"delete_level",id});
  if(j){
    if(adminState.data?.levels){
      adminState.data.levels=adminState.data.levels.filter(level=>level.id!==id);
      renderAdminTab();
    }
    toast("Level deleted.");
    loadLevels();
    loadAdmin();
  }
};

window.editLevel=async(id)=>{
  const s=await session(); if(!s)return;
  const r=await fetch(API.admin+"?t="+Date.now(),{cache:"no-store",headers:{Authorization:"Bearer "+s.access_token}});
  const j=await r.json(); if(!r.ok)return;
  const x=(j.data?.levels||[]).find(v=>v.id===id);
  if(!x){toast("Level not found.");return}

  const result=await openAdminDialog({
    title:"Edit level",
    subtitle:"Update the level information.",
    confirmText:"Save changes",
    fields:[
      {key:"name",label:"Level name",value:x.name},
      {key:"creator",label:"Creator",value:x.creator},
      {key:"gd",label:"Geometry Dash ID",type:"number",value:x.gd_level_id},
      {key:"current_wr",label:"Current WR",value:x.current_wr||"",normalize:"percent"},
      {key:"difficulty",label:"Geometry Dash difficulty",type:"select",value:levelDifficulty(x),options:GD_DIFFICULTIES.map(v=>({value:v,label:v}))},
      {key:"description",label:"Description",type:"textarea",value:x.description||"",wide:true},
      {key:"verification_url",label:"YouTube / Verification URL",value:x.verification_url||""},
      {key:"notes",label:"Admin notes",type:"textarea",value:x.notes||"",wide:true}
    ]
  });
  if(!result)return;
  const gd=Number(result.gd);
  if(!result.name?.trim()||!result.creator?.trim()||!Number.isInteger(gd)||gd<0){
    toast("Level name, creator and a valid GD ID are required.");return;
  }
  const autoThumb=youtubeThumbnail(result.verification_url);
  const j2=await adminPost({
    action:"update_level",id,name:result.name.trim(),creator:result.creator.trim(),gd_level_id:gd,difficulty:result.difficulty||"Extreme Demon",min_progress:result.min_progress===""?null:Number(result.min_progress),
    current_wr:normalizeCurrentWR(result.current_wr),
    description:result.description||"",verification_url:result.verification_url||"",
    thumbnail_url:autoThumb||"",notes:result.notes||""
  });
  if(j2){toast("Level saved."); adminState.data=null; loadAdmin(); loadLevels();}
};

window.createLevel=async()=>{
  const result=await openAdminDialog({
    title:"Add level",
    subtitle:"Create a new entry for the Possible list.",
    confirmText:"Add level",
    fields:[
      {key:"gd",label:"Geometry Dash ID",type:"number",placeholder:"Auto-filled from level name",readonly:true},
      {key:"current_wr",label:"Current WR",placeholder:"Player name / record",normalize:"percent"},
      {key:"difficulty",label:"Geometry Dash difficulty",type:"select",value:"Extreme Demon",options:GD_DIFFICULTIES.map(v=>({value:v,label:v}))},
      {key:"name",label:"Level name",placeholder:"Level name"},
      {key:"creator",label:"Creator",placeholder:"Creator"},
      {key:"verification_url",label:"YouTube / Verification URL",placeholder:"https://youtube.com/watch?v=...",wide:true},
      {key:"description",label:"Description",type:"textarea",placeholder:"Optional level description.",wide:true},
      {key:"notes",label:"Admin notes",type:"textarea",placeholder:"Optional.",wide:true}
    ]
  });
  if(!result)return;
  let gd=Number(result.gd);
  if((!Number.isInteger(gd)||gd<0) && result.name?.trim()){
    try{
      const r=await fetch("https://gdbrowser.com/api/search/"+encodeURIComponent(result.name.trim())+"?type=0&count=20",{cache:"no-store"});
      const rows=await r.json();
      const list=Array.isArray(rows)?rows:[];
      const exact=list.filter(x=>String(x?.name||"").trim().toLowerCase()===result.name.trim().toLowerCase());
      const chosen=(result.creator?.trim() && exact.find(x=>String(x?.author||"").trim().toLowerCase()===result.creator.trim().toLowerCase()))||exact[0]||list[0];
      gd=Number(chosen?.id);
    }catch(e){ gd=NaN; }
  }
  if(!Number.isInteger(gd)||gd<0||!result.name?.trim()||!result.creator?.trim()){
    toast("GD ID, level name and creator are required.");return;
  }
  const autoThumb=youtubeThumbnail(result.verification_url);
  const j=await adminPost({
    action:"create_level",gd_level_id:gd,name:result.name.trim(),creator:result.creator.trim(),difficulty:result.difficulty||"Extreme Demon",min_progress:result.min_progress===""?null:Number(result.min_progress),
    current_wr:normalizeCurrentWR(result.current_wr),
    description:result.description||"",verification_url:result.verification_url||"",
    thumbnail_url:autoThumb,notes:result.notes||""
  });
  if(j){toast("Level added."); adminState.data=null; loadAdmin(); loadLevels();}
};

const channel=sb.channel("possible-live")
  .on("postgres_changes",{event:"*",schema:"public",table:"levels"},async()=>{await Promise.all([loadLevels(),loadChanges(),loadCommunity()]);if(await checkAdmin(await session())) await loadAdmin();toast("Rankings and creators updated live.");})
  .on("postgres_changes",{event:"*",schema:"public",table:"list_changes"},()=>{loadChanges();loadShortestReign();})
  .on("postgres_changes",{event:"*",schema:"public",table:"creators"},()=>loadCommunity())
  .on("postgres_changes",{event:"*",schema:"public",table:"players"},()=>loadCommunity())
  .on("postgres_changes",{event:"*",schema:"public",table:"staff_members"},()=>loadStaff())
  .subscribe();

async function loadAccount(){
  const s=await session();
  let username=s?.user?.user_metadata?.username||"Not signed in";
  if(s?.user?.id){
    const {data}=await sb.from("profiles").select("username").eq("user_id",s.user.id).maybeSingle();
    if(data?.username)username=data.username;
  }
  $("accountEmail").textContent=username;
  const isAdmin=await checkAdmin(s);
  $("accountRole").textContent=isAdmin?"OWNER / ADMIN":"USER";
}

const startHash=(location.hash||"#rankings").slice(1);
const initialView=["rankings","creators","players","changes","time-machine","submit","staff","account","admin"].includes(startHash)?startHash:"rankings";
showView(initialView);
// Hydrate off-screen sections too, so visitors never see permanent loading placeholders when opening them later.
loadCommunity();
loadChanges();
loadShortestReign();
refreshAuth();
