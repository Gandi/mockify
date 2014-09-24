'use strict';

module.exports = function (rootDir) {
  var _               = require('lodash'),
      spawn           = require('child_process').spawn,
      path            = require('path'),
      Target          = require('./../entity/target'),
      targetStorage   = require('./../storage/target'),
      proxyChilds     = {},
      mockChilds      = {},
      // variables initialized in the 'socket' method
      currentSocket,
      alert;

  /**
   * Save the socket of the current web socket connexion and requires modules
   * which need a socket.
   */
  var socket = function (socket_) {
    currentSocket = socket_;
    alert = require('./alert')(socket_);
  };

  /**
   * Emit a ws with the list of targets.
   */
  var list = function (message) {
    targetStorage.list(function (err, targets) {
      if (err) {
        alert.error(err);
        return;
      }

      // set the state of the target according to the current process childs
      _.forEach(targets, function (target) {
        var id = target.id();

        if (proxyChilds[id]) {
          target.proxying(true);
        }

        if (mockChilds[id]) {
          target.mocking(true);
        }
      });

      currentSocket.emit('listTargets', {
        message: (message || 'List of saved targets:'),
        targets: targets
      });
    });
  };

  /**
   * Add a target and emit a ws with the list of targets.
   */
  var add = function (targetProperties) {
    var target = new Target(targetProperties);

    if (target.isValid()) {
      targetStorage.create(target, function (err) {
        err && alert.error(err) || list('The target has been added.');
      });
    } else {
      alert.error('The format of the target is invalid.');
    }
  };

  /**
   * Remove a target and emit a ws with the list of targets.
   */
  var remove = function (targetProperties) {
    targetStorage.remove(new Target(targetProperties), function (err, target) {
      var message;

      if (!err && target === undefined) {
        message = 'The target has not been found, no target has been removed.';
      }

      err && alert.error(err) ||
        list(message || 'The target has been removed.');
    });
  };

  /**
   * Enable the target.
   */
  var enable = function (targetProperties) {
    var proxyBinPath = path.join(rootDir, 'bin', 'proxy.js');

    targetStorage.get(targetProperties.id, function (err, target) {
      if (err) {
        alert.error('This target has not been found.');
        return;
      }

      proxyChilds[target.id()] = spawn('node', [
        path.join(proxyBinPath),
        '--targetId=' + target.id()
      ]);

      proxyChilds[target.id()].stdout.on('data', function (data) {
        currentSocket.emit('enableTarget', data.toString('utf8'));

        // _log(data, typeChild, 'info');
      });

      proxyChilds[target.id()].stderr.on('data', function (data) {
        alert.error(data.toString('utf8'));
      });

      // _bindEvent('proxy', proxyChilds);
    });
  };

  /**
   * ...
   */
  // var _bindEvent = function (typeChild, childs) {
  //   var child = childs[targetEnt.id()];

  //   console.log(typeChild + ' PID', child.pid);

  //   child.on('exit', function () {
  //     delete childs[targetEnt.id()];
  //     _log(typeChild + ' has been stopped.', typeChild, 'info');
  //   });

  //   child.stdout.on('data', function (data) {
  //     _log(data, typeChild, 'info');
  //   });

  //   child.stderr.on('data', function (data) {
  //     _log(data, typeChild, 'error');
  //   });

  //   child.on('error', function () {
  //     _log(arguments, typeChild, 'error');
  //   });
  // };

  /**
   * ...
   */
  // var _log = function (message, typeChild, type) {
  //   if (message instanceof Buffer) {
  //     message = message.toString('utf8');
  //   }

  //   currentSocket.emit('enableTarget', {
  //     message: message,
  //     typeChild: typeChild,
  //     type: type
  //   });
  // };

  return {
    socket: socket,
    list: list,
    add: add,
    remove: remove,
    enable: enable
  };
};
