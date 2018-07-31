const account = require('./accountManager.js');
import { SocketHelper } from '../network/SocketHelper.js';
import { baseSocketUrl } from "../network/apiService.js";

var SocketManager = (function () {

    var instantiated;
    var socket;
    var fns = [];
    var socketListener;
    var isSocketInit = false;
    var lastSentMsg = "";
    var checkRespReceived = false;
    //var checkSentTimer = null;
    const tryResentCountLimit = 3;
    var tryResentCount = 0;

    //hadcallback用来防止重复回调
    // var hadSuccessCallback = false;
    // var hadFailureCallback = false;
    // var hadErrorCallback = false;

    function init() {
        /*这里定义单例代码*/
        return {
            // publicMethod: function () {
            //     console.log('hello world');
            // },
            // publicProperty: 'test'

            openSocket: function (cb) {
                var that = this;
                //var callback = cb;
                var matchFailure = "网络联接失败";
                var matchSuccess = "网络联接成功";

                if (socket == null) {
                    that.socketListener = function (res) {
                        that.updateSocketValue(res);
                    };
                    socket = new SocketHelper(baseSocketUrl + account.userId())
                    socket.setSocketReconnectCallback({
                        success() {
                            that.executeResendMsg();
                        }
                    });
                    socket.setReceivedRespCallback({
                        success() {
                            console.log('receivedRespCallback,清空lastSentMsg');
                            //当收到服务器返回的received后，清空上次发送的msg
                            lastSentMsg = "";
                            checkRespReceived = true;
                        }
                    });
                    console.log("socket init:" + baseSocketUrl + account.userId());
                    socket.open({
                        success() {
                            console.log("socket.open success");
                            if (!that.isSocketInit) {
                                that.isSocketInit = true;
                                console.log("that.isSocketInit = true");
                                socket.onMessageReceive(that.socketListener);
                            }
                            // if (!that.hadSuccessCallback) {
                            //     that.hadSuccessCallback = true;
                            if (cb && cb.hasOwnProperty('success')) {
                                console.log("cb success");
                                cb.success();
                            }
                            // }
                            my.showToast({
                                type: 'success',
                                content: matchSuccess,
                                duration: 1000,
                            });

                            that.executeResendMsg();
                        },
                        fail() {
                            // if (!that.hadFailureCallback) {
                            //     that.hadFailureCallback = true;
                            console.log("socket.open fail");
                            if (cb && cb.hasOwnProperty('fail')) {
                                cb.fail();
                            }
                            // }
                            my.showToast({
                                type: 'fail',
                                content: matchFailure,
                                duration: 3000,
                            });
                        },
                        error() {
                            // if (!that.hadErrorCallback) {
                            //     that.hadErrorCallback = true;
                            console.log("socket.open error");
                            if (cb && cb.hasOwnProperty('error')) {
                                cb.error();
                            }
                            // }
                            my.showToast({
                                type: 'fail',
                                content: matchFailure,
                                duration: 3000,
                            });
                        }
                    })
                }
            },

            isConnected() {
                return socket == null ? false : socket.isConnected();
            },

            executeResendMsg() {
                if (lastSentMsg != "") {
                    //if (lastSentMsg.cmd === "CMD_MATCHING") {
                    //console.log("lastSentMsg.cmd === CMD_MATCHING, resend it: " + lastSentMsg);
                    console.log("lastSentMsg.cmd !=null, resend it: " + lastSentMsg);
                    this.sendMessage(lastSentMsg);
                }
            },

            sendMessage(data) {
                lastSentMsg = data;
                if (socket != null && socket.isConnected()) {
                    socket.sendMessage(data);
                    checkRespReceived = false;
                    this.createCheckSendTimer(data);
                }
            },

            createCheckSendTimer(data) {
                var that = this;
                var checkSentTimer = setInterval(() => {
                    //2s后开始执行这里
                    // setTimeout(() => {
                    console.log("checkRespReceived:" + checkRespReceived);
                    if (!checkRespReceived) {
                        tryResentCount++;
                        //提示太多会让用户觉得麻?!
                        // my.showToast({
                        //     type: 'fail',
                        //     content: "服务器端无响应，正在重发第" + tryResentCount + "次...",
                        //     duration: 500,
                        // });
                        if (tryResentCount > tryResentCountLimit) {
                            checkRespReceived = true;
                            tryResentCount = 0;
                            lastSentMsg = "";
                            //that.cancelCheckSendTimer();
                            if (checkSentTimer != null) {
                                clearInterval(checkSentTimer);
                                checkSentTimer = null;
                                console.log("cancelCheckSendTimer");
                            }
                            //that.executeResentTimeoutCallback();
                            //超过尝试发送次数，退出
                            that.backToOptions();
                        } else
                            that.sendMessage(data);
                    } else {
                        //that.cancelCheckSendTimer();
                        if (checkSentTimer != null) {
                            clearInterval(checkSentTimer);
                            checkSentTimer = null;
                            console.log("cancelCheckSendTimer");
                        }
                    }
                }, 2000);//每两秒重发一次上次的cmd
            },

            /**
             *通过app.js里添加的网络状态监听 
             */
            networkStatusChange: function (res, my) {
                //var that = this;
                console.log("network is connected:" + res.isConnected);
                console.log("network Type:" + res.networkType);
                // var str = res.networkType === ("UNKNOWN" || "none") ? "网络断开了" : "网络已连接";
                //var connected = res.networkType === ("UNKNOWN" || "none") ? false : true;
                //var str = res.isConnected ? "网络已连接" : "网络断开了";//<-真机
                var connected = res.isConnected;//<-真机
                // my.showToast({
                //     type: res.isConnected ? 'success' : 'fail',
                //     content: str,
                //     duration: 1000,
                // });
                if (connected) {
                    my.showToast({
                        type: 'success',
                        content: "正在重新连接服务器...",
                        duration: 2000,
                    });
                } else {
                    //执行了closeSocket,在SocketHelper里的onSocketClose就会执行
                    this.backToOptions();
                }
            },

            backToOptions: function () {
                if (socket != null) {
                    socket.setConnectedValue(false);
                    socket = null;
                    my.showToast({
                        type: 'fail',
                        content: "网络已断开,正在跳转中...",
                        duration: 2000,
                        success: () => {
                            /*my.redirectTo({
                                //url: '/pages/options/options?backFormNetworkProblem=true'
                                url: '/pages/index/index'
                            });*/
                            //关闭当前所有页面，跳转到应用内的某个指定页面
                            my.reLaunch({
                                url: '/pages/index/index'
                            })
                        },
                    });
                }
            },

            closeSocket: function () {
                //closeSocket: function (closeByMySelf) {
                // this.hadFailureCallback = false;
                // this.hadErrorCallback = false;
                // this.hadSuccessCallback = false;
                if (socket) {
                    socket.close();
                    //socket.unRegOpenCallback();
                    //socket.close(closeByMySelf);
                    socket = null;
                }
            },

            subscribeSocket: function (fn) {
                //console.log("socket subscribe:" + fn);
                fns.push(fn);
            },

            unsubscribeSocket: function (fn) {
                //console.log("socket unsubscribeSocket:" + fn);
                fns = fns.filter(
                    function (el) {
                        if (el !== fn) {
                            return el;
                        }
                    }
                );
            },

            updateSocketValue: function (o, thisObj) {
                //console.log("updateSocketValue:"+o);
                console.log("socket updateSocketValue:" + o);
                var scope = thisObj || window;
                fns.forEach(
                    function (el) {
                        //console.log("el:"+el);
                        el.call(scope, o);
                    }
                );
            },

            // getSocket: function () {
            //     return socket;
            // }
        };
    }

    return {
        getInstance: function () {
            if (!instantiated) {
                instantiated = init();
            }
            return instantiated;
        }
    };
})();

export { SocketManager }
