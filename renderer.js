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

const getStatus = () => {
  funcs.sendCmd('rJ', '00', port);
};



let loadBtn = document.getElementById('load-btn');


// debug
let getVerBtn = document.getElementById('get-ver');
getVerBtn.addEventListener('click', function(e) {
  getVresion();
})
let getStatBtn = document.getElementById('get-stat');
getStatBtn.addEventListener('click', function(e) {
  getStatus();
})
