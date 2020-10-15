<template>
  <div class="wrap" :class="{ running: running }">
    <div class="navbar shadow-sm px-0">
      <div class="container justify-content-start align-items-center">
        <div class="title">錄音紀錄</div>
        <div class="flex-1"></div>
        <div class="d-flex align-items-center">
          <template v-if="signInState">
            <div class="user d-flex align-items-center" tabindex="1">
              <div class="userImg" :style="{ backgroundImage: userData.imgSrc }"></div>
              <div class="menu">
                <div class="menuPos">
                  <div class="menuCard d-inline-flex flex-column align-items-center p-4">
                    <div class="userImg" :style="{ backgroundImage: userData.imgSrc }"></div>
                    <div class="userName mt-2">{{ userData.name }}</div>
                    <div class="btn btn-outline-primary btn-sm waves_effect mt-4" @click="btnSignOut_click">
                      登出
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="btn btn-outline-primary btn-sm waves_effect" @click="btnSignIn_click">
              登入
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="container">
      <template v-if="signInState">
        <div class="d-flex my-4 align-items-center">
          <div class="btn btn-danger waves_effect" @click="btnRecorder_click">
            <i class="material-icons align-middle">keyboard_voice </i>
            {{ recorderBool ? "停止錄音" : "開始錄音" }}
          </div>
          <div class="uploading ml-2" v-if="uploading">上傳...</div>
        </div>
        <div class="items mt-4">
          <div
            v-for="item in messages"
            :key="item.id"
            class="item d-flex justify-content-start py-2 align-items-center"
            :class="{ active: item.id === currentPlayId }"
            :title="formatDate(item.data.time)"
            v-if="item.data.time != null"
          >
            <template v-if="item.id === currentPlayId">
              <div class="control">
                <div class="btnPlay btn btn-dark btn-sm waves_effect" @click="btnPlay_click(item.id, item)">
                  <i class="material-icons align-middle">{{ playing ? "pause" : "play_arrow" }}</i>
                </div>
              </div>
              <div class="duration mx-2">{{ formatTime(Math.floor(currentTime)) }}</div>
              <div class="other">
                <progress class="progress" max="1" :value="item.data.duration ? currentTime / item.data.duration : 0">
                  <span>0</span>%
                </progress>
              </div>
            </template>
            <template v-else>
              <div class="control">
                <div class="btnPlay btn btn-dark btn-sm waves_effect" @click="btnPlay_click(item.id, item)">
                  <i class="material-icons align-middle">play_arrow</i>
                </div>
              </div>
              <div class="duration mx-2">{{ formatTime(Math.floor(item.data.duration)) }}</div>
              <div class="flex-1"></div>
            </template>
            <div class="edit">
              <div class="btnDel btn btn-sm" @click="btnDel_click(item.id, item)">
                <i class="material-icons align-middle">delete</i>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import getBlobDuration from "get-blob-duration";
