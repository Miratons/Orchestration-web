import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import List from './Components/List';

class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      data : {}
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Orchestration Docker Swarm</h1>
          <p className="App-info">IP : {this.state.data.ip}</p>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <div id="content-user">
          <List />
        </div>
      </div>
    );
  }

  componentDidMount() {
    fetch('http://' + HOST_MAIN + '/application')
        .then(res => res.json())
        .then(json => this.setState({data: json}));
  }
}

export default App;
