'use strict';

const uuid = require('uuid-random');

const users = {
    "106927976972072440406": ["example-questionnaire", "second-questionnaire"]
};
const questionnaires = require("./test-questionnaires");
const validateLib = require("./validate");

function getQuestionnaires() {
    return questionnaires;
}

function getQuestionnaireInfo(userId) {
    console.log(userId);

    const ret = [];

    for (const key of Object.keys(questionnaires)) {
        ret.push({id: key, name: questionnaires[key].name});
    }

    return ret;
}

function getQuestionnaire(id) {
    return questionnaires[id];
}

function deleteQuestionnaire(id) {
    const questionnaire = getQuestionnaire(id); // Get questionnaire from memory

    if (questionnaire === undefined)    // If no questionnaire exists for that ID, short
        return undefined;

    delete questionnaires[id];  // If a questionnaire exists for that ID, delete it

    return questionnaires;  // Return the updated list of questionnaires
}

function addQuestionnaire(name, questions, id) {
    // if required parameter value is not defined, return HTTP bad request error code
    if (name === undefined) {
        return {
            valid: false,
            reason: `Missing required parameter. name: '${name}'`,
            code: 400
        };
    }

    // if an id is defined, and a questionnaire already exists with that id, return HTTP bad request error code
    if (id !== undefined && getQuestionnaire(id) !== undefined) {
        return {
            valid: false,
            reason: `Questionnaire already exists with id '${id}'`,
            code: 400
        };
    }

    // if optional parameter values are not defined, generate default values instead
    const qnrId = id === undefined ? uuid() : id;
    const qnrQs = questions === undefined ? [] : questions;

    const qnr = {name: name, questions: qnrQs};

    const res = validateLib.validateQuestionnaire(qnr);
    if (!res.valid) {
        return res;
    }

    // add questionnaire to storage
    questionnaires[qnrId] = qnr;

    return {valid: true, id: qnrId, code: 200};
}

function updateQuestionnaire(name, questions, id) {
    const questionnaire = {
        name,
        questions
    };

    // if no matching questionnaire is found, return HTTP Not Found code
    if (getQuestionnaire(id) === undefined)
        return {valid: false, reason: `No questionnaire could be found with id '${id}'`, code: 404};

    for (const question of questionnaire.questions) {
        if (question.id === "undefined" || question.id == null) {
            question.id = uuid();
        }
    }

    const res = validateLib.validateQuestionnaire(questionnaire);

    if (!res.valid) {
        return res;
    }

    // update questionnaire
    questionnaires[id] = questionnaire;

    return {valid: true, code: 200};
}

/**
 * Used to add a question to a specific questionnaire
 * @param questionnaireId The id of the questionnaire to add a question to
 * @param questionText The text content of the question
 * @param questionType The type of the question
 * @param questionOptions The options associated with that question
 * @param questionId Optional, defines the id of the question
 * @returns {Object | undefined} A JS object, the updated questionnaire
 */
function addQuestion(questionnaireId, questionText, questionType, questionOptions, questionId) {
    const questionnaire = getQuestionnaire(questionnaireId);

    const qId = questionId === undefined ? uuid() : questionId;

    if (questionnaire === undefined) {
        return {valid: false, reason: `No questionnaire could be found with id '${questionnaireId}'`, code: 404};
    }

    const question = {
        id: qId,
        text: questionText,
        type: questionType,
        options: questionOptions
    };

    const res = validateLib.validateQuestion(question);
    if (!res.valid) {
        return res;
    }

    questionnaire.questions = [...questionnaire.questions, question];

    return {valid: true, questionnaire, code: 200};
}

module.exports = {
    getQuestionnaires,
    getQuestionnaireIDs: getQuestionnaireInfo,
    getQuestionnaire,
    deleteQuestionnaire,
    updateQuestionnaire,
    addQuestionnaire,
    addQuestion
};