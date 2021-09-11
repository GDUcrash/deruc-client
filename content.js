function run() {
	let username = document.querySelector('.user-name').innerText;
	let derucpanelstyle = `
	<style>
		.box-content {
			text-align:left !important;
			padding:20px !important;
		}
	</style>
	`;
	
	let derucpanel = `
	<h1>DeRuC Admin Panel</h1>
	<p>Logged in as <b>`+username+`</b></p>
	`;
	
	if (window.location.pathname == '/users/DeRuC/' || window.location.pathname == '/users/-luni/' || window.location.pathname == '/users/zekastoporom/' || window.location.pathname == '/users/SkAntyTroller/') {
		document.querySelector('.group').innerText = 'DeRuC Executive';
		document.querySelector('.avatar>a>img').style.border = '3px solid';
		document.querySelector('.avatar>a>img').style.borderRadius = '8px';
		document.querySelector('.avatar>a>img').style.borderColor = '#fcba03 #ffe7a6 #ffffff';
		if (window.location.pathname == '/users/zekastoporom/' || window.location.pathname == '/users/SkAntyTroller/') {
			document.querySelector('.group').innerText = 'DeRuC Executive | Предводитель СЖЗС';
		}
		if (document.querySelector('.user-name').innerText == document.querySelector('.header-text>h2').innerText) {
			document.querySelector('.location').innerHTML += "<br><a href='https://scratch.mit.edu/deruc'>Admin Panel</a>";
		}
	}
	if (window.location.href == "https://scratch.mit.edu/deruc") {
		document.querySelector('head').innerHTML += derucpanelstyle;
		document.querySelector('.box-content').innerHTML = derucpanel;
	}
}

