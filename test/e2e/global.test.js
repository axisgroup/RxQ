const chai = require("chai");
chai.use(require("chai-generator"));
const expect = chai.expect;

var createContainer = require("../util/create-container");
var { publishReplay, refCount, switchMap } = require("rxjs/operators");

var { EngineVersion, OpenDoc } = require("../../dist/global");
var { connectSession } = require("../../dist");
var Handle = require("../../dist/_cjs/handle");

var { port, image } = require("./config.json");

// launch a new container
var container$ = createContainer(image, port);

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

function testGlobal() {
  describe("Global Class", function() {
    before(function(done) {
      this.timeout(10000);
      container$.subscribe(() => done());
    });

    describe("engineVersion", function() {
      const ev$ = eng$.pipe(
        switchMap(handle => handle.ask(EngineVersion)),
        publishReplay(1),
        refCount()
      );

      it("should return an object with prop 'qComponentVersion'", function(done) {
        ev$.subscribe(ev => {
          expect(ev).to.have.property("qComponentVersion");
          done();
        });
      });

      describe("qComponentVersion", function() {
        it("should be a string", function(done) {
          ev$.subscribe(ev => {
            expect(ev.qComponentVersion).to.be.a("string");
            done();
          });
        });
      });
    });

    describe("openDoc", function() {
      const app$ = eng$.pipe(
        switchMap(handle => handle.ask(OpenDoc, "iris.qvf")),
        publishReplay(1),
        refCount()
      );

      it("should return a Handle", function(done) {
        app$.subscribe(appH => {
          expect(appH).to.be.instanceof(Handle);
          done();
        });
      });

      describe("Returned Handle", function() {
        it("should have qClass property of 'Doc'", function(done) {
          app$.subscribe(h => {
            expect(h.qClass).to.equal("Doc");
            done();
          });
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

module.exports = testGlobal;
