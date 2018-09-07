import React from 'react';
import { render } from 'react-dom';
import './index.css';
import App from './App';

render (
    <div id="content">
        <App />
    </div>,
    document.querySelector('#mount')
)