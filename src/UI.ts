import styles from '../styles/main.sass';
import $ from 'jquery';

export class UI {
	ui: JQuery<HTMLElement>;
	textBlock: JQuery<HTMLElement>;
	constructor(body: JQuery<HTMLElement>, canvas: JQuery<HTMLElement>) {
		this.ui = $(`<div class="${styles.ui}">
			<div class="${styles.textBlock}"/>
		</div>`);
		this.textBlock = this.ui.find('.' + styles.textBlock);
		body.append(this.ui);


	}
}
