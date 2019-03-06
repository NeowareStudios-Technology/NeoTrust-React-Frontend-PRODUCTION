// ======================================
//	NeoPak.io
//  ZipSign.jsx
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6

import React from "react";
// import classNames from 'classnames'
import Dropzone from "react-dropzone";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import { TextField } from "@material-ui/core";
// import Grid from '@material-ui/core/Grid';

// core components
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
import Sequencer from "components/Sequencer";
import { archiveFiles } from "Archive/Archive.js";
import Archive from "../../Archive/Archive";

var ethUtil = require("ethereumjs-util");

// ====================================
//  ZipSign
// ====================================

class ZipSign extends React.Component {
  constructor() {
    super();

    this.state = {
      publicKey: null,
      privateKey: "",
      files: [],
      filesContents: [],
      processing: false
    };
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
    ));

    return (
      <div className={classes.container}>
        <Card>
          <CardHeader color="primary" className={classes.cardHeader}>
            <h4>Create Signed Archive File</h4>
          </CardHeader>
          <CardBody>
            <div>
              {this.state.publicKey ? (
                <>
                  <div style={{ textAlign: "center" }}>
                    <h3>Successfully created your Zip file.</h3>
                    <h4>This is your public key: {this.state.publicKey}</h4>
                  </div>
                </>
              ) : (
                <>
                  <form className={classes.form}>
                    <div
                      className="form-group"
                      style={{ marginBottom: "24px" }}
                    >
                      <TextField
                        value={this.state.privateKey}
                        onChange={e => {
                          let value = e.target.value;
                          this.setState({ privateKey: value });
                        }}
                        label="Ethereum Private Key"
                        helperText="Enter Your Ethereym Private Key"
                        fullWidth={true}
                      />
                      {this.state.errors && this.state.errors.privateKey && (
                        <>
                          <p style={{ color: "red" }}>
                            {this.state.errors.privateKey[0]}
                          </p>
                        </>
                      )}
                    </div>
                    <div
                      className="form-group"
                      style={{ marginBottom: "36px" }}
                    >
                      <Dropzone
                        onDrop={this.onDrop.bind(this)}
                        onFileDialogCancel={this.onCancel.bind(this)}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div {...getRootProps()}>
                            <input {...getInputProps()} />
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
                        onClick={this.getStarted.bind(this)}
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

  // ====================================
  //  onDrop
  // ====================================

  onDrop(acceptedFiles, rejectedFiles) {
    this.setState({
      files: acceptedFiles
    });
  }

  onCancel() {
    console.log("onCancel");
    // this.setState({
    //   files: []
    // });
  }

  // ====================================
  //  getStarted
  // ====================================

  getStarted() {
    let errors = {};
    let privateKey = this.state.privateKey;
    let publicKey = null;
    let files = this.state.files;
    if (privateKey) {
      let privateKeyBuffer = Buffer.from(privateKey, "hex");
      try {
        publicKey = ethUtil.secp256k1.publicKeyCreate(privateKeyBuffer, false);
      } catch (error) {
        errors.privateKey = [
          "We could not process your private key.  Please make sure it's a valid Ethereum private key."
        ];
      }

      if (publicKey) {
        if (files.length > 0) {
          let sequence = new Sequencer();
          sequence.files = [];
          sequence.onStop = () => {
            if (sequence.files.length > 0) {
              let manifestContent = "";
              let manifestContentParts = [
                "Manifest-Version: 0.1",
                "Created-By: NeoPak (neopack 0.1 Beta)",
                "Public Key: " + publicKey.toString("hex"),
                "Timestamp: " + new Date().getTime(),
                "Comments: PLEASE DO NOT EDIT THIS FILE. YOU WILL BREAK IT."
              ];

              let signatureContent = "";
              let signatureContentParts = [
                "Signature-Version: 0.1",
                "Created-By: NeoPak (neopack 0.1 Beta)",
                "Comments: PLEASE DO NOT EDIT THIS FILE. YOU WILL BREAK IT.",
                "Digest-Algorithms: SHA256",
                "[Placeholder for the Manifest file signature]"
              ];

              sequence.files.map(file => {
                let fileEntries = [];
                fileEntries.push("Name: " + file.path);
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
              console.log("What is signature", dsaEcdSign.signature);
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
              }
            }
          };
          files.map(file => {
            sequence.promise(() => {
              var reader = new FileReader();

              reader.onload = function(e) {
                console.log("file content:", e.target.result);
                file.hash = ethUtil.sha256(e.target.result);
                sequence.files.push(file);
                sequence.next();
              };

              reader.readAsText(file);
            });
          });
          sequence.next();
        } else {
          errors.files = ["Please add at least one file to this Zip Archive."];
        }
      }
    } else {
      errors.privateKey = ["Please enter a valid Ethereum private key."];
    }
    if (Object.keys(errors).length > 0) {
      this.setState({ errors: errors });
    }
  }
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
