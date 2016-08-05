# wac.sample-player

Load and playback samples via the Web Audio API

# API
```javascript
const context = new window.AudioContext(),
    Player = require('wac.sample-player'); // add dependency via require

//-----CREATE----
var player = new Player('http://path/to/sample.mp3', context);

//-----HEAR-----
player.to_master(); // convenience method to connect to the master output presented by the Audio Context
player.connect(destination, output, input); // as per https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect(AudioNode)
player.disconnect(); // as per https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/disconnect

//-----INTERACT-----
player.play(velocity) // velocity = MIDI velocity in range 0-127 [THIS WILL CHANGE]. Retriggers if called whilst already playing
player.is_playing(); // returns boolean
player.update_playback_rate(rate); // updates the playback rate (including currently playing sound)

//-----OBSERVE-----
player.on('started', (velocity) => { // playback started actions }); // velocity in range 0-127 [THIS WILL CHANGE]
player.on('stopped', () => { // playback stopped actions });
```

## TODO
- take a db(?) gain value instead of MIDI velocity
