

/**
 * @classdesc This class will serve to generate tables and related data on the frontent 
 * @class
 */
class Tabulator {

    generateTable(element, data, cols) {
        $(element).DataTable( {
            destroy: true,
            data: data,
            columns: cols
        });
    }
}