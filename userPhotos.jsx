import React from 'react';
import axios from 'axios';
import {
  AppBar, Toolbar, Typography, Button
} from '@mui/material';
import fetchModel from '../../lib/fetchModelData';
import './TopBar.css';

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contextText: '',
      version: '',
      app_info: undefined
    };
  }

  componentDidMount() {
    this.handleAppInfoChange();
  }

  handleAppInfoChange() {
    if (!this.state.app_info) {
      axios.get("/test/info")
        .then((response) => {
          this.setState({
            app_info: response.data,
            version: response.data.version
          });
        })
        .catch((error) => {
          console.error('Error fetching app info:', error);
        });
    }

    const url = window.location.hash;
    const parts = url.split('/');

    if (parts[1] === 'users' && parts[2]) {
      fetchModel(`/user/${parts[2]}`)
        .then((res) => {
          const user = res.data;
          this.setState({
            contextText: `Details of ${user.first_name} ${user.last_name}`
          });
        })
        .catch(() => this.setState({ contextText: '' }));
    }
    else if (parts[1] === 'photos' && parts[2]) {
      fetchModel(`/user/${parts[2]}`)
        .then((res) => {
          const user = res.data;
          this.setState({
            contextText: `Photos of ${user.first_name} ${user.last_name}`
          });
        })
        .catch(() => this.setState({ contextText: '' }));
    }
    else {
      this.setState({ contextText: '' });
    }
  }

  render() {
    return (
      <AppBar className="topbar-appBar" position="absolute">
        <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
          
          {/* LEFT SIDE */}
          <Typography variant="h5" color="inherit">
            Group 1: PhotoShare
          </Typography>

          {/* RIGHT SIDE */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            
            {/* Greeting */}
            {this.props.loggedInUser ? (
              <Typography variant="h6" color="inherit" style={{ marginRight: '20px' }}>
                Hi {this.props.loggedInUser.first_name}
              </Typography>
            ) : (
              <Typography variant="h6" color="inherit" style={{ marginRight: '20px' }}>
                Please Login
              </Typography>
            )}

            {/* Context text */}
            <Typography variant="h6" color="inherit" style={{ marginRight: '20px' }}>
              {this.state.contextText}
            </Typography>

            {/* FAVORITES BUTTON */}
            {this.props.loggedInUser && (
              <Button
                variant="contained"
                color="secondary"
                href="#/favorites"
                style={{ marginRight: '20px' }}
              >
                Favorites
              </Button>
            )}

            {/* Logout */}
            {this.props.loggedInUser && (
              <Button color="inherit" onClick={this.props.onLogout}>
                Logout
              </Button>
            )}

            {/* Version */}
            <Typography variant="h6" color="inherit" style={{ marginLeft: '20px' }}>
              Version: {this.state.version}
            </Typography>

          </div>
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
