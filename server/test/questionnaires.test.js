'use strict';

const fetch = require("node-fetch");

const testJson = require("../test-questionnaires");
const responseByID = require("./data/questionnaires.test-getQnrByID");

test('Get all questionnaires', async () => {
    const res = await fetch("http://localhost:8080/questionnaires", {method: "GET"});
    if (res.ok) {
        const json = await res.json();
        expect(json).toStrictEqual(testJson);
    } else {
        expect(res.ok).toBe(true);
    }
});

test('Get questionnaire by ID', async () => {
   const res = await fetch("http://localhost:8080/questionnaires/example-questionnaire", {method: "GET"});
   if (res.ok) {
       const json = await res.json();
       expect(json).toStrictEqual(responseByID);
   } else {
       expect(res.ok).toBe(true);
   }
});

test('Get questionnaire with bad ID', async () => {
    const res = await fetch("http://localhost:8080/questionnaires/thisIDDoesNotExist", {method: "GET"});
    expect(res.status).toBe(404);
});

test('Delete questionnaire', async () => {
   const res = await fetch("http://localhost:8080/questionnaires/example-questionnaire", {method: "DELETE"});
   expect(res.status).toBe(200);

   const res2 = await fetch("http://localhost:8080/questionnaires/example-questionnaire", {method: "GET"});
   expect(res2.status).toBe(404);
});

test('Delete questionnaire that has already been deleted', async () => {
    const res = await fetch("http://localhost:8080/questionnaires/example-questionnaire", {method: "DELETE"});
    expect(res.status).toBe(404);
});

test('Delete questionnaire that does not exist', async () => {
    const res = await fetch("http://localhost:8080/questionnaires/thisIDDoesNotExist", {method: "DELETE"});
    expect(res.status).toBe(404);
});

// Helper function for testing addQuestion functionality
async function addQuestion(type, options) {
    const text = (Math.random() * 10000).toString(32);

    const res = await fetch("http://localhost:8080/questions/second-questionnaire", {
        method: "POST",
        body: JSON.stringify({
            text: text,
            type: type,
            options: options
        }),
        headers: {'Content-Type': 'application/json'}
    });

    if (res.ok) {
        const json = await res.json();

        const questions = json.questions;
        const question = questions[questions.length - 1];

        expect(question.text).toBe(text);
        expect(question.type).toBe(type);
    } else {
        expect(res.ok).toBe(true);
    }
}

test('Add text question to questionnaire', async () => {
    await addQuestion("text");
});

test('Add number question to questionnaire', async () => {
    await addQuestion("number");
});

test('Add single-select question to questionnaire', async () => {
    await addQuestion("single-select", ["a", "b", "c", "d"]);
});

test('Add multi-select question to questionnaire', async () => {
    await addQuestion("multi-select", ["a", "b", "c", "d"]);
});

test('Add question to questionnaire that does not exist', async () => {
    const res = await fetch("http://localhost:8080/questions/thisIDDoesNotExist", {
        method: "POST",
        body: JSON.stringify({
            text: "foo",
            type: "text",
            options: undefined
        }),
        headers: {'Content-Type': 'application/json'}
    });

    expect(res.status).toBe(404);
});

test('Add question with bad type', async () => {
    const res = await fetch("http://localhost:8080/questions/second-questionnaire", {
        method: "POST",
        body: JSON.stringify({
            text: "foo",
            type: "thisTypeDoesNotExist",
            options: undefined
        }),
        headers: {'Content-Type': 'application/json'}
    });

    expect(res.status).toBe(400);
});

test('Add question with bad options 1', async () => {
    const res = await fetch("http://localhost:8080/questions/second-questionnaire", {
        method: "POST",
        body: JSON.stringify({
            text: "foo",
            type: "single-select",
            options: undefined
        }),
        headers: {'Content-Type': 'application/json'}
    });

    expect(res.status).toBe(400);
});

test('Add question with bad options 2', async () => {
    const res = await fetch("http://localhost:8080/questions/second-questionnaire", {
        method: "POST",
        body: JSON.stringify({
            text: "foo",
            type: "single-select",
            options: []
        }),
        headers: {'Content-Type': 'application/json'}
    });

    expect(res.status).toBe(400);
});

