/**
 * Override the default Initiative formula to customize special behaviors of the system.
 */
export const _getInitiativeFormula = function() {
    const actor = this.actor;
    
    if ( !actor ) return "1d10";
    let init=CONFIG.Combat.initiative.formula;
    if(actor.getFlag("fortyk","constantvigilance")){
        init= `2d10kh + @characteristics.${actor.getFlag("fortyk","constantvigilance")}.bonus + (@characteristics.${actor.getFlag("fortyk","constantvigilance")}.total / 100)`;
    } 

    if(actor.getFlag("fortyk","WeaponMaster")){
        //weaponmaster initiative
        let data=actor.data.data;
        var rightHandWeapon= actor.items.get(data.secChar.wornGear.weapons[1]);
        let rightHandWeaponData=null;
        if(rightHandWeapon){
            rightHandWeaponData=rightHandWeapon.data;
        }
        var leftHandWeapon= actor.items.get(data.secChar.wornGear.weapons[0]);
        let leftHandWeaponData=null;
        if(leftHandWeapon){
            leftHandWeaponData=leftHandWeapon.data;
        }


        let master=false;
        if(rightHandWeaponData&&actor.getFlag("fortyk","WeaponMaster").toLowerCase().includes(rightHandWeaponData.data.type.value.toLowerCase())){
            master=true;
        }else if(leftHandWeaponData&&actor.getFlag("fortyk","WeaponMaster").toLowerCase().includes(leftHandWeaponData.data.type.value.toLowerCase())){
            master=true;
        }
        if(master){
            init+="+2";
        }

    }

    return init;





};