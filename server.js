const express=require('express');
const cors=require('cors');
const WebSocket=require('ws');
const app=express(); app.use(cors()); app.use(express.static('public'));
const PORT=process.env.PORT||3000, ORIGIN='https://www.formula1.com', HTTP='https://livetiming.formula1.com/signalrcore', WS='wss://livetiming.formula1.com/signalrcore', RS='\\x1e';
const CHANNELS=['TimingData','TimingDataF1','TimingAppData','DriverList','SessionInfo','SessionStatus','ExtrapolatedClock','WeatherData','RaceControlMessages','LapCount','TrackStatus'];
const state={connected:false,lastMessageAt:null,lastTimingAt:null,timing:{Lines:{}},app:{Lines:{}},drivers:{},session:{},sessionStatus:{},clock:{},weather:{},lap:{},track:{},raceControl:[]};

function plain(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function merge(a,b){if(!plain(a)||!plain(b))return b===undefined?a:b;for(const k of Object.keys(b)){const v=b[k];if(v===undefined)continue;if(plain(v)){if(!plain(a[k]))a[k]={};merge(a[k],v)}else if(Array.isArray(v))a[k]=v.slice();else a[k]=v}return a}
function route(ch,payload){
  if(payload==null)return;
  if(ch==='TimingData'||ch==='TimingDataF1')state.lastTimingAt=new Date().toISOString();
  const d=typeof payload==='string'?JSON.parse(payload):payload;
  if(ch==='TimingData'||ch==='TimingDataF1')merge(state.timing,d);
  else if(ch==='TimingAppData')merge(state.app,d);
  else if(ch==='DriverList')merge(state.drivers,d);
  else if(ch==='SessionInfo')merge(state.session,d);
  else if(ch==='SessionStatus'){if(plain(d))merge(state.sessionStatus,d);else state.sessionStatus={Status:String(d)}}
  else if(ch==='ExtrapolatedClock')merge(state.clock,d);
  else if(ch==='WeatherData')merge(state.weather,d);
  else if(ch==='LapCount')merge(state.lap,d);
  else if(ch==='TrackStatus')merge(state.track,d);
  else if(ch==='RaceControlMessages'&&d.Messages){const m=(Array.isArray(d.Messages)?d.Messages:Object.values(d.Messages)).filter(plain);state.raceControl=[...state.raceControl,...m].slice(-100)}
}
function snapshot(result){for(const ch of CHANNELS)if(result?.[ch]!=null)route(ch,result[ch])}
async function connect(){
  try{
    const pre=await fetch(HTTP+'/negotiate',{method:'OPTIONS',headers:{'User-Agent':'BestHTTP',Origin:ORIGIN}});
    const cookie=(pre.headers.get('set-cookie')||'').match(/AWSALBCORS=([^;]+)/)?.[1]||'';
    const headers={'User-Agent':'BestHTTP',Origin:ORIGIN,'Content-Type':'text/plain'};if(cookie)headers.Cookie='AWSALBCORS='+cookie;
    const n=await fetch(HTTP+'/negotiate?negotiateVersion=1',{method:'POST',headers});if(!n.ok)throw Error('Negotiate HTTP '+n.status);
    const j=await n.json(),wh={'User-Agent':'BestHTTP',Origin:ORIGIN};if(cookie)wh.Cookie='AWSALBCORS='+cookie;
    const ws=new WebSocket(WS+'?id='+encodeURIComponent(j.connectionToken),{headers:wh});let handshake=false;
    ws.on('open',()=>ws.send('{"protocol":"json","version":1}'+RS));
    ws.on('message',buf=>{state.lastMessageAt=new Date().toISOString();for(const seg of buf.toString('utf8').split(RS)){if(!seg)continue;try{const f=JSON.parse(seg);if(!handshake){if(f.error)throw Error(f.error);handshake=true;state.connected=true;ws.send(JSON.stringify({type:1,invocationId:'0',target:'Subscribe',arguments:[CHANNELS]})+RS);continue}if(f.type===3&&f.invocationId==='0'&&f.result)snapshot(f.result);if(f.type===1&&f.target==='feed'&&f.arguments?.length>=2)route(f.arguments[0],f.arguments[1])}catch(e){}}});
    ws.on('close',()=>{state.connected=false;setTimeout(connect,5000)});ws.on('error',()=>{})
  }catch(e){state.connected=false;setTimeout(connect,5000)}
}
connect();
function currentStint(x){const st=x?.Stints;if(!st)return null;const a=(Array.isArray(st)?st:Object.values(st)).filter(plain);return a.length?a[a.length-1]:null}
function rows(){const nums=new Set([...Object.keys(state.drivers),...Object.keys(state.timing.Lines||{}),...Object.keys(state.app.Lines||{})]);return [...nums].filter(n=>n&&!String(n).startsWith('_')).map(n=>{const d=state.drivers[n]||{},t=state.timing.Lines?.[n]||{},a=state.app.Lines?.[n]||{},st=currentStint(a);return{number:n,position:Number(t.Position||a.Position||999),tla:d.Tla||n,name:d.FullName||d.BroadcastName||'',team:d.TeamName||'',teamColour:d.TeamColour||'777777',gap:t.GapToLeader?.Value||t.GapToLeader||'',interval:t.IntervalToPositionAhead?.Value||t.IntervalToPositionAhead||'',lastLap:t.LastLapTime?.Value||'',bestLap:t.BestLapTime?.Value||'',inPit:!!t.InPit,pitOut:!!t.PitOut,pitStops:t.NumberOfPitStops??null,retired:!!t.Retired,stopped:!!t.Stopped,knockOut:!!t.KnockedOut,compound:st?.Compound||'',tyreLaps:st?.TotalLaps??st?.StartLaps??null}}).sort((a,b)=>a.position-b.position)}
function sessionStatusValue(){return state.sessionStatus?.Status||state.sessionStatus?.SessionStatus||state.session?.SessionStatus||''}
function feedStatus(){if(!state.connected)return'OFFLINE';const ss=String(sessionStatusValue()).toLowerCase(),archive=String(state.session?.ArchiveStatus?.Status||'').toLowerCase();if(['finalised','finished','ended'].includes(ss)||archive==='complete')return'FINAL';if(['started','active','running'].includes(ss)){if(!state.lastTimingAt)return'CONNECTING';return Date.now()-Date.parse(state.lastTimingAt)<=30000?'LIVE':'STALE'}return rows().length?'STALE':'CONNECTING'}
function demo(){return{version:'0.5.0',live:false,demo:true,status:'DEMO',connected:true,lastMessageAt:new Date().toISOString(),lastTimingAt:new Date().toISOString(),session:{Name:'Race',Meeting:{Name:'Paddock Pulse Demo',Location:'Demo Circuit'}},sessionStatus:'Started',clock:{Remaining:'00:42:13',Extrapolating:true},lap:{CurrentLap:37,TotalLaps:57},track:{Status:'4',Message:'VSC'},weather:{AirTemp:'29.1',TrackTemp:'41.8',Humidity:'63',Rainfall:'0',WindSpeed:'2.8'},drivers:[{number:'4',position:1,tla:'NOR',team:'McLaren',teamColour:'F47600',gap:'',interval:'',lastLap:'1:31.204',bestLap:'1:30.982',pitStops:1,compound:'HARD',tyreLaps:18},{number:'81',position:2,tla:'PIA',team:'McLaren',teamColour:'F47600',gap:'+2.381',interval:'+2.381',lastLap:'1:31.420',bestLap:'1:31.102',pitStops:1,compound:'HARD',tyreLaps:17},{number:'1',position:3,tla:'VER',team:'Red Bull Racing',teamColour:'4781D7',gap:'+6.824',interval:'+4.443',lastLap:'1:30.994',bestLap:'1:30.701',pitStops:2,compound:'MEDIUM',tyreLaps:9},{number:'14',position:18,tla:'ALO',team:'Aston Martin',teamColour:'229971',gap:'12L',interval:'3L',lastLap:'1:42.112',bestLap:'1:31.899',pitStops:2,compound:'SOFT',tyreLaps:7,retired:true}],raceControl:[{Utc:new Date().toISOString(),Lap:37,Category:'SafetyCar',Message:'VIRTUAL SAFETY CAR DEPLOYED'}]}}
app.get('/api/live',(req,res)=>{if(req.query.demo==='1')return res.json(demo());const status=feedStatus();res.json({version:'0.5.0',live:status==='LIVE',demo:false,status,connected:state.connected,lastMessageAt:state.lastMessageAt,lastTimingAt:state.lastTimingAt,session:state.session,sessionStatus:sessionStatusValue(),clock:state.clock,lap:state.lap,track:state.track,weather:state.weather,drivers:rows(),raceControl:state.raceControl.slice(-20).reverse()})});
app.get('/api/status',(req,res)=>res.json({version:'0.5.0',connected:state.connected,status:feedStatus(),lastMessageAt:state.lastMessageAt,lastTimingAt:state.lastTimingAt,sessionStatus:sessionStatusValue()||null,drivers:rows().length}));
app.listen(PORT,()=>console.log('Paddock Pulse Live V0.5 http://localhost:'+PORT));
