const {startSock, sendData} = require('./wasocket.js');
const net = require('net');

if (process.argv.length != 4) {
  console.log("usage: client.js <localport> <server-wa-num>");
  process.exit();
}

var localport = process.argv[2];
var remoteNum = `${process.argv[3]}@s.whatsapp.net`;

const host = 'localhost';
const sockets = {};

const callback = (socketNumber, decryptedText) => {
	if (sockets[socketNumber]) {
	    var flushed = sockets[socketNumber].write(decryptedText);
	} else {
	    console.log('SOCKET ALREADY DEAD -> ' + socketNumber)
	}     
}

const server = net.createServer();
server.listen(localport, host, () => {
    console.log(`TCP Server is running on port ${localport}.`);
});

waSock = startSock(remoteNum, callback, "client");

const sockFunc = (sock) => {
    console.log(`CONNECTED -> ${sock.remotePort}`);
    sockets[sock.remotePort] = sock;

    console.log(`ACTIVE SOCKETS -> ${Object.keys(sockets)}`);

    sock.on('data', async function(data) {
        sock.pause()
        await sendData(waSock, data, sock.remotePort, remoteNum);
        sock.resume()
    });

    sock.on('close', function(data) {
        delete sockets[sock.remotePort]
        console.log(`CLOSED -> ${sock.remotePort}`);
    });

    sock.on('error', function(e) {
        console.log(`ERROR SOCKET -> ${sock.remotePort}`);
        console.log(e.stack);
        sock.end()
        delete sockets[sock.remotePort];
    });
}

server.on('connection', sockFunc);