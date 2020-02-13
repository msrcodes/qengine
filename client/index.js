'use strict';

const pageElements = {};

function removeChildren(elem) {
    while (elem.firstElementChild) {
        elem.remove(elem.firstElementChild);
    }
}

function populateList(list, data) {
    for (const i of data) {
        const child = document.createElement("li");
        child.textContent = i;
        list.append(child);
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

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
}

function onPageLoad() {
    getHandles();
    displayQuestions();
}

window.addEventListener('load', onPageLoad);