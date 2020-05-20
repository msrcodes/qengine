async function onSignIn(googleUser) {
    const id_token = googleUser.getAuthResponse().id_token;

    const res = await fetch('/auth', {
        method: 'POST',
        body: `idtoken=${id_token}`,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    });

    if (res.ok) {
        const json = await res.json();
        console.log(json);
    } else {
        console.log("no");
    }
}

async function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    await auth2.signOut();
    console.log('User signed out.');
}