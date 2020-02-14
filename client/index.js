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

async function addQuestion(questionnaireID) {  // TODO: Which index to add question at?
    const payload = {
        questionnaire: questionnaireID,
        id: Date(), // TODO: uuid
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
}

function addEventListeners() {
    pageElements.submit.addEventListener('click', (e) => addQuestion(e.target.dataset.id));
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.text = document.querySelector("#input-text");
    pageElements.type = document.querySelector("#input-type");
    pageElements.submit = document.querySelector("#input-submit");
    pageElements.questionnaireName = document.querySelector("#questionnaire-name");
}

function onPageLoad() {
    getHandles();
    addEventListeners();
    displayQuestionnaire("example-questionnaire");
}

window.addEventListener('load', onPageLoad);