import tabBottom from '/components/tabBottom/tabBottom.js';
import util from '../../utils/util.js';
const account = require('../../manager/accountManager.js');
import { requestUserInfoCenter, requestUserPrize } from "../../network/apiService";
Page({
  ...tabBottom,
  tabCutFour(){},
  data: {
     tabData:{
      isIphoneX:false
    },
    nickName:'',
    avatar:'',
    gender:1,
    stars:'',
    gameHistorySummary:[],
    prizeList:[],
    cp:1,
    ps:10,
    totalPage:0,
    isMore:false
  },
  onLoad() {
     my.showLoading({
      content: '请稍等...',
    });
    if(my.getSystemInfoSync().model.indexOf("iPhone10") > -1){
      this.setData({
        tabData:{isIphoneX:true}
      })
    }
    let userInfo=account.userInfo();
    this.setData({
      nickName:userInfo.nickName,
      avatar:userInfo.avatar,
      stars:userInfo.stars,
      gender:userInfo.gender
    })
    //对战历史记录
    requestUserInfoCenter(userInfo.id).then(data=>{
      console.log(data)
      this.setData({
        gameHistorySummary:data.gameHistorySummary
      })
      my.hideLoading();
    }).catch(e=>{
      console.log(e)
    })
    //奖品记录
    this.getUserPrize();
  },
  /**
   * 跳转到兑换中心
   */
  toExchange:function(){
    my.navigateTo({
      url: '../exchange/exchange'
    })
  },
  getUserPrize(){
    //奖品记录
    my.showLoading({
      content: '正在加载中...',
    });
    requestUserPrize(account.userInfo().id,this.data.cp,this.data.ps).then(res=>{
      console.log('物品库')
      console.log(res)
      if(res.list.length>0){
        for(let i=0;i<res.list.length;i++){
          res.list[i].remainTimestamp=util.formatDayTime(res.list[i].remainTimestamp)
        }
      }
      let arr=this.data.prizeList;
      if(this.data.cp==res.totalPage ){
         this.setData({
          isMore:true
        })
      }
      this.setData({
        prizeList:arr.concat(res.list),
        cp:this.data.cp+1,
        totalPage:res.totalPage
      })
      my.hideLoading();
    }).catch(e=>{
      console.log(e)
    })
  },
   onReachBottom() {
    // 页面被拉到底部
    console.log('asd')
    if(this.data.cp<=this.data.totalPage &&this.data.totalPage!=1){
      this.getUserPrize()
    }else{
      this.setData({
        isMore:true
      })
    }
  },
});
