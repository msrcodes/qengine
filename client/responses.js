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
        UIUtil.clearError();
        UIUtil.showError(await response.text());
        return undefined;
    }
}

function formatCSVString(string) {
    // If text contains a comma, the entire string must be wrapped in double quotes.
    if (string.includes(",")) {
        // If double quotes are used to wrap a field...
        let i = 0;
        let ret = '';
        for (const char of string) {
            // any double quote inside the string must be escaped by an additional double quote
            if (char === '"') {
                ret = ret + '"';
            }

            ret = ret + char;
            i++;
        }

        string = `"${ret}"`;
    }
    return string;
}

async function exportToFile(format) {
    const questionnaire = await getQuestionnaire();
    const responses = await getResponses();

    let content;
    if (format === "json") {
        const obj = [];
        for (const response of responses) {
            const ret = {};
            for (const key of Object.keys(response)) {
                let flag = false;
                for (const question of questionnaire.questions) {
                    if (question.id === key) {
                        ret[question.text] = response[key];
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    ret[key] = response[key];
                }
            }
            obj.push(ret);
        }

        content = JSON.stringify(obj);
    } else if (format === "csv") {
        const ids = [];
        const titles = [];
        for (const question of questionnaire.questions) {
            ids.push(question.id);

            question.text = formatCSVString(question.text);

            titles.push(question.text);
        }

        content = `${titles}`;

        for (const response of responses) {
            const line = [];
            for (const id of ids) {
                let res = String(response[id]);

                res = formatCSVString(res);

                line.push(res);
            }
            content = content + `\n${line}`;
        }
    }

    const a = document.createElement("a");
    a.setAttribute("href", `data:text/${format};charset=utf-8,` + encodeURIComponent(content));
    a.setAttribute("download", `export-${Date.now()}.${format}`);

    a.style.display = "none";
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
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
        return;
    }

    // Create templates for inserting responses
    pageElements.name.textContent = qnr.name;
    for (const question of qnr.questions) {
        const clone = pageElements.templateResponse.content.cloneNode(true);
        clone.querySelector("h4").textContent = question.text;
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
    pageElements.exportCSV.addEventListener('click', async () => await exportToFile("csv"));
    pageElements.exportJSON.addEventListener('click', async () => await exportToFile("json"));
}

function getHandles() {
    pageElements.exportCSV = document.querySelector("#export-csv");
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
    UIUtil.showLoad();
    UIUtil.hide(document.querySelector("main"));

    UIUtil.setLoadProgress(0, "Checking sign in status");
    if (AuthUtil.isUserSignedIn()) {
        UIUtil.show(pageElements.signOut);
    } else {
        UIUtil.hide(pageElements.signOut);
    }

    UIUtil.setLoadProgress(10, "Checking authentication");
    if (!await checkAuth()) {
        return;
    }

    UIUtil.setLoadProgress(30, "Fetching questionnaire");
    const qnr = await getQuestionnaire();

    UIUtil.setLoadProgress(80, "Displaying questionnaire");
    await displayResponses(qnr);

    UIUtil.setLoadProgress(100, "Complete!");
    UIUtil.hideLoad();
    UIUtil.show(document.querySelector("main"));
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