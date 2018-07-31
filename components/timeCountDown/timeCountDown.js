var countDownTime;
Page({
    data: {
        width: 30,
        height: 30,
        countDownTime: 0,
    },
    onLoad() {
        this.setDate({
            time: countDownTime,
        });
        console.log("countDownTime onLoad");
    },

    onReady() {
        var ctx = my.createCanvasContext('clock');
        ctx.setFillStyle('#dddddd');
        ctx.fillRect(0, 0, 305, 305);
        console.log("countDownTime onReady");
    },

    // 所有的canvas属性以及Math.sin,Math.cos()等涉及角度的参数都是用弧度表示
    // 时钟
    drawClock: function () {
        const ctx = wx.createCanvasContext('clock');
        var height = this.height;
        var width = this.width;
        // 设置文字对应的半径
        var R = width / 2 - 60;
        // 把原点的位置移动到屏幕中间，及宽的一半，高的一半
        ctx.translate(width / 2, height / 2);
    },

    // 画外框
    drawBackground: function () {
        // 设置线条的粗细，单位px
        ctx.setLineWidth(8);
        // 开始路径
        ctx.beginPath();
        // 运动一个圆的路径
        // arc(x,y,半径,起始位置，结束位置，false为顺时针运动)
        ctx.arc(0, 0, width / 2 - 30, 0, 2 * Math.PI, false);
        ctx.closePath();
        // 描出点的路径
        ctx.stroke();
    },
});
export default {
    countDownTime: countDownTime,
}