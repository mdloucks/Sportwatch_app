
/**
 * @classdesc an interface for a database connection
 * @class
 */
class DatabaseConnection {

    constructor() {
        try {
            this.db = window.sqlitePlugin.openDatabase({ name: 'Sportwatch.db', location: 'default' });
        } catch (err) {
            console.log("Sportwatch database failed to open.");
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
            tx.executeSql("DROP TABLE IF EXISTS relay_result");
            tx.executeSql("DROP TABLE IF EXISTS relay_team");

            // tx.executeSql(`CREATE TABLE IF NOT EXISTS account (id_user, fname, lname, account_type, id_school, cellNum)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS meet (meet_name, meet_time, meet_address)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete (fname, lname, grade, gender)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS event (event_name, gender, unit, is_relay, timestamp)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS event_result (id_event, id_athlete, value)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS relay_team (team_name)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS relay_result (id_event, id_relay_team, id_athlete, value)`);

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
    selectValues(query, values) {
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
    selectValuesAsObject(query, values) {
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
     * @param {Object} options an object of key/pairs for the corresponsing values ex. WHERE {"fname": "John"}
     */
    updateValues(table, rowNames, newValues, options) {

        return new Promise((resolve, reject) => {

            if (rowNames.length != newValues.length) {
                throw new Error(`Out of bounds exception! rowNames: ${rowNames.length} newValues: ${newValues.length}`)
            }

            this.db.transaction(function (tx) {

                let setString = "";

                for (let i = 0; i < rowNames.length; i++) {
                    setString += ` = ${rowNames[i]} = ${newValues[i]},`;
                }



                let query = `UPDATE ${table} SET ${setString} `;

                tx.executeSql(query, values, function (tx, rs) {
                    if (rs.rows.length === 0) {
                        console.log("empty set");
                        resolve(false);
                    }

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
     * @description insert some data into the given table
     * 
     * Array formats
     * [item, item...] or [[item, item...], [item, item...]]
     * 
     * @param {String} table name of the table
     * @param {Array} data data to be inserted
     */
    insertValues(table, data) {
        return new Promise((resolve, reject) => {

            let query_wildcards = "(";
            let length;

            if (data[0][0] !== undefined) {
                length = data[0].length;
            } else {
                length = data.length;
            }

            console.log(length);

            for (let i = 0; i < length; i++) {
                query_wildcards += "?,";
            }
            query_wildcards = query_wildcards.slice(0, -1);
            query_wildcards += ")";

            this.db.transaction(function (tx) {

                if (data[0][0] !== undefined) {
                    for (let i = 0; i < data.length; i++) {
                        console.log(JSON.stringify(data[i]));

                        tx.executeSql(`INSERT INTO ${table} VALUES ${query_wildcards}`, data[i]);
                    }
                } else {
                    console.log("normal");
                    tx.executeSql(`INSERT INTO ${table} VALUES ${query_wildcards}`, data);
                }

                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                console.log(JSON.stringify(error));
                reject(error);
            }, function () {
            });
        });
    }

    insertDummyValues() {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["John", "Smith", "10", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Bill", "Washington", "12", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["George", "Harris", "9", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Tyrone", "Shreider", "9", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Levi", "Hemmingway", "10", "m"]);

            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Suzie", "Walton", "11", "f"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Grace", "Dalton", "9", "f"]);

            tx.executeSql("INSERT INTO event VALUES (?, ?, ?, ?, ?)", ["400m", "m", "s", "false", 0]);
            tx.executeSql("INSERT INTO event VALUES (?, ?, ?, ?, ?)", ["800m", "f", "s", "false", 0]);
            tx.executeSql("INSERT INTO event VALUES (?, ?, ?, ?, ?)", ["400x400m Relay", "m", "s", "true", 0]);

            // 400m
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 1, 56.2]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 1, 59.2]);

            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 2, 57.6]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 2, 58.6]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 2, 52.6]);

            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 3, 59.6]);

            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 6, 49.6]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 6, 59.3]);

            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 7, 120.6]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [1, 7, 103.6]);

            // 800m
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [2, 3, 112.3]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [2, 4, 157.6]);
            tx.executeSql("INSERT INTO event_result VALUES (?, ?, ?)", [2, 5, 197.6]);

            // 400x400m Relay
            tx.executeSql("INSERT INTO relay_team VALUES (?)", ["Hemlock"]);

            tx.executeSql("INSERT INTO relay_result VALUES (?, ?, ?, ?)", [3, 0, 0, 67.4]);
            tx.executeSql("INSERT INTO relay_result VALUES (?, ?, ?, ?)", [3, 0, 1, 66.4]);
            tx.executeSql("INSERT INTO relay_result VALUES (?, ?, ?, ?)", [3, 0, 2, 69.4]);
            tx.executeSql("INSERT INTO relay_result VALUES (?, ?, ?, ?)", [3, 0, 3, 64.4]);

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