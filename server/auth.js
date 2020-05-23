const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = "669662674922-5ttb2672udcvvnfk4mnfm2h6hu4350uu.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

async function verifyToken(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload();
        const id = payload.sub;
        return {valid: true, code: 200, id};
    } catch (e) {
        return {valid: false, code: 401, reason: e};
    }
}

module.exports = {
    verifyToken
};