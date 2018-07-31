/**
 * 参考 http://www.cnblogs.com/hlwyfeng/p/6099957.html
 */
class InterfaceHelp {

    constructor() {
    }

    //第一个参数是接口名称
    //第二个参数是一个数组，数组是元素是字符串的格式，里面分别是接口定义的方法
    //Interface = function (name, methods) {
    addInterface(name, methods) {
        if (arguments.length != 2) {
            throw new Error("参数数量不对，期望传入两个参数，但是只传入了" + arguments.length + "个参数");
        }
        this.name = name;
        this.methods = [];
        for (var i = 0, len = methods.length; i < len; i++) {
            if (typeof methods[i] !== "string") {
                throw new Error("期望传入的方法名是以字符串的格式类型，而不是" + (typeof methods[i]) + "类型");
            }
            this.methods.push(methods[i]);
        }
        var returnValue = new InterfaceHelp();
        returnValue.name = name;
        returnValue.methods = methods;
        return returnValue;
    }

    // 辅助函数
    //Interface.ensureImplements = function (object) {
    ensureImplements(object) {
        var that = this;
        if (arguments.length < 2) {
            throw new Error("期望传入至少两个参数，这里仅传入" + arguments.length + "个参数");
        }
        for (var i = 1; i < arguments.length; i++) {
            var interface_ = arguments[i];
            if (!(interface_ instanceof InterfaceHelp)) {
                throw new Error(arguments[i] + "不是一个接口");
            }
            for (var j = 0, methodsLen = interface_.methods.length; j < methodsLen; j++) {
                var method = interface_.methods[j];
                console.log(method);
                if (!object[method] || typeof object[method] !== "function") {
                    throw new Error("对象的方法 " + method + " 与接口 " + interface_.name + " 定义的不一致");
                }
            }
        }
    }
}

export { InterfaceHelp }