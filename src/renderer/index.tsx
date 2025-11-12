import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';
console.log('React app loaded successfully!');
console.log('Environment:', process.env.NODE_ENV);

ReactDOM.render(
  
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);