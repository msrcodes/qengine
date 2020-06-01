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
        const userQuestionnaires = await con.all(`
        SELECT id, name, visibility FROM Questionnaires 
        JOIN UsersQuestionnaires ON Questionnaires.id = UsersQuestionnaires.questionnaire_id 
        WHERE UsersQuestionnaires.user_id = ?`, userId);

        for (const qnr of userQuestionnaires) {
            // Convert binary value to boolean
            qnr.visibility = qnr.visibility === 1;

            qnr.owner = 'user';
        }

        const publicQuestionnaires = await con.all(`
        SELECT id, name, visibility FROM Questionnaires 
        JOIN UsersQuestionnaires ON Questionnaires.id = UsersQuestionnaires.questionnaire_id 
        WHERE UsersQuestionnaires.user_id != ? AND visibility = 1`, userId);

        for (const qnr of publicQuestionnaires) {
            // Convert binary value to boolean
            qnr.visibility = qnr.visibility === 1;

            qnr.owner = 'public';
        }

        return [...userQuestionnaires, ...publicQuestionnaires];
    } catch (e) {
        return {code: 400, error: e};
    }
}

async function getQuestionnaire(id) {
    try {
        const con = await db.dbConn;
        const qnr = await con.get(`SELECT name, questions, visibility FROM Questionnaires WHERE id = ?`, id);

        if (qnr == null) {
            return {valid: false, code: 404, error: `Could not find questionnaire with id '${id}'`};
        }

        // Convert binary value to boolean
        qnr.visibility = qnr.visibility === 1;

        qnr.questions = JSON.parse(qnr.questions);

        return qnr;
    } catch (e) {
        return {valid: false, code: 400, error: e};
    }
}

async function checkUserAccess(qnrId, userId, edit = false) {
    try {
        const con = await db.dbConn;
        const publicId = '_______________PUBLIC';

        const qnr = await con.get(`SELECT name, visibility, user_id FROM Questionnaires
                                   JOIN UsersQuestionnaires ON Questionnaires.id = UsersQuestionnaires.questionnaire_id 
                                   WHERE Questionnaires.id = ?`, qnrId);

        if (qnr == null) {
            return {valid: false, reason: `Could not find questionnaire with ID ${qnrId} for user ID ${userId}.`, code: 404};
        }

        // Convert binary value to boolean
        qnr.visibility = qnr.visibility === 1;

        if (edit) {
            if (qnr.user_id === publicId) {
                return {valid: false, reason: 'Public questionnaires cannot be edited once published.', code: 401};
            } else if (qnr.user_id !== userId) {
                return {valid: false, reason: 'User does not have access to this questionnaire.', code: 401};
            }
        } else {
            if (qnr.user_id !== publicId && qnr.user_id !== userId) {
                return {valid: false, reason: 'User does not have access to this questionnaire.', code: 401};
            }
        }

        return {valid: true};
    } catch (e) {
        return {valid: false, reason: e, code: 400};
    }
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

async function addQuestionnaire(name, questions, visibility, id, userId) {
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

    const qnr = {name: name, questions: questions, visibility: visibility};

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
        con.run('INSERT INTO Questionnaires (id, name, visibility, questions) VALUES (?, ?, ?, ?)', qnrId, name, visibility, JSON.stringify(questions));

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

async function updateQuestionnaire(name, questions, visibility, qnrId, userId) {
    const qnr = {
        name,
        questions,
        visibility
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
        con.run('UPDATE Questionnaires SET name = ?, questions = ?, visibility = ? WHERE id = ?', name, JSON.stringify(qnr.questions), visibility, qnrId);
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