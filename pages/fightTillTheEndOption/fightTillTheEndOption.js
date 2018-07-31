const account = require('../../manager/accountManager.js');
import { requestInviteFight } from "../../network/apiService.js";
//var app = getApp();

// 房间类型：1逐张出牌，2顺序出牌
var roomType;
var roomType1Object = {}, roomType2Object = {}, room = {};
var imgUrl, title;
var player = {};
var roomId;//现在先全部单张
// var roomId1;
// var roomId2;
// var sharePath = "";
// var sharePath1 = "/pages/index/index?formPage=invite&roomId=";
// var sharePath2 = "/pages/index/index?formPage=invite&roomId=";

Page({
    data: {
    },

    onLoad(query) {

        roomId = null;
        // roomId1 = null;
        // roomId2 = null;
        // sharePath = "";
        // sharePath1 = "/pages/index/index?formPage=invite&roomId=";
        // sharePath2 = "/pages/index/index?formPage=invite&roomId=";
        console.log("fightTillTheEndOptions onLoad");

        this.setData({
            player: account.userInfo(),
        });

        my.showLoading({
            content: '请稍等...',
        });

        //现在用两个对像都读取生成一次方法,先执行1,再2
        requestInviteFight(1, account.userInfo().id).then(data => {
            my.hideLoading();
            imgUrl = data.url;
            title = data.title;
            roomId = data.room.id;
            //roomType1Object = data.room;
            // roomId1 = data.room.id;
            // sharePath1 = sharePath1 + roomId1;
            if (roomId == undefined) {
                my.hideLoading();
                this.backToOptionByRoomId();
                return;
            }
            ///现在先全部单张!!!!!
            // requestInviteFight(2, account.userInfo().id).then(data => {
            //     my.hideLoading();
            //     imgUrl = data.url;
            //     title = data.title;
            //     //roomType2Object = data.room;
            //     roomId2 = data.room.id;
            //     sharePath2 = sharePath2 + roomId2;
            //     if (roomId2 == undefined) {
            //         my.hideLoading();
            //         this.backToOptionByRoomId();
            //         return;
            //     }
            // }).catch(e => {
            //     my.hideLoading();
            //     console.error("requestInviteFight2 error", e);
            //     this.backToOption();
            // });
        }).catch(e => {
            my.hideLoading();
            console.error("requestInviteFight1 error", e);
            this.backToOption();
        });

        // requestInviteFight(2, account.userInfo().id).then(data => {
        //     my.hideLoading();
        //     imgUrl = data.url;
        //     title = data.title;
        //     roomType2Object = data.room;
        // }).catch(e => {
        //     my.hideLoading();
        //     console.error("requestInviteFight error", e);
        // });
    },

    /**
    * 页面被关闭
    */
    onUnload() {
        //roomId = null;
        // roomId1 = null;
        // roomId2 = null;
        // sharePath = "";
        // sharePath1 = "";
        // sharePath2 = "";
        console.log("fightTillTheEndOptions onUnload");
    },

    backToOptionByRoomId: function () {
        my.showToast({
            type: 'fail',
            content: '对战房间数据有误,跳转中...',
            duration: 2000,
        });
        my.redirectTo({ url: '/pages/options/options' });
    },

    backToOption: function () {
        my.showToast({
            type: 'fail',
            content: '对战数据读取失败,跳转中...',
            duration: 2000,
        });
        my.redirectTo({ url: '/pages/options/options' });
    },

    getShareData: function (e) {
        // roomType = e.target.id;
        // if (roomType == 1) {
        //     roomId = roomId1;
        //     sharePath = sharePath1;
        // } else {
        //     roomId = roomId2;
        //     sharePath = sharePath2;
        // }
        console.log("getShareData");
    },

    /**
     * 通过给 button 组件设置属性 open-type="share"，
     * 可以在用户点击按钮后触发 Page.onShareAppMessage() 事件，
     * 如果当前页面没有定义此事件，则点击后无效果。
     */
    onShareAppMessage() {
        console.log("onShareAppMessage");
        //console.log("room.type:" + room.type)
        console.log("share path:/pages/index/index?formPage=invite&roomId=" + roomId);
        return {
            title: title,
            desc: title,
            //用户点击分享出去的页面后，先经过index再到对战页面, 
            //现在先全部单张!因为在iphone里，onShareAppMessage比getShareData先执行
            path: '/pages/index/index?formPage=invite&roomId=' + roomId,
            //path: sharePath == "" ? sharePath1 : sharePath2,//在iphone里分享出来，值传不了到sharePath!!!fuck
            imageUrl: imgUrl,
            success: function () {
                my.showToast({
                    type: 'success',
                    content: '邀请成功',
                    duration: 1000,
                });
                //my.redirectTo({ url: '/pages/share/share?roomObject=' + JSON.stringify(room) });
                my.redirectTo({ url: '/pages/share/share?roomId=' + roomId });
            },
            fail: function () {
                my.showToast({
                    type: 'fail',
                    content: '邀请失败',
                    duration: 1000,
                });
            }
        };
    },
});