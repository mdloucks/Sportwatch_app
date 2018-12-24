SET FOREIGN_KEY_CHECKS = 0;
drop table if exists school;
drop table if exists meet;
drop table if exists user;
drop table if exists event;
drop table if exists meet_school;
drop table if exists event_result;
drop table if exists meet_event;
drop table if exists user_session_data;
drop table if exists user_setting;
SET FOREIGN_KEY_CHECKS = 1;


# meets will be the actual competition
CREATE TABLE meet (
    id_meet INT AUTO_INCREMENT,
    meet_name VARCHAR(255),
    meet_time DATETIME,
    meet_address VARCHAR(255),
    meet_city VARCHAR(255),
    meet_state VARCHAR(2),
    meet_zip VARCHAR(6),
    PRIMARY KEY(id_meet)
);

CREATE TABLE school (
    id_school INT AUTO_INCREMENT,
    school_name VARCHAR(255),
    school_address VARCHAR(255),
    school_city VARCHAR(255),
    school_state VARCHAR(2),
    school_zip VARCHAR(8),
    PRIMARY KEY(id_school)
);

# list of the schools attending the meets
CREATE TABLE meet_school (
    id_meet_school INT AUTO_INCREMENT,
    id_school INT NOT NULL,
    id_meet INT NOT NULL,
    PRIMARY KEY (id_meet_school),
    FOREIGN KEY (id_meet) REFERENCES meet(id_meet),
    FOREIGN KEY (id_school) REFERENCES school(id_school)
);

# list of teams / groups of students and coach
CREATE TABLE team (
    id_team INT AUTO_INCREMENT,
    invite_code VARCHAR(12) UNIQUE,
    team_name VARCHAR(75),
    id_school INT,
    id_coach_primary INT,
    id_coach_secondary INT,
    is_locked BOOLEAN DEFAULT 0,
    PRIMARY KEY(id_team),
    FOREIGN KEY (id_school) REFERENCES school(id_school),
    FOREIGN KEY (id_coach_primary) REFERENCES user(id_user),
    FOREIGN KEY (id_coach_secondary) REFERENCES user(id_user)
);

CREATE TABLE user (
    id_user INT AUTO_INCREMENT,
    fname VARCHAR(20),
    lname VARCHAR(20),
    gender ENUM("M", "F"),
    state CHAR(2),
    email VARCHAR(64) UNIQUE NOT NULL,
    hash CHAR(60) NOT NULL,
    account_type ENUM("Athlete", "Coach"),
    dob DATE,
    isAdmin BOOLEAN,
    id_school INT,
    id_team INT,
    cellNum VARCHAR(15),
    PRIMARY KEY(id_user),
    FOREIGN KEY (id_school) REFERENCES school(id_school),
    FOREIGN KEY (id_team) REFERENCES team(id_team)
);

CREATE TABLE user_session_data (
    id_user INT,
    SID CHAR(128),
    ip CHAR(15),
    machine CHAR(255),
    PRIMARY KEY(SID),
    FOREIGN KEY(id_user) REFERENCES user(id_user)
);

# just something I (Seth) made, please dont kill it too fast...
# doEmailSportwatch = emails from us, such as highlights, news, etc.
CREATE TABLE user_setting (
    id_user INT NOT NULL,
    doEmailEvent BOOLEAN DEFAULT false,
    doTextEvent BOOLEAN DEFAULT false,
    doEmailMessage BOOLEAN DEFAULT false,
    doTextMessage BOOLEAN DEFAULT false,
    doEmailSportwatch BOOLEAN DEFAULT true,
    doTextSportwatch BOOLEAN DEFAULT false,

    PRIMARY KEY(id_user),
    FOREIGN KEY (id_user) REFERENCES user(id_user)
);

CREATE TABLE event (
    id_event INT AUTO_INCREMENT,
    id_meet INT NOT NULL,
    event_name CHAR(10),
    isOfficial BOOLEAN NOT NULL,
    PRIMARY KEY(id_event),
    FOREIGN KEY(id_meet) REFERENCES meet(id_meet)
);

# the events that each user is participating in
# we store result as an int becuase we do know the event type and will therefore get the correct unit
CREATE TABLE event_result (
    id_user INT NOT NULL,
    id_event INT NOT NULL,
    result DECIMAL(6, 3),
    PRIMARY KEY (id_user, id_event),
    FOREIGN KEY (id_user) REFERENCES user(id_user),
    FOREIGN KEY (id_event) REFERENCES event(id_event)
);

# will show a list of event ids for a given meet
CREATE TABLE meet_event (
    id_meet_event INT AUTO_INCREMENT,
    id_meet INT NOT NULL,
    id_event INT NOT NULL,
    PRIMARY KEY(id_meet_event),
    FOREIGN KEY (id_meet) REFERENCES meet(id_meet),
    FOREIGN KEY (id_event) REFERENCES event(id_event)
);

