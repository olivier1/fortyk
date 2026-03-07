export class FortyKPlaceableToken extends foundry.canvas.placeables.Token{
    measureMovementPath(waypoints, options){
        return super.measureMovementPath(waypoints, options);
    }
    createTerrainMovementPath(waypoints, options){
     return super.createTerrainMovementPath(waypoints, options);   
    }
    
}