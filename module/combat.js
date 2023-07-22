/**
 * Override the default Initiative formula to customize special behaviors of the system.
 */
export const _getInitiativeFormula = function() {
    var actor = this.actor;

    if ( !actor ) return "1d10";
    let init=CONFIG.Combat.initiative.formula;
    if(actor.type==="vehicle"){
        if(actor.system.knight.pilot){
            actor=actor.system.knight.pilot;
            init=`1d10 + ${actor.system.characteristics.agi.bonus} + ${actor.system.secChar.initiative.value} + (${actor.system.characteristics.agi.total} / 100)`;
        }else{
            let crewRating=actor.system.crew.rating;
            let crewBonus=Math.floor(crewRating/10);
            init=`1d10 + ${crewBonus} + (${crewRating})/100`;
        }

    }
    if(actor.getFlag("fortyk","constantvigilance")){
        init= `2d10kh + @characteristics.${actor.getFlag("fortyk","constantvigilance")}.bonus + @secChar.initiative.value + (@characteristics.${actor.getFlag("fortyk","constantvigilance")}.total / 100)`;
    } 
    if(actor.getFlag("fortyk","firsttofight")){
        init=`2d10 + @characteristics.agi.bonus + @secChar.initiative.value + (@characteristics.agi.total / 100)`;
    }


    return init;





};