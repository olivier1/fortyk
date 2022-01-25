export class FortyKCards extends Cards{
    //OVERRIDE
    async pass(to,ids,updateData={},action="pass",chatNotification=true){
        console.log(to,ids,updateData);
        if(to.data.type==="pile"){
            let id=ids[0];
            let card=this.cards.get(id);
            let img=card.data.faces[0].img;
            let socketOp={type:"cardSplash",package:{img:img}}
            console.log(socketOp)
            var options = {
                width: "500",
                height: "800"
            };
            
            let dlg = new Dialog({
                title: `Profile Image`,
                content: `<img src="${img}"  width="auto" height="auto">`,
                buttons: {
                    submit: {
                        label: "OK",
                        callback: null
                    }
                },
                default: "submit",
            }, options);
            dlg.render(true); 
            await game.socket.on;
            await game.socket.emit("system.fortyk",socketOp);
        }
        return super.pass(to,ids,updateData,action,chatNotification);
    }

}