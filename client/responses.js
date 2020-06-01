'use strict';

import * as AuthUtil from "./lib/auth";
import * as UIUtil from "./lib/interface";
import * as URLUtil from "./lib/url";

const pageElements = {};

async function getQuestionnaire() {
    const id = URLUtil.getQuestionnaireId();

    const response = await fetch(`questionnaires/${id}`);
    if (response.ok) {
        return await response.json();
    } else {
        console.error(await response.text());
        return undefined;
    }
}

async function getResponses() {
    const id = URLUtil.getQuestionnaireId();
    let response;
    if (AuthUtil.isUserSignedIn()) {
        response = await fetch(`responses/${id}/${AuthUtil.getAuthToken()}`);
    } else {
        response = await fetch(`responses/${id}`);
    }

    if (response.ok) {
        return await response.json();
    } else {
        console.error(await response.text());
        return undefined;
    }
}

async function exportToFile(format) {
    const responses = await getResponses();
    const timestamp = Date.now();
    if (format === "json") {
        const a = document.createElement("a");
        a.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responses)));
        a.setAttribute("download", `export-${timestamp}.json`);

        a.style.display = "none";
        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
    }
}

function addGraph(question) {
    const ul = document.querySelector(`[data-id~="${question.id}"]`);
    const spans = ul.querySelectorAll("span");
    const obj = {};

    for (const span of spans) {
        obj[span.dataset.option] = Number(span.textContent);
    }

    const graph = document.createElement("custom-bar-graph");
    graph.dataset.value = JSON.stringify(obj);
    graph.dataset.title = question.text;

    ul.insertAdjacentElement('afterend', graph);
}

async function displayResponses(qnr) {
    UIUtil.clearError();
    UIUtil.removeChildren(pageElements.responsesContainer);

    // Retrieve questionnaire from local storage
    if (qnr == null) {
        UIUtil.clearError();
        UIUtil.showError("Could not find questionnaire.");
        return;
    }

    // Fetch responses
    const responses = await getResponses();
    if (responses == null) {
        UIUtil.clearError();
        UIUtil.showError("Could not get responses.");
        return;
    }

    // Create templates for inserting responses
    pageElements.name.textContent = qnr.name;
    for (const question of qnr.questions) {
        const clone = pageElements.templateResponse.content.cloneNode(true);
        clone.querySelector("h3").textContent = question.text;
        clone.querySelector("ul").dataset.id = question.id;

        // Add counter for single-select or multi-select questions
        if (question.type === "single-select" || question.type === "multi-select") {
            for (const option of question.options) {
                const li = document.createElement("li");
                li.append(document.createTextNode(`${option}: `));

                // Store the option title in dataset for easy retrieval
                // Spaces are removed as it cannot be accessed otherwise
                const span = document.createElement("span");
                span.dataset.option = option.replace(/\s/g, '');
                span.textContent = "0";
                li.append(span);

                clone.querySelector("ul").append(li);
            }
        }

        pageElements.responsesContainer.append(clone);
    }

    // Insert responses
    for (const response of responses) {
        for (const key of Object.keys(response)) {
            // Get question from response key
            let question = qnr.questions.filter(question => question.id === key);
            if (question.length === 0) {
                console.error(`Unexpected response key '${key}'`);
                continue;
            }
            question = question[0];

            // Get ul element from key
            const ul = document.querySelector(`ul[data-id~="${key}"`);
            if (ul == null) {
                console.error(`Unexpected response key '${key}'`);
                continue;
            }

            // Add data to interface based on question type
            if (question.type === "single-select" || question.type === "multi-select") {
                if (typeof response[key] === "string") {
                    response[key] = [response[key]];
                }

                for (const option of response[key]) {
                    const counter = ul.querySelector(`span[data-option~="${option.replace(/\s/g, '')}"]`);

                    if (counter == null) {
                        console.log(`"Couldn't find span[data-option~="${option.replace(/\s/g, '')}"]"`)
                    }

                    const count = Number(counter.textContent);
                    counter.textContent = String(count + 1);
                }
            } else {
                const li = document.createElement("li");
                li.append(document.createTextNode(response[key]));
                ul.append(li);
            }
        }
    }

    // Draw graphs
    for (const question of qnr.questions) {
        if (question.type === "single-select" || question.type === "multi-select") {
            addGraph(question);
        }
    }

    UIUtil.clearError();
}

function addEventListeners() {
    pageElements.exportJSON.addEventListener('click', async () => await exportToFile("json"));
}

function getHandles() {
    pageElements.exportJSON = document.querySelector("#export-json");
    pageElements.name = document.querySelector("#questionnaire-name");
    pageElements.responsesContainer = document.querySelector("#responses-container");
    pageElements.signOut = document.querySelector(".signOut");
    pageElements.templateResponse = document.querySelector("#response");
}

async function checkAuth() {
    let auth = {};

    // Bypass auth if it's a public questionnaire
    const res = await fetch("/questionnaireInfo");
    if (res.ok) {
        const json = await res.json();
        for (const obj of json) {
            if (obj.id === URLUtil.getQuestionnaireId() && obj.owner === "public") {
                return true;
            }
        }
    } else {
        console.error("failed to fetch");
    }

    // Check if user is signed in
    if (AuthUtil.isUserSignedIn()) {
        const res = await fetch(`/questionnaireInfo/${AuthUtil.getAuthToken()}`);
        if (res.ok) {
            const json = await res.json();

            // If they are signed in, check if they own this questionnaire
            let found = false;
            for (const obj of json) {
                if (obj.id === URLUtil.getQuestionnaireId()) {
                    found = true;
                    auth = {valid: true};
                    break;
                }
            }

            if (!found) {
                auth = {valid: false, reason: "User does not have access to this questionnaire."};
            }
        } else {
            auth = {valid: false, reason: res.statusText};
        }
    } else {
        auth = {valid: false, reason: "User is not logged in."};
    }

    if (!auth.valid) {
        UIUtil.showError(auth.reason);
        return false;
    }

    return true;
}

async function reload() {
    UIUtil.showLoadText();
    if (AuthUtil.isUserSignedIn()) {
        pageElements.signOut.classList.remove("hidden");
    } else {
        pageElements.signOut.classList.add("hidden");
    }

    if (!await checkAuth()) {
        return;
    }

    const qnr = await getQuestionnaire();

    await displayResponses(qnr);
    UIUtil.hideLoadText();
}

async function onPageLoad() {
    AuthUtil.init();

    getHandles();
    addEventListeners();

    await reload(); // Check auth on page load; user can edit public if not signed in
    AuthUtil.onSignIn(reload); // Re-load if user signs in
}

// Load page once auth has loaded, prevents race conditions.
function waitForAuth() {
    try {
        gapi.load('auth2', onPageLoad);
    } catch (e) {
        setTimeout(waitForAuth, 1000);
    }
}

waitForAuth();