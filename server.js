const express = require("express");

const cors = require("cors");

const axios = require("axios");

const app = express();

app.use(cors());

app.use(express.static("public"));



/* =========================================
AXIOS INSTANCE
========================================= */

const axiosInstance = axios.create({

headers: {

"user-agent":
"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

"accept-language":
"en-US,en;q=0.9",

"accept":
"*/*"

}

});



/* =========================================
GET NSE COOKIE
========================================= */

async function getCookies(){

await axiosInstance.get(
"https://www.nseindia.com"
);

}



/* =========================================
OPTION CHAIN API
========================================= */

app.get("/api/option-chain", async(req,res)=>{

try{

await getCookies();

const index =
req.query.index || "NIFTY";

const url =
`https://www.nseindia.com/api/option-chain-indices?symbol=${index}`;

const response =
await axiosInstance.get(url);

const raw =
response.data;



/* SAFETY CHECK */

if(
!raw ||
!raw.records ||
!raw.records.data
){

return res.json({

error:"No data from NSE"

});

}

const records =
raw.records.data;

let totalCE = 0;
let totalPE = 0;

let chain = [];

records.forEach((item)=>{

if(item.CE && item.PE){

const ceOI =
item.CE.openInterest || 0;

const peOI =
item.PE.openInterest || 0;

const pcr =
(peOI / ceOI).toFixed(2);

let signal = "SIDEWAYS";

if(pcr > 1.1){

signal = "BUY";

}

else if(pcr < 0.9){

signal = "SELL";

}

totalCE += ceOI;
totalPE += peOI;

chain.push({

strike:item.strikePrice,

ceOI,

peOI,

pcr,

signal

});

}

});

const finalPCR =
(totalPE / totalCE).toFixed(2);

let finalSignal = "SIDEWAYS";

if(finalPCR > 1.1){

finalSignal = "BUY CALL";

}

else if(finalPCR < 0.9){

finalSignal = "BUY PUT";

}

res.json({

spot:
raw.records.underlyingValue,

finalPCR,

finalSignal,

confidence:"82%",

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
TEST API
========================================= */

app.get("/api/test",(req,res)=>{

res.json({

status:"SERVER WORKING"

});

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