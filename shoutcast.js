var net = require("net"),
  fs = require("fs"),
  util = require("util"),
  http = require('http'),
  file = require('./lib/file');

var song_queue = { songs: [], idx: 0 };

var STATION = {
  NAME: 'Node Shoutcasts R Us',
  GENRE: 'Musak',
  URL: 'http://github.com/ncb000gt/node-shoutcast/',
  NOTICE: 'I\'m a little teapot...',
  PLAYLIST: 'samples',
  QUEUE_SIZE: 20
};

try {
  var config = require(
    process.env.NODE_SHOUTCAST_CONFIG ||
    '/usr/local/etc/node-shoutcast/config'
  );

  if('STATION' in config) {
    for(var key in config.STATION) { STATION[key] = config.STATION[key]; }
  }
} catch(e) {
  console.log('Failed to load config. Using default settings.');
}

var PLAYLIST = STATION.PLAYLIST, QUEUE_SIZE = STATION.QUEUE_SIZE;
var stats = fs.statSync(PLAYLIST);
var headers = {
  'icy-notice1': STATION.NOTICE,
  'icy-notice2': "NodeJS Streaming Shoutcast Server/v0.1",
  'icy-name': STATION.NAME,
  'icy-genre': STATION.GENRE,
  'icy-url': STATION.URL,
  'Content-Type': 'audio/mpegurl',
  'icy-pub':'0',
  'icy-br':'56',
  'icy-metaint': '0'//1024'
};
var bytesOut = 0;

util.debug('Playing the playlist from: ' + PLAYLIST);

if(stats.isDirectory()) {
  file.walkSync(PLAYLIST, function(p, dirs, files) {
    for(var i = 0; i < files.length; i++) {
      var file = files[i];

      if(file.indexOf('.mp3') >= 0) {
        console.log(file);

        song_queue.songs.push(p + '/' + file);
      }

      if(song_queue.songs.length > QUEUE_SIZE) { break; }
    }
  });
}

http.createServer(function (req, res) {
  var o = req.headers;

  for(var p in o) {
    util.puts(p + ': ' + o[p]);
  }

  util.puts('Starting stream...');

  res.writeHead(200, headers);

  // TODO: pop song and make read song as a stream separate from the request.
  // Requests should just tie into the already running stream
  var song = song_queue.songs[song_queue.idx];

  util.debug('song: ' + song);

  function startPumping(err) {
    var song = song_queue.songs[song_queue.idx];

    if(song_queue.idx >= song_queue.songs.length) {
      util.puts("No more data. Closing.");

      res.end();
    } else {
      util.puts("Pumping next song.");

      var fStream = fs.createReadStream(song, { bufferSize:1024 });

      pump(fStream, res, startPumping)
    }
    song_queue.idx++;
  }

  startPumping();
}).listen(7000);

setInterval(function() { util.debug('Total Bytes Written: ' + bytesOut); }, 5000);

util.puts('Server running at http://0.0.0.0:7000/');

function pump(readStream, writeStream, callback) {
  function call() { if(callback) { callback(arguments); callback = null; }}

  readStream.pause = function() { readStream.emit("pause"); }
  readStream.resume = function() { readStream.emit("resume") };

  readStream.addListener("data", function(chunk) {
    bytesOut += chunk.length;

    if(writeStream.write(chunk) === false) { readStream.pause(); }
  });

  writeStream.addListener("pause", function () { readStream.pause(); });
  writeStream.addListener("drain", function () { readStream.resume(); });
  writeStream.addListener("resume", function () { readStream.resume(); });

  readStream.addListener("end", function () {});
  readStream.addListener("close", function () { call(); });

  readStream.addListener("error", function (err) {
    writeStream.end();

    call(err);
  });

  writeStream.addListener("error", function (err) {
    readStream.destroy();

    call(err);
  });
};
