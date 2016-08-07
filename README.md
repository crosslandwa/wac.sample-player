# wac.sample-player

Load and playback samples via the Web Audio API

# API
```javascript
const context = new window.AudioContext(),
    Player = require('wac.sample-player'); // add dependency via require

//-----CREATE----
var player = new Player('http://path/to/sample.mp3', context, [onLoad]); // onload = optional callback called when sample loading finished and passed the player instance as an argument

//-----HEAR-----
player.toMaster(); // fluid convenience method to connect to the master output presented by the Audio Context. Returns the player instance.
player.connect(destination, output, input); // as per https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect(AudioNode)
player.disconnect(); // as per https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/disconnect

//-----INTERACT-----
player.play(); // play the sample
player.play(gain) // play the sample at a given volume. gain = an object that must have a .toAbsolute() method returning a gain amount (typically 0 -> 1)
player.isPlaying(); // returns boolean
player.updatePlaybackRate(rate); // updates the playback rate (including currently playing sound)

//-----OBSERVE-----
player.on('started', (gain) => { // playback started actions }); // gain is the object passed to the .play()
player.on('stopped', () => { // playback stopped actions });
```


## Asynchronous loading example

If you want to load a sample and only utilise the player once the sample has finished loading, this can be achieved with Promises and the optional third constructor argument

```javascript
const context = new window.AudioContext(),
    Player = require('wac.sample-player'); // add dependency via require
    
new Promise((resolve, reject) => {
    new Player('http://asset/url.mp3', context, resolve).toMaster()
}).then((player) => {
    // do stuff with the player
    player.play();
});
```