"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  RxGraphQLReplicationState: true,
  syncGraphQL: true,
  rxdb: true,
  prototypes: true,
  RxDBReplicationGraphQLPlugin: true
};
exports.syncGraphQL = syncGraphQL;
exports.RxDBReplicationGraphQLPlugin = exports.prototypes = exports.rxdb = exports.RxGraphQLReplicationState = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _graphqlClient = _interopRequireDefault(require("graphql-client"));

var _util = require("../../util");

var _core = require("../../core");

var _helper = require("./helper");

Object.keys(_helper).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _helper[key];
    }
  });
});

var _crawlingCheckpoint = require("./crawling-checkpoint");

Object.keys(_crawlingCheckpoint).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _crawlingCheckpoint[key];
    }
  });
});

var _watchForChanges = require("../watch-for-changes");

var _leaderElection = require("../leader-election");

var _rxChangeEvent = require("../../rx-change-event");

var _overwritable = require("../../overwritable");

/**
 * this plugin adds the RxCollection.syncGraphQl()-function to rxdb
 * you can use it to sync collections with remote graphql endpoint
 */
(0, _core.addRxPlugin)(_leaderElection.RxDBLeaderElectionPlugin);
/**
 * add the watch-for-changes-plugin
 * so pouchdb will emit events when something gets written to it
 */

(0, _core.addRxPlugin)(_watchForChanges.RxDBWatchForChangesPlugin);

