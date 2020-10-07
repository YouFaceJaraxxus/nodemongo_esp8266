import React, { Component } from 'react';
import axios from 'axios';
import qs from 'qs';
import {DATA_SERVER} from '../../config.js';
import './MainMenu.css';
import Cookies from 'js-cookie';
import {Line} from 'react-chartjs-2';


var tempDiffTop = 3;
var tempDiffBottom = -3;
var humDiffTop = 3;
var humDiffBottom = -3;

Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

class MainMenu extends Component{
  /*constructor(props){
    super(props);
    let chartData = new Object();
    chartData.datasets = [{
      label: 'Temperature',
            data: [12, 19, 3, 5, 2, 3],
            borderColor : "red",
            fill:false
    },{
      label: 'Humidity',
            data: [5, 3, 8, 25, 11, 4],
            borderColor: "blue",
            fill:false
    },
    {
      label: 'Ground humidity',
      data: [1, 5, 32, 26, 18, 10],
      borderColor: "green",
      fill:false
    }]
    chartData.labels=["13:00","13:30","14:00","14:30","15:00","15:30"]
    console.log('constr chart', chartData);
    this.state.chartData= chartData;
  }*/
  state={
    wantedTemperature : "25.00",
    wantedHumidity : "50.00",
    temperature : "25.00",
    humidity: "50.00",
    wantedGroundTemperature : "10.00",
    wantedGroundHumidity : "15.00",
    groundHumidity: "13.00",
    doorState : 2,
    waterState : 1,
    changeDoor : 2,
    changeWater : 1,
    recommendedDoorState : 2,
    recommendedWaterState : 1,
    autoMode : 0,
    changeWantedTemperature : "25.00",
    changeWantedHumidity : "50.00",
    changeWantedGroundHumidity : "15.00",
    changeAutoMode : 0,
    loading : true
  }

  getData= (changeInputs)=>{
    axios.get("/get-data")
    .then(response=>{
      let data = response.data.data;
      let settings = response.data.settings
      let temperatures = [];
      let humidities =[];
      let groundHumidities = [];
      let labels = [];
      let dataCopy = [];
      for(var i in data){
        dataCopy.push(data[i]);
      }
      dataCopy.sort((a,b)=>{return a.counter-b.counter});
      let len = dataCopy.length-1;
      for(var i in dataCopy){
        let element = data[len-i];
        temperatures.push(element.tmp)
        humidities.push(element.hum)
        groundHumidities.push(element.gHum)
        let date = new Date(element.date);
        labels.push(date.getHours() + ":" + date.getMinutes().pad(2));
      }
      let tempData = new Object();
      tempData.datasets=[];
      tempData.datasets.push({
        label:'Temperature (\u2103)',
        data:temperatures,
        borderColor:"red",
        fill:false
      })
      tempData.labels = labels;

      let humData = new Object();
      humData.datasets=[];
      humData.datasets.push({
        label:'Humidity ( % )',
        data:humidities,
        borderColor:"blue",
        fill:false
      })
      humData.labels = labels;

      let gHumData = new Object();
      gHumData.datasets=[];
      gHumData.datasets.push({
        label:'Ground humidity ( % )',
        data:groundHumidities,
        borderColor:"green",
        fill:false
      })
      gHumData.labels = labels;
      if(settings&&data)
      this.setState({
        tempData:tempData,
        humData:humData,
        gHumData:gHumData,
        temperature : data[0].tmp,
        humidity : data[0].hum,
        wantedTemperature : settings.wntTmp,
        wantedHumidity : settings.wntHum,
        groundHumidity: data[0].gHum,
        wantedGroundHumidity : settings.wntGHum,
        doorState : parseInt(settings.act/10),
        waterState : settings.act%10,
        recommendedDoorState : parseInt(settings.reccAct/10),
        recommendedWaterState : settings.reccAct%10,
        autoMode : settings.aut,
        loading:false
      });
      if(changeInputs){
        this.setState({
          changeWantedHumidity : settings.wntHum,
          changeWantedTemperature : settings.wntTmp,
          changeWantedGroundHumidity : settings.wntGHum,
          changeAutoMode : settings.aut,
          changeWater : settings.act%10,
          changeDoor : parseInt(settings.act/10),
        });
      }
    })
    .catch(error=>{
      console.log("ERROR", error)
    })
  }

  logout = ()=>{
    axios.post('/logout')
    .then(response=>{
      Cookies.remove('auth');
      this.props.history.push('/login');
    }).catch(err=>{
      Cookies.remove('auth');
      this.props.history.push('/login');
    })
  }

