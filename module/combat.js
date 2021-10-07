/**
 * Override the default Initiative formula to customize special behaviors of the system.
 */
export const _getInitiativeFormula = function() {
    const actor = this.actor;
    
    if ( !actor ) return "1d10";
    let init=CONFIG.Combat.initiative.formula;
    if(actor.getFlag("fortyk","constantvigilance")){
        init= `2d10kh + @characteristics.${actor.getFlag("fortyk","constantvigilance")}.bonus + @secChar.initiative.value + (@characteristics.${actor.getFlag("fortyk","constantvigilance")}.total / 100)`;
    } 

    

    return init;





};