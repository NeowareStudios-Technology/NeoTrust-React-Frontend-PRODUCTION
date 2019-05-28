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
import { debug } from "util";
import { EXITED } from "react-transition-group/Transition";
import { truncate } from "fs";
import GoogleCloudFunctions from "../Api/GoogleCloudFunctions";
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
      transactionError: "",
      password: "",
      publicKey: null,
      privateKeyData: null,
      privateKey: "",
      keystoreObject: null,
      useSavedKeystoreFile: false,
      fileName: "neotrust",
      files: [],
      filesContents: [],
      certContent: "",
      processing: false,
      activeStep: 0,
      keystoreFileActiveTab: 0,
      keystorePassword: "",
      createKeystoreFile: false,
      createCertFile: false,
      transactionHash: null,
      validatingKeystoreFile: false,
      userName: ""
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

    //password and name validation
    sequence.promise(() => {
      let passwordValid = true;
      let password = this.state.password;
      let userNameValid = true;
      let userName = this.state.userName;
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
      if (!userName) {
        userNameValid = false;
        sequence.errors.userName = ["Please enter your full name."];
      }
      if (passwordValid && userNameValid) {
        sequence.next();
      } else {
        sequence.stop();
      }
    });

    //creating private key
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

    //contacting server for user to recieve ID cert
    sequence.promise(async () => {
      let userName = this.state.userName;
      let privateKeyBuffer = sequence.privateKeyData.privateKey;
      let address = ethUtil.privateToAddress(privateKeyBuffer).toString("hex");
      address = "0x" + address;

      console.log(address);
      console.log(userName);

      //for production change the path to "/send-cert-transaction"
      const response = await GoogleCloudFunctions.get(
        "/send-cert-transaction-test",
        {
          params: {
            address: address,
            name: userName
          }
        }
      );
      console.log("Google Cloud Functions response code: " + response.status);
      console.log("Google Cloud Functions response data: " + response.data);

      if (response.status == "200") {
        this.setState({ certContent: response.data });
        sequence.next();
      } else {
        //still need to render this error somewhere on the page
        sequence.errors.transactionError = [
          "The ID certificate transaction could not be sent."
        ];
        sequence.stop();
      }
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
                this.downloadKeystoreAndCertZip();
                //this.downloadKeystoreFile();
                //this.downloadCertFile();
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

  downloadKeystoreAndCertZip = () => {
    if (this.state.keystoreObject && this.state.certContent !== "") {
      let zip = Archive.createZip();
      let keystoreContent = JSON.stringify(this.state.keystoreObject);

      zip.file(
        "UTC--" +
          new Date().toISOString() +
          "--" +
          this.state.keystoreObject.address,
        keystoreContent
      );
      zip.file("NeoCert", this.state.certContent);
      Archive.saveAs("neokey.zip", zip, () => {
        console.log("neokey generated");
      });
    }
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

  downloadCertFile = () => {
    if (this.state.certContent !== "") {
      try {
        var blob = new Blob([this.state.certContent], { type: "text/plain" });
        var fileName = "NeoCert";
        saveAs(blob, fileName);
        setTimeout(() => {
          this.setState({
            createCertFile: false,
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
            <h4>Generate Your NeoTrust Id</h4>
          </CardHeader>
          <CardBody>
            <div>
              <div className="px-4 pt-3 pb-4">
                <div>
                  {this.state.keystoreObject ? (
                    <>
                      <div>
                        <h3>NeoTrust Id Successfully Generated</h3>
                        <h4>
                          Use the keystore to access your testnet account and
                          add ether.
                        </h4>
                        <h4>
                          You can now add Ether to your address using this
                          keystore file. Once your address has enough ether you
                          can come back and use this keystore file to create
                          NeoTrust files.
                        </h4>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={this.downloadKeystoreFile}
                        >
                          Download NeoTrust Id
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group mb-4">
                        <TextField
                          label="Name"
                          type="text"
                          placeholder="Enter your name for your NeoTrust ID."
                          helperText="Enter your name for your NeoTrust ID."
                          value={this.state.userName}
                          onChange={e => {
                            let value = e.target.value;
                            this.setState({ userName: value });
                          }}
                          fullWidth
                        />
                        {this.state.errors && this.state.errors.userName && (
                          <>
                            <p style={{ color: "red" }}>
                              {this.state.errors.userName[0]}
                            </p>
                          </>
                        )}
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
                                Generating NeoTrust Id
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                contained="true"
                                color="primary"
                                onClick={this.createKeystoreFile}
                              >
                                Generate NeoTrust Id
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
