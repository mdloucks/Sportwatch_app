/**
 * this file is for holding global const values
 */
class Constant {
    // Holds all of the constants
    // Defined below

    // Use functions for backend calls to allow for versioning and backwards compatability
    static getSignupURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.signup;
    }
    static getLoginURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.login;
    }
    static getAccountURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.account_action;
    }
    static getPlanURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.plan_action;
    }
    static getValidateURL() {
        return "https://validator.fovea.cc/v1/validate?appName=us.sportwatch.sportwatchapp&apiKey=3fae594f-542c-4e20-97de-028a4a9e567b";
    }
    static getRecordURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.record_action;
    }
    static getTeamCreateURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.team_create;
    }
    static getTeamActionURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.team_action;
    }
    static getToolboxURL() {
        return Constant.HOSTNAME + Constant.BACKEND_PATH + Constant.FUNCTION.toolbox;
    }
}

// Due to the way ES6 classes work, constants have to be defined
// outside of declaration
Constant.DIR_CSS = "css/";

Constant.HOSTNAME = "https://dev.sportwatch.us"; // Append "dev." for testing
Constant.BACKEND_PATH = "/backend/v1-0/"; // So we can adjust based on versions of backend
Constant.FUNCTION = {
    signup: "signup.php",
    login: "login.php",
    account_action: "account-action.php",
    plan_action: "plan-action.php",
    record_action: "record-action.php",
    team_create: "team-create.php",
    team_action: "team-action.php",
    toolbox: "other-action.php"
};

/**
 * config options for remote communication with our server
 */
Constant.AJAX_CFG = {
    timeout: 3000
};

// Subscription information
Constant.IOS_MONTHLY_ID = "sp_m_KXqzG";
Constant.IOS_ANNUALLY_ID = "sRfafDxVzo";

Constant.ANDROID_MONTHLY_ID = "sp_m_kxqzg";
Constant.ANDROID_ANNUALLY_ID = "srfafdxvzo";

// animation durations
Constant.fadeDuration = 300;
Constant.fadeIncrement = 45;

Constant.popupFadeoutDelay = 4000
Constant.popupFadeoutDuration = 1500;

Constant.longClickMinimumDuration = 1000;

Constant.stopwatchSelectEventColumnCount = 3;

// the amount of time we wait before invalidating localstorage and restarting
Constant.minimumStallDuration = 8000;

// database queries

// select all of the splits for a given athlete in a given event eg. John Smith for the 400m
Constant.querySplitRecordsForAthleteEvent = (`
    SELECT * FROM record_split
    INNER JOIN record
    ON record_split.id_record = record.id_record
    INNER JOIN record_user_link
    ON record_user_link.id_record = record.id_record
    INNER JOIN athlete
    ON athlete.id_backend = record_user_link.id_backend
    WHERE record.id_record_definition = ? AND record_user_link.id_backend = ?
`);

// select values for given event and athlete
Constant.queryRecordsForAthleteEvent = `
    SELECT *, record.id_record from record
    INNER JOIN record_user_link
    ON record.id_record = record_user_link.id_record
    WHERE record.id_record_definition = ? AND record_user_link.id_backend = ?
`;

// get all records and the users linked to them today
Constant.queryTodaysRecordsQuery = (`
    SELECT * FROM record
    INNER JOIN record_user_link
    ON record_user_link.id_record = record.id_record
    INNER JOIN athlete
    ON record_user_link.id_backend = athlete.id_backend
    INNER JOIN record_definition
    ON record.id_record_definition = record_definition.rowid
    WHERE date(datetime(record.last_updated / 1000 , 'unixepoch')) = date('now')
`);

// get all records and the users linked to them
Constant.queryAllRecords = (`
    SELECT * from record
    INNER JOIN record_user_link
    ON record.id_record = record_user_link.id_record
    INNER JOIN athlete
    ON record_user_link.id_backend = athlete.id_backend
    INNER JOIN record_definition
    ON record.id_record_definition = record_definition.rowid
`);


Constant.graphColors = [
    "#003f5c",
    "#a05195",
    "#d45087",
    "#ff7c43",
    "#665191",
    "#ffa600",
    "#f95d6a",
    "#2f4b7c"
];

Constant.graphConfigurations = [];

// populate graph configurations
(function() {
    Constant.graphColors.map((value, index) => {
        Constant.graphConfigurations.push({
            fill: false,
            borderColor: value,
            backgroundColor: value,
        });
    });
})();

Constant.boysColor = "#6abce1";
Constant.girlsColor = "#fc99b6";

Constant.genderColorConditionalAttributes = {
    "gender": {
        "M": {
            style: `background-color: ${Constant.boysColor};`
        },
        "F": {
            style: `background-color: ${Constant.girlsColor};`
        }
    }
}

Constant.eventColorConditionalAttributes = {
    "record_identity": {
        "60m": {
            class: "generated_button sprint_event"
        },
        "75m": {
            class: "generated_button sprint_event"
        },
        "100m": {
            class: "generated_button sprint_event"
        },
        "200m": {
            class: "generated_button sprint_event"
        },
        "400m": {
            class: "generated_button mid_event"
        },
        "800m": {
            class: "generated_button mid_event"
        },
        "4x800m relay": {
            class: "generated_button mid_event"
        },
        "1500m": {
            class: "generated_button long_event"
        },
        "1600m": {
            class: "generated_button long_event"
        },
        "3k": {
            class: "generated_button long_event"
        },
        "4k": {
            class: "generated_button long_event"
        },
        "5k": {
            class: "generated_button long_event"
        },
        "6k": {
            class: "generated_button long_event"
        },
        "8k": {
            class: "generated_button long_event"
        },
        "10k": {
            class: "generated_button long_event"
        },
        "20k": {
            class: "generated_button ultra_long_event"
        },
        "half marathon": {
            class: "generated_button ultra_long_event"
        },
        "marathon": {
            class: "generated_button ultra_long_event"
        },

        "100m hurdle": {
            class: "generated_button hurdle_event"
        },
        "60m hurdle": {
            class: "generated_button hurdle_event"
        },
        "300m hurdle": {
            class: "generated_button hurdle_event"
        },
        "110m hurdle": {
            class: "generated_button hurdle_event"
        },
        "400m hurdle": {
            class: "generated_button hurdle_event"
        },
        "4x100m relay": {
            class: "generated_button sprint_event"
        },
        "4x400m relay": {
            class: "generated_button sprint_event"
        },
        "long jump": {
            class: "generated_button non_power_field_event"
        },
        "triple jump": {
            class: "generated_button non_power_field_event"
        },
        "high jump": {
            class: "generated_button non_power_field_event"
        },
        "pole vault": {
            class: "generated_button non_power_field_event"
        },
        "discus": {
            class: "generated_button power_field_event"
        },
        "javelin": {
            class: "generated_button power_field_event"
        },
        "hammer": {
            class: "generated_button power_field_event"
        },
        "shot put": {
            class: "generated_button power_field_event"
        }
    }
};