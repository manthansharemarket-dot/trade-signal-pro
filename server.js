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
GLOBAL CACHE
========================================= */

let activeTrade = null;

let cachedResponse = null;

let lastFetch = 0;

/* =========================================
HELPER
========================================= */

function round(num){

return parseFloat(
Number(num).toFixed(2)
);

}

/* =========================================
TEST
========================================= */

app.get("/api/test",(req,res)=>{

res.json({
status:"SERVER WORKING"
});

});

/* =========================================
OPTION CHAIN API
========================================= */

app.get("/api/option-chain",async(req,res)=>{

try{

/* =====================================
CACHE SYSTEM
===================================== */

if(
cachedResponse &&
Date.now() - lastFetch < 15000
){

return res.json(cachedResponse);

}

/* =====================================
LIVE MARKET DATA
===================================== */

const [

niftyRes,
bankRes,
sensexRes,
itRes,
brentRes,
goldRes,
vixRes,
dxyRes

] = await Promise.all([

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/%5ECNXIT"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/BZ=F"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/GC=F"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX"
),

axios.get(
"https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB"
)

]);

/* =====================================
LIVE VALUES
===================================== */

const niftyMeta =
niftyRes.data.chart.result[0].meta;

const spot =
round(
niftyMeta.regularMarketPrice
);

const previousClose =
round(
niftyMeta.previousClose
);

const change =
round(
spot - previousClose
);

const changePercent =
round(
(change / previousClose) * 100
);

const banknifty =
round(
bankRes.data.chart.result[0]
.meta.regularMarketPrice
);

const sensex =
round(
sensexRes.data.chart.result[0]
.meta.regularMarketPrice
);

const niftyIT =
round(
itRes.data.chart.result[0]
.meta.regularMarketPrice
);

const brent =
round(
brentRes.data.chart.result[0]
.meta.regularMarketPrice
);

const gold =
round(
goldRes.data.chart.result[0]
.meta.regularMarketPrice
);

const indiaVix =
round(
vixRes.data.chart.result[0]
.meta.regularMarketPrice
);

const dxy =
round(
dxyRes.data.chart.result[0]
.meta.regularMarketPrice
);

/* =====================================
AI ENGINE DATA
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
INDICATORS
===================================== */

const rsi =
RSI.calculate({
values: closes,
period: 14
});

const latestRSI =
rsi[rsi.length-1] || 50;

const ema20 =
EMA.calculate({
period:20,
values: closes
});

const latestEMA20 =
ema20[ema20.length-1] || spot;

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

const atr =
ATR.calculate({

high: highs,
low: lows,
close: closes,
period:14

});

const latestATR =
atr[atr.length-1] || 50;

const vwap =
VWAP.calculate({

close: closes,
high: highs,
low: lows,
volume: volumes

});

const latestVWAP =
vwap[vwap.length-1] || spot;

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
AI SIGNAL
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
"BUY CALL";

confidence =
"94%";

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
"BUY PUT";

confidence =
"92%";

finalPCR =
0.72;

}

/* =====================================
TRADE SETUP
===================================== */

const atm =
Math.round(spot / 50) * 50;

const entry =
round(latestATR * 4);

const sl =
round(entry - latestATR);

const target1 =
round(entry + latestATR * 2);

const target2 =
round(entry + latestATR * 4);

/* =====================================
LOCK TRADE
===================================== */

if(!activeTrade){

activeTrade = {

signal: currentSignal,

entry,
sl,
target1,
target2,

strike: atm,

status:"ACTIVE",

createdAt: Date.now()

};

}

/* =====================================
TARGET HIT
===================================== */

if(

activeTrade.signal === "BUY CALL" &&
spot >= activeTrade.target1

){

activeTrade.status =
"TARGET HIT";

}

if(

activeTrade.signal === "BUY PUT" &&
spot <= activeTrade.target1

){

activeTrade.status =
"TARGET HIT";

}

/* =====================================
SL HIT
===================================== */

if(

activeTrade.signal === "BUY CALL" &&
spot <= activeTrade.sl

){

activeTrade.status =
"SL HIT";

}

if(

activeTrade.signal === "BUY PUT" &&
spot >= activeTrade.sl

){

activeTrade.status =
"SL HIT";

}

/* =====================================
RESET TRADE
===================================== */

if(

activeTrade.status === "TARGET HIT" ||
activeTrade.status === "SL HIT"

){

if(
Date.now() - activeTrade.createdAt >
60000
){

activeTrade = null;

}

}

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
round(peOI / ceOI);

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

cachedResponse = {

spot,
change,
changePercent,

atm,

banknifty,
sensex,
niftyIT,

brent,
gold,
indiaVix,
dxy,

latestRSI:
round(latestRSI),

latestVWAP:
round(latestVWAP),

latestATR:
round(latestATR),

finalPCR,

finalSignal:
activeTrade.signal,

confidence,

entry,
sl,
target1,
target2,

trade:
activeTrade,

chain

};

lastFetch = Date.now();

res.json(cachedResponse);

}catch(err){

console.log(err.message);

res.json({

spot:0,
banknifty:0,
sensex:0,
niftyIT:0,

brent:0,
gold:0,
indiaVix:0,
dxy:0,

error:true

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
`🔥 MSM PRO LIVE AI SERVER RUNNING ON ${PORT}`
);

});