import tabBottom from '/components/tabBottom/tabBottom.js';
import { requestSignData, requestSignIn } from "../../network/apiService";
const account = require('../../manager/accountManager.js');
Page({
  ...tabBottom,
  tabCutTwo(){},
  data: {
    tabData:{
      isIphoneX:false
    },
    nickName: '',
    avatar: '',
    gender:1,
    prizeUrl: '',
    isSignedIn: 0,
    signInRemain: 9,
    stars:''
  },

  onLoad() {
    my.showLoading({
      content: '请稍等...',
    });
    let userInfo = account.userInfo();
    console.log(userInfo)
    if(my.getSystemInfoSync().model.indexOf("iPhone10") > -1){
      this.setData({
        tabData:{isIphoneX:true}
      })
    }

    requestSignData(userInfo.id).then(data => {
      my.hideLoading();
      console.log(data)
      this.setData({
        prizeUrl: data.prizeUrl,
        isSignedIn: data.isSignedIn,
        signInRemain: data.signInRemain
      })
    }).catch(e => {
      my.hideLoading();
    });



    this.setData({
      nickName:userInfo.nickName,
      avatar: userInfo.avatar,
      stars:userInfo.stars,
      gender:userInfo.gender
    })
  },
  //签到
  signIn() {
    if (this.data.isSignedIn == 0) {
      requestSignIn(account.userInfo().id).then(data => {
        my.hideLoading();
        console.log(data)
        account.setUserInfo(data);
        this.setData({
          isSignedIn:1,
          signInRemain:this.data.signInRemain-1
        })
      }).catch(e => {
      });
    }else{
      my.showToast({
        content:'你已经签过了！'
      });
    }

  }
});