function updateProfile () {
	// if not on a user page, return
	if(!window.location.href.includes('/users/')) return;

	let username = document.querySelector('.header-text>h2').innerText;

	// request deruc api for the user to whom this page belongs
	let getreq = new XMLHttpRequest();
	getreq.open("GET", "https://deruc.glitch.me/api/users/" + username, true);
	getreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	getreq.send();
	getreq.onreadystatechange = function() {
		if (getreq.readyState == 4 && getreq.status === 200) {
			// if deruc account doesnt exist, return
			if(!getreq.responseText) return;

			// else, add a "deruc member"
			document.querySelector('.group').innerText = 'Участник DeRuC';
			
			let response = JSON.parse(getreq.responseText);
			// for admins
			if(response.role == 'admin') {
				document.querySelector('.group').innerText = 'DeRuC Лидер';
				document.querySelector('.avatar>a>img').style.border = '3px solid';
				document.querySelector('.avatar>a>img').style.borderRadius = '8px';
				document.querySelector('.avatar>a>img').style.borderColor = '#fcba03';
			}

			// for moderators
			else if(response.role == 'moderator') {
				document.querySelector('.group').innerText = 'DeRuC Модератор';
				document.querySelector('.avatar>a>img').style.border = '3px solid';
				document.querySelector('.avatar>a>img').style.borderRadius = '4px';
				document.querySelector('.avatar>a>img').style.borderColor = '#37b330';
			}

			// last active/banned text
			let onlinetext = document.querySelector('#derucStatus');
			if(!onlinetext) onlinetext = document.createElement('span');
			onlinetext.id = 'derucStatus';

			if(response.bannedDeruc) {
				// banned from deruc
				onlinetext.innerText = ` • Забанен в ДеРуК`;
				onlinetext.style.color = '#aa0033';
			}else {
				onlinetext.innerText = '';
			}
			if(response.bannedScratch) {
				// banned in scratch
				onlinetext.innerText += ` • Забанен в Скретче`;
				onlinetext.style.color = '#aa0033';
			} else {
				// calculate time difference
				let onlinedifference = compareTime(response.lastActive);
				if(onlinedifference <= 1) {
					onlinetext.innerText += ` • В Сети`;
					onlinetext.style.color = '#00aa44';
				}
				else {
					let months = [
						'января', 'февраля', 'марта', 'апреля',
						'мая', 'июня', 'июля', 'августа',
						'сентября', 'октября', 'ноября', 'декабря'
					]
					onlinetext.innerText += ` • Был в сети `;
					if(onlinedifference < 60) onlinetext.innerText += `${onlinedifference} минут назад`;
					else if(onlinedifference < 60*24) onlinetext.innerText += `${Math.floor(onlinedifference/60)} часов назад`;
					else onlinetext.innerText += `${response.lastActive.day} ${months[response.lastActive.month]} ${months[response.lastActive.year]} года`;
				}
			}
			document.querySelector('.group').appendChild(onlinetext);

			getSession((session) => {
				if(!session.user) return;

				let getselfreq = new XMLHttpRequest();
				getselfreq.open("GET", "https://deruc.glitch.me/api/users/" + session.user.username, true);
				getselfreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				getselfreq.send();
				getselfreq.onreadystatechange = () => {
					if (getselfreq.readyState == 4 && getselfreq.status === 200) {
						if(!getselfreq.responseText.trim()) return;

						getselfreq.onreadystatechange = null;

						let self = JSON.parse(getselfreq.responseText);
						if(
							((self.role == 'moderator' && response.role == 'member') || 
							(self.role == 'admin' && response.role != 'admin')) &&
							!document.querySelector('#deruc-ban')
						) {
							//add a ban/unban button
							document.querySelector('#follow-button').innerHTML = `
							<div class="follow-button button following grey" id="deruc-ban">
								<span class="unfollow text">${response.bannedDeruc ? 'Разбанить в DeRuC' : 'Забанить в DeRuC'}</span>
							</div>` + document.querySelector('#follow-button').innerHTML;

							// on ban button click
							document.querySelector('#deruc-ban').onclick = () => {
								// confirm on ban, but not on unban
								if(response.bannedDeruc || confirm(`Вы действительно хотите забанить ${username}?` + 
								'У них пропадёт доступ к большинству функциям ДеРуК, но они всё ещё смогут ' +
								'взаимодействовать с другими в Скретче.')) {
									let postreq = new XMLHttpRequest();
									postreq.open("POST", "https://deruc.glitch.me/api/ban", true);
									postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
									postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
									// send with our session and target username in the request body
									postreq.send(JSON.stringify({ session: session, target: username, unban: response.bannedDeruc }));
									postreq.onreadystatechange = () => {
										if(postreq.status == 200) {
											postreq.onreadystatechange = null;
											alert(`Пользователь ${response.bannedDeruc ? 'раз' : 'за'}банен`);
											window.location.reload(true);
										} else if(postreq.status == 403) {
											alert('Вам нехватает прав, чтобы забанить данного участника');
										} else if(postreq.status == 401) {
											alert('Ошибка, отказано в доступе!');
										}
									}
								}
							}
						}
						if(self.role == 'admin' && response.role != 'admin' && !document.querySelector('#deruc-promote')) {
							// add promote button
							document.querySelector('#follow-button').innerHTML = `
							<div class="follow-button button following grey" id="deruc-promote">
								<span class="unfollow text">${response.role == 'moderator' ? 'Убрать Модератора' : 'Сделать Модератором'}</span>
							</div>` + document.querySelector('#follow-button').innerHTML;

							// on ban button click
							document.querySelector('#deruc-promote').onclick = () => {
								// confirm on ban, but not on unban
								if(confirm('Вы уверены?')) {
									let postreq = new XMLHttpRequest();
									postreq.open("POST", "https://deruc.glitch.me/api/promote", true);
									postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
									postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
									// send with our session and target username in the request body
									postreq.send(JSON.stringify({ session: session, target: username, unpromote: response.role == 'moderator' }));
									postreq.onreadystatechange = () => {
										if(postreq.status == 200) {
											postreq.onreadystatechange = null;
											alert(`Пользователь ${response.role == 'moderator' ? 'снят с должности модератора' : 'стал модератором'}`);
											window.location.reload(true);
										} else if(postreq.status == 403) {
											alert('Вам нехватает прав, чтобы повысить данного участника');
										} else if(postreq.status == 401) {
											alert('Ошибка, отказано в доступе!');
										}
									}
								}
							}
						}
					}
				};
			});
		}
	}
}

function createAccount () {
	// if not on this specific project, return
	if(!window.location.pathname.includes('569163646')) return;
	
	getSession((session) => {
		// if not logged in, return
		if(!session.user) return;
		let getuserreq = new XMLHttpRequest();
		getuserreq.open("GET", "https://deruc.glitch.me/api/users/" + session.user.username, true);
		getuserreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		getuserreq.send();
		getuserreq.onreadystatechange = function() {
			if (getuserreq.readyState != 4) return;

			let json;
			try {
				json = JSON.parse(getuserreq.responseText);
			} catch {
				json = {}
			}
			console.log(json);
			if(getuserreq.status == 200) getuserreq.onreadystatechange = null;
			// if deruc account doesnt exist, replace html of the page with the login screen
			if (getuserreq.status === 200 && !json.role) {
				document.querySelector('#view').innerHTML = `
				<center>
					<h1 style="margin-top: 64px">Создание ДеРуК Аккаунта</h1>
					<p>Приветствую Вас, дорогой участник! Я думаю, Вы уже прочитали <a href="/deruc-rules">Кодекс Чести Участника ДеРуК</a></p>
					<p>Теперь, осталось лишь создать сам аккаунт! </p>

					<button class="button" id="createDerucAccount">Я готов!</button>
				</center>
				`;

				document.querySelector('#createDerucAccount').onclick = () => {
					document.querySelector('#createDerucAccount').disabled = true;
					document.querySelector('#createDerucAccount').style.opacity = 0.5;
					document.querySelector('#createDerucAccount').innerText = 'Создаём Аккаунт...';

					// post a request to create account
					let postreq = new XMLHttpRequest();
					postreq.open("POST", "https://deruc.glitch.me/api/createAccount", true);
					postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
					postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
					// send with our session in the request body
					postreq.send(JSON.stringify({ session: session }));
					postreq.onreadystatechange = () => {
						if(postreq.status == 200) {
							postreq.onreadystatechange = null;
							alert('Поздравляем, Ваш аккаунт был создан! Теперь вы участник сообщества ДеРуК!');
							window.location.pathname = '/users/' + session.user.username;
						} else if(postreq.status == 403) {
							alert('Ошибка, Ваш аккаунт уже есть в ДеРуК!');
						} else if(postreq.status == 401) {
							alert('Ошибка, отказано в доступе!');
						}
					}
				}
			}
		}
	});
}

