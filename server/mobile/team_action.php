<?php

// Check to make sure the parameter exists / is valid
// CLEANUP: Uncomment
// if((!isset($_POST["intent"])) || (!isset($_POST("account_email)))) {
//     header("Location: https://www.sportwatch.us");
//     exit();
// }

/**
 * HOW TO USE
 * Summary:
 *  Used to perform an action on a target team. NOTE: The more optional
 *  parameters provided, the more accurate it will be to identify the
 *  target team. If not provided, will throw error.
 * 
 *  Parameters:
 *   (* indicates optional parameter)
 *   -  intent: [int] action desired (key in dev/team_intents)
 *   -  account_email: [string] email of initiating user
 *   -  school_name: [*string*] name of school of target team
 *   -  invite_code: [*string*] invite code of target team
 *   -  team_name: [*string*] name of target team
 *   -  primary_coach: [*string*] email of primary coach of target team
 *   -  secondary_coach: [*string*] email o secondary of target team
 *
 * Intent-Specific Parameters
 *   -  kicked_user: [*string*] email of kicked athlete
 *   -  promoted_user: [*sring*] email of promoted athlete
 *   -  new_code: [*string*] new invite code
 * 
 * Intents:
 *   0 : pull all information of team (id, invite code, school, etc.)
 *   1 : get account role (athlete, primary coach, secondary, etc.)
 *   2 : join team
 *   3 : leave team
 *   4 : kick athlete or secondary coach (must be coach initiated)
          - requires extra kicked_athlete POST variable
 *   5 : appoint primary coach (coach only)
          - requires extra promoted_user POST variable
          - demotes current primary coach (if any) to secondary
 *   6 : appoint secondary coach (coach only)
          - requires extra promoted_user POST variable
          - demotes current secondary (if any) to athlete
 *   7 : lock team (coach only)
 *   8 : regenerate invite code (coach only)
           - optional new_code POST variable
 *   9 : delete team (coach only)
 * 
 * Examples:
 * Yeah.... TODO
 * 
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require("../wp-content/themes/primer/sw-db.php");
$db = new DatabaseConnection();
$CODE_LENGTH = 7; // Base length of random generated code

// CLEANUP: _GET to _POST
$intent = -1;
$accountId = -1; // Account initiating the call
$schoolId = -1; // Team identifying variables below
$inviteCode = "";
$teamName = "";
$primaryCoachId = -1;
$secondaryCoachId = -1;

echo("WIP<br>");
die();

// CLEANUP: Change $_GET to $_POST
$intent = $_GET["intent"];
// TODO: Add check to make sure intent is set
$accountId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $_GET["account_email"]);
if((count($accountId) > 0) && ($db->emailExists($_GET["account_email"]))) {
    $accountId = $accountId[0];
} else {
    // CLEANUP: Change $_GET to $_POST
    sendResponse(array("status" => -5, "substatus" => 0, "error_info" => "provided email: " . $_GET["account_email"]));
}

// ---- PARSE TEAM IDENTIFIER VARIABLES ---- //
// CLEANUP: _GET to _POST
if(isset($_GET["school_name"])) {
    // CLEANUP: _GET to _POST         \/
    $schoolName = str_replace("_", " ", $_GET["school_name"]);
    $schoolId = $db->selectSingle("SELECT id_school FROM school WHERE school_name = ?", "s", $schoolName);
    if(count($schoolId) > 0) {
        $schoolId = $schoolId[0];
    }
}
if((isset($_GET["invite_code"])) && (strlen($_GET["invite_code"]) == 7)) {
    // CLEANUP: _GET to _POST
    $inviteCode = $_GET["invite_code"];
}
if((isset($_GET["team_name"])) && (strlen($_GET["team_name"]) > 5)) {
    // CLEANUP: CChange GET to POSt
    // TODO: Implement > 5 team name into create_team
    $teamName = str_replace("_", "", $_GET["team_name"]);
}
if(isset($_GET["primary_coach"])) {
    // CLEANUP: _GET to _POST         \/
    $primaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $_GET["primary_coach"]);
    if(count($primaryCoachId) > 0) {
        $primaryCoachId = $primaryCoachId[0];
    }
}
if(isset($_GET["secondary_coach"])) {
    // CLEANUP: _GET to _POST         \/
    $secondaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $_GET["secondary_coach"]);
    if(count($secondaryCoachId) > 0) {
        $secondaryCoachId = $secondaryCoachId[0];
    } 
}


// ---- TRY FINDING THE TEAM WITH BEST MATCH TO PROVIDED INFO ---- //

$largestArray = array();
// Arrays that will be used to cross-reference later
$schoolTeams = array();
$inviteTeams = array(); // Teams with matching invite code
$nameTeams = array();
$primaryTeams = array();
$secondaryTeams = array();

if($schoolId >= 0) {
    $schoolTeams = $db->selectSingle("SELECT id_team FROM team WHERE id_school = ", "i", $schoolId);
    $largestArray = $schoolTeams;
}
if(strlen($inviteCode) == 7) {
    $inviteTeams = $db->selectSingle("SELECT id_team FROM team WHERE invite_code = ?", "s", $inviteCode);
    if(count($inviteTeams) > count($largestArray)) {
        $largestArray = $inviteTeams;
    }
}
if(strlen($teamName) > 5) {
    $nameTeams = $db->selectSingle("SELECT id_team FROM team WHERE team_name = ?", "s", $teamName);
    if(count($nameTeams) > count($largestArray)) {
        $largestArray = $nameTeams;
    }
}
// Teams that matches the primary coach and secondary coach
if($primaryCoachId >= 0) {
    $primaryTeams = $db->selectSingle("SELECT id_team FROM team WHERE id_coach_primary = ?", "i", $primaryCoachId);
    if(count($primaryTeams) > count($largestArray)) {
        $largestArray = $primaryTeams;
    }
}
if($secondaryCoachId >= 0) {
    $secondaryTeams = $db->selectSingle("SELECT id_team FROM team WHERE id_coach_secondary = ?", "i", $secondaryCoachId);
    if(count($secondaryTeams) > count($largestArray)) {
        $largestArray = $secondaryTeams;
    }
}

// ---- CALCULATE THE BEST SCORE FOR MATCHES ---- //
$pastScore = 0;
$score = 0;
$targetTeamId = -1;
for($a = 0; $a < count($largestArray); $a++) {
    $score = 0;
    if(in_array($largestArray[$a], $schoolTeams)) { // School
        $score = $score + 2;
    }
    if(in_array($largestArray[$a], $inviteTeams)) { // Invite
        $score = $score + 3;
    }
    if(in_array($largestArray[$a], $nameTeams)) { // Name
        $score = $score + 1;
    }
    if(in_array($largestArray[$a], $primaryTeams)) { // Primary Coached
        $score = $score + 1;
    }
    if(in_array($largestArray[$a], $secondaryTeams)) { // Secondary Coached
        $score = $score + 1;
    }
    
    if($score > $pastScore) {
        $targetTeamId = $largestArray[$a];
        $pastScore = $score;
    }
}
// If no team was found, exit and report error
if($targetTeamId < 0) {
    sendResponse(array("status" => -5, "substatus" => 1, "error_info" => 
                      "info: {$schoolId}, {$inviteCode}, {$primaryCoachId}, {$secondaryCoachId}"));
}

// ---- PERFORM EXECUTIONS BASED ON INTENT ---- //
// Record team info
$teamData = $db->selectMultiple("SELECT * FROM team WHERE id_team = ?", "i", $targetTeamId);
if(count($teamData > 0)) {
    $teamData = $teamData[0];
} else {
    sendResponse(array("status" => -5, "substatus" => 4, "error_info" => ($db->getDatabaseError())));
}
// -- Send team data -- //
if($intent == 0) {
    // TODO: Make sure this works
    sendResponse((array("status" => 5, "substatus" => 0, "error_info" => "na") + $teamData));
    
// -- Get team role -- //
} else if($intent == 1) {
    
    if($teamData["id_coach_primary"] == $accountId) {
        sendResponse(array("status" => 5, "substatus" => 0, "error_info" => "primary coach"));
    } else if($teamData["id_coach_secondary"] == $accountId) {
        sendResponse(array("status" => 5, "substatus" => 0, "error_info" => "secondary coach"));
    } else if(count($db->selectSingle("SELECT id_user FROM user WHERE id_user = ? AND id_team = ?", 
                                      "ii", $accountId, $targetTeamId)) > 0) {
        sendResponse(array("status" => 5, "substatus" => 0, "error_info" => "athlete"));
    } else {
        sendResponse(array("status" => 5, "substatus" => 0, "error_info" => "no role"));
    }
    
// -- Join team -- //
} else if($intent == 2) {
    if($teamData["is_locked"] == false) {
        $success = $db->modifyRecord("user", array("id_team" => $targetTeamId), "id_user", $accoundId);
        if($success) {
            sendResponse(array("status" => 5, "substatus" => 0, "error_info" => "na"));
        } else {
            sendResponse(array("status" => -5, "substatus" => 4, "error_info" => ($db->getDatabaseError())));
        }
    } else {
        sendReponse(array("status" => -5, "substatus" => 2, "error_info" => "team is locked"));
    }
    
// -- Leave team -- //
} else if($intent == 3) {
    // If the leaving user isn't a coach, let them leave ("if you love something, you let it go")
    if(($accountId != $teamData["id_coach_primary"]) && ($accountId != $teamData["id_coach_secondary"])) {
        // TODO: Make sure NULL is fine. If not, use "NULL"
        $success = $db->modifyRecord("user", array("id_team" => NULL), "id_user", $accountId);
        
    // If there is another coach, make them the primary coach now
    } else if($accountId == $teamData["id_coach_primary"]) {
        if($teamData["id_coach_secondary"] != NULL) {
            $success = $db->modifyRecord("team", array("id_coach_primary" => $teamData["id_coach_secondary"], 
                                           "id_coach_secondary" => NULL), "id_team", $targetTeamId);
            // TODO: Make sure this works as desired \/
            $success = ($success) && ($db->modifyRecord("user", array("id_team" => NULL), "id_user", $accountId));
        } else {
            // A team can't be coach-less, so they can't leave
            sendReponse(array("status" => -5, "substatus" => 2, "error_info" => "only coach cannot leave"));
        }
        
    } else if($accountId == $teamData["id_coach_secondary"]) {
        if($teamData["id_coach_primary"] != NULL) {
            $success = $db->modifyRecord("team", array("id_coach_secondary" => NULL), "id_team", $targetTeamId);
        } else {
            // Since the primary coach is NULL, make secondary coach primary
            $db->modifyRecord("team", array("id_coach_primary" => $teamData["id_coach_secondary"], 
                                           "id_coach_secondary" => NULL), "id_team", $targetTeamId);
            // A team can't be coach-less, so they can't leave
            sendReponse(array("status" => -5, "substatus" => 2, "error_info" => "only coach cannot leave"));
        }
    } else {
        sendResponse(array("status" => -5, "substatus" => 5, "error_info" => "user role unknown"));
    }
    
    // If modifyRecord succeeded, send a good response
    if($success) {
        sendResponse(array("status" => 5, "substatus" => 0, "error_info" => "na"));
    } else {
        sendResponse(array("status" => -5, "substatus" => 4, "error_info" => ($db->getDatabaseError())));
    }
    
// -- Kick from team -- //
} else if($intent == 4) {
    // Make sure the kicked_user is set
    $kickedId = -1;
    // CLEANUP: $_GET to $_POST
    if(isset($_GET["kicked_user"])) {
        
    }
    
}

// TOOD: Make sure that appointed coaches aren't already a coach!



// Generate the response for the client

// Should contain the following:
// - status
// - substatus
// - error_info (if error), contains key variables involved in error



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
        // {x} = charAt(x)
        $code = $code . $seed{$pos};
    }
    return $code;
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
