const {startSock, sendData} = require('./wasocket.js');
const net = require('net');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .command('$0 <local-port> <server-wa-num> [disable-files]', 'Start a wa-tunnel client listening on <localport>', (yargs) => {
      yargs
        .positional('local-port', {
          describe: 'Port to be forwarded',
          demandOption: true,
        })
        .positional('server-wa-num', {
          describe: 'Server WhatsApp number following this format: 12345678901',
          demandOption: true,
        })
        .option('disable-files', {
          description: 'Disable sending WhatsApp files to reduce the amount of messages (sometimes not allowed)',
          default: false,
          type: 'boolean'
        })
        .version(false)
  }).parse()

var localport = argv.localPort;
var remoteNum = `${argv.serverWaNum}@s.whatsapp.net`;
var disableFiles = argv.disableFiles;

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
        await sendData(waSock, data, sock.remotePort, remoteNum, disableFiles);
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