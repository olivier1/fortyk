export class FortyKCards extends Cards{
    //OVERRIDE
    async pass(to,ids,updateData={},action="pass",chatNotification=true){
        
        if(to.type==="pile"){
            let id=ids[0];
            let card=this.cards.get(id);
            let img=card.faces[0].img;
            
            let title=card.name;
            let socketOp={type:"cardSplash",package:{img:img,title:title}}
            
            await game.socket.on;
            await game.socket.emit("system.fortyk",socketOp);
        }
        return super.pass(to,ids,updateData,action,chatNotification);
    }

}