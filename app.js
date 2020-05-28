'use strict';

const express = require('express');
const auth = require("./server/auth");
const qnr = require("./server/questionnaires");
const resp = require("./server/responses");

const app = express();

app.use(express.static('client', {extensions: ['html', 'js']}));

async function addResponse(req, res) {
    const response = await resp.addResponse(req.params.id, req.body);

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response);
}

async function getResponses(req, res) {
    const responses = await resp.getResponses(req.params.id);

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
    const token = req.params.token;
    let response;
    if (token != null) {
        const tokenAuth = await auth.verifyToken(token);
        if (!tokenAuth.valid) {
            res.status(tokenAuth.code).send(tokenAuth.reason);
            return;
        }
        response = await qnr.deleteQuestionnaire(req.params.id, tokenAuth.id);
    } else {
        response = await qnr.deleteQuestionnaire(req.params.id);
    }

    if (!response.valid) {
        res.status(response.code).send(response.reason);
    } else {
        res.status(200).send("OK");
    }
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
    const token = req.params.token;
    let response;
    if (token != null) {
        const tokenAuth = await auth.verifyToken(token);
        if (!tokenAuth.valid) {
            res.status(tokenAuth.code).send(tokenAuth.reason);
            return;
        }

        response = await qnr.updateQuestionnaire(req.body.name, req.body.questions, req.params.id, tokenAuth.id);
    } else {
        response = await qnr.updateQuestionnaire(req.body.name, req.body.questions, req.params.id);
    }

    if (!response.valid) {
        res.status(response.code).send(response.reason);
        return;
    }

    res.json(response.code);
}

app.post('/responses/:id', express.json(), addResponse);

app.get('/responses/:id', getResponses);

app.put('/questionnaires/:id', express.json(), updateQuestionnaire);

app.put('/questionnaires/:id/:token', express.json(), updateQuestionnaire);

app.post('/questionnaires', express.json(), addQuestionnaire);

app.delete('/questionnaires/:id', deleteQuestionnaire);

app.delete('/questionnaires/:id/:token', deleteQuestionnaire);

app.get('/questionnaires/:id', getQuestionnaire);

app.get('/questionnaireInfo', getQuestionnaireInfo);

app.get('/questionnaireInfo/:token', getQuestionnaireInfo);

app.get('/questionnaires', getQuestionnaires);

app.listen(8080);