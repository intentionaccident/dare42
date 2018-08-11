import styles from '../styles/main.sass';
import $ from 'jquery';

export class UI {
	ui: JQuery<HTMLElement>;
	textBlock: JQuery<HTMLElement>;
	spaceField: JQuery<HTMLElement>;
	constructor(body: JQuery<HTMLElement>) {
		this.ui = $(`<div class="${styles.ui}">
			<div class="${styles.textBlock}"/>
			<div class="${styles.stats}">
				<div id="space"'/>
			</div>
		</div>`);
		this.textBlock = this.ui.find('.' + styles.textBlock);
		this.spaceField = this.ui.find('#space');
		body.append(this.ui);
	}
}
