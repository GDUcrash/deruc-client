const months = [
	'января', 'февраля', 'марта', 'апреля',
	'мая', 'июня', 'июля', 'августа',
	'сентября', 'октября', 'ноября', 'декабря'
];

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
			} else if(response.invisible) {
				// banned in scratch
				onlinetext.innerText += ` • Невидимка`;
				onlinetext.style.color = '#cfcfcf';
			} else {
				// calculate time difference
				let onlinedifference = compareTime(response.lastActive);
				if(onlinedifference <= 1) {
					onlinetext.innerText += ` • В Сети`;
					onlinetext.style.color = '#00aa44';
				}
				else {
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

						// add status text
						if(!document.querySelector('#derucMyStatus')) {
							let statusText;

							if(session.user.username == username) {
								//Invis checkbox
								document.querySelector('.group').innerHTML += `<input type="checkbox" style="margin-left: 8px" id="derucInvisible"/> Невидимка`;
								document.querySelector('#derucInvisible').checked = response.invisible;
								document.querySelector('#derucInvisible').onchange = () => {
									let postreq = new XMLHttpRequest();
										postreq.open("POST", "https://deruc.glitch.me/api/status/invisible", true);
										postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
										postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
										// send with our session in the request body
										postreq.send(JSON.stringify({ 
											session: session, 
											invisible: document.querySelector('#derucInvisible').checked 
										}));
								}

								//Status Input
								statusText = document.createElement('span');
								statusText.id = 'derucMyStatus';
								statusText.classList.add('group');
								statusText.innerText = 'Статус: ';

								let statusInput = document.createElement('input');
								statusInput.placeholder = 'Сделайте себе крутой статус!';
								statusInput.style.marginBottom = 0;
								statusInput.id = "derucStatusInput";
								
								statusText.appendChild(statusInput);
							} else if(response.status) {
								statusText = document.createElement('span');
								statusText.id = 'derucMyStatus';
								statusText.classList.add('group');
								statusText.innerText = `Статус: ${response.status}`;
							}

							if(statusText) {
								document.querySelector('.location').innerHTML = statusText.outerHTML + document.querySelector('.location').innerHTML;
							
								if(document.querySelector('#derucStatusInput')) {
									let statusInput = document.querySelector('#derucStatusInput');
									statusInput.value = response.status;
									statusInput.onchange = () => {
										let postreq = new XMLHttpRequest();
										postreq.open("POST", "https://deruc.glitch.me/api/status/set", true);
										postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
										postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
										// send with our session in the request body
										postreq.send(JSON.stringify({ session: session, status: statusInput.value }));
									}
									statusInput.id = '';
								}
							}
						}

						// add dm button
						if(!document.querySelector('#deruc-dm'))
							document.querySelector('#follow-button').innerHTML = `
							<div class="follow-button button following" id="deruc-dm">
								<span class="unfollow text">Написать в ЛС</span>
							</div>` + document.querySelector('#follow-button').innerHTML;


						if(
							((self.role == 'moderator' && response.role == 'member') || 
							(self.role == 'admin' && response.role != 'admin')) &&
							!document.querySelector('#deruc-ban')
						) {
							//add a ban/unban button
							document.querySelector('.footer').innerHTML = `
							<div class="action" style="color: #777; font-size: 12px;
							position: absolute; right: 128px; top: 0px; cursor: pointer;">
								<span class="text black" id="deruc-ban">${response.bannedDeruc ? 'Разбанить в DeRuC' : 'Забанить в DeRuC'}</span>
							</div>
							` + document.querySelector('.footer').innerHTML;
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

						// on dm button click
						if(document.querySelector('#deruc-dm')) {
							document.querySelector('#deruc-dm').onclick = (e) => {
								openDmWith(session, username, e);
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

					let newsreq = new XMLHttpRequest();
					newsreq.open("GET", "https://deruc.glitch.me/api/news?index=0", true);
					newsreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
					newsreq.send();
					newsreq.onreadystatechange = () => {
						if (newsreq.readyState != 4) return;

						let json;
						try {
							json = JSON.parse(newsreq.responseText);
						} catch {
							json = null;
						}

						if(!json) return;

						let maxid = 0;
						json.forEach(news => {
							if(news.id > maxid) maxid = news.id;
						});

						localStorage.setItem('derucNewsLastId', maxid);
					}
				}
			}
		}
	});
}

