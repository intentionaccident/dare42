import { Hex, Building } from './Hex';
import { Vector2, Group, Raycaster } from 'three';
import { flatten, game } from './index';
import { stats } from '../styles/main.sass';

export interface HexMap{
	[hash: string]: Hex;
}

export class Field {
	solids: Array<Hex> = [];
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
		const hex = new Hex(coord, Math.random() * 0.1, this);
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

		for (const hex of this.adjacents(this.hexes[Field.indexHash(new Vector2(0, 0))], 3, false)){
			hex.solidity = Math.random() * 0.3  + 0.7;
		}

		for (const hex of this.adjacents(this.hexes[Field.indexHash(new Vector2(0, 0))], 4)){
			hex.solidity = Math.random() * 0.6  + 0.3;
		}

		for (const hex of this.adjacents(this.hexes[Field.indexHash(new Vector2(0, 0))], 5)){
			hex.solidity = Math.random() * 0.5  + 0.2;
		}

		for (const hex of this.adjacents(this.hexes[Field.indexHash(new Vector2(0, 0))], 6)){
			hex.solidity = Math.random() * 0.4;
		}

		for(const hex of this.hexArray){
			if (hex.solidity > 0.5)
				this.solids.push(hex);
		}
	}

	public adjacents(hex: Hex, distance = 1, only = true): Array<Hex>{ 
		let found = [hex];
		const adj = new Set<Hex>([hex]);
		do{
			const unique = [];
			for(const f of flatten(found.map(f => f.adjacents))){
				if(!f)
					continue;
				if(!adj.has(f))
					unique.push(f);
				adj.add(f);
			}
			found = unique;
			
			distance--;
		} while(distance > 0);

		if (only)
			return found;

		return Array.from(adj);
	}

	tick(delta: number): any {
		const buildings = [];
		for(const hex of this.hexArray){
			if (hex.building !== Building.None)
				buildings.push(hex);

			if (hex.solidity > 0.5)
				hex.solidity -= 0.05 * delta;
			else
				hex.solidity -= 0.01 * delta;
		}

		for(const building of buildings){
			switch(building.building){
				case Building.Spacer: {
					if (game.space >= 5)
						game.space -= 5;
					else
						return;
					for (const hex of this.adjacents(building, 3, false)){
						hex.solidity += 0.1 * delta;
					}
					break;
				} case Building.Vacuum: {
					game.space += Math.min(5, building.space);
					building.space -= Math.min(5, building.space);
					break;
				}
			}
			
		}
	}
}