'use strict';

const sqlite = require('sqlite');

async function init() {
    const db = await sqlite.open('./database.sqlite', {verbose: true});
    await db.migrate({migrationsPath: './server/db-migrations'});
    return db;
}

const dbConn = init();

module.exports = {
    dbConn
};