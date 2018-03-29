/*
const serialPort = require('serialport');
console.info('renderer.js ports');
serialPort.list((err, ports)=>{
    ports.forEach((port) => {
      console.info(port);
    });
  });
*/

const funcs = require('./funcs.js');
const SerialPort = require('serialport');

const port = new SerialPort('COM5', { // Windows
  parser: new SerialPort.parsers.Readline('\r'),
  baudRate: 9600,
  parity: 'even'
});

port.on('open', function (err) {
  if (err) {
    return console.error('Error:', err);
  }
  console.log(port.path, 'Serial open.');
});


const getVresion = async () => {
  let res = await funcs.sendCmd('rv', '00', port);
  //console.debug('getVersion:', res);
  document.getElementById('ver-code').value = res.data[0] === 'B' ?
    'TCS209' : '不明(' + res.data[0] + ')';
  document.getElementById('ver-sver').value = res.data.substr(1, 6);
  document.getElementById('ver-mode').value = res.data.substr(7, 2) === '00' ?
    '標準' : '不明(' + res.data.substr(3, 2) + ')'
  document.getElementById('ver-card').value = res.data[9];
  document.getElementById('ver-memc').value = res.data[10];
  document.getElementById('ver-yobi').value = res.data[11];
  getVerBtn.disabled = false;
};

const getStatus = async () => {
  let res = await funcs.sendCmd('rJ', '00', port);
  console.debug(res);
};

const getCardData = async () => {
  let res = await funcs.sendCmd('rE', '00', port)
  //console.debug(res);
};

const getNameData = async () => {
  let res = await funcs.sendCmd('RF', '00', port)
  res.data = funcs.decSJIS(res.data);
  return res.data.trimRight();
};

const setNameData = async (name) => {
  let sjisName = funcs.encSJIS(name);
  let res = await funcs.sendCmd('sf', '00' + sjisName, port);
  //console.debug(res);
};

const registData = async () => {
  await funcs.sendCmd('CR', '00', port)
};

const cancelData = async () => {
  await funcs.sendCmd('CE', '00', port)
};

let loadBtn = document.getElementById('load-btn');


// debug
async function setElmVal(elm) {
  if (elm && elm instanceof HTMLInputElement) {
    let name = await getNameData();
    elm.value = name;
  }
}

let getVerBtn = document.getElementById('get-ver');
getVerBtn.addEventListener('click', function (e) {
  getVerBtn.disabled = true;
  getVresion();
});
let getStatBtn = document.getElementById('get-stat');
getStatBtn.addEventListener('click', function (e) {
  getStatus();
});

let getCdatBtn = document.getElementById('get-cdat');
getCdatBtn.addEventListener('click', function (e) {
  getCardData();
});

let getNameBtn = document.getElementById('get-name');
getNameBtn.addEventListener('click', function (e) {
  setElmVal(document.getElementById('cname'));
});

let setNameBtn = document.getElementById('set-name');
setNameBtn.addEventListener('click', function (e) {
  setNameData(document.getElementById('cname').value.trimRight());
});

let setRegistBtn = document.getElementById('regist');
setRegistBtn.addEventListener('click', function (e) {
  registData();
});

let setCancelBtn = document.getElementById('cancel');
setCancelBtn.addEventListener('click', function (e) {
  cancelData();
});
