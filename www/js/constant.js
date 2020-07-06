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
    signup: "https://www.sportwatch.us/mobile/signup.php",
    login: "https://www.sportwatch.us/mobile/login.php",
    account_action: "https://www.sportwatch.us/mobile/account-action.php",
    record_action: "https://www.sportwatch.us/mobile/record-action.php",
    team_create: "https://www.sportwatch.us/mobile/team-create.php",
    team_action: "https://www.sportwatch.us/mobile/team-action.php"
};

/**
 * config options for remote communication with our server
 */
Constant.AJAX_CFG = {
    timeout: 3000
};

