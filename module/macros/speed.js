let screenTop = window.innerHeight - 400;
let screenLeft = (window.innerWidth * .05);

async function rollFormula(formula) {
 let roll = await new Roll(formula).evaluate();
 roll.toMessage();
}

let options = `
<div style="display:inline; float:left;width: 30%;margin-right:15px;text-align:center;" >
    <label for="output-diceQuantity">Number of dice:</label>
    <input id="output-diceQuantity" type="number" value="1" />
</div>


`;
 
new Dialog({
 title: `Die Roller`,
 content: `<form>${options}</form>`,
 buttons: {
  
  d6: {
    label: `<div class="dnd5e chat-card"><header class="card-header flexrow"><h3 style="text-align:center;"><b><img src="icons/svg/d6-grey.svg" width="72;" /> D6</b></h3></header></div>`,
    callback: (html) => {
      let numDie = html.find("input[id='output-diceQuantity']").val();
      let modifier = html.find("input[id='output-modifier']").val();
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