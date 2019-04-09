/*jshint esversion: 6 */
"use strict";

// version 0.1

let channelList;
let authkey = false;

function myAlertTop(){
    $(".myAlert-top").show();
    setTimeout(function(){
        $(".myAlert-top").hide(); 
    }, 2000);
}

const getListChannels = async () => {
    console.log("load list");
    let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/list/' + authkey);
    let data = await response.json();
    console.log("load list finished");
    return data;
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
    let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/refresh/' + authkey);
    let data = await response.json();
    let resp = JSON.parse(data);
    if ( resp.refreshed == "true" ){
        myAlertTop();
        await funcGetChannelsList();
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
    // alterar api
    let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/change/' + pic + '/' + redir + '/' + authkey);
    let data = await response.json();
    let resp = JSON.parse(data);
    // console.log(resp);
    // console.log(resp.changed);
    if ( resp.changed == "true" ){
        // console.log("oook");
        myAlertTop();
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
};


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

const main = async ()=> {
    console.log("start");
    $(".painelNew").show();

    await funcGetChannelsList();
    console.log("ok");
};

authkey = "hhjhhjs";

main();



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
