// ======================================
//	NeoPakApp
//  Main.jsx
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6 

import React from "react";

// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import { container } from "assets/jss/material-kit-react.jsx";
import bkgImg from "assets/img/bg7.jpg";

// core components
import NeoHdr from "components/Header/NeoHdr.jsx";
// import HeaderLinks from "components/Header/HeaderLinks.jsx";
import Footer from "components/Footer/Footer.jsx";

// Sections
import ZipSign from "./Sections/ZipSign.jsx";

// ====================================
//  MainPage
// ====================================

class MainPage extends React.Component {
  render() {
    const { classes } = this.props;
    return (
      <div>
        <NeoHdr
          absolute
          color="transparent"
        />
        <div
          className={classes.pageHeader}
          style={{
            backgroundImage: "url(" + bkgImg + ")",
            backgroundSize: "cover",
            backgroundPosition: "top center"
          }}
        >
          <ZipSign />
          <Footer whiteFont />
        </div>
      </div>
    );
  }
}

// ====================================
//  MainPage
// ====================================

const Styles = theme => ({
  container: {
    ...container,
    zIndex: "2",
    position: "relative",
    paddingTop: "20vh",
    color: "#FFFFFF"
  },
  pageHeader: {
    minHeight: "100vh",
    height: "auto",
    display: "inherit",
    position: "relative",
    margin: "0",
    padding: "0",
    border: "0",
    alignItems: "center",
    "&:before": {
      background: "rgba(0, 0, 0, 0.5)"
    },
    "&:before,&:after": {
      position: "absolute",
      zIndex: "1",
      width: "100%",
      height: "100%",
      display: "block",
      left: "0",
      top: "0",
      content: '""'
    },
    "& footer li a,& footer li a:hover,& footer li a:active": {
      color: "#FFFFFF"
    },
    "& footer": {
      position: "absolute",
      bottom: "0",
      width: "100%",
    }
  },
});

export default withStyles(Styles)(MainPage);
