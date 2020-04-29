'use strict';

const uuid = require('uuid-random');

const questionnaires = require("./test-questionnaires");

/**
 * Used to retrieve all currently stored questionnaires
 * @returns Object A JS object containing all stored questionnaires
 */
function getQuestionnaires() {
    return questionnaires;
}

function getQuestionnaireInfo() {
    const ret = [];

    for (const key of Object.keys(questionnaires)) {
        ret.push({id: key, name: questionnaires[key].name});
    }

    return ret;
}

/**
 * Used to retrieve a specific questionnaire
 * @param id The id of the questionnaire to retrieve
 * @returns {Object | undefined} A JS object, the questionnaire found
 */
function getQuestionnaire(id) {
    return questionnaires[id];
}

function addQuestionnaire(name, questions, id) {
    // if required parameter value is not defined, return HTTP bad request error code
    if (name === undefined)
        return 400;

    // if an id is defined, and a questionnaire already exists with that id, return HTTP bad request error code
    if (id !== undefined && getQuestionnaire(id) !== undefined)
        return 400;

    // if optional parameter values are not defined, generate default values instead
    const qnrId = id === undefined ? uuid() : id;
    const qnrQs = questions === undefined ? [] : questions;

    // add questionnaire to storage
    questionnaires[qnrId] = {
        name: name,
        questions: []
    };

    for (const question of qnrQs) {
        const res = addQuestion(qnrId, question.text, question.type, question.options, question.id);
        if (res === "invalid type" || res === "invalid options") {
            delete questionnaires[qnrId];
            return 400;
        }
    }

    return qnrId;
}

/**
 * Used to delete a specific questionnaire
 * @param id The id of the questionnaire to delete
 * @returns {Object | undefined} A JS object, the updated list of all stored questionnaires
 */
function deleteQuestionnaire(id) {
    const questionnaire = getQuestionnaire(id); // Get questionnaire from memory

    if (questionnaire === undefined)    // If no questionnaire exists for that ID, short
        return undefined;

    delete questionnaires[id];  // If a questionnaire exists for that ID, delete it

    return questionnaires;  // Return the updated list of questionnaires
}

function updateQuestionnaire(name, questions, id) {
    // if any required parameter is missing, return HTTP Bad Request code
    if (name === undefined || questions === undefined || id === undefined)
        return 400;

    // if no matching questionnaire is found, return HTTP Not Found code
    if (getQuestionnaire(id) === undefined)
        return 404;

    // check all questions are valid
    for (const question of questions) {
        const validate = validateQuestion(question.type, question.options);
        if (validate !== true) {
            return 400;
        }
    }

    // update questionnaire
    questionnaires[id] = {
        name: name,
        questions: questions
    };

    return 200;
}

function validateQuestion(questionType, questionOptions) {
    const validTypes = ["text", "number", "single-select", "multi-select"];
    if (!validTypes.includes(questionType))
        return "invalid type";

    if (questionType === "single-select" || questionType === "multi-select") {
        if (questionOptions == null) return "invalid options";

        if (questionOptions.length === 0) return "invalid options";
    }

    return true;
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

    if (questionnaire === undefined)
        return undefined;

    const validate = validateQuestion(questionType, questionOptions);
    if (validate !== true) {
        return validate;
    }

    const question = {
        id: qId,
        text: questionText,
        type: questionType,
        options: questionOptions
    };

    questionnaire.questions = [...questionnaire.questions, question];

    return questionnaire;
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