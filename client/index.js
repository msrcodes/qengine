'use strict';

import * as AuthUtil from "./lib/auth"
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

function toggleLoadText() {
    const loadText = pageElements.questionnaireContainer.querySelector(".loadingText");
    if (loadText == null) {
        const elem = document.createElement("p");
        elem.append(document.createTextNode("Loading, please wait..."));
        elem.classList.add("loadingText");
        pageElements.questionnaireContainer.append(elem);
    } else {
        loadText.remove();
    }
}

function clearTemplate() {
    while (pageElements.questionnaireContainer.hasChildNodes()) {
        pageElements.questionnaireContainer.firstChild.remove();
    }
}

function populateTemplate(obj) {
    const clone = pageElements.questionnaireTemplate.content.cloneNode(true);
    clone.querySelector("h3").textContent = obj.name;

    clone.querySelector(".respond").href = URLUtil.getURL("respond", obj.id);
    clone.querySelector(".edit").href = URLUtil.getURL("edit", obj.id);
    clone.querySelector(".responses").href = URLUtil.getURL("responses", obj.id);

    pageElements.questionnaireContainer.append(clone);
}

async function getQuestionnaireInfo(authToken) {
    let res;
    if (authToken == null) {
        res = await fetch("/questionnaireInfo/");
    } else {
        res = await fetch(`/questionnaireInfo/${authToken}`);
    }

    if (res.ok) {
        return await res.json();
    } else {
        return null;
    }
}

async function initPage(signedIn) {
    clearTemplate();
    toggleLoadText();

    let authToken;
    if (signedIn) {
        authToken = AuthUtil.getAuthToken();
    }

    const info = await getQuestionnaireInfo(authToken);
    if (info != null) {
        for (const obj of info) {
            populateTemplate(obj);
        }
    } else {
        const elem = document.createElement("p");
        elem.append(document.createTextNode("An unexpected error occurred.")); // TODO: refresh?
        pageElements.questionnaireContainer.append(elem);
    }

    toggleLoadText();
}

async function onPageLoad() {
    getHandles();
    addEventListeners();
    AuthUtil.init();
    AuthUtil.onSignIn(initPage);
    await initPage(false);
}

window.addEventListener('load', onPageLoad);