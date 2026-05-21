const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.static("public"));

const HEADERS = {
    "User-Agent":
    "Mozilla/5.0",
    "Accept-Language":
    "en-US,en;q=0.9"
};

let cookie = "";

async function refreshCookie(){

    try{

        const response =
        await axios.get(
            "https://www.nseindia.com",
            {
                headers:HEADERS
            }
        );

        cookie =
        response.headers["set-cookie"]
        .map(c=>c.split(";")[0])
        .join("; ");

        console.log("Cookie Refreshed");

    }catch(err){

        console.log(err.message);
    }
}

async function getOptionChain(index){

    try{

        if(!cookie){

            await refreshCookie();
        }

        let url =
        "";

        if(index === "BANKNIFTY"){

            url =
            "https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY";
        }

        else{

            url =
            "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";
        }

        const response =
        await axios.get(url,{
            headers:{
                ...HEADERS,
                Cookie:cookie
            }
        });

        return response.data;

    }catch(err){

        console.log(err.message);

        await refreshCookie();

        return null;
    }
}

app.get("/api/option-chain",async(req,res)=>{

    const index =
    req.query.index || "NIFTY";

    const data =
    await getOptionChain(index);

    if(!data){

        return res.json({
            error:"Unable to fetch NSE data"
        });
    }

    const records =
    data.records.data;

    const spot =
    data.records.underlyingValue;

    const step =
    index === "BANKNIFTY"
    ? 100
    : 50;

    const atm =
    Math.round(spot/step)*step;

    let rows = [];

    let totalCE = 0;

    let totalPE = 0;

    records.forEach(item=>{

        if(
            item.strikePrice >= atm-(step*5)
            &&
            item.strikePrice <= atm+(step*5)
        ){

            const ceOI =
            item.CE
            ? item.CE.openInterest
            : 0;

            const peOI =
            item.PE
            ? item.PE.openInterest
            : 0;

            const ceChange =
            item.CE
            ? item.CE.changeinOpenInterest
            : 0;

            const peChange =
            item.PE
            ? item.PE.changeinOpenInterest
            : 0;

            const pcr =
            ceOI > 0
            ? (peOI / ceOI).toFixed(2)
            : 0;

            totalCE += ceOI;

            totalPE += peOI;

            let signal =
            "SIDEWAYS";

            if(
                pcr > 1.15
                &&
                peChange > ceChange
            ){

                signal =
                "BUY";
            }

            else if(
                pcr < 0.85
                &&
                ceChange > peChange
            ){

                signal =
                "SELL";
            }

            rows.push({

                strike:item.strikePrice,

                ceOI,

                peOI,

                ceChange,

                peChange,

                pcr,

                signal
            });
        }
    });

    const finalPCR =
    (totalPE / totalCE)
    .toFixed(2);

    let finalSignal =
    "SIDEWAYS";

    let confidence =
    "55%";

    if(finalPCR > 1.1){

        finalSignal =
        "BUY CALL";

        confidence =
        "82%";
    }

    else if(finalPCR < 0.9){

        finalSignal =
        "BUY PUT";

        confidence =
        "82%";
    }

    const entry =
    index === "BANKNIFTY"
    ? 250
    : 120;

    const sl =
    Math.round(entry*0.75);

    const target1 =
    Math.round(entry*1.30);

    const target2 =
    Math.round(entry*1.60);

    res.json({

        index,

        spot,

        atm,

        finalPCR,

        finalSignal,

        confidence,

        entry,

        sl,

        target1,

        target2,

        rows
    });
});

app.listen(3000,()=>{

    console.log(
        "LIVE SERVER RUNNING ON 3000"
    );
});