
/**
 * @classdesc An object representation of an athlete. This class will be used
 * to quickly grab information about a given athlete (ex. average value for an event)
 * instead of needing to do a database promise.
 * @class
 */
class AthleteInfo {

    /**
     * 0_0
     */
    constructor(backendId) {
        
        this.records = [];
        this.average = 0.00;
        console.log("constructed");
        this.grabInfo(backendId);
    }
    
    
    grabInfo(backendId) {
        
        let query = (`
            SELECT * FROM record
            INNER JOIN record_user_link ON record_user_link.id_record = record.id_record
            WHERE record_user_link.id_backend = ?
        `);
        
        dbConnection.selectValuesAsObject(query, [backendId]).then((records) => {
            console.log("ATHLETE INFO PULLEd");
            console.log(records);
            this.records = records;
            
            for (let r = 0; r < records.length; r++) {
                this.average = this.average + records[r].value;
            }
            this.average = this.average / records.length;
            
        });
        
    }
    
    
    getAverage() {
        return this.average;
    }
    
    
    
};