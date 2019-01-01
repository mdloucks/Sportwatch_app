<?php

// Check to make sure the parameter exists / is valid
// CLEANUP: Uncomment
// if(!isset($_POST["account_email"])) {
//     header("Location: https://www.sportwatch.us");
//     exit();
// }

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require("../wp-content/themes/primer/sw-db.php");
$db = new DatabaseConnection();
$CODE_LENGTH = 7; // Base length of random generated code

$schoolId = -1;
$primaryCoachId = -1;
$secondaryCoachId = -1;
$inviteCode = "";

$fields = array();
$values = array();

// ---- Perform safety / error checks ---- //
if(isset($_GET["school"])) {
    // CLEANUP: Change _GET to _POST
    $schoolId = $db->selectSingle("SELECT id_school FROM school WHERE school_name = ?", "s", str_replace("_", " ", $_GET["school"]));
    if(($schoolId === false) || (count($schoolId) < 1)) {
        $schoolId = -2;
    } else {
        $schoolId = $schoolId[0];
        $fields[] = "id_school";
        $values[] = $schoolId;
    }
}
if(isset($_GET["primary_coach"])) {
    // CLEANUP: Change _GET to _POST
    $primaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $_GET["primary_coach"]);
    if(($primaryCoachId === false) || (count($primaryCoachId) < 1)) {
        // -2 to signify that an email was given, but it was invalid
        $primaryCoachId = -2;
    } else {
        $primaryCoachId = $primaryCoachId[0];
        $fields[] = "id_coach_primary";
        $values[] = $primaryCoachId;
    }
}
if(isset($_GET["secondary_coach"])) {
    // CLEANUP: Change _GET to _POST
    $secondaryCoachId = $db->selectSingle("SELECT id_user FROM user WHERE email = ?", "s", $_GET["secondary_coach"]);
    if(($secondaryCoachId === false) || (count($secondaryCoachId) < 1)) {
        $secondaryCoachId = -2;
    } else {
        $secondaryCoachId = $secondaryCoachId[0];
        $fields[] = "id_coach_secondary";
        $values[] = $secondaryCoachId;
    }
}
if(isset($_GET["invite_code"])) {
    // CLEANUP: Change _GET to _POST
    $inviteCode = $_GET["invite_code"];
}

// If code is short or already in database, re-generate
if((strlen($inviteCode) != 7) || ($db->selectMultiple("SELECT * FROM team WHERE invite_code = ?", "s", $inviteCode))) {
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

if(isset($_GET["is_locked"])) {
    // CLEANUP: Change _GET to _POST
    if($_GET["is_locked"] == 1) {
        $fields[] = "is_locked";
        $values[] = 1;
    }
} // Otherwise keep as default = false

// ---- Create team if there is enough information ---- //
if(($schoolId > 0) || ($primaryCoachId > 0) || ($secondaryCoachId > 0)) {
    
    $dataArray = array();
    for($d = 0; $d < count($fields); $d++) {
        $dataArray[$fields[$d]] = $values[$d];
    }
    
    // TODO: Add a check to see if similar teams exist
    //       Allow team creation if POST variable: force=1
    $didSucceed = $db->insertValues("team", $dataArray);
    
    if($didSucceed) {
        
        // Find out if there were any minor errors
        $substat = 0;
        $errorInfoMessage = "na";
        if($primaryCoachId == -2) {
            $substat = 1;
            $errorInfoMessage = "provided primary coach: " . $_GET["primary_coach"];
        } else if($secondaryCoachId == -2) {
            $substat = 2;
            $errorInfoMessage = "provided secondary coach: " . $_GET["secondary_coach"];
        } else if($schoolId == -2) {
            $substat = 3;
            // CLEANUP: Change to _POST
            $errorInfoMessage = "provided school: " . $_GET["school"];
        } else if($schoolId == -1) {
            $substat = 4;
            $errorInfoMessage = "no school provided";
        }
        
        // Add underscores to school (if given)
        if(isset($dataArray["id_school"])) {
            $dataArray["school_name"] = 
                $db->selectSingle("SELECT school_name FROM school WHERE id_school = ?", "i", $dataArray["id_school"])[0];
        } else {
            $dataArray["school_name"] = "NULL";
        }
        
        sendResponse(array("status" => 4, "substatus" => $substat, "invite_code" => 
                           $dataArray["invite_code"], "school_name" => $dataArray["school_name"],
                           "error_info" => $errorInfoMessage));
    } else {
        sendResponse(array("status" => -4, "substatus" => 1, "error_info" => ($db->getDatabaseError())));
    }
    
} else {
    sendResponse(array("status" => -4, "substatus" => 0, "error_info" => 
                       "info: {$schoolId}, {$primaryCoachId}, {$secondaryCoachId}"));
}
// Just a fail-safe
sendResponse(array("status" => -4, "substatus" => 2, "error_info" => "improper exit"));


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
