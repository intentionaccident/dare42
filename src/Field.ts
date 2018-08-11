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
		this.build(Building.Spacer, this.hex(0, 0));

		for (const hex of this.adjacents(this.hexes[Field.indexHash(new Vector2(0, 0))], 3, false)){
			hex.solidity = 1;
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

	public update (delta: number) {
		const buildings: Array<Hex> = [];
		for(const hex of this.hexArray){
			if (hex.building !== Building.None)
				buildings.push(hex);

			hex.solidity -= hex.adjacents.filter(h => h.solidity < 0.5).length * delta * 0.01;
		}

		for(const building of buildings){
			switch(building.building){
				case Building.Spacer: {
					for (const hex of this.adjacents(building, 2, false)){
						if (hex.solidity >= 1)
							continue;
						if (!game.buy(1 * delta))
							return;
						hex.solidity += 0.1 * delta;
					}
					break;
				} case Building.Vacuum: {
					const cost = Math.min(5 * delta, building.space);
					game.space += cost;
					building.space -= cost;
					building.update();
					break;
				}
			}
			
		}
	}

	public buildings: Buildings = {};

	build(building: Building, hex: Hex): any {
		if (!this.buildings[Building[building]])
			this.buildings[Building[building]] = 1;
		else
			this.buildings[Building[building]]++;
	}
}

export interface Buildings{
	[key: string]: number;
}