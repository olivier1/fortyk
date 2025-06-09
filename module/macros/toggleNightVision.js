for ( let token of canvas.tokens.controlled ) {
    if(token.document.sight.visionMode==="basic"){
        let dimSight = 20;
        let brightSight = 0;
        let visionMode = 'lightAmplification';
        token.document.update({
            "sight.enabled": true,
            "sight.range": dimSight,

            "sight.visionMode": visionMode

        });
    }else{
        let dimSight = 0;
        let brightSight = 0;
        let visionMode = 'basic';
        token.document.update({
            "sight.enabled": true,
            "sight.range": dimSight,

            "sight.visionMode": visionMode

        });
    }


}
