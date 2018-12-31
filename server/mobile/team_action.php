<?php

// Check to make sure the parameter exists / is valid
// CLEANUP: Uncomment
// if((!isset($_POST["intent"])) || (!isset($_POST("account_email)))) {
//     header("Location: https://www.sportwatch.us");
//     exit();
// }

// Cleanup / TODO: Impletemnet SID check

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
 *   -  kicked_user: [string] email of kicked athlete
 *   -  promoted_user: [sring] email of promoted athlete
 *   -  new_name: [string] new name of team
 *   -  new_code: [*string*] new invite code
 * 
 * Intents:
 *   0  : pull all information of team (id, invite code, school, etc.)
 *   1  : get team roster (list of athletes and coach's names)
 *   2  : get account role (athlete, primary coach, secondary, etc.)
 *   3  : join team
 *   4  : leave team
 *   5  : kick athlete or secondary coach (must be coach initiated)
 *         - requires extra kicked_athlete POST variable
 *   6  : appoint primary coach (coach only)
 *         - requires extra promoted_user POST variable
 *         - demotes current primary coach (if any) to secondary
 *   7  : appoint secondary coach (coach only)
 *         - requires extra promoted_user POST variable
 *         - demotes current secondary (if any) to athlete
 *   8  : demote coach (coach only)
 *         - requires extra demoted_email POST variable
 *   9  : lock team (coach only)
 *         - toggles; if locked, will unlock; if unlocked, will lock
 *   10 : change team name (coach only)
 *         - requires extra new_name POST variable
 *   11 : regenerate invite code (coach only)
 *         - optional new_code POST variable
 *   12 : delete team (coach only)
 * 
 * Examples:
 * See shared document ("Team Action Documentation")
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require("../wp-content/themes/primer/sw-db.php");
$db = new DatabaseConnection();
$CODE_LENGTH = 7; // Base length of random generated code

$intent = getVar("intent");
$accountId = -1; // Account initiating the call
$schoolId = -1; // Team identifying variables below
$inviteCode = getVar("invite_code");
$teamName = getVar("team_name");
$primaryCoachEmail = getVar("primary_coach");
$primaryCoachId = -1;
$secondaryCoachEmail = getVar("secondary_coach");
$secondaryCoachId = -1;

// $db->insertValues("team", array("invite_code" => "ffj3ds5", "team_name" => "Hemlock", "id_school" => 2,
//                                "id_coach_primary" => 2, "id_coach_secondary" => 1, "is_locked" => 1));

// $db->modifyRecord("team", array("id_coach_secondary" => 5), "id_team", 5);
// die();

if($intent === false) {
    sendResponse(array("status" => -5, "substatus" => 3, "info" => "no intent"));
}
if(!getVar("account_email")) {
    sendResponse(array("status" => -5, "substatus" => 3, "info" => "no user email"));
}
$accountId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("account_email"));
if((count($accountId) > 0) && ($db->emailExists(getVar("account_email")))) {
    $accountId = $accountId[0];
} else {
    sendResponse(array("status" => -5, "substatus" => 7, "info" => "provided email: " . getVar("account_email")));
}

// ---- PARSE TEAM IDENTIFIER VARIABLES ---- //

$schoolName = getVar("school_name");
if($schoolName != false) {
    $schoolId = $db->selectSingle("SELECT id_school FROM school WHERE school_name = ?", "s", $schoolName);
    if(count($schoolId) > 0) {
        $schoolId = $schoolId[0];
    } else {
        $schoolId = -1;
    }
}
if(strlen($inviteCode) != $CODE_LENGTH) {
    $inviteCode = "NULL";
}
if(strlen($teamName) <= 5) {
    $teamName = "";
}
if($primaryCoachEmail != NULL) {
    $primaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $primaryCoachEmail);
    if(count($primaryCoachId) > 0) {
        $primaryCoachId = $primaryCoachId[0];
    } else {
        $primaryCoachId = -1;
    }
}
if($secondaryCoachEmail != false) {
    $secondaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $secondaryCoachEmail);
    if(count($secondaryCoachId) > 0) {
        $secondaryCoachId = $secondaryCoachId[0];
    } else {
        $secondaryCoachId = -1;
    }
}

