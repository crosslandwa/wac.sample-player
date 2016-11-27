'use strict'

const EventEmitter = require('events')
const util = require('util')
const unityGain = { toAbsolute: () => 1 }
const SampleLoading = require('./src/SampleLoading.js')

function SamplePlayer (buffer, sampleFactory, audioContext) {
  EventEmitter.call(this)
  let player = this
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

  this.connect = _gainNode.connect.bind(_gainNode)

  this.disconnect = _gainNode.disconnect.bind(_gainNode)

  this.toMaster = function () {
    player.disconnect()
    player.connect(audioContext.destination)
    return player
  }

  this.isPlaying = function () { return _voices.length > 0 }

  this.play = function (gain) {
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
    source.buffer = buffer

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

  function loadNewSample (load, source) {
    return new Promise(resolve => load(source, resolve)).then((newBuffer) => {
      buffer = newBuffer
      return player
    })
  }

  this.loadFile = file => loadNewSample(sampleFactory.loadSampleFromFile, file)

  this.loadResource = url => loadNewSample(sampleFactory.loadRemoteSample, url)
}
util.inherits(SamplePlayer, EventEmitter)

function anchor (audioParam, now) {
  audioParam.cancelScheduledValues(now)
  audioParam.setValueAtTime(audioParam.value, now)
}

function SamplePlayerFactory (audioContext) {
  let sampleFactory = SampleLoading(audioContext)

  function loadPlayer (load, source) {
    return new Promise(resolve => load(source, resolve))
      .then(buffer => new SamplePlayer(buffer, sampleFactory, audioContext))
  }

  this.forResource = url => loadPlayer(sampleFactory.loadRemoteSample, url)

  this.forFile = file => loadPlayer(sampleFactory.loadSampleFromFile, file)
}

module.exports = (audioContext) => new SamplePlayerFactory(audioContext)
