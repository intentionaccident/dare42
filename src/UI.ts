import styles from '../styles/main.sass';
import $ from 'jquery';

interface Email{
	subject: string;
	sender: string;
	body: string;
}

export class UI {

	email: JQuery<HTMLElement>;
	ui: JQuery<HTMLElement>;
	emails: {[subject:string]: Email} = {};
	constructor(body: JQuery<HTMLElement>, private canvas: JQuery<HTMLElement>) {
		this.ui = $(`<div class="${styles.ui}">
			<div class="email">Email</div>
		</div>`);

		body.append(this.ui);

		this.email = $(`
			<div class="${styles.email}">
				<div class="${styles.secretSpace}">
					<div class="${styles.title}">
						<div class="${styles.text}"></div>
						<div class="${styles.exit}">x</div>
					</div>
					<div class="${styles.header}">
						<div>To:</div>
						<div>Ouroboros Staff Mailing List (27)</div>
					</div>
					<div class="${styles.header}">
						<div>From:</div>
						<div class="from"></div>
					</div>
					<div class="${styles.body}">
					</div>
				</div>
				<div class="${styles.footer}">
				</div>
			</div>
		`);

		this.email.find(`.${styles.exit}`).click(e => this.closeEmail())
		this.ui.find('.email').click(e => this.openEmail())
		this.email.hide();
		this.canvas.append(this.email);

		this.addEmail({
			subject: "Test Title",
			sender: "Automated Alert System",
			body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
		});

		this.addEmail({
			subject: "Test Title 2",
			sender: "Automated System",
			body: "consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
		});
	}

	closeEmail() {
		this.email.hide();
		this.ui.find('.email').removeClass(styles.selected);
	}
	
	openEmail() {
		this.email.show();
		this.ui.find('.email').addClass(styles.selected);
	}

	addEmail(email: Email){
		this.emails[email.subject] = email;
		this.email.find('.' + styles.footer).append(this.generateEmailButton(email));
		this.showEmail(email);
	}

	showEmail(email: Email) {
		this.email.find(`.${styles.title} > .${styles.text}`).text(email.subject);
		this.email.find('.from').text(email.sender);
		this.email.find('.' + styles.body).text(email.body);
		this.email.find('.' + styles.footer).find('.' + styles.selected).removeClass(styles.selected);
		this.email.find('.' + styles.footer).children().filter((i, e) => $(e).text() === email.subject).addClass(styles.selected);
		this.openEmail();
	}

	generateEmailButton(email: Email): JQuery<HTMLElement> {
		const button = $(`<div class="${styles.tag}">${email.subject}</div>`);
		button.click(() => this.showEmail(email));
		return button;
	}
}
