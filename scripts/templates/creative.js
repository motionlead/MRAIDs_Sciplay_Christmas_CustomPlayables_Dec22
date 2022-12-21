(function (window) {
  "use strict";

  var assets = {
    images: @@IMAGES,
    spritesheets: @@SPRITESHEETS,
  };

  ML.ad.assets = assets;

  ML.ad.exec = function () {
    var ad = ML.ad;
    var createjs = ad.createjs;
    var stage = ad.stage;

    @@SCRIPT;
  };
})(ML.window);
