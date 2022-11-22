# wa-tunnel - TCP Tunneling through Whatsapp

![](https://i.imgur.com/EWjlQyz.gif)

This is a [Baileys](https://github.com/adiwajshing/Baileys) based piece of code that lets you tunnel TCP data through two Whatsapp accounts.

This can be usable in different situations, for example network carriers that give unlimited whatsapp data or airplanes where you also get unlimited social network data.

It's using Baileys since it's a WS based multi-device whatsapp library and therefore could be used in android in the future, using Termux for example.

The idea is to use it with a proxy setup on the server like this: [Client (restricted access) -> Whatsapp -> Server -> Proxy -> Internet]

Apologizes in advance since Javascript it's not one of my primary coding languages :/

Use only for educational purpose.

## How does it work?

It sends TCP network packages through WhatsApp text and **file** messages, depending on the amount of characters it splits them into different text messages or files.

To not get timed out by WhatsApp by default it's limited at 20k characters per message, at the moment it's hardcoded in **wasocket.js**.
I have done multiple tests and anything below that may get you banned for sending too many messages and any above 80k may timeout.

If a network package is over the limit (20k chars by default) it will be sent as a file if enabled. Also if multiple network packages are cached it will use the same cryteria.

File messages are sent as binary files, TCP responses are concatenated with a delimiter and compressed using **brotli** to reduce data usage.

It **caches TCP socket responses** to group them and send the maximum amount of data in a message therefore reducing the amount of messages, improving the speed and reducing the probability of getting banned.

## Performance improvements

Before: (without files and no response caching)

    curl -x localhost:12345 https://www.youtube.com
    - 50-80 messages
    - 30-40 seconds

After: (with files and response caching)

    curl -x localhost:12345 https://www.youtube.com
    - 6-8 messages
    - 7-15 seconds

In case you are not allowed to send files use the `--disable-files` flag when starting the server and client to disable this functionality.

## Why?

I got the idea While travelling through South America network data on carriers is usually restricted to not many GBs but WhatsApp is usually unlimited, I tried to create this library since I didn't find any usable at the date.

# Setup

You must have access to two Whatsapp accounts, one for the server and one for the client.
You can forward a local port or use an external proxy.

## Server side

Clone the repository on your server and install node dependencies.

1. `cd path/to/wa-tunnel`
2. `npm install`

Then you can start the server with the following command where **port** is the proxy port and **host** is the proxy host you want to forward. And **number** is the client WhatsApp number with the country code alltogether and without +.

    npm run server host port number

You can use a local proxy server like follows:

    npm run server localhost 3128 12345678901

Or you can use a normal proxy server like follows:

    npm run server 192.168.0.1 3128 12345678901

## Client Side

Clone the repository on your server and install node dependencies.

1. `cd path/to/wa-tunnel`
2. `npm install`

Then you can start the server with the following command where **port** is the local port where you will connect and **number** is the server WhatsApp number with the country code alltogether and without +.

    npm run client port number

For example

    npm run client 8080 1234567890

## Usage

The first time you open the script Baileys will ask you to scan the QR code with the whatsapp app, after that the session is saved for later usage.

It may crash, that's normal after that just restart the script and you will have your client/server ready!

Once you have both client and server ready you can test using curl and see the magic happen.

    curl -v -x proxyHost:proxyPort https://httpbin.org/ip

With the example commands would be:

    curl -v -x localhost:8080 https://httpbin.org/ip

It has been tested also with a normal browser like Firefox, it's slow but can be used.

You can also forward other protocol ports like SSH by setting up the server like this:

    npm run server localhost 22 12345678901

And then connect to the server by using in the client:

    ssh root@localhost -p 8080

## Usage on Android

To use on Android, you can use it with [Termux](https://play.google.com/store/apps/details?id=com.termux) using the following commands:

    pkg update && pkg upgrade
    pkg install git nodejs -y
    git clone https://github.com/aleixrodriala/wa-tunnel.git
    cd wa-tunnel
    npm install

## Disclaimer

Using this library may get your WhatsApp account banned, use with a temporary number or at your own risk.

## TO-DO

- ~~Make an Android script to install node dependencies on termux~~
- When Baileys supports calls, implement package sending through calls
- ~~Implement sending files for big data packages to reduce messages and maybe improve speed~~
- ~~Cache socket responses to reduce even further the amount of messages sent~~
- Documentation

## License

[MIT](https://github.com/aleixrodriala/wa-tunnel/blob/master/LICENSE)
