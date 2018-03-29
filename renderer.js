const funcs = require('./funcs.js');
const SerialPort = require('serialport');

/**
 * メッセージボックス関連
 */
let dlgBtn = document.getElementById('dlg-msg-box-btn')
dlgBtn && dlgBtn.addEventListener('click', function () {
  let dlg = document.getElementById('dlg-msg');
  if (dlg) {
    dlg.classList.remove('show');
  }
});
const showMessageBox = (msg) => {
  let dlg = document.getElementById('dlg-msg');
  if (dlg) {
    let dlgMsg = document.getElementById('dlg-msg-box-msg')
    dlgMsg && (dlgMsg.innerHTML = msg);
    dlg.classList.add('show');
  }
};

/**
 * 各要素取得
 */
let comNameSel = document.getElementById('com-name');
let comSpeedSel = document.getElementById('com-speed');
let comBtn = document.getElementById('com-conn');
let loadBtn = document.getElementById('load-btn');

/**
 * シリアルポート選択要素生成
 */
SerialPort.list((err, ports) => {
  ports.forEach((port) => {
    let opt = comNameSel.appendChild(document.createElement('option'));
    opt.textContent = port.comName;
    port.manufacturer.match(/ratok/i) && (opt.selected = true);
  });
});

/**
 * 「act-a」クラス要素の活性切り替え処理
 */
const setEnableActA = bool => {
  document.querySelectorAll('.act-a').forEach(elm => {
    elm.disabled = !bool;
  });
}
setEnableActA(false);

/**
 * シリアルポート変数
 */
let comPort = null;

/**
 * 通信開始処理
 */
const comStart = async () => {

  if (comPort !== null) {
    console.debug('Serial already open.');
    return false;
  }

  let comName = comNameSel ? comNameSel.value : '?????';
  let comSpeed = comSpeedSel ? parseInt(comSpeedSel.value) : 9600;
  comPort = new SerialPort(comName, {
    autoOpen: false,
    parser: new SerialPort.parsers.Readline('\r'),
    baudRate: comSpeed,
    parity: 'even'
  });

  return await new Promise((resolve) => {
    comPort.open(function (err) {
      if (err) {
        console.error('Error:', err)
        return resolve(false);
      }
      console.log(comPort.path, 'Serial open.');
      return resolve(true);
    });
  });
}

/**
 * 通信終了処理
 */
const comStop = async () => {
  if (comPort === null) {
    console.debug('Serial not open.');
    return false;
  }

  return await new Promise((resolve) => {
    comPort.close(function (err) {
      if (err) {
        console.error('Error:', err)
        return resolve(false);
      }
      console.log(comPort.path, 'Serial close.');
      return resolve(true);
    });
  });
};

/**
 * バージョン情報取得処理
 */
const getVresion = async (port) => {
  let res = await funcs.sendCmd('rv', '00', port);
  //console.debug('getVersion:', res);
  if (res) {
    document.getElementById('ver-code').value = res.data[0] === 'B' ?
      'TCS209' : '不明(' + res.data[0] + ')';
    document.getElementById('ver-sver').value = res.data.substr(1, 6);
    document.getElementById('ver-mode').value = res.data.substr(7, 2) === '00' ?
      '標準' : '不明(' + res.data.substr(3, 2) + ')'
    document.getElementById('ver-card').value = res.data[9];
    document.getElementById('ver-memc').value = res.data[10];
    document.getElementById('ver-yobi').value = res.data[11];
  }
};

const getStatus = async (port) => {
  let res = await funcs.sendCmd('rJ', '00', port);
  return res;//console.debug(res);
};

const getCardData = async (port) => {
  let res = await funcs.sendCmd('rE', '00', port)
  return res;//console.debug(res);
};

const getNameData = async (port) => {
  let res = await funcs.sendCmd('RF', '00', port)
  res.data = funcs.decSJIS(res.data);
  return res.data.trimRight();
};

const setNameData = async (port, name) => {
  let sjisName = funcs.encSJIS(name);
  let res = await funcs.sendCmd('sf', '00' + sjisName, port);
  return res;//console.debug(res);
};

const setMessage = async (port, msg1, msg2, msg3) => {
  let mem = '0';
  let block = '111';
  let sjisMsg1 = funcs.encSJIS(msg1);
  let sjisMsg1Spc = ' '.repeat(26 - sjisMsg1.length);
  let sjisMsg2 = funcs.encSJIS(msg2);
  let sjisMsg2Spc = ' '.repeat(26 - sjisMsg1.length);
  let sjisMsg3 = funcs.encSJIS(msg3);
  let sjisMsg3Spc = ' '.repeat(26 - sjisMsg1.length);
  //let data = mem + block + sjisMsg1 + sjisMsg1Spc +
  //  sjisMsg2 + sjisMsg2Spc + sjisMsg3 + sjisMsg3Spc;
  let data = '1' + '1' + sjisMsg1;
  let res = await funcs.sendCmd('sx', '00' + data, port);
  console.debug(res);
  return res;//console.debug(res);
};

