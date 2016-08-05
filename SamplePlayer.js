'use strict'

const EventEmitter = require('events'),
    util = require('util');

function SamplePlayer(assetUrl, audioContext) {
    EventEmitter.call(this);
    let player = this,
        _loaded = false,
        _buffer,
        _voices = [],
        _playbackRate = 1,
        _gainNode = audioContext.createGain();

    this._assetUrl = assetUrl;

    this.connect = _gainNode.connect.bind(_gainNode);

    this.disconnect = _gainNode.disconnect.bind(_gainNode);

    this.toMaster = function() {
        player.disconnect();
        player.connect(audioContext.destination);
        return player;
    }

    this.isPlaying = function() {
        return _voices.length > 0;
    }

    this.play = function(gain) {
        if (!_loaded) return;

        var now = timeNow(audioContext),
            startTime = now,
            _gain = (gain && (typeof gain.toAbsolute === 'function')) ? gain : { toAbsolute: function() { return 1 } };

        if (player.isPlaying()) {
            _gainNode.gain.cancelScheduledValues(now);
            anchor(_gainNode.gain, now);
            _gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
            startTime = now + 0.01;
            player.emit('stopped');
        }

        var source = audioContext.createBufferSource();
        source.connect(_gainNode);

        _gainNode.gain.setValueAtTime(0, startTime);
        _gainNode.gain.linearRampToValueAtTime(_gain.toAbsolute(), startTime + 0.01);

        source.playbackRate.setValueAtTime(_playbackRate, startTime);
        source.buffer = _buffer;

        source.addEventListener('ended', () => {
            _voices.shift();
            if (!player.isPlaying()) player.emit('stopped');
        });

        _voices.push(source);
        source.start(startTime);
        player.emit('started', _gain);
    }

    this.updatePlaybackRate = function(rate) {
        _playbackRate = rate;
        var now = timeNow(audioContext);
        _voices.forEach((source) => {
            source.playbackRate.setValueAtTime(_playbackRate, now);
        });
    }

    loadSample(assetUrl, audioContext, (buffer) => {
        _buffer = buffer;
        _loaded = true;
    });
}
util.inherits(SamplePlayer, EventEmitter);

function loadSample(assetUrl, audioContext, done) {
    var request = new XMLHttpRequest();
    request.open('GET', assetUrl, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        audioContext.decodeAudioData(request.response, done);
    }
    request.send();
}

function anchor(audioParam, now) {
    audioParam.setValueAtTime(audioParam.value, now);
}

function timeNow(audioContext) {
    return audioContext.currentTime;
}

module.exports = SamplePlayer;
