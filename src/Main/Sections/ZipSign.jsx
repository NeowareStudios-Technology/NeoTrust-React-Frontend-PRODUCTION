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
import { TextField } from "@material-ui/core";
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
var ReactDOMServer = require("react-dom/server");
var ethUtil = require("ethereumjs-util");
// var keythereum = require("keythereum");

require("react-dropzone-component/styles/filepicker.css");
// ====================================
//  ZipSign
// ====================================

class ZipSign extends React.Component {
  constructor() {
    super();

    this.state = {
      password: "",
      publicKey: null,
      privateKey: "",
      keystoreObject: null,
      fileName: "neopak",
      files: [],
      filesContents: [],
      processing: false
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

  onCancel = () => {
    console.log("onCancel");
    // this.setState({
    //   files: []
    // });
  };

  createPrivateKeyData = callback => {
    let privateKeyData = null;
    let keythereum = null;

    /**
     * Not being able to install keythereum on window because of missing python
     * and VCBuild.exe.
     */
    if (typeof window.keythereum !== "undefined") {
      keythereum = window.keythereum;
    }

    if (keythereum) {
      let dk = keythereum.create();
      if (dk) {
        privateKeyData = dk;
      }
    }

    callback(privateKeyData);
  };

  createFile = () => {
    let sequence = new Sequencer();
    sequence.errors = {};
    sequence.privateKeyData = null;

    sequence.promise(() => {
      let passwordValid = true;
      let password = this.state.password;
      if (!password) {
        passwordValid = false;
        sequence.errors.password = ["Please enter a password."];
      } else {
        if (password.length < 9 || password.length > 15) {
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
      this.createZipFile(sequence.privateKeyData, () => {
        sequence.next();
      });
    });

    sequence.onStop = () => {
      if (Object.keys(sequence.errors).length > 0) {
        this.setState({
          errors: sequence.errors
        });
      }
    };

    sequence.next();
  };

  createZipFile = (privateKeyData, callback) => {
    let files = this.state.files;
    let publicKey = null;
    if (files.length > 0) {
      this.setState({
        errors: {}
      });
      console.log("PKI", privateKeyData);
      let privateKeyBuffer = Buffer.from(privateKeyData.privateKey, "hex");

      try {
        publicKey = ethUtil.secp256k1.publicKeyCreate(privateKeyBuffer, false);
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
            "Public Key: " + publicKey.toString("hex"),
            "Timestamp: " + new Date().getTime(),
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
            publicKey
          );

          if (signatureVerified) {
            this.setState({
              publicKey: publicKey.toString("hex")
            });
            let zip = Archive.createZip();
            let metaFolder = zip.folder("META-INF");
            metaFolder.file("manifest.mf", manifestContent);
            metaFolder.file("sig-neopak.sf", signatureContent);
            metaFolder.file("sig-neopak.ec", dsaFile);
            Archive.archiveFiles(sequence.files, zip);
            Archive.saveAs("neopak.zip", zip, () => {
              console.log("SAVED!");
            });

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

            let keythereum = null;
            if (typeof window.keythereum !== "undefined") {
              keythereum = window.keythereum;
            }
            if (keythereum) {
              // synchronous
              var keyObject = keythereum.dump(
                this.state.password,
                privateKeyData.privateKey,
                privateKeyData.salt,
                privateKeyData.iv,
                options
              );
              if (keyObject) {
                this.setState({
                  keystoreObject: keyObject
                });
              }
            }
          }
        }
      };

      sequence.next();
    } else {
      let errors = this.state.errors;
      errors.files = ["Please add at least one file to this Zip Archive."];
      this.setState({
        errors: errors
      });
    }
  };

  downloadKeystoreFile = () => {
    if (this.state.keystoreObject) {
      try {
        let keystoreContent = JSON.stringify(this.state.keystoreObject);
        var blob = new Blob([keystoreContent], { type: "text/plain" });
        var fileName = "UTC--"+new Date().toISOString()+"--"+this.state.keystoreObject.address;
        saveAs(blob, fileName);
      } catch (error) {}
      console.log(
        "Have to stringify this and put it inside a document:",
        this.state.keystoreObject
      );
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

    return (
      <div className={classes.container}>
        <Card>
          <CardHeader color="primary" className={classes.cardHeader}>
            <h4>Create Signed Archive File</h4>
          </CardHeader>
          <CardBody>
            <div>
              {this.state.keystoreObject ? (
                <>
                  <div style={{ textAlign: "center" }}>
                    <h3>Successfully created your Zip file.</h3>
                    <div>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={this.downloadKeystoreFile}
                      >
                        Download Keystore File
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <form className={classes.form}>
                    <div
                      className="form-group"
                      style={{ marginBottom: "36px" }}
                    >
                      <TextField
                        label="Password"
                        placeholder="Enter a password for this archive."
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
                    </div>
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
                              <p>Drop files here, or click to select files</p>
                              {this.state.errors && this.state.errors.files && (
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
                    <div
                      className="text-center"
                      style={{ textAlign: "center" }}
                    >
                      <Button
                        simple
                        color="primary"
                        size="lg"
                        onClick={this.createFile}
                      >
                        Create File
                      </Button>
                    </div>
                  </form>
                </>
              )}
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
