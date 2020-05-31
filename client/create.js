import * as Editor from "./lib/editor";

async function onPageLoad() {
    await Editor.init({mode: "create"});
}

window.addEventListener('load', onPageLoad);