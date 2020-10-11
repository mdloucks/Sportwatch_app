

/**
 * @class
 * @classdesc this class has a few static methods to help determine the 
 * current state of the network. 
 */
class NetworkInfo {

    /**
     * returns true or false depending on network ocnnection
     * 
     * @returns {Boolean} isOnline
     */
    static isOnline() {
        if(navigator.connection.type != Connection.NONE) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * this method is called when a connection is attained. 
     * Uploads the user's offline records
     */
    static onOnline() {
        var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN]  = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI]     = 'WiFi connection';
        states[Connection.CELL_2G]  = 'Cell 2G connection';
        states[Connection.CELL_3G]  = 'Cell 3G connection';
        states[Connection.CELL_4G]  = 'Cell 4G connection';
        states[Connection.CELL]     = 'Cell generic connection';
        states[Connection.NONE]     = 'No network connection';
    
        console.log('[NetworkInfo.js]: Network online! Connection type: ' + states[networkState]);

        RecordBackend.uploadOfflineRecords();
    }

    static onOffline() {
        navigator.notification.alert(
            "You are still able to save times on the stopwatch.\n\nSome features will be disabled",
            () => {}, // callback
            'No Internet Connection', // title
            'OK'
        );
    }
}