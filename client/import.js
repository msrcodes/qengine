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

        const main = document.querySelector("main");
        while (main.hasChildNodes()) {
            main.removeChild(main.firstChild);
        }

        const p = document.createElement("p");
        p.append(document.createTextNode("Import successful. The questionnaire has now been published."));
        main.append(p);

        const ul = document.createElement("ul");

        const links = [
            {url: "responses", text: "View Responses"},
            {url: "respond", text: "Respond to this questionnaire"},
            {url: "edit", text: "Edit this questionnaire"}
        ];

        for (const i of links) {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.append(document.createTextNode(i.text));
            a.href = URLUtil.getURL(i.url, id);
            li.append(a);
            ul.append(li);
        }

        if (!AuthUtil.isUserSignedIn()) {
            ul.lastChild.remove();
        }

        main.append(ul);
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