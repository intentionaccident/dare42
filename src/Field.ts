import { Hex, Building } from './Hex';
import { Vector2, Group, Raycaster, Vector3, Quaternion, Line, Geometry, LineBasicMaterial } from 'three';
import { flatten, game, tryRemove, random, groupBy, crossMap } from './index';

export interface HexMap{
	[hash: string]: Hex;
}

interface SuperHex{
	center: Hex;
	radius: Vector3;
}

export interface Triangle{
	hexes: Array<Hex>;
	size: number;
}

export interface Buildings{
	[key: string]: number;
}

interface HexGroupMap{
	[key: string]: Array<Hex>;
}

interface SuperHexMap{
	[key: string]: SuperHex;
}


export class Field {
	private danger: number = 0;
	disaster(untouchable: Hex){
		this.disasterCount--;
		if (this.disasterCount > 0)
			return;

		for (let events = this.danger; events > 0; events--){
			const singularity = random(this.hexArray.filter(h => h.building === Building.Singularity))
			if (!singularity)
				break;
			const target = random(singularity.adjacents().filter(a => a.vulnerable && a !== untouchable));
			if (!target)
				continue;
			target.building = Building.Singularity;
		}
		
		const hex = random(this.hexArray.filter(h => h.vulnerable && h !== untouchable));
		if (hex) {
			hex.building = Building.Singularity;
		}

		this.danger++;

		this.disasterCount = 2;
	}

	disasterCount: number = 3;
	smash(raycaster: Raycaster): Hex | void{
		const intersect = raycaster.intersectObjects(flatten(this.hexArray.map(h => h.mesh)))[0];
		if (!intersect)
			return;

		return intersect.object.parent.userData.eventReceptor as Hex;
	}

	group: Group;
	links: Group;
	public hexes: HexMap = {};
	constructor() {
		this.group = new Group();
		this.links = new Group();
		this.group.add(this.links);
	}

	public static indexHash(coord : Vector2): string {
		return `x${coord.x | 0}y${coord.y | 0}`;
	}

	public get hexArray(): Array<Hex> {
		return Object.keys(this.hexes).map(key => this.hexes[key]);
	}

	private createHex(coord: Vector2): Hex {
		const hex = new Hex(coord, Math.random() * 0.2 + 0.8 / (Math.pow(((Math.abs(coord.x) + Math.abs(coord.y))) / 6, 2) + 1), this);
		if (hex.indexHash in this.hexes)
			return;
		this.hexes[hex.indexHash] = hex;
		this.group.add(hex.group);

		if (coord.x === 0 && coord.y === 0)
			this.build(Building.Spacer, this.hex(0, 0));
		return hex;
	}

	public hex(x: number, y: number){
		return this.hexes[Field.indexHash(new Vector2(x | 0, y | 0))];
	}

	public generate(area: THREE.Box2) {
		for (let x = area.min.x / (Hex.size * 2) | 0; x <= (area.max.x / (Hex.size * 2) + 1 | 0); x++) {
			for (let y = area.min.y / (Hex.size * 2) | 0; y <= (area.max.y / (Hex.size * 2) + 1 | 0); y++) {
				this.createHex(new Vector2(x, y));
			}
		}
	}

	public adjacents(hex: Hex, distance = 1): Array<Hex>{
		let adjacents: Array<Hex> = [];
		while(distance > 0){
			adjacents = adjacents.concat(hex.adjacents(distance));
			distance--;
		}
		return adjacents;
	}

	public update (delta: number) {
		const buildings: Array<Hex> = [];
		for(const hex of this.hexArray){
			if (hex.building !== Building.None)
				buildings.push(hex);

			hex.solidity -= 0.2 * delta;
		}

		for(const building of buildings){
			switch(building.building){
				case Building.Spacer: {
					for (const hex of this.adjacents(building, 2 + building.boost)){
						hex.solidity += 1 * delta;
					}
					break;
				}case Building.Vacuum: {
					const cost = Math.min(600 * delta, building.space);
					game.space += cost;
					building.space -= cost;
					break;
				}
			}
			building.update();
		}
	}

