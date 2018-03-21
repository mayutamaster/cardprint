"use strict";

const iconv = require('iconv-lite');

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

function encSJIS(data) {
  let buf = iconv.encode(data, 'Shift_JIS');
  return buf.toString('binary');
};
module.exports.encSJIS = encSJIS;

function decSJIS(data) {
  let buf = Buffer.from(data, 'binary');
  return iconv.decode(buf, 'Shift_JIS');
};
module.exports.decSJIS = decSJIS;

async function _send(data, port) {
  if (port && port.writable) {
    let readData = null;
    let sendCnt = 0;
    let waitCnt = 0;

    do {
      if (waitCnt > 3) {
        console.error('SEND COMMAND Faild 3times Timeout.');
        return false;
      } else if (sendCnt > 3) {
        console.error('SEND COMMAND Faild 3times NAK.');
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
          waitCnt = 0;
          sendCnt++;
          resolve(data.toString());
        };
        let tmId = setTimeout(() => {
          waitCnt++;
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
module.exports.readable = readable;

async function _sendOnly(data, port) {
  if (port && port.writable) {
    let readData = null;
    let sendCnt = 0;
    let waitCnt = 0;

    console.log('SEND:', readable(data));
    if (! await port.write(data)) {
      console.error('SEND COMMAND Faild.');
      return false;
    }
  } else {
    console.error('Error: port is not writable.');
    return false;
  }
  return true;
}

/**
 * 
 * @param {*} ctrl 
 * @param {*} port 
 */
async function sendCtrl(ctrl, port) {
  let data = '' + ctrl + '00' + CR;
  let res = await _send(data, port);
  return res === null ? NUL : (res === false ? false :
    (res === ACK + '00' + CR ? ACK : NAK));
}
module.exports.sendCtrl = sendCtrl;

/**
 * 
 * @param {*} ctrl 
 * @param {*} port 
 */
async function sendOnlyCtrl(ctrl, port) {
  let data = '' + ctrl + '00' + CR;
  return await _sendOnly(data, port);
}
module.exports.sendOnlyCtrl = sendOnlyCtrl;

/**
 * 
 */
const sendEnq = sendCtrl.bind(this, ENQ);
module.exports.sendEnq = sendEnq;

/**
 * 
 */
const sendEot = sendOnlyCtrl.bind(this, EOT);
module.exports.sendEot = sendEot;

/**
 * 
 * @param {string} strMsgBody 
 */
function calcBcc(strMsgBody) {
  let bcc = 0;
  for (let i = 0; i < strMsgBody.length; i++) {
    bcc ^= strMsgBody[i].charCodeAt();
  }
  return ('00' + bcc.toString(16)).slice(-2).toUpperCase();
}
module.exports.calcBcc = calcBcc;

/**
 * 
 * @param {*} msg 
 */
function analyzeMsg(msg) {
  let strMsg = msg.toString();
  let idxStx = strMsg.indexOf(STX);
  let idxEtx = strMsg.indexOf(ETX);
  console.info(idxStx, idxEtx);
  let strMsgBody = strMsg.substr(idxStx, idxEtx - idxStx + 1);
  let strCmd = strMsgBody.substr(1, 2);
  let strId = strMsgBody.substr(3, 2);
  let strData = strMsgBody.slice(5, -1);
  let strBcc = strMsg.substr(idxEtx + 1, 2);

  console.debug(Buffer.from(msg, 'binary').toString('hex'));

  return {
    msgFull: strMsg,
    msgBody: strMsgBody,
    cmd: strCmd,
    id: strId,
    data: strData,
    bcc: strBcc
  };
}
module.exports.analyzeMsg = analyzeMsg;

function chkBcc(msg) {
  let obj = analyzeMsg(msg);
  return obj && calcBcc(obj.msgBody) === obj.bcc;
}
module.exports.chkBcc = chkBcc;

/**
 * 
 * @param {string*} cmd 
 * @param {string|null} data 
 */
function mkCmd(cmd, data) {
  let res = STX + cmd + (data || '') + ETX;
  let bcc = calcBcc(res);
  return res + bcc + CR;
}
module.exports.mkCmd = mkCmd;

/**
 * 
 * @param {string} cmd 
 * @param {string|null} data 
 * @param {SerialPort} port 
 */
async function sendCmd(cmd, data, port) {

  if (!port.isOpen) {
    console.error('port is not Open.')
    return false;
  }

  var rData = await sendEnq(port);
  if (rData !== ACK) {
    console.error('faild.')
    return false;
  }

  let command = mkCmd(cmd, data);
  let res = analyzeMsg(await _send(command, port));

  await sendEot(port);

  return res;

  return res === null ? NUL : (res === false ? false :
    (res === ACK + '00' + CR ? ACK : NAK));
}
module.exports.sendCmd = sendCmd;
