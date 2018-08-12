import styles from '../styles/main.sass';
import $ from 'jquery';
import { game } from './index';

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
			<div class="email ${styles.button}">Email</div>
			<div class="${styles.space}"/>
			<div class="wait ${styles.button}">Wait</div>
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
						<div>Uroboros Staff Mailing List (27)</div>
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
		this.ui.find('.wait').click(e => {
			this.closeEmail();
			game.wait();
		});

		this.email.hide();
		this.canvas.append(this.email);

		this.addEmail({
			subject: "FWD: Uroboros Initiative",
			sender: "Johan Andersson, Lead Researcher",
			body: "We're working on a device we're calling the 'Spacer'.<br />\
				Field tests show some promise in spatially unstable environments, especially in multiples.<br />\
				Left Click to place one down.<br />\
				Triangular arrangements boost the power of each device in the triangle.<br />\
				Hexagonal arrangements seem to provide additional stability during stress tests."
		});

		this.addEmail({
			subject: "ALERT: SPATIAL INSTABILITY",
			sender: "Automated Alert Watchdog",
			body: "ANOMALY DETECTED<br />\
				Instability in spacetime detected around <span style='color:yellow'>Uroboros Testing Station EM-32.</span><br />\
				Ongoing space manipulation projects are to be suspended.<br />\
				All personel to evacuate immediately.<br />\
				EOM"
		});
	}

	closeEmail() {
		game.start();
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
		this.email.find('.' + styles.body).html(email.body);
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
