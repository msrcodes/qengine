'use strict';

import * as URLUtil from "./url";
import * as AuthUtil from "./auth";

export function removeChildren(elem) {
    while (elem.firstElementChild) {
        elem.firstElementChild.remove();
    }
}

export function hide(elem) {
    elem.classList.add("hidden");
}

export function show(elem) {
    elem.classList.remove("hidden");
}

export function removeParent(elem) {
    elem.parentElement.remove();
}

export function clearError() {
    show(document.querySelector("main"));
    const error = document.querySelector("h2.error");
    if (error != null) {
        error.remove();
    }
}

export function showError(message) {
    hide(document.querySelector("main"));
    const elem = document.createElement("h2");
    elem.classList.add("error", "pad");
    elem.append(document.createTextNode(message));
    document.querySelector("body").append(elem);
}

export function showOptionsMenu(menu, message, container, id) {
    const p = document.createElement("p");
    p.append(document.createTextNode(message));

    const ul = document.createElement("ul");

    for (const i of menu) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.append(document.createTextNode(i.text));
        a.href = URLUtil.getURL(i.url, id);
        li.append(a);
        ul.append(li);
    }

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.append(document.createTextNode("Return home"));
    a.href = "/";
    li.append(a);
    ul.append(li);

    container.append(p);
    container.append(ul);
}