var RxGraphQLReplicationState = /*#__PURE__*/function () {
  function RxGraphQLReplicationState(collection, url, headers, pull, push, deletedFlag, lastPulledRevField, live, liveInterval, retryTime, syncRevisions) {
    this._subjects = {
      recieved: new _rxjs.Subject(),
      // all documents that are recieved from the endpoint
      send: new _rxjs.Subject(),
      // all documents that are send to the endpoint
      error: new _rxjs.Subject(),
      // all errors that are revieced from the endpoint, emits new Error() objects
      canceled: new _rxjs.BehaviorSubject(false),
      // true when the replication was canceled
      active: new _rxjs.BehaviorSubject(false),
      // true when something is running, false when not
      initialReplicationComplete: new _rxjs.BehaviorSubject(false) // true the initial replication-cycle is over

    };
    this._runningPromise = Promise.resolve();
    this._subs = [];
    this._runQueueCount = 0;
    this._runCount = 0;
    this.initialReplicationComplete$ = undefined;
    this.recieved$ = undefined;
    this.send$ = undefined;
    this.error$ = undefined;
    this.canceled$ = undefined;
    this.active$ = undefined;
    this.collection = collection;
    this.pull = pull;
    this.push = push;
    this.deletedFlag = deletedFlag;
    this.lastPulledRevField = lastPulledRevField;
    this.live = live;
    this.liveInterval = liveInterval;
    this.retryTime = retryTime;
    this.syncRevisions = syncRevisions;
    this.client = (0, _graphqlClient["default"])({
      url: url,
      headers: headers
    });
    this.endpointHash = (0, _util.hash)(url);

    this._prepare();
  }

  var _proto = RxGraphQLReplicationState.prototype;

  /**
   * things that are more complex to not belong into the constructor
   */
  _proto._prepare = function _prepare() {
    var _this = this;

    // stop sync when collection gets destroyed
    this.collection.onDestroy.then(function () {
      _this.cancel();
    }); // create getters for the observables

    Object.keys(this._subjects).forEach(function (key) {
      Object.defineProperty(_this, key + '$', {
        get: function get() {
          return this._subjects[key].asObservable();
        }
      });
    });
  };

  _proto.isStopped = function isStopped() {
    if (!this.live && this._subjects.initialReplicationComplete['_value']) return true;
    if (this._subjects.canceled['_value']) return true;else return false;
  };

  _proto.awaitInitialReplication = function awaitInitialReplication() {
    return this.initialReplicationComplete$.pipe((0, _operators.filter)(function (v) {
      return v === true;
    }), (0, _operators.first)()).toPromise();
  } // ensures this._run() does not run in parallel
  ;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
      var _this2 = this;

      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!this.isStopped()) {
                _context2.next = 2;
                break;
              }

              return _context2.abrupt("return");

            case 2:
              if (!(this._runQueueCount > 2)) {
                _context2.next = 4;
                break;
              }

              return _context2.abrupt("return", this._runningPromise);

            case 4:
              this._runQueueCount++;
              this._runningPromise = this._runningPromise.then( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                var willRetry;
                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _this2._subjects.active.next(true);

                        _context.next = 3;
                        return _this2._run();

                      case 3:
                        willRetry = _context.sent;

                        _this2._subjects.active.next(false);

                        if (!willRetry && _this2._subjects.initialReplicationComplete['_value'] === false) {
                          _this2._subjects.initialReplicationComplete.next(true);
                        }

                        _this2._runQueueCount--;

                      case 7:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              })));
              return _context2.abrupt("return", this._runningPromise);

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run() {
      return _run2.apply(this, arguments);
    }

    return run;
  }()
  /**
   * returns true if retry must be done
   */
  ;

  _proto._run =
  /*#__PURE__*/
  function () {
    var _run3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
      var _this3 = this;

      var ok, _ok;

      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              this._runCount++;

              if (!this.push) {
                _context3.next = 8;
                break;
              }

              _context3.next = 4;
              return this.runPush();

            case 4:
              ok = _context3.sent;

              if (ok) {
                _context3.next = 8;
                break;
              }

              setTimeout(function () {
                return _this3.run();
              }, this.retryTime);
              /*
                  Because we assume that conflicts are solved on the server side,
                  if push failed, do not attempt to pull before push was successful
                  otherwise we do not know how to merge changes with the local state
              */

              return _context3.abrupt("return", true);

            case 8:
              if (!this.pull) {
                _context3.next = 15;
                break;
              }

              _context3.next = 11;
              return this.runPull();

            case 11:
              _ok = _context3.sent;

              if (_ok) {
                _context3.next = 15;
                break;
              }

              setTimeout(function () {
                return _this3.run();
              }, this.retryTime);
              return _context3.abrupt("return", true);

            case 15:
              return _context3.abrupt("return", false);

            case 16:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function _run() {
      return _run3.apply(this, arguments);
    }

    return _run;
  }()
  /**
   * @return true if sucessfull
   */
  ;

  _proto.runPull =
  /*#__PURE__*/
  function () {
    var _runPull = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
      var _this4 = this;

      var latestDocument, latestDocumentData, pullGraphQL, result, data, modified, docIds, docsWithRevisions, newLatestDocument;
      return _regenerator["default"].wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!this.isStopped()) {
                _context4.next = 2;
                break;
              }

              return _context4.abrupt("return", Promise.resolve(false));

            case 2:
              _context4.next = 4;
              return (0, _crawlingCheckpoint.getLastPullDocument)(this.collection, this.endpointHash);

            case 4:
              latestDocument = _context4.sent;
              latestDocumentData = latestDocument ? latestDocument : null;
              _context4.next = 8;
              return this.pull.queryBuilder(latestDocumentData);

            case 8:
              pullGraphQL = _context4.sent;
              _context4.prev = 9;
              _context4.next = 12;
              return this.client.query(pullGraphQL.query, pullGraphQL.variables);

            case 12:
              result = _context4.sent;

              if (!result.errors) {
                _context4.next = 15;
                break;
              }

              throw new Error(result.errors);

            case 15:
              _context4.next = 21;
              break;

            case 17:
              _context4.prev = 17;
              _context4.t0 = _context4["catch"](9);

              this._subjects.error.next(_context4.t0);

              return _context4.abrupt("return", false);

            case 21:
              // this assumes that there will be always only one property in the response
              // is this correct?
              data = result.data[Object.keys(result.data)[0]];
              modified = data.map(function (doc) {
                return _this4.pull.modifier(doc);
              });
              /**
               * Run schema validation in dev-mode
               */

              if (!_overwritable.overwritable.isDevMode()) {
                _context4.next = 32;
                break;
              }

              _context4.prev = 24;
              modified.forEach(function (doc) {
                var withoutDeleteFlag = Object.assign({}, doc);
                delete withoutDeleteFlag[_this4.deletedFlag];
                delete withoutDeleteFlag._revisions;

                _this4.collection.schema.validate(withoutDeleteFlag);
              });
              _context4.next = 32;
              break;

            case 28:
              _context4.prev = 28;
              _context4.t1 = _context4["catch"](24);

              this._subjects.error.next(_context4.t1);

              return _context4.abrupt("return", false);

            case 32:
              docIds = modified.map(function (doc) {
                return doc[_this4.collection.schema.primaryPath];
              });
              _context4.next = 35;
              return (0, _helper.getDocsWithRevisionsFromPouch)(this.collection, docIds);

            case 35:
              docsWithRevisions = _context4.sent;
              _context4.next = 38;
              return Promise.all(modified.map(function (doc) {
                return _this4.handleDocumentFromRemote(doc, docsWithRevisions);
              }));

            case 38:
              modified.map(function (doc) {
                return _this4._subjects.recieved.next(doc);
              });

              if (!(modified.length === 0)) {
                _context4.next = 43;
                break;
              }

              if (this.live) {// console.log('no more docs, wait for ping');
              } else {// console.log('RxGraphQLReplicationState._run(): no more docs and not live; complete = true');
                }

              _context4.next = 48;
              break;

            case 43:
              newLatestDocument = modified[modified.length - 1];
              _context4.next = 46;
              return (0, _crawlingCheckpoint.setLastPullDocument)(this.collection, this.endpointHash, newLatestDocument);

            case 46:
              _context4.next = 48;
              return this.runPull();

            case 48:
              return _context4.abrupt("return", true);

            case 49:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this, [[9, 17], [24, 28]]);
    }));

    function runPull() {
      return _runPull.apply(this, arguments);
    }

    return runPull;
  }()
  /**
   * @return true if successfull, false if not
   */
  ;

  _proto.runPush =
  /*#__PURE__*/
  function () {
    var _runPush = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
      var _this5 = this;

      var changes, changesWithDocs, lastSuccessfullChange, i, changeWithDoc, pushObj, result;
      return _regenerator["default"].wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return (0, _crawlingCheckpoint.getChangesSinceLastPushSequence)(this.collection, this.endpointHash, this.lastPulledRevField, this.push.batchSize, this.syncRevisions);

            case 2:
              changes = _context5.sent;
              changesWithDocs = changes.results.map(function (change) {
                var doc = change['doc'];
                doc[_this5.deletedFlag] = !!change['deleted'];
                delete doc._deleted;
                delete doc._attachments;
                delete doc[_this5.lastPulledRevField];

                if (!_this5.syncRevisions) {
                  delete doc._rev;
                }

                doc = _this5.push.modifier(doc);
                var seq = change.seq;
                return {
                  doc: doc,
                  seq: seq
                };
              });
              lastSuccessfullChange = null;
              _context5.prev = 5;
              i = 0;

            case 7:
              if (!(i < changesWithDocs.length)) {
                _context5.next = 24;
                break;
              }

              changeWithDoc = changesWithDocs[i];
              _context5.next = 11;
              return this.push.queryBuilder(changeWithDoc.doc);

            case 11:
              pushObj = _context5.sent;
              _context5.next = 14;
              return this.client.query(pushObj.query, pushObj.variables);

            case 14:
              result = _context5.sent;

              if (!result.errors) {
                _context5.next = 19;
                break;
              }

              throw new Error(JSON.stringify(result.errors));

            case 19:
              this._subjects.send.next(changeWithDoc.doc);

              lastSuccessfullChange = changeWithDoc;

            case 21:
              i++;
              _context5.next = 7;
              break;

            case 24:
              _context5.next = 33;
              break;

            case 26:
              _context5.prev = 26;
              _context5.t0 = _context5["catch"](5);

              if (!lastSuccessfullChange) {
                _context5.next = 31;
                break;
              }

              _context5.next = 31;
              return (0, _crawlingCheckpoint.setLastPushSequence)(this.collection, this.endpointHash, lastSuccessfullChange.seq);

            case 31:
              this._subjects.error.next(_context5.t0);

              return _context5.abrupt("return", false);

            case 33:
              _context5.next = 35;
              return (0, _crawlingCheckpoint.setLastPushSequence)(this.collection, this.endpointHash, changes.last_seq);

            case 35:
              if (!(changes.results.length === 0)) {
                _context5.next = 39;
                break;
              }

              if (this.live) {// console.log('no more docs to push, wait for ping');
              } else {// console.log('RxGraphQLReplicationState._runPull(): no more docs to push and not live; complete = true');
                }

              _context5.next = 41;
              break;

            case 39:
              _context5.next = 41;
              return this.runPush();

            case 41:
              return _context5.abrupt("return", true);

            case 42:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this, [[5, 26]]);
    }));

    function runPush() {
      return _runPush.apply(this, arguments);
    }

    return runPush;
  }();

  _proto.handleDocumentFromRemote = /*#__PURE__*/function () {
    var _handleDocumentFromRemote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(doc, docsWithRevisions) {
      var deletedValue, toPouch, primaryValue, pouchState, newRevision, newRevisionHeight, revisionId, startTime, endTime, originalDoc, cE;
      return _regenerator["default"].wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              deletedValue = doc[this.deletedFlag];
              toPouch = this.collection._handleToPouch(doc); // console.log('handleDocumentFromRemote(' + toPouch._id + ') start');

              toPouch._deleted = deletedValue;
              delete toPouch[this.deletedFlag];

              if (!this.syncRevisions) {
                primaryValue = toPouch._id;
                pouchState = docsWithRevisions[primaryValue];
                newRevision = (0, _helper.createRevisionForPulledDocument)(this.endpointHash, toPouch);

                if (pouchState) {
                  newRevisionHeight = pouchState.revisions.start + 1;
                  revisionId = newRevision;
                  newRevision = newRevisionHeight + '-' + newRevision;
                  toPouch._revisions = {
                    start: newRevisionHeight,
                    ids: pouchState.revisions.ids
                  };

                  toPouch._revisions.ids.unshift(revisionId);
                } else {
                  newRevision = '1-' + newRevision;
                }

                toPouch._rev = newRevision;
              } else {
                toPouch[this.lastPulledRevField] = toPouch._rev;
              }

              startTime = (0, _util.now)();
              _context6.next = 8;
              return this.collection.pouch.bulkDocs([toPouch], {
                new_edits: false
              });

            case 8:
              endTime = (0, _util.now)();
              /**
               * because bulkDocs with new_edits: false
               * does not stream changes to the pouchdb,
               * we create the event and emit it,
               * so other instances get informed about it
               */

              originalDoc = (0, _util.flatClone)(toPouch);

              if (deletedValue) {
                originalDoc._deleted = deletedValue;
              } else {
                delete originalDoc._deleted;
              }

              delete originalDoc[this.deletedFlag];
              delete originalDoc._revisions;
              cE = (0, _rxChangeEvent.changeEventfromPouchChange)(originalDoc, this.collection, startTime, endTime);
              this.collection.$emit(cE);

            case 15:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function handleDocumentFromRemote(_x, _x2) {
      return _handleDocumentFromRemote.apply(this, arguments);
    }

    return handleDocumentFromRemote;
  }();

  _proto.cancel = function cancel() {
    if (this.isStopped()) return Promise.resolve(false);

    this._subs.forEach(function (sub) {
      return sub.unsubscribe();
    });

    this._subjects.canceled.next(true);

    return Promise.resolve(true);
  };

  return RxGraphQLReplicationState;
}();

