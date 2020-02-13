'use strict';

const pageElements = {};

function getHandles() {
    pageElements.questions = document.querySelector("#questions");
}

function onPageLoad() {
    getHandles();
}

window.addEventListener('load', onPageLoad);