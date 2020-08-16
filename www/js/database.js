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
        ["meter", "hammer"],
        ["meter", "shot put"]
    ],
    // "record": [
    //     [1, 1, 12, false, null, null, Date.now()],
    //     [1, 1, 13, false, null, null, Date.now()],
    //     [1, 2, 13, false, null, null, Date.now()],
    //     [1, 2, 16, false, null, null, Date.now()],
    //     [1, 3, 14, false, null, null, Date.now()],

    //     [2, 1, 12, false, null, null, Date.now()],
    //     [2, 1, 13, false, null, null, Date.now()],
    //     [2, 2, 13, false, null, null, Date.now()],
    //     [2, 2, 16, false, null, null, Date.now()],
    //     [2, 3, 14, false, null, null, Date.now()],

    // ]
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
            if (DO_LOG) {
                console.log("Opening database...");
            }
            this.db = window.sqlitePlugin.openDatabase({
                name: 'Sportwatch.db',
                location: 'default'
            });
        } catch (err) {
            if (DO_LOG) {
                console.log("Sportwatch database failed to open.");
            }
            // TODO: send this error to the server and try to handle it in some way
            throw err;
        }
    }

    /**
     * will wipe all existing tables and create new ones
     * 
     * CAUTION: this will delete all of the uers's saved stuff!
     */
    createNewTables() {
        this.db.transaction(function (tx) {

            tx.executeSql("DROP TABLE IF EXISTS athlete");
            tx.executeSql("DROP TABLE IF EXISTS relay_team");
            tx.executeSql("DROP TABLE IF EXISTS record_definition");
            tx.executeSql("DROP TABLE IF EXISTS record");

            tx.executeSql(`CREATE TABLE IF NOT EXISTS athlete (fname, lname, grade, gender, id_backend)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS relay_team (team_name)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS record_definition (unit, record_identity)`);

            tx.executeSql(`CREATE TABLE IF NOT EXISTS record (id_athlete, id_record_definition, value, is_split, id_split, id_split_index, last_updated)`);

        }, function (error) {
            if (DO_LOG) {
                console.log('Transaction ERROR: ' + error.message);
            }
        }, function () {
            if (DO_LOG) {
                console.log('TABLES CREATED');
            }
        });

        this.insertDatabasePresetValues();
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
                        if (DO_LOG) {
                            console.log("empty set for " + query);
                        }
                        resolve(false);
                    }
                    resolve(rs.rows);
                });
            }, function (error) {
                if (DO_LOG) {
                    console.log('Transaction ERROR: ' + error.message);
                    console.log(JSON.stringify(error));
                }
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
                        if (DO_LOG) {
                            console.log("empty set!");
                        }
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
                if (DO_LOG) {
                    console.log('Transaction ERROR: ' + error.message);
                    console.log(JSON.stringify(error));
                }
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

                if (DO_LOG) {
                    console.log(query);
                }

                tx.executeSql(query, option_values, function (tx, rs) {
                    resolve(true);
                });
            }, function (error) {
                if (DO_LOG) {
                    console.log('Transaction ERROR: ' + error.message);
                    console.log(JSON.stringify(error));
                }
                reject(error);
            }, function () {
                // success
            });
        });
    }

    /**
     * This function will rexecute a sql statement
     * 
     * @param {String} table name of the table
     * @param {Array} values array of values to pass in
     */
    executeTransaction(query, values) {
        return new Promise((resolve, reject) => {
            this.db.transaction(function (tx) {

                tx.executeSql(query, values, function (tx, rs) {
                    if (rs.rows.length == 0) {
                        resolve(true)
                    } else {
                        resolve(rs.rows)
                    }
                });
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

            if (DO_LOG) {
                console.log(query);
            }

            tx.executeSql(query, values, function (tx, rs) {});
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

            this.db.transaction(function (tx) {
                tx.executeSql(`INSERT INTO ${table} VALUES ${queryWildcards}`, data);

                resolve();
            }, function (error) {
                if (DO_LOG) {
                    console.log('Transaction ERROR: ' + error.message);
                    console.log(JSON.stringify(error));
                }
                reject(error);
            }, function () {});
        });
    }

    /**
     * @description insert a given object or array of objects into the table
     * @param {String} table the table to be inserted into
     * @param {Array or Object} values the key:pair object to be inserted into the table
     */
    insertValuesFromObject(table = "", values = []) {

        if (values.length == 0) {
            console.log("[database.js]: values array length is 0");
            return;
        }

        if (table == "") {
            console.log("[database.js]: table was not specified");
        }

        let _this = this;

        this.db.transaction(function (tx) {
            if (typeof (values) == "object") {
                let nColumns = Object.keys(values).length;
                let query = `INSERT INTO ${table} (${Object.keys(values).join(", ")}) VALUES ${_this.getQueryInsertString(nColumns)}`;
                let dataArray = _this.getDataValuesAsArray(values);

                console.log(query);
                console.log(dataArray + " " + typeof (dataArray));
                tx.executeSql(query, dataArray);

            } else if (typeof (values) == "array") {

                for (let i = 0; i < values.length; i++) {
                    let valuesObject = values[i];
                    let nColumns = Object.keys(valuesObject[0]).length;
                    let dataArray = _this.getDataValuesAsArray(valuesObject);
                    let query = (`INSERT INTO ${table} (${Object.keys(valuesObject).join(", ")}) VALUES ${_this.getQueryInsertString(nColumns)}`);
                    tx.executeSql(query, dataArray);
                }

            } else {
                console.log("[database.js]: incorrect type for query, type given is " + typeof (values));
            }
        }, function (error) {
            console.log("[database.js]: " + error);
        }, function () {});
    }

    /**
     * read from a json file and populate the database with the entries within
     */
    insertDatabasePresetValues() {

        this.db.transaction(function (tx) {

            // $.getJSON("json/database-presets.json", function(json) {
            // });

            if (Object.keys(json).length == 0) {
                if (DO_LOG) {
                    console.log("TABLE JSON IS MISSING");
                }
            } else {
                if (DO_LOG) {
                    console.log("inserting JSON values");
                }
            }

            Object.keys(json).forEach(element => {

                for (let i = 0; i < json[element].length; i++) {

                    let row_length = json[element][0].length;

                    tx.executeSql(`INSERT INTO ${element} VALUES (${"?, ".repeat(row_length).slice(0, -2)})`, json[element][i]);
                }
            });
        }, function (error) {
            if (DO_LOG) {
                console.log('Transaction ERROR: ' + error.message);
            }
        }, function () {
            if (DO_LOG) {
                console.log("Dummy values inserted");
            }
        });
    }

    /**
     * this function will delete the sportwatch database
     */
    deleteDatabase() {
        window.sqlitePlugin.deleteDatabase({
            name: "Sportwatch.db",
            location: "default"
        }, function () {
            if (DO_LOG) {
                console.log("database deleted successfully");
            }
        }, function (error) {
            if (DO_LOG) {
                console.log("database could not be deleted");
            }
        });
    }

    getQueryInsertString(length) {
        return "(" + "?, ".repeat(length).slice(0, -2) + ")"
    }

    /**
     * @description this method will return the values of an object into an array
     * @param {Object} data the object to convert into array
     */
    getDataValuesAsArray(data) {

        let array = [];

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                array.push(data[key]);
            }
        }
        return array;
    }

    /**
     * @description print a json.stringify of every row in a table
     * @param {String} tableName name of table
     */
    printTable(tableName) {
        this.selectValues(`SELECT *, rowid FROM ${tableName}`).then(function(data) {
            for (let i = 0; i < data.length; i++) {
                console.log(JSON.stringify(data.item(i)));
            }
        })
    }

    /**
     * Closes the database
     * 
     * TODO: make sure to call this sometime
     */
    close() {
        this.db.close(function () {
            if (DO_LOG) {
                console.log("Database is closed: OK");
            }
        });
    }
};