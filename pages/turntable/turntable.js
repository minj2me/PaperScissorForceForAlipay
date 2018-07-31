const account = require('../../manager/accountManager.js');
///奖品配置

let canRoll = true, num = 1;
var awards = [], len = awards.length, turnNum = 360 / len;  // 文字旋转 turn 值
Page({
  data: {
    turnNum: turnNum,
    awards: awards,
    len: len,
    selectIdx: 2,
    showSelect: false,
    sUserInfo: {},
    resultBtn: false
  },

  showFailure: function () {
    my.showToast({
      type: 'fail',
      content: "抱歉,奖品数据为空~",
      duration: 2000,
    });
  },

  onShow() {
    try {
      awards = my.getStorageSync({ key: 'prize' }).data;
      if (awards == undefined) {
        this.showFailure();
        return;
      }
      len = awards.length;
      if (len <= 0) {
        this.showFailure();
        return;
      }
      turnNum = 360 / len;  // 文字旋转 turn 值
      this.setData({
        awards: awards,
        len: len,
        turnNum: turnNum
      });
      //console.log(awards);
      //得出奖品选中的位置
      for (let i = 0; i < awards.length; i++) {
        if (awards[i].isChecked == 1) {
          this.data.selectIdx = i + 1;
          break;
        }
      }
      this.startRollTap(this.data.selectIdx);
    } catch (e) {
    }
  },

  onLoad(opt) {
    let that = this;
    let aniData = my.createAnimation({ //创建动画对象
      duration: 3000,
      timeFunction: 'ease-in-out'
    });
    this.aniData = aniData; //将动画对象赋值给this的aniData属性
    let sUserInfo = account.userInfo();
    sUserInfo.isLine = true;
    this.setData({
      sUserInfo: sUserInfo
    })
  },
  startRollTap(k) { //开始转盘
    let that = this;
    console.log('asd')
    if (canRoll) {
      canRoll = false;
      let aniData = this.aniData; //获取this对象上的动画对象
      //let rightNum = ~~(Math.random() * lotteryArrLen); //生成随机数
      let rightNum = len - (k - 1); //生成随机数
      console.log(`随机数是${rightNum}`);
      // console.log(`奖品是：${lottery[rightNum]}`);
      //旋转动画效果
      aniData.rotate(2880 - 360 / len * rightNum).step(); //设置转动的圈数
      this.setData({
        aniData: aniData.export()
      })
      setTimeout(() => {
        this.setData({
          showSelect: true,
          resultBtn: true
        })

      }, 3500)
      // num++;
      canRoll = true;
    }
  },
  skipResult() {
    my.redirectTo({
      url: '/pages/result/result?result=' + 1 + '&prizeIdx=' + this.data.selectIdx
    })
  }
})

