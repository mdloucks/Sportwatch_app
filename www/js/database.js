let json = {
    "record_definition": [
        ["second", "75m"],
        ["second", "100m"],
        ["second", "200m"],
        ["second", "400m"],
        ["second", "800m"],
        ["second", "1500m"],
        ["second", "100m hurdle"],
        ["second", "110m hurdle"],
        ["second", "400m hurdle"],
        ["second", "4x100m relay"],
        ["second", "4x400m relay"],
        ["meter", "long jump"],
        ["meter", "triple jump"],
        ["meter", "high jump"],
        ["meter", "pole vault"],
        ["meter", "discus"],
        ["meter", "javelin"],
        ["meter", " hammer"],
        ["meter", "shot put"],
        ["second", "other"],
        ["minute", "other"]
    ],
    "athlete": [
        ["John", "Smith", "10", "m"],
        ["Bill", "Washington", "12", "m"],
        ["George", "Harris", "9", "m"],
        ["Tyrone", "Shreider", "9", "m"],
        ["Levi", "Hemmingway", "10", "m"],

        ["Suzie", "Walton", "11", "f"],
        ["Grace", "Dalton", "9", "f"]
    ],
    "event": [
        ["400m", "m", "s", "false", 0],
        ["800m", "f", "s", "false", 0],
        ["400x400m Relay", "m", "s", "true", 0]
    ],
    "event_result": [
        [1, 1, 56.1, Date.now()],
        [1, 1, 59.2, Date.now() + 10000000],
        [1, 1, 56.8, Date.now() + 20000000],
        [1, 1, 64.2, Date.now() + 90000000],
        [1, 1, 52.3, Date.now() + 600000000],
        [1, 1, 69.2, Date.now() + 900000000],
        [1, 2, 57.6, Date.now()],
        [1, 2, 58.6, Date.now()],
        [1, 2, 52.6, Date.now()],
        [1, 3, 59.6, Date.now()],
        [1, 6, 49.6, Date.now()],
        [1, 6, 59.3, Date.now()],
        [1, 7, 120.6, Date.now()],
        [1, 7, 103.6, Date.now()],
        [2, 3, 112.3, Date.now()],
        [2, 4, 157.6, Date.now()],
        [2, 5, 197.6, Date.now()]
        [2, 2, 59.2, Date.now() + 10000000],
        [2, 3, 56.8, Date.now() + 20000000],
        [2, 4, 84.2, Date.now() + 90000000],
        [2, 5, 32.3, Date.now() + 600000000],
        [2, 6, 49.2, Date.now() + 900000000],
        [1, 7, 49.2, Date.now() + 10000000],
        [1, 1, 86.8, Date.now() + 20000000],
        [1, 2, 94.2, Date.now() + 90000000],
        [1, 3, 42.3, Date.now() + 600000000],
        [1, 4, 79.2, Date.now() + 900000000],
    ],
    "relay_team": [
        ["Hemlock"]
    ],
    "record": [
        [1, 1, 12, false, null, null, Date.now()],
        [1, 1, 13, false, null, null, Date.now()],
        [1, 2, 13, false, null, null, Date.now()],
        [1, 2, 16, false, null, null, Date.now()],
        [1, 3, 14, false, null, null, Date.now()],
        
        [2, 1, 12, false, null, null, Date.now()],
        [2, 1, 13, false, null, null, Date.now()],
        [2, 2, 13, false, null, null, Date.now()],
        [2, 2, 16, false, null, null, Date.now()],
        [2, 3, 14, false, null, null, Date.now()],
        
    ],
    "relay_result": [
        [3, 0, 0, 67.4],
        [3, 0, 1, 66.4],
        [3, 0, 2, 69.4],
        [3, 0, 3, 64.4]
    ]
}




/**
 * @classdesc an interface for a database connection
 * @class
 */
class DatabaseConnection {

    /**
     * Quick References
     * 
     * SELECT Count(*) FROM table -> returns the number of rows in a table
     */
    constructor() {
        try {
            this.db = window.sqlitePlugin.openDatabase({ name: 'Sportwatch.db', location: 'default' });
        } catch (err) {
            console.log("Sportwatch database failed to open.");
            // TODO: send this error to the server and try to handle it in some way
            throw err;
        }
    }

