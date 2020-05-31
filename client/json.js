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

gapi.load('auth2', onPageLoad);