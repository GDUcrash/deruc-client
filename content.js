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
	if(!window.location.href.includes('/users/')) return;

	let username = document.querySelector('.header-text>h2').innerText;

	let getreq = new XMLHttpRequest();
	getreq.open("GET", "https://deruc.glitch.me/api/users/" + username, true);
	getreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	getreq.send();
	getreq.onreadystatechange = function() {
		if (getreq.status === 200) {
			if(!getreq.responseText) return;

			document.querySelector('.group').innerText = 'Участник DeRuC';
			
			let response = JSON.parse(getreq.responseText);
			if(response.role == 'admin') {
				document.querySelector('.group').innerText = 'DeRuC Лидер';
				document.querySelector('.avatar>a>img').style.border = '3px solid';
				document.querySelector('.avatar>a>img').style.borderRadius = '8px';
				document.querySelector('.avatar>a>img').style.borderColor = '#fcba03';
			}

			let onlinetext = document.querySelector('#derucStatus');
			if(!onlinetext) onlinetext = document.createElement('span');
			onlinetext.id = 'derucStatus';

			if(response.bannedDeruc) {
				onlinetext.innerText = ` • Забанен в ДеРуК`;
				onlinetext.style.color = '#aa0033';
			}else {
				onlinetext.innerText = '';
			}
			if(response.bannedScratch) {
				onlinetext.innerText += ` • Забанен в Скретче`;
				onlinetext.style.color = '#aa0033';
			} else {
				let onlinedifference = compareTime(response.lastActive);
				if(onlinedifference <= 1) {
					onlinetext.innerText += ` • В Сети`;
					onlinetext.style.color = '#00aa44';
				}
				else onlinetext.innerText += ` • Последний раз в сети ${onlinedifference} минут назад`;
			}
			document.querySelector('.group').appendChild(onlinetext);
		}
	}
}

function createAccount () {
	if(!window.location.pathname.includes('568927438')) return;
	if(!document.querySelector('.profile-name')) return;

	let getuserreq = new XMLHttpRequest();
	getuserreq.open("GET", "https://deruc.glitch.me/api/users/" + document.querySelector('.profile-name').innerText, true);
	getuserreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	getuserreq.send();
	getuserreq.onreadystatechange = function() {
		if (getuserreq.status === 200 && !getuserreq.responseText.trim()) {
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

				getSession((session) => {
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
				});
			}
		}
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

updateLastActive();
setInterval(() => {updateLastActive()}, 60000);


setTimeout(() => {updateProfile()}, 500);
window.onload = () => {
	updateProfile();
	setTimeout(() => {createAccount()}, 100);
};