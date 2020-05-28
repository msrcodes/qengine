'use strict';

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
    elem.classList.add("error");
    elem.append(document.createTextNode(message));
    document.querySelector("body").append(elem);
}