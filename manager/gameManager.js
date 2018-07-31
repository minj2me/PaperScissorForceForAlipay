
import { SocketHelper } from '../network/SocketHelper.js'
import { Player } from '../playercharacter/player.js'

import { baseSocketUrl } from "../network/apiService.js";

const account = require('./accountManager.js')

class GameManager {

    constructor(playerNum, socketListener) {
        this.playerNum = playerNum
        this.isInit = false
        this.roomId = 0
        this.materId = 0
        this.lastTime = -1
        this.gameInfo = {
            step: 'match',
            text: '正在为你匹配对手...',
            selfScore: 0,
            timeDown: 0
        }

        this.timeDown = 0
        this.timeDownHandle = null

        this.selfPlayer = new Player(account.userInfo(), true)
        this.otherPlayers = []

        const that = this

        var socket = new SocketHelper(baseSocketUrl + account.userId())
        console.log(baseSocketUrl + account.userId());
        socket.open({
            success() {
                console.log("socket.open success");
                my.hideLoading()
                if (!that.isInit) {
                    that.isInit = true
                    socket.onMessageReceive(socketListener)
                    //matching现在在gameMatching界面中执行
                    // socket.sendMessage({
                    //     senderId: account.userId(),
                    //     receiverId: 0,
                    //     cmd: 'MATCHING'
                    // })
                }
            },
            error() {
                console.log("socket.open error");
                my.hideLoading()
            }
        })
        this.socket = socket
    }

    createRoom(data) {
        console.log(data)
        this.roomId = data.roomId
        this.selfPlayer.isHost = (account.userId() == data.masterId)
        this.otherPlayers.forEach((player) => {
            if (player.userInfo.id == data.masterId) {
                player.isHost = true
            }
        })
    }

    initSelfPlayerData(data) {
        this.selfPlayer.initCardList(data)
    }

    playerMatch(playList) {
        for (var i = 0; i < playList.length; ++i) {
            var otherPlayer = new Player(playList[i], false)
            this.otherPlayers.push(otherPlayer)
        }

        if (this.checkPlayersStepSync()) {
            this.gameInfo.text = '匹配成功'
            this.gameInfo.step = 'match_success'
            return true
        }
        return false
    }

    selfShowCard() {
        const showCardList = this.selfPlayer.showCardList()
        this.socket.sendMessage({
            senderId: account.userId(),
            receiverId: this.roomId,
            cmd: 'GAME_DATA_SHOW',
            data: {
                playerId: account.userId(),
                showCardList: showCardList
            }
        })
        return this.checkShowCardState()
    }

    playerShowCards(data) {
        const cardList = data.showCardList
        this.otherPlayers.forEach((player) => {
            if (player.userInfo.id == data.playerId) {
                player.setShowCardList(cardList)
            }
        })

        return this.checkShowCardState()
    }

    checkShowCardState() {
        if (this.checkPlayersStepSync()) {
            this.gameInfo.text = '亮牌结束'
            return true
        }
        else {
            if (this.selfPlayer.step == 'ready_end') {
                this.gameInfo.text = '已亮牌，请等待对方亮牌'
            }
            else {
                this.gameInfo.text = this.playerNum > 2 ? '其他玩家已亮牌，请亮牌' : '对方已亮牌，请亮牌'
            }
            return false
        }
    }

    selfSendCard(cb) {
        this.gameInfo.text = '请等待对方出牌'

        const sendCard = this.selfPlayer.sendCard()
        this.socket.sendMessage({
            senderId: account.userId(),
            receiverId: this.roomId,
            cmd: 'GAME_DATA_PLAY',
            data: {
                playerId: account.userId(),
                sendCard: sendCard
            }
        })

        setTimeout(() => {
            cb(this.checkSendCardState())
        }, 300)
    }

    playerSendCard(data, cb) {
        const sendCard = data.sendCard
        this.otherPlayers.forEach((player) => {
            if (player.userInfo.id == data.playerId) {
                player.setSendCard(sendCard)
            }
        })

        setTimeout(() => {
            cb(this.checkSendCardState())
        }, 300)
    }

    checkSendCardState() {
        if (this.checkPlayersStepSync()) {
            const ret = this.caculateGameResult()
            if (ret == 0) this.gameInfo.text = '打平了'
            if (ret == -1) this.gameInfo.text = '你输了'
            if (ret == 1) this.gameInfo.text = '你赢了'

            if (this.isGameOver()) {
                this.gameInfo.text = '游戏结束'
                return 'set_over'
            }
            else {
                return 'all_sended'
            }
        }
        else {
            if (this.selfPlayer.step == 'played') {
                this.gameInfo.text = '已出牌，请等待对方出牌'
            }
            else {
                this.gameInfo.text = '请出牌'
            }
            return 'play_sended'
        }
    }

