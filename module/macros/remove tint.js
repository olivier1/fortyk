for(let token of canvas.tokens.controlled){
    
    if(token.data.tint!==""){
        token.document.update({tint: ""});
    }
    
}