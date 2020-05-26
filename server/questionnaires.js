'use strict';

const db = require('./database');
const uuid = require('uuid-random');
const validateLib = require("./validate");

async function getQuestionnaires() {
    try {
        const con = await db.dbConn;
        const qnrs = await con.all('SELECT * FROM Questionnaires');

        const ret = {};

        for (const qnr of qnrs) {
            ret[qnr.id] = {
                name: qnr['name'],
                questions: JSON.parse(qnr['questions'])
            };
        }

        return ret;
    } catch (e) {
        return {code: 400, error: e};
    }
}

async function getQuestionnaireInfo(userId) {
    try {
        const con = await db.dbConn;
        const info = await con.all(`
        SELECT id, name, questions, user_id FROM Questionnaires 
        JOIN UsersQuestionnaires ON Questionnaires.id = UsersQuestionnaires.questionnaire_id 
        WHERE UsersQuestionnaires.user_id = '_______________PUBLIC' OR UsersQuestionnaires.user_id = ?`,
            userId);

        for (const qnr of info) {
            qnr.questions = JSON.parse(qnr.questions);

            if (qnr.user_id === '_______________PUBLIC') {
                qnr.owner = 'public';

                if (qnr.questions.length > 0) {
                    qnr.lock = true;
                }
            } else {
                qnr.owner = 'user';
            }

            delete qnr.user_id;
            delete qnr.questions;
        }

        return info;
    } catch (e) {
        return {code: 400, error: e};
    }
}

async function getQuestionnaire(id) {
    try {
        const con = await db.dbConn;
        const qnr = await con.get(`SELECT name, questions FROM Questionnaires WHERE id = ?`, id);
        qnr.questions = JSON.parse(qnr.questions);

        return qnr;
    } catch (e) {
        return {code: 400, error: e};
    }
}

async function deleteQuestionnaire(id) {
    try {
        const questionnaire = await getQuestionnaire(id); // Get questionnaire from memory

        if (questionnaire === undefined)    // If no questionnaire exists for that ID, short
            return {code: 404, error: 'No questionnaire exists for that ID'};

        const con = await db.dbConn;
        con.run('DELETE FROM Questionnaires WHERE id = ?', id);

        return getQuestionnaires();  // Return the updated list of questionnaires
    } catch (e) {
        return {code: 400, error: e};
    }
}

async function addQuestionnaire(name, questions, id, userId) {
    // if required parameter value is not defined, return HTTP bad request error code
    if (name === undefined) {
        return {
            valid: false,
            reason: `Missing required parameter. name: '${name}'`,
            code: 400
        };
    }

    // if an id is defined, and a questionnaire already exists with that id, return HTTP bad request error code
    if (id !== undefined && await getQuestionnaire(id) !== undefined) {
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
    try {
        const con = await db.dbConn;
        con.run('INSERT INTO Questionnaires (id, name, questions) VALUES (?, ?, ?)', qnrId, name, JSON.stringify(qnrQs));

        // assign to correct user
        if (userId == null) {
            userId = '_______________PUBLIC';
        }

        // if user does not exist, register them
        if (con.get('SELECT * FROM Users WHERE Users.id = ?', userId) == null) {
            con.run('INSERT INTO Users (id) VALUES (?)', userId);
        }

        // add this questionnaire to the correct user
        con.run('INSERT INTO UsersQuestionnaires (user_id, questionnaire_id) VALUES (?, ?)', userId, qnrId);
    } catch (e) {
        return {valid: false, code: 400, reason: e};
    }

    return {valid: true, id: qnrId, code: 200};
}

async function updateQuestionnaire(name, questions, id) {
    const qnr = {
        name,
        questions
    };

    try {
        // if no matching questionnaire is found, return HTTP Not Found code
        if (await getQuestionnaire(id) === undefined)
            return {valid: false, reason: `No questionnaire could be found with id '${id}'`, code: 404};

        for (const question of qnr.questions) {
            if (question.id === "undefined" || question.id == null) {
                question.id = uuid();
            }
        }

        const res = validateLib.validateQuestionnaire(qnr);

        if (!res.valid) {
            return res;
        }

        // update questionnaire
        const con = await db.dbConn;
        con.run('UPDATE Questionnaires SET name = ?, questions = ? WHERE id = ?', name, JSON.stringify(qnr.questions), id);
        return {valid: true, code: 200};
    } catch (e) {
        return {valid: false, code: 400, reason: e};
    }
}

async function addQuestion(questionnaireId, text, type, options, questionId) {
    try {
        const qnr = await getQuestionnaire(questionnaireId);

        const qId = questionId === undefined ? uuid() : questionId;

        if (qnr === undefined) {
            return {valid: false, reason: `No questionnaire could be found with id '${questionnaireId}'`, code: 404};
        }

        const question = {
            id: qId,
            text: text,
            type: type,
            options: options
        };

        const res = validateLib.validateQuestion(question);
        if (!res.valid) {
            return res;
        }

        qnr.questions = [...qnr.questions, question];
        const con = await db.dbConn;
        con.run('UPDATE Questionnaires SET questions = ? WHERE id = ?', JSON.stringify(qnr.questions), questionnaireId);

        return {valid: true, questionnaire: qnr, code: 200};
    } catch (e) {
        return {valid: false, code: 400, reason: e};
    }
}

module.exports = {
    getQuestionnaires,
    getQuestionnaireInfo,
    getQuestionnaire,
    deleteQuestionnaire,
    updateQuestionnaire,
    addQuestionnaire,
    addQuestion
};