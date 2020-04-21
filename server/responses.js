'use strict';

const responses = require("./test-responses");
const qnr = require("./questionnaires");

/**
 * Function used to validate form responses, will return true if the response meets validation rules if it
 * does not
 *
 * Validation rules:
 * 1. All required questions must have a defined answer
 * 2. All data must be of the required type
 * 3. All data must be compliant with specified options
 *
 * @param id A string ID, matching an existing questionnaire
 * @param data An object, matching the structure defined in test-responses.json
 * @returns {Number} Return HTTP status code: 200 for success, 400 for bad request perceived to be client error, 404 if questionnaire is not found
 */
function validate(id, data) {
    const questionnaire = qnr.getQuestionnaire(id);

    // Check if questionnaire exists
    if (questionnaire == null) {
        return 404;
    }

    for (const key of Object.keys(data)) {
        let flag = false;
        for (const question of questionnaire.questions) {
            if (question.id === key) {
                flag = true;
                break;
            }
        }

        if (flag) {

        } else {
            console.log(`Found unexpected key ${key}`);
            return 400;
        }
    }

    for (const question of questionnaire.questions) {
        const answer = data[question.id];

        // If a question is required, check if it has been answered
        if (question.required || question.required == null) {
            if (answer == null) {
                console.error("Required question", question.id, "has no answer.");
                return 400;
            }
        }

        // If the answer exists, check that it is of the required type
        let valid = true;
        if (question.type === "text") {
            valid = typeof(answer) === "string";
            if (!valid) console.error(answer, "is not of type: string");
        } else if (question.type === "number") {
            valid = !isNaN(Number(answer)); // return true if answer is not NaN
            if (!valid) console.error(answer, "is not of type: number");
        } else if (question.type === "single-select") {
            valid = question.options.filter(option => option === answer).length > 0; // Check if value exists

            if (!valid) {
                console.error(answer, "is not in", question.options);
            }
        } else if (question.type === "multi-select") {
            for (const ans of answer) {
                if (question.options.filter(option => option === ans).length === 0) { // if value does not exist...
                    console.error(ans, "is not in", question.options);
                    valid = false;
                }
            }
        }

        if (!valid) {
            console.log("bad request");
            return 400; // bad request
        }
    }

    return 200;
}

function addResponse(id, data) {
    try {
        const valid = validate(id, data);

        if (valid === 404 || valid === 400) {
            return valid;
        }

        // Check if a response has been given for this question before
        if (responses[id] == null) {
            responses[id] = []; // If a response has not been given, create empty responses array
        }

        responses[id] = [data, ...responses[id]];
        return valid;
    } catch (e) {
        return e;
    }
}

function getResponses(id) {
    return responses[id];
}

module.exports = {
    getResponses,
    addResponse
};