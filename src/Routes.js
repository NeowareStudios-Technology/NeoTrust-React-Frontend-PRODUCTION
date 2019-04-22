// ======================================
//	NeoPakApp
//  Routes
//  Copyright (c) 2019 NeoWare, Inc. All rights reserved.
// ======================================
// jshint esversion: 6

import MainPage from "Main/Main.jsx";
import VerifyPage from "./routes/verify";

var indexRoutes = [
  { path: "/verify", name: "VerifyPage", component: VerifyPage },
  { path: "/", name: "MainPage", component: MainPage }
];

export default indexRoutes;
