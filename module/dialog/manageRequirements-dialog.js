const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class ManageRequirementsDialog extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS= {

            tag: 'form',
            classes: ["fortyk"],
            position:{width: 666,
            height: 605}

    }
    static PARTS = {
        form: {
            template: 'systems/fortyk/templates/item/dialogs/manageRequirements-dialog.html',
            scrollable: ['']
        },

        manageReqMain: {
            template: "systems/fortyk/templates/item/dialogs/manage-requirements-parts/manage-requirements-main.html",
            scrollable: ['']
        },
        manageReqSkills: {
            template: "systems/fortyk/templates/item/dialogs/manage-requirements-parts/manage-requirements-skills.html",
            scrollable: ['']
        },
        manageReqFlags: {
            template: "systems/fortyk/templates/item/dialogs/manage-requirements-parts/manage-requirements-flags.html",
            scrollable: ['']
        },
        manageReqCyber: {
            template: "systems/fortyk/templates/item/dialogs/manage-requirements-parts/manage-requirements-cyber.html",
            scrollable: ['']
        },
        manageReqPsy: {
            template: "systems/fortyk/templates/item/dialogs/manage-requirements-parts/manage-requirements-psy.html",
            scrollable: ['']
        }
    }
    static TABS = {
        sheet:{
            tabs: [
                { id: 'manageReqMain', group: 'sheet', label: 'Main' },
                { id: 'manageReqSkills', group: 'sheet', label: 'Skills' },
                { id: 'manageReqFlags', group: 'sheet', label: 'Flags' },
                { id: 'manageReqCyber', group: 'sheet', label: 'Cybernetics' },
                { id: 'manageReqPsy', group: 'sheet', label: 'Psychic Powers' }
            ],
            initial:"manageReqMain"
        }

    }

    async _prepareContext(options){
        let data=await super._prepareContext(options);
        let item=this.options.item;
        data.advances=game.fortyk.FORTYK.advances;
        data.item=item;
        let flag=this.flag;
        data.tabs=this._prepareTabs("sheet");
        if(!flag)flag=item.getFlag("fortyk",this.options.flag);
        if(!flag){flag=this.getDefaultFlag();}else{foundry.utils.mergeObject(flag,this.getDefaultFlag(),{overwrite:false});}
        data.flag=flag;
        this.flag=flag;
        let compendiums=game.packs.filter((compendium, key)=>{
            if(compendium.folder?.name==="Talents and Traits"){
                return true;
            }else if(compendium.title==="Elite Advances"){
                return true;
            }else{
                return false;
            }
        });
        this.compendiums=compendiums;
        data.compendiums=compendiums;
        data.chosenCompendium=this.chosenCompendium;
        if(!data.chosenCompendium)data.chosenCompendium="";
        data.compendiumContents=this.compendiumContents;
        let psyPowersCompendium=game.packs.get("fortyk.psychic-powers");
        let navPowersCompendium=game.packs.get("fortyk.navigator-powers");
        
        data.psyPowers=await psyPowersCompendium.getDocuments();
        data.psyPowers=data.psyPowers.concat(await navPowersCompendium.getDocuments());
        data.psyPowers=data.psyPowers.filter((power)=>{
            for(const psyflag in this.flag.psychicPowers){
                if(psyflag===power.id)return false;
            }
            return true;
        });
        
        data.psyPowers=data.psyPowers.sort((a,b)=>{
            if (a.name>b.name) {
                return 1;
            }
            if (a.name<b.name) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        return data;
    }
    _onRender(context, options) {
        super._onRender(context, options);
        const html=$(this.element);
        html.find('.compendium-select').change(this._onCompendiumChange.bind(this));
        html.find('.req-select').change(this._onRequirementChange.bind(this));
        html.find('.psy-select').change(this._onPsyChange.bind(this));
        html.find('.add-flag').click(this._onAddFlagClick.bind(this));
        html.find('.add-OR-flag').click(this._onAddORFlagClick.bind(this));
        html.find('.add-psy').click(this._onAddPsyClick.bind(this));
        html.find('.add-skill').click(this._onAddSkillClick.bind(this));
        html.find('.delete-flag').click(this._onDeleteFlagClick.bind(this));
        html.find('.delete-OR-flag').click(this._onDeleteORFlagClick.bind(this));
        html.find('.delete-psy').click(this._onDeletePsyClick.bind(this));
        html.find('.delete-neg-psy').click(this._onDeleteNegPsyClick.bind(this));
        html.find('.delete-skill').click(this._onDeleteSkillClick.bind(this));
        html.find('.save-reqs').click(this._onSaveReqsClick.bind(this));
        html.find('.char-creation-checkbox').click(this._onCharCreationClick.bind(this));
        html.find('.char-input').keyup(this._onCharInput.bind(this));
        html.find('.char-input').keydown(this._onEnterInput.bind(this));
        html.find('.char-select').change(this._onCharAdvanceChange.bind(this));
        html.find('.cyber-input').keyup(this._onCyberInput.bind(this));
        html.find('.cyber-input').keydown(this._onEnterInput.bind(this));

        // Autoselect entire text 
        html.find('input[type=text]').focusin(function() {

            $(this).select();
        });
        html.find('input[type=number]').focusin(function() {

            $(this).select();
        });
    }
    _onCharCreationClick(event){
        let value=event.currentTarget.checked;
        this.flag.characterCreation=value;
    }
    _onCharAdvanceChange(event){
        let charSelect=event.currentTarget;
        let value=parseInt(charSelect.value);
        let char=charSelect.dataset.char;
        this.flag.characteristics[char].adv=value;
    }
    _onCharInput(event){
        var element = event.target;
        let newAmt=element.value;
        let key= element.id;
        let flag=this.flag;
        flag.characteristics[key].value=parseInt(newAmt);
    }
    _onCyberInput(event){
        let cyberNumNode=document.getElementById("cybernumber");
        let limbNumNode=document.getElementById("limbnumber");
        let specificCyberNode=document.getElementById("cybername");
        let cyberNum=parseInt(cyberNumNode.value);
        let limbNum=parseInt(limbNumNode.value);
        let specificCyber=specificCyberNode.value;
        this.flag.cybernetics.number=cyberNum;
        this.flag.cybernetics.limbs=limbNum;
        this.flag.cybernetics.name=specificCyber;

    }
    async _onRequirementChange(event){
        let el=event.currentTarget;
        let label=el.options[el.selectedIndex].innerHTML;
        let flagId=el.value;
        console.log(el)
        let spec=el.options[el.selectedIndex].dataset.spec;
        let type=el.options[el.selectedIndex].dataset.type;
        this.chosenFlag={flagId:flagId, label:label, spec:spec, type:type};
    }
    async _onPsyChange(event){
        let el=event.currentTarget;
        let label=el.options[el.selectedIndex].innerHTML;
        let flagId=el.value;
        this.chosenPsy={flagId:flagId, label:label};
    }
    async _onAddFlagClick(event){
        let flag=this.chosenFlag;
        if(!flag)return;
        let type=flag.type;
        let spec="";
        if(type==="talentntrait"){

            if(flag.spec!=="N/A"){
                let chosenSpec=await Dialog.prompt({
                    title: `Choose specialisation for ${flag.label}`,
                    content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${flag.spec}" autofocus/></p>`,



                    callback: async(html) => {
                        const choosenSpec = $(html).find('input[name="spec"]').val();

                        return choosenSpec;
                    },






                    width:100});
                spec=chosenSpec.toLowerCase();

            }
        }
        let flagObject={label:flag.label, spec:spec};
        let negativeCheckbox=document.getElementById("notflagcheckbox");
        let negative=negativeCheckbox.checked;
        if(negative)flagObject.negative=true;
        this.flag.flags[flag.flagId]=flagObject;
        this.chosenFlag=undefined;
        this.compendiumContents=this.compendiumContents.filter((item)=>{
            for(const flag in this.flag.flags){

                if(item.system.flagId.value===flag){
                    return false;
                }
            }
            return true;
        });
        this.render();
    }
    async _onAddORFlagClick(event){
        let flag=this.chosenFlag;
        if(!flag)return;
        let type=flag.type;
        let spec="";
        if(type==="talentntrait"){

            if(flag.spec!=="N/A"){
                let chosenSpec=await Dialog.prompt({
                    title: `Choose specialisation for ${flag.label}`,
                    content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${flag.spec}" autofocus/></p>`,



                    callback: async(html) => {
                        const choosenSpec = $(html).find('input[name="spec"]').val();

                        return choosenSpec;
                    },






                    width:100});
                spec=chosenSpec.toLowerCase();

            }
        }
        let flagObject={label:flag.label, spec:spec};
        let negativeCheckbox=document.getElementById("notflagcheckbox");
        let negative=negativeCheckbox.checked;
        if(negative)flagObject.negative=true;
        if(!this.flag.ORflags)this.flag.ORflags={};
        this.flag.ORflags[flag.flagId]=flagObject;
        this.chosenFlag=undefined;
        this.compendiumContents=this.compendiumContents.filter((item)=>{
            for(const flag in this.flag.ORflags){

                if(item.system.flagId.value===flag){
                    return false;
                }
            }
            return true;
        });
        this.render();
    }
    async _onAddPsyClick(event){

        let flag=this.chosenPsy;
        if(!flag)return;
         let negativeCheckbox=document.getElementById("notpsycheckbox");
        let negative=negativeCheckbox.checked;
        if(negative){
            this.flag.negativePsyPowers[flag.flagId]=flag.label;
        }else{
            this.flag.psychicPowers[flag.flagId]=flag.label;
        }
        
        this.chosenFlag=undefined;
        this.render();
    }
    _onAddSkillClick(event){
        let skillNameElement=document.getElementById("skillname");
        let parentSkillNameElement=document.getElementById("parentskillname");
        let skillRankElement=document.getElementById("skillrank-select");
        let skillName=skillNameElement.value;
        let parentSkillName=parentSkillNameElement.value;
        let skillRank=skillRankElement.value;
        let stringID;
        let name="";
        if(parentSkillName){
            stringID=parentSkillName+":"+skillName;
            name=parentSkillName+`(${skillName})`;
            stringID=stringID.toLocaleLowerCase();
        }else{
            stringID=skillName.toLowerCase();
            name=skillName;
        }



        this.flag.skills[stringID]={name:name, skillName:skillName, parentSkillName:parentSkillName, rank:skillRank};

        this.render();

    }
    _onDeleteFlagClick(event){
        let flag=event.currentTarget.dataset.id;
        this.flag.flags[flag]=null;
        this.render();
    }
    _onDeleteORFlagClick(event){
        let flag=event.currentTarget.dataset.id;
        this.flag.ORflags[flag]=null;
        this.render();  
    }
    _onDeletePsyClick(event){
        let flag=event.currentTarget.dataset.id;
        this.flag.psychicPowers[flag]=null;
        this.render();
    }
    _onDeleteNegPsyClick(event){
        let flag=event.currentTarget.dataset.id;
        this.flag.negativePsyPowers[flag]=null;
        this.render();
    }
    _onDeleteSkillClick(event){
        let flag=event.currentTarget.dataset.id;
        this.flag.skills[flag]=null;
        console.log(this);
        this.render();
    }
    async _onCompendiumChange(event){
        let newCompendium=event.target.value;
        let compendiumInstance=this.compendiums.find((compendium)=>compendium.metadata.id===newCompendium);
        this.chosenCompendium=compendiumInstance.metadata.id;
        this.compendiumContents=await compendiumInstance.getDocuments();
        this.compendiumContents=this.compendiumContents.filter((item)=>{
            for(const flag in this.flag.flags){
                let spec=this.flag.flags[flag]?.spec;
                if(spec===undefined)continue;
                if(!spec&&item.system.flagId.value===flag){
                    return false;
                }
            }
            return true;
        });
        this.compendiumContents=this.compendiumContents.sort((a,b)=>{
            if (a.name>b.name) {
                return 1;
            }
            if (a.name<b.name) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        this.render();
    }
    async _onSaveReqsClick(event){
        let flag=this.options.flag;
            let update={};
            update[flag]=this.flag;
            await this.options.item.setFlag("fortyk", flag, this.flag);
        this.close();
    }
    async _onEnterInput(event){
        if (event.key === 'Enter') {
            this._onSaveReqsClick(event);
        }
    }
    getDefaultFlag(){
        let flag={
            characteristics:{
                ws:{
                    value:0,
                    label:"Weapon Skill",
                    adv:"0"
                },
                bs:{
                    value:0,
                    label:"Ballistic Skill",
                    adv:"0"
                },
                s:{
                    value:0,
                    label:"Strength",
                    adv:"0"
                },
                t:{
                    value:0,
                    label:"Toughness",
                    adv:"0"
                },
                per:{
                    value:0,
                    label:"Perception",
                    adv:"0"
                },
                int:{
                    value:0,
                    label:"Intelligence",
                    adv:"0"
                },
                wp:{
                    value:0,
                    label:"Willpower",
                    adv:"0"
                },
                fel:{
                    value:0,
                    label:"Fellowship",
                    adv:"0"
                },
                agi:{
                    value:0,
                    label:"Agility",
                    adv:"0"
                },
                inf:{
                    value:0,
                    label:"Influence"
                },
                exp:{
                    value:0,
                    label:"Experience spent"
                },
                pr:{
                    value:0,
                    label:"Psy Rating"
                },
                ins:{
                    value:0,
                    label:"Insanity"
                },
                cor:{
                    value:0,
                    label:"Corruption"
                },
                mut:{
                    value:0,
                    label:"Mutations"
                },
                mastpow:{
                    value:0,
                    label:"Mastered Powers"
                },
                mastpath:{
                    value:0,
                    label:"Mastered Paths"
                }
            },
            flags:{},
            ORflags:{},
            psychicPowers:{},
            negativePsyPowers:{},
            skills:{},
            cybernetics:{
                number:0,
                limbs:0,
                name:""
            }
        };
        return flag;
    }


}
