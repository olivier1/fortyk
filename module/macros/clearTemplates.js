let scene=game.canvas.scene;
let regions=scene.regions;
for(const region of regions){
if(region.getFlag("fortyk", "damagetemplate")){

    await region.delete()
}
}