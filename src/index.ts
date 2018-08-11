import * as THREE from 'three';
import $ from 'jquery';
import styles from '../styles/main.sass';
import { Vector2, Vector3 } from 'three';

function indexHash(coord : Vector2): string {
	return `x${coord.x | 0}y${coord.y | 0}`;
}

class Hex {
	public static readonly radius: number = 1;
	public static readonly size: number = Math.sqrt(3 * (Hex.radius * Hex.radius) / 4);
	material: THREE.MeshBasicMaterial;
	geometry: THREE.CircleGeometry;
	mesh: THREE.Mesh;
	constructor(public coord: Vector2){
		this.geometry = new THREE.CircleGeometry( Hex.radius - 0.1, 6 );
		this.material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
		this.mesh = new THREE.Mesh( this.geometry, this.material );
		this.mesh.position.x = Hex.size * ((this.coord.x | 0) * 2 + Math.abs(this.coord.y % 2));
		this.mesh.position.y = Hex.radius * (this.coord.y | 0) * 1.5;
		this.mesh.rotateZ(Math.PI / 6);
	}
}

class Field {
	group: THREE.Group;
	private hexes = {};
	constructor(){
		this.group = new THREE.Group();
	}
	
	private createHex(coord: Vector2): Hex {
		const hex = new Hex(coord);
		this.hexes[indexHash(hex.coord)] = hex;
		this.group.add(hex.mesh);
		return hex;
	}

	public generate(area?: THREE.Box2){
		for(let x = -2; x <= 2; x++){
			for(let y = -2; y <= 2; y++){
				this.createHex(new Vector2(x, y));
			}
		}
	}
}

class Game{
	body: JQuery<HTMLElement>;
	canvas: JQuery<HTMLElement>;
	ui: JQuery<HTMLElement>;
	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;
	cube: THREE.Mesh;
	field: Field;
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

		this.field = new Field();
		this.field.generate();
		this.scene.add( this.field.group );
		
	}

	private animate(){
		requestAnimationFrame(() => this.animate());

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
