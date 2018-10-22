/**
 * This file is for handling the multiple states for our single page app
 * 
 * welcome
 * login
 * signup
 * myteam
 * myrecord
 * 
 * this mainly includes loading the correct assets when the user switches states
 * 
 * Idealy, this should be the only object that knows or has to deal with any states.
 * The other managers should operate under what the state manager tells them given it's needs for that state
 */

var StateManager = {

    current_state : "uninitialized",

    /**
     * will set the state and update the ui
     * 
     * @param {String} state the current sw state
     */
    setState(state) {
        this.current_state = state;
        
        try {
            switch(state) {
                case "home":
                    let home = new homePage()
                    
                    home.onStateSelect((selection) => {
                        this.setState(selection);
                    });

                    home.loadContent()
                    break;          
                case "welcome":  
                    let welcome = new welcomePage().onStateSelect((state) => {
                        this.setState(state);
                    });
                    break;
                case "login":
                // TODO maybe add a loading icon after they submit
                    let login = new loginPage().then((state) => {
                        this.setState(state);
                    }).catch((response) => {
                        console.log("could not login sorry dude");
                    });
                    break;
                case "signup":
                    let signup = new signupPage().then((state) => {
                        this.setState(state);
                    }).catch((response) => {
                        console.log("could not sign up becuase: " + response);
                    });
                    break;
                case "postsignup":
                    let postsignup = new postSignupPage();
                    break;
                case "timer":
                    // construct the Timer Page
                    let timer = new TimerPage();
                    break;
                case "team":
                    let team = new teamPage();
                    break;
                case "stats":
                    UIManager.switchToStats();
                    break;
                case "athletes":
                    let athlete = new athletePage();

                    athlete.onAddAthlete(() => {
                        this.setState("add_athlete");
                    });
                    break;
                case "add_athlete":
                    let add_athlete = new add_athletePage();

                    add_athlete.onAthleteAdded(() => {
                        this.setState("athletes");
                    });

                    break;
                case "meets":
                    let meets = new meetsPage();

                    meets.onAddMeet(() => {
                        console.log("going to add meets");
                        this.setState("add_meet");
                    })
                    break;

                case "add_meet":
                    let add_meet = new add_MeetPage();

                    add_meet.onMeetAdded(() => {
                        console.log("going to meets");
                        this.setState("meets");
                    });
                    break;
                case "events":
                    let events = new eventsPage();

                    events.onAddEvent((add_event) => {
                        this.setState(add_event);
                    })
                    break;
                case "add_track_event":
                    let add_track_event = new add_TrackEventPage();
                    add_track_event.onEventAdded(() => {
                        this.setState("events");
                    });
                    break
                case "add_field_event":
                    let add_field_event = new add_FieldEventPage();
                    add_field_event.onEventAdded(() => {
                        this.setState("events");
                    });
                    break;
                case "add_cross_event":
                    let add_event = new add_CrossEventPage();
                    add_event.onEventAdded(() => {
                        this.setState("events");
                    });
                    break;
                case "progress":
                    UIManager.switchToProgress();
                    break;
                case "account":
                    let account = new accountPage().onSignout(() => {
                        UIManager.removeNavigationMenu();
                        this.setState("welcome");
                    });
                    break;
            }    
        } catch (e) {
            console.log("ERROR: " + e);
        }
        
    },

    getState : function(state) {
        return this.current_state
    }
};