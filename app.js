
import { SocketManager } from "./manager/socketManager.js";

App({
  globalData: {
    isIphoneX: false
  },
  onLaunch(options) {
    const that = this;
    console.log(my.getSystemInfoSync())
    if (my.getSystemInfoSync().model.indexOf("iphone10") > 0) {
      this.globalData.isIphoneX = true;
    }

    //网络状态如果有变化，通知SocketManager
    my.onNetworkStatusChange(function (res) {
      SocketManager.getInstance().networkStatusChange(res,my);
    });
  },

  // todos: [
  //   { text: 'Learning Javascript', completed: true },
  //   { text: 'Learning ES2016', completed: true },
  //   { text: 'Learning 支付宝小程序', completed: false },
  // ],
  userInfo: null,

  getSystemInfoSync() {
    return my.getSystemInfoSync();
  },

  getUserInfo() {
    return new Promise((resolve, reject) => {
      // if (this.userInfo)
      //   resolve(this.userInfo);
      my.getAuthCode({
        scopes: 'auth_user',
        success: (res) => {
          console.info("my.getAuthCode:" + res.authCode);
          try {
            // 同步接口立即写入
            my.setStorageSync({
              key: 'authcode',
              data: res.authCode
            });
          } catch (e) {
            console.error(e);
          }
          my.getAuthUserInfo({
            success: (res) => {
              this.userInfo = res;
              resolve(this.userInfo);
            },
            fail: () => {
              console.info("getAuthUserInfo fail:");
              reject({});
            },
          });
        },
        fail: () => {
          console.info("getUserInfo fail");
          reject({});
        },
      });
    });
  },//end getUserInfo
});
