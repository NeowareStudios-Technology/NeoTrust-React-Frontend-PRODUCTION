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
import Web3 from "web3";
import moment from "moment";
var ethUtil = require("ethereumjs-util");
const EthereumTx = require("ethereumjs-tx");
const keythereum = require("keythereum");

class Component extends React.Component {
  constructor() {
    super();

    this.state = {
      files: [],
      errors: {},
      publicKey: null,
      publicKeyMatch: false,
      manifestHash: false,
      manifestHashMatch: false,
      archiveVerified: false,
      verifiedFiles: [],
      archiveFile: null,
      processing: false,
      transactionHash: false,
      transaction: null,
      checkedTransaction: false
    };
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

  hexToAscii(hex) {
    var str = "";
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  }

  cleanJsonString(str) {
    let output = str.trim();
    let firstParenthesisIndex = output.indexOf("{");
    if (firstParenthesisIndex > -1) {
      output = output.slice(firstParenthesisIndex);
    }
    return output;
  }
  verifyTransactionHash = async () => {
    if (this.state.transactionHash) {
      let projectId = "16b625506d4a427b9548ed443b66858b";
      let web3 = new Web3(
        // Replace YOUR-PROJECT-ID with a Project ID from your Infura Dashboard
        new Web3.providers.WebsocketProvider(
          "wss://ropsten.infura.io/ws/v3/" + projectId
        )
      );

      let neoKeyAddress = "0x82586c14c316Bb21865416fea2677A4Dc4411170";

      let transaction = await web3.eth.getTransaction(
        this.state.transactionHash
      );

      if (transaction && typeof transaction.blockHash === "string") {
        if (typeof transaction.input !== "undefined") {
          let txDataString = this.cleanJsonString(
            this.hexToAscii(transaction.input)
          );
          try {
            let txData = JSON.parse(txDataString.trim());
            if (
              txData &&
              typeof txData.publicKey !== "undefined" &&
              typeof txData.manifestHash !== "undefined"
            ) {
              let publicKeyMatch = false;
              let manifestHashMatch = false;
              if (this.state.publicKey === txData.publicKey) {
                publicKeyMatch = true;
              }
              if (this.state.manifestHash === txData.manifestHash) {
                manifestHashMatch = true;
              }

              if (publicKeyMatch && manifestHashMatch) {
                let block = await web3.eth.getBlock(transaction.blockHash);
                if (block) {
                  this.setState({
                    checkedTransaction: true,
                    block: block,
                    publicKeyMatch: true,
                    manifestHashMatch: true
                  });
                } else {
                  this.setState({
                    checkedTransaction: true,
                    block: null
                  });
                }
              }
            }
          } catch (error) {}
        }
      } else {
        this.setState({
          checkedTransaction: true
        });
      }
    }
  };

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
      sequence.transactionHash = null;

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
                  if (name === "META-INF/tx.hash") {
                    sequence.promise(() => {
                      file[1].async("blob").then(blob => {
                        let reader = new FileReader();
                        reader.onload = () => {
                          sequence.transactionHash = reader.result;
                          sequence.next();
                        };
                        reader.readAsText(blob);
                      });
                    });
                  }
                });
              }
              sequence.next();
            },
            function(e) {}
          );
      });

      sequence.onStop = () => {
        if (
          sequence.sfcontent &&
          sequence.manifest &&
          sequence.signature &&
          sequence.transactionHash
        ) {
          let fileHashes = [];
          let sfContentSections = sequence.sfcontent.split("\n\n");
          let sfContentLines = sequence.sfcontent.split("\n");
          let manifestHash = null;
          if (typeof sfContentLines[4] !== "undefined") {
            let manifestHashLineParts = sfContentLines[4].split(":");
            if (typeof manifestHashLineParts[1] !== "undefined") {
              manifestHash = manifestHashLineParts[1].trim();
            }
          }
          if (manifestHash) {
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
                  this.setState(
                    {
                      publicKey: publicKey,
                      transactionHash: sequence.transactionHash,
                      verifiedFiles: sequence.files,
                      manifestHash: manifestHash
                    },
                    () => {
                      this.verifyTransactionHash();
                    }
                  );
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

      sequence.next();
    } else {
      errors.files = ["Please upload your Zip File."];
    }
    if (Object.keys(errors).length > 0) {
      this.setState({ errors: errors });
    }
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
              {this.state.checkedTransaction ? (
                <>
                  {this.state.block ? (
                    <>
                      <h3>NeoPak Verificiation Successful</h3>
                      <h4>
                        NeoPak Timestamp:{" "}
                        {moment(this.state.block.timestamp * 1000).format("YYYY-MM-DD hh:mm:ss A")}
                      </h4>
                    </>
                  ) : (
                    <>
                      <h3>NeoPak could not be verified.</h3>
                      <h4>
                        Ensure enough time has passed since transaction sent.
                      </h4>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <h5>Upload Your Archive File</h5>
                    <div
                      className="form-group"
                      style={{ marginBottom: "36px" }}
                    >
                      <input
                        type="file"
                        onChange={this.onUpload}
                        directory
                        webkitdirectory
                        multiple
                      />
                      {this.state.errors && this.state.errors.archiveFile && (
                        <>
                          <p style={{ color: "red" }}>
                            {this.state.errors.archiveFile[0]}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button
                      contained
                      color="primary"
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
