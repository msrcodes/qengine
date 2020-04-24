'use strict';

const pageElements = {};

function getFormData() {
    const data = {
        name: pageElements.questionnaireName.textContent,
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

            let j = 1;
            for (const option of i.options) {
                const li = document.createElement("li");
                li.id = `${i.id}-${j}`;

                const input = document.createElement("input");
                input.type = "text";
                input.value = option;
                input.id = `option-${i.id}-${j}`;

                const button = document.createElement("button");
                button.textContent = "Remove";
                button.id = `remove-${i.id}-${j}`;
                button.addEventListener('click', (e) => removeOption(e.target.id.split("remove-")[1]));

                li.append(input, button);
                optionContainer.append(li);
                j++;
            }

            const buttonContainer = document.createElement("li");
            buttonContainer.style.listStyle = "none";

            const buttonAdd = document.createElement("button");
            buttonAdd.id = `add-option-${i.id}`;
            buttonAdd.textContent = "Add an option";
            buttonContainer.append(buttonAdd);
            optionContainer.append(buttonContainer);
        }

        optionContainer.id = `option-container-${i.id}`;

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

async function updateQuestionnaire(id) {
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
    pageElements.updateBtn.addEventListener('click', () => updateQuestionnaire(pageElements.btnDeleteQuestionnaire.dataset.id));
}

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
    pageElements.questionnaireName = document.querySelector("#questionnaire-name");
    pageElements.questionnaireInput = document.querySelector("#input-questionnaire");
    pageElements.btnDeleteQuestionnaire = document.querySelector("#btn-delete-questionnaire");
    pageElements.updateBtn = document.querySelector("#update");
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

async function onPageLoad() {
    getHandles();
    addEventListeners();
    await initPage();
}

window.addEventListener('load', onPageLoad);