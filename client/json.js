'use strict';

import * as AuthUtil from "./lib/auth";
import * as UIUtil from "./lib/interface";

const pageElements = {};

function getHandles() {
    pageElements.signOut = document.querySelector(".signOut");
}

async function showHideSignOut() {
    if (AuthUtil.isUserSignedIn()) {
        UIUtil.show(pageElements.signOut);
    } else {
        UIUtil.hide(pageElements.signOut);
    }
}

async function onPageLoad() {
    AuthUtil.init();

    getHandles();

    await showHideSignOut();
    AuthUtil.onSignIn(showHideSignOut);
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