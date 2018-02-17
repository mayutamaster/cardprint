const serialPort = require('serialport');
console.info('renderer.js ports');
serialPort.list((err, ports)=>{
    ports.forEach((port) => {
      console.info(port);
    });
  });

