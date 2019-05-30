/*jshint esversion: 6 */
"use strict";

// version 0.5

let __authkey__ = false;
let channelList;

//---------------------------------------------------------------------------------------//

$("#menuPiconShow").click(function () {
    // console.log("painelNew");
    $(".painelPicons").hide();
    $(".painelNew").show();
});

$("#menuListaShow").click(function () {
    // console.log("painelLista");
    $(".painelPicons").hide();
    $(".painelLista").show();
});

$("#menuListaRefresh").click(function () {
    // console.log("refresh");
    refreshChannels();
});

$("#menuLogout").click(function () {
    __authkey__ = false;
    var dbData = {
        'id': "tk",
        'data': ""
    };
    saveToIndexedDB('objectstoreName', dbData).then(function (response) {
        // alert('data saved');
        // console.log('token saved')
    }).catch(function (error) {
        // alert(error.message);
        console.log(error.message)
    });
    showPage();
});

$(".loginBtn").click(function () {
    const usr = document.getElementById("inputUsername").value.trim();
    const pwd = document.getElementById("inputPassword").value.trim();
    processLogin(usr, pwd);
    document.getElementById("inputUsername").value = '';
    document.getElementById("inputPassword").value = '';
});

//---------------------------------------------------------------------------------------//

function dynamicSort(property) {
    let sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}

function myAlertTop(msg) {
    document.getElementById("alertMsg").innerHTML = msg;
    $(".myAlert-top").show();
    setTimeout(function () {
        $(".myAlert-top").hide();
    }, 2000);
}

function saveToIndexedDB(storeName, object) {
    return new Promise(
        function (resolve, reject) {
            if (object.id === undefined) reject(Error('object has no id.'));
            var dbRequest = indexedDB.open(storeName);

            dbRequest.onerror = function (event) {
                reject(Error("IndexedDB database error"));
            };

            dbRequest.onupgradeneeded = function (event) {
                var database = event.target.result;
                var objectStore = database.createObjectStore(storeName, {
                    keyPath: "id"
                });
            };

            dbRequest.onsuccess = function (event) {
                var database = event.target.result;
                var transaction = database.transaction([storeName], 'readwrite');
                var objectStore = transaction.objectStore(storeName);
                var objectRequest = objectStore.put(object); // Overwrite if exists

                objectRequest.onerror = function (event) {
                    reject(Error('Error text'));
                };

                objectRequest.onsuccess = function (event) {
                    resolve('Data saved OK');
                };
            };
        }
    );
}

function loadFromIndexedDB(storeName, id) {
    return new Promise(
        function (resolve, reject) {
            var dbRequest = indexedDB.open(storeName);

            dbRequest.onerror = function (event) {
                reject(Error("Error text"));
            };

            dbRequest.onupgradeneeded = function (event) {
                // Objectstore does not exist. Nothing to load
                event.target.transaction.abort();
                reject(Error('Not found'));
            };

            dbRequest.onsuccess = function (event) {
                var database = event.target.result;
                var transaction = database.transaction([storeName]);
                var objectStore = transaction.objectStore(storeName);
                var objectRequest = objectStore.get(id);

                objectRequest.onerror = function (event) {
                    reject(Error('Error text'));
                };

                objectRequest.onsuccess = function (event) {
                    if (objectRequest.result) resolve(objectRequest.result);
                    else reject(Error('object not found'));
                };
            };
        }
    );
}


//---------------------------------------------------------------------------------------//


const showPage = async () => {
    if (__authkey__) {
        $("#painelLogin").hide();
        $(".painelNew").show();
        $("#painelPrincipal").show();
        await loadChannelsList();
    } else {
        $(".loginerrormsg").hide();
        $("#painelPrincipal").hide();
        $("#painelLogin").show();
    }
};

const processLogin = async (usr, pwd) => {
    const authJson = {
        "username": usr,
        "password": pwd
    }
    const response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/auth', {
        method: 'post',
        body: JSON.stringify(authJson)
    });
    let data = await response.json();
    // console.log(data);
    if (data.auth) {
        __authkey__ = data.token;
        // salvar token!!
        // writeCookie('sessionId', __authkey__, 3); 

        saveTokenInLocalDb(__authkey__);

        showPage();
    } else {
        $(".loginerrormsg").show();
        setTimeout(function () {
            $(".loginerrormsg").hide();
        }, 5000);
    }
};

function saveTokenInLocalDb(token) {
    var dbData = {
        'id': "tk",
        'data': token
    };
    saveToIndexedDB('objectstoreName', dbData).then(function (response) {
        // alert('data saved');
        console.log('token saved')
    }).catch(function (error) {
        // alert(error.message);
        console.log(error.message)
    });

}