// ---- TRY FINDING THE TEAM WITH BEST MATCH TO PROVIDED INFO ---- //

$targetTeamId = getVar("id_team");
if($targetTeamId !== false) { // TODO: Make sure this won't flag a id = 0
    // If the team doesn't exists, error
    if(count($db->selectSingle("SELECT invite_code FROM team WHERE id_team = ?", "i", $targetTeamId)) < 1) {
        sendResponse(array("status" => -5, "substatus" => 6, "info" => "invalid team id"));
    }
} else {
    
    $largestArray = array();
    // Arrays that will be used to cross-reference later
    $schoolTeams = array();
    $inviteTeams = array(); // Teams with matching invite code
    $nameTeams = array();
    $primaryTeams = array();
    $secondaryTeams = array();
    
    if($schoolId >= 0) {
        $schoolTeams = $db->selectSingle("SELECT id_team FROM team WHERE id_school = ?", "i", $schoolId);
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
    $sameScore = false; // Determines if there are two matches
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
        
        // Make sure there aren't two matches
        if($score == $pastScore) {
            $sameScore = true;
        }
        if($score > $pastScore) {
            $targetTeamId = $largestArray[$a];
        }
        if($score > $pastScore) {
            $pastScore = $score;
            $sameScore = false;
        }
    }
    // If there were duplicates, invalidate the id
    if($sameScore) {
        $targetTeamId = -1;
    }
    // If no team was found, exit and report error
    if($targetTeamId < 0) {
        if($sameScore) { // Human-readable conversion
            $sameScore = "true";
        } else {
            $sameScore = "false";
        }
        sendResponse(array("status" => -5, "substatus" => 5, "info" => 
                           "accuracy = {$pastScore} of 8. duplicates: {$sameScore}"));
    }
}

// ---- PERFORM EXECUTIONS BASED ON INTENT ---- //
// Record team info
$teamData = $db->selectMultiple("SELECT * FROM team WHERE id_team = ?", "i", $targetTeamId);
if(count($teamData > 0)) {
    $teamData = $teamData[0];
    $teamData = cleanTeam($teamData, $accountId, $db);
    if($teamData == false) {
        sendResponse(array("status" => -5, "substatus" => 1, "info" => ($db->getDatabaseError())));
    }
} else {
    sendResponse(array("status" => -5, "substatus" => 1, "info" => ($db->getDatabaseError())));
}
$success = true; // To prevent undefined below

