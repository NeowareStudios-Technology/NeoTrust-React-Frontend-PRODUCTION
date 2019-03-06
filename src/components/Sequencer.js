function Sequencer() {
  this.promises = new Array();
  this.promiseIndex = -1;
  this.onStop = null;
  this.onStopCalled = false;

  this.next = function() {
    this.promiseIndex++;
    if (typeof this.promises[this.promiseIndex] !== "undefined") {
      this.promises[this.promiseIndex]();
    } else {
      this.stop();
    }
  };

  this.promise = function(promise) {
    this.promises.push(promise);
  };

  this.stop = function() {
    this.promiseIndex = -1;

    if (this.onStop && !this.onStopCalled) {
      this.onStopCalled = true;
      this.onStop();
    }
  };
}

export default Sequencer;