const loadChannelsList = async () => {
    channelList = await getListChannels();
    if (channelList) {
        channelList.sort(dynamicSort("channell"));
        processChannelList(channelList);
    }
};

const getUrlData = async (payload) => {
    if (__authkey__) {
        const response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod', {
            method: 'post',
            body: JSON.stringify(payload)
        });
        let data = await response.json();
        // console.log(data);
        if (data.auth) {
            if (__authkey__ != data.token) {
                console.log('token renewed')
                saveTokenInLocalDb(__authkey__);
            }
            return data.data;
        } else {
            __authkey__ = false;
            showPage();
            return false;
        }
    }
}

const getListChannels = async () => {
    console.log("load list");
    const reqData = {
        "method": "list",
        "token": __authkey__
    };
    let response = await getUrlData(reqData);
    if (response) {
        // console.log(response);
        return response;
    } else {
        return false;
    }
};

function processChannelList(chanArr) {
    console.log("start");
    const categorias = ['variedades', 'interno', 'adultos'];
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

    let selCat = document.createElement("select");
    for (let i = 0; i < categorias.length; i++) {
        const element = categorias[i];
        let optCat = document.createElement("option");
        optCat.text = element;
        optCat.value = element;
        selCat.add(optCat, null);
    }

    chanArr.forEach(function (itemChannel, index) {
        if (itemChannel.stat == "file") {
            let opt1 = document.createElement("option");
            opt1.text = itemChannel.channell;
            sel.add(opt1, null);
        }
    });

    chanArr.forEach(function (itemChannel, index) {
        let divRow = document.createElement('div');
        let divCol1 = document.createElement('div');
        let divCol2 = document.createElement('div');
        let divCol3 = document.createElement('div');
        divRow.className = "row justify-content-center align-items-center";
        divCol1.className = "col-2";
        divCol2.className = "col-1";
        divCol3.className = "col-2";
        let label1Txt = document.createTextNode(itemChannel.channell);

        if (itemChannel.stat == "undef") {
            divCol1.appendChild(label1Txt);

            let newSelect = sel.cloneNode(true);
            newSelect.className = "selectChannelWithFile";
            newSelect.id = "sele." + itemChannel.channell;
            divCol2.appendChild(newSelect);

            let removeBtn = document.createElement('button');
            removeBtn.type = "button";
            removeBtn.className = "btn btn-sm btn-danger btnRemove";
            removeBtn.id = "button." + itemChannel.channell;
            removeBtn.innerHTML = "Remover";
            divCol3.appendChild(removeBtn);

            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divRow.appendChild(divCol3);
            divPainelNew.appendChild(divRow);
        } else {

            let newSelectCat = selCat.cloneNode(true);
            newSelectCat.className = "selectCategorie";
            newSelectCat.id = "seleCat." + itemChannel.channell;
            divCol3.appendChild(newSelectCat);
            newSelectCat.value = itemChannel.categoria;

            if (itemChannel.stat != "file") {
                let newSelect = sel.cloneNode(true);
                newSelect.className = "selectChannelWithFile";
                newSelect.id = "sele." + itemChannel.channell;
                divCol2.appendChild(newSelect);
                newSelect.value = itemChannel.redir;

                newSelectCat.disabled = true;
            }
            divCol1.appendChild(label1Txt);

            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divRow.appendChild(divCol3);
            divPainelLista.appendChild(divRow);
        }
    });
    console.log("end");
    afterDomChange();
}

function afterDomChange() {
    $('.selectChannelWithFile').change(function () {
        const id = $(this).attr("id").replace("sele.", "");
        const newval = $(this).val();
        changeChannelStat(id, newval);
    });

    $('.selectCategorie').change(function () {
        const id = $(this).attr("id").replace("seleCat.", "");
        const newval = $(this).val();
        changeChannelCategorie(id, newval);
    });

    $('.btnRemove').click(function () {
        const id = $(this).attr("id").replace("button.", "");
        console.log(id);
        // const newval = $(this).val();
        removeChannel(id);
    });
}

const refreshChannels = async () => {
    console.log("refresh list");
    const reqData = {
        "method": "refresh",
        "token": __authkey__
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertTop("Atualizado!");
        await loadChannelsList();
    }
};

const changeChannelCategorie = async (pic, newCat) => {
    console.log("change channel", pic, newCat);
    const reqData = {
        "method": "changeCategorie",
        "channel": pic,
        "newCategorie": newCat,
        "token": __authkey__
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertTop("Alterado!");
        await loadChannelsList();
    }
};

