'use strict';

const express = require('express');
const auth = require("./server/auth");
const qnr = require("./server/questionnaires");
const resp = require("./server/responses");

const app = express();

app.use(express.static('client', {extensions: ['html', 'js']}));

async function verifyToken(req, res) {
    const response = await auth.verifyToken(req.body.idtoken);

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response);
}

function addResponse(req, res) {
    const response = resp.addResponse(req.params.id, req.body);

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response);
}

function getResponses(req, res) {
    const responses = resp.getResponses(req.params.id);

    if (responses === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    res.json(responses);
}

function getQuestionnaires(req, res) {
    res.json(qnr.getQuestionnaires());
}

function getQuestionnaireInfo(req, res) {
    const id = req.params.id;
    if (id != null) {
        res.json(qnr.getQuestionnaireIDs(id));
    } else {
        res.json(qnr.getQuestionnaireIDs());
    }
}

function getQuestionnaire(req, res) {
    const questionnaire = qnr.getQuestionnaire(req.params.id);

    if (questionnaire === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    res.json(questionnaire);
}

function deleteQuestionnaire(req, res) {
    const response = qnr.deleteQuestionnaire(req.params.id);

    if (response === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    res.json(response); // return updated list of questionnaires
}

function addQuestionnaire(req, res) {
    const response = qnr.addQuestionnaire(req.body.name, req.body.questions, req.body.id);

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response.id);
}

function updateQuestionnaire(req, res) {
    const response = qnr.updateQuestionnaire(req.body.name, req.body.questions, req.params.id);

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response.code);
}

function addQuestion(req, res) {
    const response = qnr.addQuestion(req.params.id, req.body.text, req.body.type, req.body.options);

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response.questionnaire); // return updated questionnaire
}

app.post('/auth', express.urlencoded({extended: true}), verifyToken);

app.post('/responses/:id', express.json(), addResponse);

app.get('/responses/:id', getResponses);

app.post('/questions/:id', express.json(), addQuestion);

app.put('/questionnaires/:id', express.json(), updateQuestionnaire);

app.post('/questionnaires', express.json(), addQuestionnaire);

app.delete('/questionnaires/:id', deleteQuestionnaire);

app.get('/questionnaires/:id', getQuestionnaire);

app.get('/questionnaireInfo', getQuestionnaireInfo);

app.get('/questionnaireInfo/:id', getQuestionnaireInfo);

app.get('/questionnaires', getQuestionnaires);

app.listen(8080);