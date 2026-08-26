

export class FortyKElevationBehavior extends foundry.data.regionBehaviors.RegionBehaviorType {


    /**
   * Build the editable schema for this region behavior, including:
    * the elevation of the region
   * @returns {object} Schema definition object for Foundry VTT forms.
   */
    static defineSchema() {
        const schema = {};

        schema.elevation = new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            initial: 0,
            min: -100,
            max: 100,
            step: 1,
            label: "Elevation",
            localize: false,
        });

        return schema;
    }
    static async #onTokenEnter(event) {
        const {token, movement} = event.data;
        const elevation = this.elevation;
        if(!movement)return token.update({"elevation":elevation});
        // 1. Prevent the standard hard-stop
        token.stopMovement(); 

        // 2. Await the current step's animation frame
        if (token.rendered) await token.object.movementAnimationPromise; 

        // 3. Map and filter the remaining waypoints, applying the updated token property
        const adjustedWaypoints = movement.pending.waypoints
        .filter(w => !w.intermediate)
        .map(w => ({ ...w, elevation: elevation }));

        // 4. Force Foundry to resume the rest of the original drag path
        await token.move(adjustedWaypoints, { ...movement.options });
        
    }
    static events = {
        [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter
    }

}