function loadSampleFromFile (file, audioContext, done) {
  let fileReader = new FileReader()
  fileReader.onload = function (e) {
    audioContext.decodeAudioData(e.target.result, done)
  }
  fileReader.readAsArrayBuffer(file)
}

function loadRemoteSample (assetUrl, audioContext, done) {
  var request = new XMLHttpRequest()
  request.open('GET', assetUrl, true)
  request.responseType = 'arraybuffer'
  request.onload = function () {
    audioContext.decodeAudioData(request.response, done)
  }
  request.send()
}

function SampleFactory (audioContext) {
  this.loadSampleFromFile = function (file, done) {
    loadSampleFromFile(file, audioContext, done)
  }

  this.loadRemoteSample = function (url, done) {
    loadRemoteSample(url, audioContext, done)
  }
}

module.exports = (audioContext) => new SampleFactory(audioContext)
