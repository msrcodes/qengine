'use strict';

const responses = require("./test-responses");

function getResponses(id) {
    return responses[id];
}

module.exports = {
    getResponses
};