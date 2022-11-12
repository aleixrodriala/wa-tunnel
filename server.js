const {startSock, sendData} = require('./common.js');
const net = require('net');

if (process.argv.length != 5) {
  console.log("usage: server.js <proxyhost> <proxyPort> <client-wa-num>");
  process.exit();
}
const proxyHost = process.argv[2];
const proxyPort = process.argv[3];
const clientNum = `${process.argv[4]}@s.whatsapp.net`;

const sockets = {};

const callback = (socketNumber, decryptedText) => {
    if (!sockets[socketNumber]){
	    console.log(`Socket NOT In list -> {socketNumber}`)
	    var client = new net.Socket();

	    client.connect(proxyPort, proxyHost, function() {
	        console.log(`STARTED Connection -> {socketNumber}`);
	        client.write(decryptedText);
	    });

	    client.on('data', async function(data) {
	    	client.pause()
	    	await sendData(waSock, data, socketNumber, clientNum)
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
