//const app = getApp();
const account = require('../../manager/accountManager.js');
//import { baseSocketUrl } from "../../network/apiService.js";
import { GameControl } from "../../manager/gameControl.js";
import { SocketManager } from "../../manager/socketManager.js";

//var orderPlayerList = {};
var imPlayer = {}
var showMatchFinish = false;
var otherPlayer = {};
var isSocketInit = false;
//var gameControl;
//var isUnLoaded = false;

Page({
  data: {
    imPlayer: {},
    otherPlayer: {}
  },

  onLoad(options) {
    //isUnLoaded = false;
    //this.gameControl = new GameControl();
    console.log("onLoad");
    console.log("account.userInfo:" + account.userInfo());

    this.setData({
      imPlayer: account.userInfo(),
    });

    this.initSocket();

  },//end onLoad

  initSocket: function () {
    const that = this;
    var socketListener = function (res) {
      // if (isUnLoaded)
      //   return;
      console.log("res.cmd in gameMatching:" + res.cmd);
      if (res.cmd && res.senderId != account.userId()) {
        switch (res.cmd) {
          case "RSP_CREATE_ROOM_RESPONSE":
            break
          case "RSP_JOIN_ROOM_RESPONSE":
            break;
          case 'RSP_GAME_DATA_INIT':
            var playerList = res.data.users;
            if (playerList != null && playerList.length > 0) {
              for (let i = 0; i < playerList.length; i++) {
                if (account.userInfo().id != playerList[i].id)
                  otherPlayer = playerList[i];
              }
            }
            my.setStorageSync({
              key: 'gameInitData',
              data: res.data
            });
            showMatchFinish = true;
            that.setData({
              showMatchFinish: showMatchFinish,
              otherPlayer: otherPlayer
            });
            setTimeout(() => {
              //关掉当前界面，跳到对战
              //!!!因为gameInitData里有可能带?这样的字段，所以不能用url传参方式!!!!
              //!!!!!!!用 redirectTo 可以除去本页websocket的回调(页面关闭,websocket也关了)!!!!!!!!
              //通过 navigateTo 不会走onUnload
              //my.navigateTo({ url: "../starFight/starFight" });
              my.redirectTo({ url: "../starFight/starFight" });
            }, 1500);
            SocketManager.getInstance().unsubscribeSocket(that.socketListener);
            break;
          case 'RSP_GAME_RESULT'://比赛结果
            new GameControl().handlerGameComeInAgain(res.data, false);
            SocketManager.getInstance().unsubscribeSocket(socketListener);
            break;
          default: break
        }
      }
    }//end socketListener

    //var socket = SocketManager.getInstance().getSocket();
    //websocket应该是根据页面的
    SocketManager.getInstance().subscribeSocket(socketListener);
    SocketManager.getInstance().sendMessage({
      senderId: account.userId(),
      cmd: 'CMD_MATCHING'
    });
    this.socketListener = socketListener;
    //this.socket = socket;
  },

  onShow() {
  },

  onUnload() {
    //isUnLoaded = true;
    SocketManager.getInstance().unsubscribeSocket(this.socketListener);
    //SocketManager.getInstance().closeSocket(true);
  },//end onUnload
}
);