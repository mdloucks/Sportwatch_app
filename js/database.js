
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
            console.log(this.db);
        } catch(err) {
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



    /**
     * will return the next meet in order of time.
     * 
     * this will be used to determine what meet the events will be generated for
     * 
     * on reject, this will return false if there are no meets
     */
    getNextMeet: function () {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT *, rowid FROM meet", [], function (tx, rs) {

                    if (rs.rows.length === 0) {
                        console.log("There are no meets to select from");
                        reject(false);
                    }

                    let closest = new Date(3000, 1, 1);
                    let closest_i = undefined;

                    // loop through all of the times stored in the database and determine which one is the least
                    for (let i = 0; i < rs.rows.length; i++) {
                        let time = new Date(rs.rows.item(i).meet_time);
                        // check if the time of the last iteration is less than the lowest time
                        if ((time.getTime() < closest.getTime()) && (time.getTime() > Date.now())) {
                            closest = time;
                            // index of the lowest time
                            closest_i = i;
                        }
                    }

                    // TOOD add error handler, there is a meet that is schedualed too far in the future
                    if (closest_i === undefined) {
                        console.log("Could not get first meet, unknown reasons");
                        reject();
                    }

                    resolve(rs.rows.item(closest_i));
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            });
        });
    },

    /**
     * delete a meet given it's name and (address or time)
     * 
     * 
     */
    deleteMeet: function (meet) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx, rs) {
                tx.executeSql("DELETE FROM meet WHERE meet_name = ? AND (meet_time = ? OR meet_address = ?)", meet);
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    getMeet: function (id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT *, rowid FROM meet", [], function (tx, rs) {
                    if (id === "*") {
                        resolve(rs.rows);
                    }

                    for (let i = 0; i < rs.rows.length; i++) {
                        if (rs.rows.item(i).rowid === id) {
                            resolve(rs.rows.item(i));
                        }
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + JSON.stringify(error));
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * return the number of meets
     */
    getNumberOfMeets: function () {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT rowid FROM meet", [], function (tx, rs) {
                    resolve(rs.rows.length);
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * [meet id, event name, gender]
     * 
     * @param {*} event 
     */
    addEvent: function (event) {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO event VALUES (?, ?, ?)", event);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
        });
    },

    deleteEvent: function (event) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {

                if (event.length === 1) {
                    tx.executeSql("DELETE FROM event WHERE rowid = ?", event, function (tx, rs) {
                    });
                } else if (event.length === 3) {
                    tx.executeSql("DELETE FROM event WHERE id_meet = ? AND event_name = ? AND gender = ?", event, function (tx, rs) {
                    });
                }
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
                resolve();
            });
        });
    },

    getEvent: function (id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT *, rowid FROM event", id, function (tx, rs) {
                    if (id === "*") {
                        resolve(rs.rows);
                    }

                    for (let i = 0; i < rs.rows.length; i++) {
                        if (rs.rows.item(i).rowid === id) {
                            resolve(rs.rows.item(i));
                        }
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error.message);
            });
        });
    },

    /**
     * [name, time, address]
     * 
     * @param {*} meet 
     */
    addMeet: function (meet) {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO meet VALUES (?, ?, ?)", meet);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log("successfully added meet!");
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
     * [fname, lname, grade, gender]
     * 
     * @param {*} athlete 
     */
    addAthlete: function (athlete) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", athlete);
                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * deletes an athlete with the given info
     * 
     * @param {Array} athlete 
     */
    deleteAthlete: function (athlete) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("DELETE FROM athlete WHERE fname = ? AND lname = ? AND grade = ? AND gender = ?", athlete);
                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * 
     * return all of the athletes in a given event and what relay they are in
     * TODO rework this or delete it
     * @param {Number} event_id
     */
    getAthletesInEvent: function (id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                let command = `
                SELECT fname, lname, gender, grade, relay_team 
                FROM athlete INNER JOIN athlete_event 
                ON athlete.rowid = athlete_event.id_athlete
                WHERE athlete_event.id_event = ?`;
                tx.executeSql(command, [id], function (tx, rs) {

                    if (rs.rows.length === 0) {
                        // TODO catch all fix this
                        console.log("empty set");
                        resolve(false);
                    }

                    resolve(rs.rows);
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * will delete a set record in the athlete_event table 
     * 
     * @param {Number} id_athlete id of the athlete
     * @param {Number} id_event id of the event
     */
    deleteAthleteInEvent: function (id_athlete, id_event) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("DELETE FROM athlete_event WHERE id_athlete = ? AND id_event = ?", [id_athlete, id_event]);
                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * 
     * insert the given array into the athlete_event table
     * 
     * @param {Array} data id_athlete, id_event, isRelay
     */
    addAthleteEvent: function (data) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("INSERT INTO athlete_event VALUES (?, ?, ?)", data);
                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * 
     * Will return all athletes that are currently listed in an event
     * 
     * the athlete only has an event if their id is found within the athlete_event table
     * 
     * will return an array of arrays filled with athlete information and the id of their event
     * 
     * @param {Number} event_id
     */
    getAthletesInEvents: function () {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                let command = `
                SELECT athlete.fname, athlete.lname, athlete.grade, athlete.gender, athlete.rowid, athlete_event.id_event 
                FROM athlete INNER JOIN athlete_event 
                ON athlete.rowid = athlete_event.id_athlete`;
                tx.executeSql(command, [], function (tx, rs) {

                    if (rs.rows.length === 0) {
                        console.log("no athletes in that event");
                        // TODO catch this everywhere
                        resolve(false);
                    } else {
                        resolve(rs.rows);
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            });
        });
    },


    /**
     * this function will delete all athlete entries from the the athlete_event table where the event matches
     * 
     * @param {Number} id id of the event
     */
    deleteAthletesInEvent: function (id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                let command = `
                SELECT athlete.fname, athlete.lname, athlete.grade, athlete.gender, athlete.rowid, athlete_event.id_event 
                FROM athlete INNER JOIN athlete_event 
                ON athlete.rowid = athlete_event.id_athlete
                WHERE athlete.gender = ?`;
                tx.executeSql(command, [gender], function (tx, rs) {

                    if (rs.rows.length === 0) {
                        console.log("empty set");
                        resolve(false);
                    } else {
                        resolve(rs.rows);
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            });
        });
    },

    /**
     * return a list of athletes and events sorted by gender
     * 
     * this function works, but I hope to god no one
     * will have to touch this abomination again for a very very long time
     * 
     * @returns array of athletes, array of athlete_event
     * 
     * @param {Char} gender m or f
     */
    getAthletesAndEventsByGender: function (gender) {
        // list of promises to query the stuff individually because this db plugin sucks
        return new Promise((resolve, reject) => {
            Promise.all(
                [new Promise((resolve, reject) => {
                    this.db.transaction(function (tx) {
                        let command = `
                        SELECT *, rowid
                        FROM athlete
                        WHERE gender = ?`;
                        tx.executeSql(command, [gender], function (tx, rs) {

                            if (rs.rows.length === 0) {
                                console.log("empty set");
                                resolve(false);
                            } else {
                                resolve(rs.rows);
                            }
                        });
                    }, function (error) {
                        console.log('Transaction ERROR: ' + error.message);
                        reject(error);
                    });
                }),

                new Promise((resolve, reject) => {
                    this.db.transaction(function (tx) {
                        let command = `SELECT * FROM athlete_event`;
                        tx.executeSql(command, [], function (tx, rs) {
                            if (rs.rows.length === 0) {
                                console.log("empty set");
                                resolve(false);
                            } else {
                                resolve(rs.rows);
                            }
                        });
                    }, function (error) {
                        console.log('Transaction ERROR: ' + error.message);
                        reject(error);
                    });
                })]
            ).then((values) => {
                resolve(values);
            });
        });
    },


    /**
     * return all of the data of an athlete given an id
     * pass in * to retrieve all athlete
     * 
     * loop through rows with rows.length and access with rows.item(i)
     * 
     * @param {*} id 
     */
    getAthlete: function (id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx, rs) {
                tx.executeSql("SELECT *, rowid FROM athlete", id, function (tx, rs) {
                    // return all of the rows on *
                    if (id === "*") {
                        resolve(rs.rows);
                    }

                    for (let i = 0; i < rs.rows.length; i++) {
                        if (rs.rows.item(i).rowid === id) {
                            resolve(rs.rows.item(i));
                        }
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * return all of the data of an athlete given an gender
     * pass in * to retrieve all athlete
     * 
     * loop through rows with rows.length and access with rows.item(i)
     * 
     * @param {*} gender m or f
     */
    getAthleteByGender: function (gender) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx, rs) {
                tx.executeSql("SELECT *, rowid FROM athlete WHERE gender = ?", [gender], function (tx, rs) {
                    // return all of the rows on *
                    if (rs.rows.length === 0) {
                        console.log("empty set!");
                    } else {
                        resolve(rs.rows);
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
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

    close: function () {
        this.db.close(function () {
            console.log("Database is closed: OK");
        });
    }
};