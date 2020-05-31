import * as Editor from "./lib/editor";

async function onPageLoad() {
    await Editor.init({mode: "create"});
}

gapi.load('auth2', onPageLoad);