let navLoaded = false;
function userNav () {
	getSession((session) => {
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
				json = null;
			}

			if(!json || json.bannedDeruc) return;

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

				let accountDmBadge = document.createElement('div');
				accountDmBadge.style.position = 'absolute';
				accountDmBadge.style.top = '10px';
				accountDmBadge.style.left = '10px';
				accountDmBadge.style.width = '10px';
				accountDmBadge.style.height = '10px';
				accountDmBadge.style.borderRadius = '10px';
				accountDmBadge.style.background = '#fcba03';
				accountDmBadge.style.boxShadow = '0 0 0 5px rgb(252 186 3 / 40%)';
				accountDmBadge.style.display = 'none';

				let accountNav = document.querySelector('.user-name') || document.querySelector('.account-nav');
				accountNav.style.position = 'relative';
				accountNav.appendChild(accountDmBadge);
	
				
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
						if(jsonSelf.count && jsonSelf.count > 0) {
							derucUnreadDmsBadge.style.display = 'inline';
							accountDmBadge.style.display = '';
						}
					}
				}
	
				document.querySelector('#derucUnreadDms').onclick = () => {
					window.location.pathname = '/dms';
				}
			}
		}
	});
}

function staticPages () {
	if(document.querySelector('.lists')) {
		document.querySelector('.lists').children[1].innerHTML += `
		<dd><a href="/deruc-rules"><span>Кодекс Чести ДеРуК</span></a></dd>
		<dd><a href="/deruc-members"><span>Участники ДеРуК</span></a></dd>`;
	}

	if(document.querySelector('.footer-col')) {
		document.querySelector('.footer-col').children[1].children[1].innerHTML += `
		<li><a href="/deruc-rules">Кодекс Чести ДеРуК</a></li>
		<li><a href="/deruc-members">Участники ДеРуК</a></li>`;
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
							<p>Если вы хотите прочитать старые сообщения, наведите мышь на комментарий определённого пользователя и нажмите "Написать в ЛС"</p>
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
									openDmWith(session, uk, e);
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
	}

	if(window.location.pathname == '/deruc-members') {
		
		ifDerucUser(() => {
			document.querySelector('.box-head').innerHTML = `<h2>Участники ДеРуК</h2>`;
			document.querySelector('.box-content').innerHTML = '';
			let getreq = new XMLHttpRequest();
			getreq.open("GET", "https://deruc.glitch.me/api/users", true);
			getreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			getreq.send();
			getreq.onreadystatechange = function() {
				if (getreq.readyState == 4 && getreq.status === 200) {
					let jsonSelf;
					try {
						jsonSelf = JSON.parse(getreq.responseText);
					} catch {
						jsonSelf = null;
					}

					if(!jsonSelf) return;

					jsonSelf.usernames.forEach(username => {
						let userLink = document.createElement('a');
						userLink.href = `/users/${username}`;

						let userButton = document.createElement('button');
						userButton.style.width = '340px';
						userButton.style.display = 'inline-flex';
						userButton.style.flexDirection = 'row-reverse';
						userButton.style.justifyContent = 'center';
						userButton.style.alignItems = 'center';
						userButton.style.height = '50px';
						userButton.innerText = username;
						userLink.appendChild(userButton);

						let userAvatar = document.createElement('img');
						userAvatar.style.borderRadius = '8px';
						userAvatar.style.marginRight = '10px';
						userAvatar.style.setProperty('padding', '0', 'important');
						userAvatar.height = 32;
						userAvatar.width = 32;
						getCachedProfileData(username, (json) => {
							userAvatar.src = json.profile.images['32x32'];
						});
						userButton.appendChild(userAvatar);

						document.querySelector('.box-content').appendChild(userLink);
					});
				}
			}
		});
	}

	if(window.location.href.includes('/accounts/settings')) {
		if(document.querySelector('#change-country')) {
			ifDerucUser((session) => {
				document.querySelector('.box-content').innerHTML += `
				<p><a href="#" id="derucDeleteAccount">Я хочу удалить аккаунт ДеРуК</a></p>`;
				document.querySelector('#derucDeleteAccount').onclick = () => {
					if(confirm('Вы действительно хотите удалить свой ДеРуК аккаунт? Ваш Скретч аккаунт НЕ будет удалён')) {
						if(confirm('Вы уверены? Вся репутация которую вы накопили, личные сообщения и статусы будут потеряны')) {
							if(confirm('У Вас есть последний шанс изменить свой мнение. Нажимая "ОК" вы понимаете и соглашайтесь с тем что ваш ДеРуК аккаунт будет удалён.')) {
								let postreq = new XMLHttpRequest();
								postreq.open("POST", "https://deruc.glitch.me/api/deleteAccount", true);
								postreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
								postreq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
								// send with our session in the request body
								postreq.send(JSON.stringify({ session: session }));
								postreq.onreadystatechange = () => {
									if(postreq.status == 200) {
										postreq.onreadystatechange = null;
										alert('Аккаунт Удалён');
										window.location.reload();
									} else if(postreq.status == 403) {
										alert('Ошибка, аккаунта не существует!');
									} else if(postreq.status == 401) {
										alert('Ошибка, отказано в доступе!');
									}
								}
							} 
						} 
					} 
				}
			})
		}
	}
}

