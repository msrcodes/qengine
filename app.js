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
    "second-questionnaire": { // Questionnaires will be found via a UUID; this is just an example
        "name": "A second Questionnaire",
        "questions": [
            {
                "id": "name",
                "text": "What is not your name?",
                "type": "text"
            },
            {
                "id": "quest",
                "text": "What is not your quest?",
                "type": "text"
            },
            {
                "id": "col",
                "text": "What is not your favourite colour?",
                "type": "text"
            },
            {
                "id": "velo",
                "text": "What is not the air-speed velocity of an unladen swallow?",
                "type": "number"
            },
            {
                "id": "lord",
                "text": "Which is not the best lord?",
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
                "text": "Which computer languages have not you used?",
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

function getQuestionnaires(req, res) {
    res.json(questionnaires);
}

app.delete('/questionnaires/:id', (req, res) => {
    // Check to see if a questionnaire exists with the given ID
    const questionnaire = questionnaires[req.params.id];

    // If an ID does not exist, 404
    if (questionnaire === undefined) {
        res.status(404).send('No match for that ID.');
        return; // Short
    }

    delete questionnaires[req.params.id];

    res.json(questionnaires); // return the updated list of questionnaires
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

app.listen(8080);