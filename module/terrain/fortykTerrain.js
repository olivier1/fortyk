export class FortyKTerrain extends CONFIG.Token.movement.TerrainData{
   static getMovementCostFunction(token, options){
   

      return(from, to, distance, segment) => {
        
         return distance * (segment.terrain?.difficulty ?? 1);
      };
   }
}