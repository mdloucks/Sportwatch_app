<?php

/**
 * ---- HOW TO USE ----
 * 
 * Will create a team with the given POST variable values, assuming
 * there isn't a similar team.
 * 
 * Returns JSON response with given error codes (see error_codes.txt on GitHub)
 * 
 * Examples:
 * sportwatch.us/mobile/create_team.php?school_name=hemlock_high_school&primary_coach=loucks12345@gmail.com
 * ../create_team.php?school_name=merrill high school&primary_coach=example@email.com&team_name=vandals track team&is_locked=1
 * ../create_team.php?school_name=merrill high school&primary_coach=example@email.com&force=1
 * 
 * 
 * @param String school_name - full name of school (i.e. hemlock_high_school)
 * @param String primary_coach - email of primary coach of the new team
 * @param String secondary_coach - [*optional*] email of secondary coach
 * @param String invite_code - [*optional*] 7-character long invite code (a-z,0-9 only)
 * @param String team_name - [*optional*] name of team; must be at least 5 characters long
 *                           (a-z,0-9 only)
 * @param Integer is_locked - [*optional*] 1 or 0. Will the team be locked?
 * @param Integer force - [*optional*] Provide 'force=1' to override a "team is too similar" error
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require("../wp-content/themes/primer/sw-db.php");
$db = new DatabaseConnection();
$CODE_LENGTH = 7; // Base length of random generated code
$TEAM_NAME_LENGTH = 5;
$MAX_TEAM_LENGTH = 75; // Max length for team name

// Replace all but letters and numbers; getVar leaves . and @ symbols for emails
$inviteCode = preg_replace("/[^A-Za-z0-9]/", "", getVar("invite_code"));
$teamName = preg_replace("/[^A-Za-z0-9_]/", "", getVar("team_name"));
$schoolId = -1;
$primaryCoachId = -1;
$secondaryCoachId = -1;
$isLocked = 0;

$fields = array();
$values = array();
$codeWasInvalid = false; // Was the given code too short / not given?
$nameWasInvalid = false; // Team name


// ---- PERFORM SAFETY CHECKS ON VARIABLES ---- //
if(($inviteCode != false) && (strlen($inviteCode) != $CODE_LENGTH)) {
    $inviteCode = "";
    $codeWasInvalid = true;
}
if(($teamName != false) && (strlen($teamName) >= $TEAM_NAME_LENGTH) && (strlen($teamName) < $MAX_TEAM_LENGTH)) {
    $fields[] = "team_name";
    $values[] = $teamName;
} else {
//     $teamName = ""; // Don't reset it; use it later for error reporting
    $nameWasInvalid = true;
}
if(getVar("school_name") != false) {
    $schoolId = $db->selectSingle("SELECT id_school FROM school WHERE school_name = ?", "s", getVar("school_name"));
    if(count($schoolId) > 0) {
        $schoolId = $schoolId[0];
        $fields[] = "id_school";
        $values[] = $schoolId;
    } else {
        sendResponse(array("status" => -4, "substatus" => 4, "info" => "provided school: " . getVar("school_name")));
    }
}
if(getVar("primary_coach") != false) {
    $primaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("primary_coach"));
    if(count($primaryCoachId) > 0) {
        $primaryCoachId = $primaryCoachId[0];
        $fields[] = "id_coach_primary";
        $values[] = $primaryCoachId;
    } else {
        sendResponse(array("status" => -4, "substatus" => 5, "info" => "provided coach: " . getVar("primary_coach")));
    }
}
if(getVar("secondary_coach")) {
    $secondaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("secondary_coach"));
    if(count($secondaryCoachId) > 0) {
        $secondaryCoachId = $secondaryCoachId[0];
        $fields[] = "id_coach_secondary";
        $values[] = $secondaryCoachId;
    } else {
        $secondaryCoachId = -2;
    }
}
if(getVar("is_locked") != false) {
    if(getVar("is_locked") == 1) {
        $fields[] = "is_locked";
        $values[] = 1;
    }
} // Otherwise keep as default = false

// If code is short or already in database, re-generate
if((strlen($inviteCode) != $CODE_LENGTH) || ($db->selectMultiple("SELECT * FROM team WHERE invite_code = ?", "s", $inviteCode))) {
    for($i = 0; $i < 5; $i++) {
        $inviteCode = createCode($CODE_LENGTH, (str_replace(".", "0", microtime(true))));
        
        // If the code is not already in the database, proceed
        if(!$db->selectMultiple("SELECT * FROM team WHERE invite_code = ?", "s", $inviteCode)) {
            $i = 5; // Skip the loop because code is valid
            continue;
        }
    } // End of for loop
}
$fields[] = "invite_code";
$values[] = $inviteCode;

// Write the given values into one array
// Also, check to see if similar teams exist
$dataArray = array();
$similarity = 0; // The lower the better
for($d = 0; $d < count($fields); $d++) {
    $dataArray[$fields[$d]] = $values[$d];
    
    $matches = $db->selectSingle("SELECT 1 FROM team WHERE {$fields[$d]} = ?", "s", $values[$d]);
    if(count($matches) > 0) {
        // Put more weight on a similar school
        if($fields[$d] == "id_school") {
            $similarity = $similarity + 2;
        } else {
            $similarity = $similarity + 1;
        }
    }
}
if($similarity >= 3) { // 3 out'ta 5 is pretty similar dude
    if((getVar("force") == false) || (getVar("force") != 1)) {
        sendResponse(array("status" => -4, "substatus" => 3, "info" => "team was too similar. similarity={$similarity}"));
    }
}
// A team needs at least a school and primary coach
// (invite code will have been generated above)
if(($schoolId < 0) || ($primaryCoachId < 0)) {
    sendResponse(array("status" => -4, "substatus" => 2, "info" => "requires more parameters"));
}

// ---- CREATE TEAM ---- //
$didSucceed = $db->insertValues("team", $dataArray);

// Add the coaches to the team
$newTeamId = $db->selectSingle("SELECT id_team FROM team WHERE invite_code = ?", "s", $inviteCode);
if(count($newTeamId) > 0) {
    $newTeamId = $newTeamId[0];
} else {
    sendResponse(array("status" => -4, "substatus" => 1, 
                       "info" => "could not find new team id. db: " . ($db->getDatabaseError())));
}
$didSucceed = ($didSucceed) && ($db->joinTeam($primaryCoachId, $newTeamId));
// -- Add secondary coach if there was one -- //
if($secondaryCoachId >= 0) {
    $didSucceed = ($didSucceed) && ($db->joinTeam($secondaryCoachId, $newTeamId));
}

// ---- PROCESS AND SEND OPERATION ---- //

if($didSucceed) {

    // Find out if there were any minor errors
    $substat = 0;
    $errorInfoMessage = "na";
    if($codeWasInvalid) {
        $substat = 2;
        $errorInfoMessage = "code was invalid";
    } else if($nameWasInvalid) {
        $substat = 1;
        $errorInfoMessage = "provided name: {$teamName}";
    } else if($secondaryCoachId == -2) {
        $substat = 3;
        $errorInfoMessage = "provided coach: " . getVar("secondary_coach");
    }
    
    // Pull name of school based on id, just to add extra verification
    $schoolNameValidated = $db->selectSingle("SELECT school_name FROM school WHERE id_school = ?", "i", $schoolId);
    if(count($schoolNameValidated) > 0) {
        $dataArray["school_name"] = $schoolNameValidated[0];
    } else {
        sendResponse(array("status" => -4, "substatus" => 1, "info" => "school not found: " . ($db->getDatabaseError())));
    }
    
    sendResponse(array("status" => 4, "substatus" => $substat, "info" => $errorInfoMessage) + $dataArray);
} else {
    sendResponse(array("status" => -4, "substatus" => 1, "info" => ($db->getDatabaseError())));
}

// Just a fail-safe
sendResponse(array("status" => -4, "substatus" => 0, "info" => "improper exit"));


// Response should contain the following:
// - status
// - substatus
// - invite code
// - school
// - error_info (if error), contains key variables involved in error


// ---- FUNCTIONS ---- //

/**
 * Creates random string character (A-Z,a-z,0-9) with potental "litter"
 * 
 * @param length
 * length of code string
 * @param litter
 * [default = ""] any string that is added to center of seed
 * @param seed
 * [default = ""] the seed used when randomizing the code
 * 
 * @usage
 * createCode(6, "brownCow");   -->     "etHGXk"
 * 
 * @return String
 * the random generated code
 */
