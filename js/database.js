
/**
 * This will function almost identically to our server database connection class
 * 
 * That will be to provide a general set of methods to interface with the database
 * 
 * @param {String} DatabaseName
 */
function DatabaseConnection(name) {

    name = name || "Sportwatch";

    this.db = window.sqlitePlugin.openDatabase({ name: name, location: 'default' });

    /**
     * will wipe all existing tables and create new ones
     * 
     * CAUTION: this will delete all of the uers's saved stuff!
     */
    this.createNewTables = function () {
        this.db.transaction(function (tx) {

            tx.executeSql("DROP TABLE IF EXISTS athlete");
            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete (fname, lname, grade, gender)`);

            // tx.executeSql(`
            //     CREATE TABLE IF NOT EXISTS meet (
            //         id_meet INTEGER PRIMARY KEY,
            //         meet_name VARCHAR(255),
            //         meet_time DATETIME,
            //         meet_address VARCHAR(255),
            //         meet_city VARCHAR(255),
            //         meet_state VARCHAR(2),
            //         meet_zip VARCHAR(6),
            //     )   
            // `);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log('TABLES CREATED');
        });
    }

    this.insertDummyValues = function () {
        this.db.transaction(function (tx) {
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["John", "Smith", "10", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Bill", "Washington", "9", "m"]);
            tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", ["Suzie", "Walton", "11", "m"]);
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log("Dummy values inserted");
        });
    }

    /**
     * [fname, lname, grade, gender]
     * 
     * @param {*} athlete 
     */
    this.addAthlete = function (athlete) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {
                tx.executeSql("INSERT INTO athlete VALUES (?, ?, ?, ?)", athlete);
                resolve();
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
                console.log("Successfully created athlete: " + athlete.fname);
            });
        });
    }

    /**
     * return all of the data of an athlete given an id
     * pass in * to retrieve all athlete
     * 
     * loop through rows with rows.length and access with rows.item(i)
     * 
     * @param {*} id 
     */
    this.getAthlete = function(id) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx, rs) {
                tx.executeSql("SELECT *, rowid FROM athlete", id, function(tx, rs) {

                    if(id === "*") {
                        resolve(rs.rows);
                    }

                    for (let index = 0; index < rs.rows.length; index++) {
                        if(rs.rows.item(index).rowid === id) {
                            resolve(rs.rows.item(index));
                        }
                    }
                });
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                reject(error);
            }, function () {
                console.log("getAthlete - Success");
            });
        });
    },

    this.executeCommand = function(command) {
        this.db.transaction(function (tx, rs) {
            tx.executeSql(command, [], function(tx, rs) {
                console.log(JSON.stringify(rs));
                for (let index = 0; index < rs.rows.length; index++) {
                    console.log(JSON.stringify(rs.rows.item(index)));
                }
            });
        }, function (error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function () {
            console.log("Successfully");
        });
    }
};