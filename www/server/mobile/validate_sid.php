<?php
    if(isset($_POST["SID"])) {
        
        require("../wp-content/themes/primer/sw-db.php");
        $db = new DatabaseConnection();
        
        $response = array();
        
        if($db->validateSID($_POST["SID"])) {
            $response["status"] = 2;
        } else {
            $response["status"] = -2;
        }
        
        $json = json_encode();
        echo $json;
                
    } else {
        header("Location : https://www.sportwatch.us");
        exit();
    }
?>

