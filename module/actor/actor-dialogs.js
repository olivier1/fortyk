//utility functions to handle events on dialogs created from the actor sheets
export class ActorDialogs {
    static chatListeners(dialog,html) {
        $(html).find(".tntfilter").ready(this._onPopupReady.bind(this));
        $(html).find(".tntdescr-button").click(this._onTntDescrClick.bind(this));
    }
    //focus inputs on popups
    static _onPopupReady(event) {
        try {
            let input = document.getElementById("tntfilter");
            input.select();
        } catch (err) {}
        try {
            let input = document.getElementById("modifier");
            input.select();
        } catch (err) {}
        try {
            let input = document.getElementById("specInput");
            input.select();
        } catch (err) {}
    }
    static _onTntDescrClick(event) {
        event.preventDefault();
        let descr = event.target.attributes["data-description"].value;
        var options = {

        };
        var name = event.currentTarget.dataset["name"];
        let dlg = new foundry.applications.api.DialogV2(
            {
                window:{title: `${name} Description`},
                content: "<p>" + descr + "</p>",
                position:{
                    width: 300,
                    height: 400
                },
                buttons: [{
                    action:"submit",
                    label: "OK",
                    callback: null
                }
                         ],
                default: "submit"
            },
            options
        );
        dlg.render({force:true});
    }


}
