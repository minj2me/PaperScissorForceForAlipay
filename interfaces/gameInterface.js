/**
 * 有关游戏相关的接口的定义
 */

import { InterfaceHelp } from "../utils/Interfaces.js";

var interfaceHelp;

function checkImpl(impl) {
    interfaceHelp = new InterfaceHelp();
    /*
    interface View(){
      function matchingSuccessful();
      function matchingFailure();
      function showOrderPlayerConfirm();
      function showMyInfo();
      function showOtherPlayerInfo();
    }
  
    interface Presenter(){
      function matching();
      function sendCard();
      function setCard();
      function setCardByList();
      function requestGamePrize();
      function subscribeSocket();
      function unSubscribeSocket();
      function compareWithServer();
      function getGameCountDownTime();
    }
    */
    //第一个参数是接口名称
    //第二个参数是一个数组，数组是元素是字符串的格式，里面分别是接口定义的方法
    var View = interfaceHelp.addInterface("View",
        ["matchingSuccessful",
            "matchingFailure",
            "showOrderPlayerConfirm",
            "showMyInfo",
            "showOtherPlayerInfo"]
    );
    var Presenter = interfaceHelp.addInterface("Presenter",
        ["matching",
            "sendCard",
            "compareWithServer",
            "getGameCountDownTime",
            "requestGamePrize",
            // "setCard",
            // "setCardByList",
            "subscribeSocket",
            "unSubscribeSocket"]);

    interfaceHelp.ensureImplements(impl, View, Presenter);
}

module.exports = {
    checkImpl: checkImpl,
}