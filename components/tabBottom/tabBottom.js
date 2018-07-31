
const app = getApp();
Page({
  data: {
  },
  onLoad() {

  },
});
export default {
  tabCutOne(data) {
    console.log(data)
    my.redirectTo({
      url: '/pages/index/index'
    })
  },
  tabCutTwo() {
    my.redirectTo({
      url: '/pages/sign/sign'
    })
    // my.redirectTo({
    //   url: '/pages/result/result'
    // })
  },
  tabCutThree() {
    my.redirectTo({
      url: '/pages/ranking/ranking'
    })
  },
  tabCutFour() {
    my.redirectTo({
      url: '/pages/personal/personal'
    })
  }
}