// -- Send team data -- //
if($intent == 0) {
    // Convert spaces to underscores where applicable
    if($teamData["id_school"] != NULL) {
        $teamData["school_name"] = $db->selectSingle("SELECT school_name FROM school WHERE id_school = ?",
                                                     "i", $teamData["id_school"])[0];
        $teamData["school_name"] = str_replace(" ", "_", $teamData["school_name"]);
    }
    if($teamData["team_name"]) {
        $teamData["team_name"] = str_replace(" ", "_", $teamData["team_name"]);
    }
    sendResponse((array("status" => 5, "substatus" => 0, "info" => "na") + $teamData));
    
// -- Send team roster --//
} else if($intent == 1) {
    $enrolledId = $db->selectSingle("SELECT id_user FROM user_team WHERE id_team = ?", "i", $targetTeamId);
    $enrolledName = array();
    for($u = 0; $u < count($enrolledId); $u++) {
        // Don't include coaches in the roster here
        if(($enrolledId[$u] == $teamData["id_coach_primary"]) || ($enrolledId[$u] == $teamData["id_coach_secondary"])) {
            continue;
        }
        
        $currentName = $db->getUserName($enrolledId[$u]);
        if($currentName != false) {
            // Push to name array
            $enrolledName[] = clean($currentName);
        } else {
            // Remove users that don't exist anymore
            $db->deleteRecord("user_team", array("id_user" => $enrolledId[$u], "id_team" => $targetTeamId));
        }
    }
    // Coaches
    $coachArray = array(); // Will be used to streamline response
    $primaryName = $db->getUserName($teamData["id_coach_primary"]);
    if($primaryName != false) {
        $primaryName = str_replace(" ", "_", $primaryName);
        $coachArray["primary_coach"] = $primaryName;
    }
    $secondaryName = $db->getUserName($teamData["id_coach_secondary"]);
    if($secondaryName != false) {
        $secondaryName = str_replace(" ", "_", $secondaryName);
        $coachArray["secondary_coach"] = $secondaryName;
    }
    // And then, ya just gotta send it...
    if(count($enrolledName) > 0) {
        sendResponse(array("status" => 5, "substatus" => 0, "info" => "na", "athletes" => $enrolledName) + $coachArray);
    } else {
        sendResponse(array("status" => -5, "substatus" => 0, "info" => "team had no members"));
    }
    
// -- Get team role -- //
} else if($intent == 2) {
    $role = "no role";
    if($teamData["id_coach_primary"] == $accountId) {
        $role = "primary_coach";
    } else if($teamData["id_coach_secondary"] == $accountId) {
        $role = "secondary_coach";
    } else if(count($db->selectSingle("SELECT 1 FROM user_team WHERE id_user = ? AND id_team = ?", 
                                      "ii", $accountId, $targetTeamId)) > 0) {
        $role = "athlete";
    }
    sendResponse(array("status" => 5, "substatus" => 0, "info" => "na", "role" => $role));
    
// -- Join team -- //
} else if($intent == 3) {
    if($teamData["is_locked"] == false) {
        if($db->isInTeam($accountId, $targetTeamId)) {
            sendResponse(array("status" => 5, "substatus" => 2, "info" => "already in team"));
        } else {
            $success = $db->joinTeam($accountId, $targetTeamId);
        }
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "team is locked"));
    }
    
// -- Leave team -- //
} else if($intent == 4) {
    // Make sure the user is actually a part of the team
    if(!$db->isInTeam($accountId, $targetTeamId)) {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "user not in team"));
    }
    // If there is another coach, make them the primary coach now
    if($accountId == $teamData["id_coach_primary"]) {
        if($teamData["id_coach_secondary"] != NULL) {
            $success = $db->modifyRecord("team", array("id_coach_primary" => $teamData["id_coach_secondary"],
                                                       "id_coach_Secondary" => NULL), "id_team", $targetTeamId);
        } else {
            // A team can't be coach-less, so they can't leave
            sendResponse(array("status" => -5, "substatus" => 2, "info" => "only coach cannot leave"));
        }
        
    } else if($accountId == $teamData["id_coach_secondary"]) {
        if($teamData["id_coach_primary"] != NULL) {
            $success = $db->modifyRecord("team", array("id_coach_secondary" => NULL), "id_team", $targetTeamId);
        } else {
            // Since the primary coach is NULL, make secondary coach primary
            $success = $db->modifyRecord("team", array("id_coach_primary" => $teamData["id_coach_secondary"],
                                                       "id_coach_secondary" => NULL), "id_team", $targetTeamId);
            // A team can't be coach-less, so they can't leave
            sendResponse(array("status" => -5, "substatus" => 2, "info" => "only coach cannot leave"));
        }
    }
    // Remove their id_team value from user table
    $success  = ($success) &&  ($db->deleteRecord("user_team", array("id_user" => $accountId, 
                                                                      "id_team" => $targetTeamId)));
    
