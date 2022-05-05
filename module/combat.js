/**
 * Override the default Initiative formula to customize special behaviors of the system.
 */
export const _getInitiativeFormula = function() {
    const actor = this.actor;
    
    if ( !actor ) return "1d10";
    let init=CONFIG.Combat.initiative.formula;
    if(actor.type==="vehicle"){
        let crewRating=actor.data.data.crew.rating;
        let crewBonus=Math.floor(crewRating/10);
        init=`1d10 + ${crewBonus} + (${crewRating})/100`;
    }
    if(actor.getFlag("fortyk","constantvigilance")){
        init= `2d10kh + @characteristics.${actor.getFlag("fortyk","constantvigilance")}.bonus + @secChar.initiative.value + (@characteristics.${actor.getFlag("fortyk","constantvigilance")}.total / 100)`;
    } 

    

    return init;





};