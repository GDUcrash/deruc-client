function run() {
	var username = document.querySelector('.user-name').innerText;
	var derucpanelstyle = `
	<style>
		.box-content {
			text-align:left !important;
			padding:20px !important;
		}
	</style>
	`;
	
	var derucpanel = `
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

//document.onLoad = run();
setTimeout(run, 200);