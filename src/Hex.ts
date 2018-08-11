import { Vector2, MeshBasicMaterial, Group, CircleGeometry, Mesh, Object3D, Color } from "three";
import { EventReceptor } from './Game';
import { game } from "./index";
import { textBlock } from '../styles/main.sass';
import { Field } from "./Field";

export class Hex implements EventReceptor{
	public static readonly radius: number = 0.3;
	public static readonly gapPercent: number = 0.9;
	public static readonly size: number = Math.sqrt(3 * (Hex.radius * Hex.radius) / 4);
	public static readonly circumscribedRadius: number = Math.sqrt(3) / 3 * Hex.radius * Hex.gapPercent;
	material: THREE.MeshBasicMaterial;
	geometry: THREE.CircleGeometry;
	mesh: THREE.Mesh;
	space: number;
	group: THREE.Group;
	fractal: THREE.Group;
	constructor(public coord: Vector2, public solidity: number, private field: Field) {
		this.space = Math.random() * 200 | 0;
		this.material = new MeshBasicMaterial({
			color: this.color,
			opacity: 0.5,
			transparent: true
		});
		this.group = new Group();
		this.group.position.x = Hex.size * ((this.coord.x | 0) * 2 + Math.abs(this.coord.y % 2));
		this.group.position.y = Hex.radius * (this.coord.y | 0) * 1.5;
		this.group.rotateZ(Math.PI / 6);
		this.geometry = new CircleGeometry(Hex.radius * Hex.gapPercent, 6);
		this.mesh = new Mesh(this.geometry, this.material);
		this.group.add(this.mesh);
		this.group.userData.eventReceptor = this;
		this.fractalise();
	}
	public update() {
		this.material.color = this.color;
		this.fractalise();
	}
	private fractalise(): void {
		const level = 0;
		if (this.fractal) {
			this.group.remove(this.fractal);
			this.fractal = null;
		}
		if (!level) {
			return;
		}
		this.fractal = new Group();
		for (let i = 0; i < 6; i++) {
			const fractal = this.createFractal(level - 1);
			fractal.rotateZ(i * Math.PI * 2 / 6);
			this.fractal.add(fractal);
		}
		this.group.add(this.fractal);
	}
	createFractal(level: number, layer = 0): Object3D {
		if (level > 0)
		level = 0;
		const group = new Group();
		let size = Hex.circumscribedRadius * Hex.gapPercent * Math.pow(2, -layer);
		const mesh = new Mesh(new CircleGeometry(size, 3), this.material);
		mesh.position.y += Hex.circumscribedRadius;
		if (!layer) {
			mesh.rotateZ(Math.PI / 6);
		}
		else {
			mesh.rotateZ(Math.PI / 2);
		}
		group.add(mesh);
		if (layer !== level) {
			for (let i = 0; i < 3; i++) {
				const fractal = this.createFractal(level, layer + 1);
				fractal.position.y += Math.pow(2, -layer) * Hex.radius / 2;
				if (!layer)
				fractal.rotateZ(Math.PI * 2 / 6);
				fractal.rotateZ(i * Math.PI * 2 / 3);
				console.log(i * Math.PI / 3);
				group.add(fractal);
			}
		}
		return group;
	}
	public get color(): Color {
		return new Color(this.solidity, this.solidity, this.solidity);
	}

	onMouseEnter(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.material.color = new Color(0x0000ff);
		game.ui.textBlock.text(`Space: ${this.space}; Solidity: ${this.solidity * 100 | 0}%`);
		for(const hex of this.field.adjacents(this, 2)){
			hex.material.color = new Color(0x0000ff);
		}
	}

	onMouseOut(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.material.color = this.color;
		game.ui.textBlock.text();
		for(const hex of this.field.adjacents(this, 2)){
			hex.material.color = this.color;
		}
	}

	public get adjacentCoords() : Array<Vector2>{
		const xMod = Math.abs(this.coord.y % 2) ? 1 : -1;
		return [
			new Vector2(this.coord.x - 1, this.coord.y),
			new Vector2(this.coord.x + 1, this.coord.y),
			new Vector2(this.coord.x + xMod, this.coord.y + 1),
			new Vector2(this.coord.x, this.coord.y + 1),
			new Vector2(this.coord.x + xMod, this.coord.y - 1),
			new Vector2(this.coord.x, this.coord.y - 1)
		];
	}
}