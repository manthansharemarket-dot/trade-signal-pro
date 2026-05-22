const express = require("express");

const cors = require("cors");

const axios = require("axios");

const app = express();

app.use(cors());

app.use(express.static("public"));



/* =========================================
HOME TEST
========================================= */

app.get("/",(req,res)=>{

res.send("MSM PRO SERVER RUNNING 🚀");

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
LIVE OPTION CHAIN API
========================================= */

app.get("/api/option-chain", async(req,res)=>{

try{

/* =====================================
LIVE NIFTY DATA
===================================== */

const niftyRes = await axios.get(

"https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI"

);

const niftyMeta =

niftyRes.data.chart.result[0].meta;



const spot =
niftyMeta.regularMarketPrice;

const previousClose =
niftyMeta.previousClose;

const change =
(spot - previousClose).toFixed(2);



/* =====================================
AI SIGNAL LOGIC
===================================== */

let finalSignal = "SIDEWAYS";

let finalPCR = 1.00;

if(change > 100){

finalSignal = "BUY CALL";

finalPCR = 1.18;

}

else if(change < -100){

finalSignal = "BUY PUT";

finalPCR = 0.82;

}



/* =====================================
OPTION CHAIN DEMO DATA
===================================== */

let chain = [];

const atm =
Math.round(spot / 50) * 50;

for(let i=-5;i<=5;i++){

const strike =
atm + (i * 50);

const ceOI =
Math.floor(Math.random()*500000)+100000;

const peOI =
Math.floor(Math.random()*500000)+100000;

const pcr =
(peOI / ceOI).toFixed(2);

let signal = "SIDEWAYS";

if(pcr > 1.1){

signal = "BUY";

}

else if(pcr < 0.9){

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

finalPCR,

finalSignal,

confidence:"82%",

entry:220,

sl:180,

target1:320,

target2:420,

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

`LIVE SERVER RUNNING ON ${PORT}`

);

});