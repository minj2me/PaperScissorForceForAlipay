const account = require('../../manager/accountManager.js');
/**
 * 接口的实现
 */
var ContractImpl = function () {
};

ContractImpl.prototype = {

    ///////////////实现View接口///////////////
    showSuccessful: function () {
        my.hideLoading();
        my.showToast({
            type: 'success',
            content: '登录成功',
            duration: 1000,
        });
    },

    showFailure: function () {
        my.hideLoading();
        my.showToast({
            type: 'fail',
            content: '登录失败,请稍后再试',
            duration: 2000,
        });
    },

    ///////////////实现 Presenter 接口///////////////
    doLogin: function (cb) {
        ///登录我们后台
        let authCode = my.getStorageSync({ key: 'authcode' }).data;
        console.log("authCode:" + authCode);

        let loginCallback = {
            success() {
                console.info("loginCallback success");
                // that.showSuccessful();
                // if (view != null)//调用index.js的方法
                //     view.checkIfFormInvite();
                if (cb && cb.hasOwnProperty('success'))
                    cb.success()
            },
            fail() {
                console.info("loginCallback fail");
                //that.showFailure();
                if (cb && cb.hasOwnProperty('fail'))
                    cb.fail()
            }
        };
        account.loginServer(loginCallback, authCode);
    },
};

module.exports = ContractImpl;