    caculateGameResult() {
        var ret = 0
        var selfCardValue = this.selfPlayer.selectedCard.value
        for (var i = 0; i < this.otherPlayers.length; ++i) {
            var player = this.otherPlayers[i]
            player.selectedCard.isShowValue = true
            player.selectedCard.isSended = true

            var playerCardValue = player.selectedCard.value
            if (playerCardValue == selfCardValue) {
                ret = 0
            } else if (playerCardValue == 1 && selfCardValue == 2) {
                ret = 1
            } else if (playerCardValue == 2 && selfCardValue == 3) {
                ret = 1
            } else if (playerCardValue == 3 && selfCardValue == 1) {
                ret = 1
            } else {
                ret = -1
            }
            player.score -= ret
            this.gameInfo.otherScore = player.score
        }

        this.selfPlayer.score += ret
        this.gameInfo.selfScore = this.selfPlayer.score
        return ret
    }

    gameReady() {
        this.gameInfo = {
            step: 'ready',
            text: '请先选择两张牌亮牌',
            timeDown: 0
        }
        this.selfPlayer.step = 'ready'
    }

    gameResetPlay() {
        this.gameInfo.step = 'play'
        this.gameInfo.text = '请出牌'
        this.selfPlayer.resetCard('play')
        this.otherPlayers.forEach((player) => {
            player.resetCard('play')
        })
    }

    gameContinuePlay() {
        this.gameInfo.step = 'play'
        this.gameInfo.text = '请出牌'
        this.selfPlayer.step = 'play'
        this.selfPlayer.selectedCard.disable = true
        this.otherPlayers[0].selectedCard.disable = true
        this.otherPlayers.forEach((player) => {
            player.step = 'play'
        })
    }

    gameOver() {
        var selfScore = Math.max(this.selfPlayer.score, 0)
        var otherScore = Math.max(this.otherPlayers[0].score, 0)
        if (selfScore > otherScore) {
            this.gameInfo.text = '你赢得了比赛   ' + selfScore + '：' + otherScore
        } else if (selfScore < otherScore) {
            this.gameInfo.text = '你输掉了比赛   ' + selfScore + '：' + otherScore
        } else {
            this.gameInfo.text = '双方打平   ' + selfScore + '：' + otherScore
        }
        this.gameInfo.isOver = true
        this.gameInfo.step = 'over'
    }

    isGameOver() {
        for (var i = 0; i < this.otherPlayers.length; ++i) {
            var player = this.otherPlayers[i]
            if (!player.isSendedAllCards)
                return false
        }

        if (!this.selfPlayer.isSendedAllCards())
            return this.selfPlayer.isSendedAllCards()
        else
            return true
    }

    checkPlayersStepSync() {
        if (this.otherPlayers.length != this.playerNum - 1) {
            return false
        }
        else {
            var ret = true
            for (var i = 0; i < this.otherPlayers.length; ++i) {
                if (this.otherPlayers[i].step != this.selfPlayer.step) {
                    ret = false
                    break
                }
            }
            return ret
        }
    }

    timeCome(duration) {
        const nowTime = (new Date().getTime() * 0.001)
        if (this.lastTime < 0) {
            this.lastTime = nowTime
        }

        if (nowTime - this.lastTime >= duration) {
            this.lastTime = -1
            return true
        }
        return false
    }

    waitToNextStep(duration, nextStep, cb) {
        if (this.waitHandle) {
            return
        }

        const that = this
        this.waitHandle = setTimeout(() => {
            that.waitHandle = null
            that.gameInfo.step = nextStep
            if (cb) cb
        }, duration)
    }

    tapCardAction(index) {
        if (this.gameInfo.step == 'ready') {
            this.selfPlayer.selectShowCard(index)
        }
        else if (this.gameInfo.step == 'play') {
            this.selfPlayer.selectSendCard(index)
        }
    }

    startTimeDown(time, step, tickCb, endCb) {
        // if (this.timeDownHandle) {
        //     clearInterval(this.timeDownHandle)
        //     this.timeDownHandle = null
        // }

        // this.gameInfo.timeDown = time
        // var that = this
        // this.timeDownHandle = setInterval(() => {
        //     that.gameInfo.timeDown -= 1
        //     if (that.gameInfo.timeDown < 0) {
        //         that.stopTimeDown()
        //         var ret
        //         if (step == 'ready') {
        //             that.selfPlayer.autoSelectCards(2)
        //             ret = that.selfShowCard()
        //             if (endCb) {
        //                 endCb(ret)
        //             }
        //         }
        //         else if (step == 'play') {
        //             that.selfPlayer.autoSelectCards(1)
        //             ret = that.selfSendCard((ret) => {
        //                 if (endCb) {
        //                     endCb(ret)
        //                 }
        //             })
        //         }
        //     }
        //     if (tickCb) {
        //         tickCb()
        //     }
        // }, 1000)
    }

    stopTimeDown() {
        this.gameInfo.timeDown = -1
        if (this.timeDownHandle) {
            clearInterval(this.timeDownHandle)
            this.timeDownHandle = null
        }
    }

    destroy() {
        this.socket.sendMessage({
            senderId: account.userId(),
            receiverId: 0,
            cmd: this.gameInfo.step == 'match' ? 'FREE_MATCHING' : 'END_GAME'
        })
        setTimeout(() => {
            this.socket.close()
        }, 1000)
    }
}

export { GameManager }