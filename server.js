const express=require('express');
const cors=require('cors');
const WebSocket=require('ws');
const app=express(); app.use(cors()); app.use(express.static('public'));
const PORT=process.env.PORT||3000,ORIGIN='https://www.formula1.com',HTTP='https://livetiming.formula1.com/signalrcore',WS='wss://livetiming.formula1.com/signalrcore',STATIC='https://livetiming.formula1.com/static/',YEAR=2026,RS='\x1e';
const CHANNELS=['TimingData','TimingDataF1','TimingAppData','DriverList','SessionInfo','SessionStatus','ExtrapolatedClock','WeatherData','RaceControlMessages','LapCount','TrackStatus'];
const state={connected:false,lastMessageAt:null,lastTimingAt:null,timing:{Lines:{}},app:{Lines:{}},drivers:{},session:{},sessionStatus:{},clock:{},weather:{},lap:{},track:{},raceControl:[]};
const archiveCache=new Map();
let bestLapTyres={},bestLapTyreSession='';

let finishTracker={
  session:'',
  active:false,
  kind:'',
  baselineLaps:{},
  baselineLastLap:{},
  flagged:new Set()
};

function parseClockSeconds(v){
  if(v==null||v==='')return null;
  const p=String(v).trim().split(':').map(Number);
  if(p.some(x=>!Number.isFinite(x)))return null;
  if(p.length===3)return p[0]*3600+p[1]*60+p[2];
  if(p.length===2)return p[0]*60+p[1];
  if(p.length===1)return p[0];
  return null;
}
function currentSessionKind(){
  const s=((state.session?.Name||'')+' '+(state.session?.Type||'')).toLowerCase();
  if(s.includes('qualifying'))return'qualifying';
  if(s.includes('practice'))return'practice';
  if(s.includes('race')||s.includes('sprint'))return'race';
  return'other';
}
function resetFinishTracker(){
  finishTracker={
    session:sessionIdentity(state.session),
    active:false,
    kind:currentSessionKind(),
    baselineLaps:{},
    baselineLastLap:{},
    flagged:new Set()
  };
}
function isChequeredMessage(m){
  const f=String(m?.Flag||'').toUpperCase();
  const msg=String(m?.Message||'').toUpperCase();
  return f==='CHEQUERED'||f==='CHECKERED'||
    msg.includes('CHEQUERED FLAG')||msg.includes('CHECKERED FLAG');
}
function beginFinishPhase(kind){
  const sid=sessionIdentity(state.session);
  if(finishTracker.session!==sid)resetFinishTracker();
  if(finishTracker.active)return;

  finishTracker.active=true;
  finishTracker.kind=kind;
  const lines=state.timing?.Lines||{};
  for(const [n,t] of Object.entries(lines)){
    finishTracker.baselineLaps[n]=Number(t?.NumberOfLaps||t?.Laps||0)||0;
    finishTracker.baselineLastLap[n]=String(t?.LastLapTime?.Value||'');
  }

  // In a race, the official chequered message is normally emitted as the
  // leader crosses the line. Mark the current P1 immediately, then let
  // subsequent timing updates flag the rest one-by-one.
  if(kind==='race'){
    let leader=null;
    for(const [n,t] of Object.entries(lines)){
      if(Number(t?.Position)===1){leader=n;break}
    }
    if(leader)finishTracker.flagged.add(String(leader));
  }
}
function updateDriverFinishFromTimingDelta(delta){
  if(!finishTracker.active)return;
  const changed=delta?.Lines||{};
  const lines=state.timing?.Lines||{};
  for(const n of Object.keys(changed)){
    if(finishTracker.flagged.has(String(n)))continue;
    const t=lines[n]||{};
    if(t.Retired||t.Stopped)continue;

    const laps=Number(t.NumberOfLaps||t.Laps||0)||0;
    const base=Number(finishTracker.baselineLaps[n]||0);
    const last=String(t.LastLapTime?.Value||'');
    const baseLast=String(finishTracker.baselineLastLap[n]||'');

    if(laps>base || (last&&baseLast&&last!==baseLast)){
      finishTracker.flagged.add(String(n));
    }
  }
}
function updateFinishPhase(){
  const sid=sessionIdentity(state.session);
  if(!finishTracker.session||finishTracker.session!==sid)resetFinishTracker();

  const kind=currentSessionKind();
  if((kind==='practice'||kind==='qualifying')){
    const remaining=parseClockSeconds(state.clock?.Remaining);
    if(Number.isFinite(remaining)&&remaining<=0)beginFinishPhase(kind);
  }

  const ss=String(sessionStatusValue()).toLowerCase();
  if(['finished','finalised','ended'].includes(ss)&&
     (kind==='practice'||kind==='qualifying')&&!finishTracker.active){
    beginFinishPhase(kind);
  }
}


