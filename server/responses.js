'use strict';

const responses = require("./test-responses");
const qnr = require("./questionnaires");
const validateLib = require("./validate");

function validate(questionnaireId, response) {
    const questionnaire = qnr.getQuestionnaire(questionnaireId);

    const res = validateLib.validateQNRResponse(response, questionnaire);
    if (!res.valid) {
        return res;
    }

    return {valid: true};
}

function addResponse(questionnaireId, response) {
    const res = validate(questionnaireId, response);
    if (!res.valid) {
        return res;
    }

    // Check if a response has been given for this question before
    if (responses[questionnaireId] == null) {
        responses[questionnaireId] = []; // If a response has not been given, create empty responses array
    }

    responses[questionnaireId] = [response, ...responses[questionnaireId]];

    return {valid: true};
}

function getResponses(id) {
    return responses[id];
}

module.exports = {
    getResponses,
    addResponse
};