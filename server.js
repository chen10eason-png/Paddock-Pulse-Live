const express=require('express');
const cors=require('cors');
const WebSocket=require('ws');

const app=express();
app.use(cors());
app.use(express.static('public'));
const PORT=process.env.PORT||3000;
const ORIGIN='https://www.formula1.com';
const HTTP='https://livetiming.formula1.com/signalrcore';
const WS='wss://livetiming.formula1.com/signalrcore';
const RS='\x1e';
const CHANNELS=['TimingData','TimingDataF1','TimingAppData','DriverList','SessionInfo','WeatherData','RaceControlMessages','LapCount','TrackStatus'];
const state={connected:false,lastMessageAt:null,timing:{Lines:{}},app:{Lines:{}},drivers:{},session:{},weather:{},lap:{},track:{},raceControl:[]};

function plain(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function merge(a,b){
  if(!plain(a)||!plain(b)) return b===undefined?a:b;
  for(const k of Object.keys(b)){
    const v=b[k];
    if(v===undefined) continue;
    if(plain(v)){ if(!plain(a[k]))a[k]={}; merge(a[k],v); }
    else if(Array.isArray(v)) a[k]=v.slice();
    else a[k]=v;
  }
  return a;
}
function route(ch,payload){
  if(!payload)return;
  let d=typeof payload==='string'?JSON.parse(payload):payload;
  if(ch==='TimingData'||ch==='TimingDataF1')merge(state.timing,d);
  else if(ch==='TimingAppData')merge(state.app,d);
  else if(ch==='DriverList')merge(state.drivers,d);
  else if(ch==='SessionInfo')merge(state.session,d);
  else if(ch==='WeatherData')merge(state.weather,d);
  else if(ch==='LapCount')merge(state.lap,d);
  else if(ch==='TrackStatus')merge(state.track,d);
  else if(ch==='RaceControlMessages'&&d.Messages){
    const m=Array.isArray(d.Messages)?d.Messages:Object.values(d.Messages);
    state.raceControl=[...state.raceControl,...m].slice(-80);
  }
}
function snapshot(result){
  for(const ch of CHANNELS) if(result?.[ch]) route(ch,result[ch]);
}
async function connect(){
  try{
    const pre=await fetch(HTTP+'/negotiate',{method:'OPTIONS',headers:{'User-Agent':'BestHTTP',Origin:ORIGIN}});
    const cookie=(pre.headers.get('set-cookie')||'').match(/AWSALBCORS=([^;]+)/)?.[1]||'';
    const headers={'User-Agent':'BestHTTP',Origin:ORIGIN,'Content-Type':'text/plain'};
    if(cookie)headers.Cookie='AWSALBCORS='+cookie;
    const n=await fetch(HTTP+'/negotiate?negotiateVersion=1',{method:'POST',headers});
    if(!n.ok)throw Error('Negotiate HTTP '+n.status);
    const j=await n.json();
    const wh={'User-Agent':'BestHTTP',Origin:ORIGIN}; if(cookie)wh.Cookie='AWSALBCORS='+cookie;
    const ws=new WebSocket(WS+'?id='+encodeURIComponent(j.connectionToken),{headers:wh});
    let handshake=false;
    ws.on('open',()=>ws.send('{"protocol":"json","version":1}'+RS));
    ws.on('message',buf=>{
      state.lastMessageAt=new Date().toISOString();
      for(const seg of buf.toString('utf8').split(RS)){
        if(!seg)continue;
        try{
          const f=JSON.parse(seg);
          if(!handshake){
            if(f.error)throw Error(f.error);
            handshake=true; state.connected=true;
            ws.send(JSON.stringify({type:1,invocationId:'0',target:'Subscribe',arguments:[CHANNELS]})+RS);
            continue;
          }
          if(f.type===3&&f.invocationId==='0'&&f.result)snapshot(f.result);
          if(f.type===1&&f.target==='feed'&&f.arguments?.length>=2)route(f.arguments[0],f.arguments[1]);
        }catch(e){}
      }
    });
    ws.on('close',()=>{state.connected=false;setTimeout(connect,5000)});
    ws.on('error',()=>{});
  }catch(e){state.connected=false;setTimeout(connect,5000)}
}
connect();

function currentStint(x){
  const st=x?.Stints;
  if(!st)return null;
  const a=Array.isArray(st)?st:Object.values(st);
  return a.length?a[a.length-1]:null;
}
function rows(){
  const nums=new Set([...Object.keys(state.drivers),...Object.keys(state.timing.Lines||{}),...Object.keys(state.app.Lines||{})]);
  return [...nums].map(n=>{
    const d=state.drivers[n]||{}, t=state.timing.Lines?.[n]||{}, a=state.app.Lines?.[n]||{}, st=currentStint(a);
    return {
      number:n,position:Number(t.Position||a.Position||999),tla:d.Tla||n,name:d.FullName||d.BroadcastName||'',
      team:d.TeamName||'',teamColour:d.TeamColour||'777777',
      gap:t.GapToLeader?.Value||t.GapToLeader||'',interval:t.IntervalToPositionAhead?.Value||t.IntervalToPositionAhead||'',
      lastLap:t.LastLapTime?.Value||'',bestLap:t.BestLapTime?.Value||'',
      inPit:!!t.InPit,pitOut:!!t.PitOut,pitStops:t.NumberOfPitStops??null,
      compound:st?.Compound||'',tyreLaps:st?.TotalLaps??st?.StartLaps??null
    }
  }).sort((a,b)=>a.position-b.position);
}
function demo(){
  return {
    live:false,demo:true,status:'DEMO',session:{Name:'Race',Meeting:{Name:'Paddock Pulse Demo'}},
    lap:{CurrentLap:37,TotalLaps:57},track:{Status:'2',Message:'YELLOW'},
    weather:{AirTemp:'29.1',TrackTemp:'41.8',Humidity:'63',Rainfall:'0',WindSpeed:'2.8'},
    drivers:[
      {position:1,tla:'NOR',number:'4',team:'McLaren',gap:'LEADER',interval:'',compound:'HARD',tyreLaps:18,inPit:false,pitStops:1},
      {position:2,tla:'PIA',number:'81',team:'McLaren',gap:'+2.381',interval:'+2.381',compound:'HARD',tyreLaps:17,inPit:false,pitStops:1},
      {position:3,tla:'VER',number:'1',team:'Red Bull Racing',gap:'+6.824',interval:'+4.443',compound:'MEDIUM',tyreLaps:9,inPit:false,pitStops:2},
      {position:4,tla:'RUS',number:'63',team:'Mercedes',gap:'+9.217',interval:'+2.393',compound:'HARD',tyreLaps:19,inPit:false,pitStops:1},
      {position:5,tla:'LEC',number:'16',team:'Ferrari',gap:'+11.540',interval:'+2.323',compound:'MEDIUM',tyreLaps:10,inPit:true,pitStops:1}
    ],
    raceControl:[{Utc:new Date().toISOString(),Category:'Flag',Flag:'YELLOW',Message:'YELLOW FLAG IN SECTOR 2'}]
  };
}
app.get('/api/live', (req,res)=>{
  if(req.query.demo==='1'||!state.connected||rows().length===0)return res.json(demo());
  res.json({live:true,demo:false,status:'LIVE',lastMessageAt:state.lastMessageAt,session:state.session,lap:state.lap,track:state.track,weather:state.weather,drivers:rows(),raceControl:state.raceControl.slice(-20).reverse()});
});
app.get('/api/status',(req,res)=>res.json({connected:state.connected,lastMessageAt:state.lastMessageAt,drivers:rows().length}));
app.listen(PORT,()=>console.log('Paddock Pulse Live PoC http://localhost:'+PORT));