test('Add questionnaire via route', async () => {
    const res = await fetch("http://localhost:8080/questionnaires", {
        method: "POST",
        body: JSON.stringify({
            name: "Test Questionnaire",
            questions: [
                {
                    "id": "boop",
                    "text": "ding dong test",
                    "type": "text"
                },
                {
                    "id": "beep",
                    "text": "dong ding aling",
                    "type": "number"
                }
            ],
            id: "test-questionnaire"
        }),
        headers: {'Content-Type': 'application/json'}
    });

    if (res.ok) {
        const id = await res.json();
        expect(id).toStrictEqual("test-questionnaire");

        const res2 = await fetch("http://localhost:8080/questionnaires/test-questionnaire", {method: "GET"});
        if (res2.ok) {
            const json = await res2.json();
            expect(json).toStrictEqual({
                name: "Test Questionnaire",
                questions: [
                    {
                        "id": "boop",
                        "text": "ding dong test",
                        "type": "text"
                    },
                    {
                        "id": "beep",
                        "text": "dong ding aling",
                        "type": "number"
                    }
                ]
            });
        } else {
            expect(res.ok).toBe(true);
        }
    } else {
        expect(res.ok).toBe(true);
    }
});

test('Add questionnaire via route with no ID', async () => {
    const res = await fetch("http://localhost:8080/questionnaires", {
        method: "POST",
        body: JSON.stringify({
            name: "Test Questionnaire",
            questions: [
                {
                    "id": "boop",
                    "text": "ding dong test",
                    "type": "text"
                },
                {
                    "id": "beep",
                    "text": "dong ding aling",
                    "type": "number"
                }
            ]
        }),
        headers: {'Content-Type': 'application/json'}
    });

    if (res.ok) {
        const id = await res.json();

        const res2 = await fetch(`http://localhost:8080/questionnaires/${id}`, {method: "GET"});
        if (res2.ok) {
            const json = await res2.json();
            expect(json).toStrictEqual({
                name: "Test Questionnaire",
                questions: [
                    {
                        "id": "boop",
                        "text": "ding dong test",
                        "type": "text"
                    },
                    {
                        "id": "beep",
                        "text": "dong ding aling",
                        "type": "number"
                    }
                ]
            });
        } else {
            expect(res.ok).toBe(true);
        }
    } else {
        expect(res.ok).toBe(true);
    }
});

test('Add questionnaire via route with no questions', async () => {
    const res = await fetch("http://localhost:8080/questionnaires", {
        method: "POST",
        body: JSON.stringify({
            name: "Test Questionnaire"
        }),
        headers: {'Content-Type': 'application/json'}
    });

    if (res.ok) {
        const id = await res.json();

        const res2 = await fetch(`http://localhost:8080/questionnaires/${id}`, {method: "GET"});
        if (res2.ok) {
            const json = await res2.json();
            expect(json).toStrictEqual({
                name: "Test Questionnaire",
                questions: []
            });
        } else {
            expect(res.ok).toBe(true);
        }
    } else {
        expect(res.ok).toBe(true);
    }
});

test('Add questionnaire via route with no name', async () => {
    const res = await fetch("http://localhost:8080/questionnaires", {
        method: "POST",
        body: JSON.stringify({
            questions: [
                {
                    "id": "boop",
                    "text": "ding dong test",
                    "type": "text"
                },
                {
                    "id": "beep",
                    "text": "dong ding aling",
                    "type": "number"
                }
            ]
        }),
        headers: {'Content-Type': 'application/json'}
    });

    expect(res.status).toBe(400);
});

test('Add questionnaire via route with bad question type', async () => {
    const res = await fetch("http://localhost:8080/questionnaires", {
        method: "POST",
        body: JSON.stringify({
            name: "Test Questionnaire",
            questions: [
                {
                    "id": "boop",
                    "text": "ding dong test",
                    "type": "thisTypeDoesNotExist"
                }
            ]
        }),
        headers: {'Content-Type': 'application/json'}
    });

    expect(res.status).toBe(400);
});