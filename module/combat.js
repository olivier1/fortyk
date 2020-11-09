/**
 * Override the default Initiative formula to customize special behaviors of the system.
 */
export const _getInitiativeFormula = function(combatant) {
    const actor = combatant.actor;
    if ( !actor ) return "1d10";
    if(actor.getFlag("fortyk","constantvigilance")){
        return `2d10kh + @characteristics.${actor.getFlag("fortyk","constantvigilance")}.bonus + (@characteristics.${actor.getFlag("fortyk","constantvigilance")}.total / 100)`
    }else{
        return CONFIG.Combat.initiative.formula;
    }




};