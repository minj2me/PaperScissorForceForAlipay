const account = require('../../manager/accountManager.js');
import { baseSocketUrl } from "../../network/apiService.js";
import { requestGameResult } from "../../network/apiService.js";
import { GameControl } from "../../manager/gameControl.js";
import { SocketManager } from "../../manager/socketManager.js";

var gameControl;
var app = getApp();
const VALUE_SCISSORS = 1;
const VALUE_STORE = 2;
const VALUE_PAPRE = 3;

// const WIN_STATE = 1;
// const LOSE_STATE = -1;
// const DRAW_STATE = 0;

const EMPTY_BORDER_VALUE = -1;

const SELECT_CARD_TIME_LIMIT = 60;
//var api = require('../../network/api.js');
//var requests = require('../../network/baseRequest.js');
//const Card = require('../../playercharacter/card.js');
//const Player = require('../../playercharacter/player.js');
const utils = require('../../utils/util.js');
const imageSrc = "../../images/";  //图片url前缀

const VALUE_SCISSORS_PHOTO_URL = imageSrc + "value1p.png";
const VALUE_STORE_PHOTO_URL = imageSrc + "value2p.png";
const VALUE_PAPRE_PHOTO_URL = imageSrc + "value3p.png";

const VALUE_SCISSORS_BIG_PHOTO_URL = imageSrc + "value1p_big.png";
const VALUE_STORE_BIG_PHOTO_URL = imageSrc + "value2p_big.png";
const VALUE_PAPRE_BIG_PHOTO_URL = imageSrc + "value3p_big.png";

const VALUE_CANNOT_SEE_PHOTO_URL = imageSrc + "border_cannot_see_big.png";


//https://blog.csdn.net/qq_37942845/article/details/80169907
var items;
var borderItems;
var index = 0;//当前在拖动的牌的index
var borderWidth = 115;
var borderHeight = 147;
var cardWidth = 114;
var cardHeight = 146;
//我的卡和框的location，以下是rpx的
const cardY = 910;
const card1X = 120, card2X = 250, card3X = 380;
const borderY = 680;
const border1X = 110, border2X = 300, border3X = 490;
//对手卡和框的location
const cardOrderY = 155;
const borderOtherY = 330;
//我选择了的牌
var mySelectedCards = [{ value: 0 }, { value: 0 }, { value: 0 }];
//对手选择的牌
var taSelectedCards = [
    { value: VALUE_STORE, url: VALUE_STORE_BIG_PHOTO_URL },
    { value: VALUE_SCISSORS, url: VALUE_SCISSORS_BIG_PHOTO_URL },
    { value: VALUE_PAPRE, url: VALUE_PAPRE_BIG_PHOTO_URL }];

//当前局的第几盘
var currentStage = 1;
//一局可玩多少盘
var maxGameRound = 0;
//玩家所在的房间号
var roomId = 0;
//当前局的对比结果 
var resultLists = [];
//当前局的对战结果记录列表
var resultRecordLists = [];
//当前局的总分数 
//var gameTotalResult = 0;
//对战房间对像信息
var roomObject = {};
var gameInitData = {};
//对手列表
var orderPlayerList = [];

var cardList = [], borderList = [], borderListOrderUser = [], cardListOrderUser = [];

var showTaCard, iSendedCard, orderPlayerConfirmed;
//var cardAnimation = null;
//放牌倒计时
var countDownTime;
var selectCardTimeCountDownTimer;