// -- Kick from team -- //
} else if($intent == 5) {
    // Make sure the kicked_user is set
    $kickedId = -1;
    if(getVar("kicked_email") != false) {
        $kickedId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("kicked_email"));
        if(count($kickedId) > 0) {
            $kickedId = $kickedId[0];
        } else {
            $kickedId = -1;
        }
    }
    // Make sure the initiated user is a coach. If not, error
    if(($accountId != $teamData["id_coach_primary"]) && ($accountId != $teamData["id_coach_secondary"])) {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "coach-only action"));
    }
    if($kickedId < 0) {
        sendResponse(array("status" => -5, "substatus" => 3, "info" => 
                           "kicked_email was invalid: " . getVar("kicked_email")));
    }
    // Make sure kicked user is a part of the forbidden team
    if(!$db->isInTeam($kickedId, $targetTeamId)) {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => 
                           "user " . getVar("kicked_email") . " is not in team " . $teamData["team_name"]));
    }
    // You can't overthrow the kind (primary coach)
    if($kickedId == $teamData["id_coach_primary"]) {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "cannot kick primary coach"));
    }
    // Is the secondary coach being banished?
    if(($accountId == $teamData["id_coach_primary"]) && ($kickedId == $teamData["id_coach_secondary"])) {
        $success = $db->modifyRecord("team", array("id_coach_secondary" => NULL), "id_team", $targetTeamId);
    }
    // Remove the user_team record
    $success = ($success) && ($db->deleteRecord("user_team", array("id_user" => $kickedId, "id_team" => $targetTeamId)));
    
// -- Appoint primary coach -- //
} else if($intent == 6) {
    $promotedId = -1;
    if(getVar("promoted_email") != false) {
        $promotedId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("promoted_email"));
        if(count($promotedId) > 0) {
            $promotedId = $promotedId[0];
        } else {
            $promotedId = -1;
        }
    }
    if($promotedId < 0) {
        sendResponse(array("status" => -5, "substatus" => 3, "info" => 
                           "promoted_email was invalid: " . getVar("promoted_email")));
    }
    if($promotedId == $teamData["id_coach_primary"]) {
        sendResponse(array("status" => 5, "substatus" => 2, "info" => "already primary coach"));
    }
    
    if($accountId == $teamData["id_coach_primary"]) {
        // Demote secondary coach to athlete
        $teamData["id_coach_secondary"] = $teamData["id_coach_primary"];
        // Make the promoted user a part of the team
        $success = $db->joinTeam($promotedId, $targetTeamId);
        $teamData["id_coach_primary"] = $promotedId;
        $success = ($success) && ($db->modifyRecord("team", array("id_coach_primary" => $teamData["id_coach_primary"],
                                                                 "id_coach_secondary" => $teamData["id_coach_secondary"]),
                                                  "id_team", $targetTeamId));
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "primary coach-only action"));
    }
    
// -- Appoint secondary coach -- //
} else if($intent == 7) {
    $promotedId = -1;
    if(getVar("promoted_email") != false) {
        $promotedId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("promoted_email"));
        if(count($promotedId) > 0) {
            $promotedId = $promotedId[0];
        } else {
            $promotedId = -1;
        }
    }
    // Appoint the user to secondary coach
    if(($accountId == $teamData["id_coach_primary"]) || ($accountId == $teamData["id_coach_secondary"])) {
        // Do some safety checks here
        if($promotedId < 0) {
            sendResponse(array("status" => -5, "substatus" => 3, "info" => 
                               "promoted_email was invalid: " . getVar("promoted_email")));
        }
        if(($promotedId == $teamData["id_coach_primary"]) || ($promotedId == $teamData["id_coach_secondary"])) {
            sendResponse(array("status" => 5, "substatus" => 2, "info" => "already a coach"));
        }
        
        // Make the promoted user a part of the team
        $success = $db->joinTeam($promotedId, $targetTeamId);
        $success = ($success) && ($db->modifyRecord("team", array("id_coach_secondary" => $promotedId), 
                                                                 "id_team", $targetTeamId));
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "coach-only action"));
    }
    
