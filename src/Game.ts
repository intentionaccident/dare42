import { Field } from './Field';
import $ from 'jquery';
import styles from '../styles/main.sass';
import { Vector2, Raycaster, Box2, MeshBasicMaterial, BoxGeometry, WebGLRenderer, Scene, PerspectiveCamera, Mesh, Object3D, Clock } from 'three';
import { flatten } from './index';
import { UI } from './UI';
import { canvas } from '../styles/main.sass';

export interface EventReceptor{
	onMouseEnter(event: JQuery.Event<HTMLCanvasElement, null>);
	onMouseOut(event: JQuery.Event<HTMLCanvasElement, null>);
	onClick(event: JQuery.Event<HTMLCanvasElement, null>);
	update();
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
	space: number = 1000;
	constructor() { }
	public init() {
		this.body = $(`<div class="${styles.body}"/>`);
		$('body').on('contextmenu', 'canvas', function(e){ return false; });
		this.canvas = $(`<div class="${styles.canvas}"/>`);
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
		this.rendererElement.click(e => this.onClick(e));
		var geometry = new BoxGeometry(1, 1, 1);
		var material = new MeshBasicMaterial({ color: 0x00ff00 });
		this.cube = new Mesh(geometry, material);
		this.field = new Field();
		this.field.generate(new Box2(new Vector2(-7, -6), new Vector2(7, 6)));
		this.scene.add(this.field.group);
		this.clock = new Clock(true);

		this.ui.spaceField.text(this.space);
	}

	private mouse(event: JQuery.Event<HTMLCanvasElement, null>): Vector2 {
		return new Vector2(event.offsetX / this.canvasSize.x * 2 - 1, event.offsetY / this.canvasSize.y * -2 + 1);
	}
	
	onMouseMove(event: JQuery.Event<HTMLCanvasElement, null>): any {
		this.raycaster.setFromCamera(this.mouse(event), this.camera);

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

	
	onClick(event: JQuery.Event<HTMLCanvasElement, null>): any {
		this.raycaster.setFromCamera(this.mouse(event), this.camera);

		const eventReceptor = this.field.smash(this.raycaster);
		if(eventReceptor)
			eventReceptor.onClick(event);
	}
	
	private animate() {
		requestAnimationFrame(() => this.animate());
		this.update(this.clock.getDelta());
		this.renderer.render(this.scene, this.camera);
	}

	update(delta: number): any {
		this.field.update(delta);
		this.ui.spaceField.text(this.space | 0);
		if (this.hoverItem)
			this.hoverItem.update();
	}

	public start() {
		this.animate();
	}
	
	public buy(cost: number): boolean{
		if (this.space < cost)
			return false;
		this.space -= cost;
		return true;
	}
}