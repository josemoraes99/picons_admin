/*jshint esversion: 6 */
"use strict";

// version 0.2

let channelList;
let __authkey__ = false;

function myAlertTop(msg){
    document.getElementById("alertMsg").innerHTML = msg;
    $(".myAlert-top").show();
    setTimeout(function(){
        $(".myAlert-top").hide(); 
    }, 2000);
}

const getListChannels = async () => {
    console.log("load list");
    if ( __authkey__ ){
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/list/' + __authkey__);
        let data = await response.json();
        let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        return resp.listChan;
    }
};

$("#menuPiconShow").click(function(){
    // console.log("painelNew");
    $(".painelPicons").hide();
    $(".painelNew").show();
});

$("#menuListaShow").click(function(){
    // console.log("painelLista");
    $(".painelPicons").hide();
    $(".painelLista").show();
});

const refreshChannels = async () => {
    console.log("refresh list");
    if ( __authkey__ ){
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/refresh/' + __authkey__);
        let data = await response.json();
        let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        if ( resp.refreshed == "true" ){
            myAlertTop("Atualizado!");
            await funcGetChannelsList();
        }
    }
};

$("#menuListaRefresh").click(function(){
    // console.log("refresh");
    refreshChannels();
});

function dynamicSort(property) {
    let sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}

const changeChannelStat = async (pic, redir) => {
    console.log("change channel", pic, redir);
    if ( __authkey__ ){
        // alterar api
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/change/' + pic + '/' + redir + '/' + __authkey__);
        let data = await response.json();
        let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        // console.log(resp);
        // console.log(resp.changed);
        if ( resp.changed == "true" ){
            // console.log("oook");
            myAlertTop("Alterado!");
        }
        // alterar api

        channelList.forEach(function (itemChannel, index){
            if ( itemChannel.channell == pic ){
                if ( redir != 1 ) {
                    itemChannel.stat = "redir";
                    itemChannel.redir = redir;
                } else {
                    itemChannel.stat = "undef";
                    itemChannel.redir = false;
                }
            }
        });
        processChannelList(channelList);
    }
};

function writeCookie(name,value,days) {
    let date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

// function writeCookie(name,value,days) {  
//     var now = new Date();  
//     now.setMonth( now.getMonth() + 1 );  
//     // cookievalue = escape(document.myform.customer.value) + ";"  
//     document.cookie = name + " = " + value;  
//     document.cookie = "expires = " + now.toUTCString() + ";"  
//     console.log("set cookie");
//     // document.write ("Setting Cookies : " + "name = " + cookievalue );  
// } 

function readCookie(name) {
    let i, c, ca, nameEQ = name + "=";
    ca = document.cookie.split(';');
    for(i=0;i < ca.length;i++) {
        c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length,c.length);
        }
    }
    return '';
}

function afterDomChange(){
    $('.selectChannelWithFile').change(function() {
        const id  = $(this).attr("id").replace("sele.", "");
        const newval = $(this).val();
        changeChannelStat(id, newval);
    });
}

function processChannelList(chanArr){
    let divPainelNew = document.getElementsByClassName('painelNew')[0];
    let divPainelLista = document.getElementsByClassName('painelLista')[0];
    while (divPainelNew.firstChild) {
        divPainelNew.removeChild(divPainelNew.firstChild);
    }
    while (divPainelLista.firstChild) {
        divPainelLista.removeChild(divPainelLista.firstChild);
    }

    let sel = document.createElement("select");
    let opt1 = document.createElement("option");
    opt1.value = "1";
    opt1.text = "";
    sel.add(opt1, null);

    chanArr.forEach(function (itemChannel, index) {
        if ( itemChannel.stat == "file" ){
            let opt1 = document.createElement("option");
            opt1.text = itemChannel.channell;
            sel.add(opt1, null);
        }
    });

    chanArr.forEach(function (itemChannel, index) {
        let divRow = document.createElement('div');
        let divCol1 = document.createElement('div');
        let divCol2 = document.createElement('div');
        divRow.className = "row justify-content-center align-items-center";
        divCol1.className = "col-1";
        divCol2.className = "col-1";
        let label1Txt = document.createTextNode(itemChannel.channell);
        
        if ( itemChannel.stat == "undef" ){
            divCol1.appendChild(label1Txt);

            var newSelect = sel.cloneNode(true);
            newSelect.className = "selectChannelWithFile";
            newSelect.id = "sele." + itemChannel.channell;
            divCol2.appendChild(newSelect);

            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divPainelNew.appendChild(divRow);
        } else {
            if ( itemChannel.stat != "file" ){
                var newSelect = sel.cloneNode(true);
                newSelect.className = "selectChannelWithFile";
                newSelect.id = "sele." + itemChannel.channell;
                divCol2.appendChild(newSelect);
                newSelect.value = itemChannel.redir;
            }
            divCol1.appendChild(label1Txt);


            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divPainelLista.appendChild(divRow);
        }
    });
    afterDomChange();
}

const funcGetChannelsList = async () => {
    channelList = await getListChannels();
    channelList.sort(dynamicSort("channell"));
    processChannelList(channelList);
};

function checkAuth(au){
    if ( au === false ){
        __authkey__ = false;
        showPage();
    }
}

