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

async function initPage() {
    const res = await fetch("/questionnaireInfo");

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
    await initPage();
}

window.addEventListener('load', onPageLoad);