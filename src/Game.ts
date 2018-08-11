import { Field } from './Field';
import $ from 'jquery';
import styles from '../styles/main.sass';
import { Vector2, Raycaster, Box2, MeshBasicMaterial, BoxGeometry, WebGLRenderer, Scene, PerspectiveCamera, Mesh, Object3D, Clock } from 'three';
import { flatten } from './index';
import { UI } from './UI';

export interface EventReceptor{
	onMouseEnter(event: JQuery.Event<HTMLCanvasElement, null>);
	onMouseOut(event: JQuery.Event<HTMLCanvasElement, null>);
	// onClick(event: JQuery.Event<HTMLCanvasElement, null>);
}

export class Game {
	body: JQuery<HTMLElement>;
	canvas: JQuery<HTMLElement>;
	camera: THREE.PerspectiveCamera;
	scenexport;
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;
	cube: THREE.Mesh;
	field: Field;
	rendererElement: JQuery<HTMLCanvasElement>;
	raycaster: THREE.Raycaster;
	canvasSize: THREE.Vector2;
	ui: UI;
	hoverItem: EventReceptor | void;
	clock: Clock;
	constructor() { }
	public init() {
		this.body = $(`<div class="${styles.body}"/>`);
		this.canvas = $('<div class="canvas"/>');
		this.body.append(this.canvas);
		this.ui = new UI(this.body);
		$('body').append(this.body);
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(75, 16.0 / 9, 0.1, 1000);
		this.camera.position.z = 5;
		this.renderer = new WebGLRenderer();
		this.canvasSize = new Vector2(this.canvas.width(), this.canvas.width() / 16.0 * 9);
		this.renderer.setSize(this.canvasSize.x, this.canvasSize.y);
		this.canvas.get()[0].appendChild(this.renderer.domElement);
		this.raycaster = new Raycaster();
		this.rendererElement = $(this.renderer.domElement);
		this.rendererElement.mousemove(e => this.onMouseMove(e));
		var geometry = new BoxGeometry(1, 1, 1);
		var material = new MeshBasicMaterial({ color: 0x00ff00 });
		this.cube = new Mesh(geometry, material);
		this.field = new Field();
		this.field.generate(new Box2(new Vector2(-7, -6), new Vector2(7, 6)));
		this.scene.add(this.field.group);
		this.clock = new Clock(true);
	}
	
	onMouseMove(event: JQuery.Event<HTMLCanvasElement, null>): any {
		const mouse = new Vector2(event.offsetX / this.canvasSize.x * 2 - 1, event.offsetY / this.canvasSize.y * -2 + 1);
		this.raycaster.setFromCamera(mouse, this.camera);

		const eventReceptor = this.field.smash(this.raycaster);
		if (this.hoverItem){
			if (this.hoverItem === eventReceptor)
				return;

			this.hoverItem.onMouseOut(event);
		}
		
		this.hoverItem = eventReceptor;

		if (this.hoverItem)
			this.hoverItem.onMouseEnter(event);
	}
	
	private animate() {
		requestAnimationFrame(() => this.animate());
		this.renderer.render(this.scene, this.camera);
	}
	
	public start() {
		this.animate();
		setInterval(() => this.tick(), 1000);
	}

	private tick() {
		this.field.tick(this.clock.getDelta());
	}
}