function derucRules () {
	if(document.querySelector('.lists')) {
		document.querySelector('.lists').children[1].innerHTML += `
		<dd><a href="/deruc-rules"><span>Кодекс Чести ДеРуК</span></a></dd>`;
	}

	if(document.querySelector('.footer-col')) {
		document.querySelector('.footer-col').children[1].children[1].innerHTML += `
		<li><a href="/deruc-rules">Кодекс Чести ДеРуК</a></li>`;
	}


	if(window.location.pathname == '/deruc-rules') {
		document.querySelector('.box').style.marginLeft = "auto";
		document.querySelector('.box').style.marginRight = "auto";
		document.querySelector('.box').style.width = "480px";

		document.querySelector('.box-content').style.padding = '32px';
		document.querySelector('.box-content').innerHTML = `
		<h1>Кодекс Чести Участника ДеРуК</h1>
		<p style="text-align: left">Я, как участник ДеРуК, обещаю 
		следовать этим правилам:</p>
		
		<p style="text-align: left">
		1. Я обещаю никого не оскорблять и не
		унижать. Я также обещаю не быть
		токсичным по отношению к кому-либо.
		Я обещаю стараться решать все
		конфликты мирным путём, с как можно
		меньшим количеством ссор и обид.</p>
		 
		<p style="text-align: left">
		2. Я обещаю уважительно относиться
		к лидерам и модераторам ДеРуК. Я 
		также обещаю стараться слушаться их
		и не конфликтовать с ними.</p>
		 
		<p style="text-align: left">
		3. Я обещаю следовать правилам сайта
		Скретч и не искать лазейки в них. Я
		также обещаю, что буду говорить
		модераторам или лидерам ДеРуК о
		замеченных мною нарушениях правил
		Скретча или этого кодекса других
		участников этого сообщества.</p>

		<p style="text-align: left">
		Если я не соглашаюсь с данным кодексом,
		я не собираюсь быть частью сообщества
		ДеРуК
		</p>
		`;
	}
}

function compareTime(date) {
	let currentDate = new Date();

	let differenceMinutes = 0;
	differenceMinutes += currentDate.getUTCMinutes() - date.minute;
	differenceMinutes += (currentDate.getUTCHours() - date.hour) * 60;
	differenceMinutes += (currentDate.getUTCDate() - date.day) * 60 * 24;
	differenceMinutes += (currentDate.getUTCMonth() - date.month) * 60 * 24 * 30;
	differenceMinutes += (currentDate.getUTCFullYear() - date.year) * 60 * 24 * 30 * 12;

	return differenceMinutes;
}


function getSession(callback) {
	let session;
	// open a request to get scratch session
	let tokenrequest = new XMLHttpRequest();
	tokenrequest.open("GET", "https://scratch.mit.edu/session/", true);
	tokenrequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	tokenrequest.send();
	tokenrequest.onreadystatechange = function() {
		if (tokenrequest.readyState === 4) {
			if (tokenrequest.status === 200) {
				// if everything succeeds, convert the response to js object
				let response = JSON.parse(tokenrequest.responseText);
				session = response;
				callback(session);
			}
		}
	}
}
  
// post status update to deruc api
function updateLastActive() {
	getSession((session) => {
		let postreq = new XMLHttpRequest();
		postreq.open("POST", "https://deruc.glitch.me/api/status/ping", true);
		postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		// send with our session in the request body
		postreq.send(JSON.stringify({ session: session }));
	});
}

// initial stuff
updateLastActive();
setInterval(() => {updateLastActive()}, 60000);

setTimeout(() => {updateProfile()}, 500);
window.onload = () => {
	updateProfile();
	derucRules();
	createAccount();
};