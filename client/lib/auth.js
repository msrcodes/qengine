'use strict';

let auth2;

/* Helper functions */
async function signOut() {
    await auth2.signOut();
}

export function isUserSignedIn() {
    const user = auth2.currentUser.get();
    return user.isSignedIn();
}

export function getUserID() {
    const user = auth2.currentUser.get();
    return user.getId();
}

export function getAuthToken() {
    const user = auth2.currentUser.get();
    return user.getAuthResponse().id_token;
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