function commentDms (session) {
	let h = false;
	if(window.location.href.includes('/users/') || window.location.href.includes('/projects/') || 
	window.location.href.includes('/studios/') || window.location.href.includes('/messages')) {
		h = true;

		let i = 0;
		let classn = 'comment';
		if(window.location.href.includes('/messages')) classn = 'mod-comment-message';

		Object.values(document.getElementsByClassName(classn)).forEach(comment => {
			if(comment.querySelector('textarea')) return;

			let username = comment.querySelector('.name') || comment.querySelector('.username');
			if(username){
				if(session.user.username != username.innerText) {
					let li = parseInt(i);
					if(comment.querySelector('.actions-wrap')) {
						if(!comment.querySelector('.derucActionButton'))
							comment.querySelector('.actions-wrap').innerHTML += `
							<span class="actions report derucActionButton" id="derucCommentDm${li}">Написать в ЛС</span>
							`;
					}

					if(comment.querySelector('.action-list')) {
						if(!comment.querySelector('.derucActionButton')) {
							let sp = document.createElement('span');
							sp.style = "margin-right: 1rem; opacity: .5; cursor: pointer; font-size: .75rem; font-weight: 500;"
							sp.className = "derucActionButton";
							sp.id = `derucCommentDm${li}`;
							sp.innerHTML = '<span>Написать в ЛС</span>';
							comment.querySelector('.action-list').insertBefore(sp, comment.querySelector('.action-list').children[0]);
						}
					}

					if(document.querySelector(`#derucCommentDm${li}`)) {
						document.querySelector(`#derucCommentDm${li}`).onclick = (e) => {
							openDmWith(session, username.innerText, e);
						}
					}
				}
			}

			let commentContent = null;
			if(comment.querySelector('.content')) {
				commentContent = comment.querySelector('.content');
			}
			else if(comment.querySelector('.emoji-text')) {
				commentContent = comment.querySelector('.emoji-text');
			}

			if(commentContent.classList.contains('deruc-comment-processed')) return;

			if(commentContent) {
				commentContent.classList.add('deruc-comment-processed');
				let imgChecker = commentContent.innerText.split(':img[').join(']:img').split(']:img');
				let even = 1;
				let resultString = '';

				let imgUrls = [];
				imgChecker.forEach(tag => {
					even *= -1;
					let isEven = even > 0;
					if(!isEven && tag.trim()) {
						if(!resultString.endsWith(' ')) resultString += ' ';
						resultString += tag;
					}

					if(isEven) imgUrls.push(tag);
				});

				if(imgUrls != '') {
					commentContent.innerText = resultString;
					
					let imageHolder = document.createElement('div');
					imageHolder.style.width = '100%';
					commentContent.appendChild(imageHolder);

					imgUrls.forEach(img => {
						let imgDecoded;
						try { imgDecoded = atob(img) } catch { }

						if(!imgDecoded) return;
						checkImage(imgDecoded, (isValid) => {
							if(isValid) {
								let imgElem = document.createElement('img');
								imgElem.src = imgDecoded;
								imgElem.style.maxHeight = '200px';
								imgElem.style.maxWidth = '100%';
								imgElem.style.marginRight = '5px';
								imgElem.style.borderRadius = '8px';
								imgElem.style.cursor = 'pointer';
								imgElem.onclick = () => {
									window.open(imgDecoded, 'blank')
								}

								imageHolder.appendChild(imgElem);
							}
						});
					});
				}
			}

			i++;
		});
	}

	return h;
}