$(".loginBtn").click(function(){
    const usr = document.getElementById("inputUsername").value.trim();
    const pwd = document.getElementById("inputPassword").value.trim();
    processLogin(usr, pwd);
    document.getElementById("inputUsername").value ='';
    document.getElementById("inputPassword").value ='';
});

const processLogin = async (usr, pwd) => {
    console.log("login", usr, pwd);
    let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/login/' + usr + "/" +pwd);
    let data = await response.json();
    let resp = JSON.parse(data);
    if ( resp.authenticated ){
        // console.log("ok");
        __authkey__ = resp.authcode;
        writeCookie('sessionId', __authkey__, 3);
        showPage();
    } else {
        $(".loginerrormsg").show();
         setTimeout(function(){
            $(".loginerrormsg").hide(); 
        }, 5000);
    }
    // console.log(resp);
};

const showPage = async () => {
    if ( __authkey__ ){
        $("#painelLogin").hide();
        $(".painelNew").show();
        $("#painelPrincipal").show();
        await funcGetChannelsList();
    } else {
        $(".loginerrormsg").hide();
        $("#painelPrincipal").hide();
        $("#painelLogin").show();
    }
};

const main = async () => {
    console.log("start");
    // $(".painelNew").show();
    showPage();
    console.log("ok");
};


let id_cookie = readCookie('sessionId');
console.log("cookie",id_cookie);

main();

// https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/login/adminp/261246

/*
$('.slOperadora').change(function() {
    let id  = $(this).attr("id").replace("slO", "");
    let oper = $(this).val()
    let slChanl = document.getElementById("slChannl" + id);
    //console.log(id + oper)
    while (slChanl.firstChild) {
        slChanl.removeChild(slChanl.firstChild);
    }

    let createOpt = document.createElement('option');
    let optTxt = document.createTextNode( "" );
    createOpt.appendChild(optTxt);
    slChanl.appendChild(createOpt);

    for (let j in epgList) {
        //console.log(i)
        //console.log(epgList[i])
        if ( j == oper ){
            epgList[j].sort();
            for (let k in epgList[j]){
                let createOpt = document.createElement('option');
                let optTxt = document.createTextNode( epgList[j][k] );
                createOpt.appendChild(optTxt);
                slChanl.appendChild(createOpt);
            }
        }
    }
    if ( oper === ""){
        //console.log("vazio")
        alterarEpg(id,false,false)
    }
});

$('.slChannel').change(function() {
    let id  = $(this).attr("id").replace("slChannl", "");
    let oper = $("#slO" + id).val()
    let chan = $(this).val()
    alterarEpg(id,oper,chan)
});
*/







/*    chanArr.forEach(function (itemChannel, index) {
        if ( itemChannel.stat == "undef" ){
            let divRow = document.createElement('div');
            let divCol1 = document.createElement('div');
            let divCol2 = document.createElement('div');
            let label1Txt = document.createTextNode(itemChannel.channell);
            divCol1.appendChild(label1Txt);

            let sel = document.createElement("select");
            // let opt1 = document.createElement("option");
            // opt1.value = "1";
            // opt1.text = "";
            // sel.add(opt1, null);
            sel.className = "selectChannelWithFile";
            sel.id = "sele." + itemChannel.channell;
            divCol2.appendChild(sel);

            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divRow.className = "row justify-content-center align-items-center";
            divCol1.className = "col-1";
            divCol2.className = "col-1";
            divPainelNew.appendChild(divRow);
        } else {

            let divCol2 = document.createElement('div');

            if ( itemChannel.stat == "file" ){
                //listChannelsWithFile.push(itemChannel.channell);
            } else {
                let sel = document.createElement("select");
                let opt1 = document.createElement("option");
                opt1.value = itemChannel.redir;
                opt1.text = itemChannel.redir;
                sel.add(opt1, null);
                sel.className = "selectChannelWithFile";
                sel.id = "sele." + itemChannel.channell;
                divCol2.appendChild(sel);
            }

            let divRow = document.createElement('div');
            let divCol1 = document.createElement('div');
            let label1Txt = document.createTextNode(itemChannel.channell);
            divCol1.appendChild(label1Txt);


            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divRow.className = "row justify-content-center align-items-center";
            divCol1.className = "col-1";
            divCol2.className = "col-1";
            divPainelLista.appendChild(divRow);

        }
    });
    console.log("pre");
    let selecDivs = document.getElementsByClassName('selectChannelWithFile');
    for ( let i = 0; i < selecDivs.length; i++ ) {
        // console.log( selecDivs[i].value );
        const originalValue = selecDivs[i].value;
        if ( originalValue != 1 ){
            while (selecDivs[i].firstChild) {
                selecDivs[i].removeChild(selecDivs[i].firstChild);
            }
        }
        for ( let j = 0; j < listChannelsWithFile.length; j++ ) {
            if ( j == 0 ){
                let opt1 = document.createElement("option");
                opt1.value = "1";
                opt1.text = "";
                selecDivs[i].add(opt1, null);
            }
            let opt1 = document.createElement("option");
            // opt1.value = listChannelsWithFile[j];
            opt1.text = listChannelsWithFile[j];
            selecDivs[i].add(opt1, null);
        }
        selecDivs[i].value = originalValue;
    }
    console.log("after1");
    afterDomChange();
    console.log("after2");*/