function createCode($length, $litter = "", $seed = "") {
    
    // Create a generic seed
    if(strlen($seed) < 5) {
        // The boss said no caps, so I can't wear this hat anymore [:(
        $seed = "abcdefghijklmnopqr" . $litter . "stuvwxyz0123456789";
    }
    
    $code = "";
    for($c = 0; $c < $length; $c++) {
        // mt_rand is faster. Generate a decimal, not integer random
        $pos = floor((mt_rand(0, 1000) / 1000) * (strlen($seed) - 1));
        $pos = (int) $pos; // Cast to avoid errors in index
        $code = $code . $seed{$pos};
    }
    return $code;
}

/**
 * Checks to see if a variable of the given name is set in
 * the GET or POST variables.
 * 
 * Returns the value if it's set. Otherwise, it returns false.
 * 
 * Example:
 * getVar("id_team");  --> 4
 * getVar("boundy_ball_7"); --> false
 * 
 * @param String $varName - identifier of the variable
 * @param Integer $varSource - [default = 1] 0 for POST, 1 for GET variable
 */
function getVar($varName, $varSource = 1) {
    // CLEANUP: Change 1 to 0, aka GET to POST
    
    $varValue = NULL;
    if(($varSource == 0) && (isset($_POST[$varName]))) {
        $varValue = $_POST[$varName];
    } else if(($varSource == 1) && (isset($_GET[$varName]))) {
        $varValue = $_GET[$varName];
    } else {
        return false;
    }
    return clean($varValue);
}

