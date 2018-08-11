import { Hex, Building } from './Hex';
import { Vector2, Group, Raycaster } from 'three';
import { flatten, game } from './index';

export interface HexMap{
	[hash: string]: Hex;
}

export class Field {
	disaster(){
		
	}

	solids: Array<Hex> = [];
	disasterCount: any;
	smash(raycaster: Raycaster): Hex | void{
		const intersect = raycaster.intersectObjects(flatten(this.hexArray.map(h => h.mesh)))[0];
		if (!intersect)
			return;
		return intersect.object.parent.userData.eventReceptor as Hex;
	}

	group: THREE.Group;
	public hexes: HexMap = {};
	constructor() {
		this.group = new Group();
	}

	public static indexHash(coord : Vector2): string {
		return `x${coord.x | 0}y${coord.y | 0}`;
	}

	public get hexArray(): Array<Hex> {
		return Object.keys(this.hexes).map(key => this.hexes[key]);
	}

	private createHex(coord: Vector2): Hex {
		const hex = new Hex(coord, Math.random() * 0.2 + 0.8 / (Math.pow(((Math.abs(coord.x) + Math.abs(coord.y))) / 6, 2) + 1), this);
		this.hexes[Field.indexHash(hex.coord)] = hex;
		this.group.add(hex.group);
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

		this.hex(0, 0).building = Building.Spacer;

		for(const hex of this.hexArray){
			if (hex.solidity > 0.5)
				this.solids.push(hex);
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
					for (const hex of this.adjacents(building, 2)){
						hex.solidity += 1 * delta;
					}
					break;
				} case Building.Vacuum: {
					const cost = Math.min(600 * delta, building.space);
					game.space += cost;
					building.space -= cost;
					building.update();
					break;
				}
			}
		}
	}

	build(building: Building, hex: Hex): any {
		if (building === Building.Spacer){
			const adjacents = this.adjacents(hex, 2);
		}

		this.disasterCount--;
		if (this.disasterCount < 0){
			this.disaster();
		}
	}
}

export interface Buildings{
	[key: string]: number;
}