// -- Demote coach -- //
} else if($intent == 8) {
    $demotedId = -1;
    if(getVar("demoted_email") != false) {
        $demotedId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", getVar("demoted_email"));
        if(count($demotedId) > 0) {
            $demotedId = $demotedId[0];
        } else {
            $demotedId = -1;
        }
    }
    if($demotedId < 0) {
        sendResponse(array("status" => -5, "substatus" => 3, "info" => 
                           "demoted_email was invalid: " . getVar("demoted_email")));
    }
    // Is the demoted user is a coach?
    if(($demotedId != $teamData["id_coach_primary"]) && ($demotedId != $teamData["id_coach_secondary"])) {
        sendResponse(array("status" => -5, "substatus" => 2, "info" =>
                           getVar("demoted_email") . " is not a coach in team " . $teamData["team_name"]));
    }
    // Make sure the primary coach is the one demoting
    if($accountId == $teamData["id_coach_primary"]) {
        if($demotedId == $teamData["id_coach_primary"]) {
            if($teamData["id_coach_secondary"] != NULL) { // Swap primary and secondary
                $success = $db->modifyRecord("team", array("id_coach_primary" => $teamData["id_coach_secondary"],
                                                           "id_coach_secondary" => $teamData["id_coach_primary"]),
                                            "id_team", $targetTeamId);
            } else {
                sendResponse(array("status" => -5, "substatus" => 2, "info" => "team must have primary coach"));
            }
        } else if($demotedId == $teamData["id_coach_secondary"]) {
            $success = $db->modifyRecord("team", array("id_coach_secondary" => NULL), "id_team", $targetTeamId);
        }
    // If the secondary coach is doing the demoting...
    } else if($accountId == $teamData["id_coach_secondary"]) {
        if($demotedId == $teamData["id_coach_primary"]) {
            sendResponse(array("status" => -5, "substatus" => 2, "info" => "secondary coach cannot demote primary coach"));
        } else if(($demotedId == $teamData["id_coach_secondary"]) && ($teamData["id_coach_primary"] != NULL)) {
            $success = $db->modifyRecord("team", array("id_coach_secondary" => NULL), "id_team", $targetTeamId);
        } else {
            sendResponse(array("status" => -5, "substatus" => 2, "info" => "team cannot be coach-less"));
        }
    } else { // And if the user wasn't even a coach
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "coach-only action"));
    }
    
// -- Lock team -- //
} else if($intent == 9) {
    if(($accountId == $teamData["id_coach_primary"]) || ($accountId == $teamData["id_coach_secondary"])) {
        $lockState = 1; // 0->unlocked, 1->locked
        if($teamData["is_locked"] == 1) {
            $lockState = 0;
        } // Else go with default of  locked = 1
        $success = $db->modifyRecord("team", array("is_locked" => $lockState), "id_team", $targetTeamId);
        if($success) {
            // Send now in order to give new lock state
            sendResponse(array("status" => 5, "substatus" => 0, "info" => "na", "is_locked" => $lockState));
        }
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "coach-only action"));
    }
    
// -- Change team name -- //
} else if($intent == 10) {
    $newName = getVar("new_name");
    if(strlen($newName) <= 5) {
        sendResponse(array("status" => -5, "substatus" => 3, "info" => "invalid or short name: " . $newName));
    }
    if(($accountId == $teamData["id_coach_primary"]) || ($accountId == $teamData["id_coach_secondary"])) {
        $success = $db->modifyRecord("team", array("team_name" => $newName), "id_team", $targetTeamId);
        if($success) {
            sendResponse(array("status" => 5, "substatus" => 0, "info" => "na", "team_name" => $newName));
        }
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "coach-only action"));
    }
    
// -- Change / re-generate invite code -- //
} else if($intent == 11) {
    $newCode = getVar("new_code");
    // Remove anything that isn't a letter or number
    $newCode = preg_replace("/[^A-Za-z0-9]/", "", $newCode);
    $wasInvalid = false;
    if(($newCode != false) && (strlen($newCode) != $CODE_LENGTH)) {
        $wasInvalid = true;
    }
    if(strlen($newCode) != $CODE_LENGTH) {
        $newCode = createCode($CODE_LENGTH);
    }
    if(($accountId == $teamData["id_coach_primary"]) || ($accountId == $teamData["id_coach_secondary"])) {
        $success = $db->modifyRecord("team", array("invite_code" => $newCode), "id_team", $targetTeamId);
        // Send now to include new invite code
        if(($success) && ($wasInvalid)) {
            sendResponse(array("status" => 5, "substatus" => 4, "info" => "code was too short", 
                               "invite_code" => $newCode));
        } else if($success) {
            sendResponse(array("status" => 5, "substatus" => 0, "info" => "na", "invite_code" => $newCode));
        }
        
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "coach-only action"));
    }
    
