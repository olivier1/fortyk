let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let targetIds=scope.targets;
let fatigueGain=targetIds.length*2;
let fatigue=actor.system.secChar.fatigue.value;
let newFatigue=fatigue+fatigueGain;
actor.update({"system.secChar.fatigue.value":newFatigue});