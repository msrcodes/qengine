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

    if (question.type === "single-select" || question.type === "multi-select") {
        clone.querySelector(".responses").dataset.type = "select";

        for (const option of question.options) {
            const li = document.createElement("li");
            li.dataset.option = option;
            li.append(document.createTextNode(`${option}: `));

            const span = document.createElement("span");
            span.append(document.createTextNode("0"));
            li.append(span);

            li.dataset.id = JSON.stringify([]);

            clone.querySelector(".responses").append(li);
        }
    }

    clone.querySelector(".response-title").textContent = question.text;
    clone.querySelector(".responses").dataset.id = question.id;

    pageElements.respContainer.appendChild(clone);
}

function highlightResponses(event) {
    const ids = JSON.parse(event.target.dataset.id);
    const allResponses = document.querySelectorAll(".responses > li");

    if (event.type === "mouseenter") {
        for (const id of ids) {
            for (const response of allResponses) {
                const resIds = JSON.parse(response.dataset.id);
                if (resIds.includes(id)) {
                    response.style = "font-weight: bold;"; // TODO: use CSS classes instead
                }
            }
        }
    } else if (event.type === "mouseout") {
        for (const id of ids) {
            for (const response of allResponses) {
                const resIds = JSON.parse(response.dataset.id);
                if (resIds.includes(id)) {
                    response.style = "";
                }
            }
        }
    }
}

function updateSelectCount(li, i) {
    const array = JSON.parse(`${li.dataset.id}`);
    array.push(i);
    li.dataset.id = JSON.stringify(array);

    const span = li.querySelector("span");
    span.textContent = String(Number(span.textContent) + 1);
}

function addResponse(response, i) {
    for (const key of Object.keys(response)) {
        const ul = document.querySelector(`[data-id~="${key}"]`);

        if (ul == null) // If the response contains a question that the questionnaire does not, skip
            continue;

        if (ul.dataset.type === "select") {
            const ans = response[key];
            if (typeof ans === "object") {
                for (const elem of ans) {
                    const li = ul.querySelector(`[data-option~="${elem}"]`);
                    updateSelectCount(li, i);
                }
            } else {
                const li = ul.querySelector(`[data-option~="${response[key]}"]`);
                updateSelectCount(li, i)
            }
        } else {
            const li = document.createElement("li");

            li.appendChild(document.createTextNode(response[key]));
            li.dataset.id = JSON.stringify([i]);
            ul.appendChild(li);

            li.addEventListener('mouseenter', highlightResponses);
            li.addEventListener('mouseout', highlightResponses);
        }
    }
}

function addGraph(question) {
    const ul = document.querySelector(`[data-id~="${question.id}"]`);
    const lis = ul.querySelectorAll("li");
    const obj = {};

    for (const li of lis) {
        obj[li.dataset.option] = Number(li.querySelector("span").textContent);
    }

    const graph = document.createElement("custom-bar-graph");
    graph.dataset.value = JSON.stringify(obj);
    graph.dataset.title = question.text;

    ul.insertAdjacentElement('afterend', graph);
}

async function initPage() {
    const qnr = await getQuestionnaire();

    pageElements.qnrName.textContent = qnr.name;

    const questionsToGraph = [];
    for (const question of qnr.questions) { // Create containers for question responses
        addResponseContainer(question);

        if (question.type === "single-select" || question.type === "multi-select") {
            questionsToGraph.push(question);
        }
    }

    const responses = await getResponses();

    let i = 0;
    for (const response of responses) {
        addResponse(response, i);
        i++;
    }

    for (const question of questionsToGraph) {
        addGraph(question);
    }
}

async function onPageLoad() {
    getHandles();
    await initPage();
}

window.addEventListener('load', onPageLoad);