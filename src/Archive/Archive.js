// ======================================
//	NeoPak.io
//  Archive.js
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6 

import JSZip from "jszip" ;
import { saveAs } from 'file-saver';

// ====================================
//  archiveFiles
// ====================================

export function archiveFiles(files) {
  console.log('archiveFiles: ', files);

  var zip = new JSZip();

  for (var i in files) {
    let file = files[i];
    zip.file(file.name, file);
  }

  zip.generateAsync({type:"blob"})
    .then(function (blob) {
      saveAs(blob, "test.zip");
    });

}