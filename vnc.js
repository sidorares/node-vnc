//var rfb = require('rfb2');
var rfb = require('rfb2');
var ui = require('ntk');
var argv = require('optimist').argv;
var _ = require('underscore');

var menu = require('./mainmenu');

ui.createClient(main);
function main(err, app) {
  var mainwnd;
  var r = rfb.createConnection(argv);
  r.on('connect', afterConnect);
  function afterConnect() {
      mainwnd = app.createWindow(_.pick(r, 'title', 'width', 'height')).map();
      var buttonsState = 0;

      // updates from window to vnc server
      mainwnd.on('mousemove', function(ev) { r.pointerEvent(ev.x, ev.y, buttonsState) });
      var handleMouseClick = function(ev) {
        var buttonBit = 1 << (ev.keycode - 1);
        // set button bit
        if (ev.type == 4) // TODO use event name
          buttonsState |= buttonBit;
        else
          buttonsState &= ~buttonBit;
          r.pointerEvent(ev.x, ev.y, buttonsState);
      };
      mainwnd.on('mouseup', handleMouseClick);
      mainwnd.on('mousedown', handleMouseClick);
      var handleKeyClick = function(ev) {
        console.log('MOUSE CLICK!!!');
        var shift = ev.buttons & 1;
        var isDown = (ev.type == 2) ? 1 : 0;
        r.keyEvent(ev.keysym, isDown);
      };
      mainwnd.on('keyup', handleKeyClick);
      mainwnd.on('keydown', handleKeyClick);

      // updates from vnc server
      r.on('resize', mainwnd.resize.bind(mainwnd));
      var ctx = mainwnd.getContext('2d', function(err, ctx) {
        r.on('rect', function(rect) {
          if (rect.encoding == rfb.encodings.raw) {
            rect.data = rect.buffer; // TODO: rename in rfb
            ctx.putImageData(rect, rect.x, rect.y);
          } else if (rect.encoding == rfb.encodings.copyRect) {
            //ctx.drawImage(canvas, rect.src.x, rect.src.y, rect.width, rect.height, rect.x, rect.y);
          } else if (rect.encoding == rfb.encodings.hextile) {
            console.log('hextile rec! (currently not fully supported');
            rect.on('tile', function(tile) {
              console.log('tile:', tile);
            });
          }
        });
      });
      mainwnd.on('close', r.end.bind(r));
      //var mainmenu = mainwnd.addMenu(menu);
      //mainmenu.on('clicked', console.log);
    }
}