    /**
     * Probably not the most efficient, but it bascially returns a promise
     * to handle handle if tables are created or not. (Create them if not)
     */
    doTablesExist() {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                // Poll some tables to see if an error is thrown
                tx.executeSql("SELECT * FROM athlete");
                tx.executeSql("SELECT * FROM meet");
                tx.executeSql("SELECT * from team");
            }, function (error) {
                reject(error);
            }, function () {
                resolve();
            });
        });
    }

    /**
     * will wipe all existing tables and create new ones
     * 
     * CAUTION: this will delete all of the uers's saved stuff!
     */
    createNewTables() {
        this.db.transaction(function (tx) {

            tx.executeSql("DROP TABLE IF EXISTS athlete");
            tx.executeSql("DROP TABLE IF EXISTS event");
            tx.executeSql("DROP TABLE IF EXISTS event_result");
            tx.executeSql("DROP TABLE IF EXISTS relay_team");
            tx.executeSql("DROP TABLE IF EXISTS relay_result");
            tx.executeSql("DROP TABLE IF EXISTS record_definition");
            tx.executeSql("DROP TABLE IF EXISTS record");

            // tx.executeSql(`CREATE TABLE IF NOT EXISTS account (id_user, fname, lname, account_type, id_school, cellNum)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete (fname, lname, grade, gender)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS event (event_name, gender, unit, is_relay, timestamp)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS event_result (id_event, id_athlete, value, timestamp)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS relay_team (team_name)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS relay_result (id_event, id_relay_team, id_athlete, value)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS record_definition (unit, record_identity)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS record (id_athlete, id_record_definition, value, is_split, id_relay, id_relay_index, last_updated)`);

        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log('TABLES CREATED');
        });
    }


    /**
     * example ("SELECT * from athlete WHERE id = ?", 3)
     * 
     * @param {*} query the given query
     * @param {Array} values 
     */
    selectValues(query, values = []) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, rs) {
                    if (rs.rows.length === 0) {
                        console.log("empty set");
                        resolve(false);
                    }
                    resolve(rs.rows);
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                console.log(JSON.stringify(error));
                reject(error);
            }, function () {
                // success
            });
        });
    }

    /**
     * @description This function will return the given query in an object instead of the custom sqlite structure which
     * requires you to reference each item within with .item(i)
     * 
     * @example selectMultiple("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            console.log(JSON.stringify(athletes)); -> [{"fname":"John","lname":"Smith","grade":"10","gender":"m","rowid":1} ....]
        });
     * 
     * @param {String} query the query to be submitted to the database
     * @param {Array} values the list of values to give to the query
     */
    selectValuesAsObject(query, values = []) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, rs) {
                    let rows = [];

                    if (rs.rows.length === 0) {
                        console.log("empty set!");
                        reject(false);
                    }

                    if (Object.keys(rs.rows.item(0)).length > 1) {
                        for (let i = 0; i < rs.rows.length; i++) {
                            rows[i] = rs.rows.item(i);
                        }
                    } else {
                        for (let i = 0; i < rs.rows.length; i++) {
                            rows[i] = Object.keys(rs.rows.item(0))[0];
                        }
                    }

                    resolve(rows);
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                console.log(JSON.stringify(error));
                reject(error);
            }, function () {
                // success
            });
        });
    }

    /**
     * 
     * will update the values present in the given table with the given values
     * 
     * @param {String} table the name of the table
     * @param {Array} rowNames Array filled with the names of all of the rows
     * @param {Array} newValues Array filled with the new values of the rows, must be equal in length to rowNames
     * @param {String} options an object of key/pairs for the corresponsing values ex. WHERE {"fname": "John"}
     */
    updateValues(table, rowNames, newValues, options = "", option_values) {

        return new Promise((resolve, reject) => {

            if (rowNames.length != newValues.length) {
                throw new Error(`Out of bounds exception! rowNames: ${rowNames.length} newValues: ${newValues.length}`)
            }

            this.db.transaction(function (tx) {

                let setString = "";

                for (let i = 0; i < rowNames.length; i++) {
                    setString += `${rowNames[i]} = ${newValues[i]},`;
                }

                setString = setString.slice(0, -1);

                let query = `UPDATE ${table} SET ${setString} ${options}`;

                tx.executeSql(query, option_values, function (tx, rs) {
                    resolve(true);
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                console.log(JSON.stringify(error));
                reject(error);
            }, function () {
                // success
            });
        });
    }

    /**
     * Delete the given values from a given table
     * 
     * @param {String} table the table to delete from
     * @param {String} whereString WHERE field = ?
     * @param {Array} values array of values corresponding to wherestring
     */
    deleteValues(table, whereString, values) {
        this.db.transaction(function (tx) {

            let query = `DELETE FROM ${table} ${whereString}`;

            console.log(query);

            tx.executeSql(query, values, function (tx, rs) {
            });
        });
    }

    /**
     * @description insert some data into the given table
     * must be an array that follows order of parameters
     * 
     * Array formats
     * [item, item...]
     * 
     * @example insertValues("athlete", ["Don", "Ron", 10, "M"])
     *           --> Inserts athlete with name "Don" "Ron", in 10th grade, a male
     * 
     * @param {String} table name of the table
     * @param {Array} data data to be inserted
     */
    insertValues(table, data) {
        return new Promise((resolve, reject) => {

            let queryWildcards = "(" + "?, ".repeat(data.length).slice(0, -2) + ")";

            console.log(`INSERT INTO ${table} VALUES ${queryWildcards} ${JSON.stringify(data)}`);

            this.db.transaction(function (tx) {

                tx.executeSql(`INSERT INTO ${table} VALUES ${queryWildcards}`, data);

                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                console.log(JSON.stringify(error));
                reject(error);
            }, function () {
            });
        });
    }

    /**
     * read from a json file and populate the database with the entries within
     */
    insertDatabasePresetValues() {
        
        this.db.transaction(function (tx) {
            
            // $.getJSON("json/database-presets.json", function(json) {
            // });
                
            if(Object.keys(json).length == 0) {
                console.log("TABLE JSON IS MISSING");
            } else {
                console.log("inserting JSON values");
            }

            Object.keys(json).forEach(element => {

                for (let i = 0; i < json[element].length; i++) {

                    let row_length = json[element][0].length;
                    
                    tx.executeSql(`INSERT INTO ${element} VALUES (${"?, ".repeat(row_length).slice(0, -2)})`, json[element][i]);
                }
            });
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log("Dummy values inserted");
        });
    }

    /**
     * 
     * This function is used to quickly execute small pieces of sql commands for testing purposes
     * 
     * @param {String} command 
     */
    executeCommand(command) {
        this.db.transaction(function (tx, rs) {
            tx.executeSql(command, [], function (tx, rs) {
                console.log(JSON.stringify(rs));
                for (let i = 0; i < rs.rows.length; i++) {
                    console.log(JSON.stringify(rs.rows.item(i)));
                }

                console.log("---------------------------------");
            });
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
        });
    }

    /**
     * Closes the database
     * 
     * TODO: make sure to call this sometime
     */
    close() {
        this.db.close(function () {
            console.log("Database is closed: OK");
        });
    }
};