function writeCommentBox () {
	let done = false;
	if(!window.location.href.includes('/users/') && !window.location.href.includes('/projects/') && !window.location.href.includes('/studios/')) return true;
	
	if(!document.querySelector('#derucAddImage')) {
		done = true;
		if(window.location.href.includes('/users/')) {
			document.querySelector('#main-post-form').children[1].innerHTML += `
			<div class="button small grey" id="derucAddImage"> <a> Добавить Изображение </a></div>`;
		} else {
			let newButton = document.createElement('button');
			newButton.className = 'button compose-cancel';
			newButton.innerHTML = `<span> Добавить Изображение </span>`;
			newButton.id = 'derucAddImage';
			newButton.style.marginLeft = '2rem';

			let elBefore = document.querySelector('.compose-bottom-row .compose-limit');
			document.querySelector('.compose-bottom-row').insertBefore(newButton, elBefore);
		}

		document.querySelector('#derucAddImage').onclick = () => {
			let url = prompt(
				'Введите ссылку на изображение, которое хотите вставить. ' +
				'Вот отличные места для хоста изображений: cubeupload.com, discord.com, imgbb.com'
			);

			checkImage(url, (isValid) => {
				if(!isValid) return alert('Ошибка! Пожалуйста, введите правильный URL изображения!');

				let commentInput = document.querySelector('#main-post-form textarea') || document.querySelector('#frc-compose-comment-3392903');
				let inpCursor = commentInput.selectionStart;
				commentInput.value = commentInput.value.slice(0, inpCursor) + 
									 `:img[${btoa(url)}]:img` + 
									 commentInput.value.slice(inpCursor, commentInput.value.length);

				// indent
				if(!window.location.href.includes('/users/'))
					setTimeout(() => { 
						alert('ВНИМАНИЕ! Перед тем как отправлять комментарий, измените как-то текст Вашего сообщения. Иначе, изображение, которое вы добавили не загрузится!');
					}, 100);
			});
		}
	}

	return done;
}

