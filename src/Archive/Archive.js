// ======================================
//	NeoPak.io
//  Archive.js
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6

import JSZip from "jszip";
import { saveAs } from "file-saver";

// ====================================
//  archiveFiles
// ====================================

let Archive = {
  createZip: function() {
    return new JSZip();
  },
  archiveFile: function(file, zip) {
    zip.file(file.name, file);
  },
  archiveFiles: function(files, zip) {
    for (var i in files) {
      let file = files[i];
      Archive.archiveFile(file, zip);
    }
  },
  saveAs: function(name, zip, callback) {
    zip.generateAsync({ type: "blob" }).then(function(blob) {
      saveAs(blob, name);
      callback();
    });
  }
};

export default Archive;
