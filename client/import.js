'use strict';

import * as AuthUtil from "./lib/auth";
import * as URLUtil from "./lib/url";

const pageElements = {};

async function createFromJSON() {
    const text = pageElements.jsonInput.value;

    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        pageElements.errorText.textContent = e;
        return;
    }

    pageElements.importBtn.disabled = "disabled";
    pageElements.errorText.textContent = "";
    pageElements.jsonInput.style.borderColor = ""; // TODO: use CSS classes

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
    AuthUtil.init();
    getHandles();
    addEventListeners();
}

window.addEventListener('load', onPageLoad);