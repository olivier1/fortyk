for(let token of canvas.tokens.controlled){
    
    if(token.document.texture.tint!==""){
        token.document.update({"texture.tint": ""});
    }
    
}