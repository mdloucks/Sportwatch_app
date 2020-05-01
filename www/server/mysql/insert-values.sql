INSERT INTO meet (meet_name, meet_time, meet_address, meet_city, meet_state, meet_zip)
VALUES ("Hemlock Classic", '1970-01-01 05:30:01.000000', "733 N Hemlock Rd.", "Hemlock", "MI", 48626);

INSERT INTO school (school_name, school_address, school_city, school_state, school_zip)
VALUES ("Merill High School", "123 example St.", "Merill", "MI", "48626");

INSERT INTO school (school_name, school_address, school_city, school_state, school_zip)
VALUES ("Hemlock High School", "733 N Hemlock Rd.", "Hemlock ", "MI", "48626");

INSERT INTO meet_school (id_meet, id_school) VALUES (1, 1);
INSERT INTO meet_school (id_meet, id_school) VALUES(1, 2);

INSERT INTO team (invite_code, id_school, id_coach_primary, id_coach_secondary)
VALUES ("6e3bs36", 2, 1, 3);

INSERT INTO user (fname, lname, gender, state, email, hash, dob, isAdmin, id_school)
VALUES ("John", "Smith", "M", "MI", "example@email.com", "hash", "1999-5,12", false, 2);

INSERT INTO user (fname, lname, gender, state, email, hash, dob, isAdmin, id_school)
VALUES ("Bill", "Washington", "M", "MI", "example123@email.com", "hash", "1999-5,14", false, 2);

INSERT INTO user (fname, lname, gender, state, email, hash, dob, isAdmin, id_school)
VALUES ("Dan", "Wright", "M", "MI", "example435@email.com", "hash", "1979-5,12", false, 1);

INSERT INTO user_session_data (id_user, SID, ip, machine) VALUES (1, "12345", "1.1.1.1", "android");

#INSERT INTO user_setting (id_user, doEmailEvents, doTextEvents, doEmailMessages, doTextMessages, doEmailSportwatch, doTextSportwatch)
#VALUES (1, false, true, false, false, true, false);

INSERT INTO event (id_meet, event_name, isOfficial)
VALUES(1, "100m", true);

INSERT INTO event (id_meet, event_name, isOfficial)
VALUES(1, "200m", true);

INSERT INTO event_result (id_user, id_event, result)
VALUES (1, 1, 10.54);

INSERT INTO event_result (id_user, id_event, result)
VALUES (1, 2, 23.23);

INSERT INTO event_result (id_user, id_event, result)
VALUES (2, 1, 12.23);

INSERT INTO event_result (id_user, id_event, result)
VALUES (2, 2, 22.23);

INSERT INTO event_result (id_user, id_event, result)
VALUES (3, 1, 12.54);

INSERT INTO event_result (id_user, id_event, result)
VALUES (3, 2, 25.23);

INSERT INTO meet_event (id_meet, id_event)
VALUES (1, 1);

INSERT INTO meet_event (id_meet, id_event)
VALUES (1, 2);

