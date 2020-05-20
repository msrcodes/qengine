'use strict';

import * as URLUtil from "./lib/url"

const pageElements = {};

function getHandles() {
    pageElements.questionnaireContainer = document.querySelector("#questionnaire-container");
    pageElements.createBtn = document.querySelector("#create");
    pageElements.questionnaireTemplate = document.querySelector("#questionnaire-template");
}

async function createQuestionnaire() {
    const res = await fetch ("/questionnaires", {
        method: "POST",
        body: JSON.stringify({name: "Untitled Questionnaire"}),
        headers: {'Content-Type': 'application/json'}
    });

    if (res.ok) {
        const id = await res.json();
        window.location = URLUtil.getURL("edit", id);
    } else {
        console.error(res.statusText); // todo: proper error handling
    }
}

function addEventListeners() {
    pageElements.createBtn.addEventListener('click', createQuestionnaire);
}

function populateTemplate(obj) {
    const clone = pageElements.questionnaireTemplate.content.cloneNode(true);
    clone.querySelector("h3").textContent = obj.name;

    clone.querySelector(".respond").href = URLUtil.getURL("respond", obj.id);
    clone.querySelector(".edit").href = URLUtil.getURL("edit", obj.id);
    clone.querySelector(".responses").href = URLUtil.getURL("responses", obj.id);

    pageElements.questionnaireContainer.append(clone);
}

function initAuth() {
    const auth2 = gapi.auth2.init();

    // if (auth2.isSignedIn.get()) {
    //     const user = auth2.currentUser.get();
    //     console.log(user.getId());
    // } else {
    //     console.log("Not signed in");
    // }

    auth2.isSignedIn.listen(initPage);

    return auth2;
}

async function initPage(signedIn) {
    let userId;
    if (signedIn) {
        const auth2 = gapi.auth2.init();
        const user = auth2.currentUser.get();
        userId = user.getId();
    }

    let res;
    if (userId != null) {
        res = await fetch(`/questionnaireInfo/${userId}`);
    } else {
        res = await fetch("/questionnaireInfo/");
    }

    if (res.ok) {
        const json = await res.json();
        for (const obj of json) {
            populateTemplate(obj);
        }
    } else {
        // todo: proper error handling
    }
}

async function onPageLoad() {
    getHandles();
    addEventListeners();
    initAuth();
    await initPage(false);
}

window.addEventListener('load', onPageLoad);