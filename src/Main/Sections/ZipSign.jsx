// ======================================
//	NeoPak.io
//  ZipSign.jsx
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6 

import React from "react";
// import classNames from 'classnames'
import Dropzone from 'react-dropzone'

// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
// import Grid from '@material-ui/core/Grid';

// core components
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import { archiveFiles } from "Archive/Archive.js";

// ====================================
//  ZipSign
// ====================================

class ZipSign extends React.Component {

  constructor() {
    super()

    this.state = {
      files: []
    }
  }

  // ====================================
  //  render
  // ====================================

  render() {
    const { classes } = this.props;

    const files = this.state.files.map(file => (
      <li key={file.name}>
        {file.name} - {file.size} bytes
      </li>
    ))

    return (
      <div className={classes.container}>
      <GridContainer justify="center">
        <GridItem xs={12} sm={12} md={10} lg={8}>
          <Card>
            <form className={classes.form}>
              <CardHeader color="primary" className={classes.cardHeader}>
                <h4>Create Signed Archive File</h4>
              </CardHeader>
              <CardBody>

                <Dropzone
                  onDrop={this.onDrop.bind(this)}
                  onFileDialogCancel={this.onCancel.bind(this)}
                >
                  {({getRootProps, getInputProps}) => (
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                        <p>Drop files here, or click to select files</p>
                    </div>
                  )}
              </Dropzone>
              <aside>
                <h4>Files</h4>
                <ul>{files}</ul>
              </aside>

              </CardBody>
              <CardFooter className={classes.cardFooter}>
                <Button simple color="primary" size="lg"
                  onClick={this.getStarted.bind(this)}
                >
                  Get started
                </Button>
              </CardFooter>
            </form>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
    );
  }

  // ====================================
  //  onDrop
  // ====================================

  onDrop(acceptedFiles, rejectedFiles) {

    this.setState({
      files: acceptedFiles,
    });
  }

  onCancel() {
    console.log('onCancel');
    // this.setState({
    //   files: []
    // });
  }

  // ====================================
  //  getStarted
  // ====================================

  getStarted() {
    console.log('getStarted');

    archiveFiles(this.state.files);
  }

}

// ====================================
//  Styles
// ====================================

const Styles = theme => ({
  container: {
    zIndex: "2",
    position: "relative",
    paddingTop: "20vh",
    color: "#000000"
  },
  form: {
    margin: "0"
  },
  cardHeader: {
    width: "auto",
    textAlign: "center",
    marginLeft: "20px",
    marginRight: "20px",
    marginTop: "-40px",
    padding: "20px 0",
    marginBottom: "15px"
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  cardFooter: {
    paddingTop: "0rem",
    border: "0",
    borderRadius: "6px",
    justifyContent: "center !important"
  },
});

export default withStyles(Styles)(ZipSign);
