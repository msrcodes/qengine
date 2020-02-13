'use strict';

const express = require('express');
const app = express();

app.use(express.static('client', {extensions: ['html']}));

function getQuestions(req, res) {
    const questions = ["Is this a test question?", "Is Shrek green?", "Who is Joe?"]; // TODO: Move this to question.js
    res.json(questions);
}

app.get('/questions', (req, res) => getQuestions(req, res));

app.listen(8080);