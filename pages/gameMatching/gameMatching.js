//const app = getApp();
const account = require('../../manager/accountManager.js');
//import { baseSocketUrl } from "../../network/apiService.js";
//import { GameControl } from "../../manager/gameControl.js";
//import { SocketManager } from "../../manager/socketManager.js";

const gameInterface = require('../../interfaces/gameInterface.js');
const GameInterfaceImpl = require('../../interfaces/gameInterfaceImpl.js');

//var orderPlayerList = {};
var imPlayer = {}
var showMatchFinish = false;
var otherPlayer = {};
var isSocketInit = false;
var gameInterfaceImpl;
//var gameControl;
//var isUnLoaded = false;

Page({
  data: {
    imPlayer: {},
    otherPlayer: {}
  },


  /**
* 接口的初始化与使用
*/
  initInterface: function () {
    //接口的实现
    gameInterfaceImpl = new GameInterfaceImpl();
    //使用先前执行接口检测
    gameInterface.checkImpl(gameInterfaceImpl);
  },

  onLoad(options) {
    this.initInterface();
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
          case "RSP_GAME_INFO":
            otherPlayer = gameInterfaceImpl.showOtherPlayerInfo(res.data);
            my.setStorageSync({
              key: 'gameInfoData',
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
            //SocketManager.getInstance().unsubscribeSocket(that.socketListener);
            gameInterfaceImpl.unSubscribeSocket(that.socketListener);
            break;
          default: break
        }
      }
    }//end socketListener

    //websocket是根据页面的
    gameInterfaceImpl.subscribeSocket(socketListener);
    gameInterfaceImpl.matching(account.userId());
    this.socketListener = socketListener;
  },

  onShow() {
  },

  onUnload() {
    //SocketManager.getInstance().unsubscribeSocket(this.socketListener);
    gameInterfaceImpl.unSubscribeSocket(this.socketListener);
  },
}
);