const {startSock, sendData} = require('./wasocket.js');
const net = require('net');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .command('$0 <proxy-host> <proxy-port> <client-wa-num> [disable-files]', 'Start a wa-tunnel server listening on <localport>', (yargs) => {
      yargs
        .positional('local-port', {
          describe: 'Port to be forwarded',
          demandOption: true,
        })
        .positional('client-wa-num', {
          describe: 'Client WhatsApp number following this format: 12345678901',
          demandOption: true,
        })
        .option('disable-files', {
          description: 'Disable sending WhatsApp files to reduce the amount of messages (sometimes not allowed)',
          default: false,
          type: 'boolean'
        })
        .version(false)
  }).parse()

const proxyHost = argv.proxyHost;
const proxyPort = argv.proxyPort;
const clientNum = `${argv.clientWaNum}@s.whatsapp.net`;
var disableFiles = argv.disableFiles;

const sockets = {};

const callback = (socketNumber, decryptedText) => {
    if (!sockets[socketNumber]){
	    console.log(`Socket NOT In list -> ${socketNumber}`)
	    var client = new net.Socket();

	    client.setNoDelay(true);

	    client.connect(proxyPort, proxyHost, function() {
	        console.log(`STARTED Connection -> ${socketNumber}`);
	        client.write(decryptedText);
	    });

	    client.on('data', async function(data) {
	    	client.pause()
	    	await sendData(waSock, data, socketNumber, clientNum, disableFiles)
	    	client.resume()
	    });

	    client.on('end', function() {
	      console.log(`CLOSED -> ${socketNumber}`);
	      delete sockets[socketNumber];
	    });

	    client.on('error', function(e) {
	        console.log('ERROR Client!');
	        console.log(e)
	        delete sockets[socketNumber];
	    });
	    sockets[socketNumber] = client;
	}
	else{
	    sockets[socketNumber].write(decryptedText);
	}
}

waSock = startSock(clientNum, callback, "server");
