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
                    break;
                case "meets":
                    UIManager.switchToMeets();
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