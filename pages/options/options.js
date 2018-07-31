/**
 * 2018-6-22添加改动 by johnny
  在建立 websocket 连接成功或申请加入匹配队列时，如有用户当前的游戏情况，应跳转到相应游戏界面
 */
const app = getApp();
//import {requestLogin} from "../../network/apiService";
const account = require('../../manager/accountManager.js');
import tabBottom from '/components/tabBottom/tabBottom.js';
//import {requestUserInfo} from "../../network/network.js";
import { SocketManager } from "../../manager/socketManager.js";
import { GameControl } from '../../manager/gameControl.js';

//var userInfo;
var socketOpened = false;
//var roomObject = null;
var roomId = -1;
var isBackFormNetworkProblem = false;
var socketListener = null;
var joinRoomType = 0;
var isGaming = false;
var clickPlayGame = false, clickGameMatching = false;

Page({
  ...tabBottom,
  data: {
    tabData: {
      isIphoneX: false
    },
    nickName: '',
    avatar: '',
    gender: 1,
    sUserInfo: {},
    stars: ''
  },

  onLoad(options) {
    try {
      //roomObject = JSON.parse(options.roomObject);
      roomId = options.roomId;
      if (roomId == undefined)
        roomId = -1;
      isBackFormNetworkProblem = options.backFormNetworkProblem;
      console.log("roomId in options:");
      console.log(roomId);
    } catch (e) {
    }

    if (my.getSystemInfoSync().model.indexOf("iPhone10") > -1) {
      this.setData({
        tabData: { isIphoneX: true }
      })
    }

    this.setData({
      nickName: account.userInfo().nickName,
      avatar: account.userInfo().avatar,
      stars: account.userInfo().stars,
      gender: account.userInfo().gender
    })
    //avatar.avatarClick()()
    app.getUserInfo().then(
      user => {
        this.setData({ user, })
      },
    );
  },

  onShow() {
    clickPlayGame = false;
    clickGameMatching = false;
    var that = this;
    //hasOldGameData = false;
    this.initLisener();
    if (isBackFormNetworkProblem) {
      //网络状态如果有变化，通知SocketManager
      my.onNetworkStatusChange(function (res) {
        if (res.isConnected) {
          console.log("res.isConnected");
          socketOpened = true;
          that.connectServer();
          isBackFormNetworkProblem = false;
        }
      });
    } else {
      this.connectServer();
    }
  },

  /**
   * 页面被关闭
   */
  onUnload() {
    //navigateTo跳转不会走onUnload的
    console.log("onUnload");
  },

  /**
   * 检查是否点击好友邀请link进入游戏的
   */
  checkIfPlayByFriendInvite: function () {
    // if (roomObject != null) {
    //   my.navigateTo({ url: '/pages/share/share?roomObject=' + JSON.stringify(roomObject) });
    //   //跳转后要把roomObject设为空
    //   roomObject = null;
    // }
    if (roomId != -1) {
      my.navigateTo({ url: '/pages/share/share?roomId=' + roomId });
      //跳转后要把roomObject设为空
      roomId = -1;
    }
  },

  initLisener: function () {
    socketListener = function (res) {
      if (roomId != -1)////如果是跳转进来的，不用接收socket回凋
        return;
      //if (isUnLoaded) return;
      console.log("res.cmd in options:" + res.cmd);
      //console.log(res.data);
      //信息发送者不是当前本地用户
      if (res.cmd && res.senderId != account.userId()) {
        switch (res.cmd) {
          //<<<< {"code":1,"msg":"操作成功","data":"CMD_ROOM_CHECK","cmd":"RSP_CMD_RECEIVED"}
          case 'RSP_CMD_RECEIVED':
            if (res.data == "CMD_ROOM_CHECK") {
              //1秒后才做判断 
              setTimeout(() => {
                clickPlayGame = false;
                clickGameMatching = false;
                if (!isGaming) {
                  SocketManager.getInstance().unsubscribeSocket(socketListener);
                  if (joinRoomType == 0) {
                    my.navigateTo({ url: '../gameMatching/gameMatching' });
                  } else {
                    my.navigateTo({ url: '../fightTillTheEndOption/fightTillTheEndOption' });
                  }
                } else
                  isGaming = false;
              }, 1000);
            }
            break;
          /*case "RSP_MATCH_QUEUE":
            if (joinRoomType == 0) {
              my.navigateTo({ url: '../gameMatching/gameMatching' });
            } else {
              my.navigateTo({ url: '../fightTillTheEndOption/fightTillTheEndOption' });
            }
            break;*/
          case "RSP_USER_CONFIRM":
            // my.showToast({
            //   type: 'fail',
            //   content: 'RSP_USER_CONFIRM in options',
            //   duration: 5000,
            // });
            break;
          case "RSP_GAME_INFO"://如有对战中的数据，在RSP_CMD_RECEIVED后马上下发RSP_GAME_INFO
            isGaming = true;
            //hasOldGameData = true;
            my.setStorageSync({
              //key: 'gameInitData',
              key: 'gameInfoData',
              data: res.data
            });
            my.setStorageSync({
              key: 'isGaming',//有游戏在进行中
              data: true
            });
            // 房间类型：1逐张出牌，2顺序出牌
            //if (roomObject.type == 1)
            //if (roomType == new GameControl().isPlaySingleCard(roomType)) {
            let gameControl = new GameControl();
            if (gameControl.isPlaySingleCard(res.data.type)) {
              console.log("hasOldGameData is true, jump into starFightOneCard");
              my.navigateTo({ url: "../starFightOneCard/starFightOneCard" });
            } else {
              console.log("hasOldGameData is true, jump into starFight");
              my.navigateTo({ url: "../starFight/starFight" });
            }
            SocketManager.getInstance().unsubscribeSocket(socketListener);
            break;
          /*case 'RSP_GAME_RESULT'://比赛结果
            //hasOldGameData = true;
            //在建立 websocket 连接成功或申请加入匹配队列时，如有用户当前的游戏情况，应跳转到相应游戏界面
            //当刚建立websocket连接成功时，会走这里；"申请加入匹配"会在gameMatching处理
            new GameControl().handlerGameComeInAgain(res.data, true);
            //SocketManager.getInstance().unsubscribeSocket(socketListener);
            break;*/
          default: break
        }
      }
    };
  },

  connectServer: function () {
    var that = this;
    if (!SocketManager.getInstance().isConnected()) {
      clickGameMatching = false
      clickPlayGame = false;
      //!!!!!!!!!!!!2018-7-5,现在每局游戏后，服务器因为数据异常，都会另到SocketHelper里的connected = false
      //如果服务器或网络异常了，另到SocketHelper里的connected = false
      //客户端也做断开连接，让其在后面重连
      SocketManager.getInstance().closeSocket();

      my.showLoading({
        content: '请稍等,服务器连接中...',
      });

      var hadSubscribe = false;

      var socketCallback = {
        success() {
          console.info("socketCallback success");
          socketOpened = true;
          my.hideLoading();
          //added in 2018-6-22 by johnny
          if (!hadSubscribe) {
            hadSubscribe = true;
            SocketManager.getInstance().subscribeSocket(socketListener);
          }
          //end
          that.checkIfPlayByFriendInvite();
        },
        fail() {
          console.info("socketCallback fail");
          socketOpened = false;
          my.hideLoading();
        }
      };
      //在全局关闭.每个界面都不能关闭他
      SocketManager.getInstance().openSocket(socketCallback);
    } else {
      // my.showToast({
      //   type: 'success',
      //   content: '请稍等...',
      //   duration: 2000,
      // });
      console.info("socketOpened");
      socketOpened = true;
      SocketManager.getInstance().subscribeSocket(socketListener);
      console.info("SocketManager.getInstance().subscribeSocket()");
      this.checkIfPlayByFriendInvite();
    }
  },

  onTodoChanged(e) {
    const checkedTodos = e.detail.value;
    app.todos = app.todos.map(todo => ({
      ...todo,
      completed: checkedTodos.indexOf(todo.text) > -1,
    }));
    this.setData({ todos: app.todos });

  },
  skipSign() {
    SocketManager.getInstance().unsubscribeSocket(socketListener);
    my.navigateTo({ url: '../sign/sign' });
  },
  skipExchange() {
    SocketManager.getInstance().unsubscribeSocket(socketListener);
    my.navigateTo({ url: '../exchange/exchange' });
  },
  addTodo() {
    my.navigateTo({ url: '../add-todo/add-todo' });
    SocketManager.getInstance().unsubscribeSocket(socketListener);
    //my.navigateTo({ url: '../todoList/todoList' });
  },

  sendCheckRoom: function () {
    SocketManager.getInstance().sendMessage({
      senderId: account.userId(),
      cmd: 'CMD_ROOM_CHECK'
    });
  },

  gameMatching() {
    // if (clickGameMatching)先隐藏
    //   return;
    clickGameMatching = true;
    if (socketOpened) {
      //SocketManager.getInstance().unsubscribeSocket(socketListener);
      //my.navigateTo({ url: '../gameMatching/gameMatching' });
      joinRoomType = 0;
      this.sendCheckRoom();
    } else {
      this.connectServer();
    }
  },

  playGame() {
    // if (clickPlayGame)
    //   return;
    clickPlayGame = true;
    if (socketOpened) {
      joinRoomType = 1;
      //CMD_ROOM_CHECK,用于判断是否有好友对战还没结束
      this.sendCheckRoom();
      //以下跳转根据CMD_ROOM_CHECK结果后更新 hasOldGameData = true;
      // setTimeout(() => {
      //   if (!hasOldGameData) {
      //     console.log("hasOldGameData is false, jump into fightTillTheEndOption");
      //     SocketManager.getInstance().unsubscribeSocket(socketListener);
      //     my.navigateTo({ url: '../fightTillTheEndOption/fightTillTheEndOption' });
      //   } else
      //     hasOldGameData = false;
      // }, 1000);
    } else {
      this.connectServer();
    }
  },

  playTurntable() {
    my.redirectTo({ url: '../turntable/turntable' });
  },
});
