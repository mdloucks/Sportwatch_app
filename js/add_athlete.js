function add_athletePage() {

    this.addAthlete = function() {
        throw new Error("addAthlete not initialized in add_athletePage");
    }

    this.onAthleteAdded = function(cb) {
        this.addAthlete = cb;
    }

    // https://codepen.io/w3programmings/pen/zzRKpy COOL STUFFS
    $("#app").html(`
    <form id="add_athlete_form">
        <label for="fname">First Name</label>
        <input type="text" name="fname"></input><br>
        <label for="lname">Last Name</label>
        <input type="text" name="lname"></input><br>
        <label for="grade">Grade</label>
        <input type="text" name="grade"></input><br>
        <label for="gender">Male</label>
        <input type="radio" name="gender" value="m"></input>
        <label for="gender">Female</label>
        <input type="radio" name="gender" value="f"></input><br>
        <input type="submit" value="Submit"></input>
    </form>
    `);

    $("#add_athlete_form").submit((e) => { 
        e.preventDefault();
        let db = new DatabaseConnection();

        let fname = $("input[name=fname]").val();
        let lname = $("input[name=lname]").val();
        let grade = $("input[name=grade]").val();
        let gender = $("input[name=gender]:checked").val();

        if(this.validateData(fname, lname, grade, gender)) {
            console.log("added athlete: " + fname, lname, grade, gender);
            db.addAthlete([fname, lname, grade, gender]);
            this.addAthlete();
        } else {
            console.log("incorrect data type!");
        }
    });

    this.validateData = function(fname, lname, grade, gender) {
        // TODO: validate data
        return true;
    }
    
    CSSManager.styleAthlete_addPage();
}