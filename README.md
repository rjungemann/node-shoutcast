# Shoutcast

Shoutcast is a popular streaming audio server protocol. NodeJS lends itself very nicely to doing this kind of thing so building an app around it makes sense.

## thefifthcircuit's modifications

* Path to config file can now be specified with the NODE_SHOUTCAST_CONFIG environment variable.
* Config file is now optional. By default it will run with a "test" configuration.
* Now it doesn't close the stream after one file has been played.
* Shortened code base by ~40 lines.

## Disclaimer

Whatever is worse than alpha, this is it. Don't use it yet unless you want to help dev it. :) In that case, use it and submit patches. Thanks.

## Usage

node shoutcast.js

If you want to custom configure the options (kind of have to at this point) you have to create `config.js` in `/usr/local/etc/node-shoutcast/` such that it looks like the following (the url is not the url to access the station at, instead it is what is provided for meta data about the station).

    exports.STATION = {
      NAME: 'Bleh',
      GENRE: 'MUZAK',
      URL: 'http://somedomain.com',
      NOTICE: 'le what?',
      PLAYLIST: '/path/to/my/mp3s',
      QUEUE_SIZE: 20
    };

## License

see LICENSE file
