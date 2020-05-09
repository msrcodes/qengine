'use strict';

import * as URLUtil from "./lib/url";

const pageElements = {};

async function createFromJSON() {
    const text = pageElements.jsonInput.value;

    pageElements.importBtn.disabled = "disabled";
    pageElements.errorText.textContent = "";
    pageElements.jsonInput.style.borderColor = ""; // TODO: use CSS classes

    const res = await fetch ("/questionnaires", {
        method: "POST",
        body: text,
        headers: {'Content-Type': 'application/json'}
    });

    if (res.ok) {
        const id = await res.json();
        window.location = URLUtil.getURL("edit", id);
    } else {
        const errorText = await res.text();

        if (errorText.includes("SyntaxError")) {
            pageElements.errorText.textContent = "Malformed JSON.";
        } else {
            pageElements.errorText.textContent = errorText;
        }

        pageElements.jsonInput.style.borderColor = "red"; // TODO: use CSS classes
        pageElements.importBtn.disabled = "";
    }
}

function addEventListeners() {
    pageElements.importBtn.addEventListener('click', createFromJSON);
}

function getHandles() {
    pageElements.errorText = document.querySelector("#error-text");
    pageElements.jsonInput = document.querySelector("#json-input");
    pageElements.importBtn = document.querySelector("#import-btn");
}

async function onPageLoad() {
    getHandles();
    addEventListeners();
}

window.addEventListener('load', onPageLoad);