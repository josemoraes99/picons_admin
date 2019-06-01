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

    const reqData = {
        "method": "logout",
        "token": __authkey__
    };
    let response = getUrlData(reqData);

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
                __authkey__ = data.token;
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
    console.time();
    console.log("start");
    const categorias = ['variedades', 'interno', 'adultos'];

    let tmpDivPainelNew = document.createDocumentFragment();
    let tmpDivPainelLista = document.createDocumentFragment();

    let listUndef = chanArr.filter(el => el.stat == "undef");
    let listNotUndef = chanArr.filter(el => el.stat != "undef");
    let listFile = listNotUndef.filter(el => el.stat == "file");

    let divPainelNew = document.querySelector('.painelNew');
    let divPainelLista = document.querySelector('.painelLista');

    divPainelNew.textContent = '';
    divPainelLista.textContent = '';

    console.log("p1");
    console.timeLog();


    // let divRow = document.createElement('div');
    // let divCol1 = document.createElement('div');
    // let divCol2 = document.createElement('div');
    // let divCol3 = document.createElement('div');
    // divRow.className = "row justify-content-center align-items-center";
    // divCol1.className = "colNameChannel col-2";
    // divCol2.className = "col-1";
    // divCol3.className = "col-2";
    // divRow.appendChild(divCol1);
    // divRow.appendChild(divCol2);
    // divRow.appendChild(divCol3);

    // const itemsSelectFiles = listFile.map(obj => obj.channell);
    let selectOptions = listFile.map(function (elem) {
        return createElement({
            tagName: "option",
            text: elem.channell
        })
    });

    selectOptions.unshift(createElement({
        tagName: "option",
        text: "",
        attributes: {
            "value": "1",
        }
    }));

    const itemsSelectFiles = createElement({
        tagName: "select",
        className: "selectChannelWithFile",
        childs: selectOptions
    });

    const itemsSelectCategories = createElement({
        tagName: "select",
        className: "selectChannelWithFile",
        childs: []
    });


    console.log("p2");
    console.timeLog();

    listUndef.forEach(function (itemChannel, index) {
        let selectItem = itemsSelectFiles.cloneNode(true);
        selectItem.id = "sele." + itemChannel.channell;

        const curRow = createElement({
            tagName: "div",
            className: "row justify-content-center align-items-center",
            childs: [
                createElement({
                    tagName: "div",
                    className: "col-2",
                    text: itemChannel.channell
                }),
                createElement({
                    tagName: "div",
                    className: "col-1",
                    // childs: []
                    childs: [selectItem]
                }),
                createElement({
                    tagName: "div",
                    className: "col-2",
                    childs: [
                        createElement({
                            tagName: "button",
                            className: "btn btn-sm btn-danger btnRemove",
                            attributes: {
                                "id": "button." + itemChannel.channell,
                                "type": "button"
                            },
                            text: "Remover"
                        })
                    ]
                })
            ]
        });
        //     tagName: "div",
        //     className: "my-class",
        //     text: "Blah blah",
        //     attributes: {
        //         "id": "element id",
        //         "data-truc": "value"
        //     },
        //     childs: [{
        //         /* recursif call **/ }]

        divPainelNew.appendChild(curRow);
        // tmpDivPainelNew.appendChild(curRow);
    });

    console.log("p3");
    console.timeLog();

    listNotUndef.forEach(function (itemChannel, index) {
        let selectItem = itemsSelectCategories.cloneNode(true);
        selectItem.id = "seleCat." + itemChannel.channell;

        const curRow = createElement({
            tagName: "div",
            className: "row justify-content-center align-items-center",
            childs: [
                createElement({
                    tagName: "div",
                    className: "col-2",
                    text: itemChannel.channell
                }),
                createElement({
                    tagName: "div",
                    className: "col-1",
                    childs: [selectItem]
                }),
                createElement({
                    tagName: "div",
                    className: "col-2",
                    childs: [
                        createElement({
                            tagName: "button",
                            className: "btn btn-sm btn-danger btnRemove",
                            attributes: {
                                "id": "button." + itemChannel.channell,
                                "type": "button"
                            },
                            text: "Remover"
                        })
                    ]
                })
            ]
        });

        divPainelLista.appendChild(curRow);
    });

    /*

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
                    // divPainelNew.appendChild(divRow);
                    tmpDivPainelNew.appendChild(divRow);
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
                    // divPainelLista.appendChild(divRow);
                    tmpDivPainelLista.appendChild(divRow);
                }
            });

            divPainelNew.appendChild(tmpDivPainelNew);
            divPainelLista.appendChild(tmpDivPainelLista);

            console.timeLog();
            afterDomChange();
            */
    // divPainelNew.appendChild(tmpDivPainelNew);
    divPainelLista.appendChild(tmpDivPainelLista);
    console.log("end");
    console.timeEnd();
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

function createElement(options) {
    var el, a, i;
    if (!options.tagName) {
        el = document.createDocumentFragment();
    } else {
        el = document.createElement(options.tagName);
        if (options.className) {
            el.className = options.className;
        }
        if (options.attributes) {
            for (a in options.attributes) {
                el.setAttribute(a, options.attributes[a]);
            }
        }
        if (options.html !== undefined) {
            el.innerHTML = options.html;
        }
    }
    if (options.text) {
        el.appendChild(document.createTextNode(options.text));
    }
    // IE 8 doesn"t have HTMLElement
    if (window.HTMLElement === undefined) {
        window.HTMLElement = Element;
    }
    if (options.childs && options.childs.length) {
        for (i = 0; i < options.childs.length; i++) {
            el.appendChild(options.childs[i] instanceof window.HTMLElement ? options.childs[i] : createElement(options.childs[i]));
        }
    }
    return el;
}
// document.body.appendChild(createElement({
//     tagName: "div",
//     className: "my-class",
//     text: "Blah blah",
//     attributes: {
//         "id": "element id",
//         "data-truc": "value"
//     },
//     childs: [{
//         /* recursif call **/ }]
// }))

// if you use without tagName you will get a document fragment