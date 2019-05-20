// ======================================
//	NeoTrust.io
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
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
import Sequencer from "components/Sequencer";
import Archive from "../../Archive/Archive";
import { saveAs } from "file-saver";
import Web3 from "web3";
var ethUtil = require("ethereumjs-util");
const EthereumTx = require("ethereumjs-tx");
const keythereum = require("keythereum");
