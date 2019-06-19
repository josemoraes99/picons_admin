/*jshint esversion: 6 */
"use strict";

// version 0.5

let channelList;
let filterList;

//---------------------------------------------------------------------------------------//

const formLoginButton = document.querySelector('.form-signin');
formLoginButton.addEventListener('submit', e => {
    e.preventDefault();
    const usr = document.getElementById("inputUsername").value.trim();
    const pwd = document.getElementById("inputPassword").value.trim();
    processLogin(usr, pwd);
    formLoginButton.reset();
    document.getElementById("inputUsername").focus();
});

const menuNewPiconShow = document.querySelector('.newPiconsMenu');
menuNewPiconShow.addEventListener('click', e => {
    document.querySelectorAll('.nav-item').forEach(menu => {
        menu.classList.remove('active');
    });
    const painelTabs = document.querySelectorAll('.tabsPanel');
    painelTabs.forEach(painel => {
        painel.classList.add('d-none'); // hide
    })
    document.querySelector('.newPiconsMenu').parentElement.classList.add('active'); // show
    document.querySelector('.painelNewPicons').classList.remove('d-none'); // show
});

const menuListaCompleta = document.querySelector('.listaCompletaMenu');
menuListaCompleta.addEventListener('click', e => {
    document.querySelectorAll('.nav-item').forEach(menu => {
        menu.classList.remove('active');
    });
    const painelTabs = document.querySelectorAll('.tabsPanel');
    painelTabs.forEach(painel => {
        painel.classList.add('d-none'); // hide
    })
    document.querySelector('.listaCompletaMenu').parentElement.classList.add('active'); // show
    document.querySelector('.painelListaCompleta').classList.remove('d-none'); // show
});

const menuUtil = document.querySelector('.utilMenu');
menuUtil.addEventListener('click', e => {
    document.querySelectorAll('.nav-item').forEach(menu => {
        menu.classList.remove('active');
    });
    const painelTabs = document.querySelectorAll('.tabsPanel');
    painelTabs.forEach(painel => {
        painel.classList.add('d-none'); // hide
    })
    document.querySelector('.utilMenu').parentElement.classList.add('active'); // show
    document.querySelector('.util').classList.remove('d-none'); // show
});

const menuListaRefresh = document.querySelector('.refreshMenu');
menuListaRefresh.addEventListener('click', e => {
    refreshChannels();
});

const addCanalRequerido = document.querySelector('.addCanalRequerido');
addCanalRequerido.addEventListener('submit', e => {
    e.preventDefault();
    const canal = addCanalRequerido.add.value.trim();
    addCanalRequerido.reset();
    renderAddCanalRequerido(canal);
    enviarCanalRequerido(canal);
});


const addCanalIptv = document.querySelector('.addCanalIptv');
addCanalIptv.addEventListener('submit', e => {
    e.preventDefault();
    const canal = addCanalIptv.add.value.trim();
    addCanalIptv.reset();
    renderAddCanalIPTV(canal);
    enviarCanalIptv(canal);
});


document.querySelector('.listCanaisRequeridos').addEventListener('click', e => {
    if (e.target.classList.contains('delete')) {
        e.target.parentElement.remove();
        removerCanalRequerido(e.target.parentElement.querySelector('span').innerText);
    }
});


document.querySelector('.listCanaisIPTV').addEventListener('click', e => {
    if (e.target.classList.contains('delete')) {
        e.target.parentElement.remove();
        removerCanalIptv(e.target.parentElement.querySelector('span').innerText);
    }
});


document.querySelector('.btnRemoveAll').addEventListener('click', e => {
    removeAllUndef();
});


