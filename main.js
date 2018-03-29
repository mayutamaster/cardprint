"use strct";

// Electronのモジュール
const electron = require("electron");

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow = null;

// 全てのウィンドウが閉じたら終了
app.on("window-all-closed", () => {
  //if (process.platform != "darwin") {
  app.quit();
  //}
});


// Electronの初期化完了後に実行
app.on("ready", () => {
  //ウィンドウサイズを設定する
  //mainWindow = new BrowserWindow({ width: 920, height: 960, useContentSize: true });
  mainWindow = new BrowserWindow({ width: 400, height: 260, useContentSize: true });

  //使用するhtmlファイルを指定する
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // デバッグウインドウ初期表示
  //mainWindow.openDevTools();

  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});
