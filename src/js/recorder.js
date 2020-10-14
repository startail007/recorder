class Recorder {
  constructor(stream) {
    this.audio = new Audio();
    if ("srcObject" in this.audio) {
      this.audio.srcObject = stream;
    } else {
      this.audio.src = window.URL.createObjectURL(stream);
    }
    this.mediaRecorder = new MediaRecorder(this.audio.captureStream());
    this.recorderData = [];
    this.mediaRecorder.addEventListener("dataavailable", this.ev_dataavailable.bind(this));
  }
  ev_dataavailable(ev) {
    this.recorderData.push(ev.data);
  }
  get state() {
    return this.mediaRecorder.state;
  }
  reset() {
    this.recorderData = [];
  }
  record(slice) {
    this.audio.play();
    this.mediaRecorder.start(slice);
  }
  cancel() {
    this.audio.pause();
    this.mediaRecorder.stop();
  }
  save() {
    return new Promise((resolve, reject) => {
      const ev_stop = () => {
        if (this.recorderData) {
          resolve(this.recorderData);
        }
        this.mediaRecorder.removeEventListener("stop", ev_stop);
      };
      this.mediaRecorder.addEventListener("stop", ev_stop);
      this.audio.pause();
      this.mediaRecorder.stop();
    });
  }
  remove() {
    this.mediaRecorder.removeEventListener("dataavailable", this.ev_dataavailable);
  }
}

export default Recorder;
