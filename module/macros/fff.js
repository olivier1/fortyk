(async () => { 

    const darkness = 0.5; 
    // set darkness level here 
    const weather = "rain"; 
    // set weather here; 
    let scene=canvas.scene;


    await scene.update({darkness, weather}); 
})();