const registData = async (port) => {
  await funcs.sendCmd('CR', '00', port)
};

const cancelData = async (port) => {
  await funcs.sendCmd('CE', '00', port)
};

// product
/**
 * 通信開始・終了ボタン イベント処理
 */
comBtn.addEventListener('click', function () {
  if (!this.disabled) {
    this.disabled = true;
    if (this.dataset.conn === '0') {
      (async () => {
        if (await comStart()) {
          this.textContent = '通信終了';
          this.setAttribute('data-conn', '1');
          this.disabled = false;
          setEnableActA(true);
        }
      })();
    } else {
      (async () => {
        if (await comStop()) {
          comPort = null;
          this.textContent = '通信開始';
          this.setAttribute('data-conn', '0');
          this.disabled = false;
          setEnableActA(false);
        }
      })();
    }
  }
  return false;
});

let setNameBtn = document.getElementById('set-name');
setNameBtn.addEventListener('click', function (e) {
  let name = document.getElementById('cname').value.trimRight();
  let len = funcs.encSJIS(name).length;
  if (len === 0) {
    showMessageBox('お名前を入力してください。');
    return false;
  } else if (len > 16) {
    showMessageBox('文字数が多すぎます。<br>（全角8文字以内、半角16文字以内）');
    return false;
  }

  (async (name) => {
    setEnableActA(false);
    let stats = await getStatus(comPort);
    console.debug(stats);
    if (!stats) {
      setEnableActA(true);
      return showMessageBox('発行機ステータスの取得に失敗しました。<br>本体を確認してください。');
    } else if (stats.data[0] === '0' ) {
      setEnableActA(true);
      return showMessageBox('カードが挿入されていません。<br>カード挿入後に再度実行してください。');
    }
    await getCardData(comPort);
    let result = await setNameData(comPort, name);
    console.debug(result);
    if (result && result.msgFull !== 'false') {
      setEnableActA(true);
      return showMessageBox('転送が完了しました。<br>本体の実行ボタンを押してください。');
    } else {
      setEnableActA(true);
      return showMessageBox('転送に失敗しました。<br>原因：不明');
    }
  })(name);

  return false;
});

let setMessageBtn = document.getElementById('set-msg');
setMessageBtn.addEventListener('click', function (e) {
  let msg1 = document.getElementById('message1').value.trimRight();
  let msg2 = document.getElementById('message1').value.trimRight();
  let msg3 = document.getElementById('message1').value.trimRight();
  /*
  (async (name) => {
    setEnableActA(false);
    let stats = await getStatus(comPort);
    console.debug(status);
    await getCardData(comPort);
    let result = await setNameData(comPort, name);
    console.debug(result);
    if (result) {
      setEnableActA(true);
      showMessageBox('転送が完了しました。<br>本体の実行ボタンを押してください。');
    }
  })(name);
  */
  setMessage(comPort, msg1, msg2, msg3);
  return false;
});


// debug
async function setElmVal(port, elm) {
  if (elm && elm instanceof HTMLInputElement) {
    let name = await getNameData(port);
    elm.value = name;
  }
}

let getVerBtnDeb = document.getElementById('deb-get-ver');
let getStatBtnDeb = document.getElementById('deb-get-stat');
let getCdatBtnDeb = document.getElementById('deb-get-cdat');
let getNameBtnDeb = document.getElementById('deb-get-name');
let setNameBtnDeb = document.getElementById('deb-set-name');
let setRegistBtnDeb = document.getElementById('deb-regist');
let setCancelBtnDeb = document.getElementById('deb-cancel');

getVerBtnDeb && getVerBtnDeb.addEventListener('click', function (e) {
  setEnableActA(false);
  getVresion(comPort).then(() => {
    setEnableActA(true);
  });
});
getStatBtnDeb && getStatBtnDeb.addEventListener('click', function (e) {
  setEnableActA(false);
  getStatus(comPort).then(() => {
    setEnableActA(true);
  });
});

getCdatBtnDeb && getCdatBtnDeb.addEventListener('click', function (e) {
  setEnableActA(false);
  getCardData(comPort).then(() => {
    setEnableActA(true);
  });
});

getNameBtnDeb && getNameBtnDeb.addEventListener('click', function (e) {
  setEnableActA(false);
  setElmVal(comPort, document.getElementById('cname')).then(() => {
    setEnableActA(true);
  });
});

setNameBtnDeb.addEventListener('click', function (e) {
  let name = document.getElementById('cname').value.trimRight();
  setEnableActA(false);
  setNameData(comPort, name).then(() => {
    setEnableActA(true);
  });
});

setRegistBtnDeb && setRegistBtnDeb.addEventListener('click', function (e) {
  setEnableActA(false);
  registData(comPort).then(() => {
    setEnableActA(true);
  });
});

setCancelBtnDeb && setCancelBtnDeb.addEventListener('click', function (e) {
  setEnableActA(false);
  cancelData(comPort).then(() => {
    setEnableActA(true);
  });
});
