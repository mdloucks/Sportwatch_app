

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
    
    /**
     * Reads and parses a CSV file from an HTML file input element and passes
     * it to the callback function for processing or display
     * 
     * @example readCSVFromFile("#rosterFile", (csvArr) => { // Display roster data })
     *          --> Reads the first file from #rosterFile input and passes csvArr to callback
     * 
     * @param {String | DOM} fileElement reference to the <input type="file"> element to read from (jQuery selector or object)
     * @param {Function} callback operation to perform on the parsed CSV array
     * @returns
     * Technically nothing, but will pass an array containing the CSV data into the callback function
     */
    static readCSVFromFile(fileElement, callback) {
        
        // Check to see how fileElement was provided (string or DOM reference)
        if(typeof fileElement == "string") {
            fileElement = $(fileElement);
        }
        if(fileElement.length == 0) {
            if(DO_LOG) {
                console.log("[tabulator.js][readCSCFromFile()]: Could not find element provided");
            }
            return [];
        }
        
        let reader = new FileReader();
        reader.onload = () => {
            let content = reader.result;

            // Make sure its a CSV file
            let fileType = content.substring(0, content.indexOf(";"));
            if (fileType != "data:text/csv") {
                Popup.createConfirmationPopup("That file type is not supported. Please select a CSV file.", ["OK"]);
                return;
            }
            let startOfData = content.indexOf(";") + (";base64,").length;
            content = content.substring(startOfData, content.length);

            // Decode into plain text and convert to array
            content = atob(content);
            let csvArray = csvParse(content);
            callback(csvArray);
        };
        reader.readAsDataURL(fileElement.prop("files")[0]);
        
    }
    
}