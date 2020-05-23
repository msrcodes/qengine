'use strict';

import * as AuthUtil from "./lib/auth";
import * as URLUtil from "./lib/url";

const pageElements = {};

function getFormData() {
    const data = {
        name: pageElements.questionnaireName.value,
        questions: []
    };

    const questionContainers = pageElements.questions.querySelectorAll("fieldset");
    for (const container of questionContainers) {
        const question = {
            id: container.dataset.id,
            text: container.querySelector(`#text-${container.dataset.id}`).value,
            type: container.querySelector(`#type-${container.dataset.id}`).value
        };

        if (question.type === "single-select" || question.type === "multi-select") {
            let options = [];
            const optionInputs = container.querySelectorAll(`#option-container-${container.dataset.id} input`);
            for (const input of optionInputs) {
                options = [...options, input.value];
            }
            question.options = options;
        }

        data.questions = [...data.questions, question];
    }

    return data;
}

function removeChildren(elem) {
    while (elem.firstElementChild) {
        elem.firstElementChild.remove();
    }
}

function removeOption(id) {
    const option = document.querySelector(`#${id}`);

    option.remove();
}

function removeQuestion(id) {
    const question = document.querySelector(`fieldset[data-id="${id}"]`);
    question.remove();
}

function addOption(container, option, id) {
    let index;

    const addContainer = container.querySelector(`#add-option-container-${id}`);
    if (addContainer != null) {
        addContainer.remove();
    }

    const options = container.children;

    if (options.length === 0)
        index = options.length;
    else index = Number(options[options.length - 1].id.split("-")[1]) + 1;

    const li = document.createElement("li");
    li.id = `${id}-${index}`;

    const input = document.createElement("input");
    input.type = "text";
    input.value = option;
    input.id = `option-${id}-${index}`;

    const button = document.createElement("button");
    button.textContent = "Remove";
    button.id = `remove-${id}-${index}`;
    button.addEventListener('click', (e) => removeOption(e.target.id.split("remove-")[1]));

    li.append(input, button);
    container.append(li);

    if (addContainer != null) {
        container.append(addContainer);
    }
}

function addQuestion(question, container) {
    const template = document.getElementById("template-question");
    const clone = template.content.cloneNode(true);

    clone.querySelector("fieldset").dataset.id = question.id;

    clone.querySelector("#text").value = question.text;
    clone.querySelector("#text").id = `text-${question.id}`;
    clone.querySelector("legend label").style.display = "none";
    clone.querySelector("legend label").htmlFor = `text-${question.id}`;

    clone.querySelector("#type").value = question.type;
    clone.querySelector("#type").addEventListener('change', (e) => updateOptionContainerVisibility(e.target));
    clone.querySelector("#type").id = `type-${question.id}`;

    clone.querySelector("#delete-question").addEventListener('click', () => removeQuestion(question.id));
    clone.querySelector("#delete-question").id = `delete-question-${question.id}`;

    const optionContainer = clone.querySelector("#option-container");

    if (question.type === "single-select" || question.type === "multi-select") {
        optionContainer.classList.remove("hidden");

        for (const option of question.options) {
            addOption(optionContainer, option, question.id);
        }

        const buttonContainer = document.createElement("li");
        buttonContainer.style.listStyle = "none";
        buttonContainer.id = `add-option-container-${question.id}`;

        const buttonAdd = document.createElement("button");
        buttonAdd.id = `add-option-${question.id}`;
        buttonAdd.textContent = "Add an option";
        buttonAdd.addEventListener('click', () => addOption(optionContainer, "", question.id));
        buttonContainer.append(buttonAdd);
        optionContainer.append(buttonContainer);
    }

    optionContainer.id = `option-container-${question.id}`;

    container.append(clone);
}

function addQuestions(container, questions) {
    for (const question of questions) {
        addQuestion(question, container);
    }
}

function updateOptionContainerVisibility(target) {
    const optionContainer = document.querySelector(`#option-container-${target.id.split("-")[1]}`);
    if (target.value === "single-select" || target.value === "multi-select") {
        optionContainer.classList.remove("hidden");
    } else {
        optionContainer.classList.add("hidden");
    }
}

