import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const STORAGE_KEY = 'my-parking-records-v2';
const A = '/assets/';

function loadRecords(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveRecords(records){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function formatElapsed(startedAt){
  const diff = Math.max(0, Date.now() - startedAt);
  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (days > 0) return `${days}일 ${h}시간 ${m}분`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}
function formatDate(ts){
  const d = new Date(ts);
  return `${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 주차`;
}
function Img({ name, className, alt }){ return <img className={className || ''} src={`${A}${name}.png`} alt={alt || ''} draggable="false"/>; }
function Header(){ return <header className="header"><Img name="logo" className="logo" alt="주차 로고"/></header>; }
function Copyright(){ return <div className="copyright">© 2026. All rights reserved.</div>; }

function NewParking({ onSave, recordsCount }){
  const [image, setImage] = useState('');
  const [memo, setMemo] = useState('');
  const [placeType, setPlaceType] = useState('지상');
  const [floor, setFloor] = useState('');
  const [keep, setKeep] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onPick(e){
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(await fileToDataUrl(file));
  }
  function startParking(){
    const record = { id: crypto.randomUUID(), image, memo, placeType, floor, startedAt: Date.now(), keep, active: true };
    onSave(record);
    setSaved(true);
  }
  return <>
    <Header />
    <main className="paper">
      <Img name="title-photo" className="section-title" alt="기둥사진 찍기"/>
      <label className="photo-box">
        {image ? <img src={image} alt="주차 위치 사진"/> : <Img name="camera-empty" className="camera-empty" alt="사진 찍기"/>}
        <input type="file" accept="image/*" capture="environment" onChange={onPick}/>
      </label>

      <section className="memo-area">
        <Img name="title-memo" className="section-title memo-title" alt="위치 메모메모"/>
        <div className="checks">
          <label><input type="radio" checked={placeType==='지상'} onChange={()=>setPlaceType('지상')}/> 지상</label>
          <label><input type="radio" checked={placeType==='지하'} onChange={()=>setPlaceType('지하')}/> 지하</label>
          <input className="floor" inputMode="numeric" value={floor} onChange={e=>setFloor(e.target.value)} placeholder="__"/> 층
        </div>
        <input className="memo-input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="예: B2 13번 기둥" />
      </section>
    </main>

    <button className="image-button big" onClick={startParking} aria-label="내 차 여기에다 세워뒀음"><Img name="btn-start"/></button>
    <button className="image-button" onClick={()=>setKeep(!keep)} aria-label="돌아올때까지 기억해두기"><Img name={keep ? 'btn-keep-on' : 'btn-keep'}/></button>
    <button className="saved-link" onClick={()=>location.hash='saved'}><Img name="nav-saved" alt="저장됨"/>{recordsCount ? <span>{recordsCount}</span> : null}</button>
    {saved && <div className="toast">저장됨</div>}
    <Copyright />
  </>;
}

function ActiveParking({ record, onFinish, onKeep }){
  const [, setNow] = useState(Date.now());
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()), 1000); return()=>clearInterval(t);},[]);
  return <>
    <Header />
    <main className="paper">
      <section className="active-title">
        <Img name="title-parking" className="section-title" alt="주차중"/>
        <div className="timer"><b>{formatElapsed(record.startedAt)}</b><span>{formatDate(record.startedAt)}</span></div>
      </section>
      <div className="photo-view">{record.image ? <img src={record.image} alt="주차 위치 사진"/> : <Img name="camera-empty" className="camera-empty"/>}</div>
      <section className="memo-area">
        <Img name="title-memo" className="section-title memo-title" alt="위치 메모메모"/>
        <p className="big-memo">{record.placeType} {record.floor && `${record.floor}층`} {record.memo}</p>
      </section>
    </main>
    <button className="image-button" onClick={()=>onFinish(record.id)} aria-label="출차 완료 기록 삭제"><Img name="btn-finish"/></button>
    <button className="image-button" onClick={()=>onKeep(record.id)} aria-label="돌아올때까지 기억해두기"><Img name={record.keep ? 'btn-keep-on' : 'btn-keep'}/></button>
    <button className="saved-link" onClick={()=>location.hash='saved'}><Img name="nav-saved" alt="저장됨"/></button>
    <Copyright />
  </>;
}

function SavedList({ records, onDelete, onNew }){
  return <>
    <Header />
    <main className="paper tall">
      <Img name="title-saved" className="section-title" alt="저장된 주차 위치"/>
      {records.length===0 && <p className="empty"><Img name="empty" alt="저장된 주차 위치가 없어요"/></p>}
      {records.map(r=><article className="saved-item" key={r.id}>
        {r.image?<img src={r.image} alt="저장된 주차 사진"/>:<div/>}
        <div><small>{formatDate(r.startedAt)}</small><p>{r.placeType} {r.floor && `${r.floor}층`}</p><p>{r.memo || '메모 없음'}</p></div>
        <button onClick={()=>onDelete(r.id)} aria-label="삭제">×</button>
      </article>)}
    </main>
    <button className="image-button small" onClick={onNew} aria-label="새로 주차하기"><Img name="btn-new"/></button>
    <Copyright />
  </>;
}

function App(){
  const [records, setRecords] = useState(loadRecords());
  const [route, setRoute] = useState(location.hash.replace('#','') || 'home');
  useEffect(()=>{ const f=()=>setRoute(location.hash.replace('#','')||'home'); addEventListener('hashchange', f); return()=>removeEventListener('hashchange', f);},[]);
  useEffect(()=>saveRecords(records),[records]);
  const active = records.find(r=>r.active);
  const savedRecords = records.filter(r=>r.keep || !r.active);
  if(route==='saved') return <SavedList records={savedRecords} onDelete={id=>setRecords(rs=>rs.filter(r=>r.id!==id))} onNew={()=>{location.hash='home';}}/>;
  if(active) return <ActiveParking record={active} onFinish={id=>setRecords(rs=>rs.filter(r=>r.id!==id || r.keep).map(r=>r.id===id?{...r,active:false}:r))} onKeep={id=>setRecords(rs=>rs.map(r=>r.id===id?{...r,keep:true}:r))}/>;
  return <NewParking recordsCount={savedRecords.length} onSave={r=>setRecords(rs=>[r,...rs])}/>;
}

createRoot(document.getElementById('root')).render(<App/>);
