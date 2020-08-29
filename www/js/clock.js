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
        let formattedTime = new Date(time * 1000);

        if (time < 60) {
            formattedTime = `${formattedTime.getSeconds()}.${formattedTime.getMilliseconds()}`;
        } else if (time < 60 * 60) {
            formattedTime = `${formattedTime.getMinutes()}:${formattedTime.getSeconds()}.${formattedTime.getMilliseconds()}`;
        } else if (time > 60 * 60) {
            formattedTime = `${formattedTime.getHours()}:${formattedTime.getMinutes()}:${formattedTime.getSeconds()}.${formattedTime.getMilliseconds()}`;
        }
        
        return formattedTime;
    }

    static timeStringToSeconds(string) {

        if((/^[0-9,:]+$/).test(string)) {
            console.log("bad input! " + string);
            return null;
        }

        // split by period and colon
        let timeArray = string.split(/[\.:]+/);
        let secondsTime = new Date();

        // seconds
        if(timeArray.length == 2) {
            secondsTime.setSeconds(timeArray[0]);
            secondsTime.setMilliseconds(timeArray[1]);
            // minutes
        } else if(timeArray.length == 3) {
            secondsTime.setMinutes(timeArray[0]);
            secondsTime.setSeconds(timeArray[1]);
            secondsTime.setMilliseconds(timeArray[2]);
            // hours 
        } else if(timeArray.length == 4) {
            secondsTime.setHours(timeArray[0]);
            secondsTime.setMinutes(timeArray[1]);
            secondsTime.setSeconds(timeArray[2]);
            secondsTime.setMilliseconds(timeArray[3]);
        }

        let seconds = (secondsTime.getHours() * 60 * 60) + (secondsTime.getMinutes() * 60) + (secondsTime.getSeconds()) + (secondsTime.getMilliseconds() / 1000);

        return seconds;
    }
}