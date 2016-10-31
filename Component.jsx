var React = require('react');
var { Route, Router, hashHistory, browserHistory} = require('react-router');

module.exports = React.createClass({
  _handleOnClick: function() {
    //browserHistory.push('/home');
    window.open("http://localhost:4000/home","_self");
  },
  render() {
    return (
    <html>
      <head>
        <title>Universal App with React</title>
        <link rel='stylesheet' href='/style.css' />
      </head>
      <body>
        <div>
          <h1>Welcome to Store!</h1>
          <p>Server side rendering is great!</p>
          <button onClick={this._handleOnClick}>Home!</button>
        </div>
        <script src='/bundle.js'/>
      </body>
    </html>);
  }
});
