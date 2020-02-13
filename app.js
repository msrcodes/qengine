'use strict';

const express = require('express');
const app = express();

app.use(express.static('client', {extensions: ['html']}));

let questionnaires = [
    {
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
]; // TODO: Move this to question.js

function getQuestions(req, res) {
    res.json(questionnaires[0].questions);
}

app.get('/questions', (req, res) => getQuestions(req, res));

app.post('/questions', express.json(), (req, res) => {
    const question = {
        id: req.body.id,
        text: req.body.text,
        type: req.body.type,
        options: req.body.options,
    };
    questionnaires[0].questions = [question, ...questionnaires[0].questions];
    res.json(questionnaires[0].questions);
});

app.listen(8080);