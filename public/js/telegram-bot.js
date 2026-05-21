async function sendTelegramSignal(message){

const botToken = "YOUR_BOT_TOKEN";

const chatId = "YOUR_CHAT_ID";

const url =
`https://api.telegram.org/bot${botToken}/sendMessage`;

await fetch(url,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

chat_id:chatId,

text:message

})

});

}