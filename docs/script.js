/*jshint esversion: 6 */
"use strict";

let cnt1=[];
let optSelec='';
//$('.slcI').append(optSelec);
let menuC = 'menuCshow';
function myAlertTop(){
    $(".myAlert-top").show();
    setTimeout(function(){
        $(".myAlert-top").hide(); 
    }, 2000);
}

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

console.log("ok");

$(".painelNew").show();
