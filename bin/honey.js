#!/usr/bin/env node

// Modified version of d8.js preamble to work better with node.js.
// Replaces homemade event system with node's, etc.
// Fixes a lot of bugs that took days to track down.

// Copyright (c) 2015, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

(function() {
  // Using strict mode to avoid accidentally defining global variables.
  "use strict"; // Should be first statement of this function.

  // Location (Uri.base)
  var workingDirectory = process.cwd();

  global.location = { href: "file://" + workingDirectory + "/" };

  // Mocking time.
  var timeOffset = 0;
  var now = function() {
    // Install the mock Date object only once.
    // Following calls to "now" will just use the new (mocked) Date.now
    // method directly.
    installMockDate();
    now = Date.now;
    return Date.now();
  };
  var originalDate = Date;
  var originalNow = originalDate.now;
  function advanceTimeTo(time) {
    timeOffset = time - originalNow();
  }
  function installMockDate() {
    var NewDate = function Date(Y, M, D, h, m, s, ms) {
      if (this instanceof Date) {
        // Assume a construct call.
        switch (arguments.length) {
          case 0:  return new originalDate(originalNow() + timeOffset);
          case 1:  return new originalDate(Y);
          case 2:  return new originalDate(Y, M);
          case 3:  return new originalDate(Y, M, D);
          case 4:  return new originalDate(Y, M, D, h);
          case 5:  return new originalDate(Y, M, D, h, m);
          case 6:  return new originalDate(Y, M, D, h, m, s);
          default: return new originalDate(Y, M, D, h, m, s, ms);
        }
      }
      return new originalDate(originalNow() + timeOffset).toString();
    };
    NewDate.UTC = originalDate.UTC;
    NewDate.parse = originalDate.parse;
    NewDate.now = function now() { return originalNow() + timeOffset; };
    NewDate.prototype = originalDate.prototype;
    originalDate.prototype.constructor = NewDate;
    Date = NewDate;
  }

  global.dartMainRunner = function(main, args) {
    main(args);
  };

  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
  global.setInterval = setInterval;
  global.clearInterval = clearInterval;
  global.scheduleImmediate = setImmediate;
  global.require = require;
  global.global = global;
  global.self = global;

  // Support for deferred loading.
  global.dartDeferredLibraryLoader = function(uri, successCallback, errorCallback) {
    try {
      load(uri);
      successCallback();
    } catch (error) {
      errorCallback(error);
    }
  };
})();

if(process.argv.length !== 3) {
  console.log("Usage: honey <file>");
  console.log("*file* is the output from dart2js. Enjoy!");
  return;
}

var vm = require('vm');
var fs = require('fs');
var path = require('path');

vm.runInThisContext(fs.readFileSync(path.normalize(process.argv[2])).toString());
