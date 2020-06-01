'use strict';

import * as AuthUtil from "./lib/auth";
import * as UIUtil from "./lib/interface";
import * as URLUtil from "./lib/url";

const pageElements = {};

function getHandles() {
    pageElements.createInfo = document.querySelector("#create-info");
    pageElements.errorText = document.querySelector(".error");
    pageElements.publicQnrs = document.querySelector("#public-questionnaire-container");
    pageElements.questionnaireContainer = document.querySelector("#questionnaire-container");
    pageElements.questionnaireTemplate = document.querySelector("#questionnaire-template");
    pageElements.sectionUser = document.querySelector("#section-user");
    pageElements.signOut = document.querySelector(".signOut");
}

function clearTemplate() {
    UIUtil.removeChildren(pageElements.questionnaireContainer);
    UIUtil.removeChildren(pageElements.publicQnrs);
}

function populateTemplate(obj) {
    const clone = pageElements.questionnaireTemplate.content.cloneNode(true);
    clone.querySelector("h3").textContent = obj.name;

    clone.querySelector(".respond").href = URLUtil.getURL("respond", obj.id);
    clone.querySelector(".edit").href = URLUtil.getURL("edit", obj.id);
    clone.querySelector(".responses").href = URLUtil.getURL("responses", obj.id);

    if (obj.owner === "user") {
        if (obj.visibility === true) {
            clone.querySelector("em").textContent = "Anyone can view this questionnaire.";
        } else {
            clone.querySelector("em").textContent = "Anyone with the link can view this questionnaire.";
        }

        pageElements.questionnaireContainer.append(clone);
    } else if (obj.owner === "public") {
        clone.querySelector(".edit").remove();
        pageElements.publicQnrs.append(clone);
    }


}

async function getQuestionnaireInfo(authToken) {
    let res;
    if (authToken == null) {
        res = await fetch("/questionnaireInfo/lim/10");
    } else {
        res = await fetch(`/questionnaireInfo/${authToken}/lim/10`);
    }

    if (res.ok) {
        return await res.json();
    } else {
        return null;
    }
}

async function initPage(signedIn) {
    UIUtil.showLoadText();
    clearTemplate();

    let authToken;
    if (signedIn) {
        authToken = AuthUtil.getAuthToken();
        UIUtil.show(pageElements.signOut);
        UIUtil.show(pageElements.questionnaireContainer);
        UIUtil.show(pageElements.sectionUser);

        pageElements.createInfo.textContent = "You are currently logged in. As such, anyone will be able to respond to your questionnaire but only you will be able to edit it and view the responses to it.";
        pageElements.publicQnrs.classList.remove("double-height");
    } else {
        UIUtil.hide(pageElements.signOut);
        UIUtil.hide(pageElements.questionnaireContainer);
        UIUtil.hide(pageElements.sectionUser);

        pageElements.createInfo.textContent = "You are currently not logged in. As such, anyone will be able to respond to your questionnaire and view the responses to it but you will not be able to edit it once it has been published.";
        pageElements.publicQnrs.classList.add("double-height");
    }

    const info = await getQuestionnaireInfo(authToken);
    if (info != null) {
        for (const obj of info) {
            populateTemplate(obj);
        }
    } else {
        const elem = document.createElement("p");
        elem.append(document.createTextNode("An unexpected error occurred."));
        pageElements.questionnaireContainer.append(elem);
    }

    UIUtil.hideLoadText();
}

async function onPageLoad() {
    AuthUtil.init();
    AuthUtil.onSignIn(initPage);

    getHandles();
    await initPage(AuthUtil.isUserSignedIn());
}

// Load page once auth has loaded, prevents race conditions.
function waitForAuth() {
    try {
        gapi.load('auth2', onPageLoad);
    } catch (e) {
        setTimeout(waitForAuth, 1000);
    }
}

waitForAuth();