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

    const validTypes = ["text", "number", "single-select", "multi-select"];
    if (!validTypes.includes(questionType))
        return "invalid type";

    if (questionType === "single-select" || questionType === "multi-select") {
        if (questionOptions == null) return "invalid options";

        if (questionOptions.length === 0) return "invalid options";
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
    getQuestionnaire,
    deleteQuestionnaire,
    addQuestionnaire,
    addQuestion
};