  getNewData = ()=>{
    axios.get("/get-data-new")
    .then(response=>{
      let settings = response.data.settings;
      let data = response.data.data;
      this.setState({
        temperature : data.tmp,
        humidity : data.hum,
        wantedTemperature : settings.wntTmp,
        wantedHumidity : settings.wntHum,
        groundHumidity: data.gHum,
        wantedGroundHumidity : settings.wntGHum,
        doorState : parseInt(settings.act/10),
        waterState : settings.act%10,
        recommendedDoorState : parseInt(settings.reccAct/10),
        recommendedWaterState : settings.reccAct%10,
        autoMode : settings.aut
      });
    })
    .catch(error=>{
      console.log("ERROR", error)
    })
  }

  componentDidMount(){
    this.getData(true);
    const intervalNewData = setInterval(() => {
      this.getNewData();
    }, 30000);
    /*const intervalAllData = setInterval(()=>{
      this.getData(false);
    }, 1800000)*/
  }

  mapAction = (recommendedDoorState, recommendedWaterState)=>{
    if(recommendedDoorState==0&&recommendedWaterState==0) return "All ok.";
    else{
      let response = "";
      if(recommendedWaterState==1) response+="Ground too humid. ";
      else if(recommendedWaterState==2) response+="Ground too dry. ";
      if(recommendedDoorState==1) response+="Air temperature and humidity too high.";
      else if(recommendedDoorState==2) response+="Air temperature and humidity too low.";
      return response;
    }
  }


  mapReccAction = (recommendedDoorState, recommendedWaterState, doorState, waterState)=>{
      
    if(recommendedDoorState==0&&recommendedWaterState==0) return "No action necessary.";
    else{
      let response = "";

      if(recommendedWaterState==1){
        response+="Should close the valve. ";
        if(waterState==1) response+="(Done) ";
      } 
      else if(recommendedWaterState==2){
        response+="Should open the valve. ";
        if(waterState==2) response+="(Done) ";
      } 
      if(recommendedDoorState==1){
        response+="Should open the door.";
        if(doorState==1) response+="(Done) ";
      } 
      else if(recommendedDoorState==2){
          response+="Should close the door.";
          if(doorState==2) response+="(Done) ";
      }
      return response;
    }
  }

  mapAutoMode = (autoMode) =>{
    if(autoMode==0) return <div style={{color:"#FB3D13"}}>OFF</div>;
    else if(autoMode==1) return <div style={{color:"#4CFB13"}}>ON</div>
    else return <div style={{color:"#FB3D13"}}>UNDETERMINED</div>
  }

  sendData = () =>{
    let wntTmp = this.state.changeWantedTemperature;
    let wntHum = this.state.changeWantedHumidity;
    let wntGHum = this.state.changeWantedGroundHumidity;
    let aut = this.state.changeAutoMode;
    let act = parseInt(this.state.changeDoor)*10+parseInt(this.state.changeWater);
    let data = qs.stringify({
      wntTmp:wntTmp,
      wntHum:wntHum,
      act:act,
      aut:aut,
      wntGHum : wntGHum
    })
    axios.post("/settings",data)
    .catch(error=>{
      console.log("POST ERROR", error)
    })
  }

  handleTempChange = (event) =>{
    this.setState({changeWantedTemperature: event.target.value>100? 100 : event.target.value<0? 0 : event.target.value});
  }

  handleHumChange = (event) =>{
    this.setState({changeWantedHumidity: event.target.value>100? 100 : event.target.value<0? 0 : event.target.value});
  }

  handleGroundHumChange = (event) =>{
    this.setState({changeWantedGroundHumidity: event.target.value>100? 100 : event.target.value<0? 0 : event.target.value});
  }

  handleAutChange = (event) =>{
    this.setState({changeAutoMode: event.target.checked?1:0});
  }

  handleDoorChange = (event) =>{
    this.setState({changeDoor: event.target.value});
  }

  handleWaterChange = (event) =>{
    this.setState({changeWater: event.target.value});
  }

  parseStyle = (param, wantedParam, bottomDiff, topDiff) =>{
    param = parseInt(param);
    wantedParam = parseInt(wantedParam);
    bottomDiff = parseInt(bottomDiff);
    topDiff = parseInt(topDiff);
    if(param-wantedParam<bottomDiff) return {color:"#339EFF"};
    else if(param-wantedParam>topDiff) return {color:"#FB3D13"};
    else return {color:"#4CFB13"};
  }

