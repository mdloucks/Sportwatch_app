<?php

if(!isset($_POST["email"]) || !isset($_POST["password"])) {
    header("Location: https://www.sportwatch.us");
    exit();
}

require("../wp-content/themes/primer/sw-db.php");
$db = new DatabaseConnection();

// response json
$response = array();

$email = trim($_POST["email"]);
$password = trim($_POST["password"]);
$account_type = trim($_POST["account_type"]);

// invalid email format
if(filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    $response["status"] = -3;
    $response["substatus"] = 0;
    endResponse($response);
}

$domain = substr($email, strrpos($email, '@') + 1);

// domain doesn't have a mail record
if(checkdnsrr($domain, "MX") === false) {
    $response["status"] = -3;
    $response["substatus"] = 1;
    endResponse($response);
}

if($db->emailExists($email)) {
    $response["status"] = -3;
    $response["substatus"] = 2;
    endResponse($response);
}

if(validatePassword($password) === false) {
    $response["status"] = -3;
    $response["substatus"] = 3;
    endResponse($response);
}

// TODO ADD ACCOUNT_TYPE
// He did the monster Hash... (The monster hash!) It was a graveyard graph!
$isSuccess = $db->addUser(array(
   "email" => $_POST["email"],
   "hash" => password_hash($_POST["password"], PASSWORD_DEFAULT),
   "account_type" => $account_type
));

// 3 for successful signup
if($isSuccess) {
    
    session_start();
    
    /**
     * It is possible that the user will receive the same session id
     * when they sign up or log in with a similar environment such as ip address
     * or their device.
     * 
     * This should create a new id for them, allowing them to have multiple
     * session id's for different accounts regardless of where they create it.
     */
    if($db->sessionExists(session_id())) {
        session_regenerate_id();
    }
    
    // TODO ADD DUPLICATE CHECKING
    $db->addUserSessionData(array(
        "id_user" => $db->getUserId($_POST["email"]),
        "SID" => session_id(),
        "ip" => $_SERVER["REMOTE_ADDR"],
        "machine" => $_SERVER["HTTP_USER_AGENT"]
    ));
    
    $response["SID"] = session_id();
    $response["status"] = 3;
    $response["substatus"] = 0;
    endResponse($response);
}

function endResponse($response) {
    $json = json_encode($response);
    echo $json;
    exit();
}

// check to make sure the user has a secure password
function validatePassword($pass) {
    
    // at least 8 long
    if(strlen($pass) < 8) {
        return false;
    }
    
    return true;
}
