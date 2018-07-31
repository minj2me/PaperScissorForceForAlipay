import { GameControl } from "../../manager/gameControl.js";
//import { SocketHelper } from '../../network/SocketHelper.js'
const account = require('../../manager/accountManager.js');
import { baseSocketUrl } from "../../network/apiService.js";
import { requestGameResult } from "../../network/apiService.js";
import { SocketManager } from "../../manager/socketManager.js";

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
var roomObject = {};
var gameInitData = {};
//对手列表
var orderPlayerList = []

var cardList = [], borderList = [], borderListOrderUser = [], cardListOrderUser = [];

var showTaCard, iSendedCard, orderPlayerConfirmed;

const SELECT_CARD_TIME_LIMIT = 60;

const EMPTY_BORDER_VALUE = -1;

const VALUE_CANNOT_SEE_PHOTO_URL = imageSrc + "border_cannot_see_big.png";

//放牌倒计时
var countDownTime;
var selectCardTimeCountDownTimer;
var orderPlayerConfirmed;
var isSocketInit = false;
// var isUnLoaded = false;

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

    /**
     *解释从服务器返回的游戏数据,并更新到界面 
     */
    setGameDataFormServer: function (gameData, ifFromOldData) {
        if (gameData != null) {
            var playerList = gameData.users;
            if (playerList != null) {
                for (let i = 0; i < playerList.length; i++) {
                    if (playerList[i].id == account.userInfo().id) {
                        var roundResultList = playerList[i].roundResultList;
                        this.addRecordList(roundResultList);
                        this.setMyCard(playerList[i].cards);//我的牌
                        //////如果有对战历史数据，开始显示//////////////
                        if (ifFromOldData) {
                            /**
                             * {"receiverId":10000,"cmd":"RSP_GAME_DATA_INIT","data":
                             * {"room":{"id":460,"type":1,"maxGameRound":3,"currentGameRound":2},
                             * "users":[
                             * {"id":10000,"avatar":"https://tfs.alipayobjects.com/images/partner/T1s0NaXk4bXXXXXXXX","nickName":"Johnny_10000","gender":0,"stars":1001,"vitality":20,"ranking":0,"cards":[3,1,2],"roomId":0,
                             * "roundResultList":["LOSE"],"card":2,"index":2,"cardsResult":["LOSE","EVEN","EVEN"],"roundResult":"LOSE"},
                             * //上面的card(之前对比过的牌)和index应该返回数据型式
                             * //以下省略一样的数据
                             * {.....}
                             */
                            roomObject = gameData.room;
                            if (roomObject != null) {
                                maxGameRound = roomObject.maxGameRound;
                                currentStage = roomObject.currentGameRound;
                                currentStageSendedCardCount = roomObject.currentGameRound;
                            }
                            //let mySeletedCard = playerList[i].card;
                            let myCardsResultIndex = [];
                            //我已发出了的牌
                            let mySentCards = playerList[i].cards;
                            let cardsSeq = playerList[i].cardsSeq;
                            //找出所有为0数量，就是已出牌的数量
                            if (mySentCards != null) {
                                for (let i = 0; i < mySentCards.length; i++) {
                                    if (mySentCards[i] == 0) {
                                        myCardsResultIndex.push(i);
                                    }
                                }
                            }
                            if (myCardsResultIndex != null && myCardsResultIndex.length > 0) {
                                for (let i = 0; i < myCardsResultIndex.length; i++) {
                                    let sentIndex = myCardsResultIndex[i];
                                    let sentResult = cardsSeq[sentIndex];
                                    let mySelectedCard = items[sentIndex];
                                    mySelectedCard.put = true;
                                    mySelectedCard.x = mySelectedCard.ox;
                                    mySelectedCard.y = mySelectedCard.oy;
                                    mySelectedCard.putIndex = sentResult.confirm;
                                    switch (sentResult.result) {
                                        case this.gameControl.winStateStr():
                                            //results.push(WIN_FOR_ONE_CARD);
                                            mySelectedCard.bg = imageSrc + WIN_FOR_ONE_CARD;
                                            break;
                                        case this.gameControl.loseStateStr():
                                            //results.push(LOSE_FOR_ONE_CARD);
                                            mySelectedCard.bg = imageSrc + LOSE_FOR_ONE_CARD;
                                            break;
                                        case this.gameControl.drawStateStr():
                                            //results.push(DRAW_FOR_ONE_CARD);
                                            mySelectedCard.bg = imageSrc + DRAW_FOR_ONE_CARD;
                                            break;
                                    }
                                }
                            }
                            this.setData({
                                cardList: items,
                            });

                        }//end if ifFromOldData
                        ///////////end//////////////////
                    } else {
                        let orderPayerCardValue = playerList[i].card;
                        let hiddenCardIndex = playerList[i].index;
                        let url = "";
                        switch (orderPayerCardValue) {
                            case VALUE_SCISSORS:
                                url = VALUE_SCISSORS_BIG_PHOTO_URL;
                                break;
                            case VALUE_STORE:
                                url = VALUE_STORE_BIG_PHOTO_URL;
                                break;
                            case VALUE_PAPRE:
                                url = VALUE_PAPRE_BIG_PHOTO_URL;
                                break;
                        }
                        this.data.borderListOrderUser[0].url = url;
                        this.data.cardListOrderUser[hiddenCardIndex].matched = true;
                        this.setOtherCard(playerList[i].cards);
                    }
                }
            }
        }
    },

    setMyCard: function (cardList_) {
        //重设card数组对像
        this.data.cardList = [
            ////定义剪刀==1，石头==2，布==3  
            { index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
        items = this.data.cardList;
        if (cardList_ != null) {
            for (let i = 0; i < cardList_.length; i++) {
                items[i].value = cardList_[i];
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
                console.log("setMyCard, items[" + i + "].value: " + cardList_[i]);
            }
        }
        this.setData({
            cardList: items,
        });
    },

    setOtherCard: function (cardList) {
        this.data.cardListOrderUser = [
            { matched: false, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
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
                //console.log("setOtherCard, otherCards[" + i + "].value: " + cardList[i]);
            }
        }
        this.setData({
            cardListOrderUser: otherCards,
        });
    },

    onLoad() {
        //isUnLoaded = false;
        this.gameControl = new GameControl();

        try {
            gameInitData = my.getStorageSync({ key: 'gameInitData' }).data;
            roomObject = gameInitData.room;
            orderPlayerList = gameInitData.users;
        } catch (e) {
            console.error(e);
        }

        this.data.cardList = [
            ////定义剪刀==1，石头==2，布==3  
            { matched: false, bg: "", index: 0, cardGameState: READY_STATE, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, bg: "", index: 1, cardGameState: READY_STATE, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, bg: "", index: 2, cardGameState: READY_STATE, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        items = this.data.cardList;

        this.data.borderList = [{ index: 0, x: border1X, y: borderY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }];

        this.data.cardListOrderUser = [
            { matched: false, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
            { matched: false, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        mySelectedCards = [];

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

        iSendedCard = false;
        showTaCard = false;
        orderPlayerConfirmed = false;

        this.setData({
            borderListOrderUser: this.data.borderListOrderUser,
            iSendedCard: iSendedCard,
            showTaCard: showTaCard,
            orderPlayerConfirmed: orderPlayerConfirmed,
            //countDownTime: roomObject.countDownTime,
            //hard code!!!!!!!!!!!
            countDownTime: SELECT_CARD_TIME_LIMIT,
            player: player_,
            me: account.userInfo(),
            cardList: items//<-从resetGameData里抽到这里 
        });

        currentStage = 1;//不能将currentStage放在resetGameData();
        resultLists = [];
        resultRecordLists = [];
        //gameTotalResult = 0;

        this.resetGameData();
        this.setGameDataFormServer(gameInitData, true);
        this.startTimeCountDown();
        this.initSocket();
        this.listOldResultRecordList();
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
                    case 'RSP_GAME_DATA_INIT':
                        that.setGameDataFormServer(res.data, false);
                        that.startTimeCountDown();
                        iSendedCard = false;
                        that.setData({
                            iSendedCard: false
                        });
                        break;
                    case 'RSP_USER_CONFIRM'://用户or服务器叫我确认卡牌顺序
                        /**
                         * {"senderId":0,"receiverId":10000,"cmd":"RSP_USER_CONFIRM","data":{"userId":10001,"code":0,"msg":"用户确认卡牌顺序"}}
                         */
                        if (res.data != null) {
                            if (account.userId() == res.data.userId) {
                                //服务器叫我确认出牌
                                that.confirmCard();
                                console.log("server call me confirmCard");
                            } else {
                                //对方确认出牌
                                //that.orderPlayerConfirmedCard();
                                //显示gian住的
                                let taSelected = [{ value: 0, url: VALUE_CANNOT_SEE_PHOTO_URL }];
                                that.setData({
                                    orderPlayerConfirmed: true,
                                    borderListOrderUser: taSelected
                                });
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
                    case 'RSP_GAME_RESULT':
                        that.showResultInLayout(res.data, false);
                        break;
                    default: break
                }
            }
        };

        SocketManager.getInstance().subscribeSocket(socketListener);
        this.socketListener = socketListener;
    },

    /**
     * 如果有旧的对战历史数据，显示出来
     */
    listOldResultRecordList: function () {
        let dataKey = "oldGameResultData";
        let oldGameResultData = my.getStorageSync({ key: dataKey }).data;
        if (oldGameResultData == null) {
            return;
        }
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

    // orderPlayerConfirmedCard: function () {
    //     //显示gian住的
    //     var taSelected = [{ value: 0, url: VALUE_CANNOT_SEE_PHOTO_URL }];
    //     this.setData({
    //         orderPlayerConfirmed: true,
    //         borderListOrderUser: taSelected
    //     });
    // },

    resetGameData: function () {
        mySelectedCards = [{ value: 0 }];

        // this.data.cardList = [
        //     ////定义剪刀==1，石头==2，布==3  
        //     { index: 0, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, posterBig: VALUE_SCISSORS_BIG_PHOTO_URL, x: card1X, y: cardY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { index: 1, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, posterBig: VALUE_STORE_BIG_PHOTO_URL, x: card2X, y: cardY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { index: 2, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, posterBig: VALUE_PAPRE_BIG_PHOTO_URL, x: card3X, y: cardY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];
        //items = this.data.cardList;

        // this.data.cardListOrderUser = [
        //     { matched: false, value: VALUE_SCISSORS, poster: VALUE_SCISSORS_PHOTO_URL, x: card1X, y: cardOrderY, ox: card1X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { matched: false, value: VALUE_STORE, poster: VALUE_STORE_PHOTO_URL, x: card2X, y: cardOrderY, ox: card2X, oy: cardY, width: cardWidth, height: cardHeight, put: false },
        //     { matched: false, value: VALUE_PAPRE, poster: VALUE_PAPRE_PHOTO_URL, x: card3X, y: cardOrderY, ox: card3X, oy: cardY, width: cardWidth, height: cardHeight, put: false }];

        //对手选了牌放的框
        this.data.borderListOrderUser = [{ url: "", index: 0, x: borderOtherX, y: borderOtherY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }];
        showTaCard = false;
        resultLists = [];
        this.initMyCardBorder();
        currentStageSendedCardCount = 1;
        this.countDownTime = SELECT_CARD_TIME_LIMIT;
        //iSendedCard = false;
        //orderPlayerConfirmed = false;////要等到发了下局牌后或onload再可让确认按钮可点
        this.setData({
            resultLists: resultLists,//真面会缓存数据，所以清空数据都要更新到页面
            //resultRecordLists: resultRecordLists,
            countDownTime: countDownTime,
            //showTaCard: showTaCard,
            //orderPlayerConfirmed: orderPlayerConfirmed,
            //cardList: items,<-进入下一盘后，不显示初始的牌数据在前台，不然会出现闪动
            borderListOrderUser: this.data.borderListOrderUser
        });
    },

    /**
    * 显示选牌倒计时
    */
    startTimeCountDown: function () {
        //var countDown = this.countDownTime;
        this.stopCardTimeCountDownTimer();
        const that = this;
        selectCardTimeCountDownTimer = setInterval(() => {
            //countDown--;
            that.countDownTime--;
            this.setData({
                countDownTime: that.countDownTime,
            });
            //if (countDown == 0) {
            if (that.countDownTime == 0) {
                //自动选牌
                //this.autoSelectCard();
                this.confirmCard();
                // clearInterval(selectCardTimeCountDownTimer);
                // console.log("clearInterval(selectCardTimeCountDownTimer)");
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

    putCardInBorderSetData: function (card, border) {
        card.put = true;
        //border.putId = card.value;
        border.putId = card.index;
        card.x = border.x;
        card.y = border.y;
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
            var selectedCardData = [];
            for (let i = 0; i < mySelectedCards.length; i++) {
                console.log("push index:" + mySelectedCards[i].index);
                selectedCardData.push(mySelectedCards[i].index);
            }
            SocketManager.getInstance().sendMessage({
                senderId: account.userId(),
                roomId: roomObject.id,
                data: JSON.stringify(selectedCardData),//data发送的是卡片在卡组中的【索引】，而非卡牌类型
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
        //var orderPlayerCard = [];
        var showResultTimeInSecend = 3 * 1000;
        var myCardsResult = [];
        var myCardsResultIndex = [];
        var roundResult;
        var orderPayerCardValue;
        var hiddenCardIndex, mySelectedIndex;
        var roundResultList;
        var mySentCards;
        var cardsSeq;
        if (resultDatas != null) {
            maxGameRound = resultDatas.data.room.maxGameRound;
            //currentStage = resultDatas.data.room.currentGameRound;
            roomId = resultDatas.data.room.id;
            let resultDataArray = resultDatas.data.result;
            for (let i = 0; i < resultDataArray.length; i++) {
                if (resultDataArray[i].userId != account.userInfo().id) {//<-对手的对战数据
                    //拿出对手的牌 
                    //[1,0,3], 用户卡牌列表（卡牌类型），为0的索引即为用户出牌的索引
                    //orderPlayerCard = resultDataArray[i].cards;
                    orderPayerCardValue = resultDataArray[i].card;
                    //值为0的index，表示已出的牌，界面上的隐藏他
                    hiddenCardIndex = resultDataArray[i].index;
                    console.log("orderPayerCardValue:" + orderPayerCardValue);
                    console.log("hiddenCardIndex:" + hiddenCardIndex);
                } else {////我的对战数据
                    mySentCards = resultDataArray[i].cards;
                    mySelectedIndex = resultDataArray[i].index;
                    roundResultList = resultDataArray[i].roundResultList;
                    roundResult = resultDataArray[i].roundResult;
                    //拿出我当前盘的牌的结果
                    myCardsResult = resultDataArray[i].cardsResult;
                    //"cardsSeq":[{"init":1,"confirm":0},{"init":1,"confirm":0},{"init":2,"confirm":1,"result":"LOSE"}]
                    //如牌列表为 cards":[1,1,0],找出为0的index，表示已对赛过的，然后从cardsSeq找出index的数据，
                    //此数据就是0的出牌顺序和结果
                    cardsSeq = resultDataArray[i].cardsSeq;
                    console.log("cardsSeq:");
                    console.log(cardsSeq);
                    console.log("============");
                    console.log("roundResult:");
                    console.log(roundResult);
                }
            }
            //let mySentCardCount = 0;
            //找出所有为0数量，就是已出牌的数量
            if (mySentCards != null) {
                for (let i = 0; i < mySentCards.length; i++) {
                    if (mySentCards[i] == 0) {
                        //mySentCardCount++;
                        myCardsResultIndex.push(i);//把已出牌的index保存起来 
                    }
                }
            }
            //currentStageSendedCardCount = mySentCardCount == 0 ? 1 : mySentCardCount;
            currentStageSendedCardCount = myCardsResult == null ? 1 : (myCardsResult.length == 0 ? 1 : myCardsResult.length);
            currentStage = resultDatas.data.room.currentGameRound;
        }

        let url = "";
        switch (orderPayerCardValue) {
            case VALUE_SCISSORS:
                url = VALUE_SCISSORS_BIG_PHOTO_URL;
                break;
            case VALUE_STORE:
                url = VALUE_STORE_BIG_PHOTO_URL;
                break;
            case VALUE_PAPRE:
                url = VALUE_PAPRE_BIG_PHOTO_URL;
                break;
        }
        this.data.borderListOrderUser[0].url = url;
        this.data.cardListOrderUser[hiddenCardIndex].matched = true;

        var results = [];
        if (ifFromOldData) {//如果游戏还在对战中的
            this.addRecordList(roundResultList);
            if (myCardsResultIndex != null && myCardsResultIndex.length > 0) {
                for (let i = 0; i < myCardsResultIndex.length; i++) {
                    let sentIndex = myCardsResultIndex[i];
                    let sentResult = cardsSeq[sentIndex];
                    let mySelectedCard = items[sentIndex];
                    //mySelectedCard.put = true;
                    mySelectedCard.matched = false;
                    mySelectedCard.x = mySelectedCard.ox;
                    mySelectedCard.y = mySelectedCard.oy;
                    mySelectedCard.putIndex = sentResult.confirm;
                    switch (sentResult.result) {
                        case this.gameControl.winStateStr():
                            //results.push(WIN_FOR_ONE_CARD);
                            mySelectedCard.bg = imageSrc + WIN_FOR_ONE_CARD;
                            break;
                        case this.gameControl.loseStateStr():
                            //results.push(LOSE_FOR_ONE_CARD);
                            mySelectedCard.bg = imageSrc + LOSE_FOR_ONE_CARD;
                            break;
                        case this.gameControl.drawStateStr():
                            //results.push(DRAW_FOR_ONE_CARD);
                            mySelectedCard.bg = imageSrc + DRAW_FOR_ONE_CARD;
                            break;
                    }
                    //让结果显示一会再更新
                    let timer = setInterval(() => {
                        mySelectedCard.matched = true
                        this.setData({
                            cardList: items,
                        });
                        clearInterval(timer);
                    }, showResultTimeInSecend);

                }//end for
                //一进来先更新一下
                // this.setData({
                //     cardList: items,
                // });
            }
        } else {
            var mySelectedCard;
            mySelectedCard = mySelectedCards[0];//<-每次只选一个
            mySelectedCard.x = mySelectedCard.ox;
            mySelectedCard.y = mySelectedCard.oy;
            mySelectedCard.putIndex = currentStageSendedCardCount;
            //让结果显示一会再更新
            let timer = setInterval(() => {
                mySelectedCard.matched = true
                clearInterval(timer);
            }, showResultTimeInSecend);
            let resultState;
            if (myCardsResult != null && myCardsResult.length > 0) {
                //for (let i = 0; i < myCardsResult.length; i++) {
                //myCardsResult是返回已对比的数据，但这里已做了当次数据的保存，所以只取最新的可以了
                resultState = myCardsResult[myCardsResult.length - 1];
                switch (resultState) {
                    case this.gameControl.winStateStr():
                        results.push(WIN_FOR_ONE_CARD);
                        mySelectedCard.bg = imageSrc + WIN_FOR_ONE_CARD;
                        break;
                    case this.gameControl.loseStateStr():
                        results.push(LOSE_FOR_ONE_CARD);
                        mySelectedCard.bg = imageSrc + LOSE_FOR_ONE_CARD;
                        break;
                    case this.gameControl.drawStateStr():
                        results.push(DRAW_FOR_ONE_CARD);
                        mySelectedCard.bg = imageSrc + DRAW_FOR_ONE_CARD;
                        break;
                }
                // }
            }
            //让结果显示一会再更新
            var timer3 = setInterval(() => {
                this.setData({
                    cardList: items,
                });
                clearInterval(timer3);
            }, showResultTimeInSecend);

            var timerForAnimation = setInterval(() => {
                //翻牌动画
                this.setData({ cardAnimationInfo: this.gameControl.getAnimation(180).export(), });
                clearInterval(timerForAnimation);
            }, 600);

            var timer2 = setInterval(() => {
                this.setData({
                    cardListOrderUser: this.data.cardListOrderUser,
                    borderListOrderUser: this.data.borderListOrderUser,
                    resultLists: results,
                    //cardList: items,
                    orderPlayerConfirmed: true,
                    showTaCard: true,
                });
                clearInterval(timer2);
            }, 1100);
        }

        //console.log("maxGameRound:" + this.maxGameRound);
        console.log("maxGameRound:" + maxGameRound);
        console.log("currentStage:" + currentStage);
        console.log("currentStageSendedCardCount:" + currentStageSendedCardCount);

        if (currentStage >= maxGameRound &&
            (currentStageSendedCardCount >= stageNeedSendCardCount)) {//结束当前局

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
                //currentStageSendedCardCount++;
                this.initMyCardBorder();
                var timerNextGame = setInterval(() => {
                    this.countDownTime = SELECT_CARD_TIME_LIMIT;
                    this.startTimeCountDown();
                    resultLists = [];
                    //对手选了牌放的框
                    this.data.borderListOrderUser = [
                        { url: "", index: 0, x: borderOtherX, y: borderOtherY, 
                        width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }
                    ];
                    iSendedCard = false;
                    showTaCard = false;
                    orderPlayerConfirmed = false;
                    this.setData({
                        //回到0度，准备下一次翻的动画
                        cardAnimationInfo: this.gameControl.getAnimation(0, 1).export(),
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
    },

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
                if (data == this.gameControl.winStateStr()) {
                    stageRecordObject.bg = RESULT_RECORD_WIN;
                } else if (data == this.gameControl.drawStateStr()) {
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
        this.data.borderList = [{ index: 0, x: border1X, y: borderY, width: borderWidth, height: borderHeight, putId: EMPTY_BORDER_VALUE }];
        borderItems = this.data.borderList;
    },

    /**
     * 开始一盘新游戏,3盘两胜才算赢一局
     */
    newGame: function () {
        //回到0度，准备下一次翻的动画
        this.setData({ cardAnimationInfo: this.gameControl.getAnimation(0).export(), });
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
        this.stopCardTimeCountDownTimer();
        SocketManager.getInstance().unsubscribeSocket(this.socketListener);
    },
});