function plain(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function merge(a,b){if(!plain(a)||!plain(b))return b===undefined?a:b;for(const k of Object.keys(b)){const v=b[k];if(v===undefined)continue;if(plain(v)){if(!plain(a[k]))a[k]={};merge(a[k],v)}else if(Array.isArray(v))a[k]=v.slice();else a[k]=v}return a}
function sessionIdentity(info){const m=info?.Meeting||{};return [m.Key||m.Name||'',info?.Key||info?.Name||info?.Type||''].join('|')}
function route(ch,payload){
  if(payload==null)return;
  if(ch==='TimingData'||ch==='TimingDataF1')state.lastTimingAt=new Date().toISOString();
  const d=typeof payload==='string'?JSON.parse(payload):payload;
  if(ch==='TimingData'||ch==='TimingDataF1')merge(state.timing,d);
  else if(ch==='TimingAppData')merge(state.app,d);
  else if(ch==='DriverList')merge(state.drivers,d);
  else if(ch==='SessionInfo'){
    const before=sessionIdentity(state.session);
    merge(state.session,d);
    const after=sessionIdentity(state.session);
    if(after&&before&&after!==before){bestLapTyres={};state.raceControl=[];resetFinishTracker()}
    if(after&&after!==bestLapTyreSession){bestLapTyres={};bestLapTyreSession=after}
  }
  else if(ch==='SessionStatus'){if(plain(d))merge(state.sessionStatus,d);else state.sessionStatus={Status:String(d)}}
  else if(ch==='ExtrapolatedClock')merge(state.clock,d);
  else if(ch==='WeatherData')merge(state.weather,d);
  else if(ch==='LapCount')merge(state.lap,d);
  else if(ch==='TrackStatus')merge(state.track,d);
  else if(ch==='RaceControlMessages'&&d.Messages){
    const m=(Array.isArray(d.Messages)?d.Messages:Object.values(d.Messages)).filter(plain);
    state.raceControl=[...state.raceControl,...m].slice(-100);
    if(currentSessionKind()==='race'&&m.some(isChequeredMessage))beginFinishPhase('race');
  }
  if(ch==='TimingData'||ch==='TimingDataF1'){
    captureBestLapTyres();
    updateDriverFinishFromTimingDelta(d);
  }else if(ch==='TimingAppData'){
    captureBestLapTyres();
  }
  updateFinishPhase();
}
function snapshot(result){for(const ch of CHANNELS)if(result?.[ch]!=null)route(ch,result[ch])}
async function connect(){try{const pre=await fetch(HTTP+'/negotiate',{method:'OPTIONS',headers:{'User-Agent':'BestHTTP',Origin:ORIGIN}});const cookie=(pre.headers.get('set-cookie')||'').match(/AWSALBCORS=([^;]+)/)?.[1]||'';const headers={'User-Agent':'BestHTTP',Origin:ORIGIN,'Content-Type':'text/plain'};if(cookie)headers.Cookie='AWSALBCORS='+cookie;const n=await fetch(HTTP+'/negotiate?negotiateVersion=1',{method:'POST',headers});if(!n.ok)throw Error('Negotiate HTTP '+n.status);const j=await n.json(),wh={'User-Agent':'BestHTTP',Origin:ORIGIN};if(cookie)wh.Cookie='AWSALBCORS='+cookie;const ws=new WebSocket(WS+'?id='+encodeURIComponent(j.connectionToken),{headers:wh});let handshake=false;ws.on('open',()=>ws.send('{"protocol":"json","version":1}'+RS));ws.on('message',buf=>{state.lastMessageAt=new Date().toISOString();for(const seg of buf.toString('utf8').split(RS)){if(!seg)continue;try{const f=JSON.parse(seg);if(!handshake){if(f.error)throw Error(f.error);handshake=true;state.connected=true;ws.send(JSON.stringify({type:1,invocationId:'0',target:'Subscribe',arguments:[CHANNELS]})+RS);continue}if(f.type===3&&f.invocationId==='0'&&f.result)snapshot(f.result);if(f.type===1&&f.target==='feed'&&f.arguments?.length>=2)route(f.arguments[0],f.arguments[1])}catch(e){}}});ws.on('close',()=>{state.connected=false;setTimeout(connect,5000)});ws.on('error',()=>{})}catch(e){state.connected=false;setTimeout(connect,5000)}}
connect();

function stintList(x){const st=x?.Stints;if(!st)return[];return (Array.isArray(st)?st:Object.keys(st).sort((a,b)=>Number(a)-Number(b)).map(k=>st[k])).filter(plain)}
function currentStint(x){const a=stintList(x);return a.length?a[a.length-1]:null}
function compoundForBestLap(t,a){
  const explicit=t?.BestLapTime?.Compound||t?.BestLapTime?.TyreCompound;
  if(explicit)return String(explicit);
  const lap=Number(t?.BestLapTime?.Lap??t?.BestLapTime?.LapNumber??t?.BestLapTime?.LapNum);
  if(!Number.isFinite(lap)||lap<=0)return'';
  let end=0;
  for(const st of stintList(a)){
    const used=Number(st?.TotalLaps);
    if(!Number.isFinite(used)||used<0)continue;
    end+=used;
    if(lap<=end)return st?.Compound||'';
  }
  return'';
}
function captureBestLapTyres(){
  const lines=state.timing?.Lines||{},apps=state.app?.Lines||{};
  const sid=sessionIdentity(state.session);
  if(sid&&sid!==bestLapTyreSession){bestLapTyres={};bestLapTyreSession=sid}
  for(const n of Object.keys(lines)){
    const t=lines[n]||{},best=t.BestLapTime?.Value||'';
    if(!best)continue;
    const current=currentStint(apps[n]||{})?.Compound||'';
    const prior=bestLapTyres[n];
    if(!prior||prior.time!==best){
      bestLapTyres[n]={time:best,compound:current||compoundForBestLap(t,apps[n]||{})||''};
    }else if(!prior.compound&&current){
      prior.compound=current;
    }
  }
}
function extractQualTimes(t){
  const raw=t?.BestLapTimes;
  if(!raw)return [];
  const a=Array.isArray(raw)?raw:Object.keys(raw).sort((x,y)=>Number(x)-Number(y)).map(k=>raw[k]);
  return a.map(x=>x?.Value||x||'').filter(Boolean)
}
function makeRows(drivers,timing,appData,bestCompounds={},chequeredSet=finishTracker.flagged){
  const lines=timing?.Lines||{},apps=appData?.Lines||{};
  const nums=new Set([...Object.keys(drivers||{}),...Object.keys(lines),...Object.keys(apps)]);
  return [...nums].filter(n=>n&&!String(n).startsWith('_')).map(n=>{
    const d=drivers?.[n]||{},t=lines[n]||{},a=apps[n]||{},st=currentStint(a);
    return {
      number:n,position:Number(t.Position||a.Position||999),tla:d.Tla||n,name:d.FullName||d.BroadcastName||'',team:d.TeamName||'',teamColour:d.TeamColour||'777777',
      gap:t.GapToLeader?.Value||t.GapToLeader||'',interval:t.IntervalToPositionAhead?.Value||t.IntervalToPositionAhead||'',
      lastLap:t.LastLapTime?.Value||'',bestLap:t.BestLapTime?.Value||'',
      qualTimes:extractQualTimes(t),
      statsGap:t.Stats?.TimeDiffToFastest?.Value||t.Stats?.TimeDiffToFastest||'',
      statsInterval:t.Stats?.TimeDifftoPositionAhead?.Value||t.Stats?.TimeDifftoPositionAhead||'',
      laps:Number(t.NumberOfLaps||t.Laps||0)||null,
      inPit:!!t.InPit,pitOut:!!t.PitOut,pitStops:t.NumberOfPitStops??null,retired:!!t.Retired,stopped:!!t.Stopped,knockOut:!!t.KnockedOut,
      compound:st?.Compound||'',bestLapCompound:bestCompounds?.[n]?.compound||compoundForBestLap(t,a)||'',chequered:chequeredSet?.has?.(String(n))||false,tyreLaps:st?.TotalLaps??st?.StartLaps??null
    }
  }).sort((a,b)=>a.position-b.position)
}
function rows(){captureBestLapTyres();updateFinishPhase();return makeRows(state.drivers,state.timing,state.app,bestLapTyres,finishTracker.flagged)}
function sessionStatusValue(){return state.sessionStatus?.Status||state.sessionStatus?.SessionStatus||state.session?.SessionStatus||''}
function feedStatus(){if(!state.connected)return'OFFLINE';const ss=String(sessionStatusValue()).toLowerCase(),archive=String(state.session?.ArchiveStatus?.Status||'').toLowerCase();if(['finalised','finished','ended'].includes(ss)||archive==='complete')return'FINAL';if(['started','active','running'].includes(ss)){if(!state.lastTimingAt)return'CONNECTING';return Date.now()-Date.parse(state.lastTimingAt)<=30000?'LIVE':'STALE'}return rows().length?'STALE':'WAITING'}
function safePath(p){return typeof p==='string'&&p.startsWith(String(YEAR)+'/')&&/^[\w\-./]+$/.test(p)&&!p.includes('..')}
async function fetchArchive(rel,ttl=300000){const now=Date.now(),hit=archiveCache.get(rel);if(hit&&now-hit.at<ttl)return hit.data;const r=await fetch(STATIC+rel,{headers:{'User-Agent':'BestHTTP',Origin:ORIGIN,Referer:ORIGIN+'/',Accept:'application/json,text/plain,*/*'}});if(!r.ok)throw Error('Archive HTTP '+r.status+' '+rel);const txt=(await r.text()).replace(/^\uFEFF/,'');const data=JSON.parse(txt);archiveCache.set(rel,{at:now,data});return data}
async function seasonIndex(){return fetchArchive(YEAR+'/Index.json',120000)}
function sessionSortKey(s){const t=Date.parse(s.StartDate||s.EndDate||'');if(Number.isFinite(t))return t;const m=String(s.Path||'').match(/(\d{4}-\d{2}-\d{2})/);return m?Date.parse(m[1]+'T00:00:00Z'):0}
function flattenSessions(idx){const out=[];for(const meeting of idx?.Meetings||[])for(const s of meeting.Sessions||[])if(safePath(s.Path))out.push({...s,meeting:{Key:meeting.Key,Name:meeting.Name,OfficialName:meeting.OfficialName,Location:meeting.Location,Country:meeting.Country,Circuit:meeting.Circuit}});return out.sort((a,b)=>sessionSortKey(a)-sessionSortKey(b))}
async function getTopic(path,topic){if(!safePath(path))throw Error('Bad archive path');const idx=await fetchArchive(path+'Index.json',300000),feed=idx?.Feeds?.[topic],kp=feed?.KeyFramePath;if(!kp)return null;return fetchArchive(path+kp,300000)}
async function buildArchiveSession(path,meta=null){
  const topics=['SessionInfo','TimingData','TimingAppData','DriverList','WeatherData','RaceControlMessages','LapCount','TrackStatus','ExtrapolatedClock'];
  const vals=await Promise.all(topics.map(t=>getTopic(path,t).catch(()=>null)));
  const [session,timing,appData,drivers,weather,raceControl,lap,track,clock]=vals;
  const info=session||{Name:meta?.Name||meta?.Type||'Session',Meeting:meta?.meeting||{}};
  const messages=raceControl?.Messages?(Array.isArray(raceControl.Messages)?raceControl.Messages:Object.values(raceControl.Messages)).filter(plain):[];
  const sameCurrent=sessionIdentity(info)&&sessionIdentity(info)===sessionIdentity(state.session);
  return{version:'0.6.5',source:'archive',live:false,status:'RESULT',connected:state.connected,archivePath:path,lastMessageAt:state.lastMessageAt,lastTimingAt:null,session:info,sessionStatus:'Finalised',clock:clock||{},lap:lap||{},track:track||{},weather:weather||{},drivers:makeRows(drivers||{},timing||{},appData||{},sameCurrent?bestLapTyres:{},sameCurrent?finishTracker.flagged:new Set()),raceControl:messages.slice(-20).reverse()}
}
app.get('/api/live',(req,res)=>{const status=feedStatus();res.json({version:'0.6.5',source:'live',live:status==='LIVE',status,connected:state.connected,lastMessageAt:state.lastMessageAt,lastTimingAt:state.lastTimingAt,session:state.session,sessionStatus:sessionStatusValue(),clock:state.clock,lap:state.lap,track:state.track,weather:state.weather,drivers:rows(),raceControl:state.raceControl.slice(-20).reverse()})});
app.get('/api/archive/meetings',async(req,res)=>{try{const idx=await seasonIndex();const meetings=(idx?.Meetings||[]).map(m=>({Key:m.Key,Name:m.Name,OfficialName:m.OfficialName,Location:m.Location,Country:m.Country,Circuit:m.Circuit,Sessions:(m.Sessions||[]).filter(s=>safePath(s.Path)).map(s=>({Key:s.Key,Name:s.Name,Type:s.Type,StartDate:s.StartDate,EndDate:s.EndDate,Path:s.Path}))}));res.json({version:'0.6.5',year:YEAR,meetings})}catch(e){res.status(502).json({error:String(e.message||e)})}});
app.get('/api/archive/latest',async(req,res)=>{try{const sessions=flattenSessions(await seasonIndex());if(!sessions.length)return res.status(404).json({error:'No archived sessions'});const s=sessions[sessions.length-1];res.json(await buildArchiveSession(s.Path,s))}catch(e){res.status(502).json({error:String(e.message||e)})}});
app.get('/api/archive/session',async(req,res)=>{try{const path=String(req.query.path||'');if(!safePath(path))return res.status(400).json({error:'Invalid path'});res.json(await buildArchiveSession(path))}catch(e){res.status(502).json({error:String(e.message||e)})}});
app.get('/api/status',(req,res)=>res.json({version:'0.6.5',connected:state.connected,status:feedStatus(),lastMessageAt:state.lastMessageAt,lastTimingAt:state.lastTimingAt,sessionStatus:sessionStatusValue()||null,drivers:rows().length}));
app.listen(PORT,()=>console.log('Paddock Pulse Live V0.6.5 http://localhost:'+PORT));