/**
 * Cleans the variable of unwanted special characters and replaces
 * string spaces with underscores. Will also remove special characters
 * from arrays and their indexes.
 * 
 * Example:
 * clean("heyf43%% FBau 43of@#$%^&");  -->  "heyf43_FBau_43of"
 * 
 * 
 * @param Any $varValue - the dirty / unknown variable type
 */
function clean($varValue) {
    
    // Validate and clean
    $varType = gettype($varValue);
    if(($varType == "boolean") || (is_numeric($varValue))) {
        return $varValue;
    } else if($varType == "string") {
        // Totally didn't sneak this taliban in from the Overflow lands
        $varValue = str_replace(" ", "-", $varValue); // Replaces all spaces with hyphens.
        $varValue = preg_replace("/[^A-Za-z0-9\-@\._]/", "", $varValue); // Removes special chars.
        $varValue = preg_replace("/-+/", "-", $varValue); // Replaces multiple hyphens with single one.
        return str_replace("-", "_", $varValue); // Because we prefer _'s
        
    } else if($varType == "array") {
        $cleanedArray = array();
        foreach($varValue as $col => $val) {
            // Clean all strings within array
            $col = clean($col); // Hehe, recusion FTW
            $cleanedArray[$col] = clean($val);
        }
        var_dump($cleanedArray);
        return $cleanedArray;
    }
    
    return false;
}

/**
 * Send data back to client. Calls exit at conclusion. Does NOT return
 * 
 * @param AssociativeArray data - data to send to client
 */
function sendResponse($data) {
    $json = json_encode($data);
    echo $json;
    exit();
}

?>
