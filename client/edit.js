'use strict';

const pageElements = {};

function removeChildren(elem) {
    while (elem.firstElementChild) {
        elem.firstElementChild.remove();
    }
}

function populateList(list, data) {
    let index = 0;
    for (const i of data) {
        const template = document.getElementById("template-question");
        const clone = template.content.cloneNode(true);

        clone.querySelector("#text").value = i.text;
        clone.querySelector("#text").id = `text-${i.id}`;

        clone.querySelector("#type").value = i.type;
        clone.querySelector("#type").id = `type-${i.id}`;

        if (i.type === "single-select" || i.type === "multi-select") {
            const container = clone.querySelector("#option-container");
            container.classList.remove("hidden");

            let j = 1;
            for (const option of i.options) {
                const label = document.createElement("label");
                label.htmlFor = `option-${j}`;
                label.textContent = `[${j}]`;

                const input = document.createElement("input");
                input.type = "text";
                input.value = option;

                const button = document.createElement("button");
                button.textContent = "Remove";
                button.id = `remove-${input}`;

                container.append(label, input, button);
                j++;
            }

            const butonAddOption = document.createElement("button");
            butonAddOption.id = "add-option";
            butonAddOption.textContent = "Add an option";
            container.append(butonAddOption);

            container.id = `option-container-${i.id}`;
        }

        list.append(clone);
        index++;
    }
}

function populateSelect(select, data) {
    for (const i of data) {
        const child = document.createElement("option");
        child.value = i;
        child.textContent = i;
        select.append(child);
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

async function addQuestion(questionnaireID) {  // TODO: Which index to add question at?
    const payload = {
        text: pageElements.text.value,
        type: pageElements.type.value,
    };

    const response = await fetch(`questions/${questionnaireID}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        pageElements.text.value = "";
        pageElements.type.value = "";
        const updatedQuestionnaire = await response.json();
        const updatedQuestions = updatedQuestionnaire.questions;

        removeChildren(pageElements.questions);
        populateList(pageElements.questions, updatedQuestions);
    } else {
        console.log('failed to add message', response); // TODO: proper error handling
    }
}

async function displayQuestionnaire(id) {
    // If null is passed as a parameter, assume there are no questionnaires
    if (id === null) {
        pageElements.questionnaireName.textContent = "No questionnaires to display.";
        removeChildren(pageElements.questions);
        pageElements.btnDeleteQuestionnaire.dataset.id = undefined;
        return; // Short
    }

    const response = await fetch(`questionnaires/${id}`);

    let questionnaireObj;
    if (response.ok) {
        questionnaireObj = await response.json();
    } else {
        questionnaireObj = ["Error; could not load questions."]; // TODO: proper error handling
    }

    pageElements.questionnaireName.textContent = questionnaireObj.name;
    removeChildren(pageElements.questions);
    populateList(pageElements.questions, questionnaireObj.questions);

    pageElements.btnDeleteQuestionnaire.dataset.id = id;
}

async function populateQuestionnairesDropdown() { // TODO: only display questionnaires created by the user
    const response = await fetch('questionnaires');

    let questionnairesObj;
    if (response.ok) {
        questionnairesObj = await response.json();
    } else {
        questionnairesObj = ["Error; could not load questionnaires."]; // TODO: proper error handling
    }

    const keys = Object.keys(questionnairesObj);

    removeChildren(pageElements.questionnaireInput);
    populateSelect(pageElements.questionnaireInput, keys);

    return keys;
}

function addEventListeners() {
    pageElements.questionnaireInput.addEventListener('change', (e) => displayQuestionnaire(e.target.value));
    pageElements.btnDeleteQuestionnaire.addEventListener('click', (e) => deleteQuestionnaire(e.target.dataset.id));
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.questionnaireName = document.querySelector("#questionnaire-name");
    pageElements.questionnaireInput = document.querySelector("#input-questionnaire");
    pageElements.btnDeleteQuestionnaire = document.querySelector("#btn-delete-questionnaire")
}

async function initPage() {
    populateQuestionnairesDropdown().then(keys => {
        if (keys.length === 0) {
            displayQuestionnaire(null);
        } else {
            displayQuestionnaire(keys[0]);
        }
    });
}

function onPageLoad() {
    getHandles();
    addEventListeners();
    initPage();
}

window.addEventListener('load', onPageLoad);