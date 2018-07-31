function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

/**
 * 
 * Js获取当前日期时间及其它操作
var myDate = new Date();
myDate.getYear();        //获取当前年份(2位)
myDate.getFullYear();    //获取完整的年份(4位,1970-????)
myDate.getMonth();       //获取当前月份(0-11,0代表1月)
myDate.getDate();        //获取当前日(1-31)
myDate.getDay();         //获取当前星期X(0-6,0代表星期天)
myDate.getTime();        //获取当前时间(从1970.1.1开始的毫秒数)
myDate.getHours();       //获取当前小时数(0-23)
myDate.getMinutes();     //获取当前分钟数(0-59)
myDate.getSeconds();     //获取当前秒数(0-59)
myDate.getMilliseconds();    //获取当前毫秒数(0-999)
myDate.toLocaleDateString();     //获取当前日期
var mytime=myDate.toLocaleTimeString();     //获取当前时间
myDate.toLocaleString( );        //获取日期与时间
 */

//转换为天数
function formatDayTime(date) {
  let formatStr='';
  var day = parseInt(date/24/60/60) ;
  var hour = parseInt(date/60/60);
  var minute=parseInt(date/60);
  if(day>=1){
    formatStr=day+'天'
  }else{
      if(hour>=1){
        formatStr=hour+'小时'
      }else{
        formatStr=minute+'分钟'
      }
  }
  return formatStr;
}
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function isFunction( obj ) {
  return typeof obj === 'function';
}

function getScaleImageSize(e) { 
  var imageSize = {}; 
  var originalWidth = e.detail.width;//图片原始宽 
  var originalHeight = e.detail.height;//图片原始高 
  var originalScale = originalHeight/originalWidth;//图片高宽比 
  console.log('originalWidth: ' + originalWidth) 
  console.log('originalHeight: ' + originalHeight) 
  //获取屏幕宽高 
  my.getSystemInfo({ 
    success: function (res) {
    var windowWidth = res.windowWidth; 
    var windowHeight = res.windowHeight; 
    var windowscale = windowHeight/windowWidth;//屏幕高宽比 
    console.log('windowWidth: ' + windowWidth) 
    console.log('windowHeight: ' + windowHeight) 
    console.log('windowscale: ' + windowscale) 
    if(originalScale < windowscale){//图片高宽比小于屏幕高宽比 
      //图片缩放后的宽为屏幕宽 
      imageSize.imageWidth = windowWidth; 
      imageSize.imageHeight = (windowWidth * originalHeight) / originalWidth; 
    } else {//图片高宽比大于屏幕高宽比 
      //图片缩放后的高为屏幕高 
      imageSize.imageHeight = windowHeight; 
      imageSize.imageWidth = (windowHeight * originalWidth) / originalHeight; 
    } 
      
    } 
  }) 
  console.log('缩放后的宽: ' + imageSize.imageWidth) 
  console.log('缩放后的高: ' + imageSize.imageHeight) 
  return imageSize; 
}
  
module.exports = {
  formatTime: formatTime,
  formatDayTime:formatDayTime,
  isFunction: isFunction,
  getScaleImageSize: getScaleImageSize,
}