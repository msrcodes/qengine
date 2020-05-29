'use strict';

import * as UIUtil from "./lib/interface";
import * as URLUtil from "./lib/url"

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

function getFormData() {
    const data = {};
    const fieldsets = document.querySelectorAll("#questionnaire-container > fieldset");
    for (const fieldset of fieldsets) {
        if (fieldset.classList.contains("option-container")) {  // if question is single-choice or multi-choice
            let checked = [];
            const inputs = fieldset.querySelectorAll("input");
            for (const input of inputs) {   // iterate through all possible inputs
                if (input.checked) {    // if the input is checked...
                    const label = fieldset.querySelector(`label[for='${input.id}']`);

                    if (input.type === 'radio') {   // ... return that input if single-choice
                        checked = label.textContent;
                        break;
                    }

                    checked = [label.textContent, ...checked]; // ... add it to the array if multi-choice
                }
            }
            data[inputs[0].name] = checked; // add to form data object
        } else {
            const input = fieldset.querySelector("input");

            if (input.type === "number") {
                data[input.id] = Number(input.value);
            } else {
                data[input.id] = input.value;
            }
        }
    }

    return data;
}

async function postResponse() {
    const payload = getFormData();

    const response = await fetch(`responses/${URLUtil.getQuestionnaireId()}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        const main = document.querySelector("main");
        UIUtil.removeChildren(main);
        UIUtil.showOptionsMenu([], "Successfully responded.", main);
    } else {
        pageElements.error.textContent = await response.text();
    }
}

function displayQuestion(data) {
    const template = getTemplateFromType(data.type);

    if (template === undefined) {
        console.log("unable to create question of type", data.type); // TODO: proper error handling
        return;
    }

    // clone template
    const templateClone = template.content.cloneNode(true);
    templateClone.querySelector("fieldset").dataset.id = data.id;
    
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
    submit.addEventListener('click', postResponse);
    pageElements.qnrContainer.append(submit);
}

function getHandles() {
    pageElements.error = document.querySelector("#error-text");
    pageElements.qnrName = document.querySelector("#questionnaire-name");
    pageElements.qnrContainer = document.querySelector("#questionnaire-container");
    pageElements.templateTextQ = document.querySelector("#question-text");
    pageElements.templateNumberQ = document.querySelector("#question-number");
    pageElements.templateSingleSelectQ = document.querySelector("#question-single-select");
    pageElements.templateMultiSelectQ = document.querySelector("#question-multi-select");
    pageElements.optionSingleSelect = document.querySelector("#option-single-select");
    pageElements.optionMultiSelect = document.querySelector("#option-multi-select");
    pageElements.submit = document.querySelector("#submit");
}

async function loadQuestionnaire() {
    const response = await fetch(`questionnaires/${URLUtil.getQuestionnaireId()}`);

    let qnr;
    if (response.ok) {
        qnr = await response.json();
    } else {
        qnr = {name: "Failed to load."}; // TODO: proper error handling
    }
    displayQuestionnaire(qnr);
}

async function onPageLoad() {
    getHandles();
    await loadQuestionnaire();
}

window.addEventListener('load', onPageLoad);