'use strict';

const pageElements = {};

function getQuestionnaireId() {
    return window.location.hash.substring(1);
}

async function getResponses() {
    const response = await fetch(`/responses/${getQuestionnaireId()}`);

    let responses;
    if (response.ok) {
        responses = await response.json();
    } else {
        responses = []; // TODO: better error handling
    }

    return responses;
}

async function getQuestionnaire() {
    const response = await fetch(`/questionnaires/${getQuestionnaireId()}`);

    let qnr;
    if (response.ok) {
        qnr = await response.json();
    } else {
        qnr = {name: "Failed to load questionnaire"}; // TODO: better error handling
    }

    return qnr;
}

function getHandles() {
    pageElements.qnrName = document.querySelector("#questionnaire-name");
    pageElements.respContainer = document.querySelector("#responses-container");
}

function addEventListeners() {

}

function addResponseContainer(question) {
    const template = document.querySelector("#response");
    const clone = template.content.cloneNode(true);

    clone.querySelector(".response-title").textContent = question.text;
    clone.querySelector(".responses").dataset.id = question.id;

    pageElements.respContainer.appendChild(clone);
}

function addResponse(response) {
    for (const key of Object.keys(response)) {
        const ul = document.querySelector(`[data-id~="${key}"]`);
        const li = document.createElement("li");

        if (ul == null) // If the response contains a question that the questionnaire does not, skip
            continue;

        li.appendChild(document.createTextNode(response[key]));
        ul.appendChild(li);
    }
}

async function initPage() {
    const qnr = await getQuestionnaire();

    pageElements.qnrName.textContent = qnr.name;

    for (const question of qnr.questions) { // Create containers for question responses
        addResponseContainer(question);
    }

    const responses = await getResponses();
    for (const response of responses) {
        addResponse(response);
    }
}

function onPageLoad() {
    getHandles();
    addEventListeners();
    initPage();
}

window.addEventListener('load', onPageLoad);