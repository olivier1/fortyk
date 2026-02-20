import { applySceneAuras } from "../utilities.js";
import { tokenDistance } from "../utilities.js";
import { getActorToken } from "../utilities.js";
export class FortyKTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler{
    //OVERRIDE
    async _preMove(token){
    }
    async _postMove(token){

    }
    _getSegmentStyle(waypoint){
        let colorStr = this._getColorFromDistance(waypoint);
        let color=super._getSegmentStyle(waypoint);
        color.color=colorStr;
        return color;
    }
    _getWaypointStyle(waypoint){
        let colorStr = this._getColorFromDistance(waypoint);
        let color=super._getWaypointStyle(waypoint);
        color.color=colorStr;
        return color;
    }

    _getGridHighlightStyle(waypoint){
        let colorStr = this._getColorFromDistance(waypoint);
        let color=super._getGridHighlightStyle(waypoint);
        color.color=colorStr;
        return color;
    }
    get colors() {
        return {
            "half":{  default: 0xadd8e6, name: "Half Move" },
            "full":{ default: 0x191970, name: "Full Move" },
            "charge":{  default: 0xffa500, name: "Charge Move" },
            "run":{ default: 0xffff00, name: "Run" }
        };
    }
    _getColorFromDistance(waypoint) {
        
        let ranges=this.getRanges(this.token);
        let colors=this.colors;
       
        let distance=waypoint.measurement.cost;
        let movementAction = this.token.movementAction;
        switch (movementAction){
            case "crawl":
                distance*=2;
                break;
            case "blink":
                distance=0;
                break;
        }
        let colorStr="";
        for(let range of ranges){
            if(distance<=range.range){
                colorStr=colors[range.color].default;
                break;
            }
        }
        if(!colorStr)colorStr=0xff0000;
        return colorStr;
    }
    getRanges(token) {
        let movement;
        let ranges;
        if(!token.actor){
            return [{ range: 0, color: "full" }];
        }
        if (token.actor.type === "spaceship") {
            ranges = [];
        } else if (token.actor.type === "vehicle") {
            movement = token.actor.system.secChar.speed;
            if (token.actor.getFlag("fortyk", "enhancedmotivesystem")) {
                ranges = [
                    { range: movement.tactical * 2, color: "full" },
                    { range: movement.tactical * 3, color: "run" }
                ];
            } else if (token.actor.getFlag("fortyk", "ponderous")) {
                ranges = [
                    { range: movement.tactical / 2, color: "full" },
                    { range: movement.tactical, color: "run" }
                ];
            } else {
                ranges = [
                    { range: movement.tactical, color: "full" },
                    { range: movement.tactical * 2, color: "run" }
                ];
            }
        } else {
            movement = token.actor.system.secChar.movement;
            ranges = [
                { range: movement.half, color: "half" },
                { range: movement.full, color: "full" },
                { range: movement.charge, color: "charge" },
                { range: movement.run, color: "run" }
            ];
        }
        return ranges;
    }
}
