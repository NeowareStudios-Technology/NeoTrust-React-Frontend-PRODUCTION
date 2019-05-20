// ======================================
//	NeoPak.io
//  ZipSign.jsx
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6

import React from "react";
// import classNames from 'classnames'
import Dropzone from "react-dropzone";
import DropzoneComponent from "react-dropzone-component";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import {
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab
} from "@material-ui/core";
// import Grid from '@material-ui/core/Grid';

// core components
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
import Sequencer from "components/Sequencer";
import { archiveFiles } from "Archive/Archive.js";
import Archive from "../../Archive/Archive";
import { saveAs } from "file-saver";
import Web3 from "web3";
var ReactDOMServer = require("react-dom/server");
var ethUtil = require("ethereumjs-util");
const EthereumTx = require("ethereumjs-tx");
const keythereum = require("keythereum");

require("react-dropzone-component/styles/filepicker.css");

// ====================================
//  ZipSign
// ====================================

class GenerateKeystore extends React.Component {
  constructor() {
    super();

    this.state = {
      errors: {},
      password: "",
      publicKey: null,
      privateKeyData: null,
      privateKey: "",
      keystoreObject: null,
      useSavedKeystoreFile: false,
      fileName: "neopak",
      files: [],
      filesContents: [],
      processing: false,
      activeStep: 0,
      keystoreFileActiveTab: 0,
      keystorePassword: "",
      creatingKeystoreFile: false,
      transactionHash: null,
      validatingKeystoreFile: false
    };
  }

  createPrivateKeyData = callback => {
    let privateKeyData = null;
    if (keythereum) {
      let dk = keythereum.create();
      if (dk) {
        privateKeyData = dk;
      }
    }

    callback(privateKeyData);
  };

  validateKeystoreFile = () => {
    this.setState({
      validatingKeystoreFile: true
    });
    let sequence = new Sequencer();
    sequence.errors = {};
    sequence.privateKeyData = null;

    sequence.promise(() => {
      let passwordValid = true;
      let password = this.state.keystorePassword;
      if (!password) {
        passwordValid = false;
        sequence.errors.keystorePassword = ["Please enter a password."];
      }
      if (passwordValid) {
        sequence.next();
      } else {
        sequence.stop();
      }
    });

    sequence.promise(() => {
      if (this.state.archiveFile) {
        var reader = new FileReader();

        reader.onload = e => {
          try {
            let keystoreData = JSON.parse(e.target.result);
            let privateKey = keythereum.recover(
              this.state.keystorePassword,
              keystoreData
            );
            if (privateKey) {
              /**
               * Luis 3-12-19-1135: We have to format the privateKeyData like this
               * so it's compatible with the privateKeyData generate by keythereum and
               * we use in other places.
               */
              sequence.privateKeyData = {
                privateKey: privateKey
              };
              sequence.next();
            }
          } catch (error) {
            this.setState(
              {
                keystorePassword: "",
                validatingKeystoreFile: false
              },
              () => {
                sequence.errors.keystorePassword = [
                  "We could not validate your keystore with the password provided."
                ];
                sequence.stop();
              }
            );
          }
        };

        reader.readAsText(this.state.archiveFile);
      } else {
        sequence.errors.archiveFile = ["Please upload a keystore file."];
        sequence.stop();
      }
    });

    sequence.onStop = () => {
      if (Object.keys(sequence.errors).length > 0) {
        this.setState({
          errors: sequence.errors,
          validatingKeystoreFile: false
        });
      } else {
        if (sequence.privateKeyData) {
          this.setState({
            validatingKeystoreFile: false,
            privateKeyData: sequence.privateKeyData,
            activeStep: 1
          });
        }
      }
    };

    sequence.next();
  };

