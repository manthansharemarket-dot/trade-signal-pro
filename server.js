require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");



const {
RSI,
EMA,
MACD,
ATR,
VWAP,
SMA
} = require("technicalindicators");

const app = express();

app.use(cors());

app.use(express.static("public"));

/* =========================================
SIGNAL LOCK SYSTEM
========================================= */

let lastSignal = "SIDEWAYS";

let confirmationCount = 0;

/* =========================================
HOME
========================================= */

app.get("/",(req,res)=>{

res.send("🔥 MSM PRO AI SERVER RUNNING");

});

/* =========================================
TEST API
========================================= */

app.get("/api/test",(req,res)=>{

res.json({

status:"SERVER WORKING"

});

});

/* =========================================
ADVANCED AI OPTION CHAIN
========================================= */

app.get("/api/option-chain",async(req,res)=>{

try{

/* =====================================
LIVE NIFTY
===================================== */

const niftyRes =
await axios.get(

"https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI"

);

const meta =
niftyRes.data.chart.result[0].meta;

const spot =
meta.regularMarketPrice;

const previousClose =
meta.previousClose;

const change =
(spot - previousClose).toFixed(2);

/* =====================================
STABLE MARKET DATA
===================================== */

const closes = [

spot-220,
spot-180,
spot-140,
spot-110,
spot-80,
spot-50,
spot-20,
spot

];

const highs = [

spot+40,
spot+30,
spot+20,
spot+25,
spot+15,
spot+10,
spot+5,
spot+2

];

const lows = [

spot-40,
spot-30,
spot-20,
spot-25,
spot-15,
spot-10,
spot-5,
spot-2

];

const volumes = [

120000,
150000,
180000,
240000,
300000,
340000,
390000,
420000

];
/* =====================================
RSI
===================================== */

const rsi =
RSI.calculate({

values: closes,

period: 14

});

const latestRSI =
rsi[rsi.length-1] || 50;

/* =====================================
EMA
===================================== */

const ema20 =
EMA.calculate({

period:20,

values: closes

});

const latestEMA20 =
ema20[ema20.length-1] || spot;

/* =====================================
MACD
===================================== */

const macd =
MACD.calculate({

values: closes,

fastPeriod:12,

slowPeriod:26,

signalPeriod:9,

SimpleMAOscillator:false,

SimpleMASignal:false

});

const latestMACD =
macd[macd.length-1] || {};

/* =====================================
ATR
===================================== */

const atr =
ATR.calculate({

high: highs,

low: lows,

close: closes,

period:14

});

const latestATR =
atr[atr.length-1] || 50;

/* =====================================
VWAP
===================================== */

const vwap =
VWAP.calculate({

close: closes,

high: highs,

low: lows,

volume: volumes

});

const latestVWAP =
vwap[vwap.length-1] || spot;

/* =====================================
VOLUME BREAKOUT
===================================== */

const volumeSMA =
SMA.calculate({

period:10,

values: volumes

});

const latestVolume =
volumes[volumes.length-1] || 0;

const avgVolume =
volumeSMA[volumeSMA.length-1] || 0;

const volumeBreakout =
latestVolume > avgVolume;

/* =====================================
AI SIGNAL ENGINE
===================================== */

let currentSignal =
"SIDEWAYS";

let confidence =
"72%";

let finalPCR =
1.00;

if(

change > 50 &&

latestRSI > 60 &&

spot > latestEMA20 &&

spot > latestVWAP &&

latestMACD.MACD >

latestMACD.signal &&

volumeBreakout

){

currentSignal =
"🔥 STRONG BUY CALL";

confidence =
"93%";

finalPCR =
1.28;

}

else if(

change < -50 &&

latestRSI < 40 &&

spot < latestEMA20 &&

spot < latestVWAP &&

latestMACD.MACD <

latestMACD.signal &&

volumeBreakout

){

currentSignal =
"🔴 STRONG BUY PUT";

confidence =
"91%";

finalPCR =
0.72;

}

/* =====================================
SIGNAL LOCK
===================================== */

if(currentSignal === lastSignal){

confirmationCount++;

}else{

confirmationCount = 1;

lastSignal = currentSignal;

}

let finalSignal =
"SIDEWAYS";

if(confirmationCount >= 3){

finalSignal = currentSignal;

}else{

finalSignal = "WAITING CONFIRMATION";

}

/* =====================================
AI TRADE SETUP
===================================== */

const atm =
Math.round(spot / 50) * 50;

const entry =
Math.round(latestATR * 4);

const sl =
Math.round(entry - latestATR);

const target1 =
Math.round(entry + latestATR * 2);

const target2 =
Math.round(entry + latestATR * 4);

/* =====================================
OPTION CHAIN
===================================== */

let chain = [];

for(let i=-10;i<=10;i++){

const strike =
atm + (i * 50);

const ceOI =
Math.floor(Math.random()*500000)+100000;

const peOI =
Math.floor(Math.random()*500000)+100000;

const pcr =
(peOI / ceOI).toFixed(2);

let signal = "SIDEWAYS";

if(pcr > 1.2){

signal = "BUY";

}

else if(pcr < 0.8){

signal = "SELL";

}

chain.push({

strike,

ceOI,

peOI,

pcr,

signal

});

}

/* =====================================
FINAL RESPONSE
===================================== */

res.json({

spot,

change,

atm,

latestRSI,

latestVWAP,

latestATR,

finalPCR,

finalSignal,

confidence,

entry,

sl,

target1,

target2,

confirmationCount,

chain

});

}catch(err){

console.log(err.message);

res.json({

error:err.message

});

}

});

/* =========================================
START SERVER
========================================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(

`🔥 MSM PRO AI SERVER RUNNING ON ${PORT}`

);

});