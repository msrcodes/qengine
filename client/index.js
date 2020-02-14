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

async function addQuestion() {  // TODO: Which index to add question at?
    const payload = {
        questionnaire: "example-questionnaire",
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

async function displayQuestions() {
    const response = await fetch('questions');
    let questionsObj;
    if (response.ok) {
        questionsObj = await response.json();
    } else {
        questionsObj = ["Error; could not load questions."]; // TODO: proper error handling
    }

    removeChildren(pageElements.questions);
    populateList(pageElements.questions, questionsObj);
}

function addEventListeners() {
    pageElements.submit.addEventListener('click', () => addQuestion());
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.text = document.querySelector("#input-text");
    pageElements.type = document.querySelector("#input-type");
    pageElements.submit = document.querySelector("#input-submit");
}

function onPageLoad() {
    getHandles();
    addEventListeners();
    displayQuestions();
}

window.addEventListener('load', onPageLoad);