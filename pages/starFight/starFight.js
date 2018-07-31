const account = require('../../manager/accountManager.js');
import { baseSocketUrl } from "../../network/apiService.js";
import { requestGameResult } from "../../network/apiService.js";
import { GameControl } from "../../manager/gameControl.js";
import { SocketManager } from "../../manager/socketManager.js";
const gameInterface = require('../../interfaces/gameInterface.js');
const GameInterfaceImpl = require('../../interfaces/gameInterfaceImpl.js');

var gameControl;
//var app = getApp();
const VALUE_SCISSORS = 1;
const VALUE_STORE = 2;
const VALUE_PAPRE = 3;

// const WIN_STATE = 1;
// const LOSE_STATE = -1;
// const DRAW_STATE = 0;

const EMPTY_BORDER_VALUE = -1;

//var SELECT_CARD_TIME_LIMIT = 60;
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
var items = [];
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

//"confirmEndTime": 1530686212001 // 思考结束时间（毫秒时间戳）
var confirmEndTime;// 思考结束时间（毫秒时间戳）
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
//var roomObject = {};
var gameInitData = {};
//对手列表
var orderPlayerList = [];

var cardList = [], borderList = [], borderListOrderUser = [], cardListOrderUser = [];

var showTaCard, iSendedCard, orderPlayerConfirmed, showResult;
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

var gameInterfaceImpl;
//var justShowCardAnimation = false;
var backFormGaming = false;
const keyForStoreCache = "cardsUserForGameBackThreeCard";

