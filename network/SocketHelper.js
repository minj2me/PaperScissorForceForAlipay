/**
 * 实现TextWebSocketHandler中的类中在 afterConnectionClosed();
 * 连接关闭后,里面如果定义了用户断开连接就移除websocketsession就没有问题。
 * 还有就是不要在多个页面建立连接，尽量使用子夫页面互调方法的方式实现数据传递。
 */

//import { SocketManager } from "../manager/socketManager.js";

// webSocket助手，负责socket连接管理
class SocketHelper {
    constructor(url) {
        this.lastResData = "";
        //this.lastSentData = "";
        this.host = url
        this.connected = false
        //this.closeSocketByMySelf = false;
        var that = this
        var socketReconnectCallback = null;
        var sockeCloseCallback = null;
        var resentTimeoutCallback = null;
        var receivedRespCallback = null;
        this.reconnecting = false;
        this.needGetReceivedResp = false;
        this.tryResentCount = 0, this.tryResentCountLimit = 6;
        this.checkTimer = null;

        my.onSocketClose((res) => {
            //1.服务器产生异常后，断开了网络连接，客户端会执行这里
            //2.手机，浏览器或模拟器断网后也不会执行onSocketClose方法
            console.log('WebSocket closed!')

            that.connected = false

            //断开后，尝试重连，websocket会自动处理断开前的信息收发(前提出服务器端没有走onerror)
            // setTimeout(() => {
            //     if (!that.closed) {
            //         that.open()
            //     }
            // }, 1000)
        })
    }

    setResentTimeoutCallback(cb) {
        this.resentTimeoutCallback = cb;
    }

    setSocketCloseCallback(cb) {
        this.sockeCloseCallback = cb;
    }

    setSocketReconnectCallback(cb) {
        this.socketReconnectCallback = cb;
    }

    setReceivedRespCallback(cb) {
        this.receivedRespCallback = cb;
    }

    close() {
        this.closed = true
        try {
            my.closeSocket({
                success() {
                    console.log('WebSocket closing')
                },
                fail(e) {
                    console.log('WebSocket close failure: ', e)
                }
            });
        } catch (e) {
        }
    }

    executeReconnect() {
        if (this.reconnecting) {
            console.log("reconnecting...");
            return;
        }
        this.reconnecting = true;
        var reConnectTimer = setInterval(() => {
            //setTimeout(() => {
            console.log("try to reconnect.");
            if (this.isConnected()) {
                clearInterval(reConnectTimer);
                this.reconnecting = false;
                if (this.socketReconnectCallback &&
                    this.socketReconnectCallback.hasOwnProperty('success')) {
                    console.log('socketReconnectCallback');
                    this.socketReconnectCallback.success();
                }
            } else {
                this.open()
            }
        }, 6000);
    }

    setConnectedValue(value) {
        this.connected = value;
    }

    isConnected() {
        console.log('this.connected:' + this.connected);
        return this.connected;
    }

    open(cb) {
        if (this.connected || !this.host) {
            return
        }

        this.closed = false
        var that = this

        my.connectSocket({
            url: that.host,
            // header: {
            //     'User-Agent': "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36"
            // },
            success() {
                console.log('WebSocket connecting: ' + (that.host))
                //如果在模拟器下，一定要打开以下代码，真机上就要屏掉
                // that.connected = true
                // if (cb && cb.hasOwnProperty('success')) {
                //     cb.success()
                // }
            },
            fail(e) {
                // if (!hadFailureCallback) {
                //     hadFailureCallback = true;
                console.log('WebSocket open failure: ', e)
                if (cb && cb.hasOwnProperty('fail')) {
                    cb.fail()
                }
                //尝试重连
                that.executeReconnect();
            }
            // }
        })

        my.onSocketError(function (err) {
            // if (!hadErrorCallback) {
            //     hadErrorCallback = true;
            console.log('WebSocket open failure and try to reconnect: ', err)
            that.connected = false
            if (cb && cb.hasOwnProperty('error')) {
                cb.error();
            }
            //尝试重连
            that.executeReconnect();
            // }
        })

        my.onSocketOpen(() => {
            // if (!hadSuccessCallback) {
            //     hadSuccessCallback = true;
            if (!that.connected) {
                //that.closeSocketByMySelf = false;
                console.log('WebSocket connect success');
                that.connected = true
                if (cb && cb.hasOwnProperty('success')) {
                    cb.success()
                }
            }
            // }
        })

    }

    socketCloseCallback() {
        if (this.sockeCloseCallback &&
            this.sockeCloseCallback.hasOwnProperty('success')) {
            console.log('sockeCloseCallback');
            this.sockeCloseCallback.success();
        }
    }

    // 发送socket消息，Json对象将转成Json字符串发送
    sendMessage(data) {
        var msgStr = "";
        var that = this;
        try {
            msgStr = JSON.stringify(data);
        } catch (e) {
            console.log('fixing sending data failure:');
            console.log(e);
        } finally {

            if (!this.connected) {
                my.showToast({
                    type: 'fail',
                    //content: "连接服务器失败，请退出并重试哦~",
                    content: "连接服务器失败,重连中...",
                    duration: 2000,
                });
                //尝试重连
                that.executeReconnect();
                return;
            }

            //断开后，网络重连后，websocket会自动处理断开前的信息发送
            my.sendSocketMessage({
                data: msgStr,
                success() {
                    console.log('WebSocket sent msg successful' + msgStr)
                },
                fail(e) {
                    console.error(JSON.stringify(e));
                    my.showToast({
                        type: 'fail',
                        //content: "连接服务器失败，请退出并重试哦~",
                        content: "连接服务器失败",
                        duration: 2000,
                    });
                }
            })
        }
    }

    // 接收socket消息，Json字符串将转成Json对象
    onMessageReceive(cb) {
        var that = this;
        if (typeof (cb) != 'function')
            return
        // 监听服务器消息
        my.onSocketMessage((res) => {
            if (res && cb) {
                var msgObj = {}
            }
            that.lastResData = res.data;
            try {
                msgObj = JSON.parse(res.data);
            }
            catch (e) {
                console.log('解析Json消息失败，这可能不是Json对象');
                console.log(e);
            }
            finally {
                //当收到上一条的rep后，清空lastSentData
                //if (msgObj.cmd === "RSP_CMD_RECEIVED") {
                if (that.receivedRespCallback &&
                    that.receivedRespCallback.hasOwnProperty('success')) {
                    //console.log('receivedRespCallback');
                    that.receivedRespCallback.success();
                }
                //}
                console.log('WebSocket got msg: ' + res.data);
                cb(msgObj);
            }
            //end
        })
    }
}
export { SocketHelper }