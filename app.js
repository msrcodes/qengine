'use strict';

const express = require('express');
const auth = require("./server/auth");
const qnr = require("./server/questionnaires");
const resp = require("./server/responses");

const app = express();

app.use(express.static('client', {extensions: ['html', 'js']}));

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

async function getQuestionnaires(req, res) {
    const response = await qnr.getQuestionnaires();

    if (response.code === 400) {
        res.status(400).send(response.reason);
        return;
    }

    res.json(response);
}

async function getQuestionnaireInfo(req, res) {
    const token = req.params.token;

    let response;
    if (token != null) {
        const tokenAuth = await auth.verifyToken(token);
        if (!tokenAuth.valid) {
            res.status(tokenAuth.code).send(tokenAuth.reason);
            return;
        }

        response = await qnr.getQuestionnaireInfo(tokenAuth.id);
    } else {
        response = await qnr.getQuestionnaireInfo();
    }

    if (response.code === 400) {
        res.status(400).send(response.reason);
        return;
    }

    res.json(response);
}

async function getQuestionnaire(req, res) {
    const response = await qnr.getQuestionnaire(req.params.id);

    if (response === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    if (response.code === 400) {
        res.status(400).send(response.reason);
        return;
    }

    res.json(response);
}

async function deleteQuestionnaire(req, res) {
    const response = await qnr.deleteQuestionnaire(req.params.id);

    if (response.code === 400 || response.code === 404) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response); // return updated list of questionnaires
}

async function addQuestionnaire(req, res) {
    let response;
    if (req.body.token != null) {
        const tokenAuth = await auth.verifyToken(req.body.token);
        if (!tokenAuth.valid) {
            res.status(tokenAuth.code).send(tokenAuth.reason);
            return;
        }
        response = await qnr.addQuestionnaire(req.body.name, req.body.questions, req.body.id, tokenAuth.id);
    } else {
        response = await qnr.addQuestionnaire(req.body.name, req.body.questions, req.body.id);
    }

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response.id);
}

async function updateQuestionnaire(req, res) {
    const response = await qnr.updateQuestionnaire(req.body.name, req.body.questions, req.params.id);

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

app.post('/responses/:id', express.json(), addResponse);

app.get('/responses/:id', getResponses);

app.post('/questions/:id', express.json(), addQuestion);

app.put('/questionnaires/:id', express.json(), updateQuestionnaire);

app.post('/questionnaires', express.json(), addQuestionnaire);

app.delete('/questionnaires/:id', deleteQuestionnaire);

app.get('/questionnaires/:id', getQuestionnaire);

app.get('/questionnaireInfo', getQuestionnaireInfo);

app.get('/questionnaireInfo/:token', getQuestionnaireInfo);

app.get('/questionnaires', getQuestionnaires);

app.listen(8080);