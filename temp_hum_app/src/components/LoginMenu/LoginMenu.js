import React, { Component } from 'react';
import axios from 'axios';
import {DATA_SERVER} from '../../config.js';
import qs from 'qs';
import Cookies from 'js-cookie';
import './LoginMenu.css';

class LoginMenu extends Component {
    state = { 
        email:"",
        password:"",
        error : null
     }

     
     handleEmailChange=(event)=>{
        this.setState({
            email:event.target.value
        })
     }
     handlePasswordChange=(event)=>{
        this.setState({
            password:event.target.value
        })
     }
     login=()=>{
         let data = qs.stringify({
             email: this.state.email,
             password: this.state.password
         })
         axios.post("/login", data)
         .then(response=>{
             if(response.status==200){
                 this.setState({
                     error:null
                 })
                this.props.history.push('/data');
             }
         }).catch(err=>{
             console.log(err)
             this.setState({
                error: 'Invalid credentials.'
             })
         })
     }

     componentDidMount(){
         let authCookie = Cookies.get('auth');
         if(authCookie){
             this.login();
         }
     }

    render() { 
        return ( 
            <div id="mainWrapper">
                <form id="mainForm" method="POST" action={DATA_SERVER+"/login"} onSubmit={e => { e.preventDefault(); }}>
                    <label className="loginLabel" for="email">E-mail:</label>
                    <input className="loginInput" placeholder="E-mail" type="text" name="email" value={this.state.email} onChange={this.handleEmailChange}></input> 
                    <label className="loginLabel" for="password">Password:</label>
                    <input className="loginInput" placeholder="Password" type="password" name="password" value={this.state.password} onChange={this.handlePasswordChange}></input>
                    <button className="loginButton btn btn-primary btn-block" onClick={this.login}>Login</button>
                    {this.state.error?
                    <label className="loginErrorLabel">{this.state.error}</label>:null}
                </form>
            </div>
            
            
         );
    }
}
 
export default LoginMenu;