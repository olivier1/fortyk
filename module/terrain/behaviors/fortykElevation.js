

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


}