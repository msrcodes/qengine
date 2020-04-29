'use strict';

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
        const protocol = window.location.protocol;
        const host = window.location.host;
        const id = await res.json();
        window.location = `${protocol}//${host}/edit?q=${id}`;
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

    const protocol = window.location.protocol;
    const host = window.location.host;
    const id = obj.id;

    const respondURL = `${protocol}//${host}/respond?q=${id}`;
    clone.querySelector(".respond").href = respondURL;

    const editURL = `${protocol}//${host}/edit?q=${id}`;
    clone.querySelector(".edit").href = editURL;

    const responsesURL = `${protocol}//${host}/responses?q=${id}`;
    clone.querySelector(".responses").href = responsesURL;

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