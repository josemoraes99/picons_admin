/*jshint esversion: 6 */
"use strict";

let cnt1=[];
let optSelec='';
let channelList;
//$('.slcI').append(optSelec);
let menuC = 'menuCshow';
function myAlertTop(){
    $(".myAlert-top").show();
    setTimeout(function(){
        $(".myAlert-top").hide(); 
    }, 2000);
}

const getListChannels = async ()=> {
    let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/list/aaa');
    let data = await response.json();
};


$("#menuPiconShow").click(function(){
    console.log("painelNew");
    $(".painelPicons").hide();
    $(".painelNew").show();
});

$("#menuListaShow").click(function(){
    console.log("painelLista");
    $(".painelPicons").hide();
    $(".painelLista").show();
});


const main = async ()=> {
    console.log("ok");

    $(".painelNew").show();

    channelList = await getListChannels();
    console.log(channelList);
};

main();
