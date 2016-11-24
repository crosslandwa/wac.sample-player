'use strict'

const EventEmitter = require('events')
const util = require('util')
const unityGain = { toAbsolute: function () { return 1 } }

function SamplePlayer (assetUrl, audioContext, onLoad) {
  EventEmitter.call(this)
  let player = this
  let _loaded = false
  let _buffer
  let _voices = []
  let _playbackRate = 1
  let _gainNode = audioContext.createGain()

  function timeNow () {
    return audioContext.currentTime
  }

  function stoppedAction () {
    _voices.shift()
    if (!player.isPlaying()) player.emit('stopped')
  }

  this._assetUrl = assetUrl

  this.connect = _gainNode.connect.bind(_gainNode)

  this.disconnect = _gainNode.disconnect.bind(_gainNode)

  this.toMaster = function () {
    player.disconnect()
    player.connect(audioContext.destination)
    return player
  }

  this.isPlaying = function () { return _voices.length > 0 }

  this.play = function (gain) {
    if (!_loaded) { console.log(assetUrl + ' not loaded yet...'); return }

    let now = timeNow()
    let startTime = now
    let _gain = (gain && (typeof gain.toAbsolute === 'function')) ? gain : unityGain

    if (player.isPlaying()) {
      anchor(_gainNode.gain, now)
      startTime = now + 0.01
      _gainNode.gain.linearRampToValueAtTime(0, startTime)
      player.emit('stopped')
    } else {
      _gainNode.gain.setValueAtTime(0, startTime)
    }

    var source = audioContext.createBufferSource()
    source.connect(_gainNode)

    _gainNode.gain.linearRampToValueAtTime(_gain.toAbsolute(), startTime)
    source.playbackRate.value = _playbackRate
    source.buffer = _buffer

    source.addEventListener('ended', stoppedAction)

    _voices.push(source)
    source.start(startTime)
    player.emit('started', _gain)
  }

  this.updatePlaybackRate = function (rate) {
    _playbackRate = rate
    var now = timeNow()
    _voices.forEach((source) => {
      source.playbackRate.setValueAtTime(_playbackRate, now)
    })
  }

  loadSample(assetUrl, audioContext, (buffer) => {
    _buffer = buffer
    _loaded = true
    if (typeof onLoad === 'function') {
      onLoad(player)
    }
  })
}
util.inherits(SamplePlayer, EventEmitter)

function loadSample (assetUrl, audioContext, done) {
  var request = new XMLHttpRequest()
  request.open('GET', assetUrl, true)
  request.responseType = 'arraybuffer'
  request.onload = function () {
    audioContext.decodeAudioData(request.response, done)
  }
  request.send()
}

function anchor (audioParam, now) {
  audioParam.cancelScheduledValues(now)
  audioParam.setValueAtTime(audioParam.value, now)
}

module.exports = SamplePlayer
