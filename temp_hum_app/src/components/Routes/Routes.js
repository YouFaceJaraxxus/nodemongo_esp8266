import React, { Component } from 'react';
import {Route, Switch, BrowserRouter} from 'react-router-dom';
import LoginMenu from '../LoginMenu/LoginMenu';
import MainMenu from '../MainMenu/MainMenu';
class Routes extends Component {
    state = { 
        loggedIn : false
     }
    render() { 
        return ( 
            <BrowserRouter>
                <Switch>
                    <Route exact path="/" exact component={LoginMenu}/>
                    <Route exact path="/login" exact component={LoginMenu}/>
                    <Route exact ath="/data" exact component={MainMenu}/>
                </Switch>
            </BrowserRouter>
         );
    }
}
 
export default Routes;