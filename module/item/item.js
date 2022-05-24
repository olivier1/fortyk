/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import {getItem} from "../utilities.js";
import {isEmpty} from "../utilities.js";

export class FortyKItem extends Item {
    //@Override the create function to add an activeeffect for modifiers to an item
    static async create(data, options) {
        // If the created item has effects (only applicable to duplicated actors) bypass the new item creation logic

        if (data.effects)
        {
            return super.create(data, options);
        }
        /*let modifiersData={
            id: "modifiers",
            label: data.name,
            changes:[],
            transfer:true,
            disabled:true}
        let modifiers= await ActiveEffect.create(modifiersData,{temporary:true});

        data.effects=[];
        data.effects.push(modifiers.data);
        //resume item creation
        */
        return super.create(data, options);
    }
    /** 
    ** @override talents and traits should update their flags on the owning actor if the specialisation field is changed
    **/
    async update(data, options={}){
        if(this.data.type==="talentntrait"){

            if(this.isEmbedded){

                if(this.data.data.specialisation.value!==data["data.specialisation.value"]){
                    await this.actor.setFlag("fortyk",this.data.data.flagId.value,data["data.specialisation.value"])
                }
            }
        }
        super.update(data,options);
    }

    /**
   * Augment the basic Item data model with additional dynamic data.
   */
    async prepareData() {
        super.prepareData();

        // Get the Item's data
        const item = this.data;


        item["FORTYK"]=game.fortyk.FORTYK;

        //ensure this is an owned item

        if(this.actor!==null&&this.actor.data!==undefined){
            const data = this.actor.data.data;
            let actor=this.actor;
            item.data.isPrepared=true;
            if(item.type==="meleeWeapon"){
                item.data.damageFormula.value=item.data.damageFormula.formula;
                item.data.range.value=item.data.range.formula;
                item.data.pen.value=item.data.pen.formula;



                let weaponQuality=item.data.quality.value;
                item.data.testMod.value=parseInt(item._source.data.testMod.value);
                if(weaponQuality==="Poor"){
                    item.data.testMod.value+=-10;
                }else if(weaponQuality==="Good"){
                    item.data.testMod.value+=5;
                }else if(weaponQuality==="Best"){
                    item.data.testMod.value+=10;
                    item.data.damageFormula.value+="+1";
                }
                if(this.getFlag("fortyk","defensive")){
                    item.data.testMod.value-=10;
                }
            }
            if(item.type==="rangedWeapon"){
                let ammo=actor.getEmbeddedDocument("Item",item.data.ammo._id);
                
                if(ammo!==undefined&&!ammo.data.data.default.value){
                    let ammoData=ammo.data;
                    item.data.damageType.value=ammoData.data.damageType.value;
                    item.data.range.value=ammoData.data.range.formula;
                    item.data.pen.value=ammoData.data.pen.formula;
                    item.data.damageFormula.value=ammoData.data.damageFormula.formula;
                    item.flags=ammoData.flags;

                }else{
                    if(!item.data.damTyp===""){
                        item.data.damageType.value=data.damTyp;
                    }else{
                        item.data.damTyp=item.data.damageType.value;
                    }

                    item.data.range.value=item.data.range.formula;
                    item.data.pen.value=item.data.pen.formula;
                    item.data.damageFormula.value=item.data.damageFormula.formula;

                }
                if(item.data.damTyp===undefined){item.data.damTyp=item.data.damageType.value}

                item.data.testMod.value=parseInt(item._source.data.testMod.value);
                
                item.data.clip.max=item.data.clip.formula;
                if(this.getFlag("fortyk","accurate")){
                    item.data.attackMods.aim.half=20;
                    item.data.attackMods.aim.full=30;
                }
                if(this.getFlag("fortyk","scatter")){
                    item.data.attackMods.range.pointblank=40;
                    item.data.attackMods.range.short=20;

                }
                if(this.getFlag("fortyk","twinlinked")){

                    
                    item.data.clip.consumption=item.data.clip.consumption*2;
                }
                if(this.getFlag("fortyk","storm")){
                    item.data.clip.consumption=item.data.clip.consumption*2;
                }
                if(this.getFlag("fortyk","lasModal")){
                    if(this.getFlag("fortyk","lasMode")===0){

                    }else if(this.getFlag("fortyk","lasMode")===1){
                        item.data.clip.consumption=2;
                        item.data.damageFormula.value+="+1"
                    }else if(this.getFlag("fortyk","lasMode")===2){
                        item.data.clip.consumption=4;
                        item.data.damageFormula.value+="+2"
                        item.data.pen.value=parseInt(item.data.pen.formula)+2;
                        item.flags.fortyk.reliable=false;
                        item.flags.fortyk.unreliable=true;
                    }
                }
                if(this.getFlag("fortyk","maximalMode")){


                    item.data.range.value=parseInt(item.data.range.formula)+10;
                    let form=item.data.damageFormula.formula;
                    let dPos = form.indexOf('d');
                    let dieNum = form.substr(0,dPos);
                    let newNum=parseInt(dieNum)+1;
                    item.data.damageFormula.value=form.slice(dPos)
                    item.data.damageFormula.value=newNum+item.data.damageFormula.value;
                    item.data.pen.value=parseInt(item.data.pen.formula)+2;
                    item.data.clip.consumption=3;
                }
            }

            if(actor.type!=="vehicle"){
                if(item.type==="psychicPower"){
                    let psyniscience=actor.data.data.psyniscience;
                    let pr=parseInt(item.data.curPR.value);
                    //iterate through item flags to evaluate PR strings
                    let flags=item.flags.fortyk;
                    for(const flag in flags){
                        let fl=flags[flag];

                        if(typeof fl=="string"){
                            if(fl.toLowerCase().indexOf("pr")!==-1){

                                flags[flag]=Math.ceil(eval(flags[flag]));
                            }
                        }
                    }
                    if(data.psykana.psykerType.value.toLowerCase()==="navigator"){
                        let range=item.data.range.formula.toLowerCase();

                        item.data.range.value=Math.ceil(eval(range));
                        item.data.pen.value=Math.ceil(eval(item.data.pen.formula.toLowerCase()));
                        let training=0;
                        switch(item.data.training.value){
                            case "Novice":
                                training=0;
                                break;
                            case "Adept":
                                training=10;
                                break;
                            case "Master":
                                training=20;
                                break;
                        }
                        let char=0;
                        if(item.data.testChar.value==="psy"){
                            char=psyniscience;
                            item.data.testChar.type="per";
                        }else{
                            char=parseInt(data.characteristics[item.data.testChar.value].total);
                            item.data.testChar.type=item.data.testChar.value;
                        }

                        item.data.target.value=char+training;
                    }else{
                        try{

                            let range=item.data.range.formula.toLowerCase();
                            let wp=data.characteristics.wp.bonus;
                            item.data.range.value=Math.ceil(eval(range));
                            item.data.pen.value=Math.ceil(eval(item.data.pen.formula.toLowerCase()));
                            let temp;
                            temp=item.data.damageFormula.formula.replace(/pr/gmi,pr);
                            item.data.damageFormula.value=temp.replace(/wp/gmi,wp);
                        }catch(err){
                            item.data.range.value="";
                            item.data.pen.value="";
                            item.data.damageFormula.value=="";
                        }
                        let derivedPR=Math.abs(parseInt(data.psykana.pr.effective)-parseInt(item.data.curPR.value));
                        let char=0;
                        if(item.data.testChar.value==="psy"){
                            char=psyniscience;
                            item.data.testChar.type="per";
                        }else{
                            char=parseInt(data.characteristics[item.data.testChar.value].total);
                            item.data.testChar.type=item.data.testChar.value;
                        }
                        item.data.target.value=parseInt(char)+(derivedPR*10)+parseInt(item.data.testMod.value)+parseInt(data.psykana.mod.value);
                    }


                }


                if(item.type==="meleeWeapon"){


                    //ensure that a weapon that is not a shield does not have an armor rating
                    if(item.data.class.value!=="Shield"&&item.data.shield.value!==0){
                        item.data.shield.value=0;

                    }


                    if(this.getFlag("fortyk","crushing")){
                        item.data.damageFormula.value+="+"+2*data.characteristics.s.bonus;
                    }else{
                        item.data.damageFormula.value+="+"+data.characteristics.s.bonus;
                    }
                    if(actor.getFlag("fortyk","crushingblow")){
                        item.data.damageFormula.value+="+"+Math.ceil(data.characteristics.ws.bonus/2);
                    }
                    if(!actor.getFlag("fortyk","irongrip")){
                        if(item.data.class.value==="Melee Two-handed"){
                            item.data.twohanded.value=true;
                        }else{
                            item.data.twohanded.value=false;
                        }
                    }else{
                        item.data.twohanded.value=false; 
                    }



                }
                if(item.type==="rangedWeapon"){



                    try
                    {
                        let sb=data.characteristics.s.bonus;
                        let formula=item.data.range.formula.toLowerCase();
                        item.data.range.value=eval(formula);
                    } 
                    catch(err){
                        item.data.range.value="";
                    } 
                    if(actor.getFlag("fortyk","mightyshot")){
                        item.data.damageFormula.value+="+"+Math.ceil(data.characteristics.bs.bonus/2);
                    }





                    if(!actor.getFlag("fortyk","irongrip")){
                        if((actor.getFlag("fortyk","firmgrip")&&item.data.class.value!=="Heavy")||item.data.class.value==="Pistol"||item.data.class.value==="Thrown"){

                            item.data.twohanded.value=false;

                        }else{

                            item.data.twohanded.value=true;
                        }
                    }else{
                        item.data.twohanded.value=false;
                    }


                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
                    if(actor.getFlag("fortyk","WeaponMaster")){

                        if(actor.getFlag("fortyk","WeaponMaster").toLowerCase().includes(item.data.type.value.toLowerCase())){

                            item.data.damageFormula.value+="+2";
                            item.data.testMod.value+=10;
                        }
                    }
                    //tainted weapon logic
                    if(this.getFlag("fortyk","tainted")){
                        let corruptBonus=Math.floor(parseInt(actor.data.data.secChar.corruption.value)/10);
                        let daemonic=parseFloat(actor.getFlag("fortyk","daemonic"));
                        if(isNaN(daemonic)){daemonic=0};
                        var taintbonus=Math.Max(corruptBonus,daemonic);
                        item.data.damageFormula.value+=`+${taintbonus}`;
                        item.data.pen.value+=taintbonus;
                    }
                    //horde logic
                    if(actor.data.data.horde.value){
                        let hordeDmgBonus=Math.min(2,Math.floor(actor.data.data.secChar.wounds.value/10));
                        if(actor.getFlag("fortyk","overwhelming")&&item.type==="meleeWeapon"&&actor.data.data.secChar.wounds.value>=20){
                            hordeDmgBonus+=1;
                        }
                        let form= item.data.damageFormula.value
                        let dPos = form.indexOf('d');
                        let dieNum = form.substr(0,dPos);
                        let newNum=parseInt(dieNum)+hordeDmgBonus;
                        form=form.slice(dPos);
                        form=newNum+form;
                        item.data.damageFormula.value=form;

                        

                    }

                    try{
                        if(this.getFlag("fortyk","force")){
                            let pr=parseInt(data.psykana.pr.value);
                            item.data.pen.value=parseInt(item.data.pen.value)+pr;
                            item.data.damageFormula.value+=`+${pr}`;
                        }
                    }catch(err){
                        item.data.pen.value="";
                        item.data.damageFormula.value="";
                    }
                }
            }





        }

    }


}