async function deleteQuestionnaire() {
    const response = await fetch(`questionnaires/${URLUtil.getQuestionnaireId()}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        window.location = "/";
    } else {
        console.log("failed to delete questionnaire", response);    // TODO: proper error handling
    }
}

async function updateQuestionnaire() {
    const response = await fetch(`questionnaires/${URLUtil.getQuestionnaireId()}`, {
        method: 'PUT',
        body: JSON.stringify(getFormData()),
        headers: {'Content-Type': 'application/json'}
    });

    if (response.ok) {
        alert("Successfully edited questionnaire");
    } else {
        console.error(`Failed to update questionnaire, error ${response.status} ${response.statusText}`);
    }
}

function copyRespondURL(e) {
    const a = pageElements.questionnaireLink;

    navigator.permissions.query({name: "clipboard-write"}).then(result => {
        if (result.state === "granted" || result.state === "prompt") {
            navigator.clipboard.writeText(a.href).then(
                () => { // on success
                    e.target.textContent = "Copied!";
                    setTimeout(() => {e.target.textContent = "Copy to clipboard"},  5000);
                },
                () => { // on failure
                    e.target.textContent = "An error occurred.";
                    setTimeout(() => {e.target.textContent = "Copy to clipboard"},  5000);
                });
        }
    });
}

function displayQuestionnaireLink() {
    const respondURL = URLUtil.getURL("respond", URLUtil.getQuestionnaireId());
    pageElements.questionnaireLink.href = respondURL;
    pageElements.questionnaireLink.textContent = respondURL;

    pageElements.responsesLink.href = URLUtil.getURL("responses", URLUtil.getQuestionnaireId());
}

async function displayQuestionnaire() {
    const id = URLUtil.getQuestionnaireId();

    document.querySelector("main").classList.remove("hidden");
    const error = document.querySelector("h2.error");
    if (error != null) {
        error.remove();
    }

    // If null is passed as a parameter, assume there are no questionnaires
    if (id === null) {
        pageElements.questionnaireName.textContent = "No questionnaires to display.";
        removeChildren(pageElements.questions);
        return; // Short
    }

    const response = await fetch(`questionnaires/${id}`);

    let questionnaireObj;
    if (response.ok) {
        questionnaireObj = await response.json();
    } else {
        questionnaireObj = ["Error; could not load questions."]; // TODO: proper error handling
    }

    pageElements.questionnaireName.value = questionnaireObj.name;
    removeChildren(pageElements.questions);
    addQuestions(pageElements.questions, questionnaireObj.questions);
}

function addEventListeners() {
    pageElements.btnDeleteQuestionnaire.addEventListener('click', deleteQuestionnaire);
    pageElements.updateBtn.addEventListener('click', updateQuestionnaire);
    pageElements.copyRespondBtn.addEventListener('click', copyRespondURL);
    pageElements.addQuestionBtn.addEventListener('click', () => {
       addQuestion({
           text: "New Question",
           type: "text"
       }, pageElements.questions);
    });
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.questionnaireName = document.querySelector("#questionnaire-name");
    pageElements.btnDeleteQuestionnaire = document.querySelector("#btn-delete-questionnaire");
    pageElements.updateBtn = document.querySelector("#update");
    pageElements.questionnaireLink = document.querySelector("#questionnaire-link");
    pageElements.responsesLink = document.querySelector("#responses-link");
    pageElements.copyRespondBtn = document.querySelector("#copy-respond-btn");
    pageElements.addQuestionBtn = document.querySelector("#add-question");
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
        document.querySelector("main").classList.add("hidden");
        const elem = document.createElement("h2");
        elem.classList.add("error");
        elem.append(document.createTextNode(auth.reason));
        document.querySelector("body").append(elem);
        return false;
    }

    return true;
}

async function authedLoad() {
    if (!await checkAuth()) {
        return;
    }

    await displayQuestionnaire();
    displayQuestionnaireLink();
}

async function onPageLoad() {
    AuthUtil.init();

    getHandles();
    addEventListeners();

    AuthUtil.onSignIn(authedLoad);
    await authedLoad();
}

window.addEventListener('load', onPageLoad);