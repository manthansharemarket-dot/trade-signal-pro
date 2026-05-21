async function loadMarket(){

const nifty = document.getElementById("nifty");

let value = 23500 + Math.floor(Math.random()*400);

nifty.innerText = value;

}

setInterval(loadMarket,2000);