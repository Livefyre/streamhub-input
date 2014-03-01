define(['stream/transform', 'inherits'], function (Transform, inherits) {

	function PassThrough (opts) {
		Transform.call(this, opts);
	}

	inherits(PassThrough, Transform);


	PassThrough.prototype._transform = function (chunk, done) {
		done(null, chunk);
	};


	return PassThrough;
});