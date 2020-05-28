'use strict';

const db = require('./database');
const qnr = require("./questionnaires");
const validateLib = require("./validate");

async function validate(qnrId, response) {
    const questionnaire = await qnr.getQuestionnaire(qnrId);

    const res = validateLib.validateQNRResponse(response, questionnaire);
    if (!res.valid) {
        return res;
    }

    return {valid: true};
}

async function addResponse(qnrId, response) {
    const res = await validate(qnrId, response);
    if (!res.valid) {
        return res;
    }

    const con = await db.dbConn;
    await con.run('INSERT INTO Responses (questionnaire_id, response) VALUES (?, ?)', qnrId, JSON.stringify(response));

    return {valid: true};
}

async function getResponses(qnrId, userId) {
    try {
        const access = await qnr.checkUserAccess(qnrId, userId);
        if (!access.valid) {
            return access;
        }

        const con = await db.dbConn;
        const responses = await con.all('SELECT response FROM Responses WHERE questionnaire_id = ?', qnrId);

        for (let i = 0; i < responses.length; i++) {
            responses[i] = JSON.parse(responses[i].response);
        }

        return {valid: true, responses: responses};
    } catch (e) {
        return {valid: false, code: 400, reason: e};
    }
}

module.exports = {
    getResponses,
    addResponse
};