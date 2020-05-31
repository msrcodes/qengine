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

        if (qnr == null) {
            return {valid: false, code: 404, error: `Could not find questionnaire with id '${id}'`};
        }

        qnr.questions = JSON.parse(qnr.questions);

        return qnr;
    } catch (e) {
        return {valid: false, code: 400, error: e};
    }
}

async function checkUserAccess(qnrId, userId, edit = false) {
    const info = await getQuestionnaireInfo(userId);
    let ret;
    for (const i of info) {
        if (i.id === qnrId) {
            ret = i;
            break;
        }
    }

    if (edit && ret != null) {
        if (ret.owner === "public" && ret.lock === true) {
            return {valid: false, reason: "User cannot access this questionnaire", code: 401};
        }
    } else if (ret == null) {
        return {valid: false, reason: `Could not find questionnaire for user ${userId} with id ${qnrId}`, code: 404};
    }

    return {valid: true};
}

async function deleteQuestionnaire(qnrId, userId) {
    try {
        const questionnaire = await getQuestionnaire(qnrId); // Get questionnaire from memory

        if (questionnaire === undefined)    // If no questionnaire exists for that ID, short
            return {valid: false, code: 404, error: 'No questionnaire exists for that ID'};

        // check that the user has permissions for this questionnaire
        const access = await checkUserAccess(qnrId, userId);
        if (!access.valid) {
            return access;
        }

        const con = await db.dbConn;
        con.run('DELETE FROM Questionnaires WHERE id = ?', qnrId);
        con.run('DELETE FROM UsersQuestionnaires WHERE questionnaire_id = ?', qnrId);

        return {valid: true};  // Return the updated list of questionnaires
    } catch (e) {
        console.error(e);
        return {valid: false, code: 400, error: e};
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
    if (id != null) {
        const qnr = await getQuestionnaire(id);
        if (qnr.valid !== false) {
            return {
                valid: false,
                reason: `Questionnaire already exists with id '${id}'`,
                code: 400
            };
        }
    }

    // if no questions are given
    if (questions == null || questions.length === 0) {
        return {valid: false, reason: "Questionnaire must have one or more questions.", code: 400};
    }

    // if optional parameter values are not defined, generate default values instead
    const qnrId = id == null ? uuid() : id;

    const qnr = {name: name, questions: questions};

    for (const question of qnr.questions) {
        if (question.id == null) {
            question.id = uuid();
        }
    }

    const res = validateLib.validateQuestionnaire(qnr);
    if (!res.valid) {
        return res;
    }

    // add questionnaire to storage
    try {
        const con = await db.dbConn;
        con.run('INSERT INTO Questionnaires (id, name, questions) VALUES (?, ?, ?)', qnrId, name, JSON.stringify(questions));

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

async function updateQuestionnaire(name, questions, qnrId, userId) {
    const qnr = {
        name,
        questions
    };

    if (questions.length === 0) {
        return {valid: false, reason: "Questionnaire must have questions.", code: 400};
    }

    if (name === "Untitled Questionnaire") {
        return {valid: false, reason: `Questionnaire name must be changed from the default '${name}'.`, code: 400};
    }

    try {
        // if no matching questionnaire is found, return HTTP Not Found code
        if (await getQuestionnaire(qnrId) === undefined)
            return {valid: false, reason: `No questionnaire could be found with id '${qnrId}'`, code: 404};

        // check that the user has permissions for this questionnaire
        const access = await checkUserAccess(qnrId, userId, true);
        if (!access.valid) {
            return access;
        }

        // Assign UUIDs to questions without ids
        for (const question of qnr.questions) {
            if (question.id === "undefined" || question.id == null) {
                question.id = uuid();
            }
        }

        // Check questionnaire is valid
        const res = validateLib.validateQuestionnaire(qnr);
        if (!res.valid) {
            return res;
        }

        // update questionnaire
        const con = await db.dbConn;
        con.run('UPDATE Questionnaires SET name = ?, questions = ? WHERE id = ?', name, JSON.stringify(qnr.questions), qnrId);
        return {valid: true, code: 200};
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
    checkUserAccess
};