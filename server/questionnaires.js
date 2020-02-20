'use strict';

const uuid = require('uuid-random');

let questionnaires = {
    "example-questionnaire": { // Questionnaires will be found via a UUID; this is just an example
        "name": "Example Questionnaire",
        "questions": [
            {
                "id": "name",
                "text": "What is your name?",
                "type": "text"
            },
            {
                "id": "quest",
                "text": "What is your quest?",
                "type": "text"
            },
            {
                "id": "col",
                "text": "What is your favourite colour?",
                "type": "text"
            },
            {
                "id": "velo",
                "text": "What is the air-speed velocity of an unladen swallow?",
                "type": "number"
            },
            {
                "id": "lord",
                "text": "Which is the best lord?",
                "type": "single-select",
                "options": [
                    "Lord of the Rings",
                    "Lord of the Flies",
                    "Lord of the Dance",
                    "Lorde"
                ]
            },
            {
                "id": "langs",
                "text": "Which computer languages have you used?",
                "type": "multi-select",
                "options": [
                    "JavaScript",
                    "Java",
                    "C",
                    "Python",
                    "Ook",
                    "LISP"
                ]
            }
        ]
    },
    "second-questionnaire": { // Questionnaires will be found via a UUID; this is just an example
        "name": "A second Questionnaire",
        "questions": [
            {
                "id": "name",
                "text": "What is not your name?",
                "type": "text"
            },
            {
                "id": "quest",
                "text": "What is not your quest?",
                "type": "text"
            },
            {
                "id": "col",
                "text": "What is not your favourite colour?",
                "type": "text"
            },
            {
                "id": "velo",
                "text": "What is not the air-speed velocity of an unladen swallow?",
                "type": "number"
            },
            {
                "id": "lord",
                "text": "Which is not the best lord?",
                "type": "single-select",
                "options": [
                    "Lord of the Rings",
                    "Lord of the Flies",
                    "Lord of the Dance",
                    "Lorde"
                ]
            },
            {
                "id": "langs",
                "text": "Which computer languages have not you used?",
                "type": "multi-select",
                "options": [
                    "JavaScript",
                    "Java",
                    "C",
                    "Python",
                    "Ook",
                    "LISP"
                ]
            }
        ]
    },
};

/**
 * Used to retrieve all currently stored questionnaires
 * @returns Object A JSON object containing all stored questionnaires
 */
function getQuestionnaires() {
    return questionnaires;
}

/**
 * Used to retrieve a specific questionnaire
 * @param id The id of the questionnaire to retrieve
 * @returns {Object | undefined} A JSON object, the questionnaire found
 */
function getQuestionnaire(id) {
    return questionnaires[id];
}

/**
 * Used to delete a specific questionnaire
 * @param id The id of the questionnaire to delete
 * @returns {Object | undefined} A JSON object, the updated list of all stored questionnaires
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
 * @returns {Object | undefined} A JSON object, the updated questionnaire
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