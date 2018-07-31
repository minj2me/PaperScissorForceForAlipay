import { InterfaceHelp } from "../../utils/Interfaces.js";
//const interfaceHelp = require('../../utils/Interfaces.js');

var interfaceHelp;

function checkImpl(impl) {
  interfaceHelp = new InterfaceHelp();
  /*
  interface View(){
    function showSuccessful();
    function showFailure();
  }
  
  interface Presenter(){
    function doLogin();
  }
  */
  //第一个参数是接口名称
  //第二个参数是一个数组，数组是元素是字符串的格式，里面分别是接口定义的方法
  var View = interfaceHelp.addInterface("View", ["showSuccessful", "showFailure"]);
  var Presenter = interfaceHelp.addInterface("Presenter", ["doLogin"]);
  // console.log(View);
  // console.log(Presenter);
  //var View1 = null;
  //如果这里把View1传进ensureImplements,会提示error,因为View1不是通过addInterface生成，表示不是一个接口
  //interfaceHelp.ensureImplements(impl, View, Presenter, View1);
  interfaceHelp.ensureImplements(impl, View, Presenter);
}

module.exports = {
  checkImpl: checkImpl,
}