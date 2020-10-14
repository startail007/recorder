import "bootstrap/dist/css/bootstrap.css";
import "material-design-icons/iconfont/material-icons.css";
import Vue from "vue";
import App from "@vue/App";
const app = new Vue({
  el: "#app",
  render: (h) => h(App),
});

/*navigator.getUserMedia(
    { video: false, audio: true },
    (stream) => {
      var audioCtx = new AudioContext();
      var source = audioCtx.createMediaStreamSource(stream);

      var biquadFilter = audioCtx.createBiquadFilter();
      biquadFilter.type = "lowshelf";
      //biquadFilter.frequency.value = 1000;
      //biquadFilter.gain.value = 10;

      source.connect(biquadFilter);
      //biquadFilter.connect(audioCtx.destination);

      const processor = audioCtx.createScriptProcessor(256, 1, 1);
      processor.addEventListener("audioprocess", (e) => {
        //console.log("asdasd");
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          output[i] = input[i];
        }
        //received.textContent = input;
        //console.log(output);
      });

      biquadFilter.connect(processor);
      processor.connect(audioCtx.destination);
      
      console.log("開啟成功");
    },
    (error) => {
      console.log("錯誤", error);
    }
  );*/
