const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const {User, Data, Settings} = require('./models');
let newDatas = new Map();
let addedMap = new Map();


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://heroku_6x6wx931:1r3nid1jjuv7qvcbrivflvh216@ds135522.mlab.com:35522/heroku_6x6wx931')
const exp = express();







mapAction = (action)=>{
    if(action==0) return "All ok.";
    else{
      let response = "";
      let airAction = parseInt(action/10);
      let groundAction = action%10;
      if(groundAction==1) response+="Ground too humid. ";
      else if(groundAction==2) response+="Ground too dry. ";
      if(airAction==1) response+="Air temperature and humidity too high.";
      else if(airAction==2) response+="Air temperature and humidity too low.";
      return response;
    }
  }

  mapReccAction = (reccAction, actualAction)=>{
    if(reccAction==0&&actualAction==0) return "No action necessary.";
    else{
      let response = "";
      let airAction = parseInt(actualAction/10);
      let groundAction = actualAction%10;
      let reccAirAction = parseInt(reccAction/10);
      let reccGroundAction = reccAction%10;

      if(reccGroundAction==1){
        response+="Should close the valve. ";
        if(groundAction==1) response+="(Done) ";
      } 
      else if(reccGroundAction==2){
        response+="Should open the valve. ";
        if(groundAction==2) response+="(Done) ";
      } 
      if(reccAirAction==1){
        response+="Should open the door.";
        if(airAction==1) response+="(Done) ";
      } 
      else if(reccAirAction==2){
          response+="Should close the door.";
          if(airAction==2) response+="(Done) ";
      }
      return response;
    }
  }

exp.use(bodyParser.urlencoded({ extended: true }));
exp.use(bodyParser.json());
exp.use(cookieParser());
exp.use(express.static('temp_hum_app/build'))
/*exp.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });*/


exp.get('/get-data', (req,res)=>{
  let token = req.cookies.auth;
  if(token){
    let statusMap = new Object();
    var statusMapData;
    User.findByToken(token, (err,user)=>{
      if(err) throw err;
      else if(!user) return res.status(401).send('Not authorised.');
      else {
        Data.find({'userId':user._id}).sort({counter:-1}).limit(48).then(data=>{
          statusMapData = {...data};
          Settings.findOne({'userId':user._id},(err, settings)=>{
            if(err) console.log(err);
            else {
              //console.log('settings',settings);
              statusMap.settings = new Object();
              statusMap.settings.wntTmp = settings.wntTmp;
              statusMap.settings.wntHum = settings.wntHum;
              statusMap.settings.wntGHum= settings.wntGHum;
              statusMap.settings.aut = settings.aut;
              statusMap.settings.act = settings.act;
              statusMap.settings.reccAct = settings.reccAct;
              statusMap.data = statusMapData;
              res.status(200).json(statusMap);
            }
          })
        }).catch(err=>{
          console.log(err);
        })
      }
    })
  }else res.status(401).json({
    auth:false,
    message:'Invalid credentials'
  })
})

exp.get('/get-data-new', (req,res)=>{
  let token = req.cookies.auth;
  if(token){
    User.findByToken(token, (err,user)=>{
      if(err) throw err;
      else if(!user) return res.status(401).send('Not authorised.');
      else {
        let statusMap = new Object();
        //console.log('newdata userid', String(user._id));
        //console.log('newdatas getuser', newDatas.get(String(user._id)))
        statusMap.data = newDatas.get(String(user._id));
        //console.log('newDatas', newDatas);
        Settings.findOne({'userId':user._id},(err, settings)=>{
          if(err) console.log(err);
          else {
            //console.log('settings',settings);
            statusMap.settings = new Object();
            statusMap.settings.wntTmp = settings.wntTmp;
            statusMap.settings.wntHum = settings.wntHum;
            statusMap.settings.wntGHum= settings.wntGHum;
            statusMap.settings.aut = settings.aut;
            statusMap.settings.act = settings.act;
            statusMap.settings.reccAct = settings.reccAct;
            //console.log('get-data-new', statusMap);
            res.send(JSON.stringify(statusMap)+"\n");
          }
        })
      }
    })
  }else res.status(401).json({
    auth:false,
    message:'Invalid credentials'
  })
})

