const account = require('../../manager/accountManager.js');
//import { SocketManager } from "../../manager/socketManager.js";
import { requestGetShareInfo } from "../../network/apiService";
var result;
Page({
  data: {
    animationInfo: {},
    isExamine: true,
    result: 1,     //1为赢，0为输
    rankingArr: [],
    gameResult: [],
    scoreStr: '',
    gameResultStr: '',
    prizeName: '',
    prizeurl: '',
    stars: '',
    animationInfo: {},
    scoreChange: 0,
    shareUrl:'',
    shareTitle:''
  },
  examine: function () {
    let aniData = this.aniData;
    if (this.data.isExamine) {
      aniData.bottom(-10 + "rpx").step();
      this.setData({
        aniData: aniData.export(),
        isExamine: false
      });
    } else {
      aniData.bottom(-370 + "rpx").step();
      this.setData({
        aniData: aniData.export(),
        isExamine: true
      });
    }

  },
  onLoad(option) {
    console.log(option)

    let aniData = my.createAnimation({ //创建动画对象
      duration: 1000,
      timingFunction: 'ease-out'
    });
    this.aniData = aniData; //将动画对象赋值给this的aniData属性
    // this.animation = animation;
    console.log('进入结果页面')
    // console.log(my.getStorageSync({ key: 'prize' }))
    var animation = my.createAnimation({
      duration: 1000,
      timingFunction: 'ease-in-out',
    });

    this.animation = animation;

    animation.scale(2).step();
    animation.scale(1).step();

    this.setData({
      animationInfo: animation.export()
    });
    console.log(my.getStorageSync({ key: 'gameResult' }).data)
    result = option.result;
    this.setData({
      nickName: account.userInfo().nickName,
      avatar: account.userInfo().avatar,
      stars: account.userInfo().stars,
      result: option.result,
      rankingArr: my.getStorageSync({ key: 'ranking' }).data,
      gameResult: my.getStorageSync({ key: 'gameResult' }).data,
      scoreStr: my.getStorageSync({ key: 'scoreStr' }).data,
      gameResultStr: my.getStorageSync({ key: 'gameResultStr' }).data,
      scoreChange: my.getStorageSync({ key: 'scoreChange' }).data
    })
    // 获胜
    if (option.result == 1) {
      let prizeArr = my.getStorageSync({ key: 'prize' }).data;
      this.setData({
        prizeName: prizeArr[parseInt(option.prizeIdx) - 1].name,
        prizeUrl: prizeArr[parseInt(option.prizeIdx) - 1].url
      })
    } else {

    }
    setTimeout(() => {
      this.setData({
        stars: this.data.stars + this.data.scoreChange
      })
      account.userInfo().stars = this.data.stars;
    }, 500)
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
  skip() {
    my.redirectTo({
      url: '/pages/ranking/ranking'
    })
  },

  challenge: function () {
    my.redirectTo({
      url: '/pages/options/options'
    });

    //result: 0,     //1为赢，0为输
    // var stepBack;
    // if (result == 1) {
    //   stepBack = 2;
    // } else {
    //   stepBack = 2;
    // }
    // my.navigateBack({
    //   delta: 1
    // })
  },

  toHomePage: function () {
    my.redirectTo({
      url: '/pages/index/index'
    });
    // var stepBack;
    // if (result == 1) {
    //   stepBack = 5;
    // } else {
    //   stepBack = 4;
    // }
    // my.navigateBack({
    //   delta: stepBack
    // });
  },
  // 分享
  onShareAppMessage() {
    console.log(this.data.shareTitle)
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
          content: '分享失败',
          duration: 1000,
        });
      }
    };
  }
});
