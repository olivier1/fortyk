// Assuming you have a viewer token selected and a target token targeted
const viewerToken = canvas.tokens.controlled[0];
const targetToken = Array.from(game.user.targets)[0];

if (viewerToken && targetToken) {
    // Get the viewer's vision source
    const visionSource = viewerToken.vision;

    // Define the detection mode (e.g., "BasicSight")
    // 'target' is the object being tested, 'test' is an optional configuration object
    const collision = CONFIG.Canvas.polygonBackends['sight'].testCollision(viewerToken, targetToken,{mode:"any", type:"sight"})

    if (collision) {
         console.log("The target is blocked by a wall or obstacle.");
    } else {
         console.log("Line of sight is clear! The target is visible.");
      
    }
} else {
    console.log("Please select one viewer token and target one target token.");
}