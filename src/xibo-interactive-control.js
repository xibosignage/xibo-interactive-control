/**
 * Copyright (C) 2020 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - http://www.xibo.org.uk
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
window.xiboIC = (function() {
  'use strict';

  // Private vars
  const _lib = {
    protocol: '', // default protocol
    hostName: '', // default URL
    port: '', // default PORT
    headers: [], // Default headers
    timelimit: 5000, // timelimit in milliseconds
    callbackQueue: [],
    isVisible: true, // Widget visibility on the player
    isPreview: false, // If the library is being used by a preview
    targetId:
      (typeof xiboICTargetId != 'undefined') ?
        xiboICTargetId :
        undefined, // target id

    /**
     * Get URL string
     * @return {string} URL string
     */
    getOriginURL: function() {
      if (this.protocol != '' && this.hostName != '') {
        return this.protocol + '://' + this.hostName + ((this.port != '') ? ':' + this.port : '');
      }
      return '';
    },

    /**
       * Make a request to the configured server/player
       * @param  {string} path - Request path
       * @param  {Object} [options] - Optional params
       * @param  {string} [options.type]
       * @param  {Object[]} [options.headers]
       *  Request headers in the format {key: key, value: value}
       * @param  {Object} [options.data]
       * @param  {callback} [options.done]
       * @param  {callback} [options.error]
       */
    makeRequest: function(path, {type, headers, data, done, error} = {}) {
      const self = this;

      // Preview
      if (self.isPreview) {
        // Call the preview action if it exists
        if (typeof parent.previewActionTrigger == 'function') {
          parent.previewActionTrigger(path, data, done);
        } else {
          // Stop the method to avoid a request
          // but send a fake response
          if (typeof(done) == 'function') {
            done({
              status: 200,
              responseText: 'OK',
            });
          }
        }

        // Stop the method to avoid a request
        return;
      }

      const urlToUse = self.getOriginURL() + path;
      const typeToUse = (type) ? type : 'GET';
      const reqHeaders = (headers) ? headers : self.headers;

      // Init AJAX
      const xhr = new XMLHttpRequest();
      xhr.timeout = self.timelimit;

      xhr.open(typeToUse, urlToUse, true);

      // Set headers
      if (type == 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      }

      reqHeaders.forEach((header) => {
        xhr.setRequestHeader(header.key, header.value);
      });

      // Append data
      let newData = null;
      if (typeof(data) == 'object') {
        newData = JSON.stringify(data);
      }

      // On load complete
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status <= 299) {
          if (typeof(done) == 'function') {
            done(this);
          }
        } else {
          if (typeof(error) == 'function') {
            error(this);
          }
        }
      };

      // Send!
      xhr.send(newData);
    },
  };

  // Interproccess communication
  const _IPC = {
    _callback: undefined, // Callback function of the widget
    messageHandler: function (evt){
      if (evt.data && evt.data.ctrl){
        if (evt.data.ctrl === 'rtNotifyData'){
          xiboIC.notifyData(evt.data.data.datasetId, evt.data.data.widgetId);
        }
      }else{
        console.log(evt);
      }
    },
    registerIPC: function(){
      window.addEventListener('message', this.messageHandler);
    },
  }

  // Public library
  const mainLib = {
    /**
     * Set target id
     * @param  {string} targetId - The target Id
     */
    setTargetId: function(targetId) {
      _lib.targetId = targetId;
    },

    /**
     * Check if the current widget is visible
     * @return {boolean} Widget visibility
     */
    checkVisible: function() { // Check if the widget is hidden or visible
      $.urlParam = function(name) {
        const results =
          new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) {
          return null;
        } else {
          return decodeURI(results[1]) || 0;
        }
      };

      _lib.isVisible =
        ($.urlParam('visible')) ? ($.urlParam('visible') == 1) : true;
      return _lib.isVisible;
    },

    /**
     * Check if we're running in a preview
     * @return {boolean} Preview status
     */
    checkIsPreview: function() {
      // If we don't have URLSearchParams defined, we're also in preview
      if (typeof(URLSearchParams) === 'undefined') {
        _lib.isPreview = true;
        return true;
      }

      // Check if we have the preview flag in URL
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('preview') && searchParams.get('preview') == 1) {
        _lib.isPreview = true;
        return true;
      }

      // For the widget preview in viewer
      if (searchParams.has('isEditor') &&
        searchParams.get('isEditor') === '1'
      ) {
        _lib.isPreview = true;
        return true;
      }

      return false;
    },

    /**
       * Configure the library options
       * @param  {Object} [options]
       * @param  {string} [options.hostName]
       * @param  {string} [options.port]
       * @param  {Object[]} [options.headers]
       *  Request headers in the format {key: key, value: value}
       * @param  {string} [options.headers.key]
       * @param  {string} [options.headers.value]
       * @param  {string} [options.protocol]
       */
    config: function({hostName, port, headers, protocol} = {}) {
      // Initialise custom request params
      _lib.hostName = hostName ? hostName : _lib.hostName;
      _lib.port = port ? port : _lib.port;
      _lib.headers = headers ? headers : _lib.headers;
      _lib.protocol = protocol ? protocol : _lib.protocol;
    },

    /**
       * Get player info
       * @param  {Object[]} [options] - Request options
       * @param  {callback} [options.done]
       * @param  {callback} [options.error]
       */
    info: function({done, error} = {}) {
      _lib.makeRequest(
        '/info',
        {
          done: done,
          error: error,
        },
      );
    },

    /**
       * Trigger a predefined action
       * @param  {string} code - The trigger code
       * @param  {string} [options.targetId] - target id
       * @param  {Object[]} [options] - Request options
       * @param  {callback} [options.done]
       * @param  {callback} [options.error]
       */
    trigger(code, {targetId, done, error} = {}) {
      // Get target id from the request option or from the global lib var
      const id = (typeof targetId != 'undefined') ? targetId : _lib.targetId;

      _lib.makeRequest(
        '/trigger',
        {
          type: 'POST',
          data: {
            id: id,
            trigger: code,
          },
          done: done,
          error: error,
        },
      );
    },

    /**
       * Expire widget
       * @param  {Object[]} [options] - Request options
       * @param  {string} [options.targetId] - target id
       * @param  {callback} [options.done]
       * @param  {callback} [options.error]
       */
    expireNow({targetId, done, error} = {}) {
      // Get target id from the request option or from the global lib var
      const id = (typeof targetId != 'undefined') ? targetId : _lib.targetId;

      _lib.makeRequest(
        '/duration/expire',
        {
          type: 'POST',
          data: {
            id: id,
          },
          done: done,
          error: error,
        },
      );
    },

    /**
       * Extend widget duration
       * @param  {string} duration - Duration value to extend
       * @param  {Object[]} [options] - Request options
       * @param  {string} [options.targetId] - target id
       * @param  {callback} [options.done]
       * @param  {callback} [options.error]
       */
    extendWidgetDuration(duration, {targetId, done, error} = {}) {
      // Get target id from the request option or from the global lib var
      const id = (typeof targetId != 'undefined') ? targetId : _lib.targetId;

      _lib.makeRequest(
        '/duration/extend',
        {
          type: 'POST',
          data: {
            id: id,
            duration: duration,
          },
          done: done,
          error: error,
        },
      );
    },

    /**
       * Set widget duration
       * @param  {string} duration - New widget duration
       * @param  {Object[]} [options] - Request options
       * @param  {string} [options.targetId] - target id
       * @param  {callback} [options.done]
       * @param  {callback} [options.error]
       */
    setWidgetDuration(duration, {targetId, done, error} = {}) {
      // Get target id from the request option or from the global lib var
      const id = (typeof targetId != 'undefined') ? targetId : _lib.targetId;

      _lib.makeRequest(
        '/duration/set',
        {
          type: 'POST',
          data: {
            id: id,
            duration: duration,
          },
          done: done,
          error: error,
        },
      );
    },

    /**
       * Add callback function to the queue
       * @param  {callback} callback - Function to store
       * @param  {Object[]} [args] - Function arguments
       */
    addToQueue(callback, ...args) {
      if (typeof callback != 'function') {
        console.error('Invalid callback function');
      }

      _lib.callbackQueue.push({
        callback: callback,
        arguments: args,
      });
    },

    /**
       * Run promised functions in queue
       */
    runQueue() {
      _lib.callbackQueue.forEach((element) => {
        element.callback.apply(_lib, element.arguments);
      });

      // Empty queue
      _lib.callbackQueue = [];
    },

    /**
       * Set visible and run queue
       */
    setVisible() {
      _lib.isVisible = true;
      this.runQueue();
    },

    /**
     * Lock text selection
     * @param  {Object} lock - Lock (true) or unlock (false)
     */
    lockTextSelection(lock = true) {
      if (lock) {
        $('<style class="lock-text-selection-style">').append('* {' +
                  '-webkit-touch-callout: none;' +
                  '-webkit-user-select: none;' +
                  '-khtml-user-select: none;' +
                  '-moz-user-select: none;' +
                  '-ms-user-select: none;' +
                  'user-select: none;' +
              '}').appendTo('head');
      } else {
        $('style.lock-text-selection-style').remove();
      }
    },

    /**
     * Lock context menu
     * @param {boolean} lock - Lock (true) or unlock (false)
     */
    lockContextMenu(lock = true) {
      if (lock) {
        $('body').attr('oncontextmenu', 'return false;');
      } else {
        $('body').removeAttr('oncontextmenu');
      }
    },

    /**
     * Lock pinch zoom
     * @param {boolean} lock - Lock (true) or unlock (false)
     */
    lockPinchZoom(lock = true) {
      const $viewPortEl = $('head > [name="viewport"]');
      if (lock) {
        // Get original value
        const originalValue = $viewPortEl.attr('content');

        // Backup value as data
        $viewPortEl.data('viewportValueBackup', originalValue);
        $viewPortEl.attr('content',
          originalValue + ' maximum-scale=1.0, user-scalable=no');
      } else {
        // Restore value
        if ($viewPortEl.data('viewportValueBackup') != undefined) {
          $viewPortEl.attr('content', $viewPortEl.data('viewportValueBackup'));
        }
      }
    },

    /**
     * Lock all properties
     * @param {boolean} lock - Lock (true) or unlock (false)
     */
    lockAllInteractions(lock = true) {
      this.lockTextSelection(lock);
      this.lockContextMenu(lock);
      this.lockPinchZoom(lock);
    },

    /**
     * Report fault on requested data
     * @param {Object[]} [params] - Parameters
     * @param {string} [params.code] - Fault code
     * @param {string} [params.reason] - Fault reason
     * @param {string} [params.key] - Optional key
     * @param {Object[]} [options] - Request options
     * @param {string} [options.targetId] - Target id
     * @param {callback} [options.done]
     * @param {callback} [options.error]
     */
    reportFault(
      {code, reason, key} = {},
      {targetId, done, error} = {},
    ) {
      // Get target id from the request option or from the global lib var
      const id = (typeof targetId != 'undefined') ? targetId : _lib.targetId;
      const reportKey = (typeof key != 'undefined') ? key : 'xiboIC_' + id;

      _lib.makeRequest(
        '/fault',
        {
          type: 'POST',
          data: {
            code: code,
            key: reportKey,
            reason: reason,
            ttl: 60,
          },
          done: done,
          error: error,
        },
      );
    },

    /**
     * Set global lib var/method
     * @param {string} widgetId - Widget id
     * @param {string} name - Name of the var/method
     * @param {any} value - Value of the var/method
     */
    set(widgetId, name, value) {
      if (typeof _lib[widgetId] == 'undefined') {
        _lib[widgetId] = {};
      }

      _lib[widgetId][name] = value;
    },

    /**
     * Get global lib var/method
     * @param {string} widgetId - Widget id
     * @param {string} name - Name of the var/method
     * @return {any} Value of the var/method
     */
    get(widgetId, name) {
      if (_lib[widgetId] && typeof _lib[widgetId][name] != 'undefined') {
        return _lib[widgetId][name];
      } else {
        return undefined;
      }
    },

    /**
     * Call global lib method
     * @param {string} widgetId - Widget id
     * @param {string} name - Name of the method
     * @param {any[]} args - Arguments of the method
     * @return {any} Value of the method
     */
    call(widgetId, name, ...args) {
      if (_lib[widgetId] && typeof _lib[widgetId][name] == 'function') {
        return _lib[widgetId][name].apply(null, args);
      }
    },

    // Realtime data
    /**
     * Get realtime data from the player. Called from the widget.
     * @param {string} dataKey The id of the dataset
     * @param {Object} [options] - Request options
     * @param {callback} [options.done]
     * @param {callback} [options.error]
     */
    getData(dataKey, {done, error} = {}){
      _lib.makeRequest(
        '/realtime?dataKey='+dataKey,
        {
          type: 'GET',
          done: done,
          error: error,
        },
      );
    },

    /**
     * Set the realtime into the player. Called from Data Connector.
     * @param {string} dataKey The id of the dataset
     * @param {String} data The data for the dataset as string
     * @param {Object} options - Request options
     * @param {callback} options.done Optional
     * @param {callback} options.error Optional
     */
    setData(dataKey, data, {done, error} = {}){
      _lib.makeRequest(
        '/realtime?dataKey='+dataKey,
        {
          type: 'POST',
          data: data,
          done: done,
          error: error,
        },
      );
    },

    /**
     * Notify main application that we have new data. Called from data collector.
     * @param {string} dataSetId - The id of the dataset
     * @param {string} widgetId - Optional. Widget id to notify. If omitted, all widgets will be notified.
     */
    notifyHost(dataSetId, widgetId) {
      window.notifyHost(dataSetId, widgetId);
    },

    /**
     * Notify the widget that we have new data.
     * @param {string} dataSetId The dataset Id.
     * @param {string} widgetId  The widget Id.
     */
    notifyData(dataSetId, widgetId){
      if (_IPC.callback){
        _IPC.callback(dataSetId, widgetId);
      }
    },

    /**
     * Register callback function. Called by widget
     * @param {callback} callback
     */
    registerNotifyDataListener(callback) {
      _IPC.callback = callback;
    },
  };

  // Register the IPC handler
  _IPC.registerIPC();

  // Check visibility on load
  mainLib.checkVisible();

  // Check if it's a preview
  mainLib.checkIsPreview();

  return mainLib;
})();