	getTriangles(hex: Hex): Array<Triangle>{
		const groups = groupBy(
			this.hexArray
				.filter(h => h.building === Building.Spacer && h !== hex)
				.map(s => [s.group.position.clone().sub(hex.group.position), s] as [Vector3, Hex]),
			h => h[0].length().toFixed(2).toString()
		);

		let triangles: Array<Triangle> = [];

		for (const group in groups){
			triangles = triangles.concat(crossMap(groups[group])
				.filter(p => Math.abs(Math.PI / 3 - p[0][0].angleTo(p[1][0])) < 0.01)
				.map(p => { return {
					size: p[0][0].length() / (Hex.size * 2),
					hexes: [hex, p[0][1], p[1][1]]
				}})
			);
		}
		return triangles;
	}

	private superHexes: SuperHexMap = {};

	destroySuperHexes(hex: Hex){
		const brokenHexes: Array<string> = [];
		for(const superHex in this.superHexes){
			const direction = this.superHexes[superHex].center.group.position.clone().sub(hex.group.position);
			if (Math.abs(direction.length() - this.superHexes[superHex].radius.length()) >= 0.01)
				continue;
			if (direction.angleTo(this.superHexes[superHex].radius) % (Math.PI / 3) >= 0.01)
				continue;
			brokenHexes.push(superHex);
		}

		for(const hex of brokenHexes){
			this.superHexes[hex] = null;
		}
	}

	getSuperHexes(hex: Hex): Array<SuperHex>{
		const groups = groupBy(
			this.hexArray
				.filter(h => h.building === Building.Spacer && h !== hex)
				.map(s => [s.group.position.clone().sub(hex.group.position), s] as [Vector3, Hex]),
			h => h[0].length().toFixed(2).toString()
		);

		let superHexes = [];

		for (const group in groups){
			superHexes = superHexes.concat(crossMap(groups[group])
				.filter(p => Math.abs(Math.PI * 2 / 3 - p[0][0].angleTo(p[1][0])) < 0.01)
				.filter(h => {
					let test = hex.group.position.clone().add(h[0][0]).add(h[1][0]).add(h[0][0]);
					if (this.realWorldHex(test).building !== Building.Spacer)
						return false;
					test.add(h[1][0]);
					if (this.realWorldHex(test).building !== Building.Spacer)
						return false;
					test.sub(h[0][0]);
					if (this.realWorldHex(test).building !== Building.Spacer)
						return false;
					return true;
				}).map(h => {
					const radius = (h[0][0].clone().add(h[1][0]));
					return {
						radius: radius,
						center: this.realWorldHex(radius.clone().add(hex.group.position)),
					} as SuperHex
				})
			);
		}
		return superHexes;
	}

	createSuperHexes(hex: Hex){
		for(const foundHex of this.getSuperHexes(hex)){
			this.superHexes[foundHex.center.indexHash] = foundHex;
		}
	}

	realWorldHex(vector: Vector3): Hex {
		const y = Math.round(vector.y / Hex.radius / 1.5);
		const x = Math.round((vector.x / Hex.size -  Math.abs(y % 2 | 0)) / 2);
		return this.hexes[Field.indexHash(new Vector2(x, y))];
	}

	build(building: Building, hex: Hex): any {
		hex.building = building;
		this.disaster(hex);

		for(const hex of this.hexArray){
			hex.reinforced = false;
		}

		for(const hex in this.superHexes){
			this.superHexes[hex].center.reinforced = true;
			for(const subject of this.adjacents(this.superHexes[hex].center, this.superHexes[hex].radius.length() / (Hex.size * 2) + 1 | 0)){
				subject.reinforced = true;
			}
		}
	}

	showLinks(hex: Hex){
		for (const triangle of this.getTriangles(hex)){
			const geometry = new Geometry();
			geometry.vertices.push(triangle.hexes[0].group.position);
			geometry.vertices.push(triangle.hexes[1].group.position);
			geometry.vertices.push(triangle.hexes[2].group.position);
			geometry.vertices.push(triangle.hexes[0].group.position);
			this.links.add(new Line(geometry, new LineBasicMaterial( { color: 0xffffff, linewidth: 3 } )))
		}
	}

	hideLinks(): any {
		const children = [].concat(this.links.children);
		for(const child of children)
			this.links.remove(child);
	}
}