Page({
    data: {
        timeCountDownX: timeCountDownX,
        timeCountDownY: timeCountDownY,
        //countDownTime: SELECT_CARD_TIME_LIMIT,
        showResult: false,
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
        //roomObject: {},
    },

    resetGameData: function () {
        // mySelectedCards = [{ value: 0 }, { value: 0 }, { value: 0 }];
        // ////定义剪刀==1，石头==2，布==3  
        // this.data.cardList = [
        //     { touched: false, index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { touched: false, index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { touched: false, index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
        // items = this.data.cardList;
        this.resetMyCard();

        // this.data.borderList = [
        //     { index: 0, x: border1X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
        //     { index: 1, x: border2X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
        //     { index: 2, x: border3X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }];
        // borderItems = this.data.borderList;
        this.resetMyBorderList();

        this.data.borderListOrderUser = [
            { index: 0, x: border1X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 1, x: border2X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 2, x: border3X, y: borderOtherY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }];

        this.data.cardListOrderUser = [
            { value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        //this.countDownTime = SELECT_CARD_TIME_LIMIT;
    },

    resetMyBorderList: function () {
        this.data.borderList = [
            { index: 0, x: border1X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 1, x: border2X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE },
            { index: 2, x: border3X, y: borderY, width: borderWidth, height: cardHeight, putId: EMPTY_BORDER_VALUE }];

        borderItems = this.data.borderList;
    },

    resetMyCard: function () {
        mySelectedCards = [{ value: 0 }, { value: 0 }, { value: 0 }];
        ////定义剪刀==1，石头==2，布==3  
        this.data.cardList = [
            { touched: false, index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        items = this.data.cardList;
    },

    /**
     * 开始一盘新游戏,3盘两胜才算赢一局
     */
    newGame: function () {
        this.setData({
            //回到0度，准备下一次翻的动画
            cardAnimationInfo: this.gameControl.getAnimation(0).export()
        });
        this.resetGameData();
    },

    /**
  * 接口的初始化与使用
  */
    initInterface: function () {
        //接口的实现
        gameInterfaceImpl = new GameInterfaceImpl();
        //使用先前执行接口检测
        gameInterface.checkImpl(gameInterfaceImpl);
    },

    onLoad(query) {
        this.initInterface();
        //isUnLoaded = false;
        this.gameControl = new GameControl();

        gameInitData = my.getStorageSync({ key: 'gameInfoData' }).data;

        let isGaming = my.getStorageSync({ key: 'isGaming' }).data;

        this.resetGameData();

        showedGuide = my.getStorageSync({ key: 'showedGuide' }).data;
        if (!showedGuide) {
            my.setStorageSync({ key: 'showedGuide', data: true });
        }

        //roomObject = gameInitData.room;
        roomId = gameInitData.id;
        orderPlayerList = gameInitData.userList;
        //const that = this;
        //items = this.data.cardList;
        //borderItems = this.data.borderList;
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

        if (!isGaming) {
            resultLists = [];
            resultRecordLists = [];
            //gameTotalResult = 0;
            iSendedCard = false;
            orderPlayerConfirmed = false;
            showTaCard = false;
            showResult = false;

            //this.resetGameData();

            this.setData({
                showResult: showResult,
                showTaCard: showTaCard,
                orderPlayerConfirmed: orderPlayerConfirmed,
                iSendedCard: iSendedCard,
                showedGuide: showedGuide,
                resultLists: resultLists,//真面会缓存数据，所以清空数据都要更新到页面
                //countDownTime: roomObject.countDownTime,
                //hard code!!!!!!!!!!!
                resultRecordLists: resultRecordLists,
                //countDownTime: SELECT_CARD_TIME_LIMIT,
                player: player_,
                me: account.userInfo(),
                cardList: items//<-从resetGameData里抽到这里 
            })
            this.setGameDataFormServer(gameInitData);

        } else {//isGaming
            backFormGaming = true;

            my.setStorageSync({
                key: 'isGaming',
                data: false
            });
            this.setData({
                showedGuide: showedGuide,
                //countDownTime: SELECT_CARD_TIME_LIMIT,
                player: player_,
                me: account.userInfo(),
            });
            this.setGameView(gameInitData);
        }
        this.setGameCountDownTime(gameInitData);
        this.startTimeCountDown();
        this.initSocket();
        //this.listOldResultRecordList();
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

    setGameCountDownTime: function (gameData) {
        countDownTime = gameInterfaceImpl.getGameCountDownTime(gameData);
        this.setData({
            countDownTime: countDownTime,
        });
    },

    /**
     * 根据数据显示场景
     */
    setGameView: function (gameData) {
        if (gameData == null) return;

        maxGameRound = gameData.maxGameRound;
        currentStage = gameData.currentGameRound;

        console.log("maxGameRound:" + maxGameRound);
        console.log("currentStage:" + currentStage);

        let myCardInfo = null, otherCardInfo = null;
        var playerList = gameData.userList;

        //得出双方的游戏数据
        if (playerList != null && playerList.length > 0) {
            for (let i = 0; i < playerList.length; i++) {
                if (account.userInfo().id == playerList[i].id) {
                    myCardInfo = playerList[i].cardInfo;
                } else {
                    otherCardInfo = playerList[i].cardInfo;
                }
            }
        }

        var initMyCards = [], initOtherCards = [];
        /////////////////显示我的游戏数据///////////////
        var myConfirmed;
        if (myCardInfo != null) {
            initMyCards = myCardInfo.initCards;//// 初始出牌的数组(原来为[1,3,2]),现修改为confirmCards结构一样 
            let currentRoundResult = myCardInfo.currentRoundResult;// 当前局的结果
            let roundResultList = myCardInfo.roundResultList;//["LOSE", "WIN", "LOSE"], 前几局游戏的结果（数组长度可变）
            let currentCard = myCardInfo.currentCard; // 当前出的牌（用于逐张出牌）
            let currentIndex = myCardInfo.currentIndex;// 当前出牌在初始手牌的索引值（用于逐张出牌）
            myConfirmed = myCardInfo.isConfirmed;// 该是否已确认出牌
            let confirmCards = myCardInfo.confirmCards;// 出牌结果
            // "confirmCards": [{ // 出牌结果
            //     "card": 1, // 卡牌类型
            //     "index": 0, // 卡牌索引值
            //     "result": "LOSE" // 出牌结果
            // }, {
            //     "card": 1,
            //     "index": 0,
            //     "result": "WIN"
            // }, {
            //     "card": 2,
            //     "index": 0,
            //     "result": "LOSE"
            // }]

            if (myConfirmed == 0) {//我还没确认牌
                this.resetMyBorderList();
                this.resetMyCard();
                this.startTimeCountDown();
                iSendedCard = false;
                this.setData({
                    iSendedCard: iSendedCard,
                });
                this.setCardByList(initMyCards, items, true);
            } else {
                console.log("backFormGaming:" + backFormGaming);
                //我已确认牌
                if (backFormGaming) {
                    backFormGaming = false;
                    let cardsUserForGameBack = my.getStorageSync({ key: keyForStoreCache }).data;
                    if (cardsUserForGameBack != null) {
                        items = cardsUserForGameBack;
                        //请空缓存
                        my.setStorageSync({
                            key: keyForStoreCache,
                            data: null
                        });
                    }
                    this.setData({
                        iSendedCard: true,
                        cardList: items
                    });
                    // iSendedCard = false;//在重回游戏的时候，可以显示我的牌在放置区上
                    // this.confirmMyCardByServer(myCardInfo);//(重回后到这里等于重新出牌。)
                }
            }

            var results = [];
            if (confirmCards != null) {
                let resultState;
                for (let i = 0; i < confirmCards.length; i++) {
                    resultState = confirmCards[i].result;
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
            }

            if (roundResultList != null) {
                //先清空数组
                resultRecordLists = [];
                for (let i = 0; i < roundResultList.length; i++) {
                    let roundResult = roundResultList[i];
                    resultRecordLists.push(this.gameControl.getStageRecordObject(roundResult, (i + 1)));
                }
                //一有结果就显示
                this.setData({
                    resultRecordLists: resultRecordLists
                });
            }
        }///////////////////////////////end 显示我的游戏数据//////////////////

        ///////////////显示对方的游戏数据////////////////
        var taSelectedCards_ = [];
        var otherConfirmed;
        if (otherCardInfo != null) {
            initOtherCards = otherCardInfo.initCards;//// 初始出牌的数组(如刚发牌时为[1,3,2]) if (initMyCards != null)
            otherConfirmed = otherCardInfo.isConfirmed;// 该是否已确认出牌
            let currentRoundResult = otherCardInfo.currentRoundResult;// 当前局的结果
            let roundResultList = otherCardInfo.roundResultList;//["LOSE", "WIN", "LOSE"], 前几局游戏的结果（数组长度可变）
            let currentCard = otherCardInfo.currentCard; // 当前出的牌（用于逐张出牌）
            let currentIndex = otherCardInfo.currentIndex;// 当前出牌在初始手牌的索引值（用于逐张出牌）
            let confirmCards = otherCardInfo.confirmCards;// 出牌结果 [{"card":3,"index":0,"result":"WIN"},{"card":2,"index":0,"result":"WIN"},{"card":3,"index":0,"result":"LOSE"}]

            if (otherConfirmed == 1) {
                this.orderPlayerConfirmedCard();
            } else {
                orderPlayerConfirmed = false;
                this.setData({
                    orderPlayerConfirmed: orderPlayerConfirmed,
                });
                let otherCards = this.data.cardListOrderUser;
                this.setCardByList(initOtherCards, otherCards, false);
            }

            if (confirmCards != null) {
                var temp = [];
                for (let i = 0; i < confirmCards.length; i++)
                    temp.push(confirmCards[i].card);
                taSelectedCards_ = this.gameControl.resultAdapter(temp);
                showTaCard = true;
            } else
                showTaCard = false;

        }//////////////////////////////////////end 显示对方的游戏数据///////////////

        //初始化我的牌数据
        // if (myConfirmed == 0)
        //     this.setCardByList(initMyCards, items, true);
        // //初始化对方的牌数据
        // if (otherConfirmed == 0) {
        //     let otherCards = this.data.cardListOrderUser;
        //     this.setCardByList(initOtherCards, otherCards, false);
        // }

        //从新一盘时，双方都是没确认的
        if (otherConfirmed == 0 && myConfirmed == 0) {
            showResult = false;
            // this.setCardByList(initMyCards, items, true);
            // let otherCards = this.data.cardListOrderUser;
            // this.setCardByList(initOtherCards, otherCards, false);
        }

        if (otherConfirmed == 1 && myConfirmed == 1)
            showResult = true;

        if (showResult) {
            ////////////////做动画显示和刷新页面////////////
            var timerForAnimation = setInterval(() => {
                //翻牌动画
                this.setData({ cardAnimationInfo: this.gameControl.getAnimation(180).export(), });
                clearInterval(timerForAnimation);
            }, 600);

            var timer2 = setInterval(() => {
                this.setData({
                    resultLists: results,
                    //resultRecordLists: resultRecordLists,
                    orderPlayerConfirmed: true,
                    taSelectedCards: taSelectedCards_,
                    showTaCard: showTaCard,
                    showResult: showResult
                });
                clearInterval(timer2);
            }, 1000);

            if (currentStage >= maxGameRound) {//结束当前局
                this.finishGame();
            } else {
                //进入下一盘
                var timerNextGame = setInterval(() => {
                    this.newGame();
                    clearInterval(timerNextGame);
                }, 4000);
            }
        } else {//不是显示结果
            //对方是否已确认了
            orderPlayerConfirmed = (otherConfirmed == 1) ? true : false;
            showTaCard = (myConfirmed == 1) ? true : false;
            this.setData({
                showResult: showResult,
                orderPlayerConfirmed: orderPlayerConfirmed,
                showTaCard: showTaCard
            });
        }
    },

    initSocket: function () {
        const that = this;
        var socketListener = function (res) {
            //if (isUnLoaded) return;
            console.log("res.cmd in starFight:" + res.cmd);
            if (res.msg == "最终结果")//现猜测当网络慢时，这个cmd的数据会有影响
                return;
            //console.log(res.data);
            //if (res.cmd && res.senderId != account.userId()) {
            if (res.cmd) {
                switch (res.cmd) {
                    case 'RSP_GAME_FAIL'://出牌错误
                        // my.showToast({
                        //     type: 'fail',
                        //     content: "数据出现错误，跳转中...",
                        //     duration: 5000,
                        // });
                        // this.gameControl.goToIndex(my);
                        break;
                    case 'RSP_GAME_INFO':
                        //that.gameInterfaceImpl.showGameInfoForThreeCard(res.data);
                        that.setGameCountDownTime(res.data);
                        that.setGameView(res.data);
                        break;
                    case 'RSP_USER_CONFIRM'://用户or服务器已帮我确认卡牌顺序
                        if (res.data != null) {
                            var myCardInfo, otherCardInfo;
                            var playerList = res.data.userList;
                            if (playerList != null && playerList.length > 0) {
                                for (let i = 0; i < playerList.length; i++) {
                                    if (account.userInfo().id == playerList[i].id) {
                                        myCardInfo = playerList[i].cardInfo;
                                    } else {
                                        otherCardInfo = playerList[i].cardInfo;
                                    }
                                }
                            }

                            if (myCardInfo != null) {
                                //这里是服务器，帮我出牌了，我只做动画展示
                                if (myCardInfo.isConfirmed == 1) {
                                    //justShowCardAnimation = true;
                                    //从服务器取出了的牌
                                    that.confirmMyCardByServer(myCardInfo);
                                    console.log("server call me confirmCard, but just show animation");
                                }
                            }

                            if (otherCardInfo != null) {
                                if (otherCardInfo.isConfirmed == 1) {
                                    //对方确认出牌
                                    that.orderPlayerConfirmedCard();
                                    console.log("order player confirmCard");
                                }
                            }
                            // if (account.userId() == res.data.userId) {
                            //     //服务器叫我确认出牌
                            //     that.confirmCard();
                            //     console.log("server call me confirmCard");
                            // } else {
                            //     //对方确认出牌
                            //     that.orderPlayerConfirmedCard();
                            //     console.log("order player confirmCard");
                            // }
                        } else {
                            my.showToast({
                                type: 'fail',
                                content: 'RSP_USER_CONFIRM 的数据为空',
                                duration: 5000,
                            });
                        }
                        break;
                    // case 'RSP_GAME_RESULT'://比赛结果
                    //     var resultDatas = res.data;
                    //     that.showResultInLayout(resultDatas, false);
                    //     break;
                    default: break
                }
            }
        };
        SocketManager.getInstance().subscribeSocket(socketListener);
        this.socketListener = socketListener;
    },

    confirmMyCardByServer: function (myCardInfo) {
        if (myCardInfo == null) return;
        //从服务器取出了的牌
        let confirmCards = myCardInfo.confirmCards;
        if (confirmCards != null) {
            let temp = [];
            for (let i = 0; i < confirmCards.length; i++)
                temp.push(confirmCards[i].card);
            mySelectedCards = this.gameControl.resultAdapter(temp);
        }
        this.confirmCard();
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
        this.stopCardTimeCountDownTimer();
        SocketManager.getInstance().unsubscribeSocket(this.socketListener);
    },

    /**
     * 显示选牌倒计时
     */
    startTimeCountDown: function () {
        //const that = this;
        this.stopCardTimeCountDownTimer();
        selectCardTimeCountDownTimer = setInterval(() => {
            //that.countDownTime--;
            countDownTime--;
            if (countDownTime <= 0)
                countDownTime = 0;
            this.setData({
                //countDownTime: that.countDownTime,
                countDownTime: countDownTime,
            });
            //if (that.countDownTime == 0) {
            if (countDownTime <= 0) {
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

        //缓存用作重回游戏时显示
        my.setStorageSync({
            key: keyForStoreCache,
            data: items
        });

        this.setData({
            cardList: items
        });
    },

    /**
     *解释从服务器返回的游戏数据,并更新到界面 
     */
    setGameDataFormServer: function (gameData) {
        //排好我的牌
        this.setCard(gameData, items, true);
        //排好对方的牌
        var otherCards = this.data.cardListOrderUser;
        this.setCard(gameData, otherCards, false);
    },

    // setMyCard:function(cardList){
    // },

    setCardByList: function (cardList, items, isMy) {
        //var zeroCount = 0, cardLength = 0;
        //var hadSave = false;
        if (cardList != null) {
            let cardLength = cardList.length;
            for (let i = 0; i < cardLength; i++) {
                if (isMy) {
                    if (cardList[i] == 0) {
                        continue;
                    } else {
                        // if (!hadSave) {
                        //     my.setStorageSync({
                        //         key: 'cardsUserForGameBack',
                        //         data: cardList
                        //     });
                        //     hadSave = true;
                        //     console.log("save for cardsUserForGameBack");
                        // }
                    }
                }
                items[i].value = cardList[i].card;
                items[i].put = false;
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
                    default:
                        items[i].poster = VALUE_CANNOT_SEE_PHOTO_URL;
                        break;
                }
            }
        }

        if (isMy) {
            this.setData({
                cardList: items,
            });
        } else {
            this.setData({
                cardListOrderUser: items,
            });
        }
    },

    setCard: function (gameData, items, isMy) {
        if (gameData != null) {
            var playerList = gameData.userList;
            if (playerList != null) {
                for (let i = 0; i < playerList.length; i++) {
                    if (isMy ? (playerList[i].id == account.userInfo().id) : (playerList[i].id != account.userInfo().id)) {
                        let cardInfo = playerList[i].cardInfo;
                        let cardList = cardInfo.initCards;//initCards结构跟confirmCards一样
                        //console.log(cardList);
                        if (cardList != null) {
                            //var hadSave = false;
                            var cardLength = cardList.length;
                            for (let i = 0; i < cardLength; i++) {
                                items[i].value = cardList[i].card;
                                if (isMy) {
                                    if (cardList[i] == 0)
                                        continue;
                                    else {
                                        //在刚发牌时也要保存,不然有时只取在确认牌时存的牌
                                        // if (!hadSave) {
                                        //     hadSave = true;
                                        //     my.setStorageSync({
                                        //         key: 'cardsUserForGameBack',
                                        //         data: cardList
                                        //     });
                                        // }
                                    }
                                }//end if
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
                                    default:
                                        items[i].poster = VALUE_CANNOT_SEE_PHOTO_URL;
                                        break;
                                }
                                // console.log("x:"+items[i].x);
                                // console.log("y:"+items[i].y);
                            }//end for
                        }
                    }
                }//end for
            }
        }
        if (isMy) {
            this.setData({
                cardList: items,
            });
        } else {
            this.setData({
                cardListOrderUser: items,
            });
        }
        //return items;
    },

    stopCardTimeCountDownTimer: function () {
        if (selectCardTimeCountDownTimer != null) {
            clearInterval(selectCardTimeCountDownTimer);
            console.log("clearInterval(selectCardTimeCountDownTimer)");
            selectCardTimeCountDownTimer = null;
        }
    },

    /**
     * 本地自已确认出牌
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
            //这里移牌后，还是要保存回items,用于游戏重回的展示
            // let newCardList = [];
            // for (let i = 0; i < mySelectedCards.length; i++)
            //     newCardList.push(mySelectedCards[i].value);
            // my.setStorageSync({
            //     key: 'cardsUserForGameBack',
            //     data: newCardList
            // });
            ////end///////
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
            // if (!justShowCardAnimation) {
            //     gameInterfaceImpl.compareWithServer(0, mySelectedCards, roomId);
            // }
            // justShowCardAnimation = false;
            gameInterfaceImpl.compareWithServer(0, mySelectedCards, roomId);
            iSendedCard = true;
            this.setData({
                iSendedCard: true
            });

        } catch (e) {
            console.error(e);
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
                console.log("myGameResult:");
                console.log(myGameResult);
                this.gameControl.goToResult(myGameResult, my);
                // setTimeout(() => {
                //     my.hideLoading();
                //     this.gameControl.goToResult(myGameResult, my);
                // }, 1000)

            } catch (e) {
                my.hideLoading();
                var contentStr = '跳转结果页失败,现在回到首页...';
                my.showToast({
                    type: 'fail',
                    content: contentStr,
                    duration: 5000,
                });
                this.gameControl.goToIndex(my);
                console.error("requestGameResult1 error:");
                console.error(e);
            }
        }).catch(e => {
            my.hideLoading();
            var contentStr = '跳转结果页失败,现在回到首页...';
            my.showToast({
                type: 'fail',
                content: contentStr,
                duration: 5000,
                fdsfds
            });
            this.gameControl.goToIndex(my);
            console.error("requestGameResult2 error:");
            console.error(e);
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
                //break;
            }
        }
        return null;
    },

    /*imageLoad: function (e) {
        var imageSize = utils.getScaleImageSize(e)
        this.setData({
            // imagewidth: imageSize.imageWidth, 
            // imageheight: imageSize.imageHeight 
        })
    }*/
});