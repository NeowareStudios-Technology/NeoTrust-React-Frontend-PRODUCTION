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
    this.state = {
      activeTab: 0
    };
  }

  onTabChange = (e, tab) => {
    this.setState({ activeTab: tab });
  };
  render() {
    const { classes } = this.props;
    return (
      <div>
        <NeoHdr absolute color="transparent" />
        <div className={Styles.pageHeader} style={{}}>
          <GridContainer justify="center">
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
                    <Tab label="Generate NeoTrust ID" />
                    <Tab label="Certify Identity" />
                  </Tabs>
                </Paper>
                {this.state.activeTab === 0 && <ZipSign />}
                {this.state.activeTab === 1 && <ZipVerify />}
                {this.state.activeTab === 2 && <GenerateKeystore />}
              </GridItem>
            </>
          </GridContainer>
        </div>
        <Footer whiteFont />
      </div>
    );
  }
}

export default withStyles(Styles)(MainPage);
