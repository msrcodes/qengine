'use strict';

import * as AuthUtil from "./lib/auth";
import * as UIUtil from "./lib/interface";

const pageElements = {};

async function createFromJSON() {
    const text = pageElements.jsonInput.value;

    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        pageElements.importError.textContent = e;
        return;
    }

    pageElements.importBtn.disabled = "disabled";
    pageElements.importError.textContent = "";
    pageElements.jsonInput.style.borderColor = "";

    let res;
    if (AuthUtil.isUserSignedIn()) {
        json.token = AuthUtil.getAuthToken();
        res = await fetch ("/questionnaires", {
            method: "POST",
            body: JSON.stringify(json),
            headers: {'Content-Type': 'application/json'}
        });
    } else {
        res = await fetch ("/questionnaires", {
            method: "POST",
            body: text,
            headers: {'Content-Type': 'application/json'}
        });
    }

    if (res.ok) {
        const id = await res.json();

        const main = document.querySelector("main");
        UIUtil.removeChildren(main);

        let menu = [
            {url: "responses", text: "View Responses"},
            {url: "respond", text: "Respond to this questionnaire"},
            {url: "edit", text: "Edit this questionnaire"}
        ];
        const message = "Import successful. The questionnaire has now been published.";

        if (!AuthUtil.isUserSignedIn()) {
            menu.pop();
        }

        UIUtil.showOptionsMenu(menu, message, main, id);
    } else {
        const errorText = await res.text();

        if (errorText.includes("SyntaxError")) {
            pageElements.importError.textContent = "Malformed JSON.";
        } else {
            pageElements.importError.textContent = errorText;
        }

        pageElements.jsonInput.style.borderColor = "red";
        pageElements.importBtn.disabled = "";
    }
}

function loadFromFile(e) {
    pageElements.fileError.textContent = '';
    const file = e.target.files[0];

    if (file.type !== "application/json") {
        pageElements.fileError.textContent = `Please upload a JSON file. Expected 'application/json', found ${file.type}`;
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const json = JSON.parse(e.target.result);
            pageElements.jsonInput.textContent = JSON.stringify(json, null, 4);
        } catch (e) {
            pageElements.fileError.textContent = `${e}, fix the error and then try uploading again.`;
        }

        pageElements.fileInput.value = '';
    };
    reader.readAsText(file);
}

function addEventListeners() {
    pageElements.fileInput.addEventListener('change', loadFromFile);
    pageElements.importBtn.addEventListener('click', createFromJSON);
}

function getHandles() {
    pageElements.fileError = document.querySelector("#file-error");
    pageElements.fileInput = document.querySelector("#file-input");
    pageElements.jsonInput = document.querySelector("#json-input");
    pageElements.importBtn = document.querySelector("#import-btn");
    pageElements.importError = document.querySelector("#import-error");
    pageElements.signOut = document.querySelector(".signOut");
}

async function showHideSignOut() {
    if (AuthUtil.isUserSignedIn()) {
        pageElements.signOut.classList.remove("hidden");
    } else {
        pageElements.signOut.classList.add("hidden");
    }
}

async function onPageLoad() {
    AuthUtil.init();
    getHandles();
    addEventListeners();

    const example = {
        "name": "Placeholder Questionnaire",
        "questions": [
            {
                "text": "What is your name?",
                "type": "text"
            },
            {
                "text": "Is this a good question?",
                "type": "single-select",
                "options": ["Yes", "No"]
            }
        ]
    };
    pageElements.jsonInput.placeholder = JSON.stringify(example, null, 4);

    await showHideSignOut();
    AuthUtil.onSignIn(showHideSignOut);
}

gapi.load('auth2', onPageLoad);