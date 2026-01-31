const buffer = require('buffer')

if (!buffer.SlowBuffer) {
	buffer.SlowBuffer = buffer.Buffer
}

if (typeof global.SlowBuffer === 'undefined') {
	global.SlowBuffer = buffer.Buffer
}
