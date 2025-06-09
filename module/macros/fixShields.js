for(let target of canvas.tokens.controlled){
   
                let lightId=await tokenAttacher.getAllAttachedElementsByTypeOfToken(target, "AmbientLight")[0];
                let lightObj=game.canvas.lighting.get(lightId);
                
                await lightObj.document.update({"config.dim":6});

                await tokenAttacher.attachElementToToken(lightObj, target, true);
}