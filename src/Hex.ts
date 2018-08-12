import { Vector2, MeshBasicMaterial, Group, CircleGeometry, Mesh, Object3D, Color } from "three";
import { EventReceptor } from './Game';
import { game, tryRemove } from './index';
import { Field, Triangle } from './Field';

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
	private static readonly buildingPrice = [0, 1, 1, 0];

	public static readonly hover: Mesh = new Mesh(
		new CircleGeometry(Hex.radius * Hex.gapPercent, 6),
		new MeshBasicMaterial({
			color: 0x4444ff,
			opacity: 0.7,
			transparent: true
		})
	);

	triangles: Array<Triangle> = [];
	material: THREE.MeshBasicMaterial;
	geometry: THREE.CircleGeometry;
	mesh: THREE.Mesh;
	space: number;
	group: THREE.Group;
	fractal: THREE.Group;
	boost: number = 0;
	private _reinforced: boolean;

	public get vulnerable(): boolean{
		return this.building !== Building.Singularity && !this.reinforced && this.solidity >= 1;
	}

	public get reinforced(): boolean {
		return this._reinforced;
	}

	public set reinforced(value: boolean) {
		this._reinforced = value;
		if (this._reinforced && this.building === Building.Singularity)
			this.building = Building.None;
	}

	private _building: Building = Building.None;
	public get building(): Building {
		return this._building;
	}

	public get indexHash(): string {
		return Field.indexHash(this.coord);
	}

	public set building(value: Building) {
		if (this._building === value)
			return;

		if (this._building === Building.Singularity){
			game.space++;
		}

		if (this._building === Building.Spacer){
			this.field.destroySuperHexes(this);
			for(const triangle of this.triangles){
				for(const vertex of triangle.hexes){
					if (vertex !== this){
						vertex.removeTriangle(triangle);
					}
				}
			}
			this.triangles = [];
			this.boost = 0;
		}
		
		this._building = value;
		
		if (this._building === Building.Spacer){
			this.field.createSuperHexes(this);
			this.addTriangles(this.field.getTriangles(this));
		}
	}

	removeTriangle(triangle: Triangle){
		if(!tryRemove(this.triangles, triangle))
			return;
		if (this.getBoost(triangle) < this.boost)
			return;
		if (!this.triangles.length)
			this.boost = 0;
		else
			this.boost = this.triangles.map(t => this.getBoost(t)).sort((a, b) => a - b)[0];
	}

	fractalLevel: number;
	constructor(public coord: Vector2, private _solidity: number, private field: Field) {
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

		if(Math.random() > 0.95)
			this.building = Building.Singularity;
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

	private internalColor(): Color{
		if (this.building === Building.Spacer)
			return new Color(0.8, 0.1, 0.2 + this.boost * 0.3);
		else if (this.building === Building.Vacuum)
			return new Color(0.2, 0.5, 0.2);
		else if (this.building === Building.Singularity)
			return new Color(0.1, 0.1, 0.4);
		return new Color(this.solidity, this.solidity, this.solidity);
	}

	public get color(): Color {
		const color = this.internalColor();
		if (!this.reinforced)
			color.multiplyScalar(0.5);
		return color;
	}

	onMouseEnter(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.group.add(Hex.hover);
		this.setText();
		this.field.showLinks(this);
	}

	onMouseOut(event: JQuery.Event<HTMLCanvasElement, null>) {
		this.group.remove(Hex.hover);
		this.field.hideLinks();
	}

	onClick(event: JQuery.Event<HTMLCanvasElement, null>){
		if(event.ctrlKey){
			this.tryBuild(Building.Vacuum);
		}else{
			this.tryBuild(Building.Spacer);
		}
	}

	addTriangles(triangles: Array<Triangle>){
		for (const triangle of triangles){
			this.addTriangle(triangle);
			for (const vertex of triangle.hexes){
				if (vertex !== this)
					vertex.addTriangle(triangle);
			}
		}
	}

	addTriangle(triangle: Triangle) {
		this.triangles.push(triangle);
		this.boost = Math.max(this.boost, this.getBoost(triangle));
	}

	getBoost(triangle: Triangle) : number{
		return triangle.size / 2 / (Hex.size * 2)  | 0;
	}

	private tryBuild(building: Building): boolean {
		if (this.solidity < 0.9)
			return false;
		if (game.space < Hex.buildingPrice[building])
			return false;
		if (building === Building.Spacer && this.building === Building.Singularity){
			console.log('test');
			if (!this.field.getSuperHexes(this).length)
				return;
		} else if (this.building !== Building.None)
			return false;
		game.space -= Hex.buildingPrice[building];
		this.field.build(building, this);
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
		this.setText();
	}

	private setText(){
		game.ui.textBlock.text(`Space: ${this.space}; Solidity: ${this.solidity * 100 | 0}%; Building: ${Building[this.building]}`)
	}
}