let tables=[['Tier 1 Accessories','Level 2 Requisition Accessories','Level 3 Requisition Accessories','Level 4 Requisition Accessories','Level 5 Requisition Accessories'],
            ['Tier 1 Armors','Level 2 Requisition Armors','Level 3 Requisition Armors','Level 4 Requisition Armors','Level 5 Requisition Armors'],
            ['Tier 1 Melee Weapons','Level 2 Requisition Melee Weapons','Level 3 Requisition Melee Weapons','Level 4 Requisition Melee Weapons','Level 5 Requisition Melee Weapons'],
            ['Tier 1 Purity seals','Level 2 Requisition Purity seals','Level 3 Requisition Purity seals','Level 4 Requisition Purity seals','Level 5 Requisition Purity seals'],
            ['Tier 1 Ranged Weapons','Level 2 Requisition Ranged Weapons','Level 3 Requisition Ranged Weapons','Level 4 Requisition Ranged Weapons','Level 5 Requisition Ranged Weapons']];
let content=`<section>
<div class="form-group">
<label>Requisition Level</label>
<select id="req-level" name="req-level">
<option value="0">Level 1</option>
<option value="1">Level 2</option>
<option value="2">Level 3</option>
<option value="3">Level 4</option>
<option value="4">Level 5</option>
</select>
</div>
<div class="form-group">
<label>Type</label>
<select id="item-type" name="item-type">
<option value="0">Accessories</option>
<option value="1">Armors</option>
<option value="2">Melee Weapons</option>
<option value="3">Purity seals</option>
<option value="4">Ranged Weapons</option>
</select>
</div>
<div class="form-group">
<label>Items to Roll</label>
<input type="number" value="1" data-edit="light-color" name="rollnumber">
</div>
</section>`;
let proceed=false;
new Dialog({
    title: `Generate Requisition Items`,
    content:content,
    buttons: {
        yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Roll Items`,
            callback: ()=>proceed=true
        },
        no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel`
        },
    },
    default: "yes",
    close: async html => {
        if(proceed){
            let rollNumber= parseInt(html.find('[name="rollnumber"]')[0].value);
            let itemType= parseInt(html.find('[name="item-type"]')[0].value);
            let reqLevel= parseInt(html.find('[name="req-level"]')[0].value);
            const table = game.tables.getName(tables[itemType][reqLevel]);
            await table.drawMany(rollNumber, {});
        }



    }
}).render(true);
