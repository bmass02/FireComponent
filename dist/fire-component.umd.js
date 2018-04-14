(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.blah = {})));
}(this, (function (exports) { 'use strict';

  var FireImage = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{ref:"root",staticClass:"firecomponent--fire-image--container"},[_vm._t("display",[_c('div',{staticClass:"firecomponent--fire-image--display"},[_c('div',{staticClass:"firecomponent--fire-image--ratio-enforcer",style:({ paddingTop: _vm.padding*100+'%'})}),_vm._v(" "),_c('div',{staticClass:"firecomponent--fire-image--content",style:({ backgroundImage: 'url('+_vm.imageLocation+')'})})])],{src:_vm.imageLocation}),_vm._v(" "),(_vm.editable)?_c('div',{staticClass:"firecomponent--fire-image--edit-controller"},[_vm._t("edit-controller",[_c('label',{staticClass:"firecomponent--button firecomponent--fire-image-change-label",attrs:{"for":_vm.uniqueName,"title":"Click to upload new image"}},[_vm._v(" Change ")])],{for:_vm.uniqueName}),_vm._v(" "),_c('input',{attrs:{"type":"file","id":_vm.uniqueName},on:{"change":_vm.imageUploaded}})],2):_vm._e()],2)},staticRenderFns: [],_scopeId: 'data-v-138f7b76',
    name: 'fire-image',
    props: {
      storageRef: {
        type: [Object,String],
        default: () => null
      },
      editable: {
        type: [Boolean],
        default: () => false
      },
      aspectRatio: {
        type: [Number],
        default: () => 1.0
      },
      widths: {
        type: [Array],
        default: () => [320,500]
      },
      quality: {
        type: [Number],
        default: () => 1.0
      },
      circle: {
        type: [Boolean],
        default: () => false
      },
      enforceBoundary: {
        type: [Boolean],
        default: () => true
      },
      allowRotations: {
        type: [Boolean],
        default: () => true
      }
    },

    data () {
      return {
        uploadedImage: null,
        croppieInstance: null,
        croppedImage: null,
        newUpload: false,
        uploading: false,
        uploadTasks: [],
        imageLocation: null,
        index: null
      }
    },

    mounted () {
      if(this._storageRef) {
        this.loadFromStorage(this._storageRef);
      }
    },

    computed: {
      /**
       * A unique id for this fire-image component
       */
      uniqueName () {
        return Math.random().toString(36).substring(4)
      },
      width () {
        return this.$el && this.$el.clientWidth ? this.$el.clientWidth : null
      },
      height () {
        return this.width / this.aspectRatio
      },
      padding () {
        return 1/this.aspectRatio
      },
      format () {
        if (this.quality < 1) {
          return 'jpeg'
        }
        return 'png'
      },
      _storageRef () {
        if(this.storageRef) {
          try {
            return typeof this.storageRef === 'string' ? this.$firebase.storage().ref(this.storageRef) : this.$firebase.storage().refFromURL(this.storageRef.toString())
          } catch (e) {
            console.error(e);
            return null
          }
        }
      },
    },

    watch: {
      _storageRef (val) {
        if(val) {
          this.loadFromStorage(val);
        }
      }
    },

    methods: {
      loadFromStorage (ref) {
        ref = ref.child(''+this.getIndexToDisplay());
        ref.getDownloadURL().then((url) => {
          if(ref.parent.toString() !== this._storageRef.toString()){return;}
          this.imageLocation = url;
        },() => {
          console.error('No Image at specified location.');
        });
      },
      getIndexToDisplay () {
        const displaySize = this.$refs.root.clientWidth;
        var min = {
          index: 0,
          offset: null
        };
        this.widths.forEach((width, i) => {
          const offset = Math.abs(width - displaySize);
          if(min.offset === null || offset < min.offset) {
            min = {
              index: i,
              offset: offset
            };
          }
        });
        this.index=min.index;
        return min.index
      },
      imageUploaded (e) {
        const location = this._storageRef.toString();
        const config = {
          widths: this.widths,
          aspectRatio: this.aspectRatio,
          enforceBoundary: this.enforceBoundary,
          allowRotations: this.allowRotations,
          circle: this.circle,
          format: this.format
        };
        this.$imageBus.bus.$on(location + '-cancelled', this.newCancelledCallback(location));
        this.$imageBus.bus.$on(location + '-completed', this.newCompletedCallback(location));
        this.$imageBus.newUpload(location, e, config);
      },
      newCancelledCallback (location) {
        const callback = () => {
          this.$imageBus.bus.$off(location + '-cancelled', callback);
        };
        return callback
      },
      newCompletedCallback (location) {
        const callback = (e, urls) => {
          this.$imageBus.bus.$off(location + '-completed', callback);
          const index = this.getIndexToDisplay();
          this.imageLocation = urls[index];
        };
        return callback
      }
    }
  }

  var FireInput = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(_vm.customTag,{tag:"component"},[(_vm.editable)?_c('span',{key:_vm.editorKey,ref:"editor",staticClass:"editor",style:(_vm.editorStyle),attrs:{"contenteditable":"true"},on:{"input":_vm.contentChangeEventHandler}},[_vm._v(" "+_vm._s(_vm.content)+" ")]):_vm._t("display",[_vm._v(" "+_vm._s(_vm.content)+" ")],{content:_vm.content})],2)},staticRenderFns: [],_scopeId: 'data-v-df63bd98',
    name: 'fire-input',
    props: {
      'path': {
        required: true,
        type: [String]
      },
      'editable': {
        required: true,
        type: [Boolean]
      },
      'useTransaction': {
        type: [Boolean],
        default: false
      },
      'customTag': {
        type: [String],
        default: 'span'
      },
      'editorStyle': {
        type: [Object],
        default: () => Object.create(null)
      }
    },
    data () {
      return {
        content: null,
        snapshotVal: null,
        editableContentSnapshot: null,
        unsub: null,
        hasChanges: false,
        saving: false,
        error: null,
        startTime: null,
        isLoaded: false,
        firebaseRef: this.$firebase.database().ref(this.path),
        editorKey: 'editor-' + Math.random().toString(36).substring(4)
      }
    },
    watch: {
      'editable' (val) {
        if (!val) {
          this.updateContent();
        }
      },
      'snapshotVal' (val) {
        if (!this.editable || !this.isLoaded) {
          this.isLoaded = true;
          this.updateContent();
        }
      }
    },
    methods: {
      updateContent () {
        this.hasChanges = false;
        this.content = this.snapshotVal;
        this.editableContentSnapshot = this.snapshotVal;
      },
      finished () {
        this.$nextTick(() => {
          if (!this.error) {
            this.reset();
          }
          this.saving = false;
        });
      },
      save () {
        this.saving = true;

        if (this.useTransaction && typeof this.snapshotVal === 'number') {
          this.firebaseRef.transaction((value) => {
            const diff = this.snapshotVal.constructor(this.editableContentSnapshot) - this.content;
            return value + diff
          }, (err, committed, snapshot) => {
            if (err) {
              this.error = err;
            } else if (!committed) {
              this.error = 'Did not save.';
            }

            this.finished();
          }, false);
        } else {
          this.firebaseRef.set(this.snapshotVal.constructor(this.editableContentSnapshot)).catch(
            (err) => {
              this.error = err;
            }
          ).then(this.finished);
        }
      },
      reset () {
        this.updateContent();

        this.$nextTick(() => {
          if (this.$refs.editor.innerText !== this.editableContentSnapshot) {
            this.$refs.editor.innerText = this.editableContentSnapshot;
          }
        });
      },
      contentChangeEventHandler (e) {
        this.editableContentSnapshot = e.target.innerText;
      }
    },
    mounted: function () {
      this.isLoaded = false;

      this.unsub = this.firebaseRef.on('value', (snapshot) => {
        this.hasChanges = true;
        this.snapshotVal = snapshot.exists() ? snapshot.val() : null;
      });

      this.$messenger.bus.$on('save', this.save);
      this.$messenger.bus.$on('reset', this.reset);
    },
    beforeDestroy () {
      if (this.unsub) {
        this.firebaseRef.off('value', this.unsub);
      }
    }
  }

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var croppie = createCommonjsModule(function (module, exports) {
  /*************************
   * Croppie
   * Copyright 2017
   * Foliotek
   * Version: 2.5.0
   *************************/
  (function (root, factory) {
      if (typeof undefined === 'function' && undefined.amd) {
          // AMD. Register as an anonymous module.
          undefined(['exports'], factory);
      } else if ('object' === 'object' && typeof exports.nodeName !== 'string') {
          // CommonJS
          factory(exports);
      } else {
          // Browser globals
          factory((root.commonJsStrict = {}));
      }
  }(commonjsGlobal, function (exports) {

      /* Polyfills */
      if (typeof Promise !== 'function') {
          /*! promise-polyfill 3.1.0 */
          !function(a){function b(a,b){return function(){a.apply(b,arguments);}}function c(a){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof a)throw new TypeError("not a function");this._state=null, this._value=null, this._deferreds=[], i(a,b(e,this),b(f,this));}function d(a){var b=this;return null===this._state?void this._deferreds.push(a):void k(function(){var c=b._state?a.onFulfilled:a.onRejected;if(null===c)return void(b._state?a.resolve:a.reject)(b._value);var d;try{d=c(b._value);}catch(e){return void a.reject(e)}a.resolve(d);})}function e(a){try{if(a===this)throw new TypeError("A promise cannot be resolved with itself.");if(a&&("object"==typeof a||"function"==typeof a)){var c=a.then;if("function"==typeof c)return void i(b(c,a),b(e,this),b(f,this))}this._state=!0, this._value=a, g.call(this);}catch(d){f.call(this,d);}}function f(a){this._state=!1, this._value=a, g.call(this);}function g(){for(var a=0,b=this._deferreds.length;b>a;a++)d.call(this,this._deferreds[a]);this._deferreds=null;}function h(a,b,c,d){this.onFulfilled="function"==typeof a?a:null, this.onRejected="function"==typeof b?b:null, this.resolve=c, this.reject=d;}function i(a,b,c){var d=!1;try{a(function(a){d||(d=!0, b(a));},function(a){d||(d=!0, c(a));});}catch(e){if(d)return;d=!0, c(e);}}var j=setTimeout,k="function"==typeof setImmediate&&setImmediate||function(a){j(a,1);},l=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)};c.prototype["catch"]=function(a){return this.then(null,a)}, c.prototype.then=function(a,b){var e=this;return new c(function(c,f){d.call(e,new h(a,b,c,f));})}, c.all=function(){var a=Array.prototype.slice.call(1===arguments.length&&l(arguments[0])?arguments[0]:arguments);return new c(function(b,c){function d(f,g){try{if(g&&("object"==typeof g||"function"==typeof g)){var h=g.then;if("function"==typeof h)return void h.call(g,function(a){d(f,a);},c)}a[f]=g, 0===--e&&b(a);}catch(i){c(i);}}if(0===a.length)return b([]);for(var e=a.length,f=0;f<a.length;f++)d(f,a[f]);})}, c.resolve=function(a){return a&&"object"==typeof a&&a.constructor===c?a:new c(function(b){b(a);})}, c.reject=function(a){return new c(function(b,c){c(a);})}, c.race=function(a){return new c(function(b,c){for(var d=0,e=a.length;e>d;d++)a[d].then(b,c);})}, c._setImmediateFn=function(a){k=a;}, "undefined"!='object'&&module.exports?module.exports=c:a.Promise||(a.Promise=c);}(this);
      }

      if ( typeof window.CustomEvent !== "function" ) {
          (function(){
              function CustomEvent ( event, params ) {
                  params = params || { bubbles: false, cancelable: false, detail: undefined };
                  var evt = document.createEvent( 'CustomEvent' );
                  evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
                  return evt;
              }
              CustomEvent.prototype = window.Event.prototype;
              window.CustomEvent = CustomEvent;
          }());
      }

      if (!HTMLCanvasElement.prototype.toBlob) {
          Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
              value: function (callback, type, quality) {
                  var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
                  len = binStr.length,
                  arr = new Uint8Array(len);

                  for (var i=0; i<len; i++ ) {
                      arr[i] = binStr.charCodeAt(i);
                  }

                  callback( new Blob( [arr], {type: type || 'image/png'} ) );
              }
          });
      }
      /* End Polyfills */

      var cssPrefixes = ['Webkit', 'Moz', 'ms'],
          emptyStyles = document.createElement('div').style,
          CSS_TRANS_ORG,
          CSS_TRANSFORM,
          CSS_USERSELECT;

      function vendorPrefix(prop) {
          if (prop in emptyStyles) {
              return prop;
          }

          var capProp = prop[0].toUpperCase() + prop.slice(1),
              i = cssPrefixes.length;

          while (i--) {
              prop = cssPrefixes[i] + capProp;
              if (prop in emptyStyles) {
                  return prop;
              }
          }
      }

      CSS_TRANSFORM = vendorPrefix('transform');
      CSS_TRANS_ORG = vendorPrefix('transformOrigin');
      CSS_USERSELECT = vendorPrefix('userSelect');

      // Credits to : Andrew Dupont - http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
      function deepExtend(destination, source) {
          destination = destination || {};
          for (var property in source) {
              if (source[property] && source[property].constructor && source[property].constructor === Object) {
                  destination[property] = destination[property] || {};
                  deepExtend(destination[property], source[property]);
              } else {
                  destination[property] = source[property];
              }
          }
          return destination;
      }

      function debounce(func, wait, immediate) {
          var timeout;
          return function () {
              var context = this, args = arguments;
              var later = function () {
                  timeout = null;
                  if (!immediate) func.apply(context, args);
              };
              var callNow = immediate && !timeout;
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
              if (callNow) func.apply(context, args);
          };
      }

      function dispatchChange(element) {
          if ("createEvent" in document) {
              var evt = document.createEvent("HTMLEvents");
              evt.initEvent("change", false, true);
              element.dispatchEvent(evt);
          }
          else {
              element.fireEvent("onchange");
          }
      }

      //http://jsperf.com/vanilla-css
      function css(el, styles, val) {
          if (typeof (styles) === 'string') {
              var tmp = styles;
              styles = {};
              styles[tmp] = val;
          }

          for (var prop in styles) {
              el.style[prop] = styles[prop];
          }
      }

      function addClass(el, c) {
          if (el.classList) {
              el.classList.add(c);
          }
          else {
              el.className += ' ' + c;
          }
      }

      function removeClass(el, c) {
          if (el.classList) {
              el.classList.remove(c);
          }
          else {
              el.className = el.className.replace(c, '');
          }
      }

      function num(v) {
          return parseInt(v, 10);
      }

      /* Utilities */
      function loadImage(src, imageEl, doExif) {
          var img = imageEl || new Image();
          img.style.opacity = 0;

          return new Promise(function (resolve) {
              function _resolve() {
                  setTimeout(function(){
                      resolve(img);
                  }, 1);
              }

              if (img.src === src) {// If image source hasn't changed resolve immediately
                  _resolve();
                  return;
              } 

              img.exifdata = null;
              img.removeAttribute('crossOrigin');
              if (src.match(/^https?:\/\/|^\/\//)) {
                  img.setAttribute('crossOrigin', 'anonymous');
              }
              img.onload = function () {
                  if (doExif) {
                      EXIF.getData(img, function () {
                          _resolve();
                      });    
                  }
                  else {
                      _resolve();
                  }
              };
              img.src = src;
          });
      }

      function naturalImageDimensions(img) {
          var w = img.naturalWidth;
          var h = img.naturalHeight;
          if (img.exifdata && img.exifdata.Orientation >= 5) {
              var x= w;
              w = h;
              h = x;
          }
          return { width: w, height: h };
      }

      /* CSS Transform Prototype */
      var TRANSLATE_OPTS = {
          'translate3d': {
              suffix: ', 0px'
          },
          'translate': {
              suffix: ''
          }
      };
      var Transform = function (x, y, scale) {
          this.x = parseFloat(x);
          this.y = parseFloat(y);
          this.scale = parseFloat(scale);
      };

      Transform.parse = function (v) {
          if (v.style) {
              return Transform.parse(v.style[CSS_TRANSFORM]);
          }
          else if (v.indexOf('matrix') > -1 || v.indexOf('none') > -1) {
              return Transform.fromMatrix(v);
          }
          else {
              return Transform.fromString(v);
          }
      };

      Transform.fromMatrix = function (v) {
          var vals = v.substring(7).split(',');
          if (!vals.length || v === 'none') {
              vals = [1, 0, 0, 1, 0, 0];
          }

          return new Transform(num(vals[4]), num(vals[5]), parseFloat(vals[0]));
      };

      Transform.fromString = function (v) {
          var values = v.split(') '),
              translate = values[0].substring(Croppie.globals.translate.length + 1).split(','),
              scale = values.length > 1 ? values[1].substring(6) : 1,
              x = translate.length > 1 ? translate[0] : 0,
              y = translate.length > 1 ? translate[1] : 0;

          return new Transform(x, y, scale);
      };

      Transform.prototype.toString = function () {
          var suffix = TRANSLATE_OPTS[Croppie.globals.translate].suffix || '';
          return Croppie.globals.translate + '(' + this.x + 'px, ' + this.y + 'px' + suffix + ') scale(' + this.scale + ')';
      };

      var TransformOrigin = function (el) {
          if (!el || !el.style[CSS_TRANS_ORG]) {
              this.x = 0;
              this.y = 0;
              return;
          }
          var css = el.style[CSS_TRANS_ORG].split(' ');
          this.x = parseFloat(css[0]);
          this.y = parseFloat(css[1]);
      };

      TransformOrigin.prototype.toString = function () {
          return this.x + 'px ' + this.y + 'px';
      };

      function getExifOrientation (img) {
          return img.exifdata.Orientation;
      }

      function drawCanvas(canvas, img, orientation) {
          var width = img.width,
              height = img.height,
              ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.save();
          switch (orientation) {
            case 2:
               ctx.translate(width, 0);
               ctx.scale(-1, 1);
               break;

            case 3:
                ctx.translate(width, height);
                ctx.rotate(180*Math.PI/180);
                break;

            case 4:
                ctx.translate(0, height);
                ctx.scale(1, -1);
                break;

            case 5:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(90*Math.PI/180);
                ctx.scale(1, -1);
                break;

            case 6:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(90*Math.PI/180);
                ctx.translate(0, -height);
                break;

            case 7:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(-90*Math.PI/180);
                ctx.translate(-width, height);
                ctx.scale(1, -1);
                break;

            case 8:
                canvas.width = height;
                canvas.height = width;
                ctx.translate(0, width);
                ctx.rotate(-90*Math.PI/180);
                break;
          }
          ctx.drawImage(img, 0,0, width, height);
          ctx.restore();
      }

      /* Private Methods */
      function _create() {
          var self = this,
              contClass = 'croppie-container',
              customViewportClass = self.options.viewport.type ? 'cr-vp-' + self.options.viewport.type : null,
              boundary, img, viewport, overlay, bw, bh;

          self.options.useCanvas = self.options.enableOrientation || _hasExif.call(self);
          // Properties on class
          self.data = {};
          self.elements = {};

          boundary = self.elements.boundary = document.createElement('div');
          viewport = self.elements.viewport = document.createElement('div');
          img = self.elements.img = document.createElement('img');
          overlay = self.elements.overlay = document.createElement('div');

          if (self.options.useCanvas) {
              self.elements.canvas = document.createElement('canvas');
              self.elements.preview = self.elements.canvas;
          }
          else {
              self.elements.preview = self.elements.img;
          }

          addClass(boundary, 'cr-boundary');
          bw = self.options.boundary.width;
          bh = self.options.boundary.height;
          css(boundary, {
              width: (bw + (isNaN(bw) ? '' : 'px')),
              height: (bh + (isNaN(bh) ? '' : 'px'))
          });

          addClass(viewport, 'cr-viewport');
          if (customViewportClass) {
              addClass(viewport, customViewportClass);
          }
          css(viewport, {
              width: self.options.viewport.width + 'px',
              height: self.options.viewport.height + 'px'
          });
          viewport.setAttribute('tabindex', 0);

          addClass(self.elements.preview, 'cr-image');
          addClass(overlay, 'cr-overlay');

          self.element.appendChild(boundary);
          boundary.appendChild(self.elements.preview);
          boundary.appendChild(viewport);
          boundary.appendChild(overlay);

          addClass(self.element, contClass);
          if (self.options.customClass) {
              addClass(self.element, self.options.customClass);
          }

          _initDraggable.call(this);

          if (self.options.enableZoom) {
              _initializeZoom.call(self);
          }

          // if (self.options.enableOrientation) {
          //     _initRotationControls.call(self);
          // }

          if (self.options.enableResize) {
              _initializeResize.call(self);
          }
      }

      // function _initRotationControls () {
      //     var self = this,
      //         wrap, btnLeft, btnRight, iLeft, iRight;

      //     wrap = document.createElement('div');
      //     self.elements.orientationBtnLeft = btnLeft = document.createElement('button');
      //     self.elements.orientationBtnRight = btnRight = document.createElement('button');

      //     wrap.appendChild(btnLeft);
      //     wrap.appendChild(btnRight);

      //     iLeft = document.createElement('i');
      //     iRight = document.createElement('i');
      //     btnLeft.appendChild(iLeft);
      //     btnRight.appendChild(iRight);

      //     addClass(wrap, 'cr-rotate-controls');
      //     addClass(btnLeft, 'cr-rotate-l');
      //     addClass(btnRight, 'cr-rotate-r');

      //     self.elements.boundary.appendChild(wrap);

      //     btnLeft.addEventListener('click', function () {
      //         self.rotate(-90);
      //     });
      //     btnRight.addEventListener('click', function () {
      //         self.rotate(90);
      //     });
      // }

      function _hasExif() {
          return this.options.enableExif && window.EXIF;
      }

      function _initializeResize () {
          var self = this;
          var wrap = document.createElement('div');
          var isDragging = false;
          var direction;
          var originalX;
          var originalY;
          var minSize = 50;
          var maxWidth;
          var maxHeight;
          var vr;
          var hr;

          addClass(wrap, 'cr-resizer');
          css(wrap, {
              width: this.options.viewport.width + 'px',
              height: this.options.viewport.height + 'px'
          });

          if (this.options.resizeControls.height) {
              vr = document.createElement('div');
              addClass(vr, 'cr-resizer-vertical');
              wrap.appendChild(vr);
          }

          if (this.options.resizeControls.width) {
              hr = document.createElement('div');
              addClass(hr, 'cr-resizer-horisontal');
              wrap.appendChild(hr);
          }

          function mouseDown(ev) {
              if (ev.button !== undefined && ev.button !== 0) return;

              ev.preventDefault();
              if (isDragging) {
                  return;
              }

              var overlayRect = self.elements.overlay.getBoundingClientRect();

              isDragging = true;
              originalX = ev.pageX;
              originalY = ev.pageY;
              direction = ev.currentTarget.className.indexOf('vertical') !== -1 ? 'v' : 'h';
              maxWidth = overlayRect.width;
              maxHeight = overlayRect.height;

              if (ev.touches) {
                  var touches = ev.touches[0];
                  originalX = touches.pageX;
                  originalY = touches.pageY;
              }

              window.addEventListener('mousemove', mouseMove);
              window.addEventListener('touchmove', mouseMove);
              window.addEventListener('mouseup', mouseUp);
              window.addEventListener('touchend', mouseUp);
              document.body.style[CSS_USERSELECT] = 'none';
          }

          function mouseMove(ev) {
              var pageX = ev.pageX;
              var pageY = ev.pageY;

              ev.preventDefault();

              if (ev.touches) {
                  var touches = ev.touches[0];
                  pageX = touches.pageX;
                  pageY = touches.pageY;
              }

              var deltaX = pageX - originalX;
              var deltaY = pageY - originalY;
              var newHeight = self.options.viewport.height + deltaY;
              var newWidth = self.options.viewport.width + deltaX;

              if (direction === 'v' && newHeight >= minSize && newHeight <= maxHeight) {
                  css(wrap, {
                      height: newHeight + 'px'
                  });

                  self.options.boundary.height += deltaY;
                  css(self.elements.boundary, {
                      height: self.options.boundary.height + 'px'
                  });

                  self.options.viewport.height += deltaY;
                  css(self.elements.viewport, {
                      height: self.options.viewport.height + 'px'
                  });
              }
              else if (direction === 'h' && newWidth >= minSize && newWidth <= maxWidth) {
                  css(wrap, {
                      width: newWidth + 'px'
                  });

                  self.options.boundary.width += deltaX;
                  css(self.elements.boundary, {
                      width: self.options.boundary.width + 'px'
                  });

                  self.options.viewport.width += deltaX;
                  css(self.elements.viewport, {
                      width: self.options.viewport.width + 'px'
                  }); 
              }

              _updateOverlay.call(self);
              _updateZoomLimits.call(self);
              _updateCenterPoint.call(self);
              _triggerUpdate.call(self);
              originalY = pageY;
              originalX = pageX;
          }

          function mouseUp() {
              isDragging = false;
              window.removeEventListener('mousemove', mouseMove);
              window.removeEventListener('touchmove', mouseMove);
              window.removeEventListener('mouseup', mouseUp);
              window.removeEventListener('touchend', mouseUp);
              document.body.style[CSS_USERSELECT] = '';
          }

          if (vr) {
              vr.addEventListener('mousedown', mouseDown);
          }

          if (hr) {
              hr.addEventListener('mousedown', mouseDown);
          }

          this.elements.boundary.appendChild(wrap);
      }

      function _setZoomerVal(v) {
          if (this.options.enableZoom) {
              var z = this.elements.zoomer,
                  val = fix(v, 4);

              z.value = Math.max(z.min, Math.min(z.max, val));
          }
      }

      function _initializeZoom() {
          var self = this,
              wrap = self.elements.zoomerWrap = document.createElement('div'),
              zoomer = self.elements.zoomer = document.createElement('input');

          addClass(wrap, 'cr-slider-wrap');
          addClass(zoomer, 'cr-slider');
          zoomer.type = 'range';
          zoomer.step = '0.0001';
          zoomer.value = 1;
          zoomer.style.display = self.options.showZoomer ? '' : 'none';

          self.element.appendChild(wrap);
          wrap.appendChild(zoomer);

          self._currentZoom = 1;

          function change() {
              _onZoom.call(self, {
                  value: parseFloat(zoomer.value),
                  origin: new TransformOrigin(self.elements.preview),
                  viewportRect: self.elements.viewport.getBoundingClientRect(),
                  transform: Transform.parse(self.elements.preview)
              });
          }

          function scroll(ev) {
              var delta, targetZoom;

              if (ev.wheelDelta) {
                  delta = ev.wheelDelta / 1200; //wheelDelta min: -120 max: 120 // max x 10 x 2
              } else if (ev.deltaY) {
                  delta = ev.deltaY / 1060; //deltaY min: -53 max: 53 // max x 10 x 2
              } else if (ev.detail) {
                  delta = ev.detail / -60; //delta min: -3 max: 3 // max x 10 x 2
              } else {
                  delta = 0;
              }

              targetZoom = self._currentZoom + (delta * self._currentZoom);

              ev.preventDefault();
              _setZoomerVal.call(self, targetZoom);
              change.call(self);
          }

          self.elements.zoomer.addEventListener('input', change);// this is being fired twice on keypress
          self.elements.zoomer.addEventListener('change', change);

          if (self.options.mouseWheelZoom) {
              self.elements.boundary.addEventListener('mousewheel', scroll);
              self.elements.boundary.addEventListener('DOMMouseScroll', scroll);
          }
      }

      function _onZoom(ui) {
          var self = this,
              transform = ui ? ui.transform : Transform.parse(self.elements.preview),
              vpRect = ui ? ui.viewportRect : self.elements.viewport.getBoundingClientRect(),
              origin = ui ? ui.origin : new TransformOrigin(self.elements.preview);

          function applyCss() {
              var transCss = {};
              transCss[CSS_TRANSFORM] = transform.toString();
              transCss[CSS_TRANS_ORG] = origin.toString();
              css(self.elements.preview, transCss);
          }

          self._currentZoom = ui ? ui.value : self._currentZoom;
          transform.scale = self._currentZoom;
          applyCss();

          if (self.options.enforceBoundary) {
              var boundaries = _getVirtualBoundaries.call(self, vpRect),
                  transBoundaries = boundaries.translate,
                  oBoundaries = boundaries.origin;

              if (transform.x >= transBoundaries.maxX) {
                  origin.x = oBoundaries.minX;
                  transform.x = transBoundaries.maxX;
              }

              if (transform.x <= transBoundaries.minX) {
                  origin.x = oBoundaries.maxX;
                  transform.x = transBoundaries.minX;
              }

              if (transform.y >= transBoundaries.maxY) {
                  origin.y = oBoundaries.minY;
                  transform.y = transBoundaries.maxY;
              }

              if (transform.y <= transBoundaries.minY) {
                  origin.y = oBoundaries.maxY;
                  transform.y = transBoundaries.minY;
              }
          }
          applyCss();
          _debouncedOverlay.call(self);
          _triggerUpdate.call(self);
      }

      function _getVirtualBoundaries(viewport) {
          var self = this,
              scale = self._currentZoom,
              vpWidth = viewport.width,
              vpHeight = viewport.height,
              centerFromBoundaryX = self.elements.boundary.clientWidth / 2,
              centerFromBoundaryY = self.elements.boundary.clientHeight / 2,
              imgRect = self.elements.preview.getBoundingClientRect(),
              curImgWidth = imgRect.width,
              curImgHeight = imgRect.height,
              halfWidth = vpWidth / 2,
              halfHeight = vpHeight / 2;

          var maxX = ((halfWidth / scale) - centerFromBoundaryX) * -1;
          var minX = maxX - ((curImgWidth * (1 / scale)) - (vpWidth * (1 / scale)));

          var maxY = ((halfHeight / scale) - centerFromBoundaryY) * -1;
          var minY = maxY - ((curImgHeight * (1 / scale)) - (vpHeight * (1 / scale)));

          var originMinX = (1 / scale) * halfWidth;
          var originMaxX = (curImgWidth * (1 / scale)) - originMinX;

          var originMinY = (1 / scale) * halfHeight;
          var originMaxY = (curImgHeight * (1 / scale)) - originMinY;

          return {
              translate: {
                  maxX: maxX,
                  minX: minX,
                  maxY: maxY,
                  minY: minY
              },
              origin: {
                  maxX: originMaxX,
                  minX: originMinX,
                  maxY: originMaxY,
                  minY: originMinY
              }
          };
      }

      function _updateCenterPoint() {
          var self = this,
              scale = self._currentZoom,
              data = self.elements.preview.getBoundingClientRect(),
              vpData = self.elements.viewport.getBoundingClientRect(),
              transform = Transform.parse(self.elements.preview.style[CSS_TRANSFORM]),
              pc = new TransformOrigin(self.elements.preview),
              top = (vpData.top - data.top) + (vpData.height / 2),
              left = (vpData.left - data.left) + (vpData.width / 2),
              center = {},
              adj = {};

          center.y = top / scale;
          center.x = left / scale;

          adj.y = (center.y - pc.y) * (1 - scale);
          adj.x = (center.x - pc.x) * (1 - scale);

          transform.x -= adj.x;
          transform.y -= adj.y;

          var newCss = {};
          newCss[CSS_TRANS_ORG] = center.x + 'px ' + center.y + 'px';
          newCss[CSS_TRANSFORM] = transform.toString();
          css(self.elements.preview, newCss);
      }

      function _initDraggable() {
          var self = this,
              isDragging = false,
              originalX,
              originalY,
              originalDistance,
              vpRect,
              transform;

          function assignTransformCoordinates(deltaX, deltaY) {
              var imgRect = self.elements.preview.getBoundingClientRect(),
                  top = transform.y + deltaY,
                  left = transform.x + deltaX;

              if (self.options.enforceBoundary) {
                  if (vpRect.top > imgRect.top + deltaY && vpRect.bottom < imgRect.bottom + deltaY) {
                      transform.y = top;
                  }

                  if (vpRect.left > imgRect.left + deltaX && vpRect.right < imgRect.right + deltaX) {
                      transform.x = left;
                  }
              }
              else {
                  transform.y = top;
                  transform.x = left;
              }
          }

          function keyDown(ev) {
              var LEFT_ARROW  = 37,
                  UP_ARROW    = 38,
                  RIGHT_ARROW = 39,
                  DOWN_ARROW  = 40;

              if (ev.shiftKey && (ev.keyCode == UP_ARROW || ev.keyCode == DOWN_ARROW)) {
                  var zoom = 0.0;
                  if (ev.keyCode == UP_ARROW) {
                      zoom = parseFloat(self.elements.zoomer.value, 10) + parseFloat(self.elements.zoomer.step, 10);
                  }
                  else {
                      zoom = parseFloat(self.elements.zoomer.value, 10) - parseFloat(self.elements.zoomer.step, 10);
                  }
                  self.setZoom(zoom);
              }
              else if (self.options.enableKeyMovement && (ev.keyCode >= 37 && ev.keyCode <= 40)) {
                  ev.preventDefault();
                  var movement = parseKeyDown(ev.keyCode);

                  transform = Transform.parse(self.elements.preview);
                  document.body.style[CSS_USERSELECT] = 'none';
                  vpRect = self.elements.viewport.getBoundingClientRect();
                  keyMove(movement);
              }
              function parseKeyDown(key) {
                  switch (key) {
                      case LEFT_ARROW:
                          return [1, 0];
                      case UP_ARROW:
                          return [0, 1];
                      case RIGHT_ARROW:
                          return [-1, 0];
                      case DOWN_ARROW:
                          return [0, -1];
                  }            }        }

          function keyMove(movement) {
              var deltaX = movement[0],
                  deltaY = movement[1],
                  newCss = {};

              assignTransformCoordinates(deltaX, deltaY);

              newCss[CSS_TRANSFORM] = transform.toString();
              css(self.elements.preview, newCss);
              _updateOverlay.call(self);
              document.body.style[CSS_USERSELECT] = '';
              _updateCenterPoint.call(self);
              _triggerUpdate.call(self);
              originalDistance = 0;
          }

          function mouseDown(ev) {
              if (ev.button !== undefined && ev.button !== 0) return;

              ev.preventDefault();
              if (isDragging) return;
              isDragging = true;
              originalX = ev.pageX;
              originalY = ev.pageY;

              if (ev.touches) {
                  var touches = ev.touches[0];
                  originalX = touches.pageX;
                  originalY = touches.pageY;
              }

              transform = Transform.parse(self.elements.preview);
              window.addEventListener('mousemove', mouseMove);
              window.addEventListener('touchmove', mouseMove);
              window.addEventListener('mouseup', mouseUp);
              window.addEventListener('touchend', mouseUp);
              document.body.style[CSS_USERSELECT] = 'none';
              vpRect = self.elements.viewport.getBoundingClientRect();
          }

          function mouseMove(ev) {
              ev.preventDefault();
              var pageX = ev.pageX,
                  pageY = ev.pageY;

              if (ev.touches) {
                  var touches = ev.touches[0];
                  pageX = touches.pageX;
                  pageY = touches.pageY;
              }

              var deltaX = pageX - originalX,
                  deltaY = pageY - originalY,
                  newCss = {};

              if (ev.type == 'touchmove') {
                  if (ev.touches.length > 1) {
                      var touch1 = ev.touches[0];
                      var touch2 = ev.touches[1];
                      var dist = Math.sqrt((touch1.pageX - touch2.pageX) * (touch1.pageX - touch2.pageX) + (touch1.pageY - touch2.pageY) * (touch1.pageY - touch2.pageY));

                      if (!originalDistance) {
                          originalDistance = dist / self._currentZoom;
                      }

                      var scale = dist / originalDistance;

                      _setZoomerVal.call(self, scale);
                      dispatchChange(self.elements.zoomer);
                      return;
                  }
              }

              assignTransformCoordinates(deltaX, deltaY);

              newCss[CSS_TRANSFORM] = transform.toString();
              css(self.elements.preview, newCss);
              _updateOverlay.call(self);
              originalY = pageY;
              originalX = pageX;
          }

          function mouseUp() {
              isDragging = false;
              window.removeEventListener('mousemove', mouseMove);
              window.removeEventListener('touchmove', mouseMove);
              window.removeEventListener('mouseup', mouseUp);
              window.removeEventListener('touchend', mouseUp);
              document.body.style[CSS_USERSELECT] = '';
              _updateCenterPoint.call(self);
              _triggerUpdate.call(self);
              originalDistance = 0;
          }

          self.elements.overlay.addEventListener('mousedown', mouseDown);
          self.elements.viewport.addEventListener('keydown', keyDown);
          self.elements.overlay.addEventListener('touchstart', mouseDown);
      }

      function _updateOverlay() {
          var self = this,
              boundRect = self.elements.boundary.getBoundingClientRect(),
              imgData = self.elements.preview.getBoundingClientRect();

          css(self.elements.overlay, {
              width: imgData.width + 'px',
              height: imgData.height + 'px',
              top: (imgData.top - boundRect.top) + 'px',
              left: (imgData.left - boundRect.left) + 'px'
          });
      }
      var _debouncedOverlay = debounce(_updateOverlay, 500);

      function _triggerUpdate() {
          var self = this,
              data = self.get(),
              ev;

          if (!_isVisible.call(self)) {
              return;
          }

          self.options.update.call(self, data);
          if (self.$ && typeof Prototype == 'undefined') {
              self.$(self.element).trigger('update', data); 
          }
          else {
              var ev;
              if (window.CustomEvent) {
                  ev = new CustomEvent('update', { detail: data });
              } else {
                  ev = document.createEvent('CustomEvent');
                  ev.initCustomEvent('update', true, true, data);
              }

              self.element.dispatchEvent(ev);
          }
      }

      function _isVisible() {
          return this.elements.preview.offsetHeight > 0 && this.elements.preview.offsetWidth > 0;
      }

      function _updatePropertiesFromImage() {
          var self = this,
              initialZoom = 1,
              cssReset = {},
              img = self.elements.preview,
              imgData = self.elements.preview.getBoundingClientRect(),
              transformReset = new Transform(0, 0, initialZoom),
              originReset = new TransformOrigin(),
              isVisible = _isVisible.call(self);

          if (!isVisible || self.data.bound) {
              // if the croppie isn't visible or it doesn't need binding
              return;
          }

          self.data.bound = true;
          cssReset[CSS_TRANSFORM] = transformReset.toString();
          cssReset[CSS_TRANS_ORG] = originReset.toString();
          cssReset['opacity'] = 1;
          css(img, cssReset);

          self._originalImageWidth = imgData.width;
          self._originalImageHeight = imgData.height;

          if (self.options.enableZoom) {
              _updateZoomLimits.call(self, true);
          }
          else {
              self._currentZoom = initialZoom;
          }

          transformReset.scale = self._currentZoom;
          cssReset[CSS_TRANSFORM] = transformReset.toString();
          css(img, cssReset);

          if (self.data.points.length) {
              _bindPoints.call(self, self.data.points);
          }
          else {
              _centerImage.call(self);
          }

          _updateCenterPoint.call(self);
          _updateOverlay.call(self);
      }

      function _updateZoomLimits (initial) {
          var self = this,
              minZoom = 0,
              maxZoom = 1.5,
              initialZoom,
              defaultInitialZoom,
              zoomer = self.elements.zoomer,
              scale = parseFloat(zoomer.value),
              boundaryData = self.elements.boundary.getBoundingClientRect(),
              imgData = self.elements.preview.getBoundingClientRect(),
              vpData = self.elements.viewport.getBoundingClientRect(),
              minW,
              minH;

          if (self.options.enforceBoundary) {
              minW = vpData.width / (initial ? imgData.width : imgData.width / scale);
              minH = vpData.height / (initial ? imgData.height : imgData.height / scale);
              minZoom = Math.max(minW, minH);
          }

          if (minZoom >= maxZoom) {
              maxZoom = minZoom + 1;
          }

          zoomer.min = fix(minZoom, 4);
          zoomer.max = fix(maxZoom, 4);

          if (initial) {
              defaultInitialZoom = Math.max((boundaryData.width / imgData.width), (boundaryData.height / imgData.height));
              initialZoom = self.data.boundZoom !== null ? self.data.boundZoom : defaultInitialZoom;
              _setZoomerVal.call(self, initialZoom);
          }

          dispatchChange(zoomer);
      }

      function _bindPoints(points) {
          if (points.length != 4) {
              throw "Croppie - Invalid number of points supplied: " + points;
          }
          var self = this,
              pointsWidth = points[2] - points[0],
              // pointsHeight = points[3] - points[1],
              vpData = self.elements.viewport.getBoundingClientRect(),
              boundRect = self.elements.boundary.getBoundingClientRect(),
              vpOffset = {
                  left: vpData.left - boundRect.left,
                  top: vpData.top - boundRect.top
              },
              scale = vpData.width / pointsWidth,
              originTop = points[1],
              originLeft = points[0],
              transformTop = (-1 * points[1]) + vpOffset.top,
              transformLeft = (-1 * points[0]) + vpOffset.left,
              newCss = {};

          newCss[CSS_TRANS_ORG] = originLeft + 'px ' + originTop + 'px';
          newCss[CSS_TRANSFORM] = new Transform(transformLeft, transformTop, scale).toString();
          css(self.elements.preview, newCss);

          _setZoomerVal.call(self, scale);
          self._currentZoom = scale;
      }

      function _centerImage() {
          var self = this,
              imgDim = self.elements.preview.getBoundingClientRect(),
              vpDim = self.elements.viewport.getBoundingClientRect(),
              boundDim = self.elements.boundary.getBoundingClientRect(),
              vpLeft = vpDim.left - boundDim.left,
              vpTop = vpDim.top - boundDim.top,
              w = vpLeft - ((imgDim.width - vpDim.width) / 2),
              h = vpTop - ((imgDim.height - vpDim.height) / 2),
              transform = new Transform(w, h, self._currentZoom);

          css(self.elements.preview, CSS_TRANSFORM, transform.toString());
      }

      function _transferImageToCanvas(customOrientation) {
          var self = this,
              canvas = self.elements.canvas,
              img = self.elements.img,
              ctx = canvas.getContext('2d'),
              exif = _hasExif.call(self),
              customOrientation = self.options.enableOrientation && customOrientation;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = img.width;
          canvas.height = img.height;

          if (exif && !customOrientation) {
              var orientation = getExifOrientation(img);
              drawCanvas(canvas, img, num(orientation || 0, 10));
          } 
          else if (customOrientation) {
              drawCanvas(canvas, img, customOrientation);
          }
      }

      function _getCanvas(data) {
          var self = this,
              points = data.points,
              left = num(points[0]),
              top = num(points[1]),
              right = num(points[2]),
              bottom = num(points[3]),
              width = right-left,
              height = bottom-top,
              circle = data.circle,
              canvas = document.createElement('canvas'),
              ctx = canvas.getContext('2d'),
              outWidth = width,
              outHeight = height,
              startX = 0,
              startY = 0,
              canvasWidth = outWidth,
              canvasHeight = outHeight,
              customDimensions = (data.outputWidth && data.outputHeight),
              outputRatio = 1;

          if (customDimensions) {
              canvasWidth = data.outputWidth;
              canvasHeight = data.outputHeight;
              outputRatio = canvasWidth / outWidth;
          }

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          if (data.backgroundColor) {
              ctx.fillStyle = data.backgroundColor;
              ctx.fillRect(0, 0, outWidth, outHeight);
          }

          // start fixing data to send to draw image for enforceBoundary: false
          if (!self.options.enforceBoundary) {
              if (left < 0) {
                  startX = Math.abs(left);
                  left = 0;
              }
              if (top < 0) {
                  startY = Math.abs(top);
                  top = 0;
              }
              if (right > self._originalImageWidth) {
                  width = self._originalImageWidth - left;
                  outWidth = width;
              }
              if (bottom > self._originalImageHeight) {
                  height = self._originalImageHeight - top;
                  outHeight = height;
              }
          }

          if (outputRatio !== 1) {
              startX *= outputRatio;
              startY *= outputRatio;
              outWidth *= outputRatio;
              outHeight *= outputRatio;
          }

          ctx.drawImage(this.elements.preview, left, top, Math.min(width, self._originalImageWidth), Math.min(height, self._originalImageHeight), startX, startY, outWidth, outHeight);
          if (circle) {
              ctx.fillStyle = '#fff';
              ctx.globalCompositeOperation = 'destination-in';
              ctx.beginPath();
              ctx.arc(outWidth / 2, outHeight / 2, outWidth / 2, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.fill();
          }
          return canvas;
      }

      function _getHtmlResult(data) {
          var points = data.points,
              div = document.createElement('div'),
              img = document.createElement('img'),
              width = points[2] - points[0],
              height = points[3] - points[1];

          addClass(div, 'croppie-result');
          div.appendChild(img);
          css(img, {
              left: (-1 * points[0]) + 'px',
              top: (-1 * points[1]) + 'px'
          });
          img.src = data.url;
          css(div, {
              width: width + 'px',
              height: height + 'px'
          });

          return div;
      }

      function _getBase64Result(data) {
          return _getCanvas.call(this, data).toDataURL(data.format, data.quality);
      }

      function _getBlobResult(data) {
          var self = this;
          return new Promise(function (resolve, reject) {
              _getCanvas.call(self, data).toBlob(function (blob) {
                  resolve(blob);
              }, data.format, data.quality);
          });
      }

      function _bind(options, cb) {
          var self = this,
              url,
              points = [],
              zoom = null,
              hasExif = _hasExif.call(self);
          if (typeof (options) === 'string') {
              url = options;
              options = {};
          }
          else if (Array.isArray(options)) {
              points = options.slice();
          }
          else if (typeof (options) == 'undefined' && self.data.url) { //refreshing
              _updatePropertiesFromImage.call(self);
              _triggerUpdate.call(self);
              return null;
          }
          else {
              url = options.url;
              points = options.points || [];
              zoom = typeof(options.zoom) === 'undefined' ? null : options.zoom;
          }

          self.data.bound = false;
          self.data.url = url || self.data.url;
          self.data.boundZoom = zoom;

          return loadImage(url, self.elements.img, hasExif).then(function (img) {
              if (!points.length) {
                  var natDim = naturalImageDimensions(img);
                  var rect = self.elements.viewport.getBoundingClientRect();
                  var aspectRatio = rect.width / rect.height;
                  var imgAspectRatio = natDim.width / natDim.height;
                  var width, height;

                  if (imgAspectRatio > aspectRatio) {
                      height = natDim.height;
                      width = height * aspectRatio;
                  }
                  else {
                      width = natDim.width;
                      height = width / aspectRatio;
                  }

                  var x0 = (natDim.width - width) / 2;
                  var y0 = (natDim.height - height) / 2;
                  var x1 = x0 + width;
                  var y1 = y0 + height;

                  self.data.points = [x0, y0, x1, y1];
              } 
              else if (self.options.relative) {
                  points = [
                      points[0] * img.naturalWidth / 100,
                      points[1] * img.naturalHeight / 100,
                      points[2] * img.naturalWidth / 100,
                      points[3] * img.naturalHeight / 100
                  ];
              }

              self.data.points = points.map(function (p) {
                  return parseFloat(p);
              });
              if (self.options.useCanvas) {
                  _transferImageToCanvas.call(self, options.orientation || 1);
              }
              _updatePropertiesFromImage.call(self);
              _triggerUpdate.call(self);
              cb && cb();
          });
      }

      function fix(v, decimalPoints) {
          return parseFloat(v).toFixed(decimalPoints || 0);
      }

      function _get() {
          var self = this,
              imgData = self.elements.preview.getBoundingClientRect(),
              vpData = self.elements.viewport.getBoundingClientRect(),
              x1 = vpData.left - imgData.left,
              y1 = vpData.top - imgData.top,
              widthDiff = (vpData.width - self.elements.viewport.offsetWidth) / 2, //border
              heightDiff = (vpData.height - self.elements.viewport.offsetHeight) / 2,
              x2 = x1 + self.elements.viewport.offsetWidth + widthDiff,
              y2 = y1 + self.elements.viewport.offsetHeight + heightDiff,
              scale = self._currentZoom;

          if (scale === Infinity || isNaN(scale)) {
              scale = 1;
          }

          var max = self.options.enforceBoundary ? 0 : Number.NEGATIVE_INFINITY;
          x1 = Math.max(max, x1 / scale);
          y1 = Math.max(max, y1 / scale);
          x2 = Math.max(max, x2 / scale);
          y2 = Math.max(max, y2 / scale);

          return {
              points: [fix(x1), fix(y1), fix(x2), fix(y2)],
              zoom: scale
          };
      }

      var RESULT_DEFAULTS = {
              type: 'canvas',
              format: 'png',
              quality: 1
          },
          RESULT_FORMATS = ['jpeg', 'webp', 'png'];

      function _result(options) {
          var self = this,
              data = _get.call(self),
              opts = deepExtend(RESULT_DEFAULTS, deepExtend({}, options)),
              resultType = (typeof (options) === 'string' ? options : (opts.type || 'base64')),
              size = opts.size || 'viewport',
              format = opts.format,
              quality = opts.quality,
              backgroundColor = opts.backgroundColor,
              circle = typeof opts.circle === 'boolean' ? opts.circle : (self.options.viewport.type === 'circle'),
              vpRect = self.elements.viewport.getBoundingClientRect(),
              ratio = vpRect.width / vpRect.height,
              prom;

          if (size === 'viewport') {
              data.outputWidth = vpRect.width;
              data.outputHeight = vpRect.height;
          } else if (typeof size === 'object') {
              if (size.width && size.height) {
                  data.outputWidth = size.width;
                  data.outputHeight = size.height;
              } else if (size.width) {
                  data.outputWidth = size.width;
                  data.outputHeight = size.width / ratio;
              } else if (size.height) {
                  data.outputWidth = size.height * ratio;
                  data.outputHeight = size.height;
              }
          }

          if (RESULT_FORMATS.indexOf(format) > -1) {
              data.format = 'image/' + format;
              data.quality = quality;
          }

          data.circle = circle;
          data.url = self.data.url;
          data.backgroundColor = backgroundColor;

          prom = new Promise(function (resolve, reject) {
              switch(resultType.toLowerCase())
              {
                  case 'rawcanvas':
                      resolve(_getCanvas.call(self, data));
                      break;
                  case 'canvas':
                  case 'base64':
                      resolve(_getBase64Result.call(self, data));
                      break;
                  case 'blob':
                      _getBlobResult.call(self, data).then(resolve);
                      break;
                  default:
                      resolve(_getHtmlResult.call(self, data));
                      break;
              }
          });
          return prom;
      }

      function _refresh() {
          _updatePropertiesFromImage.call(this);
      }

      function _rotate(deg) {
          if (!this.options.useCanvas) {
              throw 'Croppie: Cannot rotate without enableOrientation';
          }

          var self = this,
              canvas = self.elements.canvas,
              copy = document.createElement('canvas'),
              ornt = 1;

          copy.width = canvas.width;
          copy.height = canvas.height;
          var ctx = copy.getContext('2d');
          ctx.drawImage(canvas, 0, 0);

          if (deg === 90 || deg === -270) ornt = 6;
          if (deg === -90 || deg === 270) ornt = 8;
          if (deg === 180 || deg === -180) ornt = 3;

          drawCanvas(canvas, copy, ornt);
          _onZoom.call(self);
          copy = null;
      }

      function _destroy() {
          var self = this;
          self.element.removeChild(self.elements.boundary);
          removeClass(self.element, 'croppie-container');
          if (self.options.enableZoom) {
              self.element.removeChild(self.elements.zoomerWrap);
          }
          delete self.elements;
      }

      if (window.jQuery) {
          var $ = window.jQuery;
          $.fn.croppie = function (opts) {
              var ot = typeof opts;

              if (ot === 'string') {
                  var args = Array.prototype.slice.call(arguments, 1);
                  var singleInst = $(this).data('croppie');

                  if (opts === 'get') {
                      return singleInst.get();
                  }
                  else if (opts === 'result') {
                      return singleInst.result.apply(singleInst, args);
                  }
                  else if (opts === 'bind') {
                      return singleInst.bind.apply(singleInst, args);
                  }

                  return this.each(function () {
                      var i = $(this).data('croppie');
                      if (!i) return;

                      var method = i[opts];
                      if ($.isFunction(method)) {
                          method.apply(i, args);
                          if (opts === 'destroy') {
                              $(this).removeData('croppie');
                          }
                      }
                      else {
                          throw 'Croppie ' + opts + ' method not found';
                      }
                  });
              }
              else {
                  return this.each(function () {
                      var i = new Croppie(this, opts);
                      i.$ = $;
                      $(this).data('croppie', i);
                  });
              }
          };
      }

      function Croppie(element, opts) {
          this.element = element;
          this.options = deepExtend(deepExtend({}, Croppie.defaults), opts);

          if (this.element.tagName.toLowerCase() === 'img') {
              var origImage = this.element;
              addClass(origImage, 'cr-original-image');
              var replacementDiv = document.createElement('div');
              this.element.parentNode.appendChild(replacementDiv);
              replacementDiv.appendChild(origImage);
              this.element = replacementDiv;
              this.options.url = this.options.url || origImage.src;
          }

          _create.call(this);
          if (this.options.url) {
              var bindOpts = {
                  url: this.options.url,
                  points: this.options.points
              };
              delete this.options['url'];
              delete this.options['points'];
              _bind.call(this, bindOpts);
          }
      }

      Croppie.defaults = {
          viewport: {
              width: 100,
              height: 100,
              type: 'square'
          },
          boundary: { },
          orientationControls: {
              enabled: true,
              leftClass: '',
              rightClass: ''
          },
          resizeControls: {
              width: true,
              height: true
          },
          customClass: '',
          showZoomer: true,
          enableZoom: true,
          enableResize: false,
          mouseWheelZoom: true,
          enableExif: false,
          enforceBoundary: true,
          enableOrientation: false,
          enableKeyMovement: true,
          update: function () { }
      };

      Croppie.globals = {
          translate: 'translate3d'
      };

      deepExtend(Croppie.prototype, {
          bind: function (options, cb) {
              return _bind.call(this, options, cb);
          },
          get: function () {
              var data = _get.call(this);
              var points = data.points;
              if (this.options.relative) {
                  points[0] /= this.elements.img.naturalWidth / 100;
                  points[1] /= this.elements.img.naturalHeight / 100;
                  points[2] /= this.elements.img.naturalWidth / 100;
                  points[3] /= this.elements.img.naturalHeight / 100;
              }
              return data;
          },
          result: function (type) {
              return _result.call(this, type);
          },
          refresh: function () {
              return _refresh.call(this);
          },
          setZoom: function (v) {
              _setZoomerVal.call(this, v);
              dispatchChange(this.elements.zoomer);
          },
          rotate: function (deg) {
              _rotate.call(this, deg);
          },
          destroy: function () {
              return _destroy.call(this);
          }
      });

      exports.Croppie = window.Croppie = Croppie;

      if ('object' === 'object' && !!module.exports) {
          module.exports = Croppie;
      }
  }));
  });

  var ImageEditor = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.event),expression:"event"}],ref:"root",staticClass:"firecomponent--image-editor--container"},[_c('div',{staticClass:"firecomponent--image-editor--vertical-aligner"},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(!_vm.uploading),expression:"!uploading"}]},[_vm._t("croppie-header",[_c('h1',{staticClass:"firecomponent--image-editor--header"},[_vm._v("Crop Photo")])]),_vm._v(" "),_c('div',{staticClass:"firecomponent--image-editor--croppie-wrapper"},[_c('div',{ref:"croppie"})]),_vm._v(" "),_c('div',{staticClass:"firecomponent--image-editor--controls"},[_vm._t("croppie-controls",[(_vm.allowOrientation)?_c('button',{staticClass:"firecomponent--button",on:{"click":function($event){_vm.rotate(-90);}}},[_vm._v("Rotate Left")]):_vm._e(),_vm._v(" "),(_vm.allowOrientation)?_c('button',{staticClass:"firecomponent--button",on:{"click":function($event){_vm.rotate(90);}}},[_vm._v("Rotate Right")]):_vm._e(),_vm._v(" "),_c('button',{staticClass:"firecomponent--button",on:{"click":_vm.cancel}},[_vm._v("Cancel")]),_vm._v(" "),_c('button',{staticClass:"firecomponent--button",on:{"click":_vm.upload}},[_vm._v("Complete")])],{rotate:_vm.rotate,cancel:_vm.cancel,upload:_vm.upload})],2)],2),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.uploading),expression:"uploading"}],staticClass:"firecomponent--image-editor--uploading-controls"},[_vm._t("uploading",[_c('button',{staticClass:"firecomponent--button",on:{"click":_vm.cancel}},[_vm._v("Cancel Upload")]),_vm._v(" "),_c('button',{staticClass:"firecomponent--button",on:{"click":_vm.continueWithoutWaiting}},[_vm._v("Continue Without Waiting")])],{cancel:_vm.cancel,noWait:_vm.continueWithoutWaiting})],2)])])},staticRenderFns: [],
    name: 'FireImageEditor',
    data () {
      return {
        event: null,
        croppie: null,
        location: null,
        task: null,
        config: null,
        tasks: {},
        uploading: false,
        watchers: {}
      }
    },
    created () {
      this.$imageBus.bus.$on('newUpload', this.handleUpload);
    },
    computed: {
      storageRef () {
        return this.$firebase.storage().refFromURL(this.location || '')
      },
      fileURL () {
        return this.files.length ? window.URL.createObjectURL(this.files[0]) : ''
      },
      files () {
        return this.event ? this.event.target.files : []
      },
      viewport () {
        if (!this.config) {
          return null
        }
        const base = this.boundary.width*0.8;
        const viewport = {
          type: this.config.circle ? 'circle' : 'square'
        };
        if (this.config.aspectRatio > 1) {
          viewport.width = base;
          viewport.height = base / this.config.aspectRatio;
        } else {
          viewport.width = base / this.config.aspectRatio;
          viewport.height = base;
        }
        return viewport
      },
      boundary () {
        const maxWidth = window.innerWidth*0.8;
        const maxHeight = window.innerHeight*0.5;
        const chosen = Math.min(maxWidth,maxHeight);
        return {
          width: chosen,
          height: chosen
        }
      },
      imageFormat () {
        if (!this.config) {
          return null
        }
        return this.config.circle ? 'png' : this.config.format
      },
      allowOrientation () {
        return this.config ? this.config.enableOrientation : false
      }
    },
    methods: {
      initializeCroppie () {
        this.$nextTick(() => {
          this.croppie = new window.Croppie(this.$refs.croppie, {
            enforceBoundary: this.config.enforceBoundary,
            enableOrientation: this.config.enableOrientation,
            viewport: this.viewport,
            boundary: this.boundary
          });
          this.croppie.bind({
            url: this.fileURL
          });
        });
      },
      handleUpload (location, e, config) {
        if (this.event || e.target.files.length <= 0) {
          return this.$imageBus.bus.$emit(location + '-cancelled', e)
        }
        this.event = e;
        this.location = location;
        this.config = config;
        this.initializeCroppie();
      },
      rotate (degrees) {
        if (this.croppie && this.allowOrientation) {
          this.croppie.rotate(degrees);
        }
      },
      cancel () {
        this.$imageBus.bus.$emit(this.location + '-cancelled', this.e);
        const tasks = this.tasks[this.location];
        if (tasks && tasks.length) {
          tasks.forEach((task) => {
            task.cancel();
          });
        }
        this.teardown();
      },
      teardown () {
        this.destroyCroppie();
        this.location = null;
        this.event = null;
        this.config = null;
      },
      destroyCroppie () {
        if (this.croppie) {
          this.croppie.destroy();
          this.croppie = null;
        }
      },
      upload () {
        const locationCopy = this.location;
        const eventCopy = this.event;
        this.tasks[locationCopy] = [];
        this.uploading = true;
        Promise.all(
          this.config.widths.map((width, index) => {
            const ref = this.storageRef.child(index+'');
            return this.getCroppedImage(width)
              .then((image) => {
                return this.uploadToCloudStorage(image, ref)
              })
          })
        ).then((snapshots) => {
          if (locationCopy === this.location) {
            this.teardown();
            this.uploading = false;
          }
          this.tasks[locationCopy] = null;
          this.$imageBus.bus.$emit(locationCopy + '-completed', eventCopy, snapshots.map((ss) => { return ss.downloadURL }));
        });
      },
      getCroppedImage (width) {
        return this.croppie.result({
          type: 'blob',
          size: {
            width: width
          },
          format: this.imageFormat,
          circle: this.config.circle,
          quality: this.config.quality || 1,
        })
      },
      uploadToCloudStorage (image, ref) {
        var task = ref.put(image);
        this.tasks[this.location].push(task);
        return task
      },
      continueWithoutWaiting () {
        this.teardown();
        this.uploading = false;
      }
    },
  }

  var InlineEditor = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c(_vm.customTag,{tag:"component",staticStyle:{"width":"100%"},attrs:{"title":_vm.title},on:{"mouseover":_vm.startEdit,"mouseleave":_vm.attemptStop}},[(_vm.isEditing)?_c('div',{key:_vm.uniqueKey,ref:"editor",staticClass:"firecomponent--inline-editor",style:(_vm.editorStyle),attrs:{"contenteditable":"true"},on:{"blur":_vm.stopEdit,"input":_vm.contentChangeEventHandler}},[_vm._v(" "+_vm._s(_vm.value)+" ")]):_vm._t("display",[_vm._v(" "+_vm._s(_vm.value)+" ")],{content:_vm.value})],2)},staticRenderFns: [],_scopeId: 'data-v-8691ead4',
    name: 'FireComponentInlineEditor',
    props: {
      value: {
        type: [String,Number],
        required: true
      },
      editable: {
        required: true,
        type: [Boolean]
      },
      customTag: {
        type: [String],
        default: 'span'
      },
      editorStyle: {
        type: [Object],
        default: () => Object.create(null)
      }
    },
    data () {
      return {
        uniqueKey: 'firecomponent--inline-editor--' + this.$uniqId,
        isEditing: false
      }
    },
    computed: {
      title () {
        if (this.editable) {
          return 'Click to Edit'
        }
        return null
      }
    },
    methods: {
      contentChangeEventHandler (e) {
        this.$emit('input', e);
      },
      startEdit (e) {
        this.isEditing = this.editable;
      },
      stopEdit (e) {
        this.isEditing = false;
      },
      attemptStop (e) {
        this.isEditing = this.$refs.editor === document.activeElement;
      }
    }
  }

  function ImageBus (_Vue) {
    this.bus = new _Vue();

    this.newUpload = function (...params) {
      this.bus.$emit('newUpload', ...params);
    };
  }

  function FireMessenger (_Vue) {
    this.bus = new _Vue();
    this.send = function (message) {
      this.bus.$emit(message);
    };
    this.save = function () {
      this.send('save');
    };
    this.reset = function () {
      this.send('reset');
    };
  }

  // Install the components
  function install (Vue, firebase) {
    if (typeof firebase === 'object') {
      Vue.prototype.$firebase = firebase;
    } else {
      console.error('You must add your firebase configuration object to the firecomponent library');
      return;
    }

    Vue.prototype.$imageBus = new ImageBus(Vue);
    Vue.prototype.$messenger = new FireMessenger(Vue);
    // Add a accessor for getting the unique id of the component
    Object.defineProperty(Vue.prototype, '$uniqId', {
      get () {
        return this._uid;
      },
    });

    var editorID = 'firecomponent--image-editor';
    var insertElem = window.document.createElement("div");
    insertElem.id = editorID;
    window.document.body.appendChild(insertElem);
    new Vue({
      el: '#'+editorID,
      render: h => h(ImageEditor)
    });

    Vue.component('fire-image', FireImage);
    Vue.component('fire-input', FireInput);
    Vue.component('fire-inline-editor', InlineEditor);
  }

  /* -- Plugin definition & Auto-install -- */
  /* You shouldn't have to modify the code below */

  // Plugin
  var plugin = {
    /* eslint-disable no-undef */
    install: install
  };

  // Auto-install
  var GlobalVue = null;
  if (typeof window !== 'undefined') {
    GlobalVue = window.Vue;
  } else if (typeof global !== 'undefined') {
    GlobalVue = global.Vue;
  }
  if (GlobalVue) {
    GlobalVue.initializeApp = function (config) {
      Vue.use(plugin, config);
    };
  }

  exports.install = install;
  exports.FireImage = FireImage;
  exports.FireInput = FireInput;
  exports.default = plugin;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
