const chai = require("chai");
chai.use(require("chai-generator"));
const expect = chai.expect;

var createContainer = require("../util/create-container");
var {
  publishReplay,
  refCount,
  switchMap,
  map,
  take
} = require("rxjs/operators");
var { connectSession } = require("../../dist");
var Handle = require("../../dist/_cjs/handle");

var { port, image } = require("./config.json");

// launch a new container
var container$ = createContainer(image, port);

var session$ = container$.pipe(
  map(() => {
    return connectSession({
      host: "localhost",
      port: port,
      isSecure: false
    });
  }),
  publishReplay(1),
  refCount()
);

const eng$ = session$.pipe(switchMap(session => session.global$));
const notifications$ = session$.pipe(
  switchMap(session => session.notifications$)
);

function testConnect() {
  describe("Connect to an engine", function() {
    before(function(done) {
      this.timeout(10000);
      container$.subscribe(() => done());
    });

    it("should return a Handle", function(done) {
      var eng$ = container$.pipe(
        switchMap(() => {
          return connectSession({
            host: "localhost",
            port: port,
            isSecure: false
          }).global$;
        }),
        publishReplay(1),
        refCount()
      );

      eng$.subscribe(h => {
        expect(h).to.be.instanceof(Handle);
        done();
      });
    });

    it("should return a Handle when given a URL to connect with", function(done) {
      container$
        .pipe(
          map(() => {
            return connectSession({
              url: `ws://localhost:${port}/app`
            });
          }),
          switchMap(session => session.global$),
          take(1)
        )
        .subscribe(h => {
          expect(h).to.be.instanceof(Handle);
          done();
        });
    });

    describe("Returned Handle", function() {
      it("should have qClass property of 'Global'", function(done) {
        eng$.subscribe(h => {
          expect(h.qClass).to.equal("Global");
          done();
        });
      });
    });

    after(function(done) {
      container$.subscribe(container =>
        container.kill((err, result) => {
          container.remove();
          done();
        })
      );
    });
  });
}

module.exports = testConnect;
