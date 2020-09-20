

/**
 * @classdesc This class will serve to generate tables and related data on the frontent 
 * @class
 */
class Tabulator {

    generateTable(element, data) {
        $(element).DataTable( {
            data: data,
            columns: [{"data": "fname"}, {"data": "lname"}]
        } );
    }
}