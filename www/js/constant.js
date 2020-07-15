/**
 * this file is for holding global const values
 */
class Constant {
    // Holds all of the constants
    // Defined below
}

// Due to the way ES6 classes work, constants have to be defined
// outside of declaration
Constant.DIR_CSS = "css/";

Constant.URL = {
    signup: "https://sportwatch.us/mobile/signup.php",
    login: "https://sportwatch.us/mobile/login.php",
    account_action: "https://sportwatch.us/mobile/account-action.php",
    record_action: "https://sportwatch.us/mobile/record-action.php",
    team_create: "https://sportwatch.us/mobile/team-create.php",
    team_action: "https://sportwatch.us/mobile/team-action.php",
    toolbox: "https://sportwatch.us/mobile/other-action.php"
};

/**
 * config options for remote communication with our server
 */
Constant.AJAX_CFG = {
    timeout: 3000
};

