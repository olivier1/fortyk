import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKVehicleSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/vehicle-sheet.html",
            width: 666,
            height: 660,
            tabs: [],
            default:null,
            scrollY: [".sheet-content"]



        });
    }
    /* -------------------------------------------- */
    /** @override */
    async getData() {
        const data = await super.getData();
        
        
        let actor=this.actor;
        if(actor.getFlag("fortyk","superheavy")){
            let components=[]
            data.components=components.concat(actor.itemTypes.ammunition,actor.itemTypes.forceField,actor.itemTypes.knightComponent,actor.itemTypes.knightCore);
        }
        data.vehicleTypes=game.fortyk.FORTYK.vehicleTypes;
       
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable


        html.find('.knight-overheat').click(this._onKnightOverheat.bind(this));

    }

    async _onKnightOverheat(event){
        let actor=this.actor;
        let data=this.actor.system;
        let heatCap=parseInt(data.knight.heat.max);
        let heat=parseInt(data.knight.heat.value);
        let overheat=heat-heatCap;
        let roll=new Roll(`${overheat}d10kl`,{});
        await roll.evaluate();
        let result=roll.total;
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: "Rolling Overheat test"
        });
        let ones=0;
        try{
            for ( let r of roll.dice[0].results ) {

                if(r.active){
                    if(r.result===1){
                        ones++;
                    }
                }
            } 
        }catch(err){
        }
        let overheatResult="";
        let overheatFlavor=""
        if(ones>1){
            overheatResult="The knight’s core goes critical, the knight suffers a core meltdown at the end of your next turn.";
            overheatFlavor="Irreversible Core Meltdown"
        }else if(result>=7){
            overheatResult="The knight shuts down and is considered helpless until restarted. This is a +0 Operate: Titanic Walker test which takes a full action.";
            overheatFlavor="Emergency Shutdown";
        }else if(result>=2){
            overheatResult="The knight takes 4d10 damage until the core overload is cleared.";
            overheatFlavor="Core Overload";
        }else if(result===1){
            overheatResult="Roll a +0 tech-use test, on a success your knight is stunned for 1d5 rounds, on a failure the knight suffers a core meltdown in 1d5 rounds(rolled by the GM). You may retry the tech-use test each round.";
            overheatFlavor="Core Meltdown";
        }
        let chatOverheat={user: game.users.current,
                          speaker:{user: game.users.current},
                          content:overheatResult,
                          classes:["fortyk"],
                          flavor:overheatFlavor,
                          author:game.users.current.id
                         }

        await ChatMessage.create(chatOverheat,{});
        this.actor.update({"system.knight.heat.value":0});


    }

}