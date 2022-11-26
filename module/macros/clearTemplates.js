let scene=game.scenes.active;
let templates=scene.templates;
for(const template of templates){
    await template.delete()
}