  render(){
    return (
      <div className="main_wrapper">
        <header>
          Loshmey's temperature and humidity project
        </header>
        <div className="main_body">
          <div className = "data_wrapper">
            <div className="data_container">
              <div className="img_container">
                <img src="temperature_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                AIR TEMPERATURE:<br></br><div className="data_text" style={this.parseStyle(this.state.temperature, this.state.wantedTemperature, tempDiffBottom, tempDiffTop )}>{this.state.temperature}{this.state.temperature=="no_data"? null : '\u2103'}</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="humidity_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                AIR HUMIDITY:<br></br><div className="data_text" style={this.parseStyle(this.state.humidity, this.state.wantedHumidity, humDiffBottom, humDiffTop )}>{this.state.humidity}{this.state.humidity=="no_data"? null : `%`}</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="soil_icon.jpg" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                GROUND HUMIDITY:<br></br><div className="data_text" style={this.parseStyle(this.state.groundHumidity, this.state.wantedGroundHumidity, humDiffBottom, humDiffTop )}>{this.state.groundHumidity}{this.state.groundHumidity=="no_data"? null : `%`}</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="state_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                STATE:<br></br><div className="data_text">{this.mapAction(this.state.recommendedDoorState, this.state.recommendedWaterState)}</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="brain_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                RECOMMENDED STATE:<br></br><div className="data_text">{this.mapReccAction(this.state.recommendedDoorState, this.state.recommendedWaterState, this.state.doorState, this.state.waterState)}</div>
              </div>
            </div>
          </div>
          <div className = "data_wrapper">
            <div className="data_container">
              <div className="img_container">
                  <img src="temperature_gauge_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                WANTED AIR TEMPERATURE:<br></br><div className="data_text">{this.state.wantedTemperature}&#8451;</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="humidity_gauge_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                WANTED AIR HUMIDITY:<br></br><div className="data_text">{this.state.wantedHumidity}%</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="soil_humidity_gauge_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                WANTED GROUND HUMIDITY:<br></br><div className="data_text">{this.state.wantedGroundHumidity}%</div>
              </div>
            </div>
            <div className="data_container">
              <div className="img_container">
                <img src="robot_icon.png" className="img-fluid"></img>
              </div>
              <div className="data_text_container">
                AUTOMATIC MODE:<br></br>{this.mapAutoMode(this.state.autoMode)}
              </div>
            </div>
          </div>
          <form className="form_wrapper">
            <div className="form-group">
              <label htmlFor="inputTemperature">Change wanted air temperature (&#8451;)</label>
              <input onChange={this.handleTempChange} type="number" min="0" max="100" step="1" className="form-control" id="inputTemperature" placeholder="Enter air temperature" value={this.state.changeWantedTemperature}></input>
            </div>
            <div className="form-group">
              <label htmlFor="inputHumidity">Change wanted air humidity (%)</label>
              <input onChange={this.handleHumChange} type="number" min="0" max="100" step="1" className="form-control" id="inputHumidity" placeholder="Enter air humidity" value={this.state.changeWantedHumidity}></input>
            </div>
            <div className="form-group">
              <label htmlFor="inputGroundHumidity">Change wanted ground humidity (%)</label>
              <input onChange={this.handleGroundHumChange} type="number" min="0" max="100" step="1" className="form-control" id="inputGroundHumidity" placeholder="Enter ground humidity" value={this.state.changeWantedGroundHumidity}></input>
            </div>

            <div className="form-group">
              <label htmlFor="selectDoor">Door control</label>
              <select onChange={this.handleDoorChange} disabled={this.state.changeAutoMode==1} value={this.state.changeDoor} className="form-control" id="selectDoor">
                <option value="1">Open door</option>
                <option value="2">Close door</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="selectWater">Water control</label>
              <select onChange={this.handleWaterChange} disabled={this.state.changeAutoMode==1} value={this.state.changeWater} className="form-control" id="selectWater">
                <option value="2">Open valve</option>
                <option value="1">Close valve</option>
              </select>
            </div>

            <div style={{paddingBottom:"5%"}} className="custom-control custom-switch">
              <input onClick={this.handleAutChange} data-toggle="toggle" className="custom-control-input"  checked={this.state.changeAutoMode==1} type="checkbox" id="autoModeCheck" value={this.state.changeAutoMode}></input> 
              <label className="custom-control-label" htmlFor="autoModeCheck">Automatic mode</label>
            </div>
            <button onClick={this.sendData} type="button" className="btn btn-primary">Submit</button>
          </form>
        </div>
        {this.state.tempData==null&&this.state.humData==null&&this.state.gHumData==null?<div>NO DATA</div>:
            <div className="chartWrapper">
              <Line data = {this.state.tempData}>

              </Line>
              <Line data = {this.state.humData}>

              </Line>
              <Line data = {this.state.gHumData}>

              </Line>
            </div>
            
        }
        <footer>
          Developed by YouFaceJaraxxus &copy; {new Date().getFullYear().toString()}
          <div onClick={this.logout}>Logout</div>
        </footer>
      </div>
    );
  }
  
}

export default MainMenu;
