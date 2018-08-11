import { Game } from './Game';
import $ from 'jquery';

export function flatten(arr, result = []) {
	for (let i = 0, length = arr.length; i < length; i++) {
		const value = arr[i];
		if (Array.isArray(value)) {
			flatten(value, result);
		} else {
			result.push(value);
		}
	}
	return result;
};

export function tryRemove<T>(array: Array<T>, item: T): boolean{
	const index = array.indexOf(item);
	if (index < 0)
		return false;
	array.splice(index, 1);
	return true;
}

export function random<T>(array: Array<T>): T | void{
	if (!array.length)
		return;
	return array[Math.random() * array.length | 0];
}

export var game : Game;

$(() => {
	game = new Game();
	game.init();
	game.start();
});