var showedGuide = false;
//var isUnLoaded = false;
//倒计时的location
const timeCountDownX = 77;
const timeCountDownY = 570;
var cardAnimationInfo;
Page({
    data: {
        timeCountDownX: timeCountDownX,
        timeCountDownY: timeCountDownY,
        countDownTime: SELECT_CARD_TIME_LIMIT,
        showTaCard: false,
        iSendedCard: false,
        orderPlayerConfirmed: false,

        /**
         * cardList和cardListOrderUser的数据都是服务器返回的,在server push to client的cmd==INIT_GAME_DATA时返回
         */
        cardList: [
            //value定义:剪刀==1，石头==2，布==3  
            { touched: false, index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }],

        borderList: [
            { index: 0, x: border1X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 1, x: border2X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 2, x: border3X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }],

        borderListOrderUser: [
            { index: 0, x: border1X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 1, x: border2X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 2, x: border3X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }],

        cardListOrderUser: [
            { value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }],

        player: {},
        me: {},
        roomObject: {},
    },

    resetGameData: function () {
        //cardAnimation = null;
        mySelectedCards = [{ value: 0 }, { value: 0 }, { value: 0 }];
        ////定义剪刀==1，石头==2，布==3  
        this.data.cardList = [
            { touched: false, index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        this.data.borderList = [
            { index: 0, x: border1X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 1, x: border2X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 2, x: border3X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }];

        this.data.borderListOrderUser = [
            { index: 0, x: border1X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 1, x: border2X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 2, x: border3X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }];

        this.data.cardListOrderUser = [
            { value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        items = this.data.cardList;
        borderItems = this.data.borderList;
        this.countDownTime = SELECT_CARD_TIME_LIMIT;
        // showTaCard = false;//要等到发了下局牌后或onload再可让确认按钮可点
        // iSendedCard = false;//要等到发了下局牌后或onload再可让确认按钮可点
        // orderPlayerConfirmed = false;//要等到发了下局牌后或onload再可让确认按钮可点

        this.setData({
            countDownTime: countDownTime,
            // showTaCard: showTaCard,
            // orderPlayerConfirmed: orderPlayerConfirmed,
            //cardList: items//<-进入下一盘后，不显示初始的牌数据在前台，不然会出现闪动
        });
    },

    /**
     * 开始一盘新游戏,3盘两胜才算赢一局
     */
    newGame: function () {
        //currentStage++;
        this.resetGameData();//<=要等到发了下局牌后或onload再可让确认按钮可点
        //6-22修改为不用发CMD_GAME_START,之前RSP_GAME_DATA_INIT是服务器端收到 CMD_GAME_START后下发的
        //现在 RSP_GAME_DATA_INIT 会在下发了RSP_GAME_RESULT 4秒后下发
        //因为客户端之前是4秒后(界面展示与动画播放)才发送CMD_GAME_START
        // SocketManager.getInstance().sendMessage({
        //     senderId: account.userId(),
        //     roomId: roomObject.id,
        //     cmd: 'CMD_GAME_START'
        // })
    },

    /**
     * 如果有旧的对战历史数据，显示出来
     */
    listOldResultRecordList: function () {
        let dataKey = "oldGameResultData";
        let oldGameResultData = my.getStorageSync({ key: dataKey }).data;
        if (oldGameResultData == null)
            return;
        iSendedCard = true;
        this.setData({
            iSendedCard: iSendedCard
        });
        this.stopCardTimeCountDownTimer();
        this.showResultInLayout(oldGameResultData, true);
        //清空旧数据
        my.setStorageSync({
            key: dataKey,
            data: null
        });
    },

    onLoad(query) {
        //isUnLoaded = false;
        this.gameControl = new GameControl();
        try {
            gameInitData = my.getStorageSync({ key: 'gameInitData' }).data;
            roomObject = gameInitData.room;
            orderPlayerList = gameInitData.users;
        } catch (e) {
            console.error(e);
        }
        //const that = this;
        items = this.data.cardList;
        borderItems = this.data.borderList;
        var player_;
        if (orderPlayerList != null && orderPlayerList.length > 0) {
            //player_ = orderPlayerList[0];
            for (let i = 0; i < orderPlayerList.length; i++) {
                //if (account.userInfo().aliUserId != orderPlayerList[i].aliUserId)
                if (account.userInfo().id != orderPlayerList[i].id)
                    player_ = orderPlayerList[i];
            }
        }

        currentStage = 1;//不能将currentStage放在resetGameData();
        resultLists = [];
        resultRecordLists = [];
        //gameTotalResult = 0;
        iSendedCard = false;
        orderPlayerConfirmed = false;
        showTaCard = false;

        this.resetGameData();

        showedGuide = my.getStorageSync({ key: 'showedGuide' }).data;
        if (!showedGuide) {
            my.setStorageSync({ key: 'showedGuide', data: true });
        }

        this.setData({
            showTaCard: showTaCard,
            orderPlayerConfirmed: orderPlayerConfirmed,
            iSendedCard: iSendedCard,
            showedGuide: showedGuide,
            resultLists: resultLists,//真面会缓存数据，所以清空数据都要更新到页面
            //countDownTime: roomObject.countDownTime,
            //hard code!!!!!!!!!!!
            resultRecordLists: resultRecordLists,
            countDownTime: SELECT_CARD_TIME_LIMIT,
            player: player_,
            me: account.userInfo(),
            cardList: items//<-从resetGameData里抽到这里 
        })

        this.setGameDataFormServer(gameInitData, true);
        this.startTimeCountDown();
        this.initSocket();
        this.listOldResultRecordList();
    },//end onLoad

    orderPlayerConfirmedCard: function () {
        var hiddenCards = [
            { value: 0, url: VALUE_CANNOT_SEE_PHOTO_URL },
            { value: 0, url: VALUE_CANNOT_SEE_PHOTO_URL },
            { value: 0, url: VALUE_CANNOT_SEE_PHOTO_URL }];
        this.setData({
            orderPlayerConfirmed: true,
            hiddenCards: hiddenCards
        });
    },

    initSocket: function () {
        const that = this;
        var socketListener = function (res) {
            //if (isUnLoaded) return;
            console.log("res.cmd in starFight:" + res.cmd);
            //console.log(res.data);
            //if (res.cmd && res.senderId != account.userId()) {
            if (res.cmd) {
                switch (res.cmd) {
                    case 'RSP_GAME_DATA_INIT':
                        that.setGameDataFormServer(res.data, false);
                        that.startTimeCountDown();
                        iSendedCard = false;
                        orderPlayerConfirmed = false;
                        showTaCard = false;
                        that.setData({
                            showTaCard: showTaCard,
                            iSendedCard: iSendedCard,
                            orderPlayerConfirmed: orderPlayerConfirmed,
                            //回到0度，准备下一次翻的动画
                            cardAnimationInfo: that.gameControl.getAnimation(0).export()
                        });
                        break;
                    case 'RSP_USER_CONFIRM'://用户or服务器叫我确认卡牌顺序
                        /**
                         * 用户超时未出牌，服务器会自动确认，消息结构与其他确认出牌一样，区别仅为data里的userId为当前用户
                         * {"senderId":0,"receiverId":10001,"cmd":"RSP_USER_CONFIRM","data":{"userId":10001,"code":0,"msg":"确认出牌"}}
                         */
                        if (res.data != null) {
                            if (account.userId() == res.data.userId) {
                                //服务器叫我确认出牌
                                that.confirmCard();
                                console.log("server call me confirmCard");
                            } else {
                                //对方确认出牌
                                that.orderPlayerConfirmedCard();
                                console.log("order player confirmCard");
                            }
                        } else {
                            my.showToast({
                                type: 'fail',
                                content: 'RSP_USER_CONFIRM 的数据为空',
                                duration: 5000,
                            });
                        }
                        break;
                    case 'RSP_GAME_RESULT'://比赛结果
                        var resultDatas = res.data;
                        that.showResultInLayout(resultDatas, false);
                        break;
                    default: break
                }
            }
        };
        SocketManager.getInstance().subscribeSocket(socketListener);
        this.socketListener = socketListener;
    },

    onShow() {
        // 页面显示 
        console.log("onShow");
    },

    /**
     * 页面隐藏
     */
    onHide() {
        console.log("onHide");
    },

    /**
    * 页面被关闭
    */
    onUnload() {
        //this.gameControl.unsubscribeSocket(this.socketListener);
        //isUnLoaded = true;
        this.stopCardTimeCountDownTimer();
        SocketManager.getInstance().unsubscribeSocket(this.socketListener);
        //SocketManager.getInstance().closeSocket(true);
        //SocketManager.getInstance().closeSocket();
        //this.gameControl.closeSocket();
        //setData(...) can only update a loaded page.
    },

    /**
     * 显示选牌倒计时
     */
    startTimeCountDown: function () {
        const that = this;
        this.stopCardTimeCountDownTimer();
        selectCardTimeCountDownTimer = setInterval(() => {
            //countDown--;
            that.countDownTime--;
            this.setData({
                countDownTime: that.countDownTime,
            });
            if (that.countDownTime == 0) {
                //自动选牌
                this.confirmCard();
            }
        }, 1000);
    },

    /**
     * 如果用户选牌时间超过，系统帮随机选定
     */
    autoSelectCard: function () {
        //this.putCardInBorder(card, border);
        for (let i = 0; i < items.length; i++) {
            var card = items[i];
            var emptyBorder = this.foundOutEmptyBorder();
            if (emptyBorder != null && card != null) {
                console.log("autoSelectCard, foundOutEmptyBorder:" + emptyBorder.index + ", card.value:" + card.value);
                this.putCardInBorder(card, emptyBorder);
            }
        }
        this.setData({
            cardList: items
        });
    },

    /**
     *解释从服务器返回的游戏数据,并更新到界面 
     */
    setGameDataFormServer: function (gameData, isShowAfterOnLoad) {
        if (gameData != null) {
            var playerList = gameData.users;
            if (playerList != null) {
                for (let i = 0; i < playerList.length; i++) {
                    if (playerList[i].id == account.userInfo().id) {
                        this.setMyCard(playerList[i].cards);//我的牌
                        if (isShowAfterOnLoad) {
                            let roundResultList = playerList[i].roundResultList;//我的旧的对战记录，如有，会返回的
                            if (roundResultList != null && roundResultList.length > 0) {
                                for (let i = 0; i < roundResultList.length; i++)
                                    resultRecordLists.push(this.gameControl.getStageRecordObject(roundResultList[i], (i + 1)));
                            }
                        }
                    } else
                        this.setOtherCard(playerList[i].cards);
                }
            }
        }
    },

    setMyCard: function (cardList) {
        if (cardList != null) {
            for (let i = 0; i < cardList.length; i++) {
                items[i].value = cardList[i];
                switch (items[i].value) {
                    case VALUE_SCISSORS:
                        items[i].poster = VALUE_SCISSORS_PHOTO_URL;
                        items[i].posterBig = VALUE_SCISSORS_BIG_PHOTO_URL;
                        break;
                    case VALUE_STORE:
                        items[i].poster = VALUE_STORE_PHOTO_URL;
                        items[i].posterBig = VALUE_STORE_BIG_PHOTO_URL;
                        break;
                    case VALUE_PAPRE:
                        items[i].poster = VALUE_PAPRE_PHOTO_URL;
                        items[i].posterBig = VALUE_PAPRE_BIG_PHOTO_URL;
                        break;
                }
            }
        }
        this.setData({
            cardList: items,
        });
    },

    setOtherCard: function (cardList) {
        var otherCards = this.data.cardListOrderUser;
        if (cardList != null) {
            var cardLength = cardList.length;
            for (let i = 0; i < cardLength; i++) {
                //otherCards[i].value = cardList[i].value;
                otherCards[i].value = cardList[i];
                switch (otherCards[i].value) {
                    case VALUE_SCISSORS:
                        otherCards[i].poster = VALUE_SCISSORS_PHOTO_URL;
                        otherCards[i].posterBig = VALUE_SCISSORS_BIG_PHOTO_URL;
                        break;
                    case VALUE_STORE:
                        otherCards[i].poster = VALUE_STORE_PHOTO_URL;
                        otherCards[i].posterBig = VALUE_STORE_BIG_PHOTO_URL;
                        break;
                    case VALUE_PAPRE:
                        otherCards[i].poster = VALUE_PAPRE_PHOTO_URL;
                        otherCards[i].posterBig = VALUE_PAPRE_BIG_PHOTO_URL;
                        break;
                    default:
                        otherCards[i].poster = VALUE_CANNOT_SEE_PHOTO_URL;
                        break;
                }
                // if (i == cardLength - 1)//有一张不显示是什么牌 
                //     otherCards[i].poster = VALUE_CANNOT_SEE_PHOTO_URL;
                console.log("setOtherCard, otherCards[" + i + "].value: " + cardList[i]);
                //otherCards[i].poster = cardList[i].poster;
            }
        }
        this.setData({
            cardListOrderUser: otherCards,
        });
    },

    onReady() {
        // 页面渲染完成
    },

    stopCardTimeCountDownTimer: function () {
        if (selectCardTimeCountDownTimer != null) {
            clearInterval(selectCardTimeCountDownTimer);
            console.log("clearInterval(selectCardTimeCountDownTimer)");
            selectCardTimeCountDownTimer = null;
        }
    },
    /**
     * 确认出牌
     */
    confirmCard: function (event) {
        if (iSendedCard) {
            return;
        }
        this.stopCardTimeCountDownTimer();
        this.autoSelectCard();
        console.log("length:" + mySelectedCards.length);
        var allSelectedCount = 0;
        for (let i = 0; i < mySelectedCards.length; i++) {
            console.log("value:" + mySelectedCards[i].value + "\n");
            if (mySelectedCards[i].value != 0)
                allSelectedCount++;
        }

        if (allSelectedCount == mySelectedCards.length) {
            //this.compareWithAI();
            this.compareWithServer();
        } else {
            my.alert({
                title: '提示',
                content: '请选择所有牌哦~',
                buttonText: '好的',
                success: () => {
                    // my.alert({
                    //   title: '用户点击了「try it」',
                    // });
                },
            });
        }
    },

    /**
     * 将我选的牌发送到服务器
     */
    compareWithServer: function () {
        try {
            var selectedCardData = [];
            for (let i = 0; i < mySelectedCards.length; i++) {
                console.log("push:" + mySelectedCards[i].value);
                selectedCardData.push(mySelectedCards[i].value);
            }
            SocketManager.getInstance().sendMessage({
                senderId: account.userId(),
                //receiverId: roomObject.room.id,
                //receiverId: roomObject.id,
                roomId: roomObject.id,
                data: JSON.stringify(selectedCardData),// 卡片id列表
                cmd: 'CMD_CARD_SEQ'
            });
            iSendedCard = true;
            this.setData({
                iSendedCard: true
            });
        } catch (e) {
            console.error(e);
        }
    },

    //showResultInLayout: function (taSelectedCards_) {
    showResultInLayout: function (resultDatas, ifFromOldData) {
        //修改版本返回的内容，如果 ifFromOldData==true,会多了roundResultList，用于断线重连(或退出重联，房间还存在)时可以知道至今的游戏结果。
        /**
                        * {"data":{
                        * "room":{"id":1638,"type":0,"maxGameRound":3,"currentGameRound":3},
                        * "result":[
                        * {"userId":10098,"cards":[2,3,3],"card":0,"index":0,"cardsResult":["WIN","LOSE","WIN"],"roundResult":"WIN","gameResult":"WIN"},
                        * {"userId":10201,"cards":[1,1,2],"card":0,"index":0,"cardsResult":["LOSE","WIN","LOSE"],"roundResult":"LOSE","gameResult":"LOSE"}
                        * ]},"code":0,"msg":"对局结果"}
                        */
        var orderPlayerCard = [];
        var myCardsResult = [];
        var roundResult;
        var taSelectedCards_ = [];
        var roundResultList = [];//用于断线重连(或退出重联，房间还存在)时可以知道至今的游戏结果
        if (resultDatas != null) {
            maxGameRound = resultDatas.data.room.maxGameRound;
            currentStage = resultDatas.data.room.currentGameRound;
            roomId = resultDatas.data.room.id;
            var resultDataArray = resultDatas.data.result;
            for (let i = 0; i < resultDataArray.length; i++) {
                if (resultDataArray[i].userId == account.userInfo().id) {
                    myCardsResult = resultDataArray[i].cardsResult;//拿出我的结果
                    roundResult = resultDataArray[i].roundResult;
                    roundResultList = resultDataArray[i].roundResultList;
                } else {
                    orderPlayerCard = resultDataArray[i].cards;//拿出对方选的牌
                }
            }
        }
        //转换对方选的牌，用于在界面上显示
        taSelectedCards_ = this.gameControl.resultAdapter(orderPlayerCard);
        var results = [];
        let resultState;
        for (let i = 0; i < myCardsResult.length; i++) {
            resultState = myCardsResult[i];
            switch (resultState) {
                case this.gameControl.winStateStr():
                    results.push("win.png");
                    break;
                case this.gameControl.loseStateStr():
                    results.push("lose.png");
                    break;
                case this.gameControl.drawStateStr():
                    results.push("draw.png");
                    break;
            }
        }

        if (ifFromOldData) {
            //先清空数组
            resultRecordLists = [];
            for (let i = 0; i < roundResultList.length; i++) {
                roundResult = roundResultList[i];
                resultRecordLists.push(this.gameControl.getStageRecordObject(roundResult, (i + 1)));
            }
        } else
            resultRecordLists.push(this.gameControl.getStageRecordObject(roundResult, currentStage));

        var timerForAnimation = setInterval(() => {
            //翻牌动画
            this.setData({ cardAnimationInfo: this.gameControl.getAnimation(180).export(), });
            clearInterval(timerForAnimation);
        }, 600);

        var timer2 = setInterval(() => {
            this.setData({
                resultLists: results,
                resultRecordLists: resultRecordLists,
                orderPlayerConfirmed: true,
                taSelectedCards: taSelectedCards_,
                showTaCard: true,
            });
            clearInterval(timer2);
        }, 1000);

        console.log("maxGameRound:" + maxGameRound);
        console.log("currentStage:" + currentStage);

        if (currentStage >= maxGameRound) {//结束当前局
            this.finishGame();
        } else {
            if (ifFromOldData) {
                this.newGame();
                return;
            }
            //进入下一盘
            var timerNextGame = setInterval(() => {
                this.newGame();
                clearInterval(timerNextGame);
            }, 4000);
        }
    },

    finishGame: function () {
        var timerRequestGamePrize = setInterval(() => {
            this.requestGamePrize();
            clearInterval(timerRequestGamePrize);
        }, 2000);
    },

    requestGamePrize: function () {
        my.showLoading({
            content: '请稍等...',
        });
        requestGameResult(roomId, account.userId()).then(data => {
            //my.hideLoading();
            try {
                //本轮变动的积分
                my.setStorageSync({
                    key: 'scoreChange',
                    data: data.scoreChange
                });
                //本轮积分的字付串
                my.setStorageSync({
                    key: 'scoreStr',
                    data: data.scoreStr
                });
                //局数列表
                my.setStorageSync({
                    key: 'gameResultStr',
                    data: data.gameResultStr
                });
                //保存排行榜
                var rankingArray = data.ranking;
                my.setStorageSync({
                    key: 'ranking',
                    data: rankingArray
                });
                //保存奖品列表
                var prizeArray = data.prize;
                my.setStorageSync({
                    key: 'prize',
                    data: prizeArray
                });
                //对战结果
                var gameResultArray = data.gameResult;
                my.setStorageSync({
                    key: 'gameResult',
                    data: gameResultArray
                });

                ////////////数据请求成功后，再作跳转/////////////
                var myGameResult = data.result;
                this.gameControl.goToResult(myGameResult, my);
                // setTimeout(() => {
                //     my.hideLoading();
                //     this.gameControl.goToResult(myGameResult, my);
                // }, 1000)

            } catch (e) {
                my.hideLoading();
                var contentStr = '跳转结果页失败: ' + e;
                console.error("requestGameResult error", e);
                my.showToast({
                    type: 'fail',
                    content: contentStr,
                    duration: 5000,
                });
                this.gameControl.goToIndex();
            }
        }).catch(e => {
            my.hideLoading();
            var contentStr = '请求对战结果页失败: ' + e;
            console.error("requestGameResult error", e);
            my.showToast({
                type: 'fail',
                content: contentStr,
                duration: 5000,
                fdsfds
            });
            this.gameControl.goToIndex();
        });
    },

    /**
     * 在本地作双方的结果对比
     */
    // compareWithAI: function () {
    //     taSelectedCards: [
    //         { value: VALUE_STORE, url: VALUE_STORE_BIG_PHOTO_URL },
    //         { value: VALUE_SCISSORS, url: VALUE_SCISSORS_BIG_PHOTO_URL },
    //         { value: VALUE_PAPRE, url: VALUE_PAPRE_BIG_PHOTO_URL }];
    //     this.showResultInLayout(taSelectedCards);
    // },

    /**
     * 卡在移动前，手指碰到的时候
     */
    moveStart: function (e) {
        if (iSendedCard)
            return;

        index = e.target.id;
        items[index].touched = true;
        // items[index].lx = e.touches[0].clientX;  // 记录点击时的坐标值  
        // items[index].ly = e.touches[0].clientY;
        //赋值,使页面刷新
        // this.setData({
        //     cardList: items
        // })
        if (index == 0) {
            this.setData({
                'cardList[0].touched': items[index].touched,
            })
        } else if (index == 1) {
            this.setData({
                'cardList[1].touched': items[index].touched,
            })
        } else {
            this.setData({
                'cardList[2].touched': items[index].touched,
            })
        }
    },

    /**
     * 卡在移动中
     * 1px=1.666667rpx,大约，相对的
     */
    moveCard: function (e) {
        if (iSendedCard)
            return;
        //items[index].poster = items[index].posterBig;
        //移动时的坐标值也写图片的属性里  
        // items[index]._lx = e.touches[0].clientX;
        // items[index]._ly = e.touches[0].clientY;

        // //追加改动值  
        // items[index].x += items[index]._lx - items[index].lx;
        // items[index].y += items[index]._ly - items[index].ly;

        // //把新的值赋给老的值  
        // items[index].lx = e.touches[0].clientX;
        // items[index].ly = e.touches[0].clientY;

        items[index].x = e.touches[0].clientX * 1.8;
        items[index].y = e.touches[0].clientY * 1.8;

        //判断是否拖动到框的上面，如是，再判断框里是否有牌，有牌就替换
        // var movingCard = items[index];
        // var collideBorder = this.gameControl.isCollide(movingCard, borderItems);
        // if (collideBorder != null) {
        //     console.log("collideBorder.putId:" + collideBorder.putId);
        // }

        //每次 setData 数据量要小，不要直接修改 this.data 然后整个 set，这样会导致传输数据量过大影响渲染性能
        if (index == 0) {
            this.setData({
                'cardList[0].x': items[index].x,
                'cardList[0].y': items[index].y
            })
        } else if (index == 1) {
            this.setData({
                'cardList[1].x': items[index].x,
                'cardList[1].y': items[index].y
            })
        } else {
            this.setData({
                'cardList[2].x': items[index].x,
                'cardList[2].y': items[index].y
            })
        }
    },


    /**
     * 卡牌移动后的事件,当手指离开牌后
     */
    moveEnd: function (e) {
        if (iSendedCard)
            return;
        //var player = items[index];
        var card = items[index];
        card.touched = false;
        //var collideBorder = this.isCollide(card);
        var collideBorder = this.gameControl.isCollide(card, borderItems);
        if (collideBorder != null) {
            console.log("collideBorder.putId:" + collideBorder.putId);
            //如果这个框还没放
            if (!this.borderHadCard(collideBorder))
                this.putCardInBorder(card, collideBorder);
            else
                this.putBackCard(card, collideBorder);
        } else {
            //牌拖到没有放到框的范围，判断框上是否还放着牌
            this.putBackCard(card, collideBorder);
        }
        this.setData({
            cardList: items
        });
    },

    /**
     * 判断框内是否放到牌
     */
    borderHadCard: function (border) {
        return border.putId > EMPTY_BORDER_VALUE;
    },

    /**
     * 找到牌所放到的框
     */
    foundOutPutBorderByCard: function (card) {
        for (let i = 0; i < borderItems.length; i++) {
            //if (borderItems[i] != null && borderItems[i].putId == card.value) {
            if (borderItems[i] != null && borderItems[i].putId == card.index) {
                return borderItems[i];
            }
        }
        return null;
    },

    /**
     * 找到这个框所放的牌
     */
    foundOutPutCardInBorder: function (border) {
        for (let i = 0; i < items.length; i++) {
            //if (items[i] != null && items[i].value == border.putId) {
            if (items[i] != null && items[i].index == border.putId) {
                return items[i];
            }
        }
        return null;
    },

    /**
     * 处理:牌移动后,移到的框是有牌的
     */
    putBackCard: function (card, border) {
        if (border != null) {
            //if (card.value == border.putId) {
            if (card.index == border.putId) {
                //松手后,如果拖动是框上的卡，如果还在框内，返回框内
                //现在value有可能一样的，还要加上index的判断
                card.put = true;
                card.x = border.x;
                card.y = border.y;
                console.log("moveEnd,card.index:" + card.index + ", border.putId:" + border.putId + ", card.value:" + card.value);
            } else {
                //拖到a卡松手后,框上的有其它的卡，将a卡放到空的框
                var emptyBorder = this.foundOutEmptyBorder();
                if (emptyBorder != null) {
                    console.log("moveEnd, foundOutEmptyBorder:" + emptyBorder.index + ", card.value:" + card.value);
                    this.putCardInBorder(card, emptyBorder);
                } else {
                    //框内已有放到牌的,把他们互换;
                    //1.找到当前拖动的牌拖动前的框
                    var oldBorder = this.foundOutPutBorderByCard(card);
                    //2.找到拖动到的框所放的牌
                    var existCard = this.foundOutPutCardInBorder(border);
                    //3.互换
                    if (existCard != null && oldBorder != null)
                        this.putCardInBorderSetData(existCard, oldBorder);

                    this.putCardInBorderSetData(card, border);
                }
            }
        } else {
            card.put = false;
            card.x = card.ox;
            card.y = card.oy;
            //卡放在空地方，要清空之前放的位置
            for (let i = 0; i < borderItems.length; i++) {
                //if (borderItems[i].putId == card.value) {
                if (borderItems[i].putId == card.index) {
                    borderItems[i].putId = EMPTY_BORDER_VALUE;
                    console.log(borderItems[i].putId + ", " + card.value + ",清空框" + i);
                    break;
                }
            }
        }
    },

    putCardInBorderSetData: function (card, border) {
        card.put = true;
        //border.putId = card.value;
        border.putId = card.index;
        card.x = border.x;
        card.y = border.y;
        var borderIndex = border.index;
        //mySelectedCards[index].value = border.value;
        mySelectedCards[borderIndex].value = card.value;
        console.log(border.index + "框放了:" + card.value);
    },

    /**
     * 放一张卡到框上,处理卡的互换等
     */
    putCardInBorder: function (card, border) {
        if (border.putId == EMPTY_BORDER_VALUE && !card.put) {
            this.putCardInBorderSetData(card, border);
            //检测是否只有一张卡还没放,如是,找到空的框放进去
            var lastNotPutCard = this.foundOutLastNotPutCard();
            if (lastNotPutCard != null) {
                var emptyBorder = this.foundOutEmptyBorder();
                if (emptyBorder != null)
                    this.putCardInBorder(lastNotPutCard, emptyBorder);
            }
        } else {
            //将一张已放过的a卡拖到另一个框；
            //判断另一个框是否有放过牌了,如没有,找出旧框置空,将a卡放到新框上;如有，两卡互换
            if (border.putId == EMPTY_BORDER_VALUE) {//框是没有放过牌的
                console.log("拖到其它框,框无放过牌");
                var putedBorder = null;
                for (let i = 0; i < borderItems.length; i++) {
                    putedBorder = borderItems[i];
                    //if (borderItems[i] != null && borderItems[i].putId == card.value) {
                    if (borderItems[i] != null && borderItems[i].putId == card.index) {
                        //旧框置空
                        putedBorder.putId = EMPTY_BORDER_VALUE;
                        mySelectedCards[putedBorder.index].value = 0;
                        console.log("置空旧框:" + putedBorder.index);
                        break;
                    }
                }
                this.putCardInBorderSetData(card, border);
            } else {
                console.log("拖到其它框,框已放牌");
            }
        }
    },

    /**
     * 返回最后一张还没放的牌
     */
    foundOutLastNotPutCard: function () {
        var putedCount = 0;
        for (let i = 0; i < items.length; i++) {
            var card = items[i];
            if (card.put)
                putedCount++;
        }
        if (putedCount == (items.length - 1)) {
            for (let i = 0; i < items.length; i++) {
                var card = items[i];
                if (!card.put)
                    return card;
            }
        }
        return null;
    },

    /**
     * 返回一个还没放牌的框 
     */
    foundOutEmptyBorder: function () {
        for (let i = 0; i < borderItems.length; i++) {
            var border = borderItems[i];
            if (border.putId == EMPTY_BORDER_VALUE) {
                return border;
                break;
            }
        }
        return null;
    },

    imageLoad: function (e) {
        var imageSize = utils.getScaleImageSize(e)
        this.setData({
            // imagewidth: imageSize.imageWidth, 
            // imageheight: imageSize.imageHeight 
        })
    }
});