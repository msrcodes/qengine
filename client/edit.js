import * as Editor from "./lib/editor";
import * as AuthUtil from "./lib/auth";

async function onPageLoad() {
    AuthUtil.init();
    await Editor.init({mode: "edit"});
}

window.addEventListener('load', onPageLoad);