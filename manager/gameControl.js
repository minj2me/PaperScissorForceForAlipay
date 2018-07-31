const account = require('./accountManager.js');
// import { SocketHelper } from '../network/SocketHelper.js'
// import { baseSocketUrl } from "../network/apiService.js";

//"LOSE","WIN","LOSE"
const WIN_STATE_STR = "WIN";
const LOSE_STATE_STR = "LOSE";
const DRAW_STATE_STR = "EVEN";

const WIN_STATE = 1;
const LOSE_STATE = -1;
const DRAW_STATE = 0;

const VALUE_SCISSORS = 1;
const VALUE_STORE = 2;
const VALUE_PAPRE = 3;

const ROOM_TYPE_THREE_CARD_BY_MATCHING = 0;
const ROOM_TYPE_THREE_CARD_BY_FRIEND = 2;
const ROOM_TYPE_SINGLE_CARD = 1;

const imageSrc = "/images/";  //图片url前缀

const VALUE_SCISSORS_BIG_PHOTO_URL = imageSrc + "value1p_big.png";
const VALUE_STORE_BIG_PHOTO_URL = imageSrc + "value2p_big.png";
const VALUE_PAPRE_BIG_PHOTO_URL = imageSrc + "value3p_big.png";

const RESULT_RECORD_WIN_PNG = "result_record_win.png";
const RESULT_RECORD_DRAW_PNG = "result_record_draw.png";
const RESULT_RECORD_LOSE_PNG = "result_record_lose.png";

const jumpTime = 4000;
//var isSocketInit = false;
//var socket = null;
//const matchFailure = "匹配失败";

//var fns = [];

class GameControl {
    constructor() {
    }
    
    /**
    * 检测牌是否碰到某个放牌框,如果是,返回框
   */
    isCollide(player, borderItems) {
        var offset = 30;//added by johnny
        for (let i = 0; i < borderItems.length; i++) {
            var border = borderItems[i];
            //var borderTopLeft = [border.x, border.y];
            var borderTopLeft = [border.x - offset, border.y + offset];//为了扩大接触面,+offset
            var borderBottomRight = [border.x + border.width, border.y + border.height];
            var meTopLeft = [player.x + player.width / 3, player.y];
            var meBottomRight = [player.x + (player.width * 2 / 3), player.y + (player.height * 2 / 3)];

            var collideTopLeft = [Math.max(borderTopLeft[0], meTopLeft[0]), Math.max(borderTopLeft[1], meTopLeft[1])];
            var collideBottomRight = [Math.min(borderBottomRight[0], meBottomRight[0]), Math.min(borderBottomRight[1], meBottomRight[1])];

            if (collideTopLeft[0] < collideBottomRight[0] && collideTopLeft[1] < collideBottomRight[1]) {
                return border;
            }
        }
        return null;
    }//end function isCollide

    /**
     * 返回牌对比的结果
     * a为玩家的选择，b为电脑随机生成，c为差值结果
     */
    compareCardResult(a, b) {
        var winOrlose, c = a - b;
        // var state={
        //   win:false,
        //   lose:false,
        //   draw:false
        // };
        var state;
        if (c == -2 || c == 1) {
            //state.win = true;//赢
            state = WIN_STATE;
        } else if (c == -1 || c == 2) {
            //state.lose = true ;//输
            state = LOSE_STATE;
        } else {
            //state.draw = true;//平局
            state = DRAW_STATE;
        }
        return state;
    }

    winStateStr() {
        return WIN_STATE_STR;
    }

    loseStateStr() {
        return LOSE_STATE_STR;
    }

    drawStateStr() {
        return DRAW_STATE_STR;
    }

    winState() {
        return WIN_STATE;
    }

    loseState() {
        return LOSE_STATE;
    }

    drawState() {
        return DRAW_STATE;
    }

    /**
     * 房间类型：
     * 0匹配（顺序出牌），
     * 1好友对战、逐张出牌，
     * 2好友对战，顺序出牌
     */
    isPlayThreeCard(type) {
        //0,2是出三张牌(顺序出牌)
        return (type == ROOM_TYPE_THREE_CARD_BY_MATCHING || type == ROOM_TYPE_THREE_CARD_BY_FRIEND);
    }

    isPlaySingleCard(type) {
        return type == ROOM_TYPE_SINGLE_CARD;
    }

    getAnimation(degree, duration) {
        var cardAnimation = my.createAnimation({
            duration: duration,
            timingFunction: 'step-end',
        });
        //rotate3d: 参数 x,y,z轴,  翻转度数
        //其中x,y,z轴为0-1范围，y轴设置为1，代表以y轴为旋转轴
        //cardAnimation.rotate3d(0,1,0,180).step();
        //cardAnimation.rotateY(degree).step();
        cardAnimation.rotateY(degree).step();
        //cardAnimation.rotateY(-degree).step();
        return cardAnimation;
    }

    getAnimation(degree) {
        var cardAnimation = my.createAnimation({
            duration: 500,
            timingFunction: 'step-end',
        });
        cardAnimation.rotateY(degree).step();
        return cardAnimation;
    }