exports.RxGraphQLReplicationState = RxGraphQLReplicationState;

function syncGraphQL(_ref2) {
  var url = _ref2.url,
      _ref2$headers = _ref2.headers,
      headers = _ref2$headers === void 0 ? {} : _ref2$headers,
      _ref2$waitForLeadersh = _ref2.waitForLeadership,
      waitForLeadership = _ref2$waitForLeadersh === void 0 ? true : _ref2$waitForLeadersh,
      pull = _ref2.pull,
      push = _ref2.push,
      deletedFlag = _ref2.deletedFlag,
      _ref2$lastPulledRevFi = _ref2.lastPulledRevField,
      lastPulledRevField = _ref2$lastPulledRevFi === void 0 ? 'last_pulled_rev' : _ref2$lastPulledRevFi,
      _ref2$live = _ref2.live,
      live = _ref2$live === void 0 ? false : _ref2$live,
      _ref2$liveInterval = _ref2.liveInterval,
      liveInterval = _ref2$liveInterval === void 0 ? 1000 * 10 : _ref2$liveInterval,
      _ref2$retryTime = _ref2.retryTime,
      retryTime = _ref2$retryTime === void 0 ? 1000 * 5 : _ref2$retryTime,
      _ref2$autoStart = _ref2.autoStart,
      autoStart = _ref2$autoStart === void 0 ? true : _ref2$autoStart,
      _ref2$syncRevisions = _ref2.syncRevisions,
      syncRevisions = _ref2$syncRevisions === void 0 ? false : _ref2$syncRevisions;
  var collection = this; // fill in defaults for pull & push

  if (pull) {
    if (!pull.modifier) pull.modifier = _helper.DEFAULT_MODIFIER;
  }

  if (push) {
    if (!push.modifier) push.modifier = _helper.DEFAULT_MODIFIER;
  } // ensure the collection is listening to plain-pouchdb writes


  collection.watchForChanges();
  var replicationState = new RxGraphQLReplicationState(collection, url, headers, pull, push, deletedFlag, lastPulledRevField, live, liveInterval, retryTime, syncRevisions);
  if (!autoStart) return replicationState; // run internal so .sync() does not have to be async

  var waitTillRun = waitForLeadership ? this.database.waitForLeadership() : (0, _util.promiseWait)(0);
  waitTillRun.then(function () {
    // trigger run once
    replicationState.run(); // start sync-interval

    if (replicationState.live) {
      if (pull) {
        (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
          return _regenerator["default"].wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  if (replicationState.isStopped()) {
                    _context7.next = 9;
                    break;
                  }

                  _context7.next = 3;
                  return (0, _util.promiseWait)(replicationState.liveInterval);

                case 3:
                  if (!replicationState.isStopped()) {
                    _context7.next = 5;
                    break;
                  }

                  return _context7.abrupt("return");

                case 5:
                  _context7.next = 7;
                  return replicationState.run();

                case 7:
                  _context7.next = 0;
                  break;

                case 9:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7);
        }))();
      }

      if (push) {
        /**
         * we have to use the rxdb changestream
         * because the pouchdb.changes stream sometimes
         * does not emit events or stucks
         */
        var changeEventsSub = collection.$.subscribe(function (changeEvent) {
          if (replicationState.isStopped()) return;
          var rev = changeEvent.documentData._rev;

          if (rev && !(0, _helper.wasRevisionfromPullReplication)(replicationState.endpointHash, rev)) {
            replicationState.run();
          }
        });

        replicationState._subs.push(changeEventsSub);
      }
    }
  });
  return replicationState;
}

var rxdb = true;
exports.rxdb = rxdb;
var prototypes = {
  RxCollection: function RxCollection(proto) {
    proto.syncGraphQL = syncGraphQL;
  }
};
exports.prototypes = prototypes;
var RxDBReplicationGraphQLPlugin = {
  rxdb: rxdb,
  prototypes: prototypes
};
exports.RxDBReplicationGraphQLPlugin = RxDBReplicationGraphQLPlugin;

//# sourceMappingURL=index.js.map