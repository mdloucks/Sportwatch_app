
/**
 * This will function almost identically to our server database connection class
 * 
 * That will be to provide a general set of methods to interface with the database
 * 
 */
let sw_db = {

    db: null,

    init: function () {
        console.log("Initializing database...");
        try {
            this.db = window.sqlitePlugin.openDatabase({ name: 'Sportwatch.db', location: 'default' });
            console.log("Opened database:");
        } catch (err) {
            console.log("OPENEING FAILED " + err);
        }
    },

    testFunc: function () {
        this.selectMultiple("SELECT * FROM athlete WHERE fname = ?", ["Seth"]).then((result) => {
            console.log(result[0].grade);
        });
        this.selectSingle("SELECT fname FROM athlete WHERE lname = ?", ["Byrne"]).then((result) => {
            console.log(result.item(0).fname);
        });
    },

    /**
     * Probably not the most efficient, but it bascially returns a promise
     * to handle handle if tables are created or not. (Create them if not)
     */
    doTablesExist: function () {
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
    },

    /**
     * will wipe all existing tables and create new ones
     * 
     * CAUTION: this will delete all of the uers's saved stuff!
     */
    createNewTables: function () {
        this.db.transaction(function (tx) {

            tx.executeSql("DROP TABLE IF EXISTS account");
            tx.executeSql("DROP TABLE IF EXISTS athlete");
            tx.executeSql("DROP TABLE IF EXISTS event");
            tx.executeSql("DROP TABLE IF EXISTS meet");
            tx.executeSql("DROP TABLE IF EXISTS event_result");
            tx.executeSql("DROP TABLE IF EXISTS athlete_event");
            tx.executeSql("DROP TABLE IF EXISTS team");

            tx.executeSql(`CREATE TABLE IF NOT EXISTS account (id_user, fname, lname, account_type, id_school, cellNum)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS meet (meet_name, meet_time, meet_address)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete (fname, lname, grade, gender)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete_event (id_athlete, id_event, relay_team)`);
            // TODO rework relay team system
            tx.executeSql(`CREATE TABLE IF NOT EXISTS event (id_meet, event_name, gender, is_relay_team)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS event_result (id_event, athlete_name, result)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS team (id_team, id_user, user_role)`);

        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log('TABLES CREATED');
        });
    },


    /**
     * 
     * example ("SELECT * from athlete WHERE id = ?", 3)
     * 
     * @param {*} row the given id
     * @param {Array} table 
     */
    selectSingle: function (query, values) {
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
    },

    selectMultiple: function (query, values) {
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
    },

    /**
     * 
     * 
     * Array formats
     * [item, item...] or [[item, item...], [item, item...]]
     * 
     * @param {String} table name of the table
     * @param {Array} data data to be inserted
     */
    insertValues: function (table, data) {
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
    },

    insertDummyValues: function () {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["John", "Smith", "10", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Bill", "Washington", "9", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Suzie", "Walton", "11", "m"]);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log("Dummy values inserted");
        });
    },

    /**
     * 
     * This function is used to quickly execute small pieces of sql commands for testing purposes
     * 
     * @param {String} command 
     */
    executeCommand: function (command) {
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
    },

    /**
     * Closes the database
     * 
     * TODO: make sure to call this sometime
     */
    close: function () {
        this.db.close(function () {
            console.log("Database is closed: OK");
        });
    }
};