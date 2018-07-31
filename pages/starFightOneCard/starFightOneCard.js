import { GameControl } from "../../manager/gameControl.js";
//import { SocketHelper } from '../../network/SocketHelper.js'
const account = require('../../manager/accountManager.js');
//import { baseSocketUrl } from "../../network/apiService.js";
import { requestGameResult } from "../../network/apiService.js";
import { SocketManager } from "../../manager/socketManager.js";
const gameInterface = require('../../interfaces/gameInterface.js');
const GameInterfaceImpl = require('../../interfaces/gameInterfaceImpl.js');

const imageSrc = "../../images/";  //图片url前缀
var gameControl;
const VALUE_SCISSORS_PHOTO_URL = imageSrc + "value1p.png";
const VALUE_STORE_PHOTO_URL = imageSrc + "value2p.png";
const VALUE_PAPRE_PHOTO_URL = imageSrc + "value3p.png";

const VALUE_SCISSORS_BIG_PHOTO_URL = imageSrc + "value1p_big.png";
const VALUE_STORE_BIG_PHOTO_URL = imageSrc + "value2p_big.png";
const VALUE_PAPRE_BIG_PHOTO_URL = imageSrc + "value3p_big.png";

const WIN_FOR_ONE_CARD = "win_for_one_card.png";
const DRAW_FOR_ONE_CARD = "draw_for_one_card.png";
const LOSE_FOR_ONE_CARD = "lose_for_one_card.png";

const RESULT_RECORD_WIN = "result_record_win.png";
const RESULT_RECORD_LOSE = "result_record_lose.png";
const RESULT_RECORD_DRAW = "result_record_draw.png";

const VALUE_SCISSORS = 1;
const VALUE_STORE = 2;
const VALUE_PAPRE = 3;

const READY_STATE = -2;//还没开始
const WIN_STATE = 1;
const LOSE_STATE = -1;
const DRAW_STATE = 0;
const GAMED_STATE = 2;//已比赛过

var items;
var borderItems;
var index = 0;//当前在拖动的牌的index
// var borderWidth = 115;
// var borderHeight = 147;
var borderWidth = 190;
var borderHeight = 256;//rate: 0.74
// var cardWidth = 114;
// var cardHeight = 146;
var cardWidth = 134;
var cardHeight = 171;//rate: 0.78
//我的卡和框的location
const cardY = 860;
const card1X = 90, card2X = 240, card3X = 390;
const border1X = 480;
const borderY = 450;
//对手卡和框的location
const borderOtherX = 80
const cardOrderY = 220;
const borderOtherY = borderY;
//倒计时的location
const timeCountDownX = 77;
const timeCountDownY = 740;
//我选择了的牌,单张的玩张,现在是放卡的对像
//var mySelectedCards = [{ value: 0 }];
var mySelectedCards = [];
//对手选择的牌,这个还是保持以下结构
var taSelectedCards = [{ value: VALUE_STORE, url: VALUE_STORE_BIG_PHOTO_URL }];
//// 思考结束时间（毫秒时间戳）
var confirmEndTime;
///当前局的第几盘
var currentStage = 1;
//当前盘出了多少张牌，要出了三张牌才算一盘
var currentStageSendedCardCount = 1;
//当前要出三张牌才能完成当前盘
const stageNeedSendCardCount = 3
//一局可玩多少盘
var maxGameRound = 3;
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
var orderPlayerList = []

var cardList = [], borderList = [], borderListOrderUser = [], cardListOrderUser = [];

var showTaCard, iSendedCard, orderPlayerConfirmed;

//const SELECT_CARD_TIME_LIMIT = 60;

const EMPTY_BORDER_VALUE = -1;

const VALUE_CANNOT_SEE_PHOTO_URL = imageSrc + "border_cannot_see_big.png";

//放牌倒计时
var countDownTime;
var selectCardTimeCountDownTimer;
var orderPlayerConfirmed;
var isSocketInit = false;
var showResult;
//var justShowCardAnimation = false;
var backFormGaming = false;
const keyForStoreCache = "cardsUserForGameBackSingleCard";
const keyForStoreCacheForOther = "cardsUserForGameBackSingleCardForOther";
var gameInterfaceImpl;

