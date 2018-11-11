
/**
 * This will function almost identically to our server database connection class
 * 
 * That will be to provide a general set of methods to interface with the database
 * 
 * @param {String} DatabaseName
 */
let sw_db = {

    db : null,

    init: function() {
        this.db = window.sqlitePlugin.openDatabase({ name: "Sportwatch", location: 'default' });
    },

    /**
     * will wipe all existing tables and create new ones
     * 
     * CAUTION: this will delete all of the uers's saved stuff!
     */
    createNewTables : function () {
        this.db.transaction(function (tx) {

            tx.executeSql("DROP TABLE IF EXISTS athlete");
            tx.executeSql("DROP TABLE IF EXISTS event");
            tx.executeSql("DROP TABLE IF EXISTS meet");

            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete (fname, lname, grade, gender)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS event (id_meet, event_name, gender)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS event_result (id_event, athlete_name, result)`);
            tx.executeSql(`CREATE TABLE IF NOT EXISTS meet (meet_name, meet_time, meet_address)`);

        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log('TABLES CREATED');
        });
    },

    

    /**
     * will return the next meet in order of time.
     * 
     * this will be used to determine what meet the events will be generated for
     */
    getNextMeet : function() {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT *, rowid FROM meet", [], function(tx, rs) {
                    let closest = new Date(3000, 1, 1);
                    let closest_i = undefined;

                    // loop through all of the times stored in the database and determine which one is the least
                    for (let i = 0; i < rs.rows.length; i++) {
                        let time = new Date(rs.rows.item(i).meet_time);    

                        if((time.getTime() < closest.getTime()) && (time.getTime() > Date.now())) {
                            closest = time;
                            closest_i = i;
                        }
                    }

                    if(closest_i === undefined) {
                        console.log(closest_i);
                        reject();
                    }

                    resolve(rs.rows.item(closest_i));
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
            });
        });
    },

    /**
     * delete a meet given it's name and (address or time)
     * 
     * 
     */
    deleteMeet : function(meet) {
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

    getMeet : function(id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT *, rowid FROM meet", [], function(tx, rs) {

                    if(id === "*") {
                        resolve(rs.rows);
                    }

                    for (let i = 0; i < rs.rows.length; i++) {
                        if(rs.rows.item(i).rowid === id) {
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
     * return the number of meets
     */
    getNumberOfMeets : function() {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT rowid FROM meet", [], function(tx, rs) {
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
    addEvent : function(event) {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO event VALUES (?, ?, ?)", event);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
        });
    },

    deleteEvent : function(event) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {

                if(event.length === 1) {
                        tx.executeSql("DELETE FROM event WHERE rowid = ?",  event, function(tx, rs) {
                    });
                } else if(event.length === 3) {
                        tx.executeSql("DELETE FROM event WHERE id_meet = ? AND event_name = ? AND gender = ?",  event, function(tx, rs) {
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

    getEvent : function(id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("SELECT *, rowid FROM event", id, function(tx, rs) {
                    if(id === "*") {
                        resolve(rs.rows);
                    }

                    for (let i = 0; i < rs.rows.length; i++) {
                        if(rs.rows.item(i).rowid === id) {
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
    addMeet : function(meet) {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO meet VALUES (?, ?, ?)", meet);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log("successfully added meet!");
        });
    },

    insertDummyValues : function () {
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
    addAthlete : function (athlete) {
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
    deleteAthlete : function(athlete) {
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
     * return all of the data of an athlete given an id
     * pass in * to retrieve all athlete
     * 
     * loop through rows with rows.length and access with rows.item(i)
     * 
     * @param {*} id 
     */
    getAthlete : function(id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx, rs) {
                tx.executeSql("SELECT *, rowid FROM athlete", id, function(tx, rs) {
                    // return all of the rows on *
                    if(id === "*") {
                        resolve(rs.rows);
                    }

                    for (let i = 0; i < rs.rows.length; i++) {
                        if(rs.rows.item(i).rowid === id) {
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
     * 
     * This function is used to quickly execute small pieces of sql commands for testing purposes
     * 
     * @param {String} command 
     */
    executeCommand : function(command) {
        this.db.transaction(function (tx, rs) {
            tx.executeSql(command, [], function(tx, rs) {
                console.log(JSON.stringify(rs));
                for (let i = 0; i < rs.rows.length; i++) {
                    console.log(JSON.stringify(rs.rows.item(i)));
                }
            });
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
        });
    },

    close : function() {
        this.db.close(function() {
            console.log("Database is closed: OK");
        });
    }
};