  createKeystoreFile = () => {
    let sequence = new Sequencer();
    sequence.errors = {};
    sequence.privateKeyData = null;

    sequence.promise(() => {
      this.setState(
        {
          creatingKeystoreFile: true
        },
        () => {
          sequence.next();
        }
      );
    });

    sequence.promise(() => {
      let passwordValid = true;
      let password = this.state.password;
      if (!password) {
        passwordValid = false;
        sequence.errors.password = ["Please enter a password."];
      } else {
        if (password.length < 8 || password.length > 15) {
          passwordValid = false;
          sequence.errors.password = [
            "Please enter password between 8 and 15 characters."
          ];
        }
      }

      if (passwordValid) {
        sequence.next();
      } else {
        sequence.stop();
      }
    });

    sequence.promise(() => {
      this.createPrivateKeyData(privateKeyData => {
        if (privateKeyData) {
          sequence.privateKeyData = privateKeyData;
          sequence.next();
        } else {
          sequence.errors.privateKey = ["We could not create a private key."];
          sequence.stop();
        }
      });
    });

    sequence.promise(() => {
      setTimeout(() => {
        // Note: if options is unspecified, the values in keythereum.constants are used.
        var options = {
          kdf: "pbkdf2",
          cipher: "aes-128-ctr",
          kdfparams: {
            c: 262144,
            dklen: 32,
            prf: "hmac-sha256"
          }
        };

        if (keythereum) {
          // synchronous
          var keyObject = keythereum.dump(
            this.state.password,
            sequence.privateKeyData.privateKey,
            sequence.privateKeyData.salt,
            sequence.privateKeyData.iv,
            options
          );
          if (keyObject) {
            this.setState(
              {
                keystoreObject: keyObject,
                privateKeyData: sequence.privateKeyData
              },
              () => {
                this.downloadKeystoreFile();
              }
            );
          }
        }
      }, 20);
    });

    sequence.onStop = () => {
      if (Object.keys(sequence.errors).length > 0) {
        this.setState({
          errors: sequence.errors,
          creatingKeystoreFile: false
        });
      }
    };

    sequence.next();
  };

  downloadKeystoreFile = () => {
    if (this.state.keystoreObject) {
      try {
        let keystoreContent = JSON.stringify(this.state.keystoreObject);
        var blob = new Blob([keystoreContent], { type: "text/plain" });
        var fileName =
          "UTC--" +
          new Date().toISOString() +
          "--" +
          this.state.keystoreObject.address;
        saveAs(blob, fileName);
        setTimeout(() => {
          this.setState({
            createKeystoreFile: false,
            activeStep: 1
          });
        }, 500);
      } catch (error) {}
    }
  };

  // ====================================
  //  render
  // ====================================

  render() {
    const { classes } = this.props;

    const files = this.state.files.map(file => (
      <li key={file.name}>
        {file.name} - {file.size} bytes
      </li>
    ));
    let activeStep = this.state.activeStep;
    return (
      <div className={classes.container}>
        <Card>
          <CardHeader color="primary" className={classes.cardHeader}>
            <h4>Generate Your NeoPak Id</h4>
          </CardHeader>
          <CardBody>
            <div>
              <div className="px-4 pt-3 pb-4">
                <div>
                  {this.state.keystoreObject ? (
                    <>
                      <div>
                        <h3>NeoPak Id Successfully Generated</h3>
                        <h4>
                          Use the keystore to access your testnet account and
                          add ether.
                        </h4>
                        <h4>
                          You can now add Ether to your address using this
                          keystore file. Once your address has enough ether you
                          can come back and use this keystore file to create
                          NeoPak files.
                        </h4>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={this.downloadKeystoreFile}
                        >
                          Download NeoPak Id
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group mb-4">
                        <TextField
                          label="Password"
                          type="password"
                          placeholder="Enter a password for your new keystore file."
                          helperText="Enter a password for your new keystore file."
                          value={this.state.password}
                          onChange={e => {
                            let value = e.target.value;
                            this.setState({ password: value });
                          }}
                          fullWidth
                        />
                        {this.state.errors && this.state.errors.password && (
                          <>
                            <p style={{ color: "red" }}>
                              {this.state.errors.password[0]}
                            </p>
                          </>
                        )}
                        <div className="mt-4">
                          {this.state.creatingKeystoreFile ? (
                            <>
                              <Button
                                disabled
                                contained="true"
                                color="primary"
                                onClick={this.createKeystoreFile}
                              >
                                Generating NeoPak Id
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                contained="true"
                                color="primary"
                                onClick={this.createKeystoreFile}
                              >
                                Generate NeoPak Id
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
          <CardFooter className={classes.cardFooter} />
        </Card>
      </div>
    );
  }
}

function FilePickerTemplate(props) {
  return <>NO FILES</>;
}

// ====================================
//  Styles
// ====================================

const Styles = theme => ({
  container: {
    zIndex: "2",
    position: "relative",
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
    width: 200
  },
  cardFooter: {
    paddingTop: "0rem",
    marginTop: "36px",
    marginBottom: "72px",
    border: "0",
    borderRadius: "6px",
    justifyContent: "center !important"
  }
});

export default withStyles(Styles)(GenerateKeystore);
