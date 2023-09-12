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
        data.effects.push(modifiers);
        //resume item creation
        */
        return super.create(data, options);
    }
    /** 
    ** @override talents and traits should update their flags on the owning actor if the specialisation field is changed
    **/
    async update(data, options={}){
        if(this.type==="talentntrait"){

            if(this.isEmbedded){

                if(this.system.specialisation.value!==data["system.specialisation.value"]){
                    await this.actor.setFlag("fortyk",this.system.flagId.value,data["system.specialisation.value"])
                }
            }
        }

        if(this.actor){
            if(this.actor.type==="knightHouse"){
                if(this.system.loaned){
                    if(game.user.isGM){
                        let loaned=this.system.loaned;
                        for(let i=0;i<loaned.length;i++){
                            let knight=await game.actors.get(loaned[i].knightId);
                            let update=duplicate(data);
                            update["_id"]=loaned[i].itemId;

                            try{
                                await knight.updateEmbeddedDocuments("Item",[update]);
                            }catch(err){

                            }

                        }
                    }else{
                        //if user isnt GM use socket to have gm update the actor
                        let loans=this.system.loaned;
                        let socketOp={type:"updateLoans",package:{"loans":loans, "update":data}}
                        await game.socket.emit("system.fortyk",socketOp);
                    }

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
        const item = this;


        item["FORTYK"]=game.fortyk.FORTYK;

        //ensure this is an owned item

        if(this.actor){
            
            const data = this.actor.system;
            let actor=this.actor;
            item.isPrepared=true;
            if(actor.type==="spaceship"){
                if(item.type==="spaceshipCargo"){
                    try{
                        item.system.pf.value=item.FORTYK.cargoRarityValue[this.system.rarity.value];
                        let craftMultiplier=item.FORTYK.cargoQualityMultiplier[this.system.quality.value];
                        console.log(item.system.pf.value, item.system.space.value, craftMultiplier)
                        item.system.pf.total=item.system.pf.value*parseFloat(item.system.space.value)*craftMultiplier;
                        item.system.rarity.label=item.FORTYK.itemRarityLabels[item.system.rarity.value];
                    }catch(err){
                        console.log(err)
                    }

                }
            }
            if(actor.type==="knightHouse"){
                if(item.type!=="repairEntry"&&item.type!=="cadetHouse"&&item.type!=="outpost"){
                    item.system.amount.left=item.system.amount.value-item.system.amount.taken; 
                }

                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="ammunition"){
                    if(item.type==="rangedWeapon"){
                        if(item.system.class.value.indexOf("Titanic")===-1){
                            item.system.knightComponentType="auxiliaryWeapon";  
                        }else{
                            item.system.knightComponentType=item.type;
                        }
                    }else{
                        item.system.knightComponentType=item.type;
                    }

                }else if(item.type==="knightComponent"){
                    item.system.knightComponentType=item.system.type.value;
                }else{
                    item.system.knightComponentType=item.type;
                }
            }
            if(item.type==="forceField"){
                //logic for the sanctuary forcefields
                if(item.getFlag("fortyk","adjustment")){
                    let caster=fromUuidSync(item.getFlag("fortyk","origin"));
                    let actorPr
                    if(caster.uuid!==actor.uuid){
                        if(!caster.isPrepared){
                            caster.prepareData();
                        }
                        actorPr=caster.system.psykana.pr.effective;
                    }else{
                        actorPr=actor.system.psykana.pr.value+actor.system.psykana.pr.bonus-Math.max(0,actor.system.psykana.pr.sustain-1);
                    }
                    let adjustment=item.getFlag("fortyk","adjustment");

                    let pr=actorPr-adjustment
                    let max=80;
                    if(item.getFlag("fortyk","sanctuary")){
                        item.system.rating.value=Math.min(max,5*pr);
                    } 
                    if(item.getFlag("fortyk","sanctuaryDaemon")){
                        item.system.rating.value=Math.min(max,10*pr);
                    }
                }

            }
            if(item.type==="meleeWeapon"){
                item.system.damageFormula.value=item.system.damageFormula.formula;
                item.system.range.value=item.system.range.formula;
                item.system.pen.value=item.system.pen.formula;



                let weaponQuality=item.system.quality.value;
                item.system.testMod.value=parseInt(item._source.system.testMod.value);
                if(weaponQuality==="Poor"){
                    item.system.testMod.value+=-10;
                }else if(weaponQuality==="Good"){
                    item.system.testMod.value+=5;
                }else if(weaponQuality==="Best"){
                    item.system.testMod.value+=10;
                    item.system.damageFormula.value+="+1";
                }
                if(this.getFlag("fortyk","defensive")){
                    item.system.testMod.value-=10;
                }
            }
            if(item.type==="rangedWeapon"){
                let ammo=actor.getEmbeddedDocument("Item",item.system.ammo._id);
                if(ammo){
                    item.system.ammo.name=ammo.name;
                }
                if(ammo!==undefined&&!ammo.system.default.value){

                    item.system.damageType.value=ammo.system.damageType.value;
                    item.system.range.value=ammo.system.range.formula;
                    item.system.range.formula=ammo.system.range.formula;
                    item.system.pen.value=ammo.system.pen.formula;
                    item.system.damageFormula.value=ammo.system.damageFormula.formula;
                    item.flags=ammo.flags;

                }else{
                    if(!item.system.damTyp===""){
                        item.system.damageType.value=item.system.damTyp;
                    }else{
                        item.system.damTyp=item.system.damageType.value;
                    }

                    item.system.range.value=item.system.range.formula.toString();
                    item.system.pen.value=item.system.pen.formula;
                    item.system.damageFormula.value=item.system.damageFormula.formula;


                }
                if(item.system.damTyp===undefined){item.system.damTyp=item.system.damageType.value}

                item.system.testMod.value=parseInt(item._source.system.testMod.value);

                item.system.clip.max=item.system.clip.formula;
                if(this.getFlag("fortyk","accurate")){
                    item.system.attackMods.aim.half=20;
                    item.system.attackMods.aim.full=30;
                }
                /*
                *removed for new scatter bonus
                if(this.getFlag("fortyk","scatter")){
                    item.system.attackMods.range.pointblank=40;
                    item.system.attackMods.range.short=20;

                }
                */
                item.system.clip.consumption=item._source.system.clip.consumption;
                if(this.getFlag("fortyk","twinlinked")){


                    item.system.clip.consumption=item.system.clip.consumption*2;
                }
                if(this.getFlag("fortyk","storm")){
                    item.system.clip.consumption=item.system.clip.consumption*2;
                }
                if(this.getFlag("fortyk","lasModal")){
                    if(this.getFlag("fortyk","lasMode")===0){

                    }else if(this.getFlag("fortyk","lasMode")===1){
                        item.system.clip.consumption=2;
                        item.system.damageFormula.value+="+1"
                    }else if(this.getFlag("fortyk","lasMode")===2){
                        item.system.clip.consumption=4;
                        item.system.damageFormula.value+="+2"
                        item.system.pen.value=parseInt(item.system.pen.formula)+2;
                        item.flags.fortyk.reliable=false;
                        item.flags.fortyk.unreliable=true;
                    }
                }
                if(this.getFlag("fortyk","maximalMode")){


                    item.system.range.value=parseInt(item.system.range.formula)+10;
                    let form=item.system.damageFormula.formula;
                    let dPos = form.indexOf('d');
                    let dieNum = form.substr(0,dPos);
                    let newNum=parseInt(dieNum)+1;
                    item.system.damageFormula.value=form.slice(dPos)
                    item.system.damageFormula.value=newNum+item.system.damageFormula.value;
                    item.system.pen.value=parseInt(item.system.pen.formula)+2;
                    item.system.clip.consumption=3;
                }
            }

            if(actor.type!=="vehicle"&&actor.type!=="knightHouse"){
                if(item.type==="psychicPower"){
                    var psyniscience=0;

                    try{
                        psyniscience=actor.system.skills.psyniscience;
                    }catch(err){

                    }



                    let pr=parseInt(item.system.curPR.value);
                    //iterate through item flags to evaluate PR strings
                    let flags=item.flags.fortyk;
                    for(const flag in flags){
                        let fl=flags[flag];

                        if(typeof fl=="string"){
                            if(fl.toLowerCase().indexOf("pr")!==-1){
                                try{
                                    flags[flag]=Math.ceil(Function(`let pr=${pr};return `+flags[flag])());  
                                }catch (err){
                                    flags[flag]=0;
                                }

                            }
                        }
                    }
                    if(this.getFlag("fortyk","purifyingflame")){
                        item.flags.fortyk.purifyingflame=`1d10+${pr}`;
                    }
                    if(data.psykana.psykerType.value.toLowerCase()==="navigator"){
                        console.log("hey")
                        let range=item.system.range.formula.toLowerCase();
                        let wp=data.characteristics.wp.bonus;
                        let per=data.characteristics.per.bonus;
                        try{
                            item.system.range.value=Math.ceil(Function(`let wp=${wp};let per=${per};return `+range)());
                        }catch(err){
                            item.system.range.value=0; 
                        }
                        try{
                            item.system.pen.value=Math.ceil(Function(`let wp=${wp};return `+item.system.pen.formula.toLowerCase())()); 
                        }catch(err){
                            item.system.pen.value=0;
                        }


                        let training=0;
                        switch(item.system.training.value){
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
                        if(item.system.testChar.value==="psy"){
                            char=psyniscience;
                            item.system.testChar.type="per";
                        }else{
                            char=parseInt(data.characteristics[item.system.testChar.value].total);
                            item.system.testChar.type=item.system.testChar.value;
                        }
                        let temp;
                        temp=item.system.damageFormula.formula.replace(/pr/gmi,pr);
                        item.system.damageFormula.value=temp.replace(/wp/gmi,wp);
                        item.system.target.value=char+training+parseInt(item.system.testMod.value);
                    }else{
                        try{

                            let range=item.system.range.formula.toLowerCase();
                            let wp=data.characteristics.wp.bonus;
                            try{
                                item.system.range.value=Math.ceil(Function(`let pr=${pr};let wp=${wp};return `+range)());
                            }catch(err){
                                item.system.range.value=0;
                            }
                            try{
                                item.system.pen.value=Math.ceil(Function(`let pr=${pr};let wp=${wp};return `+item.system.pen.formula.toLowerCase())());
                            }catch(err){
                                item.system.pen.value=0;
                            }


                            let temp;
                            temp=item.system.damageFormula.formula.replace(/pr/gmi,pr);
                            item.system.damageFormula.value=temp.replace(/wp/gmi,wp);
                        }catch(err){
                            item.system.range.value="";
                            item.system.pen.value="";
                            item.system.damageFormula.value=="";
                        }
                        let derivedPR=Math.abs(parseInt(data.psykana.pr.effective)-parseInt(item.system.curPR.value));
                        let char=0;
                        if(item.system.testChar.value==="psy"){
                            char=psyniscience;
                            item.system.testChar.type="per";
                        }else{
                            char=parseInt(data.characteristics[item.system.testChar.value].total);
                            item.system.testChar.type=item.system.testChar.value;
                        }
                        item.system.target.value=parseInt(char)+(derivedPR*10)+parseInt(item.system.testMod.value)+parseInt(data.psykana.mod.value);
                    }


                }


                if(item.type==="meleeWeapon"){


                    //ensure that a weapon that is not a shield does not have an armor rating
                    if(item.system.class.value!=="Shield"&&item.system.shield.value!==0){
                        item.system.shield.value=0;

                    }


                    if(this.getFlag("fortyk","crushing")){
                        item.system.damageFormula.value+="+"+2*data.characteristics.s.bonus;
                    }else if(this.getFlag("fortyk","heavy")){
                        item.system.damageFormula.value+="+"+3*data.characteristics.s.bonus;
                    }else{
                        item.system.damageFormula.value+="+"+data.characteristics.s.bonus;
                    }
                    if(actor.getFlag("fortyk","crushingblow")){
                        item.system.damageFormula.value+="+"+Math.ceil(data.characteristics.ws.bonus/2);
                    }
                    let wp=data.characteristics.wp.bonus;
                    item.system.damageFormula.value=item.system.damageFormula.value.replace("wp",wp);
                    /*if(!actor.getFlag("fortyk","irongrip")){
                        if(item.system.class.value==="Melee Two-handed"){
                            item.system.twohanded.value=true;
                        }else{
                            item.system.twohanded.value=false;
                        }
                    }else{
                        item.system.twohanded.value=false; 
                    }*/



                }
                if(item.type==="rangedWeapon"){



                    if (typeof item.system.range.formula === 'string' || item.system.range.formula instanceof String){
                        let sb=data.characteristics.s.bonus;
                        let formula=item.system.range.formula.toLowerCase();

                        try{
                            item.system.range.value=Function(`let sb=${sb}; return `+formula)(); 
                        }catch (err){
                            item.system.range.value=0; 
                        }

                    }


                    if(actor.getFlag("fortyk","mightyshot")){
                        item.system.damageFormula.value+="+"+Math.ceil(data.characteristics.bs.bonus/2);
                    }
                    let wp=data.characteristics.wp.bonus;
                    item.system.damageFormula.value=item.system.damageFormula.value.replace("wp",wp);




                    /*if(!actor.getFlag("fortyk","irongrip")){
                        if((actor.getFlag("fortyk","firmgrip")&&item.system.class.value!=="Heavy")||item.system.class.value==="Pistol"||item.system.class.value==="Thrown"){

                            item.system.twohanded.value=false;

                        }else{

                            item.system.twohanded.value=true;
                        }
                    }else{
                        item.system.twohanded.value=false;
                    }*/


                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
                    if(actor.getFlag("fortyk","WeaponMaster")){

                        if(actor.getFlag("fortyk","WeaponMaster").toLowerCase().includes(item.system.type.value.toLowerCase())){

                            item.system.damageFormula.value+="+2";
                            item.system.testMod.value+=10;
                        }
                    }
                    //tainted weapon logic
                    if(this.getFlag("fortyk","tainted")){
                        let corruptBonus=Math.floor(parseInt(actor.system.secChar.corruption.value)/10);
                        let daemonic=parseFloat(actor.getFlag("fortyk","daemonic"));
                        if(isNaN(daemonic)){daemonic=0};
                        var taintbonus=Math.max(corruptBonus,daemonic);
                        item.system.damageFormula.value+=`+${taintbonus}`;
                        item.system.pen.value+=taintbonus;
                    }
                    //horde logic
                    if(actor.system.horde.value){
                        let hordeDmgBonus=Math.min(2,Math.floor(actor.system.secChar.wounds.value/10));
                        if(actor.getFlag("fortyk","overwhelming")&&item.type==="meleeWeapon"&&actor.system.secChar.wounds.value>=20){
                            hordeDmgBonus+=1;
                        }
                        let form= item.system.damageFormula.value
                        let dPos = form.indexOf('d');
                        let dieNum = form.substr(0,dPos);
                        let newNum=parseInt(dieNum)+hordeDmgBonus;
                        form=form.slice(dPos);
                        form=newNum+form;
                        item.system.damageFormula.value=form;



                    }

                    try{
                        let pr=parseInt(data.psykana.pr.value);
                        if(this.getFlag("fortyk","force")){

                            item.system.pen.value=parseInt(item.system.pen.value)+pr;
                            item.system.damageFormula.value+=`+${pr}`;
                        }
                        if(this.getFlag("fortyk","purifyingflame")){
                            item.flags.fortyk.purifyingflame=`1d10+${pr}`;
                        }
                    }catch(err){
                        item.system.pen.value="";
                        item.system.damageFormula.value="";
                    }
                }
            }





        }

    }

    static async applyPsyBuffs(actorId, powerId, targetIds){
        if(game.user.isGM){
            let actor=await fromUuid(actorId);
            let power=actor.getEmbeddedDocument("Item",powerId);
            let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));

            let ae=power.effects.entries().next().value[1];
            console.log(ae)
            let aeData=ae.clone().data;

            aeData.name=ae.name+" Buff"
            let actorPR=actor.system.psykana.pr.effective;
            let powerPR=power.system.curPR.value;
            let adjustment=actorPR-powerPR;

            aeData.flags={fortyk:{adjustment:adjustment,psy:true}};
            aeData.disabled=false;
            aeData.origin=actorId;
            let effectUuIds=[]
            for(let i=0; i<targets.length;i++){
                let target=targets[i];

                let targetActor=target.actor;
                let effect=await targetActor.createEmbeddedDocuments("ActiveEffect",[aeData]);

                let ae=effect[0];
                let effectuuid=await ae.uuid

                effectUuIds.push(effectuuid);
            }



            await power.setFlag("fortyk","sustained",effectUuIds);
            if(power.system.sustain.value!=="No"){
                let sustained=actor.system.psykana.pr.sustained;
                sustained.push(power.id);
                actor.update({"system.psykana.pr.sustained":sustained});
            }

        }else{
            //if user isnt GM use socket to have gm apply the buffs/debuffs


            let socketOp={type:"psyBuff",package:{actorId:actorId, powerId:powerId, targetIds:targetIds}};
            await game.socket.emit("system.fortyk",socketOp);

        }
    }
    static async cancelPsyBuffs(actorId, powerId){
        if(game.user.isGM){
            let power=await fromUuid(powerId);
            let buffs=power.getFlag("fortyk","sustained");
            for(let i=0;i<buffs.length;i++){
                let buffId=buffs[i];
                let buff=await fromUuid(buffId);
                try{
                    await buff.delete();
                }catch(err){

                }

            }
            await power.setFlag("fortyk","sustained",false);
            let actor=await fromUuid(actorId);
            let sustained=actor.system.psykana.pr.sustained;
            let powerIndex=sustained.indexOf(power.id);
            sustained.splice(powerIndex,1);
            console.log(sustained)
            actor.update({"system.psykana.pr.sustained":sustained});
        }else{
            //if user isnt GM use socket to have gm cancel the buffs/debuffs


            let socketOp={type:"cancelPsyBuff",package:{actorId:actorId, powerId:powerId}};
            await game.socket.emit("system.fortyk",socketOp); 
        }
    }
    static async executePsyMacro(powerId,macroId,actorId,targets){
        let actor=fromUuidSync(actorId);
        let power=actor.getEmbeddedDocument("Item",powerId);
        console.log(actor)
        let macroCompendium=await game.packs.get("fortyk.fortykmacros");
        let macro=await macroCompendium.getDocument(macroId);
        macro.execute({actor:actor, power:power, targets:targets});
    }
}

