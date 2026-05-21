function generateSignal(rsi,macd,volume){

if(rsi < 30 && macd == "BUY" && volume == "HIGH"){

return "STRONG BUY";

}

if(rsi > 70 && macd == "SELL"){

return "STRONG SELL";

}

return "WAIT";

}