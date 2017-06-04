# wac.sample-player

Load and playback samples via the Web Audio API

# API
```javascript
const context = new window.AudioContext(),
    PlayerFactory = require('wac.sample-player')(context); // pass the audio context to the PlayerFactory

//-----CREATE (Promise based)----
PlayerFactory.forResource('http://path/to/sample.mp3') // load a sample for a URL
.then(player => {
  //-----HEAR-----
  player.toMaster(); // fluid convenience method to connect to the master output presented by the Audio Context. Returns the player instance.
  player.connect(destination, output, input); // as per https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect(AudioNode)
  player.disconnect(); // as per https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/disconnect

  //-----INTERACT-----
  player.play(); // play the sample
  player.play(gain) // play the sample at a given volume. gain = an object that must have a .toAbsolute() method returning a gain amount (typically 0 -> 1)
  player.isPlaying(); // returns boolean
  player.updatePlaybackRate(rate); // fluent, updates the playback rate (including currently playing sound) then returns the player

  //-----OBSERVE-----
  player.on('started', (gain) => { // playback started actions }); // gain is the object passed to the .play()
  player.on('stopped', () => { // playback stopped actions });
})
```
## Playing local files

Playback of local files via the [File](https://developer.mozilla.org/en-US/docs/Web/API/File) API, e.g. those uploaded via an HTML <input> element, is also supported

```javascript
var uploader = document.getElementsByClassName('my-uploader')[0];

function stopBubbledEvent(e) {
  e.stopPropagation()
  e.preventDefault()
}

function loadNewAudioFile(e) {
  stopBubbledEvent(e)
  PlayerFactory.forFile(e.dataTransfer.files[0])
    .then(player => player.toMaster().play())
}

uploader.addEventListener('dragover', stopBubbledEvent, false)
uploader.addEventListener('drop', loadNewAudioFile, false)
```
## Manage your own buffers

If you want to load a player from an AudioBuffer that you are managing

```javascript
PlayerFactory.withBuffer(buffer).then(player => { player.toMaster().play() })
```


## Runtime sample loading

A player's loaded sample can be changed at runtime, using either a URL, an uploaded File, or an AudioBuffer as a source

```javascript
// all load functions are promise based
player.loadResource(url).then(player => player.play())
player.loadFile(file).then(player => player.play())
player.setBuffer(buffer).then(player => player.play())
```
