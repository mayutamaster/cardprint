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
  console.log('Serial open.');
  if (err) {
    return console.error('Error:', err);
  }

  funcs.sendCmd('RJ', '00', port);
});
