precision mediump float;

uniform sampler2D buffer;
uniform vec2 uResolution;

varying vec2 uv;

void main() {
	gl_FragColor = texture2D(buffer, uv);
}