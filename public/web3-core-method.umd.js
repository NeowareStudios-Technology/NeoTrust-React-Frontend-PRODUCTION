(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('eventemitter3'), require('@babel/runtime/helpers/toConsumableArray'), require('lodash/isString'), require('lodash/cloneDeep'), require('web3-core-promievent'), require('web3-core-subscriptions'), require('web3-core-helpers'), require('web3-utils'), require('@babel/runtime/regenerator'), require('@babel/runtime/helpers/asyncToGenerator'), require('@babel/runtime/helpers/get'), require('lodash/isFunction'), require('@babel/runtime/helpers/createClass'), require('@babel/runtime/helpers/classCallCheck'), require('@babel/runtime/helpers/possibleConstructorReturn'), require('@babel/runtime/helpers/getPrototypeOf'), require('@babel/runtime/helpers/inherits')) :
    typeof define === 'function' && define.amd ? define(['exports', 'eventemitter3', '@babel/runtime/helpers/toConsumableArray', 'lodash/isString', 'lodash/cloneDeep', 'web3-core-promievent', 'web3-core-subscriptions', 'web3-core-helpers', 'web3-utils', '@babel/runtime/regenerator', '@babel/runtime/helpers/asyncToGenerator', '@babel/runtime/helpers/get', 'lodash/isFunction', '@babel/runtime/helpers/createClass', '@babel/runtime/helpers/classCallCheck', '@babel/runtime/helpers/possibleConstructorReturn', '@babel/runtime/helpers/getPrototypeOf', '@babel/runtime/helpers/inherits'], factory) :
    (factory((global.Web3CoreMethod = {}),global.EventEmitter,global._toConsumableArray,global.isString,global.cloneDeep,global.web3CorePromievent,global.web3CoreSubscriptions,global.web3CoreHelpers,global.Utils,global._regeneratorRuntime,global._asyncToGenerator,global._get,global.isFunction,global._createClass,global._classCallCheck,global._possibleConstructorReturn,global._getPrototypeOf,global._inherits));
}(this, (function (exports,EventEmitter,_toConsumableArray,isString,cloneDeep,web3CorePromievent,web3CoreSubscriptions,web3CoreHelpers,Utils,_regeneratorRuntime,_asyncToGenerator,_get,isFunction,_createClass,_classCallCheck,_possibleConstructorReturn,_getPrototypeOf,_inherits) { 'use strict';

    EventEmitter = EventEmitter && EventEmitter.hasOwnProperty('default') ? EventEmitter['default'] : EventEmitter;
    _toConsumableArray = _toConsumableArray && _toConsumableArray.hasOwnProperty('default') ? _toConsumableArray['default'] : _toConsumableArray;
    isString = isString && isString.hasOwnProperty('default') ? isString['default'] : isString;
    cloneDeep = cloneDeep && cloneDeep.hasOwnProperty('default') ? cloneDeep['default'] : cloneDeep;
    _regeneratorRuntime = _regeneratorRuntime && _regeneratorRuntime.hasOwnProperty('default') ? _regeneratorRuntime['default'] : _regeneratorRuntime;
    _asyncToGenerator = _asyncToGenerator && _asyncToGenerator.hasOwnProperty('default') ? _asyncToGenerator['default'] : _asyncToGenerator;
    _get = _get && _get.hasOwnProperty('default') ? _get['default'] : _get;
    isFunction = isFunction && isFunction.hasOwnProperty('default') ? isFunction['default'] : isFunction;
    _createClass = _createClass && _createClass.hasOwnProperty('default') ? _createClass['default'] : _createClass;
    _classCallCheck = _classCallCheck && _classCallCheck.hasOwnProperty('default') ? _classCallCheck['default'] : _classCallCheck;
    _possibleConstructorReturn = _possibleConstructorReturn && _possibleConstructorReturn.hasOwnProperty('default') ? _possibleConstructorReturn['default'] : _possibleConstructorReturn;
    _getPrototypeOf = _getPrototypeOf && _getPrototypeOf.hasOwnProperty('default') ? _getPrototypeOf['default'] : _getPrototypeOf;
    _inherits = _inherits && _inherits.hasOwnProperty('default') ? _inherits['default'] : _inherits;

    var TransactionConfirmationWorkflow =
    function () {
      function TransactionConfirmationWorkflow(transactionReceiptValidator, newHeadsWatcher, getTransactionReceiptMethod) {
        _classCallCheck(this, TransactionConfirmationWorkflow);
        this.transactionReceiptValidator = transactionReceiptValidator;
        this.newHeadsWatcher = newHeadsWatcher;
        this.timeoutCounter = 0;
        this.confirmationsCounter = 0;
        this.getTransactionReceiptMethod = getTransactionReceiptMethod;
      }
      _createClass(TransactionConfirmationWorkflow, [{
        key: "execute",
        value: function execute(method, moduleInstance, transactionHash, promiEvent) {
          var _this = this;
          this.getTransactionReceiptMethod.parameters = [transactionHash];
          this.getTransactionReceiptMethod.execute(moduleInstance).then(function (receipt) {
            if (receipt && receipt.blockHash) {
              var validationResult = _this.transactionReceiptValidator.validate(receipt, method);
              if (validationResult === true) {
                _this.handleSuccessState(receipt, method, promiEvent);
                return;
              }
              _this.handleErrorState(validationResult, method, promiEvent);
              return;
            }
            _this.newHeadsWatcher.watch(moduleInstance).on('newHead', function () {
              _this.timeoutCounter++;
              if (!_this.isTimeoutTimeExceeded(moduleInstance, _this.newHeadsWatcher.isPolling)) {
                _this.getTransactionReceiptMethod.execute(moduleInstance).then(function (receipt) {
                  if (receipt && receipt.blockHash) {
                    var _validationResult = _this.transactionReceiptValidator.validate(receipt, method);
                    if (_validationResult === true) {
                      _this.confirmationsCounter++;
                      promiEvent.emit('confirmation', _this.confirmationsCounter, receipt);
                      if (_this.isConfirmed(moduleInstance)) {
                        _this.handleSuccessState(receipt, method, promiEvent);
                      }
                      return;
                    }
                    _this.handleErrorState(_validationResult, method, promiEvent);
                  }
                });
                return;
              }
              var error = new Error("Transaction was not mined within ".concat(moduleInstance.transactionBlockTimeout, " blocks, please make sure your transaction was properly sent. Be aware that it might still be mined!"));
              if (_this.newHeadsWatcher.isPolling) {
                error = new Error("Transaction was not mined within ".concat(moduleInstance.transactionPollingTimeout, " seconds, please make sure your transaction was properly sent. Be aware that it might still be mined!"));
              }
              _this.handleErrorState(error, method, promiEvent);
            });
          });
        }
      }, {
        key: "isConfirmed",
        value: function isConfirmed(moduleInstance) {
          return this.confirmationsCounter === moduleInstance.transactionConfirmationBlocks;
        }
      }, {
        key: "isTimeoutTimeExceeded",
        value: function isTimeoutTimeExceeded(moduleInstance, watcherIsPolling) {
          var timeout = moduleInstance.transactionBlockTimeout;
          if (watcherIsPolling) {
            timeout = moduleInstance.transactionPollingTimeout;
          }
          return this.timeoutCounter > timeout;
        }
      }, {
        key: "handleSuccessState",
        value: function handleSuccessState(receipt, method, promiEvent) {
          this.timeoutCounter = 0;
          this.confirmationsCounter = 0;
          this.newHeadsWatcher.stop();
          if (method.constructor.name === 'ContractDeployMethod') {
            if (method.callback) {
              method.callback(false, receipt);
            }
            promiEvent.resolve(method.afterExecution(receipt));
            promiEvent.emit('receipt', receipt);
            promiEvent.removeAllListeners();
            return;
          }
          var mappedReceipt = method.afterExecution(receipt);
          if (method.callback) {
            method.callback(false, mappedReceipt);
          }
          promiEvent.resolve(mappedReceipt);
          promiEvent.emit('receipt', mappedReceipt);
          promiEvent.removeAllListeners();
        }
      }, {
        key: "handleErrorState",
        value: function handleErrorState(error, method, promiEvent) {
          this.timeoutCounter = 0;
          this.confirmationsCounter = 0;
          this.newHeadsWatcher.stop();
          if (method.callback) {
            method.callback(error, null);
          }
          promiEvent.reject(error);
          promiEvent.emit('error', error);
          promiEvent.removeAllListeners();
        }
      }]);
      return TransactionConfirmationWorkflow;
    }();

    var TransactionReceiptValidator =
    function () {
      function TransactionReceiptValidator() {
        _classCallCheck(this, TransactionReceiptValidator);
      }
      _createClass(TransactionReceiptValidator, [{
        key: "validate",
        value: function validate(receipt, method) {
          var receiptJSON = JSON.stringify(receipt, null, 2);
          if (!this.isValidGasUsage(receipt, method)) {
            return new Error("Transaction ran out of gas. Please provide more gas:\n".concat(receiptJSON));
          }
          if (!this.isValidReceiptStatus(receipt)) {
            return new Error("Transaction has been reverted by the EVM:\n".concat(receiptJSON));
          }
          return true;
        }
      }, {
        key: "isValidReceiptStatus",
        value: function isValidReceiptStatus(receipt) {
          return receipt.status === true || typeof receipt.status === 'undefined' || receipt.status === null;
        }
      }, {
        key: "isValidGasUsage",
        value: function isValidGasUsage(receipt, method) {
          return !receipt.outOfGas && method.utils.hexToNumber(method.parameters[0].gas) !== receipt.gasUsed;
        }
      }]);
      return TransactionReceiptValidator;
    }();

    var NewHeadsWatcher =
    function (_EventEmitter) {
      _inherits(NewHeadsWatcher, _EventEmitter);
      function NewHeadsWatcher(subscriptionsFactory) {
        var _this;
        _classCallCheck(this, NewHeadsWatcher);
        _this = _possibleConstructorReturn(this, _getPrototypeOf(NewHeadsWatcher).call(this));
        _this.subscriptionsFactory = subscriptionsFactory;
        _this.confirmationInterval = null;
        _this.confirmationSubscription = null;
        _this.isPolling = false;
        return _this;
      }
      _createClass(NewHeadsWatcher, [{
        key: "watch",
        value: function watch(moduleInstance) {
          var _this2 = this;
          var providerName = moduleInstance.currentProvider.constructor.name;
          if (providerName !== 'HttpProvider' && providerName !== 'CustomProvider') {
            this.confirmationSubscription = this.subscriptionsFactory.createNewHeadsSubscription(moduleInstance).subscribe(function () {
              _this2.emit('newHead');
            });
            return this;
          }
          this.isPolling = true;
          this.confirmationInterval = setInterval(function () {
            _this2.emit('newHead');
          }, 1000);
          return this;
        }
      }, {
        key: "stop",
        value: function stop() {
          if (this.confirmationSubscription) {
            this.confirmationSubscription.unsubscribe();
          }
          if (this.confirmationInterval) {
            clearInterval(this.confirmationInterval);
          }
          this.removeAllListeners('newHead');
        }
      }]);
      return NewHeadsWatcher;
    }(EventEmitter);

    var MethodProxy =
    function MethodProxy(target, methodFactory) {
      _classCallCheck(this, MethodProxy);
      return new Proxy(target, {
        get: function get(target, name) {
          if (methodFactory.hasMethod(name)) {
            var anonymousFunction = function anonymousFunction() {
              method.arguments = arguments;
              if (method.Type === 'CALL') {
                return method.execute(target);
              }
              return method.execute(target, new web3CorePromievent.PromiEvent());
            };
            if (typeof target[name] !== 'undefined') {
              throw new TypeError("Duplicated method ".concat(name, ". This method is defined as RPC call and as Object method."));
            }
            var method = methodFactory.createMethod(name);
            anonymousFunction.method = method;
            anonymousFunction.request = function () {
              method.arguments = arguments;
              return method;
            };
            return anonymousFunction;
          }
          return target[name];
        }
      });
    };

    var AbstractMethod =
    function () {
      function AbstractMethod(rpcMethod, parametersAmount, utils, formatters) {
        _classCallCheck(this, AbstractMethod);
        this.utils = utils;
        this.formatters = formatters;
        this.promiEvent = new web3CorePromievent.PromiEvent();
        this._arguments = {
          parameters: []
        };
        this._rpcMethod = rpcMethod;
        this._parametersAmount = parametersAmount;
      }
      _createClass(AbstractMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {}
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return response;
        }
      }, {
        key: "execute",
        value: function execute(moduleInstance) {}
      }, {
        key: "isHash",
        value: function isHash(parameter) {
          return isString(parameter) && parameter.indexOf('0x') === 0;
        }
      }, {
        key: "rpcMethod",
        set: function set(value) {
          this._rpcMethod = value;
        }
        ,
        get: function get() {
          return this._rpcMethod;
        }
      }, {
        key: "parametersAmount",
        set: function set(value) {
          this._parametersAmount = value;
        }
        ,
        get: function get() {
          return this._parametersAmount;
        }
      }, {
        key: "parameters",
        get: function get() {
          return this._arguments.parameters;
        }
        ,
        set: function set(value) {
          this._arguments.parameters = value;
        }
      }, {
        key: "callback",
        get: function get() {
          return this._arguments.callback;
        }
        ,
        set: function set(value) {
          this._arguments.callback = value;
        }
      }, {
        key: "arguments",
        set: function set(args) {
          var parameters = cloneDeep(_toConsumableArray(args));
          var callback = null;
          if (parameters.length > this.parametersAmount) {
            if (!isFunction(parameters[parameters.length - 1])) {
              throw new TypeError("The latest parameter should be a function otherwise it can't be used as callback");
            }
            callback = parameters.pop();
          }
          this._arguments = {
            callback: callback,
            parameters: parameters
          };
        }
        ,
        get: function get() {
          return this._arguments;
        }
      }]);
      return AbstractMethod;
    }();

    var AbstractCallMethod =
    function (_AbstractMethod) {
      _inherits(AbstractCallMethod, _AbstractMethod);
      function AbstractCallMethod(rpcMethod, parametersAmount, utils, formatters) {
        _classCallCheck(this, AbstractCallMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(AbstractCallMethod).call(this, rpcMethod, parametersAmount, utils, formatters));
      }
      _createClass(AbstractCallMethod, [{
        key: "execute",
        value: function () {
          var _execute = _asyncToGenerator(
          _regeneratorRuntime.mark(function _callee(moduleInstance) {
            var response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    this.beforeExecution(moduleInstance);
                    if (!(this.parameters.length !== this.parametersAmount)) {
                      _context.next = 3;
                      break;
                    }
                    throw new Error("Invalid Arguments length: expected: ".concat(this.parametersAmount, ", given: ").concat(this.parameters.length));
                  case 3:
                    _context.prev = 3;
                    _context.next = 6;
                    return moduleInstance.currentProvider.send(this.rpcMethod, this.parameters);
                  case 6:
                    response = _context.sent;
                    if (response) {
                      response = this.afterExecution(response);
                    }
                    if (this.callback) {
                      this.callback(false, response);
                    }
                    return _context.abrupt("return", response);
                  case 12:
                    _context.prev = 12;
                    _context.t0 = _context["catch"](3);
                    if (this.callback) {
                      this.callback(_context.t0, null);
                    }
                    throw _context.t0;
                  case 16:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this, [[3, 12]]);
          }));
          function execute(_x) {
            return _execute.apply(this, arguments);
          }
          return execute;
        }()
      }], [{
        key: "Type",
        get: function get() {
          return 'CALL';
        }
      }]);
      return AbstractCallMethod;
    }(AbstractMethod);

    var GetTransactionReceiptMethod =
    function (_AbstractCallMethod) {
      _inherits(GetTransactionReceiptMethod, _AbstractCallMethod);
      function GetTransactionReceiptMethod(utils, formatters) {
        _classCallCheck(this, GetTransactionReceiptMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionReceiptMethod).call(this, 'eth_getTransactionReceipt', 1, utils, formatters));
      }
      _createClass(GetTransactionReceiptMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          if (response !== null) {
            return this.formatters.outputTransactionReceiptFormatter(response);
          }
          return response;
        }
      }]);
      return GetTransactionReceiptMethod;
    }(AbstractCallMethod);

    var AbstractSendMethod =
    function (_AbstractMethod) {
      _inherits(AbstractSendMethod, _AbstractMethod);
      function AbstractSendMethod(rpcMethod, parametersAmount, utils, formatters, transactionConfirmationWorkflow) {
        var _this;
        _classCallCheck(this, AbstractSendMethod);
        _this = _possibleConstructorReturn(this, _getPrototypeOf(AbstractSendMethod).call(this, rpcMethod, parametersAmount, utils, formatters));
        _this.transactionConfirmationWorkflow = transactionConfirmationWorkflow;
        return _this;
      }
      _createClass(AbstractSendMethod, [{
        key: "execute",
        value: function execute(moduleInstance, promiEvent) {
          var _this2 = this;
          this.beforeExecution(moduleInstance);
          if (this.parameters.length !== this.parametersAmount) {
            throw new Error("Invalid Arguments length: expected: ".concat(this.parametersAmount, ", given: ").concat(this.parameters.length));
          }
          moduleInstance.currentProvider.send(this.rpcMethod, this.parameters).then(function (response) {
            _this2.transactionConfirmationWorkflow.execute(_this2, moduleInstance, response, promiEvent);
            if (_this2.callback) {
              _this2.callback(false, response);
            }
            promiEvent.emit('transactionHash', response);
          }).catch(function (error) {
            if (_this2.callback) {
              _this2.callback(error, null);
            }
            promiEvent.reject(error);
            promiEvent.emit('error', error);
            promiEvent.removeAllListeners();
          });
          return promiEvent;
        }
      }], [{
        key: "Type",
        get: function get() {
          return 'SEND';
        }
      }]);
      return AbstractSendMethod;
    }(AbstractMethod);

    var SendRawTransactionMethod =
    function (_AbstractSendMethod) {
      _inherits(SendRawTransactionMethod, _AbstractSendMethod);
      function SendRawTransactionMethod(utils, formatters, transactionConfirmationWorkflow) {
        _classCallCheck(this, SendRawTransactionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(SendRawTransactionMethod).call(this, 'eth_sendRawTransaction', 1, utils, formatters, transactionConfirmationWorkflow));
      }
      return SendRawTransactionMethod;
    }(AbstractSendMethod);

    var ModuleFactory =
    function () {
      function ModuleFactory(subscriptionsFactory, utils, formatters) {
        _classCallCheck(this, ModuleFactory);
        this.subscriptionsFactory = subscriptionsFactory;
        this.formatters = formatters;
        this.utils = utils;
      }
      _createClass(ModuleFactory, [{
        key: "createMethodProxy",
        value: function createMethodProxy(target, methodFactory) {
          return new MethodProxy(target, methodFactory);
        }
      }, {
        key: "createTransactionConfirmationWorkflow",
        value: function createTransactionConfirmationWorkflow() {
          return new TransactionConfirmationWorkflow(this.createTransactionReceiptValidator(), this.createNewHeadsWatcher(), new GetTransactionReceiptMethod(this.utils, this.formatters));
        }
      }, {
        key: "createTransactionReceiptValidator",
        value: function createTransactionReceiptValidator() {
          return new TransactionReceiptValidator();
        }
      }, {
        key: "createNewHeadsWatcher",
        value: function createNewHeadsWatcher() {
          return new NewHeadsWatcher(this.subscriptionsFactory);
        }
      }, {
        key: "createSendRawTransactionMethod",
        value: function createSendRawTransactionMethod() {
          return new SendRawTransactionMethod(this.utils, this.formatters, this.createTransactionConfirmationWorkflow());
        }
      }]);
      return ModuleFactory;
    }();

    var GetTransactionCountMethod =
    function (_AbstractCallMethod) {
      _inherits(GetTransactionCountMethod, _AbstractCallMethod);
      function GetTransactionCountMethod(utils, formatters) {
        _classCallCheck(this, GetTransactionCountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionCountMethod).call(this, 'eth_getTransactionCount', 2, utils, formatters));
      }
      _createClass(GetTransactionCountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
          if (isFunction(this.parameters[1])) {
            this.callback = this.parameters[1];
            this.parameters[1] = moduleInstance.defaultBlock;
          }
          this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return GetTransactionCountMethod;
    }(AbstractCallMethod);

    var ChainIdMethod =
    function (_AbstractCallMethod) {
      _inherits(ChainIdMethod, _AbstractCallMethod);
      function ChainIdMethod(utils, formatters) {
        _classCallCheck(this, ChainIdMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(ChainIdMethod).call(this, 'eth_chainId', 0, utils, formatters));
      }
      _createClass(ChainIdMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return ChainIdMethod;
    }(AbstractCallMethod);

    var AbstractMethodFactory =
    function () {
      function AbstractMethodFactory(methodModuleFactory, utils, formatters) {
        _classCallCheck(this, AbstractMethodFactory);
        this.methodModuleFactory = methodModuleFactory;
        this.utils = utils;
        this.formatters = formatters;
        this._methods = null;
      }
      _createClass(AbstractMethodFactory, [{
        key: "hasMethod",
        value: function hasMethod(name) {
          return typeof this.methods[name] !== 'undefined';
        }
      }, {
        key: "createMethod",
        value: function createMethod(name) {
          var method = this.methods[name];
          switch (method.Type) {
            case 'CALL':
              return new method(this.utils, this.formatters);
            case 'SEND':
              if (method.name === 'SendTransactionMethod') {
                var transactionConfirmationWorkflow = this.methodModuleFactory.createTransactionConfirmationWorkflow();
                return new method(this.utils, this.formatters, transactionConfirmationWorkflow, new SendRawTransactionMethod(this.utils, this.formatters, transactionConfirmationWorkflow), new ChainIdMethod(this.utils, this.formatters), new GetTransactionCountMethod(this.utils, this.formatters));
              }
              return new method(this.utils, this.formatters, this.methodModuleFactory.createTransactionConfirmationWorkflow());
          }
        }
      }, {
        key: "methods",
        get: function get() {
          if (this._methods) {
            return this._methods;
          }
          throw new Error('No methods defined for MethodFactory!');
        }
        ,
        set: function set(value) {
          this._methods = value;
        }
      }]);
      return AbstractMethodFactory;
    }();

    var GetProtocolVersionMethod =
    function (_AbstractCallMethod) {
      _inherits(GetProtocolVersionMethod, _AbstractCallMethod);
      function GetProtocolVersionMethod(utils, formatters) {
        _classCallCheck(this, GetProtocolVersionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetProtocolVersionMethod).call(this, 'eth_protocolVersion', 0, utils, formatters));
      }
      return GetProtocolVersionMethod;
    }(AbstractCallMethod);

    var VersionMethod =
    function (_AbstractCallMethod) {
      _inherits(VersionMethod, _AbstractCallMethod);
      function VersionMethod(utils, formatters) {
        _classCallCheck(this, VersionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(VersionMethod).call(this, 'net_version', 0, utils, formatters));
      }
      _createClass(VersionMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return VersionMethod;
    }(AbstractCallMethod);

    var ListeningMethod =
    function (_AbstractCallMethod) {
      _inherits(ListeningMethod, _AbstractCallMethod);
      function ListeningMethod(utils, formatters) {
        _classCallCheck(this, ListeningMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(ListeningMethod).call(this, 'net_listening', 0, utils, formatters));
      }
      return ListeningMethod;
    }(AbstractCallMethod);

    var PeerCountMethod =
    function (_AbstractCallMethod) {
      _inherits(PeerCountMethod, _AbstractCallMethod);
      function PeerCountMethod(utils, formatters) {
        _classCallCheck(this, PeerCountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(PeerCountMethod).call(this, 'net_peerCount', 0, utils, formatters));
      }
      _createClass(PeerCountMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return PeerCountMethod;
    }(AbstractCallMethod);

    var GetNodeInfoMethod =
    function (_AbstractCallMethod) {
      _inherits(GetNodeInfoMethod, _AbstractCallMethod);
      function GetNodeInfoMethod(utils, formatters) {
        _classCallCheck(this, GetNodeInfoMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetNodeInfoMethod).call(this, 'web3_clientVersion', 0, utils, formatters));
      }
      return GetNodeInfoMethod;
    }(AbstractCallMethod);

    var GetCoinbaseMethod =
    function (_AbstractCallMethod) {
      _inherits(GetCoinbaseMethod, _AbstractCallMethod);
      function GetCoinbaseMethod(utils, formatters) {
        _classCallCheck(this, GetCoinbaseMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetCoinbaseMethod).call(this, 'eth_coinbase', 0, utils, formatters));
      }
      return GetCoinbaseMethod;
    }(AbstractCallMethod);

    var IsMiningMethod =
    function (_AbstractCallMethod) {
      _inherits(IsMiningMethod, _AbstractCallMethod);
      function IsMiningMethod(utils, formatters) {
        _classCallCheck(this, IsMiningMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(IsMiningMethod).call(this, 'eth_mining', 0, utils, formatters));
      }
      return IsMiningMethod;
    }(AbstractCallMethod);

    var GetHashrateMethod =
    function (_AbstractCallMethod) {
      _inherits(GetHashrateMethod, _AbstractCallMethod);
      function GetHashrateMethod(utils, formatters) {
        _classCallCheck(this, GetHashrateMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetHashrateMethod).call(this, 'eth_hashrate', 0, utils, formatters));
      }
      _createClass(GetHashrateMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return GetHashrateMethod;
    }(AbstractCallMethod);

    var IsSyncingMethod =
    function (_AbstractCallMethod) {
      _inherits(IsSyncingMethod, _AbstractCallMethod);
      function IsSyncingMethod(utils, formatters) {
        _classCallCheck(this, IsSyncingMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(IsSyncingMethod).call(this, 'eth_syncing', 0, utils, formatters));
      }
      _createClass(IsSyncingMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          if (typeof response !== 'boolean') {
            return this.formatters.outputSyncingFormatter(response);
          }
          return response;
        }
      }]);
      return IsSyncingMethod;
    }(AbstractCallMethod);

    var GetGasPriceMethod =
    function (_AbstractCallMethod) {
      _inherits(GetGasPriceMethod, _AbstractCallMethod);
      function GetGasPriceMethod(utils, formatters) {
        _classCallCheck(this, GetGasPriceMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetGasPriceMethod).call(this, 'eth_gasPrice', 0, utils, formatters));
      }
      _createClass(GetGasPriceMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.formatters.outputBigNumberFormatter(response);
        }
      }]);
      return GetGasPriceMethod;
    }(AbstractCallMethod);

    var SubmitWorkMethod =
    function (_AbstractCallMethod) {
      _inherits(SubmitWorkMethod, _AbstractCallMethod);
      function SubmitWorkMethod(utils, formatters) {
        _classCallCheck(this, SubmitWorkMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(SubmitWorkMethod).call(this, 'eth_submitWork', 3, utils, formatters));
      }
      return SubmitWorkMethod;
    }(AbstractCallMethod);

    var GetWorkMethod =
    function (_AbstractCallMethod) {
      _inherits(GetWorkMethod, _AbstractCallMethod);
      function GetWorkMethod(utils, formatters) {
        _classCallCheck(this, GetWorkMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetWorkMethod).call(this, 'eth_getWork', 0, utils, formatters));
      }
      return GetWorkMethod;
    }(AbstractCallMethod);

    var GetAccountsMethod =
    function (_AbstractCallMethod) {
      _inherits(GetAccountsMethod, _AbstractCallMethod);
      function GetAccountsMethod(utils, formatters) {
        _classCallCheck(this, GetAccountsMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetAccountsMethod).call(this, 'eth_accounts', 0, utils, formatters));
      }
      _createClass(GetAccountsMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          var _this = this;
          return response.map(function (responseItem) {
            return _this.utils.toChecksumAddress(responseItem);
          });
        }
      }]);
      return GetAccountsMethod;
    }(AbstractCallMethod);

    var GetBalanceMethod =
    function (_AbstractCallMethod) {
      _inherits(GetBalanceMethod, _AbstractCallMethod);
      function GetBalanceMethod(utils, formatters) {
        _classCallCheck(this, GetBalanceMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBalanceMethod).call(this, 'eth_getBalance', 2, utils, formatters));
      }
      _createClass(GetBalanceMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
          if (isFunction(this.parameters[1])) {
            this.callback = this.parameters[1];
            this.parameters[1] = moduleInstance.defaultBlock;
          }
          this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.formatters.outputBigNumberFormatter(response);
        }
      }]);
      return GetBalanceMethod;
    }(AbstractCallMethod);

    var RequestAccountsMethod =
    function (_AbstractCallMethod) {
      _inherits(RequestAccountsMethod, _AbstractCallMethod);
      function RequestAccountsMethod() {
        _classCallCheck(this, RequestAccountsMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(RequestAccountsMethod).call(this, 'eth_requestAccounts', 0, null, null));
      }
      return RequestAccountsMethod;
    }(AbstractCallMethod);

    var GetBlockNumberMethod =
    function (_AbstractCallMethod) {
      _inherits(GetBlockNumberMethod, _AbstractCallMethod);
      function GetBlockNumberMethod(utils, formatters) {
        _classCallCheck(this, GetBlockNumberMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockNumberMethod).call(this, 'eth_blockNumber', 0, utils, formatters));
      }
      _createClass(GetBlockNumberMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return GetBlockNumberMethod;
    }(AbstractCallMethod);

    var GetBlockMethod =
    function (_AbstractCallMethod) {
      _inherits(GetBlockMethod, _AbstractCallMethod);
      function GetBlockMethod(utils, formatters) {
        _classCallCheck(this, GetBlockMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockMethod).call(this, 'eth_getBlockByNumber', 2, utils, formatters));
      }
      _createClass(GetBlockMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getBlockByHash';
          }
          this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
          if (isFunction(this.parameters[1])) {
            this.callback = this.parameters[1];
            this.parameters[1] = false;
          } else {
            this.parameters[1] = !!this.parameters[1];
          }
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.formatters.outputBlockFormatter(response);
        }
      }]);
      return GetBlockMethod;
    }(AbstractCallMethod);

    var GetUncleMethod =
    function (_AbstractCallMethod) {
      _inherits(GetUncleMethod, _AbstractCallMethod);
      function GetUncleMethod(utils, formatters) {
        _classCallCheck(this, GetUncleMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetUncleMethod).call(this, 'eth_getUncleByBlockNumberAndIndex', 2, utils, formatters));
      }
      _createClass(GetUncleMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getUncleByBlockHashAndIndex';
          }
          this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
          this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.formatters.outputBlockFormatter(response);
        }
      }]);
      return GetUncleMethod;
    }(AbstractCallMethod);

    var GetBlockTransactionCountMethod =
    function (_AbstractCallMethod) {
      _inherits(GetBlockTransactionCountMethod, _AbstractCallMethod);
      function GetBlockTransactionCountMethod(utils, formatters) {
        _classCallCheck(this, GetBlockTransactionCountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockTransactionCountMethod).call(this, 'eth_getBlockTransactionCountByNumber', 1, utils, formatters));
      }
      _createClass(GetBlockTransactionCountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getBlockTransactionCountByHash';
          }
          this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return GetBlockTransactionCountMethod;
    }(AbstractCallMethod);

    var GetBlockUncleCountMethod =
    function (_AbstractCallMethod) {
      _inherits(GetBlockUncleCountMethod, _AbstractCallMethod);
      function GetBlockUncleCountMethod(utils, formatters) {
        _classCallCheck(this, GetBlockUncleCountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetBlockUncleCountMethod).call(this, 'eth_getUncleCountByBlockNumber', 1, utils, formatters));
      }
      _createClass(GetBlockUncleCountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getUncleCountByBlockHash';
          }
          this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return GetBlockUncleCountMethod;
    }(AbstractCallMethod);

    var GetTransactionMethod =
    function (_AbstractCallMethod) {
      _inherits(GetTransactionMethod, _AbstractCallMethod);
      function GetTransactionMethod(utils, formatters) {
        _classCallCheck(this, GetTransactionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionMethod).call(this, 'eth_getTransactionByHash', 1, utils, formatters));
      }
      _createClass(GetTransactionMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.formatters.outputTransactionFormatter(response);
        }
      }]);
      return GetTransactionMethod;
    }(AbstractCallMethod);

    var GetTransactionFromBlockMethod =
    function (_AbstractCallMethod) {
      _inherits(GetTransactionFromBlockMethod, _AbstractCallMethod);
      function GetTransactionFromBlockMethod(utils, formatters) {
        _classCallCheck(this, GetTransactionFromBlockMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetTransactionFromBlockMethod).call(this, 'eth_getTransactionByBlockNumberAndIndex', 2, utils, formatters));
      }
      _createClass(GetTransactionFromBlockMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          if (this.isHash(this.parameters[0])) {
            this.rpcMethod = 'eth_getTransactionByBlockHashAndIndex';
          }
          this.parameters[0] = this.formatters.inputBlockNumberFormatter(this.parameters[0]);
          this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.formatters.outputTransactionFormatter(response);
        }
      }]);
      return GetTransactionFromBlockMethod;
    }(AbstractCallMethod);

    var SignTransactionMethod =
    function (_AbstractCallMethod) {
      _inherits(SignTransactionMethod, _AbstractCallMethod);
      function SignTransactionMethod(utils, formatters) {
        _classCallCheck(this, SignTransactionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(SignTransactionMethod).call(this, 'eth_signTransaction', 1, utils, formatters));
      }
      _createClass(SignTransactionMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
        }
      }]);
      return SignTransactionMethod;
    }(AbstractCallMethod);

    var SendTransactionMethod =
    function (_AbstractSendMethod) {
      _inherits(SendTransactionMethod, _AbstractSendMethod);
      function SendTransactionMethod(utils, formatters, transactionConfirmationWorkflow, sendRawTransactionMethod, chainIdMethod, getTransactionCountMethod) {
        var _this;
        _classCallCheck(this, SendTransactionMethod);
        _this = _possibleConstructorReturn(this, _getPrototypeOf(SendTransactionMethod).call(this, 'eth_sendTransaction', 1, utils, formatters, transactionConfirmationWorkflow));
        _this.sendRawTransactionMethod = sendRawTransactionMethod;
        _this.chainIdMethod = chainIdMethod;
        _this.getTransactionCountMethod = getTransactionCountMethod;
        return _this;
      }
      _createClass(SendTransactionMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
        }
      }, {
        key: "execute",
        value: function execute(moduleInstance, promiEvent) {
          var _this2 = this;
          if (!this.parameters[0].gas && moduleInstance.defaultGas) {
            this.parameters[0]['gas'] = moduleInstance.defaultGas;
          }
          if (!this.parameters[0].gasPrice) {
            if (!moduleInstance.defaultGasPrice) {
              moduleInstance.currentProvider.send('eth_gasPrice', []).then(function (gasPrice) {
                _this2.parameters[0].gasPrice = gasPrice;
                _this2.execute(moduleInstance, promiEvent);
              });
              return promiEvent;
            }
            this.parameters[0]['gasPrice'] = moduleInstance.defaultGasPrice;
          }
          if (this.hasAccounts(moduleInstance) && this.isDefaultSigner(moduleInstance)) {
            if (moduleInstance.accounts.wallet[this.parameters[0].from]) {
              this.sendRawTransaction(moduleInstance.accounts.wallet[this.parameters[0].from].privateKey, promiEvent, moduleInstance).catch(function (error) {
                if (_this2.callback) {
                  _this2.callback(error, null);
                }
                promiEvent.reject(error);
                promiEvent.emit('error', error);
                promiEvent.removeAllListeners();
              });
              return promiEvent;
            }
          }
          if (this.hasCustomSigner(moduleInstance)) {
            this.sendRawTransaction(null, promiEvent, moduleInstance).catch(function (error) {
              if (_this2.callback) {
                _this2.callback(error, null);
              }
              promiEvent.reject(error);
              promiEvent.emit('error', error);
              promiEvent.removeAllListeners();
            });
            return promiEvent;
          }
          _get(_getPrototypeOf(SendTransactionMethod.prototype), "execute", this).call(this, moduleInstance, promiEvent);
          return promiEvent;
        }
      }, {
        key: "sendRawTransaction",
        value: function () {
          var _sendRawTransaction = _asyncToGenerator(
          _regeneratorRuntime.mark(function _callee(privateKey, promiEvent, moduleInstance) {
            var response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (this.parameters[0].chainId) {
                      _context.next = 4;
                      break;
                    }
                    _context.next = 3;
                    return this.chainIdMethod.execute(moduleInstance);
                  case 3:
                    this.parameters[0].chainId = _context.sent;
                  case 4:
                    if (!(!this.parameters[0].nonce && this.parameters[0].nonce !== 0)) {
                      _context.next = 9;
                      break;
                    }
                    this.getTransactionCountMethod.parameters = [this.parameters[0].from];
                    _context.next = 8;
                    return this.getTransactionCountMethod.execute(moduleInstance);
                  case 8:
                    this.parameters[0].nonce = _context.sent;
                  case 9:
                    _context.next = 11;
                    return moduleInstance.transactionSigner.sign(this.parameters[0], privateKey);
                  case 11:
                    response = _context.sent;
                    this.sendRawTransactionMethod.parameters = [response.rawTransaction];
                    this.sendRawTransactionMethod.callback = this.callback;
                    this.sendRawTransactionMethod.execute(moduleInstance, promiEvent);
                  case 15:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));
          function sendRawTransaction(_x, _x2, _x3) {
            return _sendRawTransaction.apply(this, arguments);
          }
          return sendRawTransaction;
        }()
      }, {
        key: "isDefaultSigner",
        value: function isDefaultSigner(moduleInstance) {
          return moduleInstance.transactionSigner.constructor.name === 'TransactionSigner';
        }
      }, {
        key: "hasAccounts",
        value: function hasAccounts(moduleInstance) {
          return moduleInstance.accounts && moduleInstance.accounts.accountsIndex > 0;
        }
      }, {
        key: "hasCustomSigner",
        value: function hasCustomSigner(moduleInstance) {
          return moduleInstance.transactionSigner.constructor.name !== 'TransactionSigner';
        }
      }]);
      return SendTransactionMethod;
    }(AbstractSendMethod);

    var GetCodeMethod =
    function (_AbstractCallMethod) {
      _inherits(GetCodeMethod, _AbstractCallMethod);
      function GetCodeMethod(utils, formatters) {
        _classCallCheck(this, GetCodeMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetCodeMethod).call(this, 'eth_getCode', 2, utils, formatters));
      }
      _createClass(GetCodeMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
          if (isFunction(this.parameters[1])) {
            this.callback = this.parameters[1];
            this.parameters[1] = moduleInstance.defaultBlock;
          }
          this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
        }
      }]);
      return GetCodeMethod;
    }(AbstractCallMethod);

    var SignMethod =
    function (_AbstractCallMethod) {
      _inherits(SignMethod, _AbstractCallMethod);
      function SignMethod(utils, formatters) {
        _classCallCheck(this, SignMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(SignMethod).call(this, 'eth_sign', 2, utils, formatters));
      }
      _createClass(SignMethod, [{
        key: "execute",
        value: function execute(moduleInstance) {
          if (this.hasAccount(moduleInstance)) {
            return this.signLocally(moduleInstance);
          }
          return _get(_getPrototypeOf(SignMethod.prototype), "execute", this).call(this, moduleInstance);
        }
      }, {
        key: "signLocally",
        value: function () {
          var _signLocally = _asyncToGenerator(
          _regeneratorRuntime.mark(function _callee(moduleInstance) {
            var signedMessage;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    this.beforeExecution(moduleInstance);
                    signedMessage = moduleInstance.accounts.sign(this.parameters[0], moduleInstance.accounts.wallet[this.parameters[1]].address);
                    if (this.callback) {
                      this.callback(false, signedMessage);
                    }
                    return _context.abrupt("return", signedMessage);
                  case 7:
                    _context.prev = 7;
                    _context.t0 = _context["catch"](0);
                    if (this.callback) {
                      this.callback(_context.t0, null);
                    }
                    throw _context.t0;
                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this, [[0, 7]]);
          }));
          function signLocally(_x) {
            return _signLocally.apply(this, arguments);
          }
          return signLocally;
        }()
      }, {
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
          this.parameters[1] = this.formatters.inputAddressFormatter(this.parameters[1]);
        }
      }, {
        key: "hasAccount",
        value: function hasAccount(moduleInstance) {
          return moduleInstance.accounts && moduleInstance.accounts.accountsIndex > 0 && moduleInstance.accounts.wallet[this.parameters[1]];
        }
      }]);
      return SignMethod;
    }(AbstractCallMethod);

    var CallMethod =
    function (_AbstractCallMethod) {
      _inherits(CallMethod, _AbstractCallMethod);
      function CallMethod(utils, formatters) {
        _classCallCheck(this, CallMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(CallMethod).call(this, 'eth_call', 2, utils, formatters));
      }
      _createClass(CallMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputCallFormatter(this.parameters[0], moduleInstance);
          if (isFunction(this.parameters[1])) {
            this.callback = this.parameters[1];
            this.parameters[1] = moduleInstance.defaultBlock;
          }
          this.parameters[1] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[1], moduleInstance);
        }
      }]);
      return CallMethod;
    }(AbstractCallMethod);

    var GetStorageAtMethod =
    function (_AbstractCallMethod) {
      _inherits(GetStorageAtMethod, _AbstractCallMethod);
      function GetStorageAtMethod(utils, formatters) {
        _classCallCheck(this, GetStorageAtMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetStorageAtMethod).call(this, 'eth_getStorageAt', 3, utils, formatters));
      }
      _createClass(GetStorageAtMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
          this.parameters[1] = this.utils.numberToHex(this.parameters[1]);
          if (isFunction(this.parameters[2])) {
            this.callback = this.parameters[2];
            this.parameters[2] = moduleInstance.defaultBlock;
          }
          this.parameters[2] = this.formatters.inputDefaultBlockNumberFormatter(this.parameters[2], moduleInstance);
        }
      }]);
      return GetStorageAtMethod;
    }(AbstractCallMethod);

    var EstimateGasMethod =
    function (_AbstractCallMethod) {
      _inherits(EstimateGasMethod, _AbstractCallMethod);
      function EstimateGasMethod(utils, formatters) {
        _classCallCheck(this, EstimateGasMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(EstimateGasMethod).call(this, 'eth_estimateGas', 1, utils, formatters));
      }
      _createClass(EstimateGasMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputCallFormatter(this.parameters[0], moduleInstance);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.hexToNumber(response);
        }
      }]);
      return EstimateGasMethod;
    }(AbstractCallMethod);

    var GetPastLogsMethod =
    function (_AbstractCallMethod) {
      _inherits(GetPastLogsMethod, _AbstractCallMethod);
      function GetPastLogsMethod(utils, formatters) {
        _classCallCheck(this, GetPastLogsMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetPastLogsMethod).call(this, 'eth_getLogs', 1, utils, formatters));
      }
      _createClass(GetPastLogsMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputLogFormatter(this.parameters[0]);
        }
      }, {
        key: "afterExecution",
        value: function afterExecution(response) {
          var _this = this;
          return response.map(function (responseItem) {
            return _this.formatters.outputLogFormatter(responseItem);
          });
        }
      }]);
      return GetPastLogsMethod;
    }(AbstractCallMethod);

    var EcRecoverMethod =
    function (_AbstractCallMethod) {
      _inherits(EcRecoverMethod, _AbstractCallMethod);
      function EcRecoverMethod(utils, formatters) {
        _classCallCheck(this, EcRecoverMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(EcRecoverMethod).call(this, 'personal_ecRecover', 3, utils, formatters));
      }
      _createClass(EcRecoverMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
        }
      }]);
      return EcRecoverMethod;
    }(AbstractCallMethod);

    var ImportRawKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(ImportRawKeyMethod, _AbstractCallMethod);
      function ImportRawKeyMethod(utils, formatters) {
        _classCallCheck(this, ImportRawKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(ImportRawKeyMethod).call(this, 'personal_importRawKey', 2, utils, formatters));
      }
      return ImportRawKeyMethod;
    }(AbstractCallMethod);

    var ListAccountsMethod =
    function (_AbstractCallMethod) {
      _inherits(ListAccountsMethod, _AbstractCallMethod);
      function ListAccountsMethod(utils, formatters) {
        _classCallCheck(this, ListAccountsMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(ListAccountsMethod).call(this, 'personal_listAccounts', 0, utils, formatters));
      }
      _createClass(ListAccountsMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          var _this = this;
          return response.map(function (responseItem) {
            return _this.utils.toChecksumAddress(responseItem);
          });
        }
      }]);
      return ListAccountsMethod;
    }(AbstractCallMethod);

    var LockAccountMethod =
    function (_AbstractCallMethod) {
      _inherits(LockAccountMethod, _AbstractCallMethod);
      function LockAccountMethod(utils, formatters) {
        _classCallCheck(this, LockAccountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(LockAccountMethod).call(this, 'personal_lockAccount', 1, utils, formatters));
      }
      _createClass(LockAccountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
        }
      }]);
      return LockAccountMethod;
    }(AbstractCallMethod);

    var NewAccountMethod =
    function (_AbstractCallMethod) {
      _inherits(NewAccountMethod, _AbstractCallMethod);
      function NewAccountMethod(utils, formatters) {
        _classCallCheck(this, NewAccountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(NewAccountMethod).call(this, 'personal_newAccount', 1, utils, formatters));
      }
      _createClass(NewAccountMethod, [{
        key: "afterExecution",
        value: function afterExecution(response) {
          return this.utils.toChecksumAddress(response);
        }
      }]);
      return NewAccountMethod;
    }(AbstractCallMethod);

    var PersonalSendTransactionMethod =
    function (_AbstractCallMethod) {
      _inherits(PersonalSendTransactionMethod, _AbstractCallMethod);
      function PersonalSendTransactionMethod(utils, formatters) {
        _classCallCheck(this, PersonalSendTransactionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(PersonalSendTransactionMethod).call(this, 'personal_sendTransaction', 2, utils, formatters));
      }
      _createClass(PersonalSendTransactionMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
        }
      }]);
      return PersonalSendTransactionMethod;
    }(AbstractCallMethod);

    var PersonalSignMethod =
    function (_AbstractCallMethod) {
      _inherits(PersonalSignMethod, _AbstractCallMethod);
      function PersonalSignMethod(utils, formatters) {
        _classCallCheck(this, PersonalSignMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(PersonalSignMethod).call(this, 'personal_sign', 3, utils, formatters));
      }
      _createClass(PersonalSignMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputSignFormatter(this.parameters[0]);
          this.parameters[1] = this.formatters.inputAddressFormatter(this.parameters[1]);
        }
      }]);
      return PersonalSignMethod;
    }(AbstractCallMethod);

    var PersonalSignTransactionMethod =
    function (_AbstractCallMethod) {
      _inherits(PersonalSignTransactionMethod, _AbstractCallMethod);
      function PersonalSignTransactionMethod(utils, formatters) {
        _classCallCheck(this, PersonalSignTransactionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(PersonalSignTransactionMethod).call(this, 'personal_signTransaction', 2, utils, formatters));
      }
      _createClass(PersonalSignTransactionMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputTransactionFormatter(this.parameters[0], moduleInstance);
        }
      }]);
      return PersonalSignTransactionMethod;
    }(AbstractCallMethod);

    var UnlockAccountMethod =
    function (_AbstractCallMethod) {
      _inherits(UnlockAccountMethod, _AbstractCallMethod);
      function UnlockAccountMethod(utils, formatters) {
        _classCallCheck(this, UnlockAccountMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(UnlockAccountMethod).call(this, 'personal_unlockAccount', 3, utils, formatters));
      }
      _createClass(UnlockAccountMethod, [{
        key: "beforeExecution",
        value: function beforeExecution(moduleInstance) {
          this.parameters[0] = this.formatters.inputAddressFormatter(this.parameters[0]);
        }
      }]);
      return UnlockAccountMethod;
    }(AbstractCallMethod);

    var AddPrivateKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(AddPrivateKeyMethod, _AbstractCallMethod);
      function AddPrivateKeyMethod(utils, formatters) {
        _classCallCheck(this, AddPrivateKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(AddPrivateKeyMethod).call(this, 'shh_addPrivateKey', 1, utils, formatters));
      }
      return AddPrivateKeyMethod;
    }(AbstractCallMethod);

    var AddSymKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(AddSymKeyMethod, _AbstractCallMethod);
      function AddSymKeyMethod(utils, formatters) {
        _classCallCheck(this, AddSymKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(AddSymKeyMethod).call(this, 'shh_addSymKey', 1, utils, formatters));
      }
      return AddSymKeyMethod;
    }(AbstractCallMethod);

    var DeleteKeyPairMethod =
    function (_AbstractCallMethod) {
      _inherits(DeleteKeyPairMethod, _AbstractCallMethod);
      function DeleteKeyPairMethod(utils, formatters) {
        _classCallCheck(this, DeleteKeyPairMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(DeleteKeyPairMethod).call(this, 'shh_deleteKeyPair', 1, utils, formatters));
      }
      return DeleteKeyPairMethod;
    }(AbstractCallMethod);

    var DeleteMessageFilterMethod =
    function (_AbstractCallMethod) {
      _inherits(DeleteMessageFilterMethod, _AbstractCallMethod);
      function DeleteMessageFilterMethod(utils, formatters) {
        _classCallCheck(this, DeleteMessageFilterMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(DeleteMessageFilterMethod).call(this, 'shh_deleteMessageFilter', 1, utils, formatters));
      }
      return DeleteMessageFilterMethod;
    }(AbstractCallMethod);

    var DeleteSymKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(DeleteSymKeyMethod, _AbstractCallMethod);
      function DeleteSymKeyMethod(utils, formatters) {
        _classCallCheck(this, DeleteSymKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(DeleteSymKeyMethod).call(this, 'shh_deleteSymKey', 1, utils, formatters));
      }
      return DeleteSymKeyMethod;
    }(AbstractCallMethod);

    var GenerateSymKeyFromPasswordMethod =
    function (_AbstractCallMethod) {
      _inherits(GenerateSymKeyFromPasswordMethod, _AbstractCallMethod);
      function GenerateSymKeyFromPasswordMethod(utils, formatters) {
        _classCallCheck(this, GenerateSymKeyFromPasswordMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GenerateSymKeyFromPasswordMethod).call(this, 'shh_generateSymKeyFromPassword', 1, utils, formatters));
      }
      return GenerateSymKeyFromPasswordMethod;
    }(AbstractCallMethod);

    var GetFilterMessagesMethod =
    function (_AbstractCallMethod) {
      _inherits(GetFilterMessagesMethod, _AbstractCallMethod);
      function GetFilterMessagesMethod(utils, formatters) {
        _classCallCheck(this, GetFilterMessagesMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetFilterMessagesMethod).call(this, 'shh_getFilterMessages', 1, utils, formatters));
      }
      return GetFilterMessagesMethod;
    }(AbstractCallMethod);

    var GetInfoMethod =
    function (_AbstractCallMethod) {
      _inherits(GetInfoMethod, _AbstractCallMethod);
      function GetInfoMethod(utils, formatters) {
        _classCallCheck(this, GetInfoMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetInfoMethod).call(this, 'shh_info', 0, utils, formatters));
      }
      return GetInfoMethod;
    }(AbstractCallMethod);

    var GetPrivateKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(GetPrivateKeyMethod, _AbstractCallMethod);
      function GetPrivateKeyMethod(utils, formatters) {
        _classCallCheck(this, GetPrivateKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetPrivateKeyMethod).call(this, 'shh_getPrivateKey', 1, utils, formatters));
      }
      return GetPrivateKeyMethod;
    }(AbstractCallMethod);

    var GetPublicKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(GetPublicKeyMethod, _AbstractCallMethod);
      function GetPublicKeyMethod(utils, formatters) {
        _classCallCheck(this, GetPublicKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetPublicKeyMethod).call(this, 'shh_getPublicKey', 1, utils, formatters));
      }
      return GetPublicKeyMethod;
    }(AbstractCallMethod);

    var GetSymKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(GetSymKeyMethod, _AbstractCallMethod);
      function GetSymKeyMethod(utils, formatters) {
        _classCallCheck(this, GetSymKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(GetSymKeyMethod).call(this, 'shh_getSymKey', 1, utils, formatters));
      }
      return GetSymKeyMethod;
    }(AbstractCallMethod);

    var HasKeyPairMethod =
    function (_AbstractCallMethod) {
      _inherits(HasKeyPairMethod, _AbstractCallMethod);
      function HasKeyPairMethod(utils, formatters) {
        _classCallCheck(this, HasKeyPairMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(HasKeyPairMethod).call(this, 'shh_hasKeyPair', 1, utils, formatters));
      }
      return HasKeyPairMethod;
    }(AbstractCallMethod);

    var HasSymKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(HasSymKeyMethod, _AbstractCallMethod);
      function HasSymKeyMethod(utils, formatters) {
        _classCallCheck(this, HasSymKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(HasSymKeyMethod).call(this, 'shh_hasSymKey', 1, utils, formatters));
      }
      return HasSymKeyMethod;
    }(AbstractCallMethod);

    var MarkTrustedPeerMethod =
    function (_AbstractCallMethod) {
      _inherits(MarkTrustedPeerMethod, _AbstractCallMethod);
      function MarkTrustedPeerMethod(utils, formatters) {
        _classCallCheck(this, MarkTrustedPeerMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(MarkTrustedPeerMethod).call(this, 'shh_markTrustedPeer', 1, utils, formatters));
      }
      return MarkTrustedPeerMethod;
    }(AbstractCallMethod);

    var NewKeyPairMethod =
    function (_AbstractCallMethod) {
      _inherits(NewKeyPairMethod, _AbstractCallMethod);
      function NewKeyPairMethod(utils, formatters) {
        _classCallCheck(this, NewKeyPairMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(NewKeyPairMethod).call(this, 'shh_newKeyPair', 1, utils, formatters));
      }
      return NewKeyPairMethod;
    }(AbstractCallMethod);

    var NewMessageFilterMethod =
    function (_AbstractCallMethod) {
      _inherits(NewMessageFilterMethod, _AbstractCallMethod);
      function NewMessageFilterMethod(utils, formatters) {
        _classCallCheck(this, NewMessageFilterMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(NewMessageFilterMethod).call(this, 'shh_newMessageFilter', 1, utils, formatters));
      }
      return NewMessageFilterMethod;
    }(AbstractCallMethod);

    var NewSymKeyMethod =
    function (_AbstractCallMethod) {
      _inherits(NewSymKeyMethod, _AbstractCallMethod);
      function NewSymKeyMethod(utils, formatters) {
        _classCallCheck(this, NewSymKeyMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(NewSymKeyMethod).call(this, 'shh_newSymKey', 0, utils, formatters));
      }
      return NewSymKeyMethod;
    }(AbstractCallMethod);

    var PostMethod =
    function (_AbstractCallMethod) {
      _inherits(PostMethod, _AbstractCallMethod);
      function PostMethod(utils, formatters) {
        _classCallCheck(this, PostMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(PostMethod).call(this, 'shh_post', 1, utils, formatters));
      }
      return PostMethod;
    }(AbstractCallMethod);

    var SetMaxMessageSizeMethod =
    function (_AbstractCallMethod) {
      _inherits(SetMaxMessageSizeMethod, _AbstractCallMethod);
      function SetMaxMessageSizeMethod(utils, formatters) {
        _classCallCheck(this, SetMaxMessageSizeMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(SetMaxMessageSizeMethod).call(this, 'shh_setMaxMessageSize', 1, utils, formatters));
      }
      return SetMaxMessageSizeMethod;
    }(AbstractCallMethod);

    var SetMinPoWMethod =
    function (_AbstractCallMethod) {
      _inherits(SetMinPoWMethod, _AbstractCallMethod);
      function SetMinPoWMethod(utils, formatters) {
        _classCallCheck(this, SetMinPoWMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(SetMinPoWMethod).call(this, 'shh_setMinPoW', 1, utils, formatters));
      }
      return SetMinPoWMethod;
    }(AbstractCallMethod);

    var ShhVersionMethod =
    function (_AbstractCallMethod) {
      _inherits(ShhVersionMethod, _AbstractCallMethod);
      function ShhVersionMethod(utils, formatters) {
        _classCallCheck(this, ShhVersionMethod);
        return _possibleConstructorReturn(this, _getPrototypeOf(ShhVersionMethod).call(this, 'shh_version', 0, utils, formatters));
      }
      return ShhVersionMethod;
    }(AbstractCallMethod);

    var MethodModuleFactory = function MethodModuleFactory() {
      return new ModuleFactory(new web3CoreSubscriptions.SubscriptionsFactory(), Utils, web3CoreHelpers.formatters);
    };

    exports.MethodModuleFactory = MethodModuleFactory;
    exports.AbstractMethod = AbstractMethod;
    exports.AbstractMethodFactory = AbstractMethodFactory;
    exports.GetProtocolVersionMethod = GetProtocolVersionMethod;
    exports.VersionMethod = VersionMethod;
    exports.ListeningMethod = ListeningMethod;
    exports.PeerCountMethod = PeerCountMethod;
    exports.ChainIdMethod = ChainIdMethod;
    exports.GetNodeInfoMethod = GetNodeInfoMethod;
    exports.GetCoinbaseMethod = GetCoinbaseMethod;
    exports.IsMiningMethod = IsMiningMethod;
    exports.GetHashrateMethod = GetHashrateMethod;
    exports.IsSyncingMethod = IsSyncingMethod;
    exports.GetGasPriceMethod = GetGasPriceMethod;
    exports.SubmitWorkMethod = SubmitWorkMethod;
    exports.GetWorkMethod = GetWorkMethod;
    exports.GetAccountsMethod = GetAccountsMethod;
    exports.GetBalanceMethod = GetBalanceMethod;
    exports.GetTransactionCountMethod = GetTransactionCountMethod;
    exports.RequestAccountsMethod = RequestAccountsMethod;
    exports.GetBlockNumberMethod = GetBlockNumberMethod;
    exports.GetBlockMethod = GetBlockMethod;
    exports.GetUncleMethod = GetUncleMethod;
    exports.GetBlockTransactionCountMethod = GetBlockTransactionCountMethod;
    exports.GetBlockUncleCountMethod = GetBlockUncleCountMethod;
    exports.GetTransactionMethod = GetTransactionMethod;
    exports.GetTransactionFromBlockMethod = GetTransactionFromBlockMethod;
    exports.GetTransactionReceipt = GetTransactionReceiptMethod;
    exports.SendRawTransactionMethod = SendRawTransactionMethod;
    exports.SignTransactionMethod = SignTransactionMethod;
    exports.SendTransactionMethod = SendTransactionMethod;
    exports.GetCodeMethod = GetCodeMethod;
    exports.SignMethod = SignMethod;
    exports.CallMethod = CallMethod;
    exports.GetStorageAtMethod = GetStorageAtMethod;
    exports.EstimateGasMethod = EstimateGasMethod;
    exports.GetPastLogsMethod = GetPastLogsMethod;
    exports.EcRecoverMethod = EcRecoverMethod;
    exports.ImportRawKeyMethod = ImportRawKeyMethod;
    exports.ListAccountsMethod = ListAccountsMethod;
    exports.LockAccountMethod = LockAccountMethod;
    exports.NewAccountMethod = NewAccountMethod;
    exports.PersonalSendTransactionMethod = PersonalSendTransactionMethod;
    exports.PersonalSignMethod = PersonalSignMethod;
    exports.PersonalSignTransactionMethod = PersonalSignTransactionMethod;
    exports.UnlockAccountMethod = UnlockAccountMethod;
    exports.AddPrivateKeyMethod = AddPrivateKeyMethod;
    exports.AddSymKeyMethod = AddSymKeyMethod;
    exports.DeleteKeyPairMethod = DeleteKeyPairMethod;
    exports.DeleteMessageFilterMethod = DeleteMessageFilterMethod;
    exports.DeleteSymKeyMethod = DeleteSymKeyMethod;
    exports.GenerateSymKeyFromPasswordMethod = GenerateSymKeyFromPasswordMethod;
    exports.GetFilterMessagesMethod = GetFilterMessagesMethod;
    exports.GetInfoMethod = GetInfoMethod;
    exports.GetPrivateKeyMethod = GetPrivateKeyMethod;
    exports.GetPublicKeyMethod = GetPublicKeyMethod;
    exports.GetSymKeyMethod = GetSymKeyMethod;
    exports.HasKeyPairMethod = HasKeyPairMethod;
    exports.HasSymKeyMethod = HasSymKeyMethod;
    exports.MarkTrustedPeerMethod = MarkTrustedPeerMethod;
    exports.NewKeyPairMethod = NewKeyPairMethod;
    exports.NewMessageFilterMethod = NewMessageFilterMethod;
    exports.NewSymKeyMethod = NewSymKeyMethod;
    exports.PostMethod = PostMethod;
    exports.SetMaxMessageSizeMethod = SetMaxMessageSizeMethod;
    exports.SetMinPoWMethod = SetMinPoWMethod;
    exports.ShhVersionMethod = ShhVersionMethod;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
