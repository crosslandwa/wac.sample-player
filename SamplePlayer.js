'use strict'

const EventEmitter = require('events'),
    util = require('util');

function SamplePlayer(asset_url, audio_context) {
    EventEmitter.call(this);
    let player = this,
        _loaded = false,
        _buffer,
        _voices = [],
        _playback_rate = 1,
        _gain_node = audio_context.createGain();

    this._asset_url = asset_url;

    this.connect = _gain_node.connect.bind(_gain_node);

    this.disconnect = _gain_node.disconnect.bind(_gain_node);

    this.to_master = function() {
        player.disconnect();
        player.connect(audio_context.destination);
        return player;
    }

    this.is_playing = function() {
        return _voices.length > 0;
    }

    this.play = function(gain) {
        if (!_loaded) return;

        var now = time_now(audio_context),
            start_time = now;

        if (player.is_playing()) {
            _gain_node.gain.cancelScheduledValues(now);
            anchor(_gain_node.gain, now);
            _gain_node.gain.linearRampToValueAtTime(0, now + 0.01);
            start_time = now + 0.01;
            player.emit('stopped');
        }

        var source = audio_context.createBufferSource();

        source.connect(_gain_node);

        _gain_node.gain.setValueAtTime(0, start_time);
        _gain_node.gain.linearRampToValueAtTime(gain.toAbsolute(), start_time + 0.01);

        source.playbackRate.setValueAtTime(_playback_rate, start_time);
        source.buffer = _buffer;

        source.addEventListener('ended', () => {
            _voices.shift();
            if (!player.is_playing()) player.emit('stopped');
        });

        _voices.push(source);
        source.start(start_time);
        player.emit('started', gain);
    }

    this.update_playback_rate = function(rate) {
        _playback_rate = rate;
        var now = time_now(audio_context);
        _voices.forEach((source) => {
            source.playbackRate.setValueAtTime(_playback_rate, now);
        });
    }

    loadSample(asset_url, audio_context, (buffer) => {
        _buffer = buffer;
        _loaded = true;
    });
}
util.inherits(SamplePlayer, EventEmitter);

function loadSample(asset_url, audio_context, done) {
    var request = new XMLHttpRequest();
    request.open('GET', asset_url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
        audio_context.decodeAudioData(request.response, done);
    }
    request.send();
}

function anchor(audio_param, now) {
    audio_param.setValueAtTime(audio_param.value, now);
}

function time_now(audio_context) {
    return audio_context.currentTime;
}

module.exports = SamplePlayer;
