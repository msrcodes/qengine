'use strict';

import * as AuthUtil from "./lib/auth";
import * as URLUtil from "./lib/url";

const pageElements = {};

function hide(elem) {
    elem.classList.add("hidden");
}

function show(elem) {
    elem.classList.remove("hidden");
}

function removeParent(button) {
    button.parentElement.remove();
}

function clearError() {
    show(document.querySelector("main"));
    const error = document.querySelector("h2.error");
    if (error != null) {
        error.remove();
    }
}

function showError(message) {
    hide(document.querySelector("main"));
    const elem = document.createElement("h2");
    elem.classList.add("error");
    elem.append(document.createTextNode(message));
    document.querySelector("body").append(elem);
}

function getFormData() {
    const data = {
        name: pageElements.title.value,
        id: URLUtil.getQuestionnaireId(),
        questions: []
    };

    const fieldsets = document.querySelectorAll("fieldset");
    for (const fieldset of fieldsets) {
        const question = {};

        if (fieldset.dataset.id === "undefined") {
            question.id = undefined;
        } else {
            question.id = fieldset.dataset.id;
        }

        question.text = fieldset.querySelector("legend input").value;
        question.type = fieldset.querySelector("select").value;

        if (question.type === "single-select" || question.type === "multi-select") {
            question.options = [];
            const options = fieldset.querySelectorAll("li input");
            for (const option of options) {
                question.options.push(option.value);
            }
        }

        data.questions.push(question);
    }

    return data;
}

async function saveQuestionnaire() {
    const response = await fetch(`questionnaires/${URLUtil.getQuestionnaireId()}`, {
        method: 'PUT',
        body: JSON.stringify(getFormData()),
        headers: {'Content-Type': 'application/json'}
    });

    if (response.ok) {
        showError("Success");
    } else {
        pageElements.error.textContent = `${response.status} ${response.statusText}: ${await response.text()}`;
    }
}

async function deleteQuestionnaire() {
    const response = await fetch(`questionnaires/${URLUtil.getQuestionnaireId()}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        window.location = "/";
    } else {
        pageElements.error.textContent = `${response.status} ${response.statusText}: ${await response.text()}`;
    }
}

function copyToClipboard(event) {
    const a = pageElements.respondLink;

    navigator.permissions.query({name: "clipboard-write"}).then(result => {
        if (result.state === "granted" || result.state === "prompt") {
            navigator.clipboard.writeText(a.href).then(
                () => { // on success
                    event.target.textContent = "Copied!";
                    setTimeout(() => {event.target.textContent = "Copy to clipboard"},  5000);
                },
                () => { // on failure
                    event.target.textContent = "An error occurred.";
                    setTimeout(() => {event.target.textContent = "Copy to clipboard"},  5000);
                });
        }
    });
}

function checkOptionContainerVisibility(select) {
    const fieldset = select.parentElement.parentElement;
    const optionContainer = fieldset.querySelector("ol");
    const addOptionButton = fieldset.querySelector(".add-option");

    if (select.value === "single-select" || select.value === "multi-select") {
        show(optionContainer);
        show(addOptionButton);
    } else {
        hide(optionContainer);
        hide(addOptionButton);
    }
}

function clearQuestions() {
    while (pageElements.firstElementChild) {
        pageElements.firstElementChild.remove();
    }
}

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

function displayOption(option, container) {
    const clone = pageElements.templateOption.content.cloneNode(true);

    clone.querySelector("input").value = option;
    clone.querySelector("button").addEventListener('click', e => removeParent(e.target));

    container.append(clone);
}

function displayQuestion(question = {text: "", type: "text"}) {
    const clone = pageElements.templateQuestion.content.cloneNode(true);

    clone.querySelector("fieldset").dataset.id = question.id;

    clone.querySelector("input").value = question.text;

    const select = clone.querySelector("select");
    select.value = question.type;
    select.addEventListener('change', e => checkOptionContainerVisibility(e.target));

    const btnDelete = clone.querySelector(".delete");
    btnDelete.addEventListener('click', e => removeParent(e.target));

    const optionContainer = clone.querySelector("ol");

    const btnAddOption = clone.querySelector(".add-option");
    btnAddOption.addEventListener('click', () => displayOption("", optionContainer));

    if (question.type === "single-select" || question.type === "multi-select") {
        for (const option of question.options) {
            displayOption(option, optionContainer);
        }

        show(optionContainer);
        show(btnAddOption);
    }

    pageElements.questions.append(clone);
}

async function displayQuestionnaire() {
    if (URLUtil.getQuestionnaireId() == null) {
        showError("No questionnaire to display, please specify id.");
        return;
    }

    const qnr = await getQuestionnaire();
    if (qnr == null) {
        showError("Failed to load questionnaire");
        return;
    }

    clearError();

    pageElements.title.value = qnr.name;
    clearQuestions();
    for (const question of qnr.questions) {
        displayQuestion(question);
    }

    const respondURL = URLUtil.getURL("respond", URLUtil.getQuestionnaireId());
    pageElements.respondLink.href = respondURL;
    pageElements.respondLink.textContent = respondURL;

    pageElements.responsesLink.href = URLUtil.getURL("responses", URLUtil.getQuestionnaireId());
}

function addEventListeners() {
    pageElements.addQuestion.addEventListener("click", () => displayQuestion());
    pageElements.copy.addEventListener('click', e => copyToClipboard(e));
    pageElements.delete.addEventListener('click', deleteQuestionnaire);
    pageElements.save.addEventListener('click', saveQuestionnaire);
}

function getHandles() {
    pageElements.addQuestion = document.querySelector("#add-question");
    pageElements.copy = document.querySelector("#copy-respond-btn");
    pageElements.delete = document.querySelector("#btn-delete-questionnaire");
    pageElements.error = document.querySelector("#error");
    pageElements.title = document.querySelector("#questionnaire-name");
    pageElements.templateOption = document.querySelector("#template-option");
    pageElements.templateQuestion = document.querySelector("#template-question");
    pageElements.questions = document.querySelector("#questions");
    pageElements.respondLink = document.querySelector("#questionnaire-link");
    pageElements.responsesLink = document.querySelector("#responses-link");
    pageElements.save = document.querySelector("#update");
}

async function checkAuth() {
    let auth = {};

    // Bypass auth if it's a public questionnaire on first edit
    const res = await fetch("/questionnaireInfo");
    if (res.ok) {
        const json = await res.json();
        for (const obj of json) {
            if (obj.id === URLUtil.getQuestionnaireId() && obj.owner === "public") {
                if (!obj.lock) {
                    return true;
                }
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

                    if (obj.owner === "public") {
                        auth = {valid: false, reason: "Public questionnaires cannot be edited."};
                    } else {
                        auth = {valid: true};
                    }
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
        showError(auth.reason);
        return false;
    }

    return true;
}

async function reload() {
    if (!await checkAuth()) {
        return;
    }

    await displayQuestionnaire();
}

async function onPageLoad() {
    AuthUtil.init();

    getHandles();
    addEventListeners();

    AuthUtil.onSignIn(reload); // Re-load if user signs in
    await reload(); // Check auth on page load; user can edit public if not signed in
}

window.addEventListener('load', onPageLoad);