import * as Editor from "./lib/editor";
import * as AuthUtil from "./lib/auth";

async function onPageLoad() {
    AuthUtil.init();
    await Editor.init({mode: "edit"});
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