Page({
    data: {
        timeCountDownX: timeCountDownX,
        timeCountDownY: timeCountDownY,
        showTaCard: false,
        iSendedCard: false,
        orderPlayerConfirmed: false,
        /**
        * cardList和cardListOrderUser的数据都是服务器返回的,在server push to client的cmd==INIT_GAME_DATA时返回
        */

        //待选的牌
        cardList: [
            ////定义剪刀==1，石头==2，布==3  
            { touched: false, matched: false, bg: "", index: 0, cardGameState: READY_STATE, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, matched: false, bg: "", index: 1, cardGameState: READY_STATE, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { touched: false, matched: false, bg: "", index: 2, cardGameState: READY_STATE, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }],

        //选了牌放的框
        borderList: [{ index: 0, x: border1X, y: borderY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }],

        //对手选了牌放的框
        borderListOrderUser: [{ url: "", index: 0, x: borderOtherX, y: borderOtherY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }],

        //对手待选的牌
        cardListOrderUser: [
            { matched: false, cardGameState: READY_STATE, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, cardGameState: READY_STATE, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, cardGameState: READY_STATE, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }],

        player: {},
        me: {},
    },

    setMyCard: function (cardList_, needRefresh) {
        //重设card数组对像
        // this.data.cardList = [
        //     { index: 0, matched: false, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { index: 1, matched: false, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { index: 2, matched: false, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
        // items = this.data.cardList;
        this.initMyCardList();
        if (cardList_ != null) {
            //let hadSave = false;
            for (let i = 0; i < cardList_.length; i++) {
                //items[i].value = cardList_[i];
                items[i].value = cardList_[i].card;
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
                        //items[i].matched = true;
                        break;
                }
                console.log("setMyCard, items[" + i + "].value: " + cardList_[i]);
            }
        }
        if (needRefresh) {
            this.setData({
                cardList: items,
            });
        }
    },

    setOtherCard: function (cardList, currentCard, currentIndex) {
        this.data.cardListOrderUser = [
            { matched: false, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardOrderY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardOrderY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardOrderY, width: cardWidth, height: cardHeight, put: false }];
        var otherCards = this.data.cardListOrderUser;
        if (cardList != null) {
            var cardLength = cardList.length;
            //for (let i = 0; i < cardLength; i++) {//服务器下发的index是倒的
            for (let i = cardLength - 1; i >= 0; i--) {
                otherCards[i].value = cardList[i].card;
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
                        if (backFormGaming) {
                            if (cardList[i].result == undefined) {//出了牌，还没对比的
                                switch (currentCard) {
                                    case VALUE_SCISSORS:
                                        otherCards[currentIndex].poster = VALUE_SCISSORS_PHOTO_URL;
                                        otherCards[currentIndex].posterBig = VALUE_SCISSORS_BIG_PHOTO_URL;
                                        break;
                                    case VALUE_STORE:
                                        otherCards[currentIndex].poster = VALUE_STORE_PHOTO_URL;
                                        otherCards[currentIndex].posterBig = VALUE_STORE_BIG_PHOTO_URL;
                                        break;
                                    case VALUE_PAPRE:
                                        otherCards[currentIndex].poster = VALUE_PAPRE_PHOTO_URL;
                                        otherCards[currentIndex].posterBig = VALUE_PAPRE_BIG_PHOTO_URL;
                                        break;
                                }
                            } else
                                otherCards[i].poster = "";
                        } else
                            otherCards[i].poster = VALUE_CANNOT_SEE_PHOTO_URL;
                        break;
                }

                if (backFormGaming) {
                    //重回时，让最后一张gian住的，像刚发牌时有一张gian住一样
                    if (i == (cardLength - 1))
                        otherCards[i].poster = VALUE_CANNOT_SEE_PHOTO_URL;
                }
            }//end for
        }
        this.setData({
            cardListOrderUser: otherCards,
        });
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

    onLoad() {
        this.initInterface();
        gameControl = new GameControl();

        gameInitData = my.getStorageSync({ key: 'gameInfoData' }).data;
        let isGaming = my.getStorageSync({ key: 'isGaming' }).data;
        // roomObject = gameInitData.room;
        // orderPlayerList = gameInitData.users;
        roomId = gameInitData.id;
        orderPlayerList = gameInitData.userList;

        this.data.cardList = [
            ////定义剪刀==1，石头==2，布==3  
            { matched: false, bg: "", index: 0, cardGameState: READY_STATE, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, bg: "", index: 1, cardGameState: READY_STATE, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, bg: "", index: 2, cardGameState: READY_STATE, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
        items = this.data.cardList;

        this.data.borderList = [{ index: 0, x: border1X, y: borderY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }];

        borderItems = this.data.borderList;

        this.data.cardListOrderUser = [
            { matched: false, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardOrderY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardOrderY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardOrderY, width: cardWidth, height: cardHeight, put: false }];

        mySelectedCards = [];

        var player_;
        if (orderPlayerList != null && orderPlayerList.length > 0) {
            //player_ = orderPlayerList[0];
            for (let i = 0; i < orderPlayerList.length; i++) {
                //if (account.userInfo().aliUserId != orderPlayerList[i].aliUserId)
                if (account.userInfo().id != orderPlayerList[i].id)
                    player_ = orderPlayerList[i];
            }
        }

        //不能将currentStage放在resetGameData();
        currentStage = 1;

        if (!isGaming) {
            backFormGaming = false;
            iSendedCard = false;
            showTaCard = false;
            orderPlayerConfirmed = false;

            this.setData({
                //borderListOrderUser: this.data.borderListOrderUser,
                iSendedCard: iSendedCard,
                showTaCard: showTaCard,
                orderPlayerConfirmed: orderPlayerConfirmed,
                player: player_,
                me: account.userInfo(),
                //cardList: items//<-从resetGameData里抽到这里 
            });

            resultLists = [];
            resultRecordLists = [];
            //gameTotalResult = 0;

            this.resetGameData();

            my.setStorageSync({
                key: keyForStoreCache,
                data: null
            });

            my.setStorageSync({
                key: keyForStoreCacheForOther,
                data: null
            });

        } else {
            backFormGaming = true;
            my.setStorageSync({
                key: 'isGaming',
                data: false
            });
            this.setData({
                player: player_,
                me: account.userInfo(),
            });

            //this.setGameView(gameInitData);
        }
        this.setGameView(gameInitData);
        this.setGameCountDownTime(gameInitData);
        this.startTimeCountDown();
        this.initSocket();
        //this.listOldResultRecordList();
    },

    setGameCountDownTime: function (gameData) {
        countDownTime = gameInterfaceImpl.getGameCountDownTime(gameData);
        this.setData({
            countDownTime: countDownTime,
        });
    },

    /**
     * 根据游戏主体信息展示在界面
     */
    setGameView: function (gameData) {

        if (gameData == null) return;
        var showResultTimeInSecend = 3 * 1000;

        maxGameRound = gameData.maxGameRound;
        currentStage = gameData.currentGameRound;
        confirmEndTime = gameData.confirmEndTime;

        console.log("maxGameRound:" + maxGameRound);
        console.log("currentStage:" + currentStage);
        console.log("confirmEndTime:" + confirmEndTime);

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
        //////////////////////////显示我的数据//////////////////
        var myConfirmed;
        if (myCardInfo != null) {
            initMyCards = myCardInfo.initCards;
            myConfirmed = myCardInfo.isConfirmed;
            //初始化我的牌数据
            if (myConfirmed == 0) {
                //this.setMyCard(initMyCards);//我的牌
                this.startTimeCountDown();
                iSendedCard = false;
                this.setData({
                    iSendedCard: false
                });
            } else {
                if (backFormGaming) {
                    this.setData({
                        iSendedCard: true,
                        //cardList: items
                    });
                    iSendedCard = false;//在重回游戏的时候，可以显示我的牌在放置区上
                    this.confirmMyCardByServer(myCardInfo);
                }
            }

            let roundResultList = myCardInfo.roundResultList;
            this.addRecordList(roundResultList);

            //this.addCardResultList(confirmCards);
        }//////////////////end 显示我的数据/////////////////

        //////////////////////////显示对方的数据//////////////////
        var confirmCardUrl = "";
        var otherConfirmed;
        if (otherCardInfo != null) {
            initOtherCards = otherCardInfo.initCards;
            otherConfirmed = otherCardInfo.isConfirmed;
            //let confirmCards = otherCardInfo.confirmCards;

            if (otherConfirmed == 1) {
                this.orderPlayerConfirmedCard();

                let orderPayerCardValue = otherCardInfo.currentCard;
                let hiddenCardIndex = otherCardInfo.currentIndex;

                if (orderPayerCardValue != 0) {
                    switch (orderPayerCardValue) {
                        case VALUE_SCISSORS:
                            confirmCardUrl = VALUE_SCISSORS_BIG_PHOTO_URL;
                            break;
                        case VALUE_STORE:
                            confirmCardUrl = VALUE_STORE_BIG_PHOTO_URL;
                            break;
                        case VALUE_PAPRE:
                            confirmCardUrl = VALUE_PAPRE_BIG_PHOTO_URL;
                            break;
                    }
                    //this.data.borderListOrderUser[0].url = confirmCardUrl;
                    this.data.cardListOrderUser[hiddenCardIndex].matched = true;
                }
            } else {
                //设置对方的牌数据
                //this.setOtherCard(initOtherCards);
                orderPlayerConfirmed = false;
                this.setData({
                    orderPlayerConfirmed: orderPlayerConfirmed,
                });
            }

        }///////////////////////////end 显示对方的数据/////////////////

        if (otherConfirmed == 0 && myConfirmed == 0) {
            this.setMyCard(initMyCards, true);//我的牌
            this.setOtherCard(initOtherCards);
            showResult = false;
        }

        // if (otherConfirmed == 1 && myConfirmed == 1)
        // showResult = true;
        if (otherConfirmed == 1 && myConfirmed == 1)
            showResult = true;
        else
            showResult = false;

        if (backFormGaming) {
            //this.setOtherCard(initOtherCards, otherCardInfo.currentCard, otherCardInfo.currentIndex);
            //set for otherCard by cache
            let otherCardsUserForGameBack = my.getStorageSync({ key: keyForStoreCacheForOther }).data;
            if (otherCardsUserForGameBack != null) {
                this.data.cardListOrderUser = otherCardsUserForGameBack;//get form cache
                this.setData({
                    cardListOrderUser: this.data.cardListOrderUser
                });
            }
            //set for my card by cache
            let cardsUserForGameBack = my.getStorageSync({ key: keyForStoreCache }).data;
            if (cardsUserForGameBack != null) {
                items = cardsUserForGameBack;//get form cache
                this.setData({
                    cardList: items
                });
            }
            //请空缓存
            my.setStorageSync({
                key: keyForStoreCache,
                data: null
            });
            my.setStorageSync({
                key: keyForStoreCacheForOther,
                data: null
            });
        }//end if 

        //双方都确认后，展示结果
        if (showResult) {
            //////////////////展示对方的结果//////////////////
            if (initOtherCards != null && initOtherCards.length > 0) {
                for (let i = 0; i < initOtherCards.length; i++) {
                    let sentIndex = initOtherCards[i].index;
                    if (sentIndex == 0) {//还没对比的牌的index为0
                        continue;//继续下次loop,如果这里return,后面所有代码都不执行了。。fuck!
                    }
                    //let mySelectedCard = items[currentIndex];
                    let taSelectedCard = this.data.cardListOrderUser[i];
                    //如果重回游戏就马上显示
                    if (backFormGaming)
                        taSelectedCard.matched = true;
                    else
                        taSelectedCard.matched = false;

                    taSelectedCard.putIndex = sentIndex;

                    switch (initOtherCards[i].result) {
                        case gameControl.winStateStr():
                            taSelectedCard.bg = imageSrc + WIN_FOR_ONE_CARD;
                            break;
                        case gameControl.loseStateStr():
                            taSelectedCard.bg = imageSrc + LOSE_FOR_ONE_CARD;
                            break;
                        case gameControl.drawStateStr():
                            taSelectedCard.bg = imageSrc + DRAW_FOR_ONE_CARD;
                            break;
                    }//end switch

                    if (backFormGaming) {
                        //如果重回游戏就马上显示
                        this.setData({
                            cardListOrderUser: this.data.cardListOrderUser,
                        });
                    } else {
                        //让结果显示一会再更新再隐藏牌 
                        let timer = setInterval(() => {
                            taSelectedCard.matched = true//让已选的牌隐藏，显示出index和胜负
                            this.setData({
                                cardListOrderUser: this.data.cardListOrderUser,
                            });
                            clearInterval(timer);
                        }, showResultTimeInSecend);
                    }
                }//end for
            }//end if 
            /////////////////////end 展示对方的结果////////////////////////

            ////////////////////展示我的结果/////////////////
            this.setMyCard(initMyCards, false);
            var results = [];
            let currentIndex = myCardInfo.currentIndex;//我当前对比的牌的index
            let confirmCards = myCardInfo.confirmCards;
            currentStageSendedCardCount = confirmCards == null ? 1 : (confirmCards.length == 0 ? 1 : confirmCards.length);
            console.log("currentStageSendedCardCount:" + currentStageSendedCardCount);
            /////////在左下角显示每盘的对战结果,3盘为一局////////
            //this.showResultList(initMyCards, results);
            if (initMyCards != null && initMyCards.length > 0) {
                for (let i = 0; i < initMyCards.length; i++) {
                    let sentIndex = initMyCards[i].index;
                    if (sentIndex == 0) {//还没对比的牌的index为0
                        continue;//继续下次loop,如果这里return,后面所有代码都不执行了。。fuck!
                    }
                    //let mySelectedCard = items[currentIndex];
                    let mySelectedCard = items[i];
                    //如果重回游戏就马上显示
                    if (backFormGaming)
                        mySelectedCard.matched = true;
                    else
                        mySelectedCard.matched = false;

                    mySelectedCard.x = mySelectedCard.ox;
                    mySelectedCard.y = mySelectedCard.oy;
                    mySelectedCard.putIndex = sentIndex;
                    //mySelectedCard.putIndex = (mySelectedCard.index + 1);
                    results = [];
                    switch (initMyCards[i].result) {
                        case gameControl.winStateStr():
                            results.push(WIN_FOR_ONE_CARD);
                            mySelectedCard.bg = imageSrc + WIN_FOR_ONE_CARD;
                            break;
                        case gameControl.loseStateStr():
                            results.push(LOSE_FOR_ONE_CARD);
                            mySelectedCard.bg = imageSrc + LOSE_FOR_ONE_CARD;
                            break;
                        case gameControl.drawStateStr():
                            results.push(DRAW_FOR_ONE_CARD);
                            mySelectedCard.bg = imageSrc + DRAW_FOR_ONE_CARD;
                            break;
                    }//end switch
                    if (backFormGaming) {
                        //如果重回游戏就马上显示
                        this.setData({
                            cardList: items,
                        });
                    } else {
                        //让结果显示一会再更新再隐藏牌 
                        let timer = setInterval(() => {
                            mySelectedCard.matched = true//让已选的牌隐藏，显示出index和胜负
                            this.setData({
                                cardList: items,
                            });
                            clearInterval(timer);
                        }, showResultTimeInSecend);
                    }
                }//end for
            }//end if 
            ///////////////////end /////////////
        }

        console.log("backFormGaming:" + backFormGaming);

        if (!backFormGaming) {
            if (showResult) {
                console.log("showResult 1:" + true);
                //this.data.borderListOrderUser[0].url = confirmCardUrl;

                var timerForAnimation = setInterval(() => {
                    //翻牌动画
                    this.setData({ cardAnimationInfo: gameControl.getAnimation(180).export(), });
                    clearInterval(timerForAnimation);
                }, 600);

                var timer2 = setInterval(() => {
                    this.data.borderListOrderUser[0].url = confirmCardUrl;
                    this.data.borderListOrderUser[0].afterAnimation = true;
                    this.setData({
                        //让翻了的牌回到原位来显示
                        //cardAnimationInfo: gameControl.getAnimation(0, 1).export(),
                        borderListOrderUser: this.data.borderListOrderUser,
                        resultLists: results,
                        orderPlayerConfirmed: true,
                        showTaCard: true,
                    });
                    clearInterval(timer2);
                }, 1100);
            } else
                console.log("showResult 1:" + false);
        } else
            backFormGaming = false;

        if (currentStage >= maxGameRound && (currentStageSendedCardCount >= stageNeedSendCardCount)) {
            //结束当前局
            this.requestGameResultAndJump();
        } else {
            //要三张牌全出了，才算是一局，
            if (currentStageSendedCardCount == stageNeedSendCardCount) {
                //进入下一盘
                var timerNextGame = setInterval(() => {
                    this.newGame();
                    clearInterval(timerNextGame);
                }, showResultTimeInSecend);
            } else {
                //否则继续出牌
                if (showResult) {
                    console.log("showResult 2:" + showResult);
                    this.initMyCardBorder();
                    var timerNextGame = setInterval(() => {
                        //this.countDownTime = SELECT_CARD_TIME_LIMIT;
                        this.startTimeCountDown();
                        resultLists = [];
                        //对手选了牌放的框
                        this.data.borderListOrderUser = [
                            {
                                url: "", index: 0, x: borderOtherX, y: borderOtherY,
                                width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE,
                                afterAnimation: false
                            }
                        ];
                        iSendedCard = false;
                        showTaCard = false;
                        orderPlayerConfirmed = false;
                        this.setData({
                            //回到0度，准备下一次翻的动画
                            cardAnimationInfo: gameControl.getAnimation(0, 1).export(),
                            iSendedCard: iSendedCard,
                            orderPlayerConfirmed: orderPlayerConfirmed,
                            countDownTime: countDownTime,
                            borderListOrderUser: this.data.borderListOrderUser,
                            showTaCard: showTaCard,
                            resultLists: resultLists
                        });
                        clearInterval(timerNextGame);
                    }, showResultTimeInSecend);
                }
            }
        }
    },

    showResultList: function (initCards, results) {
        //if (confirmCards != null && confirmCards.length > 0) {
        if (initCards != null && initCards.length > 0) {
            for (let i = 0; i < initCards.length; i++) {
                // if (initCards[i].card == 0)
                //     return;
                let sentIndex = initCards[i].index;
                if (sentIndex == 0)//还没对比的牌的index为0
                    return;
                let mySelectedCard = items[sentIndex];
                //如果重回游戏就马上显示
                if (backFormGaming)
                    mySelectedCard.matched = true;
                else
                    mySelectedCard.matched = false;

                mySelectedCard.x = mySelectedCard.ox;
                mySelectedCard.y = mySelectedCard.oy;
                mySelectedCard.putIndex = (sentIndex + 1);
                //mySelectedCard.putIndex = (mySelectedCard.index + 1);
                results = [];
                switch (initCards[i].result) {
                    case gameControl.winStateStr():
                        results.push(WIN_FOR_ONE_CARD);
                        mySelectedCard.bg = imageSrc + WIN_FOR_ONE_CARD;
                        break;
                    case gameControl.loseStateStr():
                        results.push(LOSE_FOR_ONE_CARD);
                        mySelectedCard.bg = imageSrc + LOSE_FOR_ONE_CARD;
                        break;
                    case gameControl.drawStateStr():
                        results.push(DRAW_FOR_ONE_CARD);
                        mySelectedCard.bg = imageSrc + DRAW_FOR_ONE_CARD;
                        break;
                }//end switch
                if (backFormGaming) {
                    //如果重回游戏就马上显示
                    this.setData({
                        cardList: items,
                    });
                } else {
                    //让结果显示一会再更新再隐藏牌 
                    let timer = setInterval(() => {
                        mySelectedCard.matched = true//让已选的牌隐藏，显示出index和胜负
                        this.setData({
                            cardList: items,
                        });
                        clearInterval(timer);
                    }, 3000);
                }
            }//end for
        }//end if 
    },

    requestGameResultAndJump: function () {
        my.showLoading({
            content: '请稍等...',
        });
        requestGameResult(roomId, account.userId()).then(data => {
            try {
                //本轮积分
                my.setStorageSync({
                    key: 'scoreStr',
                    data: data.scoreStr
                });
                console.log(data.scoreStr);
                //局数列表
                my.setStorageSync({
                    key: 'gameResultStr',
                    data: data.gameResultStr
                });
                console.log(data.gameResultStr);
                //保存排行榜
                var rankingArray = data.ranking;
                my.setStorageSync({
                    key: 'ranking',
                    data: rankingArray
                });
                console.log(data.ranking);
                //对战结果
                var gameResultArray = data.gameResult;
                my.setStorageSync({
                    key: 'gameResult',
                    data: gameResultArray
                });
                console.log(data.gameResult);
                //保存奖品列表
                var prizeArray = data.prize;
                my.setStorageSync({
                    key: 'prize',
                    data: prizeArray
                });
                console.log(data.prize);
                ////////////数据请求成功后，再作跳转/////////////
                var myGameResult = data.result;
                console.log(data.result);
                gameControl.goToResult(myGameResult, my);
                this.cleanCache();
            } catch (e) {
                //my.hideLoading();
                my.hideLoading();
                var contentStr = '跳转结果页失败: ' + e;
                console.error("requestGameResult error", e);
                my.showToast({
                    type: 'fail',
                    content: contentStr,
                    duration: 5000,
                });
                gameControl.goToIndex(my);
                this.cleanCache();
            }
        }).catch(e => {
            my.hideLoading();
            var contentStr = '请求对战结果页失败: ' + e;
            console.error("requestGameResult error", e);
            my.showToast({
                type: 'fail',
                content: contentStr,
                duration: 5000,
            });
            gameControl.goToIndex(my);
            this.cleanCache();
        });
    },

    cleanCache: function () {
        items = null;
        this.data.cardListOrderUser = null;

        my.setStorageSync({
            key: keyForStoreCache,
            data: null
        });

        my.setStorageSync({
            key: keyForStoreCacheForOther,
            data: null
        });
    },

    initSocket: function () {
        const that = this;
        var socketListener = function (res) {
            // if (isUnLoaded) return;
            console.log("res.cmd:" + res.cmd);
            console.log(res.data);
            //信息发送者不是当前本地用户
            if (res.cmd && res.senderId != account.userId()) {
                //const gm = that.gm
                switch (res.cmd) {
                    case 'RSP_GAME_FAIL'://出牌错误
                        // my.showToast({
                        //     type: 'fail',
                        //     content: "数据出现错误，跳转中...",
                        //     duration: 5000,
                        // });
                        // my.setStorageSync({
                        //     key: keyForStoreCache,
                        //     data: null
                        // });
                        // gameControl.goToIndex(my);
                        break;
                    case 'RSP_GAME_INFO':
                        that.setGameCountDownTime(res.data);
                        that.setGameView(res.data);
                        break;
                    case 'RSP_USER_CONFIRM'://用户or服务器已帮我确认卡牌顺序
                        if (res.data == null) {
                            my.showToast({
                                type: 'fail',
                                content: 'RSP_USER_CONFIRM 的数据为空',
                                duration: 5000,
                            });
                            return
                        };
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
                            if (myCardInfo.isConfirmed == 1) {
                                //服务器叫我确认出牌,但这里只做出牌的动画，不向服务器发送数据
                                //justShowCardAnimation = true
                                that.confirmMyCardByServer(myCardInfo);
                                console.log("server call me confirmCard");
                            }
                        }

                        if (otherCardInfo != null) {
                            if (otherCardInfo.isConfirmed == 1) {
                                that.orderPlayerConfirmedCard();
                                console.log("order player confirmCard");
                                if (iSendedCard) {
                                    //如果我确认牌了，现时对方确认，隐藏对方出了牌的位置
                                    let hiddenCardIndex = otherCardInfo.currentIndex;
                                    //that.data.cardListOrderUser[hiddenCardIndex].matched = true;
                                    that.data.cardListOrderUser[hiddenCardIndex].put = true;
                                    that.setData({
                                        cardListOrderUser: that.data.cardListOrderUser
                                    });
                                }
                            }
                        }
                        break;
                    // case 'RSP_GAME_RESULT':
                    //     that.showResultInLayout(res.data, false);
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
        //let confirmCards = myCardInfo.confirmCards;
        // if (confirmCards != null) {
        //     let temp = [];
        //     for (let i = 0; i < confirmCards.length; i++)
        //         temp.push(confirmCards[i].card);
        //     mySelectedCards = this.gameControl.resultAdapter(temp);
        // }
        mySelectedCards = [];
        //mySelectedCards = myCardInfo.confirmCards;
        let size = myCardInfo.confirmCards == null ? 0 : myCardInfo.confirmCards.length;
        if (size > 0)////取最后一位来做出牌
            mySelectedCards.push(myCardInfo.confirmCards[size - 1]);

        this.confirmCard();
    },

    orderPlayerConfirmedCard: function () {
        //在vs区将对方的牌显示gian住的
        let taSelected = [{
            value: 0, index: 0, x: borderOtherX, y: borderOtherY,
            url: VALUE_CANNOT_SEE_PHOTO_URL, width: borderWidth, height: borderHeight
        }];
        this.setData({
            orderPlayerConfirmed: true,
            borderListOrderUser: taSelected
        });
    },

    resetGameData: function () {
        mySelectedCards = [];
        //对手选了牌放的框
        this.data.borderListOrderUser = [
            {
                url: "", index: 0, x: borderOtherX, y: borderOtherY,
                width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE
            }];
        showTaCard = false;
        resultLists = [];
        //this.initMyCardList();
        this.initMyCardBorder();
        currentStageSendedCardCount = 1;
        this.setData({
            resultLists: resultLists,//真面会缓存数据，所以清空数据都要更新到页面
            borderListOrderUser: this.data.borderListOrderUser
        });
    },

    /**
    * 显示选牌倒计时
    */
    startTimeCountDown: function () {
        //var countDown = this.countDownTime;
        this.stopCardTimeCountDownTimer();
        //const that = this;
        selectCardTimeCountDownTimer = setInterval(() => {
            //countDown--;
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
                //this.autoSelectCard();
                this.confirmCard();
            }
        }, 1000);
    },

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
        this.setData({
            cardList: items
        })
    },

    /**
     * 卡在移动中
     */
    moveCard: function (e) {
        if (iSendedCard || items[index].matched)
            return;
        items[index].x = e.touches[0].clientX * 1.8;
        items[index].y = e.touches[0].clientY * 1.8;
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
        console.log("moveEnd");
        //var player = items[index];
        var card = items[index];
        card.touched = false;
        //var mySelectedValue = mySelectedCards[index].value;
        //var taSelected = taSelectedCards[index];
        var collideBorder = gameControl.isCollide(card, borderItems);
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

    putCardInBorderSetData: function (card, border) {
        card.put = true;
        //border.putId = card.value;
        border.putId = card.index;
        card.x = border.x;//将牌的x设置为框的x
        card.y = border.y;//将牌的y设置为框的y
        var borderIndex = border.index;
        mySelectedCards[borderIndex] = card;
        console.log(border.index + "框放了:" + card.value);
    },

    /**
     * 放一张卡到框上,处理卡的互换等
     */
    putCardInBorder: function (card, border) {
        if (border.putId == EMPTY_BORDER_VALUE && !card.put) {
            this.putCardInBorderSetData(card, border);
        } else {
            console.log("框已放牌");
        }
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
            if (card.index == border.putId) {
                //松手后,如果拖动是框上的卡，如果还在框内，返回框内
                //现在value有可能一样的，还要加上index的判断
                card.put = true;
                card.x = border.x;
                card.y = border.y;
                console.log("moveEnd,card.index:" + card.index + ", border.putId:" + border.putId + ", card.value:" + card.value);
            } else {
                //拖到a卡松手后,框上的有其它的卡，将a卡放到空的框
                console.log("拖到a卡松手后,框上的有其它的卡，将a卡放到空的框");
                //框内已有放到牌的,把旧的放回去,放上新的
                var existCard = this.foundOutPutCardInBorder(border);
                existCard.put = false;
                existCard.x = existCard.ox;
                existCard.y = existCard.oy;
                this.putCardInBorderSetData(card, border);
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

    /**
    * 如果用户选牌时间超过，系统帮随机选定
    */
    autoSelectCard: function () {
        var autoSelectBorder = borderItems[0];
        console.log("autoSelectBorder:");
        console.log(autoSelectBorder);
        for (let i = 0; i < items.length; i++) {
            var card = items[i];
            // var emptyBorder = this.foundOutNotPutCard();
            // if (emptyBorder != null && card != null) {
            //     console.log("autoSelectCard, foundOutNotPutCard:" + emptyBorder.index + ", card.value:" + card.value);
            //     this.putCardInBorder(card, emptyBorder);
            // }
            if (!card.matched) {
                this.putCardInBorder(card, autoSelectBorder);
                break;
            }
        }
        this.setData({
            cardList: items
        });
    },

    stopCardTimeCountDownTimer: function () {
        if (selectCardTimeCountDownTimer != null) {
            clearInterval(selectCardTimeCountDownTimer);
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

        var allSelectedCount = 0;
        for (let i = 0; i < mySelectedCards.length; i++) {
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
     * 在本地作双方的结果对比
     */
    // compareWithAI: function () {
    //     iSendedCard = true;
    //     this.setData({
    //         iSendedCard: true
    //     });
    //     taSelectedCards: [
    //         { value: VALUE_STORE, url: VALUE_STORE_BIG_PHOTO_URL }];
    //     this.showResultInLayout(taSelectedCards);
    // },

    /**
     * 将我选的牌发送到服务器
     */
    compareWithServer: function () {
        try {
            let selectedCardData = [];
            for (let i = 0; i < mySelectedCards.length; i++) {
                console.log("push index:" + mySelectedCards[i].index);
                selectedCardData.push(mySelectedCards[i].index);
            }
            //if (!justShowCardAnimation) {
            SocketManager.getInstance().sendMessage({
                senderId: account.userId(),
                roomId: roomId,
                data: JSON.stringify(selectedCardData),//data发送的是卡片在卡组中的【索引】，而非卡牌类型
                cmd: 'CMD_CARD_SEQ'
            });
            //}
            //justShowCardAnimation = false;
            iSendedCard = true;
            this.setData({
                iSendedCard: true
            });
            mySelectedCards = [];
        } catch (e) {
            console.error(e);
        }
    },

    /**
     * 在右下角显示每局的对战结果，3盘为一局
     */
    addRecordList: function (roundResultList) {
        if (roundResultList != null && roundResultList.length > 0) {
            resultRecordLists = [];
            for (let i = 0; i < roundResultList.length; i++) {
                //fucking js?,,如果重新正义对像,resultRecordLists就会添加相同的数据。。。
                let stageRecordObject = {
                    bg: "", currentStage: 0, x: 0
                };
                let data = roundResultList[i];
                console.log("roundResultList[" + i + "]:" + data);
                if (data == gameControl.winStateStr()) {
                    stageRecordObject.bg = RESULT_RECORD_WIN;
                } else if (data == gameControl.drawStateStr()) {
                    stageRecordObject.bg = RESULT_RECORD_DRAW;
                } else {
                    stageRecordObject.bg = RESULT_RECORD_LOSE;
                }
                stageRecordObject.currentStage = (i + 1);
                stageRecordObject.x = (stageRecordObject.currentStage - 1) * 70 + 15;//70为icon宽度
                console.log("currentStage:" + stageRecordObject.currentStage + ", x:" + stageRecordObject.x);
                resultRecordLists.push(stageRecordObject);
            }
        }
        this.setData({
            resultRecordLists: resultRecordLists,
        });
    },

    initMyCardBorder: function () {
        //选了牌放的框
        this.data.borderList = [{
            index: 0, x: border1X, y: borderY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE
        }];
        borderItems = this.data.borderList;
    },

    initMyCardList: function () {
        //重设card数组对像
        this.data.cardList = [
            ////定义剪刀==1，石头==2，布==3  
            { index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
        items = this.data.cardList;
    },

    /**
     * 开始一盘新游戏,3盘两胜才算赢一局
     */
    newGame: function () {
        this.data.borderListOrderUser[0].afterAnimation = false;
        this.setData({
            borderListOrderUser: this.data.borderListOrderUser,
            //回到0度，准备下一次翻的动画
            cardAnimationInfo: gameControl.getAnimation(0).export(),
        });
        //currentStage++;//一张一张出，要出完三张牌这里才能加1!
        this.resetGameData();
        //6-22修改为不用发CMD_GAME_START，之前RSP_GAME_DATA_INIT是服务器端收到 CMD_GAME_START后下发的
        //现在 RSP_GAME_DATA_INIT 会在下发了RSP_GAME_RESULT 4秒后下发,时间是由服务器控制
        //因为客户端之前是4秒后(界面展示与动画播放)才发送CMD_GAME_START
        // SocketManager.getInstance().sendMessage({
        //     senderId: account.userId(),
        //     roomId: roomObject.id,
        //     cmd: 'CMD_GAME_START'
        // })
    },

    /**
     * 页面被关闭
     */
    onUnload() {
        console.log("onUnload");
        my.setStorageSync({
            key: keyForStoreCache,
            data: items
        });
        my.setStorageSync({
            key: keyForStoreCacheForOther,
            data: this.data.cardListOrderUser
        });

        // console.log("save keyForStoreCache onUnload in starFightOneCard");
        this.stopCardTimeCountDownTimer();
        //放在游戏结束里,这样做因为要让玩家退出界面时也能接收游戏信息
        SocketManager.getInstance().unsubscribeSocket(this.socketListener);
    },
});