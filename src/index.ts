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

$(() => {
	const game = new Game();
	game.init();
	game.start();
});
