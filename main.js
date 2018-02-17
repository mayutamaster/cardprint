"use strct";

// Electronのモジュール
const electron = require("electron");

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// 制御文字
const NUL = '\x00';
const STX = '\x02';
const ETX = '\x03';
const EOT = '\x04';
const ENQ = '\x05';
const ACK = '\x06';
const NAK = '\x15';
const CR = '\r';

// 関数
function readable(data) {
  //make buffered ASCII human readable.
  data = data.toString()
  data = data.replace(ACK, '[ACK]')
  data = data.replace(NUL, '[NUL]')
  data = data.replace(ENQ, '\n[ENQ]')
  data = data.replace(EOT, '\n[EOT]')
  data = data.replace(ETX, '[ETX]')
  data = data.replace(STX, '[STX]')
  data = data.replace(NAK, '\n[NAK]')
  data = data.replace(CR, '[CR]\n')
  return data
}

async function _send(data, port) {
  if (port && port.writable) {
    let readData = null;
    let sendCnt = 0;

    do {
      if (++sendCnt > 3) {
        console.error('SEND COMMAND Faild 3times.');
        return false;
      }

      console.log('SEND:', readable(data));
      if (! await port.write(data)) {
        console.error('SEND COMMAND Faild.');
        return false;
      }

      readData = await (new Promise(function (resolve) {
        let recvData = (data) => {
          clearTimeout(tmId);
          resolve(data.toString());
        };
        let tmId = setTimeout(() => {
          port.removeListener('data', recvData);
          resolve(null);
        }, 3000);
        port.once('data', recvData);
      }));
    } while (readData === null || readData === NAK + '00' + CR);

    console.log('RECV:', readable(readData));
    return readData;
  } else {
    console.error('Error: port is not writable.');
    return false;
  }
}

async function sendCtrl(ctrl, port) {
  let data = '' + ctrl + '00' + CR;
  let res = await _send(data, port);
  return res === null ? NUL : (res === false ? false :
    (res === ACK + '00' + CR ? ACK : NAK));
}

const sendEnq = sendCtrl.bind(this, ENQ);

/**
 * 
 * @param {string*} cmd 
 * @param {string|null} data 
 */
function mkCmd(cmd, data) {
  let res = STX + cmd + (data || '') + ETX;
  let bcc = 0;
  for (let i = 0; i < res.length; i++) {
    bcc ^= res[i].charCodeAt();
  }
  bcc = ('00' + bcc.toString(16)).slice(-2);
  return res + bcc + CR;
}

/**
 * 
 * @param {string} cmd 
 * @param {string|null} data 
 * @param {SerialPort} port 
 */
async function sendCmd(cmd, data, port) {
  var rData = await sendEnq(port);
  if (rData !== ACK) {
    console.error('faild.')
    return false;
  }

  let command = mkCmd(cmd, data);
  let res = await _send(command, port);
  return res === null ? NUL : (res === false ? false :
    (res === ACK + '00' + CR ? ACK : NAK));


  return command;
}

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow = null;

// 全てのウィンドウが閉じたら終了
app.on("window-all-closed", () => {
  if (process.platform != "darwin") {
    app.quit();
  }
});


// Electronの初期化完了後に実行
app.on("ready", () => {
  //ウィンドウサイズを設定する
  mainWindow = new BrowserWindow({ width: 920, height: 360, useContentSize: true });
  //使用するhtmlファイルを指定する
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // デバッグウインドウ初期表示
  mainWindow.openDevTools();

  const SerialPort = require('serialport');

  const port = new SerialPort('COM3', { // Windows
    parser: new SerialPort.parsers.Readline('\r'),
    baudRate: 9600
  });

  port.on('open', function (err) {
    console.log('Serial open.');
    if (err) {
      return console.error('Error:', err);
    }

    sendCmd('RJ', '00', port);
  });


  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});