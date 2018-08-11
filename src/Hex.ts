import { Vector2, MeshBasicMaterial, Group, CircleGeometry, Mesh, Object3D, Color } from "three";
import { EventReceptor } from './Game';
import { game } from "./index";
import { textBlock } from '../styles/main.sass';
import { Field } from "./Field";

export enum Building{
	None,
	Spacer,
	Vacuum
}

export class Hex implements EventReceptor{
	public static readonly radius: number = 0.3;
	public static readonly gapPercent: number = 0.9;
	public static readonly size: number = Math.sqrt(3 * (Hex.radius * Hex.radius) / 4);
	public static readonly circumscribedRadius: number = Math.sqrt(3) / 3 * Hex.radius * Hex.gapPercent;
	private static readonly buildingPrice = [0, 20, 20];

	public static readonly hover: Mesh = new Mesh(
		new CircleGeometry(Hex.radius * Hex.gapPercent, 6),
		new MeshBasicMaterial({
			color: 0x4444ff,
			opacity: 0.7,
			transparent: true
		})
	);

	material: THREE.MeshBasicMaterial;
	geometry: THREE.CircleGeometry;
	mesh: THREE.Mesh;
	space: number;
	group: THREE.Group;
	fractal: THREE.Group;
	public building: Building = Building.None;
	constructor(public coord: Vector2, private _solidity: number, private field: Field) {
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

	public set solidity(value: number){
		if (value < 0)
			value = 0;
		if (value > 1)
			value = 1;
		this._solidity = value;
		this.material.color = this.color;
	}

	public get solidity(): number{
		return this._solidity;
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
		if (this.building === Building.Spacer)
			return new Color(0.8, 0.1, 0.8);
		else if (this.building === Building.Vacuum)
			return new Color(0.2, 0.5, 0.2);
		return new Color(this.solidity, this.solidity, this.solidity);
	}

	onMouseEnter(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.group.add(Hex.hover);
		game.ui.textBlock.text(`Space: ${this.space}; Solidity: ${this.solidity * 100 | 0}%; Building: ${Building[this.building]}`)
	}

	onMouseOut(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.group.remove(Hex.hover);
	}

	onClick(event: JQuery.Event<HTMLCanvasElement, null>){
		if(event.ctrlKey){
			this.tryBuild(Building.Spacer);
		}else{
			this.tryBuild(Building.Vacuum);
		}
	}

	private tryBuild(building: Building): boolean {
		if (this.building !== Building.None)
			return false;
		if (game.space < Hex.buildingPrice[building])
			return false;
		game.space -= Hex.buildingPrice[building];
		this.building = building;
		return true;
	}

	public get adjacents() : Array<Hex>{
		const xMod = Math.abs(this.coord.y % 2) ? 1 : -1;
		return [
			new Vector2(this.coord.x - 1, this.coord.y),
			new Vector2(this.coord.x + 1, this.coord.y),
			new Vector2(this.coord.x + xMod, this.coord.y + 1),
			new Vector2(this.coord.x, this.coord.y + 1),
			new Vector2(this.coord.x + xMod, this.coord.y - 1),
			new Vector2(this.coord.x, this.coord.y - 1)
		].map(v => this.field.hexes[Field.indexHash(v)]).filter(h => h);
	}
}