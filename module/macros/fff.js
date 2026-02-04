let item=fromUuidSync("Item.9ot7uOUWA5gr2YvL");
let actor=fromUuidSync("Actor.GwIHbvZVOe2FMDjf");
console.log(item.validateActor(actor));


const get = (from, ...selectors) =>
[...selectors].map((s) =>
                   s
                   .replace(/\[([^\[\]]*)\]/g, ".$1.")
                   .split(".")
                   .filter((t) => t !== "")
                   .reduce((prev, cur) => prev && prev[cur], from)
                  );
let props=scope.entity.system.props;
let skill=get(props,scope.path)[0];
let skillName=skill.skill;
let skillRating=parseInt(skill.rating);
let fresh=props.fresh;
let screenTop = window.innerHeight - 400;
let screenLeft = (window.innerWidth * .05);


async function rollFormula(formula) {
  let roll = await new Roll(formula).evaluate();
  roll.toMessage();
}
let options;
let title;
let bl=skillRating===0;

if(bl){

  let stat;
  if(skill.bl==="W"){
    stat="will";
    skillRating=props.will;
  }else{
    stat="health";
    skillRating=props.health;
  }
  if(fresh){
    skillRating++;
  }

  title=`Beginner's Luck roll for ${skillName} using ${stat}!`;
  options = `
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Skill Rating:</label>
    <input type="text" value="${skillRating}/2" disabled/>
</div>
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Additional taxed dice:</label>
    <input id="output-diceQuantity" type="number" value="0" />
</div>
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Additional non-taxed dice:</label>
    <input id="taxed-output-diceQuantity" type="number" value="0" />
</div>


`;
}else{
  if(fresh){
    skillRating++;
  }
  title=`${skillName} roll!`;
  options = `
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Skill Rating:</label>
    <input type="number" value="${skillRating}" disabled/>
</div>
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Additional dice:</label>
    <input id="output-diceQuantity" type="number" value="0" />
</div>



`;
}


new Dialog({
  title: title,
  content: `<setion>${options}</section>`,
  buttons: {

    d6: {
      label: `<div class="dnd5e chat-card"><header class="card-header flexrow"><h3 style="text-align:center;"><b><img src="icons/svg/d6-grey.svg" width="72;" /> D6</b></h3></header></div>`,
      callback: (html) => {
        let numDie;
        if(bl){
          let half=Math.ceil((skillRating+parseInt(html.find("input[id='output-diceQuantity']").val()))/2);
          numDie=half+parseInt(html.find("input[id='taxed-output-diceQuantity']").val());
        }else{
          numDie = skillRating+parseInt(html.find("input[id='output-diceQuantity']").val());
        }
        
        
        let dieSize = "d6";
        rollFormula(`${numDie}${dieSize}cs>=4`);
      }
    },

  },
  default: '',
  render: (html)=>{
    html.find("input[id='output-diceQuantity']").select();}
},
           {height:220,width:550,left:screenLeft,top:screenTop
           }).render(true);