import Recorder from "recorder-js";
const firebaseConfig = {
  apiKey: "AIzaSyB5vZ8duvVnJowTvmiSSvyLyY2TOMtc-6g",
  authDomain: "chat-292208.firebaseapp.com",
  databaseURL: "https://chat-292208.firebaseio.com",
  projectId: "chat-292208",
  storageBucket: "chat-292208.appspot.com",
  //messagingSenderId: "344268651055",
  //appId: "1:344268651055:web:dfd0bdd9f0e3b70f45a4da",
  //measurementId: "G-5V70GE0KE1",
};
firebase.initializeApp(firebaseConfig);
//firebase.analytics();
const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
const fieldValue = firebase.firestore.FieldValue;
//console.log(firestore);
const timeFillZero = (val) => {
  return (val < 10 ? "0" : "") + val;
};
export default {
  name: "app",
  data() {
    return {
      running: false, //正在執行
      signInState: false, //使用者登入狀態
      userData: {
        name: "",
        imgSrc: "",
        email: "",
      }, //使用者資訊
      messagesPath: "", //firebase messages路徑
      audiosPath: "", //firebase audios路徑
      messages: [], //訊息
      unSnapshot: null, //取消偵測訊息事件
      mediaStreamObj: null, //麥克風串流物件
      recorderBool: false, //錄音狀態
      playAudio: null, //播放音樂
      currentPlayId: null, //目前播放ID
      currentTime: 0, //目前播放時間
      playing: false, //是否播放
      uploading: false, //是否正在上傳
    };
  },
  watch: {},
  mounted() {
    this.playAudio = new Audio();
    this.playAudio.addEventListener("timeupdate", (ev) => {
      this.currentTime = this.playAudio.currentTime;
    });
    this.playAudio.addEventListener("play", (ev) => {
      this.playing = true;
    });
    this.playAudio.addEventListener("pause", (ev) => {
      this.playing = false;
    });
    this.playAudio.addEventListener("ended", (ev) => {
      //this.currentTime = 0;
      this.playing = false;
    });

    //let unSnapshot;
    auth.onAuthStateChanged((user) => {
      this.signInState = user ? true : false;
      if (user) {
        this.signIn(user);
      } else {
        this.signOut();
      }
    });
    const click = (ev) => {
      for (let i = 0; i < ev.path.length; i++) {
        const el = ev.path[i];
        if (el.classList && el.classList.contains("waves_effect")) {
          const second = 1;
          const wave_item = document.createElement("div");
          wave_item.classList.add("wave_item");
          wave_item.style["animation-duration"] = second + "s";
          const rect = el.getBoundingClientRect();
          wave_item.style["left"] = ev.x - rect.left + "px";
          wave_item.style["top"] = ev.y - rect.top + "px";
          el.appendChild(wave_item);
          setInterval(() => {
            wave_item.remove();
          }, second * 1000 + 100);
          break;
        }
      }
    };
    window.addEventListener("click", click);
  },
  methods: {
    signIn(user) {
      this.userData.email = user.email;
      this.userData.name = user.displayName;
      this.userData.imgSrc = `url(${user.photoURL})`;

      this.messagesPath = `recorder/${this.userData.email}/messages`;
      this.audiosPath = `recorder/${this.userData.email}/audios`;
      this.unSnapshot = firestore
        .collection(this.messagesPath)
        .where("time", "!=", null)
        .orderBy("time", "asc")
        .onSnapshot((querySnapshot) => {
          this.messages = [];
          querySnapshot.forEach((doc) => {
            this.messages.push({ id: doc.id, data: doc.data() });
          });
        });
    },
    signOut() {
      this.userData.email = "";
      this.userData.name = "";
      this.userData.imgSrc = "";

      this.cancelPlayAudio();
      if (this.unSnapshot) {
        this.unSnapshot();
        this.unSnapshot = null;
      }
      this.messagesPath = "";
      this.audiosPath = "";
      this.messages = [];
      this.mediaStreamObj = null;
      this.recorderBool = false;
    },
    btnSignIn_click() {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope("profile");
      //provider.addScope("email");
      //provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
      auth.signInWithPopup(provider);
    },
    btnSignOut_click() {
      auth.signOut();
    },
    async btnRecorder_click(ev) {
      if (!this.recorderBool && !this.uploading) {
        const currentTarget = ev.currentTarget;
        this.cancelPlayAudio();
        try {
          if (navigator.mediaDevices) {
            this.mediaStreamObj = await navigator.mediaDevices.getUserMedia({ audio: true });
          } else {
            alert("此裝置不支援麥克風");
          }
        } catch (error) {
          alert("必需啟用麥克風");
        }
        if (this.mediaStreamObj) {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const recorder = new Recorder(audioContext);
            recorder.init(this.mediaStreamObj);
            recorder.start();
            const click = async (ev) => {
              let target = ev.target;
              let save = false;
              while (target) {
                if (target === currentTarget) {
                  save = true;
                  break;
                }
                target = target.parentElement;
              }
              document.body.removeEventListener("click", click);
              if (save) {
                this.uploading = true;
                const { blob, buffer } = await recorder.stop();
                const mp3Blob = new Blob([blob], { type: "audio/mp3" });
                await this.saveData(mp3Blob);
              } else {
                recorder.stop();
              }
              this.uploading = false;
              this.recorderBool = false;
              this.mediaStreamObj.getTracks().forEach((track) => track.stop());
              this.mediaStreamObj = null;
            };
            setTimeout(() => document.body.addEventListener("click", click));
            this.recorderBool = true;
          } catch (error) {
            alert("不支援");
          }
        }
      }
    },
    async btnPlay_click(id, item) {
      if (this.currentPlayId != id) {
        this.currentPlayId = "";
        this.currentTime = 0;
        this.playAudio.pause();
        const audioURL = await storage.ref(`${this.audiosPath}/${id}`).getDownloadURL();
        this.playAudio.src = audioURL;
        this.playAudio.load();
        this.playAudio.play();
        this.currentPlayId = id;
      } else {
        if (this.playAudio.paused) {
          this.playAudio.play();
        } else {
          this.playAudio.pause();
        }
      }
    },
    btnDel_click(id) {
      if (confirm("確定刪除嗎？")) {
        this.delData(id);
      }
    },
    saveData(data) {
      return new Promise(async (resolve, reject) => {
        const duration = await getBlobDuration(data);
        //將資料儲存到firebase
        const doc = firestore.collection(this.messagesPath).doc();
        const res = await storage.ref(`${this.audiosPath}/${doc.id}`).put(data);
        doc.set({ duration: duration, time: fieldValue.serverTimestamp() });
        resolve(doc.id);
      });
    },
    delData(id) {
      this.cancelPlayAudio();
      //將資料從firebase刪除
      firestore
        .collection(this.messagesPath)
        .doc(id)
        .delete();
      storage.ref(`${this.audiosPath}/${id}`).delete();
    },
    formatTime: function(time) {
      var temp = Math.ceil(time);
      var m = Math.floor(temp / 60);
      m = timeFillZero(m);
      var s = Math.floor(temp % 60);
      s = timeFillZero(s);
      return m + ":" + s;
    },
    formatDate: function(date) {
      const date0 = new Date(date.seconds * 1000);
      return `${date0.getFullYear()}/${timeFillZero(date0.getMonth() + 1)}/${timeFillZero(
        date0.getDate()
      )} ${timeFillZero(date0.getHours())}:${timeFillZero(date0.getMinutes())}`;
    },
    cancelPlayAudio() {
      if (this.playAudio.src) {
        this.playAudio.pause();
        this.currentPlayId = "";
        this.currentTime = 0;
        this.playAudio.src = "";
      }
    },
  },
  computed: {},
};
</script>
<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap");
* {
  font-family: "Noto Sans TC", var(--font-family-sans-serif);
}
body {
  margin: 0;
  min-height: 100vh;
}
.flex-1 {
  flex: 1;
}
@keyframes wave_item_a {
  0% {
    width: 0px;
    height: 0px;
    opacity: 1;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}
.waves_effect {
  position: relative;
  overflow: hidden;
  .wave_item {
    position: absolute;
    display: block;
    width: 0px;
    height: 0px;
    border-radius: 200px;
    background-color: rgba(255, 255, 255, 0.25);
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    animation-name: wave_item_a;
  }
}
</style>
<style lang="scss" scoped>
.wrap.running {
  pointer-events: none;
}
.navbar {
  position: sticky;
  top: 0px;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  z-index: 999;
  .title {
    font-size: 1.5rem;
  }
}
.uploading {
  color: red;
}
.user {
  position: relative;
  outline: none;

  .userImg {
    position: relative;
    display: block;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  &:focus {
    > .userImg {
      border: 1px solid #999;
    }
    .menu {
      display: block;
    }
  }
  > .userImg {
    width: 40px;
    height: 40px;
    border: 1px solid #eee;
    border-radius: 40px;
  }
  .menu {
    position: relative;
    display: none;
    height: 40px;
    .menuPos {
      position: absolute;
      display: block;
      right: 0px;
      top: 100%;
      margin-top: 8px;
      .menuCard {
        position: relative;
        display: block;
        border: 1px solid #ddd;
        min-width: 200px;
        //background-color: rgba(255, 255, 255, 0.5);
        //backdrop-filter: blur(40px);
        background-color: #fff;
        filter: drop-shadow(0 0.125rem 0.25rem rgba(0, 0, 0, 0.075));
        //width: 400px;
        > .userImg {
          width: 80px;
          height: 80px;
          border-radius: 10px;
        }
        &::before {
          content: "";
          position: absolute;
          display: block;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 12px 6px 12px;
          border-color: transparent transparent #ddd transparent;
          right: 8px;
          top: -6px;
        }
        &::after {
          content: "";
          position: absolute;
          display: block;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 10px 5px 10px;
          border-color: transparent transparent #ffffff transparent;
          right: 10px;
          top: -5px;
        }
      }
    }
  }
}

.item {
  border-top: 1px solid rgb(233, 233, 233);
  &:first-child {
    border-top: none;
  }
  &.active {
    background-color: #f3f3f3;
    .duration {
      color: #f00;
    }
  }

  .control {
    .btnPlay {
      cursor: pointer;
      margin: 0 5px;
    }
  }
  .duration {
    width: 3em;
    text-align: right;
  }
  .edit {
    .btnDel {
      color: #d43333;
      &:hover {
        color: #ec1919;
        text-shadow: 0 0 5px rgba(236, 24, 24, 0.25);
      }
    }
  }
  .other {
    flex: 1;
    .progress {
      width: 100%;
      &::-webkit-progress-value {
        //background-color: rgb(45, 115, 226);
        background-image: -webkit-linear-gradient(
            -45deg,
            transparent 33%,
            rgba(0, 0, 0, 0.1) 33%,
            rgba(0, 0, 0, 0.1) 66%,
            transparent 66%
          ),
          -webkit-linear-gradient(top, rgba(255, 255, 255, 0.25), rgba(0, 0, 0, 0.25)),
          -webkit-linear-gradient(left, rgb(0, 95, 204), rgb(68, 255, 246));

        border-radius: 2px;
        background-size: 35px 20px, 100% 100%, 100% 100%;
        box-shadow: 0 1px 2.5px rgba(0, 0, 0, 0.25) inset, 0 2px 5px rgba(0, 0, 0, 0.25);
      }
      &::-webkit-progress-bar {
        background-color: #eee;
        border-radius: 2px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
      }
      //progress::-webkit-progress-value {background-color: #aaa !important;}
    }
  }
}
</style>
