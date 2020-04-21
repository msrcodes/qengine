'use strict';

const fetch = require("node-fetch");

test('Get responses for a given questionnaire', async () => {
    const res = await fetch("http://localhost:8080/responses/second-questionnaire", {method: "GET"});
    if (res.ok) {
        const json = await res.json();
        expect(json).toStrictEqual([
            {
                "name": "NotJohn",
                "quest": "Not World Domination",
                "col": "#000000",
                "velo": 24,
                "lord": "Lorde",
                "langs": ["Java", "Python"]
            }
        ]);
    } else {
        expect(res.ok).toBe(true);
    }
});

test('Get responses for a questionnaire that does not exist', async () => {
    const res = await fetch("http://localhost:8080/responses/thisIDDoesNotExist", {method: "GET"});
    expect(res.status).toBe(404);
});

// helper function to test add response functionality
async function addResponse(payload) {
    return await fetch("http://localhost:8080/responses/second-questionnaire", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    });
}

test('Add valid response', async () => {
    const payload = {
        "name": "A Fantastic Name",
        "quest": "To Test!",
        "col": "#EE3155",
        "velo": 57,
        "lord": "Lord of the Dance",
        "langs": ["C", "LISP"]
    };

    const res = await addResponse(payload);

    if (res.ok) {
        const res2 = await fetch("http://localhost:8080/responses/second-questionnaire", {method: "GET"});
        if (res2.ok) {
            const json = await res2.json();
            expect(json[0]).toStrictEqual(payload);
        }
    } else {
        expect(res.ok).toBe(true);
    }
});

test('Add empty response', async () => {
    const payload = {

    };

    const res = await addResponse(payload);
    expect(res.status).toBe(400);
});

test('Add invalid response', async () => {
    const payload = {
        "thisQuestion": "doesNotExist"
    };

    const res = await addResponse(payload);
    expect(res.status).toBe(400);
});

test('Add valid response with extra invalid data', async () => {
    const payload = {
        "name": "A valid name",
        "quest": "A valid quest",
        "col": "A valid colour",
        "velo": 200,
        "lord": "Lord of the Dance",
        "langs": ["C", "LISP"],
        "thisQuestion": "doesNotExist"
    };

    const res = await addResponse(payload);
    expect(res.status).toBe(400);
});

test('Add invalid response to single-select question', async () => {
    const payload = {
        "name": "A valid name",
        "quest": "A valid quest",
        "col": "A valid colour",
        "velo": 200,
        "lord": "Invalid option",
        "langs": ["C", "LISP"]
    };

    const res = await addResponse(payload);
    expect(res.status).toBe(400);
});

test('Add multiple responses to single-select question', async () => {
    const payload = {
        "name": "A valid name",
        "quest": "A valid quest",
        "col": "A valid colour",
        "velo": 200,
        "lord": ["Lord of the Dance", "Lorde"],
        "langs": ["C", "LISP"]
    };

    const res = await addResponse(payload);
    expect(res.status).toBe(400);
});

test('Add invalid response to multi-select question', async () => {
    const payload = {
        "name": "A valid name",
        "quest": "A valid quest",
        "col": "A valid colour",
        "velo": 200,
        "lord": "Lord of the Dance",
        "langs": ["Invalid option"]
    };

    const res = await addResponse(payload);
    expect(res.status).toBe(400);
});