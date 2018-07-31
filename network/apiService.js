/**
 * 此文件管理项目所有接口
 */
import { get, post, put, del } from './network';

//var ip_port = "47.105.33.208";
var ip_port="www.superminigame.cn"

const API_ROOT = "https://" + ip_port;

// module.exports = {
//     API_REQEUST_MATCH_PLAYER: API_BASE+"requestMatchPlayer",
// }
export const baseSocketUrl = "wss://" + ip_port + "/guess/websocket/socketServer.do?userId=";

export const requestUserInfo = (uid) => get(`${API_ROOT}/guess/user/getInfo?userId=${uid}`);
export const requestLogin = (authCode) => get(`${API_ROOT}/guess/applet/getSession?authCode=${authCode}`);
export const requestMatchPlayer = (uid) => get(`${API_ROOT}/guess/applet/${uid}`);
export const requestGamePrize = (roomId) => get(`${API_ROOT}/guess/applet/getGamePrize?roomId=${roomId}`);
export const requestGameResult = (roomId, uid) => get(`${API_ROOT}/guess/applet/gameEnded?roomId=${roomId}&userId=${uid}`);
//获取积分排行榜
export const requestRanking = (uid) => get(`${API_ROOT}/guess/applet/getRanking?userId=${uid}`);
//获取兑换区奖品列表
export const requestExcList = (uid) => get(`${API_ROOT}/guess/applet/getExcList`);
//兑换奖品操作
export const requestPrizeExchange = (prizeId, uid) => get(`${API_ROOT}/guess/applet/prizeExchange?prizeId=${prizeId}&userId=${uid}`);
//用户签到 
export const requestSignIn = (uid) => get(`${API_ROOT}/guess/applet/signIn?userId=${uid}`);
//获取签到信息
export const requestSignData = (uid) => get(`${API_ROOT}/guess/applet/getSignInInfo?userId=${uid}`);
//获取个人中心信息 
export const requestUserInfoCenter = (uid) => get(`${API_ROOT}/guess/applet/getUserInfoCenter?userId=${uid}`);
//获取"我的物品"列表
export const requestUserPrize = (uid, cp, ps) => get(`${API_ROOT}/guess/applet/getUserPrize?userId=${uid}&currentPage=${cp}&pageSize=${ps}`);
/**
 * 获取邀请好友对战的信息
 * int roomType // 0匹配，1好友对战（逐张出牌），2好友对战（顺序出牌）
 */
export const requestInviteFight = (roomType,uid) => get(`${API_ROOT}/guess/applet/getCombatRoom?roomType=${roomType}&userId=${uid}`);
export const requestGetShareInfo = (type) => get(`${API_ROOT}/guess/applet/getShareInfo?type=${type}`);