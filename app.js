const A = './public/assets/';
const $app = document.querySelector('#app');
const $cameraInput = document.querySelector('#cameraInput');

const STORAGE_KEY = 'my-parking-app-state-v1';
let state = loadState();
let tickTimer = null;

function loadState(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { current:null, saved:[] };
  }catch{
    return { current:null, saved:[] };
  }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function img(name, cls='', alt=''){
  return `<img class="${cls}" src="${A}${name}" alt="${alt}" draggable="false" />`;
}
function nowText(ts){
  const d = new Date(ts);
  const m = d.getMonth()+1;
  const day = d.getDate();
  const ap = d.getHours() < 12 ? '오전' : '오후';
  const h = d.getHours()%12 || 12;
  const min = String(d.getMinutes()).padStart(2,'0');
  return `${m}월 ${day}일 ${ap} ${h}:${min} 주차`;
}
function elapsedText(startedAt){
  const ms = Math.max(0, Date.now() - startedAt);
  const min = Math.floor(ms/60000);
  const days = Math.floor(min/1440);
  const hours = Math.floor((min%1440)/60);
  const mins = min%60;
  if(days > 0) return `${days}일 ${hours}시간 ${mins}분`;
  if(hours > 0) return `${hours}시간 ${mins}분`;
  return `${mins}분`;
}
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function compressImage(dataUrl, maxW=1200, quality=.78){
  return new Promise((resolve)=>{
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxW / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}
function baseLayout(content){
  return `<section class="app">${img('logo-parking.svg','logo','주차 로고')}${content}<p class="footer">Copyright © 은소리 All rights reserved.</p></section>`;
}

function render(){
  clearInterval(tickTimer);
  if(state.current) renderParking();
  else renderStart();
}

function renderStart(){
  $app.innerHTML = baseLayout(`
    <div class="frame-wrap">
      ${img('card-frame.svg','frame-img','')}
      <div class="frame-content">
        ${img('title-photo.svg','title-img title-photo','기둥사진 찍기')}
        <button class="photo-box" id="photoBox" type="button">${img('tap-photo.svg','tap-photo','탭해서 사진찍기')}</button>
        ${img('title-memo.svg','title-img title-memo','위치 메모메모')}
        <textarea class="memo-input" id="memoInput" rows="2" placeholder=""></textarea>
        <div class="floor-row">
          <button class="floor-option" data-floor="upper" type="button">${img('checkbox-on.svg','checkbox','선택')}${img('floor-upper.svg','floor-label upper','지상')}</button>
          <button class="floor-option" data-floor="under" type="button">${img('checkbox-off.svg','checkbox','미선택')}${img('floor-under.svg','floor-label under','지하')}</button>
          <input class="floor-input" id="floorInput" inputmode="numeric" type="number" min="0" />
          <span class="floor-text">층</span>
        </div>
        <div class="bottom-line"></div>
      </div>
    </div>
    <button class="big-button btn-save" id="saveBtn" type="button">${img('btn-save.svg','','내 차 여기에다 세워뒀음')}</button>
    <button class="big-button btn-saved" id="savedBtn" type="button">${img('btn-saved.svg','','저장됨')}</button>
    <p class="notice" id="notice"></p>
  `);

  const draft = { image:null, floorType:'upper' };
  const refreshFloor = () => {
    document.querySelectorAll('.floor-option').forEach(btn=>{
      const on = btn.dataset.floor === draft.floorType;
      btn.querySelector('.checkbox').src = `${A}${on?'checkbox-on.svg':'checkbox-off.svg'}`;
    });
  };
  document.querySelectorAll('.floor-option').forEach(btn=>btn.addEventListener('click',()=>{draft.floorType=btn.dataset.floor;refreshFloor();}));
  document.querySelector('#photoBox').addEventListener('click',()=> $cameraInput.click());
  $cameraInput.onchange = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const raw = await fileToDataURL(file);
    draft.image = await compressImage(raw);
    document.querySelector('#photoBox').classList.add('has-photo');
    document.querySelector('#photoBox').innerHTML = `<img class="photo" src="${draft.image}" alt="촬영한 사진" />`;
    $cameraInput.value = '';
  };
  document.querySelector('#saveBtn').addEventListener('click',()=>{
    const memo = document.querySelector('#memoInput').value.trim();
    const floor = document.querySelector('#floorInput').value.trim();
    if(!draft.image){ document.querySelector('#notice').textContent='사진을 먼저 찍어주세요.'; return; }
    state.current = { id: crypto.randomUUID(), image:draft.image, memo, floorType:draft.floorType, floor, startedAt:Date.now(), keep:false };
    saveState();
    render();
  });
  document.querySelector('#savedBtn').addEventListener('click', renderSaved);
}

function renderParking(){
  const p = state.current;
  const floorLabel = p.floorType === 'under' ? '지하' : '지상';
  $app.innerHTML = baseLayout(`
    <div class="frame-wrap">
      ${img('card-frame.svg','frame-img','')}
      <div class="frame-content">
        <div class="status-row">
          ${img('title-parking.svg','title-img title-parking','주차중')}
          <div class="timer"><span id="elapsed">${elapsedText(p.startedAt)}</span><div class="started">${nowText(p.startedAt)}</div></div>
        </div>
        <img class="parking-photo" src="${p.image}" alt="주차 위치 사진" />
        ${img('title-memo.svg','title-img title-memo','위치 메모메모')}
        <div class="floor-row">
          <span class="floor-option">${img(p.floorType === 'upper' ? 'checkbox-on.svg':'checkbox-off.svg','checkbox','')}${img('floor-upper.svg','floor-label upper','지상')}</span>
          <span class="floor-option">${img(p.floorType === 'under' ? 'checkbox-on.svg':'checkbox-off.svg','checkbox','')}${img('floor-under.svg','floor-label under','지하')}</span>
          <span class="floor-input">${p.floor || ''}</span><span class="floor-text">층</span>
        </div>
        <textarea class="memo-input" id="parkingMemo" rows="2">${escapeHtml(p.memo || `${floorLabel} ${p.floor || ''}층`)}</textarea>
        <div class="bottom-line"></div>
      </div>
    </div>
    <button class="big-button btn-finish" id="finishBtn" type="button">${img('btn-finish.svg','','출차 완료 & 기록 삭제')}</button>
    <button class="big-button btn-remember" id="rememberBtn" type="button">${img('btn-remember.svg','','돌아올때까지 이 위치 기억해두기')}</button>
    <button class="big-button btn-saved" id="savedBtn" type="button">${img('btn-saved.svg','','저장됨')}</button>
  `);
  tickTimer = setInterval(()=>{ const el=document.querySelector('#elapsed'); if(el) el.textContent = elapsedText(p.startedAt); }, 1000);
  document.querySelector('#parkingMemo').addEventListener('input', e => { state.current.memo = e.target.value; saveState(); });
  document.querySelector('#finishBtn').addEventListener('click',()=>{ state.current=null; saveState(); render(); });
  document.querySelector('#rememberBtn').addEventListener('click',()=>{
    state.saved.unshift({...state.current, savedAt:Date.now()});
    state.current = null;
    saveState();
    renderSaved();
  });
  document.querySelector('#savedBtn').addEventListener('click', renderSaved);
}

function renderSaved(){
  clearInterval(tickTimer);
  const items = state.saved.map((p,idx)=>`
    <div class="saved-item">
      <img class="saved-thumb" src="${p.image}" alt="저장된 사진" />
      <button type="button" class="saved-open" data-idx="${idx}">
        <div class="saved-meta">${nowText(p.startedAt)}</div>
        <div class="saved-floor">${img(p.floorType === 'upper' ? 'checkbox-on.svg':'checkbox-off.svg','checkbox','')}${p.floorType === 'upper' ? '지상':'지하'} ${p.floor || ''}층</div>
        <div class="saved-meta">${escapeHtml(p.memo || '')}</div>
      </button>
      <button class="delete-btn" data-delete="${idx}" type="button">×</button>
    </div>`).join('');
  $app.innerHTML = baseLayout(`
    <div class="frame-wrap saved-card">
      ${img('card-frame-save.svg','frame-img','')}
      <div class="frame-content">
        ${img('title-saved-spot.svg','title-img title-saved-spot','저장된 주차 위치')}
        <div class="saved-list">${items || '<div class="empty">저장된 주차 위치가 아직 없어요.</div>'}</div>
      </div>
    </div>
    <button class="link-btn" id="newBtn" type="button">새로 주차하기</button>
  `);
  document.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>{ state.saved.splice(Number(btn.dataset.delete),1); saveState(); renderSaved(); }));
  document.querySelectorAll('.saved-open').forEach(btn=>btn.addEventListener('click',()=>{ state.current = {...state.saved[Number(btn.dataset.idx)]}; saveState(); renderParking(); }));
  document.querySelector('#newBtn').addEventListener('click',()=>{ state.current=null; renderStart(); });
}

function escapeHtml(str){
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
render();
