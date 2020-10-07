const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT = 10;
const SECRET_KEY = process.env.SECRET;
var gl=1;
mongoose.connect('mongodb://localhost:27017/test')

const userSchema = mongoose.Schema({
    email:{
      type:String,
      required:true,
      trim:true,
      unique:1
    },
    password:{
      type:String,
      required:true,
      minlength:6
    },
    token:{
      type:String
    }
  })

  userSchema.pre('save', function(next){
      var user = this;

      if(user.isModified('password')){
        bcrypt.genSalt(SALT, (err,salt)=>{
            if(err) return next(err);
            else{
                bcrypt.hash(user.password,salt,function(err,hash){
                    if(err) return next(err);
                    else{
                        user.password=hash;
                        next();
                    }
                })
            }
        })
      }else{
          next();
      }
  })

  userSchema.methods.comparePassword=function(candidatePassword, cb){
    var user = this;
    bcrypt.compare(candidatePassword, user.password, function(err,isMatch){
      if(err) throw cb(err);
      else cb(null, isMatch);
    })
  }

  userSchema.methods.generateToken=function(cb){
    var user=this;
    var token = jwt.sign(user._id.toHexString(),SECRET_KEY);
    user.token=token;
    user.save(function(err,user){
      if(err) return cb(err);
      else cb(null, user);
    })
  }

  userSchema.statics.findByToken=function(token, cb){
    const user=this;

    jwt.verify(token, SECRET_KEY, function(err, decode){
      if(err) return cb(err);
      user.findOne({"_id":decode,"token":token},function(err,user){
        if(err) return cb(err);
        else cb(null, user);
      })
    })
  }
  
  const User = mongoose.model('User', userSchema);


  
  const dataSchema = mongoose.Schema({
    tmp:Number,
    hum:Number,
    gHum:Number,
    date: Date,
    counter:Number,
    userId:String
  })

  dataSchema.pre('save', function(next){
    var data = this;
    data.counter = gl++;
    next();
})
  
  const Data = mongoose.model('Data', dataSchema);


  const settingsSchema = mongoose.Schema({
    wntTmp:Number,
    wntHum:Number,
    wntGHum:Number,
    act:Number,
    reccAct:Number,
    aut:Number,
    userId:String
  })

  const Settings = mongoose.model('Settings', settingsSchema);

  /*const newSettings = new Settings({
    wntTmp:24,
    wntHum:58,
    wntGHum:38,
    act:0,
    reccAct:0,
    aut:1,
    userId:'5f7a3c1249a5040580c12148'
  })

  newSettings.save(function(err,doc){
    if(err) console.log(err);
    else console.log(doc);
  })

 const newData = new Data({
    tmp: 25,
    hum: 60,
    gHum: 40,
    userId:'5f7a3c1249a5040580c12148'
  })

  newData.save(function(err,doc){
    if(err) console.log(err);
    else console.log(doc);
  })


  /*User.findOne({'email':'milosthelukic@gmail.com'},function(err,user){
    if(err){
      console.log(err);
    }
    else if(!user){
      const newUser = new User({
        email:'milosthelukic@gmail.com',
        password:'safetyfirst'
      })
      newUser.save(function(err,doc){
        if(err) console.log(err);
        else console.log(doc);
      })
    }
  })*/

 /* var date = new Date();

  for(var i=0;i<48;i++){
    let tmp = Math.floor(Math.random() * 30);
    let hum = Math.floor(Math.random() * 50);
    let gHum = Math.floor(Math.random() * 80);
    date = new Date(date.getTime() + 30*60000);
    const newData = new Data({
      tmp: tmp,
      hum: hum,
      gHum: gHum,
      date:date,
      userId : "5f7a3c1249a5040580c12148"
    })
    newData.save(function(err,data){
      if(err) console.log(err);
    })
  }
*/

  Data.find({}).sort({counter:-1}).limit(1).then(data=>{
    if(data)
    gl = data[0].counter+1;
    else gl=1;
  }).catch(err=>{
    console.log(err);
  })
  module.exports={User, Data, Settings}