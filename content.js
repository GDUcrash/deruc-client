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
					else onlinetext.innerText += `${response.lastActive.day} ${months[response.lastActive.month]} ${response.lastActive.year} года`;
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
						if(self.bannedDeruc) return;
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

						// on ban button click
						if(document.querySelector('#deruc-ban')) {
							document.querySelector('#deruc-ban').onclick = () => {
								// confirm on ban, but not on unban
								if(response.bannedDeruc || confirm(`Вы действительно хотите забанить ${username}?` + 
								' У них пропадёт доступ к большинству функциям ДеРуК, но они всё ещё смогут ' +
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

let navLoaded = false;
function userNav () {
	if(document.querySelector('.user-nav') || document.querySelector('.dropdown')) {
		navLoaded = true;
		let el = document.querySelector('.user-nav') || document.querySelector('.dropdown');
		let li = document.createElement('li');
		li.innerHTML = `<a id="derucUnreadDms" style="color: white">Личные Сообщения <span id="derucUnreadDmsBadge">0</span></a>`;
		el.insertBefore(li, el.children[2]);

		let derucUnreadDmsBadge = document.querySelector('#derucUnreadDmsBadge');
		derucUnreadDmsBadge.style.padding = '2px 5px';
		derucUnreadDmsBadge.style.background = '#fcba03';
		derucUnreadDmsBadge.style.borderRadius = '50px';
		derucUnreadDmsBadge.style.display = 'none';

		getSession((session) => {
			let getreq = new XMLHttpRequest();
			getreq.open("GET", "https://deruc.glitch.me/api/dm/unread?username=" + session.user.username, true);
			getreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			getreq.send();
			getreq.onreadystatechange = function() {
				if (getreq.readyState == 4 && getreq.status === 200) {
					let jsonSelf;
					try {
						jsonSelf = JSON.parse(getreq.responseText);
					} catch {
						jsonSelf = {}
					}

					derucUnreadDmsBadge.innerText = jsonSelf.count || 0;
					if(jsonSelf.count && jsonSelf.count > 0) derucUnreadDmsBadge.style.display = 'inline';
				}
			}
		});

		document.querySelector('#derucUnreadDms').onclick = () => {
			window.location.pathname = '/dms';
		}
	}
}

function staticPages () {
	if(document.querySelector('.lists')) {
		document.querySelector('.lists').children[1].innerHTML += `
		<dd><a href="/deruc-rules"><span>Кодекс Чести ДеРуК</span></a></dd>`;
	}

	if(document.querySelector('.footer-col')) {
		document.querySelector('.footer-col').children[1].children[1].innerHTML += `
		<li><a href="/deruc-rules">Кодекс Чести ДеРуК</a></li>`;
	}

	if(window.location.pathname == '/dms') {
		document.querySelector('.box-head').innerHTML = `<h2>Личные Сообщения</h2>`;

		document.querySelector('.box-content').innerHTML = '';
		getSession((session) => {
			if(!session.user) return;
			let getreq = new XMLHttpRequest();
			getreq.open("GET", "https://deruc.glitch.me/api/dm/unread?username=" + session.user.username, true);
			getreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			getreq.send();
			getreq.onreadystatechange = function() {
				if (getreq.readyState == 4 && getreq.status === 200) {
					let jsonSelf;
					try {
						jsonSelf = JSON.parse(getreq.responseText);
					} catch {
						jsonSelf = {}
					}

					if(jsonSelf.ids) {
						let dmUserMap = {};
						jsonSelf.ids.forEach(m => {
							if(dmUserMap[m.from]) dmUserMap[m.from].push(m);
							else dmUserMap[m.from] = [m];
						});

						if(Object.keys(dmUserMap) == "") {
							document.querySelector('.box-content').innerHTML = `
							<h2>У вас нет непрочитанных личных сообщений!</h2>
							<p>Если вы хотите прочитать старые сообщения, наведить мышь на комментарий определённого пользователя и нажмите "Написать в ЛС"</p>
							`;
						} else {
							let i = 0;
							Object.keys(dmUserMap).forEach(uk => {
								let uv = dmUserMap[uk];
								let li = parseInt(i);

								let div = document.createElement('div');
								div.innerHTML = `
								<div id="dmBox${li}" style="padding: 10px; text-align: left; cursor: pointer; width: 100%; border-top: 1px solid #ddd; box-sizing: border-box">
									<h4 style="display: inline">${uk}</h4> 
									<span id="derucUnreadDmsBadge" style="padding: 2px 5px; background: rgb(252, 186, 3); border-radius: 50px; display: inline;">
									${uv.length}
									</span>
								</div>
								`;

								document.querySelector('.box-content').appendChild(div);
								document.querySelector(`#dmBox${li}`).onclick = (e) => {
									let dmBox = openDmWith(session, uk);
									dmBox.style.left = Math.max(e.pageX - 256, 32) + 'px';
									dmBox.style.top = (e.pageY + 16) + 'px';
									document.body.appendChild(dmBox);

									let isInside = false;

									dmBox.onmouseenter = () => { isInside = true }
									dmBox.onmouseleave = () => { isInside = false }

									function destroyDmBox () {
										if(!isInside) {
											document.body.removeChild(dmBox);
											document.body.removeEventListener('click', destroyDmBox);
										}
									}

									setTimeout(() => {
										document.body.addEventListener('click', destroyDmBox);
									}, 800);
								}

								i++;
							});
						}
					} else {
						document.querySelector('.box-content').innerHTML = `
							<h2>У вас нет непрочитанных личных сообщений!</h2>
							<p>Если вы хотите прочитать старые сообщения, наведить мышь на комментарий определённого пользователя и нажмите "Написать в ЛС"</p>
							`;
					}
				}
			}
		});
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

		createDm(
			{author: 'SLSFDKJS', content: 'Тест', date: {"minute":36,"hour":8,"day":12,"month":8,"year":2021}},
			(elem) => {
				document.querySelector('.box-content').appendChild(elem);
		});
	}
}

function commentDms () {
	let h = false;
	if(window.location.href.includes('/users/') || window.location.href.includes('/projects/')) {
		h = true;
		getSession((session) => {
			if(!session.user) return;
			let i = 0;
			Object.values(document.getElementsByClassName('comment')).forEach(comment => {
				let username = comment.querySelector('.name') || comment.querySelector('.username')
				if(!username) return;
				if(session.user.username == username.innerText) return;

				let li = parseInt(i);
				if(comment.querySelector('.actions-wrap')) {
					if(comment.querySelector('.derucActionButton')) return;
					comment.querySelector('.actions-wrap').innerHTML += `
					<span class="actions report derucActionButton" id="derucCommentDm${li}">Написать в ЛС</span>
					`;
				}

				if(comment.querySelector('.action-list')) {
					if(comment.querySelector('.derucActionButton')) return;
					let sp = document.createElement('span');
					sp.style = "margin-right: 1rem; opacity: .5; cursor: pointer; font-size: .75rem; font-weight: 500;"
					sp.className = "derucActionButton";
					sp.id = `derucCommentDm${li}`;
					sp.innerHTML = '<span>Написать в ЛС</span>';
					comment.querySelector('.action-list').insertBefore(sp, comment.querySelector('.action-list').children[0]);
				}

				if(document.querySelector(`#derucCommentDm${li}`)) {
					document.querySelector(`#derucCommentDm${li}`).onclick = (e) => {
						let dmBox = openDmWith(session, username.innerText);
						dmBox.style.left = (e.pageX - 256) + 'px';
						dmBox.style.top = (e.pageY + 16) + 'px';
						document.body.appendChild(dmBox);

						let isInside = false;

						dmBox.onmouseenter = () => { isInside = true }
						dmBox.onmouseleave = () => { isInside = false }

						function destroyDmBox () {
							if(!isInside) {
								document.body.removeChild(dmBox);
								document.body.removeEventListener('click', destroyDmBox);
							}
						}

						setTimeout(() => {
							document.body.addEventListener('click', destroyDmBox);
						}, 100);
					}
				}

				i++;
			});
		});
	}

	return h;
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

function updateLastActive() {
	getSession((session) => {
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
				json = {};
			}

			if(json.bannedDeruc) {
				alert('Вы забанены на ДеРуК. Большинство функций расширения будут недоступны');

				return;
			}

			let postreq = new XMLHttpRequest();
			postreq.open("POST", "https://deruc.glitch.me/api/status/ping", true);
			postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			// send with our session in the request body
			postreq.send(JSON.stringify({ session: session }));
		}
	});
}

function createDm (dm, json) {
	let dmHolder = document.createElement('div');
	let dmAvatar = document.createElement('img');
	dmHolder.appendChild(dmAvatar);
	let dmContent = document.createElement('div');
	dmHolder.appendChild(dmContent);

	dmHolder.style.display = 'flex';
	dmHolder.style.alignItems = 'flex-start';
	dmHolder.style.textAlign = 'left';
	dmHolder.style.marginBottom = '10px';
	dmAvatar.width = 45;
	dmAvatar.height = 45;
	dmAvatar.style.borderRadius = '5px';
	dmAvatar.style.boxShadow = '0 0 0 1px rgba(77, 151, 255, 25)';
	dmAvatar.style.marginRight = '5px';
	dmAvatar.style.marginTop = '10px';
	if(json.profile && json.profile.images) 
		dmAvatar.src = json.profile.images["50x50"];

	let dmAuthor = document.createElement('a');
	dmContent.appendChild(dmAuthor);
	let dmBubble = document.createElement('div');
	dmContent.appendChild(dmBubble);

	dmContent.style.width = '100%';
	dmAuthor.style.color = '#4d97ff';
	dmAuthor.style.fontWeight = 'bold';
	dmAuthor.style.margin = '0';
	dmAuthor.href = "/users/" + json.username;
	dmBubble.style.background = 'white';
	dmBubble.style.padding = '10px';
	dmBubble.style.boxSizing = 'border-box';
	dmBubble.style.borderRadius = '0 5px 5px 5px';
	dmBubble.style.border = '1px solid rgba(0, 0, 0, 0.1)';
	dmAuthor.innerText = json.username || "";

	let dmText = document.createElement('p');
	dmBubble.appendChild(dmText);
	let dmDate = document.createElement('p');
	dmBubble.appendChild(dmDate);

	dmText.innerText = dm.content;
	dmText.style.margin = '0 0 5px 0';
	dmDate.style.color = '#b3b3b3';
	dmDate.style.fontSize = '10px';
	dmDate.style.margin = '0';
	dmDate.innerText = `${compareTime(dm.date)} minutes ago`;

	return dmHolder;
}

function openDmWith (session, target) {
	let dmBox = document.createElement('div');
	dmBox.style.position = 'absolute';
	dmBox.style.zIndex = 999;
	dmBox.style.background = 'white';
	dmBox.style.borderRadius = '10px';
	dmBox.style.width = '350px';
	dmBox.style.height = '400px';
	dmBox.style.overflow = 'hidden';
	dmBox.style.boxShadow = '0 0 0 5px rgb(26 160 216 / 40%)';
	let dmHeader = document.createElement('h2');
	dmHeader.innerText = `Личные Сообщения с ${target}`;
	dmHeader.style.background = 'rgb(26, 160, 216)';
	dmHeader.style.margin = 0;
	dmHeader.style.padding = '10px';
	dmHeader.style.textShadow = 'none';
	dmHeader.style.color = 'white';
	dmHeader.style.fontSize = '16px';
	dmBox.appendChild(dmHeader);
	let dmContent = document.createElement('div');
	dmContent.style.height = 'calc(100% - 80px)';
	dmContent.style.overflow = 'auto';
	dmContent.style.boxSizing = 'border-box';
	dmContent.style.padding = '10px';
	dmContent.style.display = 'flex';
	dmContent.style.flexDirection = 'column';
	dmBox.appendChild(dmContent);

	let dmSend = document.createElement('div');
	dmSend.style.display = 'flex';
	dmSend.style.alignItems = 'flex-end';
	dmSend.style.justifyContent = 'center';
	let dmInput = document.createElement('input');
	dmInput.placeholder = `Написать ${target}`;
	dmInput.style.marginBottom = '10px';
	dmInput.marginRight = '5px';
	let dmButton = document.createElement('button');
	dmButton.classList.add('button');
	dmButton.innerText = 'Отправить';
	dmButton.style.marginBottom = '10px';
	dmButton.style.height = '28px';
	dmButton.style.padding = '0 5px';
	dmSend.appendChild(dmInput);
	dmSend.appendChild(dmButton);
	dmBox.appendChild(dmSend);

	if(!session.user) return;

	let scrolled = false;

	let updateInterval;

	getCachedProfileData(session.user.username, (jsonSelf) => {
		getCachedProfileData(target, (jsonTarget) => {
			dmButton.onclick = () => {
				if(!dmInput.value.trim()) return;
		
				let postreq = new XMLHttpRequest();
				postreq.open("POST", "https://deruc.glitch.me/api/dm/send", true);
				postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
				postreq.send(JSON.stringify({ session: session, target: target, content: dmInput.value }));
				postreq.onreadystatechange = () => {
					if(postreq.status == 200 && postreq.readyState === 4) {
						scrolled = false;
						refreshMessages();
					}
				}
				
				dmInput.value = "";
			}

			refreshMessages();

			updateInterval = setInterval(() => {
				if(dmBox.parentElement == document.body) {
					refreshMessages();
				} else {
					clearInterval(updateInterval);
					updateInterval = null;
				}
			}, 8000);

			function refreshMessages() {
				let postreq = new XMLHttpRequest();
				postreq.open("POST", "https://deruc.glitch.me/api/dm/get", true);
				postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
				// send with our session and target username in the request body
				postreq.send(JSON.stringify({ session: session, target: target, amount: 16 }));
				postreq.onreadystatechange = () => {
					if(postreq.status == 200 && postreq.readyState === 4) {
						let json;
						try {
							json = JSON.parse(postreq.responseText);
						} catch {
							json = [];
						}

						let dmHeightDiff = dmContent.scrollHeight - (dmContent.scrollTop + dmContent.clientHeight) ;

						dmContent.innerHTML = '';
						json.forEach(dm => {
							let authorJson = {}
							if(dm.author == jsonSelf.username) authorJson = jsonSelf;
							else if(dm.author == jsonTarget.username) authorJson = jsonTarget;
							let dmElem = createDm(dm, authorJson);
							dmContent.appendChild(dmElem);
						});

						if(!scrolled || dmHeightDiff <= 10) {
							dmContent.scrollTop = dmContent.scrollHeight;
							scrolled = true;
						}

						if(json.length == 0) dmContent.innerHTML = `<p>В этом лс пока ничего нет. Напишите первое сообщение!</p>`;
					} else if(postreq.status == 403) {
						dmContent.innerHTML = `<p>Этого пользователя нет в ДеРуК. Хотите общаться с ним лично? Пригласите его в сообщество!</p>`;
					} else if(postreq.status == 401) {
						dmContent.innerHTML = `<p>У вас недостаточно прав на просмотр этого ЛС!</p>`;
					}
				}
			}
		});		
	});

	return dmBox;
}

function getCachedProfileData(username, callback) {
	if(!window.derucCachedUsers) window.derucCachedUsers = {}
	if(window.derucCachedUsers[username]) {
		callback(window.derucCachedUsers[username]);
	} else {
		let getreq = new XMLHttpRequest();
		getreq.open("GET", "https://api.scratch.mit.edu/users/" + username, true);
		getreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		getreq.send();
		getreq.onreadystatechange = function() {
			if (getreq.readyState == 4 && getreq.status === 200) {
				let jsonSelf;
				try {
					jsonSelf = JSON.parse(getreq.responseText);
				} catch {
					jsonSelf = {}
				}

				window.derucCachedUsers[username] = jsonSelf;
				callback(jsonSelf);
			}
		}
	}
}

// initial stuff
updateLastActive();
setInterval(() => {updateLastActive()}, 60000);

let commentDmInterval = setInterval(() => {
	let h = commentDms();
	if(!h) {
		clearInterval(commentDmInterval);
		commentDmInterval = null;
	}
}, 2000);

let usernavInterval = setInterval(() => {
	userNav();
	if(navLoaded) {
		clearInterval(usernavInterval);
		usernavInterval = null;
	}
}, 500);

setTimeout(() => {updateProfile()}, 500);
window.onload = () => {
	updateProfile();
	staticPages();
	createAccount();
};