'use strict';

import * as AuthUtil from "./lib/auth"
import * as URLUtil from "./lib/url"

const pageElements = {};

function getHandles() {
    pageElements.createBtn = document.querySelector("#create");
    pageElements.publicQnrs = document.querySelector("#public-questionnaire-container");
    pageElements.questionnaireContainer = document.querySelector("#questionnaire-container");
    pageElements.questionnaireTemplate = document.querySelector("#questionnaire-template");
    pageElements.signOut = document.querySelector(".signOut");
}

async function createQuestionnaire() {
    let res;
    if (AuthUtil.isUserSignedIn()) {
        res = await fetch ("/questionnaires", {
            method: "POST",
            body: JSON.stringify({
                name: "Untitled Questionnaire",
                token: AuthUtil.getAuthToken(),
            }),
            headers: {'Content-Type': 'application/json'}
        });
    } else {
        res = await fetch ("/questionnaires", {
            method: "POST",
            body: JSON.stringify({name: "Untitled Questionnaire"}),
            headers: {'Content-Type': 'application/json'}
        });
    }

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

    if (obj.owner === "user") {
        pageElements.questionnaireContainer.append(clone);
    } else if (obj.owner === "public") {
        clone.querySelector(".edit").remove();
        pageElements.publicQnrs.append(clone);
    }


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
        pageElements.signOut.classList.remove("hidden");
    } else {
        pageElements.signOut.classList.add("hidden");
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
    AuthUtil.init();
    getHandles();
    addEventListeners();

    AuthUtil.onSignIn(initPage);
    await initPage(false);
}

window.addEventListener('load', onPageLoad);