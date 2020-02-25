'use strict';

const pageElements = {};

function getTemplateFromType(type) {
    const dictionary = {
        "text": pageElements.templateTextQ,
        "number": pageElements.templateNumberQ,
        "single-select": pageElements.templateSingleSelectQ,
        "multi-select": pageElements.templateMultiSelectQ,
    };

    return dictionary[type];
}

function getQuestionnaireId() {
    return window.location.hash.substring(1);
}

function displayQuestion(data) {
    const template = getTemplateFromType(data.type);

    if (template === undefined) {
        console.log("unable to create question of type", data.type); // TODO: proper error handling
        return;
    }

    // clone template
    const templateClone = template.content.cloneNode(true);
    
    // populate templateClone with data
    templateClone.querySelector(".text").textContent = data.text;

    if (templateClone.querySelector("input") !== null) {
        templateClone.querySelector("input").id = `${data.id}`;
        templateClone.querySelector("label").htmlFor = `${data.id}`;
    }

    // if a question should have an options attribute, populate options
    const optionTemplate = document.querySelector("#option-" + data.type);
    if (optionTemplate != null) {
        const optionContainer = templateClone.querySelector(".option-container");

        let i = 0;
        for (const option of data.options) {
            const optionClone = optionTemplate.content.cloneNode(true);

            optionClone.querySelector(".option-text").textContent = option;

            optionClone.querySelector("input").id = `${data.id}-${i}`;
            optionClone.querySelector("input").name = `${data.id}`;
            optionClone.querySelector("label").htmlFor = `${data.id}-${i}`;
            i++;

            optionContainer.append(optionClone);
        }
    }
    
    pageElements.qnrContainer.append(templateClone);
}

function displayQuestionnaire(obj) {
    pageElements.qnrName.textContent = obj.name;

    for (const question of obj.questions) {
        displayQuestion(question);
    }

    const submit = document.createElement("input");
    submit.type = "submit";
    submit.id = "submit";
    submit.dataset.id = getQuestionnaireId();
    pageElements.qnrContainer.append(submit);
}

function addEventListeners() {
    // TODO: submit responses, validation of submit
}

function getHandles() {
    pageElements.qnrName = document.querySelector("#questionnaire-name");
    pageElements.qnrContainer = document.querySelector("#questionnaire-container");
    pageElements.templateTextQ = document.querySelector("#question-text");
    pageElements.templateNumberQ = document.querySelector("#question-number");
    pageElements.templateSingleSelectQ = document.querySelector("#question-single-select");
    pageElements.templateMultiSelectQ = document.querySelector("#question-multi-select");
    pageElements.optionSingleSelect = document.querySelector("#option-single-select");
    pageElements.optionMultiSelect = document.querySelector("#option-multi-select");
}

async function loadQuestionnaire() {
    const id = getQuestionnaireId();
    const response = await fetch(`questionnaires/${id}`);

    let qnr;
    if (response.ok) {
        qnr = await response.json();
    } else {
        qnr = {name: "Failed to load."}; // TODO: proper error handling
    }
    displayQuestionnaire(qnr);
}

function onPageLoad() {
    getHandles();
    addEventListeners();
    loadQuestionnaire();
}

window.addEventListener('load', onPageLoad);