const changeChannelStat = async (pic, redir) => {
    console.log("change channel", pic, redir);
    const reqData = {
        "method": "changeChannel",
        "channel": pic,
        "redir": redir,
        "token": __authkey__
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertTop("Alterado!");
        channelList.forEach(function (itemChannel, index) {
            if (itemChannel.channell == pic) {
                if (redir != 1) {
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

const removeChannel = async (chn) => {
    console.log("change channel", chn);
    const reqData = {
        "method": "remove",
        "channel": chn,
        "token": __authkey__
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertTop("Removido!");
        for (let i = 0; i < channelList.length; i++) {
            const nome = channelList[i].channell;
            if (nome == chn) {
                channelList.splice(i, 1);
            }
        }
        processChannelList(channelList);
    }
};

//---------------------------------------------------------------------------------------//

const checkJWT = async () => {
    // https://stackoverflow.com/questions/41586400/using-indexeddb-asynchronously
    // Load some data
    const id = "tk";
    try {
        const dbD = await loadFromIndexedDB('objectstoreName', id);
        // console.log('data loaded OK', dbD);
        __authkey__ = dbD.data;
    } catch (error) {
        console.log(error.message);
    }
};

const main = async () => {
    await checkJWT();
    showPage();
};

//---------------------------------------------------------------------------------------//

main();

//---------------------------------------------------------------------------------------//


/*



let channelList;
let __authkey__ = false;

function myAlertTop(msg) {
    document.getElementById("alertMsg").innerHTML = msg;
    $(".myAlert-top").show();
    setTimeout(function () {
        $(".myAlert-top").hide();
    }, 2000);
}

const getListChannels = async () => {
    console.log("load list");
    if (__authkey__) {
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/list/' + __authkey__);
        let resp = await response.json();
        // let data = await response.json();
        // let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        return resp.listChan;
    }
};

$("#menuPiconShow").click(function () {
    // console.log("painelNew");
    $(".painelPicons").hide();
    $(".painelNew").show();
});

$("#menuListaShow").click(function () {
    // console.log("painelLista");
    $(".painelPicons").hide();
    $(".painelLista").show();
});

const refreshChannels = async () => {
    console.log("refresh list");
    if (__authkey__) {
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/refresh/' + __authkey__);
        let resp = await response.json();
        // let data = await response.json();
        // let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        if (resp.refreshed == "true") {
            myAlertTop("Atualizado!");
            await funcGetChannelsList();
        }
    }
};

$("#menuListaRefresh").click(function () {
    // console.log("refresh");
    refreshChannels();
});

$("#menuLogout").click(function () {
    __authkey__ = false;
    writeCookie('sessionId', __authkey__, -1);
    showPage();
});

function dynamicSort(property) {
    let sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}

const changeChannelStat = async (pic, redir) => {
    console.log("change channel", pic, redir);
    if (__authkey__) {
        // alterar api
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/change/' + pic + '/' + redir + '/' + __authkey__);
        let data = await response.json();
        let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        // console.log(resp);
        // console.log(resp.changed);
        if (resp.changed == "true") {
            // console.log("oook");
            myAlertTop("Alterado!");
        }
        // alterar api

        channelList.forEach(function (itemChannel, index) {
            if (itemChannel.channell == pic) {
                if (redir != 1) {
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

const removeChannel = async (chn) => {
    console.log("change channel", chn);

    if (__authkey__) {
        // remover api
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/remove/' + chn + '/' + __authkey__);
        let data = await response.json();
        console.log(data);
        let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        // console.log(resp);
        // console.log(resp.changed);
        if (resp.removed == "true") {
            // console.log("oook");
            myAlertTop("Removido!");
        }
        // remover api

        for (let i = 0; i < channelList.length; i++) {
            const nome = channelList[i].channell;
            if (nome == chn) {
                channelList.splice(i, 1);
            }
        }
        processChannelList(channelList);
    }
};

const changeChannelCategorie = async (pic, newCat) => {
    console.log("change channel", pic, newCat);
    if (__authkey__) {
        // alterar api
        let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/changecategorie/' + pic + '/' + newCat + '/' + __authkey__);
        let data = await response.json();
        let resp = JSON.parse(data);
        checkAuth(resp.authenticated);
        // console.log(resp);
        // console.log(resp.changed);
        if (resp.changed == "true") {
            // console.log("oook");
            myAlertTop("Alterado!");
            await funcGetChannelsList()
        }
        // alterar api

        // channelList.forEach(function (itemChannel, index){
        //     if ( itemChannel.channell == pic ){
        //         if ( redir != 1 ) {
        //             itemChannel.stat = "redir";
        //             itemChannel.redir = redir;
        //         } else {
        //             itemChannel.stat = "undef";
        //             itemChannel.redir = false;
        //         }
        //     }
        // });
        // processChannelList(channelList);
    }
};

function writeCookie(name, value, days) {
    let date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    let i, c, ca, nameEQ = name + "=";
    ca = document.cookie.split(';');
    for (i = 0; i < ca.length; i++) {
        c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return '';
}

function afterDomChange() {
    $('.selectChannelWithFile').change(function () {
        const id = $(this).attr("id").replace("sele.", "");
        const newval = $(this).val();
        changeChannelStat(id, newval);
    });

    $('.selectCategorie').change(function () {
        const id = $(this).attr("id").replace("seleCat.", "");
        const newval = $(this).val();
        changeChannelCategorie(id, newval);
    });

    $('.btnRemove').click(function () {
        const id = $(this).attr("id").replace("button.", "");
        console.log(id);
        // const newval = $(this).val();
        removeChannel(id);
    });
}

function processChannelList(chanArr) {
    const categorias = ['variedades', 'interno', 'adultos'];
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

    let selCat = document.createElement("select");
    for (let i = 0; i < categorias.length; i++) {
        const element = categorias[i];
        let optCat = document.createElement("option");
        optCat.text = element;
        optCat.value = element;
        selCat.add(optCat, null);
    }

    chanArr.forEach(function (itemChannel, index) {
        if (itemChannel.stat == "file") {
            let opt1 = document.createElement("option");
            opt1.text = itemChannel.channell;
            sel.add(opt1, null);
        }
    });

    chanArr.forEach(function (itemChannel, index) {
        let divRow = document.createElement('div');
        let divCol1 = document.createElement('div');
        let divCol2 = document.createElement('div');
        let divCol3 = document.createElement('div');
        divRow.className = "row justify-content-center align-items-center";
        divCol1.className = "col-2";
        divCol2.className = "col-1";
        divCol3.className = "col-2";
        let label1Txt = document.createTextNode(itemChannel.channell);

        if (itemChannel.stat == "undef") {
            divCol1.appendChild(label1Txt);

            let newSelect = sel.cloneNode(true);
            newSelect.className = "selectChannelWithFile";
            newSelect.id = "sele." + itemChannel.channell;
            divCol2.appendChild(newSelect);

            let removeBtn = document.createElement('button');
            removeBtn.type = "button";
            removeBtn.className = "btn btn-sm btn-danger btnRemove";
            removeBtn.id = "button." + itemChannel.channell;
            removeBtn.innerHTML = "Remover";
            divCol3.appendChild(removeBtn);

            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divRow.appendChild(divCol3);
            divPainelNew.appendChild(divRow);
        } else {

            let newSelectCat = selCat.cloneNode(true);
            newSelectCat.className = "selectCategorie";
            newSelectCat.id = "seleCat." + itemChannel.channell;
            divCol3.appendChild(newSelectCat);
            newSelectCat.value = itemChannel.categoria;

            if (itemChannel.stat != "file") {
                let newSelect = sel.cloneNode(true);
                newSelect.className = "selectChannelWithFile";
                newSelect.id = "sele." + itemChannel.channell;
                divCol2.appendChild(newSelect);
                newSelect.value = itemChannel.redir;

                newSelectCat.disabled = true;
            }
            divCol1.appendChild(label1Txt);

            divRow.appendChild(divCol1);
            divRow.appendChild(divCol2);
            divRow.appendChild(divCol3);
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

function checkAuth(au) {
    if (au === false) {
        __authkey__ = false;
        showPage();
    } else {
        writeCookie('sessionId', __authkey__, 3);
    }
}

$(".loginBtn").click(function () {
    const usr = document.getElementById("inputUsername").value.trim();
    const pwd = document.getElementById("inputPassword").value.trim();
    processLogin(usr, pwd);
    document.getElementById("inputUsername").value = '';
    document.getElementById("inputPassword").value = '';
});

const processLogin = async (usr, pwd) => {
    console.log("login", usr, pwd);
    let response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod/login/' + usr + "/" + pwd);
    let data = await response.json();
    let resp = JSON.parse(data);
    if (resp.authenticated) {
        // console.log("ok");
        __authkey__ = resp.authcode;
        writeCookie('sessionId', __authkey__, 3);
        showPage();
    } else {
        $(".loginerrormsg").show();
        setTimeout(function () {
            $(".loginerrormsg").hide();
        }, 5000);
    }
    // console.log(resp);
};

const showPage = async () => {
    if (__authkey__) {
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
if (id_cookie != "") {
    __authkey__ = id_cookie;
}

main();

*/