const menuLogout = document.querySelector('.menuLogout');
menuLogout.addEventListener('click', e => {
    const reqData = {
        "method": "logout",
        "token": key_mgmt.getKey()
    };
    getUrlData(reqData);

    key_mgmt.setKey(false);

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


const myAlertBar = (msg, loading = false) => {
    const spanAlert = document.querySelector('.alertRefresh'); // exibir atualizando
    const spinner = document.querySelector('.refreshSpinner');

    loading === true ? spinner.classList.remove('d-none') : spinner.classList.add('d-none');

    document.querySelector('.alertRefreshMsg').innerHTML = msg;
    spanAlert.classList.toggle('d-none');
    setTimeout(function () {
        spanAlert.classList.toggle('d-none');
    }, 2000);
};

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
    // document.querySelector('.painelBloco').classList.add('exibirPainelBloco');

    // const pLogin = document.querySelector('#painelLogin');
    // const pNew = document.querySelector('.painelNew');
    // const pPrincipal = document.querySelector('#painelPrincipal');
    // const pErrorMsg = document.querySelector('.loginerrormsg');
    if (key_mgmt.getKey()) {
        //     pLogin.style.display = 'none'; // hide
        //     pPrincipal.style.display = 'block'; // show
        //     pNew.style.display = 'block'; // show
        //     myAlertTop("Carregando Lista");
        // await loadChannelsList();
        myAlertBar('Atualizando', true);
        loadChannelsList();
        document.querySelector('.painelLogin').classList.add('d-none');
        document.querySelector('.painelPrincipal').classList.remove('d-none');
    } else {
        //     pErrorMsg.style.display = 'none'; // hide
        //     pPrincipal.style.display = 'none'; // hide
        //     pLogin.style.display = 'block'; // show
        document.querySelector('.painelPrincipal').classList.add('d-none');
        document.querySelector('.painelLogin').classList.remove('d-none');
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
        key_mgmt.setKey(data.token);

        saveTokenInLocalDb(data.token);

        showPage();
    } else {
        document.querySelector('.loginerrormsg').classList.remove('d-none');
        // const logErrorMsg = document.querySelector('.loginerrormsg');
        // logErrorMsg.style.display = 'block'; // show
        setTimeout(function () {
            document.querySelector('.loginerrormsg').classList.add('d-none');
            // logErrorMsg.style.display = 'none'; // hide
        }, 5000);
    }
};


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

    const channelTmp = await getListChannels();
    channelList = channelTmp.list;
    filterList = channelTmp.filtroCanais;

    if (channelList) {
        channelList.sort(dynamicSort("channell"));
        processChannelList(channelList, filterList);
    }
};


const getUrlData = async (payload) => {
    let authKey = key_mgmt.getKey();
    if (authKey) {
        try {
            const response = await fetch('https://1wdtecach7.execute-api.sa-east-1.amazonaws.com/prod', {
                method: 'post',
                body: JSON.stringify(payload)
            });
            let data = await response.json();
            // console.log(data);
            if (data.auth) {
                if (authKey != data.token) {
                    key_mgmt.setKey(data.token);
                    saveTokenInLocalDb(data.token);
                }
                return data.data;
            } else {
                key_mgmt.setKey(false);
                showPage();
                return false;
            }
        } catch (error) {
            console.log(error);
        }
    }
}


const getListChannels = async () => {
    console.log("load list");
    const reqData = {
        "method": "list",
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    if (response) {
        // console.log(response);
        return response;
    } else {
        return false;
    }
};


const processChannelList = (chanArr, filterList) => {
    // console.time();
    const categorias = ['variedades', 'interno', 'adultos'];

    let listUndef = chanArr.filter(el => el.stat == "undef");
    let listNotUndef = chanArr.filter(el => el.stat != "undef");
    let listFile = listNotUndef.filter(el => el.stat == "file");

    let ulPainelNewPicons = document.querySelector('.ulPainelNewPicons');
    let ulpainelListaCompleta = document.querySelector('.ulpainelListaCompleta');

    ulPainelNewPicons.textContent = '';
    ulpainelListaCompleta.textContent = '';

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
        const curLi = createElement({
            tagName: "li",
            className: "list-group-item d-flex justify-content-between align-items-center",
            childs: [
                createElement({
                    tagName: "span",
                    className: "col-sm-3",
                    text: itemChannel.channell
                }),
                createElement({
                    tagName: "span",
                    className: "col-sm-3",
                    childs: [selectItem]
                }),
                createElement({
                    tagName: "span",
                    className: "col-sm-1",
                    html: '<i class="far fa-trash-alt delete btnRemove" id="button.' + itemChannel.channell + '"></i>'
                })
            ]
        });
        ulPainelNewPicons.appendChild(curLi);
    });

    listNotUndef.forEach(function (itemChannel, index) {
        let selectItemCat = itemsSelectCategories.cloneNode(true);
        selectItemCat.id = "seleCat." + itemChannel.channell;
        selectItemCat.value = itemChannel.categoria;

        itemChannel.stat != "file" ? selectItemCat.disabled = true : false;
        const curLi = createElement({
            tagName: "li",
            className: "list-group-item d-flex justify-content-between align-items-center",
            childs: [
                createElement({
                    tagName: "span",
                    className: "col-sm-3",
                    text: itemChannel.channell
                }),
                createElement({
                    tagName: "span",
                    className: "col-sm-3",
                    text: itemChannel.redir
                }),
                createElement({
                    tagName: "span",
                    className: "col-sm-3",
                    childs: [selectItemCat]
                }),
                createElement({
                    tagName: "span",
                    className: "col-sm-1",
                    html: itemChannel.stat != "file" ? '<i class="fas fa-trash-restore delete btnRemoveRedir" id="button.' + itemChannel.channell + '"></i>' : ""
                })
            ]
        });
        ulpainelListaCompleta.appendChild(curLi);
    });

    afterDomChange();

    document.querySelector('.listCanaisRequeridos').textContent = '';
    document.querySelector('.listCanaisIPTV').textContent = '';
    filterList.canais_requeridos.map(canal => renderAddCanalRequerido(canal));
    filterList.canais_iptv.map(canal => renderAddCanalIPTV(canal));

}


