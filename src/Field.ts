import { Hex, Building } from './Hex';
import { Vector2, Group, Raycaster } from 'three';
import { flatten, game, tryRemove } from './index';

export interface HexMap{
	[hash: string]: Hex;
}

export class Field {
	disaster(){
		this.disasterCount--;
		if (this.disasterCount > 0)
			return;

		const singularities = this.hexArray.filter(h => h.building === Building.Singularity);
		for (const singularity of singularities){
			const targets = singularity.adjacents().filter(a => a.building !== Building.Singularity);
			if (!targets.length)
				continue;
			const target = targets[targets.length * Math.random() | 0];
			if(target.building !== Building.None)
				console.log(target)
			target.building = Building.Singularity;
		}
		
		const hexes = this.hexArray.filter(h => h.solidity >= 1 && h.building !== Building.Singularity);
		// const newSingularities = hexes.filter(h => h.building === Building.Spacer || h.building === Building.BoosterSpacer).length;

		for (let i = 1; i > 0; i--){
			const hex = hexes.splice(hexes.length * Math.random() | 0, 1)[0];
			hex.building = Building.Singularity;
			if (!hexes.length)
				return; //GAME OVER
		}
		this.disasterCount = 1;
	}

	solids: Array<Hex> = [];
	disasterCount: number = 3;
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

		this.build(Building.Spacer, this.hex(0, 0));

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

	getTriangles(): Array<[number, Array<Hex>]>{
		const triangles: Array<[number, Array<Hex>]> = [];
		for(const row in this.spacers){
			if (!this.spacers[row].length)
				continue;

			const compareAxis = row[0] === 'x' ? 'y' : 'x';
			
			for(let i = 0; i < this.spacers[row].length; i++){
				for(let j = i + 1; j < this.spacers[row].length; j++){
					const distance = Math.abs(this.spacers[row][i].coord[compareAxis] - this.spacers[row][j].coord[compareAxis]);
					const hits = this.spacers[row][j].adjacents(distance);
					const completions = this.spacers[row][i].adjacents(distance).filter(h =>
						(h.building === Building.Spacer)
						&& hits.find(t => t === h)
					);
					for(const completion of completions){
						triangles.push([distance, [this.spacers[row][i], this.spacers[row][j], completion]]);
					}
				}
			}
		}
		return triangles;
	}



	getHexes(): SuperHexMap{
		const hexes: SuperHexMap = {};
		for(const row in this.spacers){
			if (row[0] === 'x' || !this.spacers[row].length)
				continue;
			
			for(let i = 0; i < this.spacers[row].length; i++){
				for(let j = i + 1; j < this.spacers[row].length; j++){
					let distance = (this.spacers[row][j].coord.x - this.spacers[row][i].coord.x);
					if (Math.abs(distance % 2 | 0) === 1)
						continue;
					distance = distance / 2 | 0;

					const test = this.hex(
						this.spacers[row][i].coord.x + distance,
						this.spacers[row][i].coord.y
					);

					if (!test || test.indexHash in hexes)
						continue;

					const hits = test.adjacents(distance).filter(h =>
						(h.building === Building.Spacer));

					const initialHits = hits.length;
					if (initialHits < 4)
						continue;


					const crossHits = this.spacers[row][i].adjacents(distance)
						.concat(this.spacers[row][j].adjacents(distance))
						.filter(h => (h.building === Building.Spacer));

					if (hits.filter(h => !crossHits.find(t => t === h)).length + 4 !== initialHits)
						continue;

					hexes[test.indexHash] = [distance, test];
				}
			}
		}
		return hexes;
	}

	private spacers: HexGroupMap = {};

	modifySpacer(hex: Hex, add: boolean){
		if (add){
			if (this.spacers[`y${hex.coord.y}`] == null){
				this.spacers[`y${hex.coord.y}`] = [];
			}
			this.spacers[`y${hex.coord.y}`].push(hex);

			if (this.spacers[`x${hex.coord.x}`] == null){
				this.spacers[`x${hex.coord.x}`] = [];
			}
			this.spacers[`x${hex.coord.x}`].push(hex);
		}else{
			if (this.spacers[`y${hex.coord.y}`] != null)
				tryRemove(this.spacers[`y${hex.coord.y}`], hex);
	
			if (this.spacers[`x${hex.coord.x}`] != null)
				tryRemove(this.spacers[`x${hex.coord.x}`], hex);
		}
	}

	build(building: Building, hex: Hex): any {
		hex.building = building;
		//this.disaster();

		for(const hex of this.hexArray){
			if (hex.building === Building.Spacer)
				hex.boost = 0;
		}

		const hexes = this.getHexes();
		for(const hex in hexes){
			console.log(hexes[hex][1]);
		}

		for(const triangle of this.getTriangles()){
			for(const hex of triangle[1]){
				hex.boost = Math.max(hex.boost, triangle[0] / 2 | 0);
			}
		}
	}
}

export interface Buildings{
	[key: string]: number;
}



interface HexGroupMap{
	[key: string]: Array<Hex>;
}

interface SuperHexMap{
	[key: string]: [number, Hex];
}

