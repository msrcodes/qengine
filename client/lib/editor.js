'use strict';

import * as AuthUtil from "./auth";
import * as UIUtil from "./interface";
import * as URLUtil from "./url";

const pageElements = {};

function getFormData(id = URLUtil.getQuestionnaireId()) {
    const data = {
        name: pageElements.title.value,
        id: id,
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
        question.required = fieldset.querySelector(".input-required").checked;

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

async function updateQuestionnare() {
    let responseStr;

    if (AuthUtil.isUserSignedIn()) {
        responseStr = `questionnaires/${URLUtil.getQuestionnaireId()}/${AuthUtil.getAuthToken()}`;
    } else {
        responseStr = `questionnaires/${URLUtil.getQuestionnaireId()}`;
    }

    return await fetch(responseStr, {
        method: 'PUT',
        body: JSON.stringify(getFormData()),
        headers: {'Content-Type': 'application/json'}
    });
}

async function createQuestionnaire() {
    let res;
    const body = getFormData();
    if (AuthUtil.isUserSignedIn()) {
        body.token = AuthUtil.getAuthToken();

        res = await fetch ("/questionnaires", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
    } else {
        res = await fetch ("/questionnaires", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
    }

    return res;
}

async function publishQuestionnaire(options) {
    // Auto-save in the event of an error
    await saveToLocalStorage();

    // Send request to server to create/update the questionnaire
    let response;
    if (options.mode === 'create') {
        response = await createQuestionnaire();
    } else {
        response = await updateQuestionnare();
    }

    // Handle response
    if (response.ok) {
        let id;
        if (options.mode === 'create') {
            id = await response.json();
        } else {
            id = URLUtil.getQuestionnaireId();
        }

        const main = document.querySelector("main");
        UIUtil.removeChildren(main);

        let menu = [
            {url: "responses", text: "View Responses"},
            {url: "respond", text: "Respond to this questionnaire"},
            {url: "edit", text: "Edit this questionnaire again"}
        ];

        UIUtil.showOptionsMenu(menu, "Successfully edited.", main, id);
    } else {
        pageElements.error.textContent = await response.text();
    }
}

async function deleteQuestionnaire() {
    let responseStr;
    if (AuthUtil.isUserSignedIn()) {
        responseStr = `questionnaires/${URLUtil.getQuestionnaireId()}/${AuthUtil.getAuthToken()}`;
    } else {
        responseStr = `questionnaires/${URLUtil.getQuestionnaireId()}`;
    }

    const response = await fetch(responseStr, {
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
        UIUtil.show(optionContainer);
        UIUtil.show(addOptionButton);
    } else {
        UIUtil.hide(optionContainer);
        UIUtil.hide(addOptionButton);
    }
}

async function getQuestionnaire(options) {
    if (options.mode === 'create') {
        return {name: "Untitled Questionnaire", questions: []};
    }

    const id = URLUtil.getQuestionnaireId();

    const response = await fetch(`questionnaires/${id}`);
    if (response.ok) {
        return await response.json();
    } else {
        console.error(await response.text());
        return undefined;
    }
}

function displayRespondLink(id = URLUtil.getQuestionnaireId()) {
    const respondURL = URLUtil.getURL("respond", id);
    pageElements.respondLink.href = respondURL;
    pageElements.respondLink.textContent = respondURL;

    pageElements.responsesLink.href = URLUtil.getURL("responses", id);
    UIUtil.show(pageElements.share);
}

function displayOption(option, container) {
    const clone = pageElements.templateOption.content.cloneNode(true);

    clone.querySelector("input").value = option;
    clone.querySelector("button").addEventListener('click', e => UIUtil.removeParent(e.target));

    container.append(clone);
}

function displayQuestion(question = {text: "", type: "text"}) {
    const clone = pageElements.templateQuestion.content.cloneNode(true);

    clone.querySelector("fieldset").dataset.id = question.id;

    clone.querySelector("input").value = question.text;

    if (question.required != null) {
        clone.querySelector(".input-required").checked = question.required;
    }

    const select = clone.querySelector("select");
    select.value = question.type;
    select.addEventListener('change', e => checkOptionContainerVisibility(e.target));

    const btnDelete = clone.querySelector(".delete");
    btnDelete.addEventListener('click', e => UIUtil.removeParent(e.target));

    const optionContainer = clone.querySelector("ol");

    const btnAddOption = clone.querySelector(".add-option");
    btnAddOption.addEventListener('click', () => displayOption("", optionContainer));

    if (question.type === "single-select" || question.type === "multi-select") {
        for (const option of question.options) {
            displayOption(option, optionContainer);
        }

        UIUtil.show(optionContainer);
        UIUtil.show(btnAddOption);
    }

    pageElements.questions.append(clone);
}

async function displayQuestionnaire(questionnaire, options) {
    // if no questionnaire was found, error
    if (questionnaire == null) {
        UIUtil.showError("Failed to load questionnaire");
        return;
    }

    // load questionnaire
    UIUtil.clearError();

    pageElements.title.value = questionnaire.name;
    UIUtil.removeChildren(pageElements.questions);
    for (const question of questionnaire.questions) {
        displayQuestion(question);
    }

    if (options.mode !== 'create') {
        displayRespondLink();
    }
}

async function loadFromLocalStorage() {
    const save = localStorage.getItem("qengine-autosave");

    if (save != null) {
        const data = JSON.parse(save);

        if (data.id === URLUtil.getQuestionnaireId()) {
            await displayQuestionnaire(data);
        }
    }
}

async function saveToLocalStorage() {
    const data = await getFormData();
    data.time = Date.now();
    localStorage.setItem("qengine-autosave", JSON.stringify(data));

    const date = new Date(data.time);
    pageElements.autosaveTimer.textContent = date.toLocaleString();
}

function addEventListeners(options) {
    pageElements.addQuestion.addEventListener("click", () => displayQuestion());
    pageElements.autosaveRestore.addEventListener('click', loadFromLocalStorage);
    pageElements.copy.addEventListener('click', e => copyToClipboard(e));
    pageElements.delete.addEventListener('click', deleteQuestionnaire);
    pageElements.save.addEventListener('click', () => publishQuestionnaire(options));
}

function getHandles() {
    pageElements.addQuestion = document.querySelector("#add-question");
    pageElements.autosaveRestore = document.querySelector("#autosave-now");
    pageElements.autosaveTimer = document.querySelector("#autosave-time");
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
    pageElements.signOut = document.querySelector(".signOut");
    pageElements.share = document.querySelector("#share");
}

async function initAutosave() {
    const save = localStorage.getItem("qengine-autosave");

    if (save != null) {
        const data = JSON.parse(save);
        if (data.id === URLUtil.getQuestionnaireId()) {
            const date = new Date(data.time);
            pageElements.autosaveTimer.textContent = date.toLocaleString();
        }
    }

    setInterval(await saveToLocalStorage, 1000 * 30);
}

async function checkAuth(mode) {
    let auth = {};

    // Bypass auth if editor is in create mode
    if (mode === 'create') {
        return true;
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
        UIUtil.clearError();
        UIUtil.showError(auth.reason);
        return false;
    }

    return true;
}

async function reload(options) {
    if (AuthUtil.isUserSignedIn()) {
        UIUtil.show(pageElements.signOut);
    } else {
        UIUtil.hide(pageElements.signOut);
    }

    if (!await checkAuth(options.mode)) {
        return;
    }

    await displayQuestionnaire(await getQuestionnaire(options), options);
}

function initInterface(options) {
    if (options.mode === 'create') {
        UIUtil.hide(pageElements.share);
        UIUtil.hide(pageElements.delete);
    }
}

async function init(options) {
    AuthUtil.init();

    getHandles();
    addEventListeners(options);

    AuthUtil.onSignIn(() => reload(options));
    initInterface(options);

    await reload(options);
    await initAutosave();
}

export {
    init
};
