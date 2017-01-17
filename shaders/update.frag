precision mediump float;

uniform sampler2D buffer;
uniform vec2 uResolution;
uniform int uFrame;
varying vec2 uv;

void main() {

	vec2 texel = 1.0 / uResolution.xy;

	float step_x = texel.x;
	float step_y = texel.y;
	vec2 s  = vec2(step_x, 0.0);
	vec2 n  = vec2(-step_x, 0.0);

	vec4 im_n =  texture2D(buffer, uv+n);
	vec4 im =    texture2D(buffer, uv);
	vec4 im_s =  texture2D(buffer, uv+s);

	// use luminance for sorting
	float len_n = dot(im_n, vec4(0.299, 0.587, 0.114, 0.0));
	float len = dot(im, vec4(0.299, 0.587, 0.114, 0.0));
	float len_s = dot(im_s, vec4(0.299, 0.587, 0.114, 0.0));

	if(int(mod(float(uFrame) + gl_FragCoord.x, 2.0)) == 1) {
		if ((len_s > len)) { 
			im = im_s;    
		}
	} else {
		if ((len_n < len)) { 
			im = im_n;    
		}   
	}

	gl_FragColor = (texture2D(buffer, uv) + im * 99.0 ) / 100.0;
}