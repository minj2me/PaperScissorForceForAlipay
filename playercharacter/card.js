
const images = require( '../utils/images.js' );

function Card(opts) {
    var value = this.value = opts.value;
    //var cxt = this.cxt = opts.ctx;
    const ctx = my.createCanvasContext('awesomeCanvas');

    //setting card's bg
    function drawBg() {
         var bg_img = images["cardBg"];
        var bg_img_width = bg_img.width;
        var bg_img_height = bg_img.height;
        cxt.drawImage( bg_img.src, 0, 0, bg_img_width, bg_img_height );
    }

    function drawScissor() {
          var img = images["card1"];
        var img_width = img.width;
        var img_height = img.height;
        cxt.drawImage( img.src, 0, 0, img_width, img_height );
    }

     function drawForce() {
          var img = images["card2"];
        var img_width = img.width;
        var img_height = img.height;
        cxt.drawImage( img.src, 0, 0, img_width, img_height );
    }

     function drawPaper() {
          var img = images["card3"];
        var img_width = img.width;
        var img_height = img.height;
        cxt.drawImage( img.src, 0, 0, img_width, img_height );
    }
}//end Card

module.exports = Card;