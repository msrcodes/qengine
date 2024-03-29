'use strict';

const QUESTION_TYPES = {
    TEXT: {
        id: "text",
        hasOptions: false,
    },
    NUMBER: {
        id: "number",
        hasOptions: false,
        isNumber: true
    },
    SINGLE_SELECT: {
        id: "single-select",
        hasOptions: true,
        uniqueOptions: true
    },
    MULTI_SELECT: {
        id: "multi-select",
        hasOptions: true,
        uniqueOptions: false
    }
};

function getQuestionTypes() {
    const ret = [];
    for (const key of Object.keys(QUESTION_TYPES)) {
        ret.push(QUESTION_TYPES[key].id);
    }
    return ret;
}

function getTypeFromID(id) {
    for (const key of Object.keys(QUESTION_TYPES)) {
        if (QUESTION_TYPES[key].id === id) {
            return QUESTION_TYPES[key];
        }
    }

    return undefined;
}

function validateQuestion(question) {
    const type = getTypeFromID(question.type);

    // Validation rule 1
    if (type == null) {
        return {valid: false, reason: "Question must be of valid question type", code: 400};
    }

    // Validation rule 2
    if (type.hasOptions === false && question.options != null) {
        return {valid: false, reason: "Question options must be null if hasOptions is false", code: 400};
    }

    // Validation rule 3
    if (type.hasOptions === true && (question.options == null || question.options == "")) {
        return {valid: false, reason: "Question options must be defined if hasOptions is true", code: 400};
    }

    // Validation rule 4
    if (question.id == null) {
        return {valid: false, reason: "Question must have ID", code: 400};
    }

    // Validation rules 5 + 6 + 7 + 8
    if (question.options != null) {
        const temp = [];
        if (question.options.length > 10) {
            return {valid: false, reason: `Must be fewer than 10 options. '${question.options}' contains more than 10 options.`, code: 400};
        }

        for (const option of question.options) {
            if (option.replace(/\s/g, '') === "") {
                return {valid: false, reason: "Options must not have empty text or contain only spaces.", code: 400};
            }

            if (temp.includes(option)) {
                return {valid: false, reason: `Question options must be unique. Found duplicate option '${option}'`, code: 400};
            }

            if (option.length > 256) {
                return {valid: false, reason: `Options must be fewer than 256 characters. Option '${option}' is longer than 256 characters`, code: 400}
            }

            temp.push(option);
        }
    }

    // Validation rule 8
    if (question.text.length > 256) {
        return {valid: false, reason: `Questions must be fewer than 256 characters. Question '${question.text}' is longer than 256 characters`, code: 400};
    }

    // Validation rule 9
    if (question.text.replace(/\s/g, '') === '') {
        return {valid: false, reason: "Questions must not have empty titles or contain only spaces.", code: 400};
    }

    return {valid: true, code: 200};
}

function validateQuestionnaire(qnr) {
    if (qnr.name === undefined || qnr.questions === undefined || qnr.visibility === undefined) {
        return {
            valid: false,
            reason: `Missing required parameter. name: '${qnr.name}', questions: '${qnr.questions}', visibility: '${qnr.visibility}'`,
            code: 400
        };
    }

    if (qnr.visibility !== true && qnr.visibility !== false) {
        return {
            valid: false,
            reason: `Visibility must be a boolean value. Found '${qnr.visibility}'`,
            code: 400
        };
    }

    // check all questions are valid
    for (const question of qnr.questions) {
        const res = validateQuestion(question);
        if (!res.valid) {
            return res;
        }
    }

    return {valid: true, code: 200};
}

function validateResponse(response, question) {
    // Validation rule 1
    const type = getTypeFromID(question.type);
    if (type == null) {
        return {
            valid: false,
            reason: "Question must be of valid question type",
            response,
            question,
            code: 400
        };
    }

    // Validation rule 4
    if (type.uniqueOptions === true && typeof response === "object") {
        return {
            valid: false,
            reason: "Only one option may be selected for question with uniqueOptions",
            response,
            question,
            code: 400
        };
    }

    // Validation rule 5
    if (type.uniqueOptions === true && !question.options.includes(response)) {
        return {
            valid: false,
            reason: "Only included options may be provided as a response to question that hasOptions",
            response,
            question,
            code: 400
        };
    }

    // Validation rule 5.5
    if (type.uniqueOptions === false) {
        for (const option of response) {
            if (!question.options.includes(option)) {
                return {
                    valid: false,
                    reason: "Only included options may be provided as a response to question that hasOptions",
                    response,
                    question,
                    code: 400
                };
            }
        }
    }

    // Validation rule 6
    if (type.isNumber === true && isNaN(Number(response))) {
        return {
            valid: false,
            reason: "Only numeric options are valid for question that requires number",
            response,
            question,
            code: 400
        };
    }

    return {valid: true, code: 200}
}

function validateQNRResponse(response, questionnaire) {
    // Check questionnaire exists
    if (questionnaire == null) {
        return {
            valid: false,
            reason: "Questionnaire could not be found",
            code: 404
        }
    }

    // Check all required questions have been answered
    for (const question of questionnaire.questions) {
        if (question.required == null || question.required === true) {
            if (response[question.id] == null || response[question.id] === "") {
                return {
                    valid: false,
                    reason: "All required questions must be answered",
                    code: 400
                }
            }
        }
    }

    // Check response does not contain any additional data
    for (const key of Object.keys(response)) {
        let foundMatch = false;

        for (const question of questionnaire.questions) {
            if (key === question.id) {
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            return {
                valid: false,
                reason: "Response must not contain any additional data",
                code: 400
            }
        }
    }

    // Follow question-based validation rules
    for (const question of questionnaire.questions) {
        const validate = validateResponse(response[question.id], question);
        if (!validate.valid) {
            return validate;
        }
    }

    return {valid: true, code: 200};
}

module.exports = {
    QUESTION_TYPES,
    getQuestionTypes,
    validateQuestion,
    validateQuestionnaire,
    validateResponse,
    validateQNRResponse
};