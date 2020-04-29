'use strict';

import * as URLUtil from "./lib/url"

const pageElements = {};

async function getResponses() {
    const response = await fetch(`/responses/${URLUtil.getQuestionnaireId()}`);

    let responses;
    if (response.ok) {
        responses = await response.json();
    } else {
        responses = []; // TODO: better error handling
    }

    return responses;
}

async function getQuestionnaire() {
    const response = await fetch(`/questionnaires/${URLUtil.getQuestionnaireId()}`);

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

function addResponseContainer(question) {
    const template = document.querySelector("#response");
    const clone = template.content.cloneNode(true);

    clone.querySelector(".response-title").textContent = question.text;
    clone.querySelector(".responses").dataset.id = question.id;

    pageElements.respContainer.appendChild(clone);
}

function highlightResponses(event) {
    const likeResponses = document.querySelectorAll(`[data-id~="${event.target.dataset.id}"]`);

    if (event.type === "mouseenter") {
        for (const response of likeResponses) {
            response.style = "font-weight: bold;";  // TODO: use CSS classes instead
        }
    } else if (event.type === "mouseout") {
        for (const response of likeResponses) {
            response.style = "";    // TODO: use CSS classes instead
        }
    }
}

function addResponse(response, i) {
    for (const key of Object.keys(response)) {
        const ul = document.querySelector(`[data-id~="${key}"]`);
        const li = document.createElement("li");

        if (ul == null) // If the response contains a question that the questionnaire does not, skip
            continue;

        li.appendChild(document.createTextNode(response[key]));
        li.dataset.id = i;
        ul.appendChild(li);

        li.addEventListener('mouseenter', highlightResponses);
        li.addEventListener('mouseout', highlightResponses);
    }
}

async function initPage() {
    const qnr = await getQuestionnaire();

    pageElements.qnrName.textContent = qnr.name;

    for (const question of qnr.questions) { // Create containers for question responses
        addResponseContainer(question);
    }

    const responses = await getResponses();
    let i = 0;
    for (const response of responses) {
        addResponse(response, i);
        i++;
    }
}

async function onPageLoad() {
    getHandles();
    await initPage();
}

window.addEventListener('load', onPageLoad);