exp.post('/send-data', (req,res)=>{
    //console.log('sendData body', req.body);
    User.findOne({'email':req.body.email}, (err,user)=>{
      if(!user) res.status(400).json({
        auth:false,
        message: 'No user with that email.'
      })
      else{
        user.comparePassword(req.body.pass,(err, isMatch)=>{
          if(err) throw err;
          else if(!isMatch) return res.status(400).json({
            auth:false,
            message: 'Invalid password.'
          })
          else {
            let statusMap = new Object();
            let currentDate = new Date();
            //console.log('minutes', currentDate.getMinutes());
            //console.log('addeds', addedMap);
            if(currentDate.getMinutes()==0||currentDate.getMinutes()==30){
              let alreadyAdded = addedMap.get(String(user._id));
              if(!alreadyAdded){
                const newData = new Data({
                  tmp: req.body.tmp,
                  hum: req.body.hum,
                  gHum: req.body.gHum,
                  userId: user._id,
                  date:currentDate
                })
                newData.save(function(err,data){
                  if(err) console.log(err);
                  /*else {
                    console.log(data);
                  }*/
                })
                addedMap.set(String(user._id), true);
              }
            }else addedMap.set(String(user._id), false);
            let dataObject = new Object();
            dataObject.tmp = req.body.tmp;
            dataObject.hum = req.body.hum;
            dataObject.gHum = req.body.gHum;
            dataObject.date = currentDate;
            newDatas.set(String(user._id), dataObject);
            statusMap.data = dataObject;
            Settings.findOne({'userId':user._id},(err, settings)=>{
              if(err) console.log(err);
              else {
                if(settings){
                  statusMap.wntTmp = settings.wntTmp;
                  statusMap.wntHum = settings.wntHum;
                  statusMap.wntGHum= settings.wntGHum;
                  statusMap.aut = settings.aut;
                  if(settings.aut==0)statusMap.act = settings.act;
                  else statusMap.act = req.body.act;
                }else{
                  statusMap.wntTmp = 25;
                  statusMap.wntHum = 60;
                  statusMap.wntGHum= 40;
                  statusMap.aut = 1;
                  statusMap.act = req.body.act;
                } 
                Settings.update(
                  {userId:user._id},
                  {$set:{
                    reccAct : req.body.act,
                    act : settings.aut==1? req.body.act : settings.act
                  }},
                  (err, newSetting)=>{
                    if(err) return console.log(err);
                  }
                )
                //console.log('send-data', statusMap);
                res.send(JSON.stringify(statusMap)+"\n");
              }
            })
          }
        })
      }
    })
    
})

exp.post('/settings', (req,res)=>{
  //console.log('settings body', req.body);
  let token = req.cookies.auth;
  if(token){
    User.findByToken(token, (err,user)=>{
      if(err) throw err;
      else if(!user) return res.status(401).send('Not authorised.');
      else{
        Settings.update(
          {userId:user._id},
          {$set:{
            wntTmp : req.body.wntTmp,
            wntHum : req.body.wntHum,
            wntGHum : req.body.wntGHum,
            act : req.body.act,
            aut : req.body.aut
          }},
          (err, newSetting)=>{
            if(err) return console.log(err);
          }
        )
        res.send(JSON.stringify(req.body)+"\n");
      }
    })
  }else res.status(401).json({
    auth:false,
    message:'Invalid credentials'
  })
})

exp.post('/login', (req,res)=>{
  let token = req.cookies.auth;
  if(token){
    User.findByToken(token, (err,user)=>{
      if(err) throw err;
      else if(!user){
        return res.status(401).send('Not authorised.');
      }
      else{
        res.status(200).json({
          auth:true,
          message: 'Welcome, ' + user._id + '.'
        })
      } 
    })
  }
  else{
    User.findOne({'email':req.body.email}, (err,user)=>{
      if(!user) res.json({
        auth:false,
        message: 'No user with that email.'
      })
      else{
        user.comparePassword(req.body.password,(err, isMatch)=>{
          if(err) throw err;
          else if(!isMatch) return res.status(400).json({
            auth:false,
            message: 'Invalid password.'
          })
          else {
            user.generateToken((err, user)=>{
              if(err) res.status(200).send(err);
              res.cookie('auth', user.token).json({
                auth:true,
                message: 'Valid login, ' + user.email + '.'
              })
            })
          }
        })
      }
    })
  }
  
})

exp.post('/logout', (req,res)=>{
  let token = req.cookies.auth;
  //console.log("TOKEN", token);

  User.findByToken(token, (err,user)=>{
    if(err) throw err;
    else if(!user) return res.status(401).send('Not authorised.');
    else{
      User.update(
        {_id:user._id},
        {$set:{
          token:null
        }},
        (err, newSetting)=>{
          if(err) return console.log(err);
        }
      )
      res.status(200).json({
        auth:true,
        message: 'Welcome, ' + user._id + '.'
      })
    } 
  })
})

if(process.env.NODE_ENV==='production'){
  const path = require('path');
  exp.get('/*',(req,res)=>{
    res.sendFile(path.resolve(__dirname, '../temp_hum_app', 'build', 'index.html'))
  })
}

const port = process.env.PORT || 3001;

exp.listen(port,()=>{
    console.log(`Started on port ${port}`);
})
console.log("SERVER STARTED!")