
/**
 * this file is for holding global const values
 */

 // this object is kind of a standard for our states. This is to prevent misspelling and to consolidate all of our states in one location
var States = Object.freeze({
    "uninitialized" : 0, 
    "welcome" : 1,
    "login" : 2,
    "signup" : 3,
    "home" : 4,
    "myteam" : 5,
    "myrecord" : 6
});


var sw_urls = {
    signup : "https://www.sportwatch.us/mobile/signup.php",
    login : "https://www.sportwatch.us/mobile/login.php"
};

/**
 * config options for remote communication with our server
 */
var ajax_config = {
    timeout : 3000
}

/**
 * configurations for our app that we may expect to change or be used in many locations
 * eg. file path location prefixes
 */
var sw_config = {
    ui_dir : "ui/"
};
