const account = require('../../manager/accountManager.js');
import { requestExcList,requestPrizeExchange } from "../../network/apiService";
//import { requestPrizeExchange } from "../../network/apiService";

// var test={
//     notNull:function(value) {
//         return value!="";
//     },
//     maxLength:function() {

//     }
// }

var list = [];
Page({
    data: {
        avatar: account.userInfo().avatar,
        nickName: account.userInfo().nickName,
        stars:account.userInfo().stars,
        gender:account.userInfo().gender
    },
    onLoad() {
        const that = this;
        this.setData({
            avatar:account.userInfo().avatar,
            nickName: account.userInfo().nickName,
            stars:account.userInfo().stars
        });
        my.showLoading({
            content: '请稍等...',
        });
        requestExcList().then(data => {
            my.hideLoading();
            try {
                that.setData({
                    list: data
                });
            } catch (e) {
            }
        }).catch(e => {
            my.hideLoading();
            console.error("requestExcList error", e);
        });
    },

    prizeExchange: function (e) {
        //var prizeId = e.currentTarget.dataset.value;
        var object = e.currentTarget.dataset.value;
        var userLimited = object.userLimited;
        var userOwnCount = object.userOwnCount;
        if (!this.canExchange(userLimited, userOwnCount)) {
            my.showToast({
                type: 'fail',
                content: "抱歉,当前不能对换.",
                duration: 2000,
            });
            return;
        }
        var uid = account.userId();
        var prizeId = object.id;
        //console.log("value:"+value);
        my.showLoading({
            content: '请稍等...',
        });
        requestPrizeExchange(prizeId, uid).then(data => {
            my.hideLoading();
            my.showToast({
                type: 'success',
                content: e.msg,
                duration: 2000,
            });
        }).catch(e => {
            my.hideLoading();
            console.error("requestPrizeExchange error", e);
            my.showToast({
                type: 'fail',
                content: e.msg,
                duration: 2000,
            });
        });
    },

    /**
     * 判断是否能进行兑换
     * userLimited, // 每个用户限制的兑换次数, 0表示无限制
     * userOwnCount, // 当前用户已兑换的数量
     */
    canExchange: function (userLimited, userOwnCount) {
        return (userLimited == 0) ? true : (userOwnCount < userLimited);
    },
});