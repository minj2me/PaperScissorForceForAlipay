const app = getApp();
const account = require('../../manager/accountManager.js');
import tabBottom from '/components/tabBottom/tabBottom.js';
//import { interfaces } from './contract.js';
const interfaces = require('./contract.js');
const ContractImpl = require('./ContractImpl.js');
//import {requestLogin} from "../../network/apiService";
//import {requestUserInfo} from "../../network/network.js";
var userInfo;
var formPage = "";
//var roomObject = {};
var roomId;
var contractImpl;
Page({
  ...tabBottom,
  tabCutOne() {

  },
  data: {
    tabData: {
      isIphoneX: false
    }
  },

  /**
   * 接口的初始化与使用
   */
  initInterface: function () {
    //接口的实现
    contractImpl = new ContractImpl();
    //使用先前执行接口检测
    interfaces.checkImpl(contractImpl);
  },

  onLoad(query) {
    try {
      this.initInterface();
      formPage = query.formPage;
      //roomObject = JSON.parse(query.roomObject);
      roomId = query.roomId;
    } catch (e) {
      console.error(e);
    }
    var that = this;
    if (my.getSystemInfoSync().model.indexOf("iPhone10") > -1) {
      this.setData({
        tabData: { isIphoneX: true }
      })
    }

    console.log('onLoad 进入了首页');
    
    if (!account.isLogin()) {
      my.showLoading({
        content: '登录中...',
      });
      app.getUserInfo().then(
        user => {
          this.setData({ user, })
          let loginCallback = {
            success() {
              contractImpl.showSuccessful();
              that.checkIfFormInvite();
            },
            fail() {
              contractImpl.showFailure();
            }
          };
          ///登录我们后台
          contractImpl.doLogin(loginCallback);
        },
      );
    } else {
      this.checkIfFormInvite();
    }
  },//end onLoad()

  checkIfFormInvite: function () {
    if (formPage == "invite") {
      //现在统一通过options打开socket，再转到share
      //my.redirectTo({ url: '/pages/options/options?roomObject=' + JSON.stringify(roomObject) });
      my.redirectTo({ url: '/pages/options/options?roomId=' + roomId });
    }
  },

  // makeMoreCommand: function () {
  //   return {
  //     f1: function () {
  //       return "f1";
  //     },
  //     f2: function () {
  //       return "f2";
  //     }
  //   };
  // },

  onShow() {
    //this.setData({ todos: app.todos });
  },

  start() {
    my.navigateTo({
      url: '../options/options'
    })
  }

});