    getStageRecordObject(roundResult, currentStage) {
        let stageRecordObject = {};
        if (roundResult == this.winStateStr()) {
            stageRecordObject.bg = RESULT_RECORD_WIN_PNG;
            //resultRecordLists.push(WIN_STATE);
        } else if (roundResult == this.drawStateStr()) {
            stageRecordObject.bg = RESULT_RECORD_DRAW_PNG;
            //resultRecordLists.push(DRAW_STATE);
        } else {
            stageRecordObject.bg = RESULT_RECORD_LOSE_PNG;
            //resultRecordLists.push(LOSE_STATE);
        }
        stageRecordObject.currentStage = currentStage;
        stageRecordObject.x = (currentStage - 1) * 70 + 15;//70为icon宽度
        //console.log("currentStage:" + stageRecordObject.currentStage + ", x:" + stageRecordObject.x);
        return stageRecordObject;
    }

    /**
     * 把服务器传回的卡牌数据转换成带图片展示的结果信息
     */
    resultAdapter(cardResultList) {
        var url = "";
        var value;
        var cardResultList_ = [];
        //console.log("cardResultList.length:" + cardResultList.length);
        for (let i = 0; i < cardResultList.length; i++) {
            value = cardResultList[i];
            switch (value) {
                case VALUE_SCISSORS://1
                    url = VALUE_SCISSORS_BIG_PHOTO_URL;
                    break;
                case VALUE_STORE://2
                    url = VALUE_STORE_BIG_PHOTO_URL;
                    break;
                case VALUE_PAPRE://3
                    url = VALUE_PAPRE_BIG_PHOTO_URL;
                    break;
            }
            //var selectedObject = { "value": value, "url": url, "cardAnimationInfo": that.gameControl.getAnimation(180).export() };
            var selectedObject = { "value": value, "url": url };
            console.log("选了的牌:" + selectedObject.value + ", url:" + selectedObject.url);
            cardResultList_[i] = selectedObject;
        }
        return cardResultList_;
    }

    // goToResultByScort(gameTotalResult, my) {
    //     if (gameTotalResult >= 1) {
    //         this.showWin();
    //     } else if (gameTotalResult == 0) {
    //         //平局
    //         this.showDraw();
    //     } else {
    //         //如果对赛输了，真接打开结果页
    //         this.showWin();
    //     }
    // }

    goToIndex(my) {
        //my.redirectTo({ url: '/pages/index/index' });
        my.reLaunch({
            url: '/pages/index/index',
        })
    }

    goToResult(myGameResult, my) {
        //var jumpTime = 2000;
        ///////!!!????如果对战过程中，断开再连上后，然后通过redirectTo跳走，/////
        //在gameMatching页就无法再与服务器通信.!
        //因为用 redirectTo 是关闭starFight页面的，如果在这个页面打开的socket，关闭了此页面,socket也无作回调了
        //如果用 navigateTo,当一直网络通的情况下玩多盘，就会收到多个回调，navigateTo是无关闭当前页面的
        console.log("myGameResult:" + myGameResult);
        //if (gameTotalResult >= 1) {
        if (myGameResult === this.winStateStr()) {
            this.showWin(my);
            //} else if (gameTotalResult == 0) {
        } else if (myGameResult === this.drawStateStr()) {
            //打平
            this.showDraw(my);
        } else {
            //如果对赛输了，真接打开结果页
            this.showLose(my);
        }
    }

    showWin(my) {
        var timerShowPrize = setInterval(() => {
            my.redirectTo({ url: '/pages/turntable/turntable' });
            clearInterval(timerShowPrize);
        }, jumpTime);
    }

    showDraw(my) {
        var timerShowResult = setInterval(() => {
            my.redirectTo({ url: '/pages/result/result?result=2' });
            clearInterval(timerShowResult);
        }, jumpTime);
    }

    showLose(my) {
        var timerShowResult = setInterval(() => {
            my.redirectTo({ url: '/pages/result/result?result=0' });
            clearInterval(timerShowResult);
        }, jumpTime);
    }

    /**
     * 处理用户退出后，重回游戏，这里主要取得 roundResultList ，用于显示在对战界面底部的胜负记录列表
     */
    /*handlerGameComeInAgain(resultData, isStartFromOptions) {
        if (resultData == null) {
            console.log("game data is null");
            my.showToast({
                type: 'fail',
                content: '游戏数据为空',
                duration: 2000,
            });
            return;
        }
        var roomData = resultData.data.room;
        console.log(roomData);
        if (roomData == null) {
            console.log("room data is null");
            my.showToast({
                type: 'fail',
                content: '房间数据为空',
                duration: 2000,
            });
            return;
        }
        my.setStorageSync({
            key: 'oldGameResultData',
            data: resultData
        });
        console.log("handlerGameComeInAgain saved oldGameresultData");
        if (roomData.type == ROOM_TYPE_SINGLE_CARD) {
            console.log("handlerGameComeInAgain to starFightOneCard");
            if (isStartFromOptions)//因为options页不能关
                my.navigateTo({ url: "../starFightOneCard/starFightOneCard" });
            else
                my.redirectTo({ url: "../starFightOneCard/starFightOneCard" });
        } else {
            console.log("handlerGameComeInAgain to starFight");
            if (isStartFromOptions)//因为options页不能关
                my.navigateTo({ url: "../starFight/starFight" });
            else
                my.redirectTo({ url: "../starFight/starFight" });
        }
    }*/
}


export { GameControl }