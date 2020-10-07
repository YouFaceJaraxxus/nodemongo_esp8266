var date = new Date();

  for(var i=0;i<48;i++){
    let tmp = Math.floor(Math.random() * 30);
    let hum = Math.floor(Math.random() * 50);
    let gHum = Math.floor(Math.random() * 80);
    var date = new Date(date.getTime() + 30*60000);
    const newData = new Data({
      tmp: tmp,
      hum: hum,
      gHum: gHum,
      date:date,
      userId : "5f7c298e0f601320489afec4"
    })
    newData.save(function(err,data){
      if(err) console.log(err);
      /*else {
        console.log(data);
      }*/
    })
  }
