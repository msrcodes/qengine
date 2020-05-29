'use strict';

import * as AuthUtil from "./lib/auth";
import * as UIUtil from "./lib/interface";
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
    AuthUtil.onSignIn(showHideSignOut);
}

window.addEventListener('load', onPageLoad);