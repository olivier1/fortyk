/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import {getItem} from "../utilities.js"
export class FortyKItem extends Item {
    /**
   * Augment the basic Item data model with additional dynamic data.
   */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        //ensure this is an owned item
        if(this.options.actor!==undefined){
            const actorData = this.actor ? this.actor.data : {};
            const data = itemData.data;
            //prepare skill total values
            if(itemData.type==="skill"){
                data.total.value=parseInt(data.value)+parseInt(data.mod.value)+parseInt(actorData.data.characteristics[data.characteristic.value].total);
            }
            //prepare psychicpowers, calculates pushing and target numbers
            if(itemData.type==="psychicPower"){
                let derivedPR=Math.abs(parseInt(actorData.data.psykana.pr.value)-parseInt(data.curPR.value));
                console.log(derivedPR);

                let char=0;
                if(data.testChar.value==="psy"){
                    char=getItem(this.actor,"Psyniscience").data.total.value;
                    data.testChar.type="per";
                }else{
                    char=parseInt(actorData.data.characteristics[data.testChar.value].total);
                    data.testChar.type=data.testChar.value;
                }

                data.target.value=parseInt(char)+(derivedPR*10)+parseInt(data.testMod.value)+parseInt(actorData.data.psykana.mod.value);
            }
        }
    }
}
