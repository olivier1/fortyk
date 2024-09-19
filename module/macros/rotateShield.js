console.log(scope)
new Dialog({
    title: `Change Ion Shield Orientation`,
    content: `
<form>
<div class="form-group">
<label>Ion Shield Facing</label>
<select id="ion-rotation" name="ion-rotation">
<option value="nochange">No Change</option>
<option value="0">Front</option>
<option value="90">Right</option>
<option value="270">Left</option>
<option value="180">Rear</option>
</select>
</div>
</form>
`,
    buttons: {
        yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Apply Changes`,
            callback: async (html) =>{
                let side=html.find('[name="ion-rotation"]')[0].value || "none";
                if(side==="nochange"){return};
                let rotation=parseInt(side);
                if(game.user.isGM){
                    let token=canvas.tokens.controlled[0];
                    let lightId=await tokenAttacher.getAllAttachedElementsByTypeOfToken(token, "AmbientLight")[0];
                    let lightObj=game.canvas.lighting.get(lightId);
                    let lightData=foundry.utils.duplicate(lightObj.document);

                    tokenAttacher.detachElementFromToken(lightObj, token, true);
                    lightObj.document.delete();


                    let tokenRotation=token.document.rotation;
                    rotation+=tokenRotation;
                    console.log(data)
                    data.rotation=rotation;

                    let newLights=await game.canvas.scene.createEmbeddedDocuments("AmbientLight",[data]);

                    let newLight=newLights[0];
                    console.log(newLight)
                    await tokenAttacher.attachElementToToken(newLight, token, true); 
                }else{

                    let socketIon={type:"rotateShield",package:{"tokenId":token.id, "angle":side}}
                    await game.socket.emit("system.fortyk",socketIon);
                }


            }
        },
        no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel Changes`
        },
    },
    default: "yes"
}).render(true);
