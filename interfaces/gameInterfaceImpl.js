/**
 * 有关游戏相关的接口的实现
 */

import { SocketManager } from "../manager/socketManager.js";
const account = require('../manager/accountManager.js');

const VALUE_SCISSORS = 1;
const VALUE_STORE = 2;
const VALUE_PAPRE = 3;

const imageSrc = "../images/";  //图片url前缀

const VALUE_SCISSORS_PHOTO_URL = imageSrc + "value1p.png";
const VALUE_STORE_PHOTO_URL = imageSrc + "value2p.png";
const VALUE_PAPRE_PHOTO_URL = imageSrc + "value3p.png";

const VALUE_SCISSORS_BIG_PHOTO_URL = imageSrc + "value1p_big.png";
const VALUE_STORE_BIG_PHOTO_URL = imageSrc + "value2p_big.png";
const VALUE_PAPRE_BIG_PHOTO_URL = imageSrc + "value3p_big.png";

const VALUE_CANNOT_SEE_PHOTO_URL = imageSrc + "border_cannot_see_big.png";

var GameInterfaceImpl = function () {
};

GameInterfaceImpl.prototype = {
    /*
        interface View(){
          function matchingSuccessful();
          function matchingFailure();
          function showOrderPlayerConfirm();
          function showGameResult();
          function showMyInfo();
          function showOtherPlayerInfo();
        }
      
        interface Presenter(){
          function matching();
          function sendCard();
          function setCard();
          function requestGamePrize();
            function subscribeSocket();
            function unSubscribeSocket();
        }
        */

    ///////////////实现 View 接口///////////////
    matchingSuccessful: function () {

    },

    matchingFailure: function () {

    },

    showOrderPlayerConfirm: function () {

    },

    showMyInfo: function (gameData) {
        if (gameData == null) return;
        var playerList = gameData.userList;
        var userInfo = {};
        if (playerList != null && playerList.length > 0) {
            for (let i = 0; i < playerList.length; i++) {
                if (account.userInfo().id == playerList[i].id) {
                    userInfo.id = playerList[i].id;
                    userInfo.avatar = playerList[i].avatar;
                    userInfo.nickName = playerList[i].nickName;
                    userInfo.gender = playerList[i].gender;
                    userInfo.stars = playerList[i].stars;
                    break;
                }
            }
        }
        return userInfo;
    },

    showOtherPlayerInfo: function (gameData) {
        if (gameData == null) return;
        var playerList = gameData.userList;
        var userInfo = {};
        if (playerList != null && playerList.length > 0) {
            for (let i = 0; i < playerList.length; i++) {
                if (account.userInfo().id != playerList[i].id) {
                    //otherPlayer = playerList[i];
                    userInfo.id = playerList[i].id;
                    userInfo.avatar = playerList[i].avatar;
                    userInfo.nickName = playerList[i].nickName;
                    userInfo.gender = playerList[i].gender;
                    userInfo.stars = playerList[i].stars;
                    break;
                }
            }
        }
        return userInfo;
    },

    ///////////////实现 Presenter 接口///////////////
    matching: function () {
        SocketManager.getInstance().sendMessage({
            senderId: account.userId(),
            cmd: 'CMD_MATCHING'
        });
    },

    sendCard: function (type) {
    },

    compareWithServer: function (type, mySelectedCards, roomId) {
        try {
            if (type == 0) {//三张牌
                var selectedCardData = [];
                for (let i = 0; i < mySelectedCards.length; i++) {
                    console.log("push:" + mySelectedCards[i].value);
                    selectedCardData.push(mySelectedCards[i].value);
                }
                SocketManager.getInstance().sendMessage({
                    senderId: account.userId(),
                    roomId: roomId,
                    data: JSON.stringify(selectedCardData),// 卡片id列表
                    cmd: 'CMD_CARD_SEQ'
                });
            } else {
            }
        } catch (e) {
            console.error(e);
        }
    },

    getGameCountDownTime: function (gameData) {
        if (gameData == null) return;
        let confirmEndTime = gameData.confirmEndTime;
        console.log("confirmEndTime:" + confirmEndTime);
        //countDownTime=confirmEndTime - 当前时间的毫秒时间戳 后得到的秒数
        //let myDate = new Date();//当前时间
        let currentMilliseconds = new Date().getTime(); //当前毫秒时间戳
        console.log("currentMilliseconds:" + currentMilliseconds);
        let countDownTime = parseInt((confirmEndTime - currentMilliseconds) / 1000);//换成秒
        if (countDownTime < 0)
            countDownTime = 0;
        console.log("countDownTime:" + countDownTime);
        return countDownTime;
    },

    requestGamePrize: function (cb) {
    },

    subscribeSocket: function (socketListener) {
        SocketManager.getInstance().subscribeSocket(socketListener);
    },

    unSubscribeSocket: function (socketListener) {
        SocketManager.getInstance().unsubscribeSocket(socketListener);
    }
};

module.exports = GameInterfaceImpl;