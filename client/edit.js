'use strict';

const pageElements = {};

function getQuestionnaireId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("q");
}

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

function populateList(list, data) {
    let index = 0;
    for (const i of data) {
        const template = document.getElementById("template-question");
        const clone = template.content.cloneNode(true);

        clone.querySelector("fieldset").dataset.id = i.id;

        clone.querySelector("#text").value = i.text;
        clone.querySelector("#text").id = `text-${i.id}`;
        clone.querySelector("legend label").style.display = "none";
        clone.querySelector("legend label").htmlFor = `text-${i.id}`;

        clone.querySelector("#type").value = i.type;
        clone.querySelector("#type").addEventListener('change', (e) => updateOptionContainerVisibility(e.target));
        clone.querySelector("#type").id = `type-${i.id}`;

        clone.querySelector("#delete-question").addEventListener('click', () => removeQuestion(i.id));
        clone.querySelector("#delete-question").id = `delete-question-${i.id}`;

        const optionContainer = clone.querySelector("#option-container");

        if (i.type === "single-select" || i.type === "multi-select") {
            optionContainer.classList.remove("hidden");

            for (const option of i.options) {
                addOption(optionContainer, option, i.id);
            }

            const buttonContainer = document.createElement("li");
            buttonContainer.style.listStyle = "none";
            buttonContainer.id = `add-option-container-${i.id}`;

            const buttonAdd = document.createElement("button");
            buttonAdd.id = `add-option-${i.id}`;
            buttonAdd.textContent = "Add an option";
            buttonAdd.addEventListener('click', () => addOption(optionContainer, "", i.id));
            buttonContainer.append(buttonAdd);
            optionContainer.append(buttonContainer);
        }

        optionContainer.id = `option-container-${i.id}`;

        list.append(clone);
        index++;
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

async function deleteQuestionnaire(id) {
    const response = await fetch(`questionnaires/${id}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        await initPage();
    } else {
        console.log("failed to delete questionnaire", response);    // TODO: proper error handling
    }
}

async function updateQuestionnaire() {
    const id = getQuestionnaireId();
    const response = await fetch(`questionnaires/${id}`, {
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
    const protocol = window.location.protocol;
    const host = window.location.host;
    const id = getQuestionnaireId();

    const respondURL = `${protocol}//${host}/respond?q=${id}`;
    pageElements.questionnaireLink.href = respondURL;
    pageElements.questionnaireLink.textContent = respondURL;

    const responsesURL = `${protocol}//${host}/responses?q=${id}`;
    pageElements.responsesLink.href = responsesURL;
}

async function displayQuestionnaire() {
    const id = getQuestionnaireId();
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
    populateList(pageElements.questions, questionnaireObj.questions);
}

function addEventListeners() {
    pageElements.btnDeleteQuestionnaire.addEventListener('click', deleteQuestionnaire);
    pageElements.updateBtn.addEventListener('click', updateQuestionnaire);
    pageElements.copyRespondBtn.addEventListener('click', copyRespondURL);
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.questionnaireName = document.querySelector("#questionnaire-name");
    pageElements.btnDeleteQuestionnaire = document.querySelector("#btn-delete-questionnaire");
    pageElements.updateBtn = document.querySelector("#update");
    pageElements.questionnaireLink = document.querySelector("#questionnaire-link");
    pageElements.responsesLink = document.querySelector("#responses-link");
    pageElements.copyRespondBtn = document.querySelector("#copy-respond-btn");
}

async function initPage() {
    const id = getQuestionnaireId();
    await displayQuestionnaire(id);
    displayQuestionnaireLink();
}

async function onPageLoad() {
    getHandles();
    addEventListeners();
    await initPage();
}

window.addEventListener('load', onPageLoad);