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

const port = new SerialPort('COM3', { // Windows
  parser: new SerialPort.parsers.Readline('\r'),
  baudRate: 9600
});

port.on('open', function (err) {
  if (err) {
    return console.error('Error:', err);
  }
  console.log(port.path, 'Serial open.');
});


const getVresion = async () => {
  let res = await funcs.sendCmd('rv', '00', port);
  console.debug(res);
};

const getStatus = async () => {
  let res = await funcs.sendCmd('rJ', '00', port);
  console.debug(res);
};

const getNameData = async () => {
  let res = await funcs.sendCmd('RF', '00', port)
  res.data = funcs.decSJIS(res.data);
  console.debug(res);
  return res.data.replace('　様', '');
};

const setNameData = async () => {
  let res = await funcs.sendCmd('sf', '00', port)
  console.debug(res);
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
  getVresion();
});
let getStatBtn = document.getElementById('get-stat');
getStatBtn.addEventListener('click', function (e) {
  getStatus();
});
let getNameBtn = document.getElementById('get-name');
getNameBtn.addEventListener('click', function (e) {
  setElmVal(document.getElementById('cname'));
});
let setNameBtn = document.getElementById('set-name');
setNameBtn.addEventListener('click', function (e) {
  setNameData();
});
