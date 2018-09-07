import React, { Component } from 'react';

import './List.css';

class List extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: []
        }
    }

    render () {
        return (
            <ul>
                {this.state.data.map(user => {
                    return <li key={user.id}>
                        <span className="user-id">{user.id}</span>
                        <span className="user.lastname">{user.lastname}</span>
                    </li>
                })}
            </ul>
        )
    }

    componentDidMount() {
        console.log(HOST_MAIN)
        fetch('http://' + HOST_MAIN + '/users')
            .then(res => res.json())
            .then(json => this.setState({data: json}));
    }
}

export default List;