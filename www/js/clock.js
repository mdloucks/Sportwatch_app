/**
 * @classdesc this class will be used as an instantiation for the stopwatch
 * as well as a container for general time functions
 * @class
 */
class Clock {


    /**
     * This function will take a time in seconds and convert it to one of the following:
     * 
     * under 60 seconds - stays the same
     * over 60 seconds - minute:second:millisecond
     * over 60 minutes - hour:minute:second
     * 
     * @param {Number} time the time to format
     */
    static secondsToTimeString(time) {

        // convert seconds to ms
        let dateTime = new Date(time * 1000);
        let formattedTime;

        // format for hours
        if(dateTime.getHours() - 19 >= 1) {
            formattedTime = dateTime.toISOString().substr(11, 12);
            // format for minutes
        } else if(dateTime.getMinutes() >= 1) {
            formattedTime = dateTime.toISOString().substr(14, 9);
            // format for seconds
        } else if(dateTime.getSeconds() >= 1) {
            formattedTime = dateTime.toISOString().substr(17, 6);
            // format for ms
        } else if(dateTime.getSeconds() < 1) {
            formattedTime = dateTime.toISOString().substr(17, 6);
            // not sure, just display the whole thing
        } else {
            formattedTime = dateTime.toISOString().substr(11, 12);
        }

        return formattedTime;
    }

    static timeStringToSeconds(string) {

        string = string.trim();

        if(!(/^[0-9.:]+$/).test(string)) {
            console.log("bad input! " + string);
            return null;
        }

        // split by period and colon
        let timeArray = string.split(/[\.:]+/);
        let h = 0;
        let m = 0;
        let s = 0;
        let ms = 0;

        // seconds
        if(timeArray.length == 1) {
            s = timeArray[0];
        // minutes
        } else if (timeArray.length == 2) {
            s = timeArray[0];
            ms = timeArray[1];
        // minutes seconds milliseconds
        } else if(timeArray.length == 3) {
            m = timeArray[0];
            s = timeArray[1];
            ms = timeArray[2];
            // hours 
        } else if(timeArray.length == 4) {
            h = timeArray[0];
            m = timeArray[1];
            s = timeArray[2];
            ms = timeArray[3];
        }

        let seconds = Number(h * 60 * 60) + Number(m * 60) + Number(s) + Number(ms / 1000);

        return seconds;
    }
}