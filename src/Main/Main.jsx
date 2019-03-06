// ======================================
//	NeoPakApp
//  Main.jsx
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6

import React from "react";

// @material-ui/core components
import { AppBar, Tabs, Tab, Paper } from "@material-ui/core";
import withStyles from "@material-ui/core/styles/withStyles";
import Styles from "components/Styles";
// core components
import NeoHdr from "components/Header/NeoHdr.jsx";
// import HeaderLinks from "components/Header/HeaderLinks.jsx";
import Footer from "components/Footer/Footer.jsx";
import bkgImg from "assets/img/bg7.jpg";
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";

// Sections
import ZipSign from "./Sections/ZipSign.jsx";
import ZipVerify from "routes/verify";
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
            <GridItem xs={12} sm={12} md={10} lg={8}>
              <Paper style={{ marginBottom: "72px" }}>
                <Tabs value={this.state.activeTab} onChange={this.onTabChange}>
                  <Tab label="Create Archive File" />
                  <Tab label="Verify Archive File" />
                </Tabs>
              </Paper>
              {this.state.activeTab === 0 && <ZipSign />}
              {this.state.activeTab === 1 && <ZipVerify />}
            </GridItem>
          </GridContainer>
        </div>
        <Footer whiteFont />
      </div>
    );
  }
}

export default withStyles(Styles)(MainPage);
