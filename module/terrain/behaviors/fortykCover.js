

export class FortyKCoverBehavior extends foundry.data.regionBehaviors.RegionBehaviorType {


    /**
   * Build the editable schema for this region behavior, including:
    * the elevation of the region
   * @returns {object} Schema definition object for Foundry VTT forms.
   */
    static defineSchema() {
        const schema = {};

        schema.cover = new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            choices:{25: "Light Cover" ,
                     50: "Medium Cover" ,
                     75: "Heavy Cover"},
            initial:25,
            integer:false,
            label: "Cover",
            localize: false,
        });
        schema.areaCover = new foundry.data.fields.BooleanField({
            required:true,
            initial:false,
            label:"Is Area Cover",
            localize:false
        })

        return schema;
    }


}