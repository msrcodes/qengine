'use strict';

let auth2;

/* Helper functions */
async function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    await auth2.signOut();
}

export function getIDToken() {
    const user = auth2.currentUser.get();
    return user.getId();
}

/* Event Listeners */
export function onSignIn(f) {
    auth2.isSignedIn.listen(f);
}

/* Initialisation code */
function initSignOut() {
    const buttons = document.querySelectorAll(".signOut");

    for (const i of buttons) {
        i.addEventListener('click', signOut);
    }
}

export function init() {
    auth2 = gapi.auth2.init();
    initSignOut();
}