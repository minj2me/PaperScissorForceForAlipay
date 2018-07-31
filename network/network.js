/**
 * 基于Promise的网络请求库,包含GET POST请求，上传下载功能
 * 使用方法：
 * 先引入： import {get,post,...} from 本文件;
 * · get请求:    get("/index",{id:2}).then(data=>{}).catch(error=>{});
 * · post请求:    post("/index",{id:2}).then(data=>{}).catch(error=>{});
 * Promise详细介绍：
 * http://es6.ruanyifeng.com/#docs/promise
 */

/**
 * 发起get请求
 * @param url 请求路径 必填
 * @param data 请求参数 get请求的参数会自动拼到地址后面
 */
export const get = (url, data, headers) => request('GET', url, data, headers);

/**
 * 发起post请求
 * @param url 请求路径 必填
 * @param data 请求参数
 * @param headers 请求头
 */
export const post = (url, data, headers) => request('POST', url, data, headers);
/**
 * 发起put请求
 * @param url 请求路径 必填
 * @param data 请求参数
 * @param headers 请求头
 */
export const put = (url, data, headers) => request('PUT', url, data, headers);
/**
 * 发起delete请求
 * @param url 请求路径 必填
 * @param data 请求参数 delete请求的参数会自动拼到地址后面
 */
export const del = (url, data, headers) => request('DELETE', url, data, headers);

/**
 * 接口请求基类方法
 * @param method 请求方法 必填
 * @param url 请求路径 必填
 * @param data 请求参数
 * @param header 请求头
 * @returns {Promise}
 */
export function request(method, url, data, headers = { 'Content-Type': 'application/json' }) {
    console.info(method, url);
    var timeOut = 30000;
    return new Promise((resolve, reject) => {
        const response = {};
        my.httpRequest({
            url, headers, method, data, timeOut,
            success: function (res) {
                console.info('服务器返回')
                console.info(res)
                console.info("res.data.code:" + res.data.code);
                if (res.data.code === 0) {
                    response.success = res.data.data; // 将在then方法中看到的数据
                } else if (res.data.code === 1) { //用户token错误
                    my.navigateTo({ url: '/pages/index/index' }); // 跳去首页
                } else {
                    response.fail = res.data; // 你将在catch方法中接收到该错误
                }
                if (response.success) {
                    console.info('请求成功', response.success);
                    resolve(response.success)
                } else {
                    console.info('请求失败', response.fail);
                    reject(response.fail)
                }
            },
            //fail: (error) => response.fail = error,//将在catch方法中接收到该错误
            fail: function (error) {
                response.fail = error
                reject(response.fail)
            },//将在catch方法中接收到该错误
            complete: function (res) {
                //https://openclub.alipay.com/read.php?tid=6808&fid=65&ant_source=zsearch#floor_reply
                //因为新版ide没有complete回调
                // console.group('==============>请求开始<==============');
                // console.info(method, url);
                // if (response.success) {
                //     console.info('请求成功', response.success);
                //     resolve(response.success)
                // } else {
                //     console.info('请求失败', response.fail);
                //     reject(response.fail)
                // }
                // console.info('==============>请求结束<==============');
                // console.groupEnd();
            },
        });
    });
}
