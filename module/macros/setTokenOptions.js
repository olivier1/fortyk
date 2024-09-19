let applyChanges = false;

new Dialog({
    title: `Token Vision Configuration`,
    content: `
<form>
<div class="form-group">
<label>Display Name Type</label>
<select id="name-type" name="name-type">
<option value="nochange">No Change</option>
<option value="0">Never Displayed</option>
<option value="10">When Controlled</option>
<option value="20">Hovered By Owner</option>
<option value="30">Hovered by Anyone</option>
<option value="40">Always For Owner</option>
<option value="50">Always for Everyone</option>
</select>
</div>
<div class="form-group">
<label>Display Bars Type</label>
<select id="bar-type" name="bar-type">
<option value="nochange">No Change</option>
<option value="0">Never Displayed</option>
<option value="10">When Controlled</option>
<option value="20">Hovered By Owner</option>
<option value="30">Hovered by Anyone</option>
<option value="40">Always For Owner</option>
<option value="50">Always for Everyone</option>
</select>
</div>
<label>Vision Type</label>
<select id="vision-type" name="vision-type">
<option value="nochange">No Change</option>
<option value="novision">No Vision</option>
<option value="dim0">Normal Vision</option>
<option value="dim30">Dark-sight (20 m)</option>
<option value="dim60">Dark-sight (40 m)</option>
<option value="dim90">Dark-sight (60 m)</option>
<option value="dim120">Preysense (80 m)</option>
<option value="dim150">Preysense (100 m)</option>
<option value="dim180">Preysense (120 m)</option>
</select>
</div>
<div class="form-group">
<label>Light Source</label>
<select id="light-source" name="light-source">
<option value="nochange">No Change</option>
<option value="none">None</option>
<option value="candle">Candle</option>
<option value="lamp">Glow-globe</option>
<option value="bullseye">Stab-light</option>
</select>
</div>
<div class="form-group">
<label>Light Color</label>
<input type="color" value="${token.document.light.color || '#000000'}" data-edit="light-color" name="light-color">
</div>
</form>
`,
    buttons: {
        yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Apply Changes`,
            callback: () => applyChanges = true
        },
        no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel Changes`
        },
    },
    default: "yes",
    close: html => {
        if (applyChanges) {
            for ( let token of canvas.tokens.controlled ) {
                let visionType = html.find('[name="vision-type"]')[0].value || "none";
                let lightSource = html.find('[name="light-source"]')[0].value || "none";
                let lightColor = html.find('[name="light-color"]')[0].value || '';
                let radiant = false;
                let radiantEffect = 'icons/svg/sun.svg';
                let dimSight = 0;
                let brightSight = 0;
                let dimLight = 0;
                let brightLight = 0;
                let visionMode = 'basic';
                let lightAngle = 360;
                let lockRotation = token.document.lockRotation;
                let nameType = parseInt(html.find('[name="name-type"]')[0].value || "none");
                let barType = parseInt(html.find('[name="bar-type"]')[0].value || "none");
                let vision = true;
               

                // Set the color

                // Get Vision Type Values
                switch (visionType) {
                    case "novision":
                        vision = false;
                        break;
                    case "dim0":
                        dimSight = 0;
                        brightSight = 0;

                        break;
                    case "dim30":
                        dimSight = 20;
                        brightSight = 0;
                        visionMode = 'lightAmplification';
                        break;
                    case "dim60":
                        dimSight = 40;
                        brightSight = 0;
                        visionMode = 'lightAmplification';
                        break;
                    case "dim90":
                        dimSight = 60;
                        brightSight = 0;
                        visionMode = 'lightAmplification';
                        break;
                    case "dim120":
                        dimSight = 80;
                        brightSight = 0;
                        visionMode = 'darkvision';
                        break;
                    case "dim150":
                        dimSight = 100;
                        brightSight = 0;
                        visionMode = 'darkvision';
                        break;
                    case "dim180":
                        dimSight = 120;
                        brightSight = 0;
                        visionMode = 'darkvision';
                        break;
                    case "bright120":
                        dimSight = 0;
                        brightSight= 120;
                        break;
                    case "nochange":
                    default:
                        dimSight = token.document.sight.range;
                        brightSight = token.document.sight.range;
                }
                // Get Light Source Values
                switch (lightSource) {
                    case "none":
                        dimLight = 0;
                        brightLight = 0;
                        break;
                    case "candle":
                        dimLight = 5;
                        brightLight = 2;
                        break;
                    case "lamp":
                        dimLight = 12;
                        brightLight = 6;
                        break;
                    case "bullseye":
                        dimLight = 24;
                        brightLight = 12;
                        lockRotation = false;
                        lightAngle = 52.5;
                        break;
                    case "hooded-dim":
                        dimLight = 5;
                        brightLight = 0;
                        break;
                    case "hooded-bright":
                        dimLight = 60;
                        brightLight = 30;
                        break;
                    case "light":
                        dimLight = 40;
                        brightLight = 20;
                        break;
                    case "torch":
                        dimLight = 40;
                        brightLight = 20;
                        break;
                    case "faerie-fire":
                        dimLight = 10;
                        brightLight = 0;
                        if (!lightColor || lightColor === '#ffffff') lightColor = '#00ff00';
                        break;
                    case "radiant-consumption":
                        dimLight = 20;
                        brightLight = 10;
                        radiant = true;
                        token.toggleEffect(radiantEffect);
                        break;
                    case "nochange":
                    default:
                        dimLight = token.document.light.dim;
                        brightLight = token.document.light.bright;
                        lightAngle = token.document.light.angle;
                        lockRotation = token.document.lockRotation;
                        lightColor = token.document.light.color;
                }
                 if(isNaN(nameType)){
                    nameType=token.document.displayName;
                }
                if(isNaN(barType)){
                    barType=token.document.displayBars;
                }



               
                // Update Token
                token.document.update({
                    "sight.enabled": vision,
                    "sight.range": dimSight,
                    "light.dim": dimLight,
                    "light.bright":  brightLight,
                    "sight.visionMode": visionMode,
                    "light.angle": lightAngle,
                    lockRotation: lockRotation,
                    "light.color": lightColor,
                    displayBars:barType,
                    displayName:nameType
                });

                
            }
        }
    }
}).render(true);