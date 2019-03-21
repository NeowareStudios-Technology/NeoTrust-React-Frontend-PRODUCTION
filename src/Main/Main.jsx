// ======================================
//	NeoPakApp
//  Main.jsx
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6

import React from "react";

// @material-ui/core components
import { AppBar, Tabs, Tab, Paper, TextField } from "@material-ui/core";
import Card from "components/Card/Card.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import Button from "components/CustomButtons/Button.jsx";

import withStyles from "@material-ui/core/styles/withStyles";
import Styles from "components/Styles";
// core components
import NeoHdr from "components/Header/NeoHdr.jsx";
// import HeaderLinks from "components/Header/HeaderLinks.jsx";
import Footer from "components/Footer/Footer.jsx";
import bkgImg from "assets/img/bg7.jpg";
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import "bootstrap/dist/css/bootstrap.css";
// Sections
import ZipSign from "./Sections/ZipSign.jsx";
import ZipVerify from "./Sections/ZipVerify.jsx";
import GenerateKeystore from "./Sections/GenerateKeystore.jsx";
import Sequencer from "components/Sequencer";
var ethUtil = require("ethereumjs-util");

const users = [
  {
    username: "admin",
    password: "377fb820d129363cf97844d1260878b673935387512a7fdd26f8a77779d8b600"
  }
];

// ====================================
//  MainPage
// ====================================

class MainPage extends React.Component {
  constructor(props) {
    super(props);
    let user = null;
    let storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
      } catch (error) {}
    }

    this.state = {
      errors: {},
      activeTab: 0,
      loginUsername: "",
      loginPassword: "",
      processing: false,
      user: user
    };
  }

  login = () => {
    let sequence = new Sequencer();
    sequence.errors = {};
    sequence.user = {};

    sequence.promise(() => {
      this.setState(
        {
          processing: true
        },
        () => {
          sequence.next();
        }
      );
    });

    sequence.promise(() => {
      let username = this.state.loginUsername;
      if (username && username.trim() !== "") {
      } else {
        sequence.errors.loginUsername = ["Please enter your username."];
      }
      sequence.next();
    });

    sequence.promise(() => {
      let password = this.state.loginPassword;
      if (password && password.trim() !== "") {
      } else {
        sequence.errors.loginPassword = ["Please enter your password."];
      }
      sequence.next();
    });

    sequence.promise(() => {
      if (Object.keys(sequence.errors).length == 0) {
        if (this.state.loginUsername && this.state.loginPassword) {
          let user = users.find(aUser => {
            return (
              aUser.username === this.state.loginUsername &&
              aUser.password ===
                ethUtil.sha256(this.state.loginPassword.trim()).toString("hex")
            );
          });
          if (user) {
            sequence.user = user;
          } else {
            sequence.errors.loginUsername = [
              "We could not authenticate that username + password combination."
            ];
          }
        }
      }
      sequence.next();
    });

    sequence.onStop = () => {
      if (Object.keys(sequence.errors).length > 0) {
        this.setState({
          errors: sequence.errors,
          processing: false
        });
      } else if (sequence.user) {
        let userString = JSON.stringify(sequence.user);
        localStorage.setItem("user", userString);
        this.setState({ user: sequence.user, processing: false, activeTab: 0 });
      }
    };

    sequence.next();
  };

  onTabChange = (e, tab) => {
    if (tab === 3) {
      localStorage.removeItem("user");
      this.setState({
        activeTab: 0,
        user: null
      });
    }
    this.setState({ activeTab: tab });
  };
  render() {
    const { classes } = this.props;
    return (
      <div>
        <NeoHdr absolute color="transparent" />
        <div className={Styles.pageHeader} style={{}}>
          <GridContainer justify="center">
            {this.state.user ? (
              <>
                {" "}
                <GridItem xs={12} sm={12} md={10} lg={8}>
                  <Paper style={{ marginBottom: "72px" }}>
                    <Tabs
                      value={this.state.activeTab}
                      onChange={this.onTabChange}
                    >
                      <Tab label="Create Archive File" />
                      <Tab label="Verify Archive File" />
                      <Tab label="Generate NeoPak Id" />
                      <Tab label="Log out" />
                    </Tabs>
                  </Paper>
                  {this.state.activeTab === 0 && <ZipSign />}
                  {this.state.activeTab === 1 && <ZipVerify />}
                  {this.state.activeTab === 2 && <GenerateKeystore />}
                </GridItem>
              </>
            ) : (
              <>
                <GridItem xs={10} sm={7} md={5} lg={5}>
                  <Card>
                    <CardHeader color="primary" className={classes.cardHeader}>
                      <h4>Login</h4>
                    </CardHeader>
                    <CardBody className="mb-5">
                      <div className="form-group">
                        <TextField
                          label="Username"
                          helperText="Enter your username."
                          fullWidth={true}
                          value={this.state.loginUsername}
                          onChange={e => {
                            let value = e.target.value;
                            this.setState({
                              loginUsername: value
                            });
                          }}
                        />
                        {this.state.errors && this.state.errors.loginUsername && (
                          <>
                            <p style={{ color: "red" }}>
                              {this.state.errors.loginUsername[0]}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="form-group">
                        <TextField
                          label="Password"
                          helperText="Enter your password."
                          type="password"
                          fullWidth={true}
                          value={this.state.loginPassword}
                          onChange={e => {
                            let value = e.target.value;
                            this.setState({
                              loginPassword: value
                            });
                          }}
                        />
                        {this.state.errors && this.state.errors.loginPassword && (
                          <>
                            <p style={{ color: "red" }}>
                              {this.state.errors.loginPassword[0]}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="mt-5">
                        {this.state.processing ? (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              disabled="true"
                            >
                              Processing...
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={this.login}
                            >
                              Login
                            </Button>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </GridItem>
              </>
            )}
          </GridContainer>
        </div>
        <Footer whiteFont />
      </div>
    );
  }
}

export default withStyles(Styles)(MainPage);
