import * as Editor from "./lib/editor";

async function onPageLoad() {
    await Editor.init({mode: "create"});
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