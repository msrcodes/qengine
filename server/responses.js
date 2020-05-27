'use strict';

const db = require('./database');
const qnr = require("./questionnaires");
const validateLib = require("./validate");

async function validate(questionnaireId, response) {
    const questionnaire = await qnr.getQuestionnaire(questionnaireId);

    const res = validateLib.validateQNRResponse(response, questionnaire);
    if (!res.valid) {
        return res;
    }

    return {valid: true};
}

async function addResponse(questionnaireId, response) {
    const res = await validate(questionnaireId, response);
    if (!res.valid) {
        return res;
    }

    const con = await db.dbConn;
    await con.run('INSERT INTO Responses (questionnaire_id, response) VALUES (?, ?)', questionnaireId, JSON.stringify(response));

    return {valid: true};
}

async function getResponses(id) {
    const con = await db.dbConn;
    const responses = await con.all('SELECT response FROM Responses WHERE questionnaire_id = ?', id);

    for (let i = 0; i < responses.length; i++) {
        responses[i] = JSON.parse(responses[i].response);
    }

    return responses;
}

module.exports = {
    getResponses,
    addResponse
};