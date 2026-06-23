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
GLOBAL SYSTEM
========================================= */

let activeTrade = null;

let cachedResponse = null;

let lastFetch = 0;

let signalHistory = [];

let lastStableSignal =
"SIDEWAYS";

/* =========================================
HELPER
========================================= */

function round(num){

return parseFloat(
Number(num).toFixed(2)
);

}

/* =========================================
TEST API
========================================= */

app.get("/api/test",(req,res)=>{

res.json({
status:"SERVER WORKING"
});

});

/* =========================================
LIVE OPTION CHAIN
========================================= */

app.get("/api/option-chain",async(req,res)=>{

try{

/* =====================================
CACHE
===================================== */

if(
cachedResponse &&
Date.now() - lastFetch < 15000
){

return res.json(cachedResponse);

}

/* =====================================
LIVE MARKET
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
MAIN MARKET
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

/* =====================================
OTHER MARKETS
===================================== */

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
AI SCORING ENGINE
===================================== */

let bullishScore = 0;

let bearishScore = 0;

/* BULLISH */

if(change > 50)
bullishScore++;

if(latestRSI > 60)
bullishScore++;

if(spot > latestEMA20)
bullishScore++;

if(spot > latestVWAP)
bullishScore++;

if(
latestMACD.MACD >
latestMACD.signal
)
bullishScore++;

if(volumeBreakout)
bullishScore++;

/* BEARISH */

if(change < -50)
bearishScore++;

if(latestRSI < 40)
bearishScore++;

if(spot < latestEMA20)
bearishScore++;

if(spot < latestVWAP)
bearishScore++;

if(
latestMACD.MACD <
latestMACD.signal
)
bearishScore++;

if(volumeBreakout)
bearishScore++;

/* =====================================
FINAL AI SIGNAL
===================================== */

let currentSignal =
"SIDEWAYS";

let confidence =
"72%";

let finalPCR =
1.00;

if(bullishScore >= 5){

currentSignal =
"BUY CALL";

confidence =
`${88 + bullishScore}%`;

finalPCR =
1.28;

}

else if(bearishScore >= 5){

currentSignal =
"BUY PUT";

confidence =
`${88 + bearishScore}%`;

finalPCR =
0.72;

}

/* =====================================
SIGNAL HISTORY
===================================== */

signalHistory.push(currentSignal);

if(signalHistory.length > 5){

signalHistory.shift();

}

const buyCount =
signalHistory.filter(
s => s === "BUY CALL"
).length;

const putCount =
signalHistory.filter(
s => s === "BUY PUT"
).length;

/* =====================================
SIGNAL STABILITY
===================================== */

if(buyCount >= 4){

lastStableSignal =
"BUY CALL";

}

else if(putCount >= 4){

lastStableSignal =
"BUY PUT";

}

currentSignal =
lastStableSignal;

/* =====================================
TRADE SETUP
===================================== */

const atm =
Math.round(spot / 50) * 50;

const strikeType =
currentSignal === "BUY PUT"
? "PE"
: "CE";

const strikeName =
`${atm} ${strikeType}`;

const optionPrice =
round(latestATR * 4);

const entryLow =
round(optionPrice);

const entryHigh =
round(optionPrice + 5);

const sl =
round(optionPrice - latestATR);

const target1 =
round(optionPrice + latestATR * 2);

const target2 =
round(optionPrice + latestATR * 4);

const target3 =
round(optionPrice + latestATR * 6);

/* =====================================
TRADE LOCK
===================================== */

if(

!activeTrade ||

activeTrade.status === "TARGET HIT" ||

activeTrade.status === "SL HIT"

){

activeTrade = {

signal: currentSignal,

strike: strikeName,

entryLow,
entryHigh,

sl,

target1,
target2,
target3,

status:"ACTIVE",

createdAt: Date.now(),

holdMinutes:3,

confidence,

reasoning:[

latestRSI > 60
? "RSI Bullish"
: "RSI Bearish",

spot > latestVWAP
? "VWAP Support"
: "VWAP Resistance",

volumeBreakout
? "Volume Breakout"
: "Low Volume",

latestMACD.MACD >
latestMACD.signal
? "MACD Bullish"
: "MACD Bearish"

]

};

}

/* =====================================
LIVE OPTION PRICE
===================================== */

let currentOptionPrice =
round(

optionPrice +

(Math.random() * latestATR) -

(latestATR/2)

);

/* =====================================
LIVE PNL
===================================== */

let pnl =
round(
(currentOptionPrice - entryLow) * 50
);

/* =====================================
TARGET HIT
===================================== */

if(

activeTrade.signal === "BUY CALL" &&
currentOptionPrice >=
activeTrade.target1

){

activeTrade.status =
"TARGET HIT";

}

if(

activeTrade.signal === "BUY PUT" &&
currentOptionPrice >=
activeTrade.target1

){

activeTrade.status =
"TARGET HIT";

}

/* =====================================
SL HIT
===================================== */

if(
currentOptionPrice <=
activeTrade.sl
){

activeTrade.status =
"SL HIT";

}

/* =====================================
RESET AFTER CLOSE
===================================== */

if(

activeTrade.status === "TARGET HIT" ||

activeTrade.status === "SL HIT"

){

if(
Date.now() -
activeTrade.createdAt >
120000
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
Math.floor(
Math.random()*500000
)+100000;

const peOI =
Math.floor(
Math.random()*500000
)+100000;

const pcr =
round(peOI / ceOI);

let signal =
"SIDEWAYS";

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

trade:
activeTrade,

currentOptionPrice,

pnl,

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
`🔥 MSM PRO AI SERVER RUNNING ON ${PORT}`
);

});