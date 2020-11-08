//utility functions to handle events on dialogs created from the actor sheets
export class ActorDialogs{
    static chatListeners(html){
        html.find('.tntfilter').keyup(this._onTntFilterChange.bind(this));
    }
    static _onTntFilterChange(event){
        
        let tnts=document.getElementsByName("tntEntry");

        let filterInput=document.getElementById("tntfilter");
        let filter=filterInput.value.toLowerCase();
        for(let i=0;i<tnts.length;i++){
            let tnt=tnts[i];
           
            let tntName=tnt.attributes["data-search"].value.toLowerCase();
            if(tntName.indexOf(filter)>-1){
                tnt.style.display="";
            }else{
                tnt.style.display="none";
            }
        }

    }
}
