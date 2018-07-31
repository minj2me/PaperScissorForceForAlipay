//import tabBottom from '/components/tabBottom/tabBottom.js';
const account = require('../../manager/accountManager.js');
import tabBottom from '/components/tabBottom/tabBottom.js';
import { requestRanking,requestGetShareInfo } from "../../network/apiService";
const app = getApp();
var imPlayer = {};
var list = [];
Page({
  ...tabBottom,
  tabCutThree(){},
  data: {
    tabData:{
      isIphoneX:false
    },
    scrollTop: 100,
    imPlayer: {},
    list: [],
    dd: '',
    hidden: false,
    page: 1,
    size: 20,
    hasMore: true,
    hasRefesh: false,
    shareUrl:'',
    shareTitle:''
  },

  onLoad() {
    if(my.getSystemInfoSync().model.indexOf("iPhone10") > -1){
      this.setData({
        tabData:{isIphoneX:true}
      })
    }
    if (!account.isLogin()) {
      my.showLoading({
        content: '登录中...',
      });
      app.getUserInfo().then(
        user => {
          
          //this.setData({ user, })
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
              this.initRankingRequest();
              //登录
            },
            
          };
          account.loginServer(loginCallback, authCode);
        },
      );
    }else{
      my.showLoading({
        content: '请稍等...',
      });
      this.initRankingRequest();
    }
    //获取分享信息接口
    console.log('获取分享信息')
    requestGetShareInfo(1).then(data=>{
      console.log(data)
      try{
        this.setData({
            shareUrl:data.url,
            shareTitle:data.title
        })
      }catch(e){
        console.log(e)
      }
    }).catch(e=>{
      console.log(e)
    })
   
  },
  initRankingRequest(){
    console.log('执行加载排行数据')
     requestRanking(account.userId()).then(data => {
      my.hideLoading();
      try {
        console.warn('进入回调')
        console.warn(data)
        this.setData({
          imPlayer: data.user,
          list: data.ranking
        });
      } catch (e) {
      }
    }).catch(e => {
      my.hideLoading();
      console.error("requestRanking error", e);
    });
  },
  /**
     * 通过给 button 组件设置属性 open-type="share"，
     * 可以在用户点击按钮后触发 Page.onShareAppMessage() 事件，如果当前页面没有定义此事件，则点击后无效果。
     */
    onShareAppMessage() {
        return {
            title: this.data.shareTitle,
            desc: '',
            path: '/pages/index/index',
            imageUrl: this.data.shareUrl,
            success: function () {
                // my.showToast({
                //     type: 'success',
                //     content: '分享成功',
                //     duration: 1000,
                // });
            },
            fail: function () {
                my.showToast({
                    type: 'fail',
                    content: '邀请失败',
                    duration: 1000,
                });
            }
        };
    }
});
