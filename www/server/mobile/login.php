<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// TODO properly rework these include paths
require("../wp-content/themes/primer/sw-db.php");
$db = new DatabaseConnection();

// TODO IMPLEMENT IP TRACKER WHICH ONLY ALLOWS 10 logins or something

// response json
$response = array();

/**
 * SID status codes
 * 
 * negative numbers are just failed versions of the positive
 * 
 *  0 : no session id or password is set yet
 *  1 : SID login success
 *  2 : email/password login success
 *  3 : sign up successful
 */
if(isset($_POST["SID"])) {
    
    if($db->validateSID($_POST["SID"])) {
        $response["status"] = 1;
    } else {
        $response["status"] = -1;
        $response["substatus"] = 0;
    }
    endResponse($response);
} 

// redirect a user not using ajax back to the main site, they don't need this
if(!isset($_POST["email"]) || !isset($_POST["password"]) && (!isset($_POST["SID"]))) {
    header("Location: https://www.sportwatch.us/");
    die();
}

// verify login and create a session
if($db->validateLogin($_POST["email"], $_POST["password"])) {
    session_start();
    
    // they might not set an id, but it could still be saved in the database, or the user may not know their id
    if($db->validateSID(session_id())) {
        $response["status"] = 1;
        $response["SID"] = session_id();
        endResponse($response);
    } else {
        $db->addUserSessionData(array(
            "id_user" => $db->getUserId($_POST["email"]),
            "SID" => session_id(),
            "ip" => $_SERVER["REMOTE_ADDR"],
            "machine" => $_SERVER["HTTP_USER_AGENT"]
        ));   
    }
    
    $response["SID"] = session_id();
    $response["status"] = 2;
    endResponse($response);
} else {
    $response["status"] = -2;
    $response["substatus"] = 0;
    endResponse($response);
}

function endResponse($response) {
    $json = json_encode($response);
    echo $json;
    exit();
}
