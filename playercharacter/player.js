
class Player {
    constructor(userInfo, self) {
        this.starNum = 100
        this.score = 0
        
        this.userInfo = userInfo
        this.isSelf = self
        this.isHost = false
        this.step = 'wait_match'

        this.selectedCard = null
        this.timeDown = 0
        this.resetNormalCardData()
    }

    resetNormalCardData() {
        this.sendedCards = []
        this.cards = []
        for (var i = 0; i < 3; ++i) {
            var card = {
                index: i,
                value: 0,
                isSelected: false,
                isShowValue: false,
                isSended: false
            }
            this.cards.push(card)
        }
    }

    resetCard(step) {
        this.step = step
        this.showSubmitBtn = false
        if (this.isSelf) {
            this.randSortCards()
            this.cards.forEach((card) => {
                card.isSelected = false
                card.isSended = false
            })
        }
        else {
            this.resetNormalCardData()
        }
    }

    initCardList(cardList) {
        cardList.forEach((card, idx) => {
            card.index = idx
            card.isShowValue = true
        })
        this.cards = cardList
    }

    setShowCardList(cardList) {
        this.step = 'ready_end'
        cardList.forEach((card) => {
            let am = wx.createAnimation({
                duration: 150,
                timingFunction: 'linear'
            })
            am.rotateY(180).step()
            card.showAm = am.export()
            this.cards[card.index] = card
        })
    }

    showCardList(cardList) {
        this.step = 'ready_end'
        var cards = []
        this.cards.forEach((card) => {
            if (card.isSelected) cards.push(card)
        })
        return cards
    }

    setSendCard(card) {
        card.isSelected = true
        card.isSended = true
        card.isShowValue = false
        this.cards[card.index] = card
        this.step = 'played'
        this.selectedCard = card
        this.sendedCards.push(card)

        // let am = wx.createAnimation({
        //     duration: 150,
        //     timingFunction: 'linear'
        // })
        // am.rotateY(180).step()
        // card.showAm = am.export()
    }

    sendCard() {
        this.step = 'played'
        const card = this.selectedCard
        if (card) {
            card.isSended = true
            this.sendedCards.push(card)
            this.showSubmitBtn = false
            return card
        }
        return {}
    }

    selectShowCard(index) {
        var card = this.cards[index]
        card.isSelected = !card.isSelected
        this.showSubmitBtn = (this.numberOfSelectedCard() == 2)
        return card
    }

    selectSendCard(index) {
        var card = this.cards[index]
        if (card.isSended) {
            return null
        }

        card.isSelected = !card.isSelected
        for (var i=0; i<this.cards.length; ++i) {
            if (index != i && this.cards[i].isSelected) {
                this.cards[i].isSelected = false
            }
        }
        this.selectedCard = card
        this.showSubmitBtn = card.isSelected
        return card
    }

    isSendedAllCards() {
        for (var i = 0; i < this.cards.length; ++i) {
            var card = this.cards[i]
            if (!card.isSended)
                return false
        }

        return true
    }

    numberOfSelectedCard() {
        var num = 0
        this.cards.forEach((card) => {
            num += (card.isSelected && !card.isSended) ? 1 : 0
        })
        return num
    }

    autoSelectCards(num) {
        var count = this.numberOfSelectedCard()
        if (count > num) {
            return
        }

        for (var i = 0; i < this.cards.length; ++i) {
            var card = this.cards[i]
            if (count < num && !card.isSelected && !card.isSended) {
                count += 1
                card.isSelected = true
                this.selectedCard = card
            }
        } 
    }

    randSortCards() {
        const indexList = [[2, 1, 0], [0, 2, 1], [2, 0, 1], [1, 0, 2], [1, 2, 0]]
        var randIndex = new Date().getTime() % indexList.length
        var newIndices = indexList[randIndex]
        var newCards = []
        for (var i = 0; i < newIndices.length; ++i) {
            var idx = newIndices[i]
            var card = this.cards[idx]
            card.index = i
            newCards.push(card)
        }
        this.cards = newCards
    }
}

export { Player }