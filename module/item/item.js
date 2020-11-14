/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import {getItem} from "../utilities.js";
import {isEmpty} from "../utilities.js";

export class FortyKItem extends Item {
    

    /**
   * Augment the basic Item data model with additional dynamic data.
   */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const data = itemData.data;
        itemData["FORTYK"]=game.fortyk.FORTYK;

        //ensure this is an owned item
        if(this.options.actor!==undefined){
            const actorData = this.actor ? this.actor.data : {};

            //prepare skill total value
            if(itemData.type==="skill"){

                data.total.value=parseInt(data.value)+parseInt(data.mod.value)+parseInt(actorData.data.characteristics[data.characteristic.value].total);
            }
            //logic for weapons

            if(itemData.type==="meleeWeapon"){
                data.range.value=data.range.formula;
                data.pen.value=data.pen.formula;





                //ensure that a weapon that is not a shield does not have an armor rating
                if(data.class.value!=="Shield"&&data.shield.value!==0){
                    data.shield.value=0;

                }


            }
            if(itemData.type==="rangedWeapon"){

                if(itemData.flags.specials.accurate.value){
                    data.attackMods.aim.half=20;
                    data.attackMods.aim.full=30;
                }

                if(itemData.flags.specials.scatter.value){
                    data.attackMods.range.pointblank=40;
                    data.attackMods.range.short=20;

                }
                if(itemData.flags.specials.twinlinked.value){

                    data.testMod.value=20;
                    data.clip.consumption=2;
                }
                if(data.damTyp===undefined){data.damTyp=data.damageType.value}
                if(data.flags===undefined){data.flags=itemData.flags}
                let ammo=this.actor.getEmbeddedEntity("OwnedItem",data.ammo._id);
                if(ammo!==null&&!ammo.data.default.value){
                    data.damageType.value=ammo.data.damageType.value;
                    data.range.value=ammo.data.range.formula;
                    data.pen.value=ammo.data.pen.formula;
                    data.damageFormula.value=ammo.data.damageFormula.formula;
                    itemData.flags=ammo.flags;
                }else{
                    if(!data.damTyp===""){
                        data.damageType.value=data.damTyp;
                    }else{
                        data.damTyp=data.damageType.value;
                    }

                    data.range.value=data.range.formula;
                    data.pen.value=data.pen.formula;
                    data.damageFormula.value=data.damageFormula.formula;
                    itemData.flags=data.flags;
                }

                data.clip.max=data.clip.formula;

                if(itemData.flags.specials.lasModal.value){
                    if(itemData.flags.specials.lasModal.mode===0){

                    }else if(itemData.flags.specials.lasModal.mode===1){
                        data.clip.consumption=2;
                        data.damageFormula.value+="+1"
                    }else if(itemData.flags.specials.lasModal.mode===2){
                        data.clip.consumption=4;
                        data.damageFormula.value+="+2"
                        data.pen.value=parseInt(itemData.data.pen.formula)+2;
                        itemData.flags.specials.reliable.value=false;
                        itemData.flags.specials.unreliable.value=true;
                    }
                }


                if(itemData.flags.specials.maximal.maximal){


                    itemData.data.range.value=parseInt(itemData.data.range.formula)+10;
                    let form=itemData.data.damageFormula.formula;
                    let dPos = form.indexOf('d');
                    let dieNum = form.substr(0,dPos);
                    let newNum=parseInt(dieNum)+1;
                    itemData.data.damageFormula.value=form.slice(dPos)
                    itemData.data.damageFormula.value=newNum+itemData.data.damageFormula.value;
                    itemData.data.pen.value=parseInt(itemData.data.pen.formula)+2;
                    itemData.data.clip.consumption=3;
                }else{

                    itemData.data.clip.consumption=1;
                }
            }
            //prepare psychicpowers, calculates pushing and target numbers
            if(itemData.type==="psychicPower"){
                let pr=parseInt(data.curPR.value);


                let range=data.range.formula.toLowerCase();

                data.range.value=eval(range);

                data.pen.value=eval(data.pen.formula.toLowerCase());



                let derivedPR=Math.abs(parseInt(actorData.data.psykana.pr.effective)-parseInt(data.curPR.value));

                let specials=itemData.flags.specials;
                for(const spec in specials){

                    if(specials[spec].value&&specials[spec].num!==undefined){


                        if(isNaN(specials[spec].num)&&specials[spec].form!==undefined&&specials[spec].num!==specials[spec].form){

                            specials[spec].form=specials[spec].num;

                        }else if(isNaN(specials[spec].num)&&specials[spec].form===undefined){

                            specials[spec].form=specials[spec].num;

                        } 




                        if(specials[spec].form!==undefined){
                            specials[spec].num=eval(specials[spec].form);
                        }
                    }
                }

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
            if(itemData.type==="meleeWeapon"||itemData.type==="rangedWeapon"||itemData.type==="psychicPower"){








            }

        }

    }
}

