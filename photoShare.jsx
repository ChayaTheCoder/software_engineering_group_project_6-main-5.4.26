import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch
} from 'react-router-dom';
import {
  Grid, Typography, Paper
} from '@mui/material';
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/loginRegister/LoginRegister';
import Favorites from './components/favorites/Favorites';
import fetchModel, { setAuthToken } from './lib/fetchModelData';
import './styles/main.css';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedInUser: null
    };
  }

  handleLogin = (user) => {
    this.setState({ loggedInUser: user }, () => {
      // After state is set, fetch full user (including favorites)
      this.refreshUser();
    });
    window.location.hash = `#/users/${user._id}`;
  };

  handleLogout = () => {
    setAuthToken(null);
    this.setState({ loggedInUser: null });
  };

  // Re-fetches the logged-in user from the server and updates state,
  // so that loggedInUser.favorites stays in sync after add/remove.
  refreshUser = () => {
    if (this.state.loggedInUser) {
      fetchModel(`/user/${this.state.loggedInUser._id}`)
        .then((response) => {
          this.setState({ loggedInUser: response.data });
        })
        .catch((err) => console.error("Error refreshing user:", err));
    }
  };

  static renderWelcomePage = () => (
    <Typography variant="body1">
      Welcome to your photosharing app!
    </Typography>
  );

  renderLoginPage = () => <LoginRegister onLogin={this.handleLogin} />;

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar loggedInUser={this.state.loggedInUser} onLogout={this.handleLogout}/>
        </Grid>
        <div className="main-topbar-buffer"/>
        <Grid item sm={3}>
          <Paper className="main-grid-item">
            {this.state.loggedInUser ? <UserList /> : null}
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="main-grid-item">
            {this.state.loggedInUser ? (
              <Switch>
                <Route exact path="/"
                    render={PhotoShare.renderWelcomePage}
                  />
                <Route path="/users/:userId"
                  render={ props => <UserDetail {...props} /> }
                />
                <Route path="/photos/:userId/:photoId?"
                  render={ props => (
                    <UserPhotos
                      {...props}
                      loggedInUser={this.state.loggedInUser}
                      refreshUser={this.refreshUser}
                    />
                  )}
                />
                <Route
                    path="/favorites"
                    render={(props) => (
                      <Favorites
                        {...props}
                        loggedInUser={this.state.loggedInUser}
                        refreshUser={this.refreshUser}
                      />
                    )}
                  />
                <Route path="/users" component={UserList}  />
              </Switch>
            ) : (
              <Switch>
                <Route render={this.renderLoginPage} />
              </Switch>
            )}
          </Paper>
        </Grid>
      </Grid>
      </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);