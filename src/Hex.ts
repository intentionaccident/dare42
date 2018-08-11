import { Vector2, MeshBasicMaterial, Group, CircleGeometry, Mesh, Object3D, Color } from "three";
import { EventReceptor } from './Game';
import { game } from "./index";
import { textBlock } from '../styles/main.sass';
import { Field } from "./Field";

export enum Building{
	None,
	Spacer,
	Vacuum,
	Singularity
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
	fractalLevel: number;
	constructor(public coord: Vector2, private _solidity: number, private field: Field) {
		this.space = Math.random() * 300 | 0;
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

	private fractalise(): void {
		const level = Math.min(6, this.space / 50 | 0);
		if (this.fractalLevel === level)
			return;
		this.fractalLevel = level;

		if (this.fractal) {
			this.group.remove(this.fractal);
			this.fractal = null;
		}

		this.fractal = new Group();
		for (let i = this.fractalLevel; i > 0; i--) {
			const fractal = this.createFractal();
			fractal.rotateZ((i - 1) * Math.PI * 2 / 6);
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

	public radial(theta: number, distance: number): Hex {
		if (distance === 0)
			return this;
		const direction = theta / distance | 0;
		const rib = this.vector(this.coord, direction, distance).add(this.coord);
		const location = this.vector(rib, (direction + 2) % 6, theta % distance).add(rib);

		return this.field.hex(location.x, location.y);
	}

	createFractal(): Object3D {
		const group = new Group();
		let size = Hex.circumscribedRadius * Hex.gapPercent;
		const mesh = new Mesh(new CircleGeometry(size, 3), this.material);
		mesh.position.y += Hex.circumscribedRadius;
		mesh.rotateZ(Math.PI / 6);
		group.add(mesh);
		return group;
	}

	public get color(): Color {
		if (this.building === Building.Spacer)
			return new Color(0.8, 0.1, 0.8);
		else if (this.building === Building.Vacuum)
			return new Color(0.2, 0.5, 0.2);
		else if (this.building === Building.Singularity)
			return new Color(0.1, 0.1, 0.4);
		return new Color(this.solidity, this.solidity, this.solidity);
	}

	onMouseEnter(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.group.add(Hex.hover);
		this.setText();
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
		if (this.solidity < 0.9)
			return false;
		if (this.building !== Building.None)
			return false;
		if (game.space < Hex.buildingPrice[building])
			return false;
		game.space -= Hex.buildingPrice[building];
		this.field.build(building, this);
		this.building = building;
		return true;
	}

	public vector(vector: Vector2, theta: number, distance: number): Vector2{
		switch (theta % 6){
			case(0):
				return new Vector2(distance, 0);
			case(1):
				return new Vector2((distance + Math.abs(vector.y % 2)) / 2 | 0, distance);
			case(2):
				return new Vector2(-(distance + (1 - Math.abs(vector.y % 2))) / 2 | 0, distance);
			case(3):
				return new Vector2(-distance, 0);
			case(4):
				return new Vector2(-(distance + (1 - Math.abs(vector.y % 2))) / 2 | 0, -distance);
			case(5):
				return new Vector2((distance + Math.abs(vector.y % 2)) / 2 | 0, -distance);
		}
	}

	public adjacents(distance = 1) : Array<Hex>{
		const adjacents: Array<Hex> = [];
		for (let i = 0; i < 6 * distance; i++){
			const hex = this.radial(i, distance);
			if (hex)
				adjacents.push(hex);
		}
		return adjacents;
	}

	public update(){
		this.material.color = this.color;
		this.fractalise();
		this.setText();
	}

	private setText(){
		game.ui.textBlock.text(`Space: ${this.space}; Solidity: ${this.solidity * 100 | 0}%; Building: ${Building[this.building]}`)
	}
}