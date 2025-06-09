

let props=scope.entity.system.props;
let stat=scope.stat;
let statRating=parseInt(props[stat]);
let statName=scope.name;

let fresh=props.fresh;
let screenTop = window.innerHeight - 400;
let screenLeft = (window.innerWidth * .05);


async function rollFormula(formula) {
  let roll = await new Roll(formula).evaluate();
  roll.toMessage();
}
let options;
let title;




  if(fresh){
    statRating++;
  }
  title=`${statName} test!`;
  options = `
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Skill Rating:</label>
    <input type="number" value="${statRating}" disabled/>
</div>
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Additional dice:</label>
    <input id="output-diceQuantity" type="number" value="0" />
</div>



`;



new Dialog({
  title: title,
  content: `<form>${options}</form>`,
  buttons: {

    d6: {
      label: `<div class="dnd5e chat-card"><header class="card-header flexrow"><h3 style="text-align:center;"><b><img src="icons/svg/d6-grey.svg" width="72;" /> D6</b></h3></header></div>`,
      callback: (html) => {
        
        
        let numDie = statRating+parseInt(html.find("input[id='output-diceQuantity']").val());
    
        
        
        let dieSize = "d6";
        rollFormula(`${numDie}${dieSize}cs>=4`);
      }
    },

  },
  default: '',
  render: (html)=>{
    console.log(html)
    html.find("input[id='output-diceQuantity']").select();}
},
           {height:220,width:550,left:screenLeft,top:screenTop
           }).render(true);