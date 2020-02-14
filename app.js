'use strict';

const express = require('express');
const uuid = require('uuid-random');

const app = express();

app.use(express.static('client', {extensions: ['html']}));

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
}; // TODO: Move this to question.js

function getQuestions(questionnaireID, req, res) {
    res.json(questionnaires[questionnaireID].questions);
}

function getQuestionnaires(req, res) {
    res.json(questionnaires);
}

app.get('/questions/:id', (req, res) => {
    const questionnaire = questionnaires[req.params.id];

    if (questionnaire === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    res.json(getQuestions("example-questionnaire", req, res));
});

app.get('/questionnaires/:id', (req, res) => {
    const questionnaire = questionnaires[req.params.id];

    if (questionnaire === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    res.json(questionnaire);
});

app.get('/questionnaires', (req, res) => getQuestionnaires(req, res));

app.post('/questions', express.json(), (req, res) => {
    const questionnaire = questionnaires[req.body.questionnaire];

    if (questionnaire === undefined) {
        res.status(404).send('No match for that ID.');
        return;
    }

    const question = {
        id: uuid(),
        text: req.body.text,
        type: req.body.type,
        options: req.body.options,
    };
    questionnaire.questions = [question, ...questionnaire.questions];
    res.json(questionnaire.questions);
});

app.listen(8080);