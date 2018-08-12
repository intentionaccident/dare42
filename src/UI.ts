import styles from '../styles/main.sass';
import $ from 'jquery';
import { canvas } from '../styles/main.sass';

export class UI {
	email: JQuery<HTMLElement>;
	ui: JQuery<HTMLElement>;
	textBlock: JQuery<HTMLElement>;
	constructor(body: JQuery<HTMLElement>, private canvas: JQuery<HTMLElement>) {
		this.ui = $(`<div class="${styles.ui}">
			<div class="${styles.textBlock}"/>
		</div>`);

		this.textBlock = this.ui.find('.' + styles.textBlock);
		body.append(this.ui);

		this.email = $(`
			<div class="${styles.email}">
				<div class="${styles.secretSpace}">
					<div class="${styles.title}">
						<div class="${styles.text}">Test Title</div>
						<div class="${styles.exit}">X</div>
					</div>
					<div class="${styles.header}">
						<div>To:</div>
						<div>Ouroboros Staff Mailing List (27)</div>
					</div>
					<div class="${styles.header}">
						<div>From:</div>
						<div>Automated Alert System</div>
					</div>
					<div class="${styles.body}">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
					</div>
				</div>
				<div class="${styles.footer}">
					<div class="${styles.tag}">
						Test
					</div>
				</div>
			</div>
		`);

		this.canvas.append(this.email);
	}
}
