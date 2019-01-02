function add_FieldEventPage() {

    this.addEvent = function () {
        throw new Error("addEvent is not yet initialized");
    }

    this.onEventAdded = (cb) => {
        this.addEvent = cb;
    }

    this.field_events = [
        "High_Jump",
        "Long_Jump",
        "Pole_Vault",
        "Shot_Put",
        "Discuss",
        "Weight_Throw",
        "Hammer_Throw",
    ];
}