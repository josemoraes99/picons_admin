/*jshint esversion: 6 */
"use strict";

// version 0.5

let __authkey__ = false;
let channelList;

//---------------------------------------------------------------------------------------//

const loginButton = document.querySelector('.loginBtn');
loginButton.addEventListener('click', e => {
    const usr = document.getElementById("inputUsername").value.trim();
    const pwd = document.getElementById("inputPassword").value.trim();
    processLogin(usr, pwd);
    document.getElementById("inputUsername").value = '';
    document.getElementById("inputPassword").value = '';
});

const menuPiconShow = document.querySelector('#menuPiconShow');
menuPiconShow.addEventListener('click', e => {
    document.querySelector('.painelLista').style.display = 'none'; // hide
    document.querySelector('.painelNew').style.display = 'block'; // show
});

const menuListaShow = document.querySelector('#menuListaShow');
menuListaShow.addEventListener('click', e => {
    document.querySelector('.painelNew').style.display = 'none'; // hide
    document.querySelector('.painelLista').style.display = 'block'; // show
});

const menuListaRefresh = document.querySelector('#menuListaRefresh');
menuListaRefresh.addEventListener('click', e => {
    refreshChannels();
});

const menuLogout = document.querySelector('#menuLogout');
menuLogout.addEventListener('click', e => {
    const reqData = {
        "method": "logout",
        "token": __authkey__
    };
    getUrlData(reqData);

    __authkey__ = false;

    var dbData = {
        'id': "tk",
        'data': ""
    };
    saveToIndexedDB('objectstoreName', dbData).then(function (response) {
        // console.log('token saved')
    }).catch(function (error) {
        // alert(error.message);
        console.log(error.message)
    });
    showPage();
});

//---------------------------------------------------------------------------------------//

const dynamicSort = property => {
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


const myAlertTop = msg => {
    document.querySelector('#alertMsg').innerHTML = msg;
    document.querySelector('.myAlert-top').style.display = 'block'; // show
    setTimeout(function () {
        document.querySelector('.myAlert-top').style.display = 'none'; // hide
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
    const pLogin = document.querySelector('#painelLogin');
    const pNew = document.querySelector('.painelNew');
    const pPrincipal = document.querySelector('#painelPrincipal');
    const pErrorMsg = document.querySelector('.loginerrormsg');
    console.log(__authkey__);
    if (__authkey__) {
        pLogin.style.display = 'none'; // hide
        pPrincipal.style.display = 'block'; // show
        pNew.style.display = 'block'; // show
        myAlertTop("Carregando Lista");
        await loadChannelsList();
    } else {
        pErrorMsg.style.display = 'none'; // hide
        pPrincipal.style.display = 'none'; // hide
        pLogin.style.display = 'block'; // show
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
    if (data.auth) {
        __authkey__ = data.token;

        saveTokenInLocalDb(__authkey__);

        showPage();
    } else {
        const logErrorMsg = document.querySelector('.loginerrormsg');
        logErrorMsg.style.display = 'block'; // show
        setTimeout(function () {
            logErrorMsg.style.display = 'none'; // hide
        }, 5000);
    }
};


// function saveTokenInLocalDb(token) {
const saveTokenInLocalDb = token => {
    const dbData = {
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


// function processChannelList(chanArr) {
const processChannelList = chanArr => {
    // console.time();
    const categorias = ['variedades', 'interno', 'adultos'];

    let listUndef = chanArr.filter(el => el.stat == "undef");
    let listNotUndef = chanArr.filter(el => el.stat != "undef");
    let listFile = listNotUndef.filter(el => el.stat == "file");

    let divPainelNew = document.querySelector('.painelNew');
    let divPainelLista = document.querySelector('.painelLista');

    divPainelNew.textContent = '';
    divPainelLista.textContent = '';

    listFile.unshift({ // adicionando primeiro item vazio para o select box funcionar
        channell: ""
    });

    const itemsSelectFiles = createElement({
        tagName: "select",
        className: "selectChannelWithFile",
        childs: listFile.map(function (elem) {
            return createElement({
                tagName: "option",
                text: elem.channell
            })
        })
    });

    const itemsSelectCategories = createElement({
        tagName: "select",
        className: "selectCategorie",
        childs: categorias.map(function (elem) {
            return createElement({
                tagName: "option",
                text: elem
            })
        })
    });

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

        divPainelNew.appendChild(curRow);
    });

    listNotUndef.forEach(function (itemChannel, index) {
        let selectItemCat = itemsSelectCategories.cloneNode(true);
        selectItemCat.id = "seleCat." + itemChannel.channell;
        selectItemCat.value = itemChannel.categoria;

        itemChannel.stat != "file" ? selectItemCat.disabled = true : false;

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
                    className: "col-2",
                    text: itemChannel.redir
                }),
                createElement({
                    tagName: "div",
                    className: "col-1",
                    childs: [selectItemCat]
                }),
                createElement({
                    tagName: "div",
                    className: "col-2",
                    childs: [
                        itemChannel.stat != "file" && createElement({
                            tagName: "button",
                            className: "btn btn-sm btn-danger btnRemoveRedir",
                            attributes: {
                                "id": "button." + itemChannel.channell,
                                "type": "button"
                            },
                            text: "Remover redir"
                        })
                    ]
                })
            ]
        });

        divPainelLista.appendChild(curRow);

    });

    // console.timeLog();
    afterDomChange();
    document.querySelector('.myAlert-top').style.display = 'none'; // hide

    // console.timeEnd();
}


const afterDomChange = () => {
    const selectChannelWithFile = document.querySelectorAll('.selectChannelWithFile');
    selectChannelWithFile.forEach(sel => {
        sel.addEventListener('change', e => {
            const id = e.target.id.replace("sele.", "");
            const newval = e.target.value;
            // console.log(id, newval);
            changeChannelStat(id, newval);
        });
    });

    const selectCategorie = document.querySelectorAll('.selectCategorie');
    selectCategorie.forEach(sel => {
        sel.addEventListener('change', e => {
            const id = e.target.id.replace("seleCat.", "");
            const newval = e.target.value;
            // console.log(id, newval);
            changeChannelCategorie(id, newval);
        });
    });

    const btnRemove = document.querySelectorAll('.btnRemove');
    btnRemove.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.id.replace("button.", "");
            // console.log("yo", id);
            removeChannel(id);
        });
    });


    const btnRemoveRedir = document.querySelectorAll('.btnRemoveRedir');
    btnRemoveRedir.forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.id.replace("button.", "");
            // console.log(id);
            changeChannelStat(id, "1");
        });
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
    console.log(__authkey__);
    showPage();
};

//---------------------------------------------------------------------------------------//

main();

//---------------------------------------------------------------------------------------//

function createElement(options) {
    // https://gist.github.com/MoOx/8614711
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
}