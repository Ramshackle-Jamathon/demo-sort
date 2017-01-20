import vertexUpdateShader from "./shaders/update.vert";
import fragmentUpdateShader from "./shaders/update.frag";
import vertexDrawShader from "./shaders/draw.vert";
import fragmentDrawShader from "./shaders/draw.frag";
import createShader from "gl-shader";
import Stats from "stats.js";
import Webcam from "keep-rollin";
import createFBO from "gl-fbo";
import fillScreen from "a-big-triangle";

const demo = {
	stats: new Stats(),
	defaultQuality: 1,
	quality: 1,
	updateShader: undefined,
	drawShader: undefined,
	buffer: undefined,
	lastTimeStamp: 0,
	startTime: undefined,
	ellapsedTime: undefined,
	gl: undefined,
	state: undefined,
	current: 0,
	updateFrame: 0.0,
	webcam: new Webcam(),
	canvas: document.body.appendChild(document.createElement("canvas")),
	ui: document.body.appendChild(document.createElement("input")),
	createContext: function(){
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		this.canvas.style.position = "absolute";
		this.gl = (
			this.canvas.getContext("webgl") ||
			this.canvas.getContext("webgl-experimental") ||
			this.canvas.getContext("experimental-webgl")
		);
		if (!this.gl) {
			throw new Error("Unable to initialize gl");
		}
	},
	render: function(dt = 0){

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		this.drawShader.bind();

		this.drawShader.uniforms.uResolution = [this.canvas.width, this.canvas.height];
		this.drawShader.uniforms.buffer = this.state[this.current].color[0].bind()

		fillScreen(this.gl);
	},
	loop: function(timeStamp){
		this.stats.begin();
		if (!this.startTime) {
			this.startTime = timeStamp;
		}
		this.ellapsedTime = timeStamp - this.startTime;
		const dt = timeStamp - this.lastTimeStamp;
		this.lastTimeStamp = timeStamp;

		if (this.ellapsedTime < 5000 && dt > 45.0){
			this.quality = this.quality - 0.01;
			this.resizeCanvas();
		}
		this.render(dt);
		this.stats.end();
		window.requestAnimationFrame(this.loop.bind(this));
	},
	tick: function() {
		const prevState = this.state[this.current];
		const curState = this.state[this.current ^= 1];
		this.updateFrame += 1.0;

		curState.bind();

		this.updateShader.bind();

		this.updateShader.uniforms.uResolution = [this.webcam.video.videoWidth, this.webcam.video.videoHeight];
		this.updateShader.uniforms.buffer = prevState.color[0].bind();
		this.updateShader.uniforms.uFrame = this.updateFrame;

		fillScreen(this.gl);
	},
	resizeCanvas: function(){
		this.gl.canvas.width = window.innerWidth * this.quality;
		this.gl.canvas.height = window.innerHeight * this.quality;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	},
	resize: function(){
		const canvas = this.gl.canvas;
		this.quality = this.defaultQuality;
		const displayWidth  = window.innerWidth * this.quality;
		const displayHeight = window.innerHeight * this.quality;

		if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
			this.startTime = 0;
			this.resizeCanvas();
		}
	},
	keydown: function(event){
		if ( event.altKey ) {
				return;
		}
		event.preventDefault();
		if( event.shiftKey ){
			switch ( event.keyCode ) {
				case 187: /* + */ this.quality += 0.05; this.resizeCanvas(); break;
				case 189: /* - */ this.quality -= 0.05; this.resizeCanvas(); break;
			}
		}
	},
	init: function(){
		this.createContext();
		this.resizeCanvas();
		this.webcam.requestUserMedia();
		this.ui.setAttribute("type", "range");
		this.ui.setAttribute("min", "0");
		this.ui.setAttribute("max", "1000");
		this.ui.style.position = "absolute";
		this.ui.style.right = "0";
		this.ui.style.width = "200px";
		this.ui.value = 200.0;
		this.ui.step = 10.0;
		
		document.body.appendChild( this.stats.dom );

		this.gl.disable(this.gl.DEPTH_TEST)

		//Create shaders
		this.drawShader = createShader(
			this.gl,
			vertexDrawShader,
			fragmentDrawShader
		);
		this.updateShader = createShader(
			this.gl,
			vertexUpdateShader,
			fragmentUpdateShader
		);

		this.drawShader.attributes.position.location = this.updateShader.attributes.position.location = 0;

		const bufferReset = () => {
			if(this.webcam.video.readyState === this.webcam.video.HAVE_ENOUGH_DATA) {
				if(!this.webcamStarted){
					this.state = [ 
						createFBO(this.gl, [this.webcam.video.videoWidth, this.webcam.video.videoHeight]),
						createFBO(this.gl, [this.webcam.video.videoWidth, this.webcam.video.videoHeight]) 
					];
				}
				this.state[this.current].color[0].setPixels(this.webcam.video);
				for (let i = 0, len = this.ui.value; i < len; i++) {
					this.tick();
				}
				this.render();
				if(!this.webcamStarted){
					window.addEventListener("resize", this.resize.bind(this)); 
					window.addEventListener("keydown", this.keydown.bind(this));
				}
				clearInterval(bufferInit);
				bufferInit = setTimeout(bufferReset, 40);
				this.webcamStarted = true;
			}
		}
		let bufferInit = setInterval(bufferReset, 0);

	}
}
demo.init();
