const app = getApp();
//import { SocketHelper } from '../../network/SocketHelper.js'
const account = require('../../manager/accountManager.js');
//import { baseSocketUrl } from "../../network/apiService.js";
import { SocketManager } from "../../manager/socketManager.js";
import { GameControl } from "../../manager/gameControl.js";

const gameInterface = require('../../interfaces/gameInterface.js');
const GameInterfaceImpl = require('../../interfaces/gameInterfaceImpl.js');

//var orderPlayerList = {};
var imPlayer = {}
var showMatchFinish = false;
var otherPlayer = {};
var gameInterfaceImpl;
//对战房间对像信息
// room: {
//   id: 162,
//   type: 1,
//   maxGameRound: 3,
//   currentGameRound: 0
//   }
//var roomObject = {};
var roomId = -1;

Page({
  data: {
    imPlayer: {},
    otherPlayer: {},
    //roomObject: {},
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

  //onLoad()->onShow()

  onShow() {
    console.log("share onShow, roomId:" + roomId);
    if (roomId <= 0) {
      my.redirectTo({ url: "../options/options" });
      return;
    }
  },

  onLoad(options) {
    // if (options.roomObject == null) {
    //   my.redirectTo({ url: "../options/options" });
    //   return;
    // }

    roomId = options.roomId;
    if (roomId == undefined)
      roomId = -1;

    console.log("options.roomId:" + options.roomId);

    if (options.roomId <= 0) {
      my.redirectTo({ url: "../options/options" });
      return;
    }
    this.initInterface();
    var that = this;
    console.log("share onLoad");
    //roomObject = JSON.parse(options.roomObject);
    console.log("roomId:" + roomId);


    if (!account.isLogin()) {
      console.info("loggin...");
      my.showLoading({
        content: '登录中...',
      });
      app.getUserInfo().then(
        user => {
          this.setData({ user, })
          ///登录我们后台
          let authCode = my.getStorageSync({ key: 'authcode' }).data;
          console.log("authCode:" + authCode);

          let loginCallback = {
            success() {
              console.info("loginCallback success");
              my.showToast({
                type: 'success',
                content: '登录成功',
                duration: 1000,
              });
              my.hideLoading();
              that.initWebSocket();
              console.log("account.userInfo.name:" + account.userInfo().name);
              that.setData({
                imPlayer: account.userInfo(),
              });
            },
            fail() {
              console.info("loginCallback fail");
              my.hideLoading();
              my.showToast({
                type: 'fail',
                content: '登录失败',
                duration: 1000,
              });
            }
          };
          account.loginServer(loginCallback, authCode);
        },
      );
    } else {
      console.info("had login");
      this.initWebSocket();
      that.setData({
        imPlayer: account.userInfo(),
      });
    }
  },//end onLoad

  initWebSocket: function () {
    const that = this;
    // var roomObjectData = {};
    // var gameInitData = {};
    var socketListener = function (res) {
      console.log("res.cmd:" + res.cmd);
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

            let roomType = res.data.type;
            setTimeout(() => {
              //关掉当前界面，跳到对战
              //还要加上判断，指示一张卡还是三张卡的
              //my.redirectTo({ url: "../starFight/starFight" });
              //navigateTo
              // 房间类型：1逐张出牌，2顺序出牌
              //if (roomObject.type == 1)
              if (new GameControl().isPlaySingleCard(roomType))
                that.jumpToSingle();
              else
                that.jumpToThree();
            }, 1500);
            SocketManager.getInstance().unsubscribeSocket(socketListener);
            roomId = -1;//用于返回这里时作判断，不知何解用了redirectTo跳转后返回，还是到此页!
            //SocketManager.getInstance().closeSocket();
            break;
          default: break
        }
      }
    }//end socketListener

    //打开share有两种情况:
    //1.用户点了别人分享出来的link进入,socket可能没建立的
    //2.我分享给别人的，这时我是从option进来的，这时socket可能建立成功了
    //所以这里要作为判断,并且share不要用redirectTo关掉
    if (SocketManager.getInstance().isConnected()) {
      SocketManager.getInstance().subscribeSocket(socketListener);
      SocketManager.getInstance().sendMessage({
        senderId: account.userId(),
        //roomId: roomObject.id,
        roomId: roomId,
        cmd: 'CMD_JOIN_GAME'//2018-6-22修改，用户好友对战加入房间
      })
      console.log("isConnected() and sent CMD_JOIN_GAME in share");
    }
    this.socketListener = socketListener;
  },

  cancel: function () {
    my.redirectTo({ url: "../options/options" });
  },

  jumpToSingle: function () {
    my.redirectTo({ url: "../starFightOneCard/starFightOneCard" });
  },

  jumpToThree: function () {
    my.redirectTo({ url: "../starFight/starFight" });
  },

  onUnload: function () {
  },//end onUnload
}
);