function news () {
	ifDerucUser(() => {
		let lastid = parseInt(localStorage.getItem('derucNewsLastId') || 0);
	
		let newsreq = new XMLHttpRequest();
		newsreq.open("GET", "https://deruc.glitch.me/api/news?index=" + lastid, true);
		newsreq.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		newsreq.send();
		newsreq.onreadystatechange = () => {
			if (newsreq.readyState != 4) return;
	
			let json;
			try {
				json = JSON.parse(newsreq.responseText);
			} catch {
				json = null;
			}
	
			if(!json) return;
	
			let newsBox = document.createElement('div');
			newsBox.style.position = 'fixed';
			newsBox.style.zIndex = 999;
			newsBox.style.bottom = '48px';
			newsBox.style.left = '48px';
			newsBox.style.width = '400px';
			document.body.appendChild(newsBox);
	
			let maxid = 0;
			json.forEach(news => {
				if(news.id > maxid) maxid = news.id;
	
				let newsPiece = document.createElement('div');
				newsPiece.style.padding = '16px';
				newsPiece.style.background = 'white';
				newsPiece.style.borderRadius = '5px';
				newsPiece.style.boxShadow = '0 5px 15px rgba(0,0,0,.4)';
				newsPiece.style.display = 'flex';
				newsPiece.style.alignItems = 'flex-start';
				newsPiece.style.marginTop = '20px';
				newsBox.appendChild(newsPiece);
				
				let newsIcon = document.createElement('img');
				newsIcon.src = 'https://cdn.glitch.com/3fd58b8e-4e75-48cd-b3a0-ace05055f727%2Fnews.png?v=1631646116099';
				newsIcon.style.marginRight = '10px';
				newsPiece.appendChild(newsIcon);
	
				let newsContent = document.createElement('div');
				newsPiece.appendChild(newsContent);
	
				let newsHeading = document.createElement('h3');
				newsHeading.style.color = '#222';
				newsHeading.innerText = news.title;
				newsContent.appendChild(newsHeading);
	
				let newsText = document.createElement('p');
				newsText.style.color = '#333';
				newsText.innerText = news.content;
				newsContent.appendChild(newsText);
	
				let newsButton = document.createElement('button');
				newsButton.classList.add('button');
				newsButton.innerHTML = '<span>Прочитал</span>';
				newsButton.onclick = () => { 
					newsPiece.parentElement.removeChild(newsPiece); 
					if(newsBox.innerHTML.trim() == '') 
						newsBox.parentElement.removeChild(newsBox);
				}
				newsContent.appendChild(newsButton);
			});
	
			localStorage.setItem('derucNewsLastId', maxid);
		}
	})
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

			if(json.invisible) {
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
	dmText.style.color = '#575e75';
	dmDate.style.margin = '0';

	// calculate time difference
	let onlinedifference = compareTime(dm.date);
	if(onlinedifference <= 1) {
		dmDate.innerText = `Прямо Сейчас`;
	}
	else {
		if(onlinedifference < 60) dmDate.innerText = `${onlinedifference} минут назад`;
		else if(onlinedifference < 60*24) dmDate.innerText = `${Math.floor(onlinedifference/60)} часов назад`;
		else dmDate.innerText = `${dm.date.day} ${months[dm.date.month]} ${dm.date.year} года`;
	}

	return dmHolder;
}

function openDmWith (session, target, e) {
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
	dmInput.style.background = 'white';
	dmInput.style.color = '#575e75';
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

						if(json.length == 0) dmContent.innerHTML = `<p style="color: #575e75;">В этом лс пока ничего нет. Напишите первое сообщение!</p>`;
					} else if(postreq.status == 403) {
						dmContent.innerHTML = `<p style="color: #575e75;">Этого пользователя нет в ДеРуК. Хотите общаться с ним лично? Пригласите его в сообщество!</p>`;
					} else if(postreq.status == 401) {
						dmContent.innerHTML = `<p style="color: #575e75;">У вас недостаточно прав на просмотр этого ЛС!</p>`;
					}
				}
			}
		});		
	});

	dmBox.onkeypress = (e) => {
		if(e.keyCode == 13) {
			dmButton.click();
		}
	}

	setTimeout(() => {dmInput.focus()}, 100);


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

function ifDerucUser (callback) {
	getSession((session) => {
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
				json = null;
			}
	
			if(!json || json.bannedDeruc) return;

			callback(session, json);
		}
	});
}

function checkImage(url, callback) {
	let image = new Image();
	image.onload = () => {
		if (image.width > 0) callback(true);
		else callback(false);
	}
	image.onerror = () => {
		callback(false);
	}
	image.src = url;
}

// initial stuff
updateLastActive();
setInterval(() => {updateLastActive()}, 60000);

// check for user and if yes, update dm buttons
ifDerucUser((session, user) => {
	let commentDmInterval = setInterval(() => {
		let h = commentDms(session);
		if(!h) {
			clearInterval(commentDmInterval);
			commentDmInterval = null;
		}
	}, 2000);

	let commentBoxInterval = setInterval(() => {
		let h = writeCommentBox();
		if(h) {
			clearInterval(commentBoxInterval);
			commentBoxInterval = null;
		}
	}, 2000);
});

//setTimeout(() => {updateProfile()}, 500);

if(navigator.userAgent.includes('Firefox')) {
	updateProfile();
	staticPages();
	createAccount();
	userNav();
	news();
} else {
	window.onload = () => {
		updateProfile();
		staticPages();
		createAccount();
		userNav();
		news();
	}
}
