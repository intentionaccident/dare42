import * as THREE from 'three';
import $ from 'jquery';
import styles from '../styles/main.sass';

class Game{
	body: JQuery<HTMLElement>;
	canvas: JQuery<HTMLElement>;
	ui: JQuery<HTMLElement>;
	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;
	cube: THREE.Mesh;
	constructor(){}

	public init(){
		this.body = $(`<div class="${styles.body}"/>`);
		this.canvas = $('<div class="canvas"/>');
		this.ui = $('<div class="ui"/>');
		this.body.append(this.canvas, this.ui);
		$('body').append(this.body);

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, 16.0/9, 0.1, 1000 );
		this.camera.position.z = 5;
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( this.canvas.width(), this.canvas.width() / 16.0 * 9 );
		this.canvas.get()[0].appendChild(this.renderer.domElement);

		
		var geometry = new THREE.BoxGeometry( 1, 1, 1 );
		var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		this.cube = new THREE.Mesh( geometry, material );
		this.scene.add( this.cube );
	}

	private animate(){
		requestAnimationFrame(() => this.animate());
		
		this.cube.rotation.x += 0.01;
		this.cube.rotation.y += 0.01;
		this.renderer.render(this.scene, this.camera );
	}

	public start(){
		this.animate();
	}
}

$(() => {
	const game = new Game();
	game.init();
	game.start();
});