// -- Delete team -- //
} else if($intent == 12) {
    if($accountId == $teamData["id_coach_primary"]) {
        // Remove the users from this team (if there are any users)
        if(count($db->selectSingle("SELECT 1 FROM user_team WHERE id_team = ?", "i", $targetTeamId)) > 0) {
            $success = ($success) && ($db->deleteRecord("user_team", array("id_team" => $targetTeamId)));
        } // Else nothing, because there are no users to remove
        
        $success = $db->deleteRecord("team", array("id_team" => $targetTeamId));
    } else {
        sendResponse(array("status" => -5, "substatus" => 2, "info" => "primary coach-only action"));
    }
    
// -- Uknown intent -- //
} else {
    sendResponse(array("status" => -5, "substatus" => 4, "info" => "unknown intent"));
}


// If database action succeeded, send a good response
if($success) {
    sendResponse(array("status" => 5, "substatus" => 0, "info" => "na"));
} else {
    sendResponse(array("status" => -5, "substatus" => 1, "info" => ($db->getDatabaseError())));
}




/**
 * Cleans any errors within team data. i.e. duplicate coaches, 
 * no primary, etc.
 * 
 * Will save changes to database and return the cleaned array.
 * Returns false if a database error occurs
 * 
 * Example:
 * cleanTeam($teamData);
 * 
 * @param AssociativeArray $teamInfo - array of team's info, like coaches or name
 * @param Integer $sourceUserId - id of the user calling the request
 * @param DatabaseConnection $database - database object to be used in operations
 */
function cleanTeam($teamInfo, $sourceUserId, $database) {
    
    // Do the coaches still have valid accounts?
    $exists = $database->selectSingle("SELECT 1 FROM user WHERE id_user = ?", "i", $teamInfo["id_coach_primary"]);
    if(count($exists) < 1) {
        $teamInfo["id_coach_primary"] = NULL;
    }
    $exists = $database->selectSingle("SELECT 1 FROM user WHERE id_user = ?", "i", $teamInfo["id_coach_secondary"]);
    if(count($exists) < 1) {
        $teamInfo["id_coach_secondary"] = NULL;
    }
    
    // No coaches, so make the user calling this the brand new coach
    if(($teamInfo["id_coach_primary"] == NULL) && ($teamInfo["id_coach_secondary"] == NULL)) {
        $teamInfo["id_coach_primary"] = $sourceUserId;
    }
    
    // Same user can't be both coaches
    if($teamInfo["id_coach_primary"] == $teamInfo["id_coach_secondary"]) {
        $teamInfo["id_coach_secondary"] = NULL;
    }
    // No primary but secondary; make secondary primary
    if(($teamInfo["id_coach_primary"] == NULL && ($teamInfo["id_coach_secondary"] != NULL))) {
        $teamInfo["id_coach_primary"] = $teamInfo["id_coach_secondary"];
        $teamInfo["id_coach_secondary"] = NULL;
    }
    
    // These are the posers... the fake account still loitering. They must be PURGED
    $enrolledId = $database->selectSingle("SELECT id_user FROM user_team WHERE id_team = ?", "i", $teamInfo["id_team"]);
    for($u = 0; $u < count($enrolledId); $u++) {
        
        $currentUser = $database->selectSingle("SELECT 1 FROM user WHERE id_user = ?", "i", $enrolledId[$u]);
        if(count($currentUser) < 1) {
            // Remove users that don't exist anymore
            $database->deleteRecord("user_team", array("id_user" => $enrolledId[$u], "id_team" => $targetTeamId));
        }
    }
    
    // Save it to the db
    $status = $database->modifyRecord("team", $teamInfo, "id_team", $teamInfo["id_team"]);
    if($status) {
        return $teamInfo;
    } else {
        return false;
    }
}


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
