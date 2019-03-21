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

// const Web3 = window.Web3;

// ====================================
//  ZipSign
// ====================================

class ZipSign extends React.Component {
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
      transactionError: null,
      validatingKeystoreFile: false
    };
  }

  // ====================================
  //  onDrop
  // ====================================

  onDrop = (acceptedFiles, rejectedFiles) => {
    this.setState({
      files: acceptedFiles
    });
  };

  onKeystoreUpload = e => {
    let files = e.target.files;
    let file = null;
    if (typeof files[0] !== "undefined") {
      file = files[0];
    }
    let errors = this.state.errors;
    if (file) {
      errors.archiveFile = [];
      this.setState({ archiveFile: file });
    } else {
      errors.archiveFile = ["Please upload a keystore file."];
    }
    this.setState({ errors: errors });
  };

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

  validateFilesUploaded = () => {
    let files = this.state.files;
    if (files.length > 0) {
      this.setState(
        {
          activeStep: 2
        },
        () => {
          this.createZipFile();
        }
      );
    } else {
      let errors = this.state.errors;
      errors.files = ["Please add at least one file to this Zip Archive."];
      this.setState({
        errors: errors
      });
    }
  };

  createZipFile = () => {
    let files = this.state.files;
    let privateKeyData = this.state.privateKeyData;
    let publicKeyBuffer = null;
    if (privateKeyData) {
      if (files.length > 0) {
        let privateKeyBuffer = Buffer.from(privateKeyData.privateKey, "hex");

        try {
          publicKeyBuffer = ethUtil.secp256k1.publicKeyCreate(
            privateKeyBuffer,
            false
          );
        } catch (error) {}

        let sequence = new Sequencer();
        sequence.files = [];

        files.map(file => {
          sequence.promise(() => {
            var reader = new FileReader();

            reader.onload = function(e) {
              file.hash = ethUtil.sha256(e.target.result);
              sequence.files.push(file);
              sequence.next();
            };

            reader.readAsText(file);
          });
        });

        sequence.onStop = () => {
          if (sequence.files.length > 0) {
            let manifestContent = "";
            let manifestContentParts = [
              "Manifest-Version: 0.1",
              "Created-By: NeoPak (neopak 0.1 Beta)",
              "Public Key: " + publicKeyBuffer.toString("hex"),
              "Comments: PLEASE DO NOT EDIT THIS FILE. YOU WILL BREAK IT."
            ];
            let signatureContent = "";
            let signatureContentParts = [
              "Signature-Version: 0.1",
              "Created-By: NeoPak (neopak 0.1 Beta)",
              "Comments: PLEASE DO NOT EDIT THIS FILE. YOU WILL BREAK IT.",
              "Digest-Algorithms: SHA256",
              "[Placeholder for the Manifest file signature]"
            ];
            sequence.files.map(file => {
              let fileEntries = [];
              fileEntries.push("Name: " + file.name);
              fileEntries.push("Digest-Algorithms: SHA256");
              fileEntries.push("SHA256-Digest: " + file.hash.toString("hex"));
              manifestContentParts.push("");
              manifestContentParts.push(fileEntries[0]);
              manifestContentParts.push(fileEntries[1]);
              manifestContentParts.push(fileEntries[2]);
              let fileEntriesString = fileEntries.join("\n");
              let fileEntriesHash = ethUtil.sha256(fileEntriesString);
              signatureContentParts.push("");
              signatureContentParts.push("Name: " + file.path);
              signatureContentParts.push("Digest-Algorithms: SHA256");
              signatureContentParts.push(
                "SHA256-Digest: " + fileEntriesHash.toString("hex")
              );
            });
            manifestContent = manifestContentParts.join("\n");
            let manifestFileHash = ethUtil.sha256(manifestContent);
            signatureContentParts[4] =
              "SHA256-Digest: " + manifestFileHash.toString("hex");

            signatureContent = signatureContentParts.join("\n");
            let dsaContentHash = ethUtil.sha256(signatureContent);
            let dsaEcdSign = ethUtil.secp256k1.sign(
              dsaContentHash,
              privateKeyBuffer
            );
            let dsaFile = new Blob([dsaEcdSign.signature]);
            let signatureVerified = ethUtil.secp256k1.verify(
              dsaContentHash,
              dsaEcdSign.signature,
              publicKeyBuffer
            );
            if (signatureVerified) {
              this.setState(
                {
                  publicKey: publicKeyBuffer.toString("hex"),
                  filesInArchive: sequence.files,
                  manifestContent: manifestContent,
                  signatureContent: signatureContent,
                  dsaFile: dsaFile
                },
                () => {
                  let transactionInput = {
                    files: sequence.files,
                    manifestContent: manifestContent,
                    signatureContent: signatureContent,
                    dsaFile: dsaFile,
                    publicKeyBuffer: publicKeyBuffer
                  };
                  this.createTransaction(transactionInput);
                }
              );
            }
          }
        };

        sequence.next();
      }
    }
  };

  createTransaction = async (input, callback) => {
    let privateKeyData = this.state.privateKeyData;
    if (privateKeyData) {
      let privateKeyBuffer = Buffer.from(privateKeyData.privateKey, "hex");
      if (privateKeyBuffer) {
        let privateKey = privateKeyBuffer.toString("hex");
        if (privateKey) {
          let projectId = "16b625506d4a427b9548ed443b66858b";

          let web3 = new Web3("https://ropsten.infura.io/v3/" + projectId);

          // let web3 = new Web3(
          //   // Replace YOUR-PROJECT-ID with a Project ID from your Infura Dashboard
          //   new Web3.providers.WebsocketProvider(
          //     "wss://ropsten.infura.io/ws/v3/" + projectId
          //   )
          // );

          let neoKeyAddress = "0x82586c14c316Bb21865416fea2677A4Dc4411170";
          //Use hash of signature content instead of manifestContent and call it
          //signatureHash
          let rawData = {
            publicKey: input.publicKeyBuffer.toString("hex"),
            manifestHash: ethUtil.sha256(input.manifestContent).toString("hex")
          };

          let fromAddress = ethUtil
            .privateToAddress(privateKeyBuffer)
            .toString("hex");
          let transactionCount = await web3.eth.getTransactionCount(
            fromAddress
          );

          let dataString = JSON.stringify(rawData);
          let dataBuffer = ethUtil.toBuffer(dataString);
          let dataHex = ethUtil.bufferToHex(dataBuffer);

          let transactionParams = {
            nonce: "0x" + transactionCount.toString(16),
            to: neoKeyAddress,
            data: dataHex
            // gasPrice: gasPriceHex,
            // gasLimit: gasLimit
          };
          let estimatingTransaction = new EthereumTx(transactionParams);
          estimatingTransaction.sign(privateKeyBuffer);
          let baseFee = estimatingTransaction.getBaseFee().toNumber();

          let gasPrice = 100000;
          let gasPriceHex = "0x" + gasPrice.toString(16);
          console.log("Gas Price", gasPriceHex);

          let gasLimit = baseFee;
          let gasLimitHex = "0x" + gasLimit.toString(16);
          console.log("Gas Limit", gasLimitHex);

          transactionParams.gasPrice = gasPriceHex;
          transactionParams.gasLimit = gasLimitHex;
          let transaction = new EthereumTx(transactionParams);
          transaction.sign(privateKeyBuffer);

          let transactionValid = transaction.validate();
          console.log("Transaction Valid", transactionValid);
          if (!transactionValid) {
            let validationError = transaction.validate(true);
            console.log("Validation Error", validationError);
          }

          const serializedTransaction = transaction.serialize();

          let transactionHash = "0x" + serializedTransaction.toString("hex");

          web3.eth
            .sendSignedTransaction(transactionHash)
            .on("error", error => {
              let errorMessage =
                "We could not process your transaction.  Please kindly verify that the address associated with your keystore file has enough funds.";
              if (
                typeof error === "object" &&
                typeof error.message !== "undefined"
              ) {
                let messageParts = error.message.split(":");
                try {
                  let messageObject = JSON.parse(messageParts[1].trim);
                  if (
                    messageObject &&
                    typeof messageObject.message !== "undefined"
                  ) {
                    errorMessage =
                      "We could not process your transaction. " +
                      messageObject.message.charAt(0).toUpperCase() +
                      messageObject.message.slice(1);
                  }
                } catch (error) {}
              }
              this.setState({
                transactionError: errorMessage
              });
            })
            .on("transactionHash", hash => {
              this.setState(
                {
                  transactionHash: hash
                },
                () => {
                  this.downloadZipFile();
                }
              );
            });
        }
      }
    }
  };

  downloadZipFile = () => {
    let zip = Archive.createZip();
    let metaFolder = zip.folder("META-INF");
    metaFolder.file("manifest.mf", this.state.manifestContent);
    metaFolder.file("sig-neopak.sf", this.state.signatureContent);
    metaFolder.file("sig-neopak.ec", this.state.dsaFile);
    metaFolder.file("tx.hash", this.state.transactionHash);
    Archive.archiveFiles(this.state.filesInArchive, zip);
    Archive.saveAs("neopak.zip", zip, () => {
      console.log("SAVED!");
    });
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
            <h4>Create Signed Archive File</h4>
          </CardHeader>
          <CardBody>
            <div>
              <Stepper activeStep={activeStep} orientation="vertical">
                <Step key="password-or-file">
                  <StepLabel>Upload your NeoPak Id</StepLabel>
                  <StepContent>
                    <div className="px-4 pt-4 pb-4">
                      <div>
                        <div className="form-group mb-4">
                          <TextField
                            label="NeoPak Id Password"
                            type="password"
                            placeholder="Enter your NeoPak Id password."
                            value={this.state.keystorePassword}
                            onChange={e => {
                              let value = e.target.value;
                              this.setState({ keystorePassword: value });
                            }}
                            fullWidth
                          />
                          {this.state.errors &&
                            this.state.errors.keystorePassword && (
                              <>
                                <p style={{ color: "red" }}>
                                  {this.state.errors.keystorePassword[0]}
                                </p>
                              </>
                            )}
                        </div>
                        <div className="form-group mb-4">
                          <label>Upload Your NeoPak Id</label>
                          <div>
                            <input
                              title="NeoPak Id"
                              type="file"
                              onChange={this.onKeystoreUpload}
                            />
                          </div>
                          {this.state.errors && this.state.errors.archiveFile && (
                            <>
                              <p style={{ color: "red" }}>
                                {this.state.errors.archiveFile[0]}
                              </p>
                            </>
                          )}
                        </div>
                        <div>
                          {this.state.validatingKeystoreFile ? (
                            <>
                              <Button contained="true" disabled color="primary">
                                Validating NeoPak Id...
                              </Button>
                            </>
                          ) : (
                            <>
                              {" "}
                              <Button
                                contained="true"
                                color="primary"
                                onClick={this.validateKeystoreFile}
                              >
                                Upload NeoPak Id
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </StepContent>
                </Step>
                <Step key="upload-files">
                  <StepLabel>Upload Your Files</StepLabel>
                  <StepContent>
                    <div className="px-4 pt-4 pb-4">
                      <form className={classes.form}>
                        {this.state.useSavedKeystoreFile ? <></> : <></>}
                        <div
                          className="form-group"
                          style={{ marginBottom: "36px" }}
                        >
                          <div>
                            <Dropzone
                              onDrop={this.onDrop}
                              onFileDialogCancel={this.onCancel}
                            >
                              {({ getRootProps, getInputProps }) => (
                                <div {...getRootProps()}>
                                  <input
                                    {...getInputProps({
                                      multiple: "multiple"
                                    })}
                                  />
                                  <p>
                                    Drop files here, or click to select files
                                  </p>
                                  {this.state.errors &&
                                    this.state.errors.files && (
                                      <>
                                        <p style={{ color: "red" }}>
                                          {this.state.errors.files[0]}
                                        </p>
                                      </>
                                    )}
                                </div>
                              )}
                            </Dropzone>
                          </div>
                          <aside>
                            <h4>Files</h4>
                            <ul>{files}</ul>
                          </aside>
                        </div>
                        <div>
                          <Button
                            contained="true"
                            color="primary"
                            variant="contained"
                            onClick={this.validateFilesUploaded}
                          >
                            Upload Files
                          </Button>
                        </div>
                      </form>
                    </div>
                  </StepContent>
                </Step>
                <Step key="create-archive">
                  <StepLabel>Create and Download Neopak File</StepLabel>
                  <StepContent>
                    <div className="px-4 pt-4 pb-4">
                      {this.state.filesInArchive ? (
                        <>
                          {this.state.transactionHash && (
                            <>
                              {" "}
                              <h3>
                                This is your transaction hash:{" "}
                                {this.state.transactionHash}
                              </h3>
                              <h4>
                                Your NeoPak can be verified once Ethereum
                                processes the transaction.
                              </h4>
                              <Button
                                contained="true"
                                color="primary"
                                onClick={this.downloadZipFile}
                              >
                                Download Neopak File
                              </Button>
                            </>
                          )}
                          {this.state.transactionError && (
                            <>
                              <h3 className="text-danger">
                                {this.state.transactionError}
                              </h3>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <h4>
                              Creating Neopak File...
                              <strong>
                                Please do not close the browser until further
                                notice.
                              </strong>
                            </h4>
                          </div>
                        </>
                      )}
                    </div>
                  </StepContent>
                </Step>
              </Stepper>
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

export default withStyles(Styles)(ZipSign);
