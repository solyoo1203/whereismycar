import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const STORAGE_KEY = 'my-parking-records-v1';

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
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h <= 0) return `${min}분`;
  return `${h}시간 ${min}분`;
}
function formatDate(ts){
  const d = new Date(ts);
  return `${d.getMonth()+1}월 ${d.getDate()}일 오후 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 주차`;
}
function DoodleHeader(){
  return <div className="top-doodle"><div className="p-sign">P</div><div className="car"><span></span><b></b><i></i></div></div>
}
function Copyright(){ return <div className="copyright">Copyright © 은소리 All rights reserved.</div> }

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
    <DoodleHeader />
    <main className="paper">
      <section className="title-row"><span className="mini-p green">P</span><h1>기둥사진 찍기</h1></section>
      <label className="photo-box">
        {image ? <img src={image} alt="주차 위치 사진"/> : <div><div className="camera-icon">▣</div><p>탭해서 사진 찍기</p></div>}
        <input type="file" accept="image/*" capture="environment" onChange={onPick}/>
      </label>
      <section className="memo-area"><h2>✎ 위치 메모메모</h2>
        <div className="checks">
          <label><input type="radio" checked={placeType==='지상'} onChange={()=>setPlaceType('지상')}/> 지상</label>
          <label><input type="radio" checked={placeType==='지하'} onChange={()=>setPlaceType('지하')}/> 지하</label>
          <input className="floor" value={floor} onChange={e=>setFloor(e.target.value)} placeholder="___"/> 층
        </div>
        <input className="memo-input" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="예: B2 13번 기둥" />
      </section>
    </main>
    <button className="bubble-button" onClick={startParking}>기억해<br/><b>내 차 여기에다 세웠음</b></button>
    <button className="outline-button" onClick={()=>setKeep(!keep)}>{keep ? '장기 저장하기 켜짐' : '돌아올때까지 이 위치 기억해두기'}</button>
    <button className="link-button" onClick={()=>location.hash='saved'}>저장됨 {recordsCount ? `(${recordsCount})` : ''}</button>
    {saved && <div className="toast">저장됨</div>}
    <Copyright />
  </>
}
function ActiveParking({ record, onFinish, onKeep }){
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()), 1000); return()=>clearInterval(t);},[]);
  return <>
    <DoodleHeader />
    <main className="paper">
      <section className="title-row between"><div><span className="mini-p red">P</span><h1>주차중</h1></div><div className="timer"><b>{formatElapsed(record.startedAt)}</b><span>{formatDate(record.startedAt)}</span></div></section>
      <div className="photo-view">{record.image ? <img src={record.image}/> : null}</div>
      <section className="memo-area"><h2>✎ 위치 메모메모</h2><p className="big-memo">{record.placeType} {record.floor && `${record.floor}층`} {record.memo}</p></section>
    </main>
    <button className="black-button" onClick={()=>onFinish(record.id)}>출차 완료 & 기록 삭제</button>
    <button className="outline-button" onClick={()=>onKeep(record.id)}>돌아올때까지 이 위치 기억해두기</button>
    <button className="link-button" onClick={()=>location.hash='saved'}>저장됨</button>
    <Copyright />
  </>
}
function SavedList({ records, onDelete, onNew }){
  return <><DoodleHeader/><main className="paper tall"><section className="title-row"><span className="phone-icon">▯</span><h1>저장된 주차 위치</h1></section>{records.length===0&&<p className="empty">저장된 주차 위치가 없어요.</p>}{records.map(r=><div className="saved-item" key={r.id}>{r.image?<img src={r.image}/>:<div/>}<div><small>{formatDate(r.startedAt)}</small><p>☑ {r.placeType} □ {r.placeType==='지상'?'지하':'지상'} ____ 층</p><p>{r.memo}</p></div><button onClick={()=>onDelete(r.id)}>×</button></div>)}</main><button className="link-button" onClick={onNew}>새로 주차하기</button><Copyright/></>
}
function App(){
  const [records, setRecords] = useState(loadRecords());
  const [route, setRoute] = useState(location.hash.replace('#','') || 'home');
  useEffect(()=>{ const f=()=>setRoute(location.hash.replace('#','')||'home'); addEventListener('hashchange', f); return()=>removeEventListener('hashchange', f);},[]);
  useEffect(()=>saveRecords(records),[records]);
  const active = records.find(r=>r.active);
  const savedRecords = records.filter(r=>r.keep || !r.active);
  if(route==='saved') return <SavedList records={savedRecords} onDelete={id=>setRecords(rs=>rs.filter(r=>r.id!==id))} onNew={()=>{location.hash='home'}}/>;
  if(active) return <ActiveParking record={active} onFinish={id=>setRecords(rs=>rs.filter(r=>r.id!==id || r.keep).map(r=>r.id===id?{...r,active:false}:r))} onKeep={id=>setRecords(rs=>rs.map(r=>r.id===id?{...r,keep:true}:r))}/>;
  return <NewParking recordsCount={savedRecords.length} onSave={r=>setRecords(rs=>[r,...rs])}/>;
}

createRoot(document.getElementById('root')).render(<App/>);
