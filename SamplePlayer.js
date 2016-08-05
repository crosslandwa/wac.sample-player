'use strict'

const EventEmitter = require('events'),
    util = require('util');

function SamplePlayer(asset_url, audio_context) {
    EventEmitter.call(this);
    let player = this,
        _loaded = false,
        _buffer,
        _voices = [],
        _filter_node = audio_context.createBiquadFilter(),
        _gain_node = audio_context.createGain();

    _gain_node.connect(_filter_node);
    _filter_node.connect(audio_context.destination);

    this.is_playing = function() {
        return _voices.length > 0;
    }

    this.play = function(velocity, cutoff_frequency) {
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

        _filter_node.frequency.value = cutoff_frequency > 30 ? cutoff_frequency : 30;
        var source = audio_context.createBufferSource();

        source.connect(_gain_node);

        _gain_node.gain.setValueAtTime(0, start_time);
        _gain_node.gain.linearRampToValueAtTime(velocity / 127, start_time + 0.01);

        source.playbackRate.setValueAtTime(player._playback_rate, start_time);
        source.buffer = _buffer;

        source.addEventListener('ended', () => {
            _voices.shift();
            if (!player.is_playing()) player.emit('stopped');
        });

        _voices.push(source);
        source.start(start_time);
        player.emit('started', velocity);
    }

    this.update_playback_rate = function(rate) {
        player._playback_rate = rate;
        var now = time_now(audio_context);
        _voices.forEach((source) => {
            source.playbackRate.setValueAtTime(player._playback_rate, now);
        });
    }

    this._playback_rate = 1;
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

function play(player, audio_context, velocity, cutoff_frequency) {

}

function anchor(audio_param, now) {
    audio_param.setValueAtTime(audio_param.value, now);
}

function time_now(audio_context) {
    return audio_context.currentTime;
}

module.exports = SamplePlayer;