const renderAddCanalRequerido = chn => {
    const listCanaisRequeridos = document.querySelector('.listCanaisRequeridos');
    const html = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>${chn}</span>
            <i class="far fa-trash-alt delete"></i>
        </li>
    `;
    listCanaisRequeridos.innerHTML += html;
};


const renderAddCanalIPTV = chn => {
    const listCanaisIPTV = document.querySelector('.listCanaisIPTV');
    const html = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>${chn}</span>
            <i class="far fa-trash-alt delete"></i>
        </li>
    `;
    listCanaisIPTV.innerHTML += html;
};


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

    // nodelist to array
    const selectCategorie = Array.from(document.querySelectorAll('.selectCategorie'));
    selectCategorie.map(sel => {
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
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertBar('Atualizando', true);
        await loadChannelsList();
    }
};


const changeChannelCategorie = async (pic, newCat) => {
    console.log("change channel", pic, newCat);
    const reqData = {
        "method": "changeCategorie",
        "channel": pic,
        "newCategorie": newCat,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertBar('Alterado');
        await loadChannelsList();
    }
};


const changeChannelStat = async (pic, redir) => {
    console.log("change channel", pic, redir);
    const reqData = {
        "method": "changeChannel",
        "channel": pic,
        "redir": redir,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertBar("Alterado!");
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
        processChannelList(channelList, filterList);
    }
};


const removeChannel = async (chn) => {
    console.log("change channel", chn);
    const reqData = {
        "method": "remove",
        "channel": chn,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    if (response) {
        myAlertBar("Removido!");
        for (let i = 0; i < channelList.length; i++) {
            const nome = channelList[i].channell;
            if (nome == chn) {
                channelList.splice(i, 1);
            }
        }
        processChannelList(channelList, filterList);
    }
};

const enviarCanalRequerido = async (chn) => {
    const reqData = {
        "method": "add_canal_requerido",
        "channel": chn,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    // console.log("requerido", chn, response);
    if (response) {
        myAlertBar("adicionado!");
    }
};


const enviarCanalIptv = async (chn) => {
    const reqData = {
        "method": "add_canal_iptv",
        "channel": chn,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    // console.log("iptv", chn, response);
    if (response) {
        myAlertBar("adicionado!");
    }
};


const removerCanalRequerido = async (chn) => {
    const reqData = {
        "method": "remove_canal_requerido",
        "channel": chn,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    // console.log("requerido", chn, response);
    if (response) {
        myAlertBar("removido!");
    }
};


const removerCanalIptv = async (chn) => {
    const reqData = {
        "method": "remove_canal_iptv",
        "channel": chn,
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    // console.log("iptv", chn, reqData);
    if (response) {
        myAlertBar("removido!");
    }
};


const removeAllUndef = async () => {
    const reqData = {
        "method": "remove_all_undef",
        "token": key_mgmt.getKey()
    };
    let response = await getUrlData(reqData);
    console.log("remove all", response);
    if (response) {
        await loadChannelsList();
    }
};

//---------------------------------------------------------------------------------------//

const checkJWT = async (cb) => {
    // https://stackoverflow.com/questions/41586400/using-indexeddb-asynchronously
    // Load some data
    const id = "tk";
    try {
        const dbD = await loadFromIndexedDB('objectstoreName', id);
        // console.log('data loaded OK', dbD);
        cb(dbD.data);
    } catch (error) {
        console.log(error.message);
    }
};


const key_mgmt = (() => {
    let keyAuth = false;
    return {
        getKey: () => {
            // console.log(keyAuth);
            return keyAuth;
        },
        setKey: (key) => {
            keyAuth = key;
        }
    }
})();


const main = async () => {
    await checkJWT(key_mgmt.setKey);

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