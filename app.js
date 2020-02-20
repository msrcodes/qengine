'use strict';

const express = require('express');

const qnr = require("./server/questionnaires");

const app = express();

app.use(express.static('client', {extensions: ['html']}));

function getQuestionnaires(req, res) {
    res.json(qnr.getQuestionnaires());
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

function addQuestion(req, res) {
    const response = qnr.addQuestion(req.params.id, req.body.text, req.body.type, req.body.options);

    if (response === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    res.json(response); // return updated questionnaire
}

app.post('/questions/:id', express.json(), addQuestion);

app.delete('/questionnaires/:id', deleteQuestionnaire);

app.get('/questionnaires/:id', getQuestionnaire);

app.get('/questionnaires', getQuestionnaires);

app.listen(8080);