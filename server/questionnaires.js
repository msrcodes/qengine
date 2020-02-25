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
 * @returns {Object | undefined} A JS object, the updated questionnaire
 */
function addQuestion(questionnaireId, questionText, questionType, questionOptions) {
    const questionnaire = getQuestionnaire(questionnaireId);

    if (questionnaire === undefined)
        return undefined;

    const question = {
        id: uuid(),
        text: questionText,
        type: questionType,
        options: questionOptions
    };

    questionnaire.questions = [question, ...questionnaire.questions];

    return questionnaire;
}

module.exports = {
    getQuestionnaires,
    getQuestionnaire,
    deleteQuestionnaire,
    addQuestion
};