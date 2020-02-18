'use strict';

const pageElements = {};

function removeChildren(elem) {
    while (elem.firstElementChild) {
        elem.firstElementChild.remove();
    }
}

function populateList(list, data) {
    for (const i of data) {
        const child = document.createElement("li");
        child.dataset.id = i.id;
        child.textContent = i.text;
        list.append(child);
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
        questionnaire: questionnaireID,
        text: pageElements.text.value,
        type: pageElements.type.value,
    };

    const response = await fetch('questions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        pageElements.text.value = "";
        pageElements.type.value = "";
        const updatedQuestions = await response.json();

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
        pageElements.submit.dataset.id = undefined;
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

    // Questionnaire ID is stored in the submit button (for now); TODO: Should this be in a parent element?
    pageElements.submit.dataset.id = id;
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
    pageElements.submit.addEventListener('click', (e) => addQuestion(e.target.dataset.id));
    pageElements.questionnaireInput.addEventListener('change', (e) => displayQuestionnaire(e.target.value));
    pageElements.btnDeleteQuestionnaire.addEventListener('click', (e) => deleteQuestionnaire(e.target.dataset.id));
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.text = document.querySelector("#input-text");
    pageElements.type = document.querySelector("#input-type");
    pageElements.submit = document.querySelector("#input-submit");
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