import { requestLogin } from "../network/apiService";

var sIsLogin = false
var sIsLoginProgress = false
var sUserInfo = {
    // id:10003,
    // name: "johnny",
    // avatar: "https://avatars0.githubusercontent.com/u/511130?s=460&v=4"
    id: 10000,
    aliUserId: "2088002868016122",
    avatar: "https://tfs.alipayobjects.com/images/partner/T1s0NaXk4bXXXXXXXX",
    nickName: "Johnny_local",
    gender: 0,
    provinceName: "广东省",
    cityName: "广州市",
    createTime: "May 15, 2018 5:55:58 PM",
    updateTime: "May 15, 2018 5:55:58 PM",
    isVisible: 1,
    accessToken: "authusrBc75259dc5be64041ae7a0caaa11caX12",
    stars:0
}
//var sUserId = 10003

// 登录
function loginServer(cb, authCode) {
    if (sIsLogin) {
        console.log("loginServer,sIsLogin:"+sIsLogin);
        if (cb && cb.hasOwnProperty('success'))
            cb.success()
        if (cb && cb.hasOwnProperty('completion'))
            cb.completion()
        return
    }

    if (sIsLoginProgress) {
        if (cb && cb.hasOwnProperty('fail'))
            cb.fail('登录操作正在进行中，请勿重复发起')
        return
    }

    sIsLoginProgress = true

    requestLogin(authCode).then(data => {
        //userInfo: data;
        setUserInfo(data);
        sIsLogin=true;
        if (cb && cb.hasOwnProperty('success'))
            cb.success()
    }).catch(e => {
        console.error("requestLogin error", e);
        sIsLogin=false;
        if (cb && cb.hasOwnProperty('fail'))
            cb.fail()
    });

    /*var loginSuccessAction = function (code) {
        wx.getUserInfo({
            success(res) {
                wx.request({
                    url: 'http://120.77.147.147:8080/guess/test/account/login_for_wxapp/1',
                    method: 'POST',
                    header: { 'Content-Type': 'application/json'},
                    data: {
                        code: code,
                        encryptedData: res.encryptedData,
                        iv: res.iv
                    },
                    success(response) {
                        console.log(response)
                        if (response.data.code == 1) {
                            sUserId = response.data.user.id
                            sUserInfo = response.data.user
                            wx.setStorage({
                                key: 'xx_user_info',
                                data: sUserInfo,
                            })

                            sIsLogin = true
                            if (cb && cb.hasOwnProperty('success'))
                                cb.success()
                            if (cb && cb.hasOwnProperty('completion'))
                                cb.completion()
                            sIsLoginProgress = false
                        }
                        else {
                            sIsLogin = false
                            if (cb && cb.hasOwnProperty('fail'))
                                cb.fail()
                            if (cb && cb.hasOwnProperty('completion'))
                                cb.completion()
                            sIsLoginProgress = false
                        }
                    },
                    fail(e) {
                        console.log(e)
                        sIsLogin = false
                        if (cb && cb.hasOwnProperty('fail'))
                            cb.fail()
                        if (cb && cb.hasOwnProperty('completion'))
                            cb.completion()
                        sIsLoginProgress = false
                    }
                })
            },
            fail(e) {
                console.log(e)
            }
        })
    }*/

}//end function login

function isLogin() {
    return sIsLogin;
}

function userInfo() {
    return sUserInfo;
}

function setUserInfo(userInfo_) {
    sUserInfo = userInfo_;
    console.log(sUserInfo);
}

function userId() {
    return sUserInfo.id;
}

function sessionId() {
    return sSessionId;
}

module.exports = {
    loginServer: loginServer,
    isLogin: isLogin,
    userId: userId,
    sessionId: sessionId,
    userInfo: userInfo,
    setUserInfo: setUserInfo
}