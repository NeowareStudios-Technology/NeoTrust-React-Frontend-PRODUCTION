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
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
import Sequencer from "components/Sequencer";
import { archiveFiles } from "Archive/Archive.js";
import Archive from "Archive/Archive";
import JSZip from "jszip";
import JSZipUtils from "jszip-utils";

var ethUtil = require("ethereumjs-util");

class Component extends React.Component {
  constructor() {
    super();

    this.state = {
      files: [],
      errors: {},
      publicKey: null,
      archiveVerified: false,
      verifiedFiles: [],
      archiveFile: null,
      processing: false
    };
  }

  // ====================================
  //  render
  // ====================================

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <Card>
          <form className={classes.form}>
            <CardHeader color="primary" className={classes.cardHeader}>
              <h4>Verify A Signed Archive File</h4>
            </CardHeader>
            <CardBody>
              {this.state.archiveVerified ? (
                <>
                  <h3 style={{ textAlign: "center" }}>
                    We were able to verify your archive.
                  </h3>
                  <div>
                    <h4>
                      <strong>Public Key:</strong> {this.state.publicKey}
                    </h4>
                    <h4>
                      <strong>Files in archive:</strong>
                    </h4>
                    <ul>
                      {this.state.verifiedFiles.map((file, index) => {
                        return (
                          <li key={index}>
                            <h5>{file[1].name}</h5>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h5>Upload Your Archive File</h5>
                    <div
                      className="form-group"
                      style={{ marginBottom: "36px" }}
                    >
                      <input type="file" onChange={this.onUpload} directory webkitdirectory multiple />
                      {this.state.errors && this.state.errors.archiveFile && (
                        <>
                          <p style={{ color: "red" }}>
                            {this.state.errors.archiveFile[0]}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <Button
                      simple
                      color="primary"
                      size="lg"
                      onClick={this.getStarted.bind(this)}
                    >
                      Verify
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
            <CardFooter className={classes.cardFooter} />
          </form>
        </Card>
      </div>
    );
  }

  onUpload = e => {
    let files = e.target.files;
    let allowedExtensions = ["zip"];
    let extension = "";
    let file = null;
    if (typeof files[0] !== "undefined") {
      file = files[0];
      let nameParts = file.name.split(".");
      if (nameParts.length > 1) {
        extension = nameParts[nameParts.length - 1];
      }
    }
    let errors = this.state.errors;
    if (file && extension == "zip") {
      errors.archiveFile = [];
      this.setState({ archiveFile: file });
    } else {
      errors.archiveFile = ["Please upload a .zip file."];
    }
    this.setState({ errors: errors });
  };

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
    let archiveFile = this.state.archiveFile;
    if (!archiveFile) {
      errors.archiveFile = ["Please upload your archive file."];
    }
    if (archiveFile) {
      let sequence = new Sequencer();
      sequence.files = [];
      sequence.sfcontent = null;
      sequence.manifest = null;
      sequence.signature = null;
      sequence.onStop = () => {
        if (sequence.sfcontent && sequence.manifest && sequence.signature) {
          let fileHashes = [];
          let sfContentSections = sequence.sfcontent.split("\n\n");

          let manifestParts = sequence.manifest.split("\n");
          manifestParts.map(manifestLine => {
            let manifestParts = manifestLine.split(":");
            if (manifestParts[0] === "SHA256-Digest") {
              let fileHash = manifestParts[1].trim();
              fileHashes.push(fileHash);
            }
          });
          let publicKeyLine = manifestParts.find(manifestLine => {
            let lineParts = manifestLine.split(":");
            return lineParts[0] === "Public Key";
          });
          if (publicKeyLine) {
            let lineParts = publicKeyLine.split(":");
            let publicKey = lineParts[1].trim();
            let publicKeyBuffer = Buffer.from(publicKey, "hex");

            let sfContentHash = ethUtil.sha256(sequence.sfcontent);
            console.log("What is signature", sequence.signature);

            let signatureVerified = ethUtil.secp256k1.verify(
              sfContentHash,
              Buffer.from(sequence.signature),
              publicKeyBuffer
            );

            if (signatureVerified) {
              let manifestVerified = true;
              sequence.files.map((file, index) => {
                let fileHash = file.hash.toString("hex");
                if (typeof fileHashes[index] !== "undefined") {
                  let fileHashInManifest = fileHashes[index];
                  if (fileHash === fileHashInManifest) {
                  } else {
                    manifestVerified = false;
                  }
                }
              });
              if (manifestVerified) {
                let sfVerified = true;
                this.setState({
                  publicKey: publicKey,
                  archiveVerified: true,
                  verifiedFiles: sequence.files
                });
              } else {
                let errors = {
                  archiveFile: [
                    "We could not verify the contents of the archive."
                  ]
                };
                this.setState({
                  errors: errors
                });
              }
            }
          }
        } else {
          let errors = {
            archiveFile: ["We could not verify the contents of the archive."]
          };
          this.setState({
            errors: errors
          });
        }
      };
      sequence.promise(() => {
        JSZip.loadAsync(this.state.archiveFile) // 1) read the Blob
          .then(
            function(zip) {
              if (typeof zip.files !== "undefined") {
                Object.entries(zip.files).map(file => {
                  let name = file[0];
                  if (name.indexOf("META-INF") === -1) {
                    sequence.promise(() => {
                      file[1].async("blob").then(blob => {
                        let reader = new FileReader();
                        reader.onload = () => {
                          console.log("File Content:", reader.result);
                          file.hash = ethUtil.sha256(reader.result);
                          sequence.files.push(file);
                          sequence.next();
                        };
                        reader.readAsText(blob);
                      });
                    });
                  }
                  if (name === "META-INF/sig-neopak.sf") {
                    sequence.promise(() => {
                      file[1].async("blob").then(blob => {
                        let reader = new FileReader();
                        reader.onload = () => {
                          sequence.sfcontent = reader.result;
                          sequence.next();
                        };
                        reader.readAsText(blob);
                      });
                    });
                  }
                  if (name === "META-INF/manifest.mf") {
                    sequence.promise(() => {
                      file[1].async("blob").then(blob => {
                        let reader = new FileReader();
                        reader.onload = () => {
                          sequence.manifest = reader.result;
                          sequence.next();
                        };
                        reader.readAsText(blob);
                      });
                    });
                  }
                  if (name === "META-INF/sig-neopak.ec") {
                    sequence.promise(() => {
                      file[1].async("blob").then(blob => {
                        let reader = new FileReader();
                        reader.onload = () => {
                          sequence.signature = new Uint8Array(reader.result);
                          sequence.next();
                        };
                        reader.readAsArrayBuffer(blob);
                      });
                    });
                  }
                  //   file.async("text").then(content => {
                  //     console.log("content", content);
                  //   });
                });
              }
              sequence.next();
            },
            function(e) {}
          );
      });
      sequence.next();
    } else {
      errors.files = ["Please upload your Zip File."];
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

export default withStyles(Styles)(Component);
