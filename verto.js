
phone = {};


if (navigator.serviceWorker !== undefined){
	var sw = navigator.serviceWorker.register('sw.js');
	sw.then(function(serviceWorker){
		phone.sw = serviceWorker;
	});
	navigator.serviceWorker.addEventListener('message', function(event) {
		var data = event.data.split(';',2);
		var action = data[0];
		var callID = data[1];
		if (phone.curr_call && (phone.curr_call.callID == callID))
		{
			switch (action) {
				case "answer":
					phone.curr_call.answer({
						useVideo: false,
						useStereo: false			
					});
					break;
				case "decline":
					phone.curr_call.hangup();
					break;
			}
		}
	}); 
}


phone.common = {
	appendNumbersButton: function(elem, numbers, name){
		for (var i=0; i<numbers.length; i++)
		{
			var a = $("<button></button>").addClass("btn");			
			a.addClass("btn-xs");
			a.addClass("btn-default");
			a.attr("data-toggle", "modal");
			a.attr("data-target", "#"+phone.ui.numberPopup.panel.attr("id"));
			
			a.text(numbers[i]);
			elem.append(a);
			
			a.click(function(num,name){
				return function(){
					phone.ui.numberPopup.num.val(num);
					phone.ui.numberPopup.name.text(name);
				}
			}(numbers[i],(name ? name : "")));
					
					
			if (i<numbers.length-1){
				elem.append(" ");
			}
		}
	},
	secondsToString: function(sec){
		var addZero = function(t){
			if (t<10) return "0"+t.toString();
			return t.toString();
		}
		var h=Math.floor(sec/3600);	
		var mh=sec%3600;    
		var m=Math.floor(mh/60);    
		var s=mh%60;
		
		if (h != 0){
			return h.toString()+":"+addZero(m)+":"+addZero(s);
		}
		else
		{
			return addZero(m)+":"+addZero(s);
		}
	},
	
	
	
	formatDate: function (d){
		var months=["СЏРЅРІР°СЂСЏ", "С„РµРІСЂР°Р»СЏ", "РјР°СЂС‚Р°", "Р°РїСЂРµР»СЏ", "РјР°СЏ", "РёСЋРЅСЏ", "РёСЋР»СЏ", "Р°РІРіСѓСЃС‚Р°", "СЃРµРЅС‚СЏР±СЂСЏ", "РѕРєС‚СЏР±СЂСЏ", "РЅРѕСЏР±СЂСЏ", "РґРµРєР°Р±СЂСЏ"];
		var addZero = function(t){
			if (t<10) return "0"+t.toString();
			return t.toString();
		}
		return addZero(d.getHours())+":"+addZero(d.getMinutes())+":"+addZero(d.getSeconds())+" "+d.getDate().toString()+" "+months[d.getMonth()]+ " " +  d.getFullYear().toString();	
	},
	
	formatTime: function (d){
		var addZero = function(t){
			if (t<10) return "0"+t.toString();
			return t.toString();
		}
		return addZero(d.getHours())+":"+addZero(d.getMinutes())+":"+addZero(d.getSeconds());	
	}
	
}

phone.ui = {
	//webCamTag:'webcam',
	auth:{
		form: $('#phone-dialog-auth-form'),
		dialog: $('#phone-dialog-auth'),
		login: $('#phone-dialog-auth-login'),
		password: $('#phone-dialog-auth-passwd'),		
		hostName: $('#phone-dialog-auth-hostName'),
		wsURL: $('#phone-dialog-auth-wsURL'),
		error: $('#phone-dialog-auth-error')
	},
	page: $("#phone-page"),
	
	panelPhone: {
		panel: $("#phone-panel"),
		panelClass: $(".phone-panel-states"),
		userStatus: $('#phone-panel-user-status'),
		
		default:{
			panel: $('#phone-panel-default'),
			number:$('#phone-panel-number'),
			button:$('#phone-panel-dialpad-call-btn')
		},
		
		outgoing:{
			panel: $('#phone-panel-outgoing'),
			buttonCancel: $('#phone-panel-outgoing-cancel-btn')			
		},
		
		incoming:{
			panel:$('#phone-panel-incoming'),
			name: $('#phone-panel-incoming-name'),
			number: $('#phone-panel-incoming-number'),
			buttonAnswer:$('#phone-panel-answer-btn'),
			buttonDecline:$('#phone-panel-decline-btn')			
		},
		talking:{
			talkingName: $("#phone-panel-talking-name"),
			talkingNumber: $("#phone-panel-talking-number"),
			panel:$('#phone-panel-talking'),
			number:$("#phone-panel-transfer-number"),
			numberDataList:$("#phone-panel-transfer-number-datalist"),
			buttonsTone: $(".phone-dialbtn[data-input-number='#phone-panel-transfer-number']"),
			buttonMute: $("#phone-panel-mute-btn"),
			buttonHangup:$("#phone-panel-hangup-btn"),
			buttonHangupDND:$("#phone-panel-hangup-btn-dnd"),
			buttonTransfer:$("#phone-panel-transfer-btn"),
			buttonTransfer2:$("#phone-panel-transfer-2-btn"),
			buttonTransferCancel:$("#phone-panel-transfer-cancel-btn")
			
		}
	},
	usersList: $("#phone-users"),
	view:{
		checkboxes: $(".phone-vw-chk"),
		groupsCheckboxesUl: $("#phone-vw-ul-chk-groups")
	},
	
	
	callList: $("[name=phone-call-list]"),
	
	phoneStatusTableBody: $("#phone-status-table-body"),
	myNumber: $("#phone-my-number"),
	myName: $("#phone-my-name"),
	tabs:{
		tabs: $("#phone-main-tabs"),
		navbar:$("#phone-main-navbar"),
		navbarUi: $("#phone-main-navbar-ui")
	},
	numberPopup: {
		panel: $("#phone-u-number-popup"),
		num: $("#phone-u-number-popup-num"),
		name: $("#phone-u-number-popup-name"),
		buttonCall: $("#phone-u-number-popup-call-btn"),
		buttonTransfer: $("#phone-u-number-popup-transrer-btn"),
		buttonTransfer2: $("#phone-u-number-popup-transrer2-btn")
	},
	
	history:{
		linkTab: $("#phone-tab-button-history"),
		missedCallsCount: $("#phone-tab-history-missed-calls"),
		table:$("#phone-call-history-table"),
		tableBody:$("#phone-call-history-table-body")
	},
	
	settings:{
		ring: {
			get: function(){
				return $("#phone-dialog-settings-ring").val();
			},
			set: function(val){
				$("#phone-dialog-settings-ring").val(val);
				$("#phone-dialog-settings-ring").change();
			}
		},
		
		ringVolume:{
			get: function(){				
				return document.getElementById("phone-dialog-settings-ring-preview").volume;
				 
			},
			set: function(val){
				document.getElementById("phone-dialog-settings-ring-preview").volume = val;
			}
		},
		
		
		useStun: {
			get: function(){
				return $("#phone-dialog-settings-use-stun").prop("checked");
			},
			set: function(val){
				$("#phone-dialog-settings-use-stun").prop("checked", val);
			}
		},
		excludeNetworks: {
			get: function(){
				return $("#phone-dialog-settings-exclude-networks").val().replace(/\s+/g, "").split(",");
			},
			set: function(val){
				$("#phone-dialog-settings-exclude-networks").val(val ? val.join(", ") : '');
			}		
		},
		playSoundEndCall: {
			get: function(){
				return $("#phone-dialog-settings-play-sound-end-call").prop("checked");
			},
			set: function(val){
				$("#phone-dialog-settings-play-sound-end-call").prop("checked", val);
			}
		},
	},
	userGroupsMembers: $('#phone-dialog-user-groups-list'),
	reconnection: $('#phone-u-w-reconnection'),
	
	fn:{
		resizeFrames:function(){
			window.scrollTo(0,0);
			$('iframe').each(function(i,frame){
				frame.style.width = '';
				frame.style.height = '';
				var e_frame = $(frame);
				
				var e_parent = e_frame.parent();
				var parent = e_parent[0];
				
				var css_parent = getComputedStyle(parent);
				var css_frame = getComputedStyle(frame);
				
				var rects_parent = parent.getClientRects();
				
				if (rects_parent.length>0)
				{				
					var rect_parent = rects_parent[0];
					var f_width = Math.floor(window.innerWidth-rect_parent.left-parseInt(css_parent.paddingLeft)-parseInt(css_parent.paddingRight)-parseInt(css_frame.borderLeftWidth)-parseInt(css_frame.borderRightWidth)-parseInt(css_frame.marginLeft)-parseInt(css_frame.marginRight));			
					var f_height = Math.floor(window.innerHeight-rect_parent.top-parseInt(css_parent.paddingTop)-parseInt(css_parent.paddingBottom)-parseInt(css_frame.borderTopWidth)-parseInt(css_frame.borderBottomWidth)-parseInt(css_frame.marginTop)-parseInt(css_frame.marginBottom));					
					if ((f_width>0) && (f_height>0)){
						frame.style.width = f_width+'px';
						frame.style.height = f_height+'px';
					}
				}
			});
		}
	}
};

phone.vw = {
	
	default:{
		userListHideUnavail: true,
		userListShowStateDuration: true,
		userListgroup:{},
		userListgroupOrder:{},
	},
	current:{},
	load:function(){
		try
		{
			phone.vw.current = {};
			if (localStorage.getItem("view:"+phone.verto.options.login) != null)
			{
				phone.vw.current = JSON.parse(localStorage.getItem("view:"+phone.verto.options.login));
			}
		}
		catch (e)
		{			
		}
		for (var key in phone.vw.default){
			if (phone.vw.current[key] === undefined){
				phone.vw.current[key] = phone.vw.default[key];
			}
		}		
		localStorage.setItem("view:"+phone.verto.options.login, JSON.stringify(phone.vw.current));
		
		var vw = phone.vw.current;
		
		
		phone.ui.view.checkboxes.each(function(i,elem){
			var e = $(elem);
			var d = e.data();

			if ((d.vwKey !== undefined) && (vw[d.vwKey] !== undefined)){
				var value = vw[d.vwKey];
				e.prop("checked", value);
			}
		});
		phone.ui.view.groupsCheckboxesUl.empty();
		
	},
	setValue: function(key, value){
		phone.vw.current[key] = value;
		switch (key) {
			case "userListHideUnavail":
				$(".phone-user-tr-user-network-status--1,.phone-user-tr-user-network-status-0,.phone-user-tr-user-admin-status-0")[value ? 'hide' : 'show']();
				break;
			case "userListShowStateDuration":
				$(".phone-span-state-duration")[value ? 'show':'hide']();
				break;
			default:
				break;
	
		}
	},
	save:function(){
		localStorage.setItem("view:"+phone.verto.options.login, JSON.stringify(phone.vw.current));
	}
}

phone.sounds = {
	endCall: new Audio ("./sounds/end_call.mp3"),
	play: function (s){
		if (phone.sounds.enable){
			phone.sounds[s].currentTime = 0;
			phone.sounds[s].play();
		}
	},
	enable: true
}
if (typeof phone.sounds.endCall.setSinkId !== "undefined")
{
    phone.sounds.endCall.setSinkId("communications");
}

phone.ws = null;
phone.isLogout = true;
phone.wsReloadHandler = null;
phone.wsLoad = function(fn_success){
	phone.wsClose();
	phone.ws = new WebSocket("wss://"+document.location.host+"/ws");
	phone.ws.onopen = function() {		
		if (typeof fn_success == 'function'){
			fn_success();
		}
	}
	phone.ws.onmessage = function(event) {
		phone.onWsMessage(JSON.parse(event.data));
	};
	
	phone.ws.onclose = function(evt) {
		if (phone.verto && (!phone.isLogout) && (!phone.verto.isLogout)){
			if (phone.curr_call)
			{
				phone.curr_call.hangup();
			}
			phone.ui.reconnection.modal('show');
			phone.wsClose();
			phone.wsReloadHandler = setTimeout(function(){
				phone.wsLoad(function(){
					phone.ui.reconnection.modal('hide');
					phone.firstLoad();
				})
			}, 3000);
		}
	}
}

phone.wsClose = function(){
	phone.wsReloadHandler = null;
	if (phone.ws){
		phone.ws.onclose = null;
		phone.ws.close();
		phone.ws = null;
	}
}


phone.onWsMessage = function(d){
	
	if (d.error !== undefined)
	{
		switch (d.error)
		{
			// logout
			case -32401:
				phone.logout(true);
				return;
			default:
				alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РєРѕРґ: "+ d.error +"\n" + d.message)
				return;

		}
	}

	if (d.method !== undefined){
		var elements = d.elements;
		switch (d.method)
		{
			case "VirtaEvent.Authentificated":
			case "VirtaEvent.Heartbeat":
				if (d.eventTimeSec) {
					phone.timerServerDiff = (d.eventTimeSec *1000) - (new Date()).valueOf();
				}
				break;
			case "VirtaEvent.User.Updated":
				var users = [];
				for (var _u of elements){
					var u = phone.users[_u.id];
					if (u === undefined) {
						phone.users[_u.id] = _u;
						u = _u;
					}
					else
					{
						u.adminStatus =_u.adminStatus;
						u.authorized =_u.authorized;
						u.availStatus =_u.availStatus;
						u.busyStatus =_u.busyStatus;
						u.lastModifiedAvailStatus =_u.lastModifiedAvailStatus;
					}
					if ((u.id == phone.userId) && u.availStatus)
					{
						phone.setStateView(u.availStatus, u.busyStatus);
					}
					users.push(u);
				}
				phone.updateUserList(users);
				break;
			case "VirtaEvent.UserState.Updated":
				var users = [];
				for (var st of elements){
					var u = phone.users[st.id];
					if (u === undefined) {
						continue;
					}
					u.busyCount = st.busyCount;
					u.lastModifiedBusyCount = st.lastModifiedBusyCount;					
					u.networkStatus = st.networkStatus;
					u.lastModifiedNetworkStatus = st.lastModifiedNetworkStatus;
					
					users.push(u);
				}
				phone.updateUserList(users);
				
				break;
			case "VirtaEvent.CallGroupState.Updated":
				
				for (var gs of elements)
				{
					if (phone.call_groups[gs.id] === undefined) continue;
					var g = phone.call_groups[gs.id];
					g.queue = gs.queue;
					phone.updateCallList(gs.id);
					//console.log(g.queue);
				}
				
				
				break;
			case "VirtaEvent.CallGroupAgent.Updated":
				var users = [];
				for (var ag of elements){
					// temp code
					if (ag.userID == phone.userId) {
						$('[data-call-group-agent-checkbox='+ag.callGroupID+']').prop('checked', !!ag.status);
					}
					
					var g = phone.call_groups[ag.callGroupID];
					if ((g === undefined)||(g.agents === undefined)) continue;
					if (g.agents[ag.userID] === undefined) g.agents[ag.userID] = {};
					
					g.agents[ag.userID].adminStatus = ag.status;
					var u = phone.users[ag.userID];
					if (u !== undefined) users.push(u);
				}
				phone.updateUserList(users);
				break;
				
			case "VirtaEvent.CallGroupAgentState.Updated":
				var users = [];
				for (var ags of elements)
				{
					
					var g = phone.call_groups[ags.callGroupID];
					if ((g === undefined)||(g.agents === undefined)) continue;
					if (g.agents[ags.userID] === undefined) g.agents[ags.userID] = {};

					g.agents[ags.userID].status = ags.status;
					g.agents[ags.userID].lastModifiedStatus = ags.lastModifiedStatus;
					var u = phone.users[ags.userID];
					if (u !== undefined) users.push(u);
				}			
				phone.updateUserList(users);
				break;
			case "VirtaEvent.BundleState.Updated":
				phone.bundle_state = (elements && elements.length > 0 ? elements[0].services : []);
				phone.updateBundleState();
				break;
			case "VirtaEvent.BundleState.Destroyed":
				phone.bundle_state = [];
				phone.updateBundleState();
				break;
			
			default:
				//console.log(d);
				break;
		}
	}
	
}

$(document).ready(function(){
	
	var host = document.location.host;
	
	phone.ui.auth.wsURL.val("wss://"+host+":8082");

	
});

phone.ui.auth.dialog.submit(function(){
	phone.login();
	return false;
});

$('#phone-dialog-logout-btn').click(function(){
	
	if (confirm('Р’С‹ РґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕ С…РѕС‚РёС‚Рµ РІС‹Р№С‚Рё ?'))
	{
		$('#phone-dialog-logout-btn').attr('disabled', 'disabled');
		phone.vw.save();
		phone.logoutWithStatus();
	}
});


$(".phone-dialbtn").click(function(evt){
	var btn = $(evt.target);
	var inp =$(btn.data().inputNumber);
	inp.val(inp.val()+btn.text());
});

$(".phone-panel-dialpad-clear-btn").click(function(evt){
	var btn = $(evt.target);
	var inp = $(btn.data().inputNumber);
	inp.val('');
});

(function(){
	var fnClick = function(evt){
		var btn = $(evt.target);
		
		var btn_act;
		var inp_act;
		
		if (btn[0] === phone.ui.numberPopup.buttonCall[0]){
			btn_act = phone.ui.panelPhone.default.button;
			inp_act = phone.ui.panelPhone.default.number;
		}	
		if (btn[0] === phone.ui.numberPopup.buttonTransfer[0]){
			btn_act = phone.ui.panelPhone.talking.buttonTransfer;
			inp_act = phone.ui.panelPhone.talking.number;
		}
		if (btn[0] === phone.ui.numberPopup.buttonTransfer2[0]){
			btn_act = phone.ui.panelPhone.talking.buttonTransfer2;
			inp_act = phone.ui.panelPhone.talking.number;			
		}		
		if (btn_act){
			inp_act.val(phone.ui.numberPopup.num.val());
			btn_act.click();
		}
		phone.ui.numberPopup.panel.modal("hide");
		
	}	
	phone.ui.numberPopup.buttonCall.click(fnClick);
	phone.ui.numberPopup.buttonTransfer.click(fnClick); 
	phone.ui.numberPopup.buttonTransfer2.click(fnClick);
})();


	
phone.const_display = {
	user_avail_states: {
		"avail": "Р“РѕС‚РѕРІ",
		"direct": "РџСЂСЏРј. РІС‹Р·РѕРІС‹",
		"dnd": "РќРµ Р±РµСЃРїРѕРєРѕРёС‚СЊ",
		"away": "РћС‚РѕС€С‘Р»",
	},
	user_busy_states: {
		"avail": "Р“РѕС‚РѕРІ",
		"direct": "РџСЂСЏРј. РІС‹Р·РѕРІС‹",
		"dnd": "РќРµ Р±РµСЃРїРѕРєРѕРёС‚СЊ",
		"away": "РћС‚РѕС€С‘Р»",
		"filling-in-information": "Р—Р°РїРѕР»РЅ. РёРЅС„РѕСЂРјР°С†РёРё",
		"lunch-break": "РћР±РµРґ. РїРµСЂРµСЂС‹РІ",
		"technical-break": "РўРµС…. РїРµСЂРµСЂС‹РІ",
		"diagnostics-and-configuration": "Р”РёР°РіРЅРѕСЃС‚. Рё РєРѕРЅС„РёРіСѓСЂ."
	},	
	user_network_states: {
		"-1": "РќРµ РёР·РІРµСЃС‚РЅРѕ",
		"0": "РќРµ РІ СЃРµС‚Рё",
		"1": "Р Р°Р±РѕС‚Р°РµС‚"
	},
	
	call_group_agent_states: {
		"__undef__": "РќРµ РёР·РІРµСЃС‚РЅРѕ",
		"ready": "Р“РѕС‚РѕРІ",
		"busy": "Р—Р°РЅСЏС‚",
		"unavail": "РќРµРґРѕСЃС‚СѓРїРµРЅ"
	},
	
	bundle_call_states: [
		"РќР°С‡Р°Р»Рѕ СЃРѕРµРґРёРЅРµРЅРёСЏ",//Down = 0
		"Р—РІРѕРЅРѕРє",//Ringing = 1
		"Р—РІРѕРЅРѕРє (РїСЂРµРґРѕС‚РІРµС‚)",//Early = 2
		"Р Р°Р·РіРѕРІРѕСЂ",//Answered = 3
		"Р—Р°РІРµСЂС€РµРЅРѕ"//Hangup = 4
	]
}


phone.ui.panelPhone.default.button.click(function(){
	if (phone.verto){
		var num = phone.ui.panelPhone.default.number.val();
		num = num.replace(/[\-,\(,\),\s]/g,"");
		phone.curr_call = phone.verto.newCall({
			destination_number: num,
			
			useStereo: false
		});
	}
});

phone.ui.panelPhone.default.number.keypress(function (evt) {
	if (evt.keyCode == 13)
	{
		phone.ui.panelPhone.default.button.click();
	}
});


phone.ui.panelPhone.incoming.buttonAnswer.click(function(){
	if (phone.curr_call){
		phone.curr_call.answer({
			useVideo: false,
			useStereo: false			
		});
	}
});

phone.ui.panelPhone.incoming.buttonDecline.click(function() {
	if (phone.curr_call){
		phone.curr_call.hangup();
	}
});

phone.ui.panelPhone.talking.buttonHangup.click(function(){
	if (phone.curr_call)
	{
		phone.curr_call.hangup();
	}
});

phone.ui.panelPhone.talking.buttonHangupDND.click(function(){
	phone.setState("direct", ((phone.userManageTags.indexOf("ic_support")>=0) ? "filling-in-information" : "direct"), 1500);
	if (phone.curr_call)
	{
		phone.curr_call.hangup();
	}
});

(function(){
	var transfer_function = function(action){
		return function(){
			var phone_num = phone.ui.panelPhone.talking.number.val();
			phone_num = phone_num.replace(/[\-,\(,\),\s]/g,"");
			if (phone_num == ""){
				alert("Р’РІРµРґРёС‚Рµ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°");
				return;
			}
			if ((phone_num.length == 12)&&(phone_num.substr(0,2) == "+7"))
			{
				phone_num = "8" + phone_num.substr(2);
			}
			
			phone.verto.sendMethod("verto.info", {
				"msg":
					{
						"from": "webline",
						"to": "webline",
						"body" : JSON.stringify({"message":action,"params":{"dst_number":escape(phone_num)}})						
					}
			});
			phone.history.pushNumberTransfer(phone_num);
			
		}
	}		
	phone.ui.panelPhone.talking.buttonTransfer.click(transfer_function("action.blxfer"));
	phone.ui.panelPhone.talking.buttonTransfer2.click(transfer_function("action.attxfer"));				
})();				
				

phone.ui.panelPhone.talking.buttonTransferCancel.click(function(){
	phone.verto.sendMethod("verto.info", {
		"msg":
			{
				"from": "webline",
				"to": "webline",
				"body" : JSON.stringify({"message":"action.cancelxfer","params":{}})						
			}
		});
});


phone.ui.panelPhone.talking.number.keypress(function (evt) {
	
	if ((!evt.altKey) && ((evt.keyCode == 13)||(evt.keyCode == 10)))
	{
		if (evt.ctrlKey)
		{			
			phone.ui.panelPhone.talking.buttonTransfer2.click();
		}
		else
		{
			phone.ui.panelPhone.talking.buttonTransfer.click();
		}
	}
});


phone.ui.panelPhone.talking.buttonsTone.click(function(evt){
	var key = $(evt.target).text();
	if (phone.curr_call)
	{
		phone.curr_call.dtmf(key);
	}
});


phone.ui.panelPhone.outgoing.buttonCancel.click(function(){
	if (phone.curr_call)
	{
		phone.curr_call.hangup();
	}
});


phone.ui.view.checkboxes.click(function(evt){	
	var e = $(evt.target);	
	var d = e.data();
	if ((d.vwKey !== undefined) && (phone.vw.current[d.vwKey] !== undefined)){		
		var value = e.prop("checked");		
		
		phone.vw.setValue(d.vwKey, value);
	}
});


phone.timer = function(){
	var d = (new Date()).valueOf();
	$('[data-time]').each(function(i,e) {
		var t=$(e).data().time;
		if (!t)
		{
			$(e).text('');
			return;
		}
		t = parseInt(t);
		var diff_secs = Math.round((d-t+(phone.timerServerDiff ? phone.timerServerDiff : 0))/1000);
		
		$(e).text(phone.common.secondsToString(diff_secs))
	});
}



phone.firstLoad = function(is_first){
	
	if (is_first){
		phone.apiSessionID = null;
		phone.userId = null;
	}
	
	
	
	phone.users = {};
	phone.call_groups = {};
	phone.call_states={};
	
	phone.ui.panelPhone.userStatus.unbind("change");
	phone.ui.panelPhone.userStatus.attr("disabled", "disabled");
	$('#phone-dialog-logout-btn').attr("disabled", "disabled");
	
	var fn_user_init_my_data = function(u){
		if (u.crmList && (JSON.stringify(phone.userCrm) != JSON.stringify(u.crmList))){				
			phone.userCrm = u.crmList;
			phone.crmInit();
		}
		phone.ui.myNumber.text((u.commonName ? u.commonName: u.name));
		phone.ui.myName.text((u.numbers && u.numbers.length > 0 ? u.numbers[0] : u.name));
		
			
		if (u.availStatus){
			phone.setStateView(u.availStatus, u.busyStatus);
		}
	}
	
	//[{data, success, optional}], fn_success
	var fn_ajax = function(requests, fn_success){
		if (requests.length == 0) {
			if (typeof fn_success == "function"){
				return fn_success();
			}
			else
			{
				return;
			}
		}
		var request = requests.shift(1);
		$.ajax({
		   url: '/api', 
		   type: "POST",
		   dataType: "json",
		   contentType: "application/json; charset=utf-8",
		   data: JSON.stringify(request.data),
		   success: function (data) {
			   if (data.error !== undefined){
				    alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° "+ data.error + ": "+data.message);
					if (request.optional) {
						fn_ajax(requests, fn_success);
					}
					else
					{
						phone.logout(true);
					}
					return;
			   }			   
			   
			   request.success(data);
			   fn_ajax(requests, fn_success);
		   },
		   error: function (err) {
				alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР°");
				phone.logout(true);
		   }
		});
	}
	
	var data_ajax = [
		{
			data: {    
				"method": "CallGroup.Search",
				"filter": {}
			},
			success: function (result) {
				if (result.elements)
				{
					for (var g of result.elements)
					{
						phone.call_groups[g.id] = g;
						phone.call_groups[g.id]["agents"] = {};
					}
				}
			},
			optional: true
		},
		{
			data: {    
				"method": "CallGroupAgent.Search",
				"filter": {}
			},
			success: function (result) {
				if (result.elements)
				{
					for (var ag of result.elements)
					{
						if (phone.call_groups[ag.callGroupID] === undefined) continue;
						if (phone.call_groups[ag.callGroupID].agents[ag.userID] === undefined) phone.call_groups[ag.callGroupID].agents[ag.userID] = {}
						phone.call_groups[ag.callGroupID].agents[ag.userID].adminStatus = ag.status;
					}
				}
			},
			optional: true
		},
		{
			data: {    
				"method": "CallGroupAgentState.Search",
				"filter": {}
			},
			success: function (result) {
				if (result.elements)
				{
					for (var ags of result.elements)
					{
						if (phone.call_groups[ags.callGroupID] === undefined) continue;
						if (phone.call_groups[ags.callGroupID].agents[ags.userID] === undefined) phone.call_groups[ags.callGroupID].agents[ags.userID] = {}
						phone.call_groups[ags.callGroupID].agents[ags.userID].status = ags.status;
						phone.call_groups[ags.callGroupID].agents[ags.userID].lastModifiedStatus = ags.lastModifiedStatus;
					}
				}
				phone.callGroupsInitView();
			},
			optional: true
		},
		{
			data: {    
				"method": "User.Search",
				"filter": {}
		   },
		   success: function (result) {
			   if (result.elements)
			   {
				   for (var u of result.elements)
				   {
					   phone.users[u.id] = u;
					   if ((u.id == phone.userId) && (!is_first))
					   {
						  fn_user_init_my_data(u);
					   }
				   }
			   }
		   },
		   optional: true
		},		
		
		//VirtaEvent.CallGroupState
		{
			data: {
				"method": "CallGroupState.Search",
				"filter": {}
			},
			success: function (result) {
				if (result.elements)
				{
					for (var gs of result.elements)
					{
						if (phone.call_groups[gs.id] === undefined) continue;
						var g = phone.call_groups[gs.id];
						g.queue = gs.queue;
						if (g.queue.length > 0)
						{
							phone.updateCallList(gs.id);
						}
					}					
				}
			},
			optional: true
		},
		{
			data: {
				"method": "UserState.Search",
				"filter": {}
			},
			success: function (result) {
				if (result.elements)
				{
					for (var st of result.elements)
					{
						if (phone.users[st.id] === undefined) continue;
						var u = phone.users[st.id];
						u.networkStatus = st.networkStatus;
						u.busyCount = st.busyCount;
						u.lastModifiedBusyCount = st.lastModifiedBusyCount;
						u.lastModifiedNetworkStatus = st.lastModifiedBusyCount;
					}
				}
				phone.updateUserList();
				
			},
			optional: true
		},		
		{
			data: {
				"method": "BundleState.Search"
			},
			success: function (result) {
				phone.bundle_state = (result.elements && result.elements.length > 0 ? result.elements[0].services : []);
				phone.updateBundleState();				
			},
			optional: true
		},			
	]
	
	
	if (is_first){
		data_ajax.unshift({
			data:{    
				"method": "Authentificate",
				"data":
				{
					"login": phone.ui.auth.login.val().toLowerCase(),
					"password": phone.ui.auth.password.val(),
					"requestPurpose": "clientView"
				}
			},
			success: function (result) {
				var data = result.data;
				phone.apiSessionID=data.sessionID;
				phone.userId = data.id;
				var u = data.user;
				if (u)
				{
					fn_user_init_my_data(u);
					phone.userManageTags = (u.manageTags ? u.manageTags : []);
				}
			}
		});
	}
	fn_ajax(data_ajax, (is_first ? function(){
		phone.wsLoad(function(){
			var u = (phone.userId ? phone.users[phone.userId]: undefined);
			if (u){
				phone.ui.panelPhone.userStatus.find("option").prop("disabled", false).css("color","").css('background-color',"");

				// Р—Р°РєСЂС‹С‚СЊ СЃРѕСЃС‚РѕСЏРЅРёСЏ РґР»СЏ ic_support
				if (phone.userManageTags.indexOf("ic_support")>=0)
				{
					phone.ui.panelPhone.userStatus.find('option[value="dnd_dnd"]').prop("disabled", true).css("color","gray").css('background-color','lightgray');
					phone.ui.panelPhone.userStatus.find('option[value="direct_direct"]').prop("disabled", true).css("color","gray").css('background-color','lightgray');
				}
				
				// СѓСЃС‚Р°РЅРѕРІРёС‚СЊ busyStatus РґР»СЏ РїРѕРґРєР»СЋС‡РµРЅРЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
				
				var user_state = (u.availStatus ? u.availStatus: "avail");
				
				
				var busy_status = (u.busyStatus && (u.busyStatus != '_') ? u.busyStatus :  user_state);
				
				
				if (phone.userManageTags.indexOf("ic_support")>=0){
					if (busy_status == "direct") busy_status = "filling-in-information";
					if (busy_status == "dnd") busy_status = "lunch-break";					
				}
				
				if ((u.availStatus != user_state)||(u.busyStatus != busy_status))
				{
					phone.ws.send(JSON.stringify({
						"method": "User.Update",
							"filter": {
								"id": phone.userId
						},
						"data": {
							"availStatus": user_state,
							"busyStatus": busy_status
						}		
					}));
				}
				phone.setStateView(user_state, busy_status);
			}

			
			phone.ui.panelPhone.userStatus.on("change",function(evt){
				var user_state = $(evt.target).val();
				user_state = user_state.split("_", 2);					
				phone.setState(user_state[0], user_state[1]);
			});	
			phone.ui.panelPhone.userStatus.removeAttr("disabled");
			$('#phone-dialog-logout-btn').removeAttr("disabled");
			
			/* РљРѕСЃС‚С‹Р»СЊ РґР»СЏ РґР»СЏ РѕС‚РїСЂР°РІРєРё РєР°Р¶РґС‹Р№ С‡Р°СЃ http-Р·Р°РїСЂРѕСЃР° РїРѕС‚РѕРј СѓР±СЂР°С‚СЊ ??? */
			phone.HTTPHeartbeatHandler = setInterval(function(){
				if (phone.userId) {
					$.ajax({
						url: '/api' , 
						type: "POST",
						dataType: "json",
						contentType: "application/json; charset=utf-8",
						data: JSON.stringify({
							"method": "User.Search",
							"filter": {"id": phone.userId}
					    }),
					    success: function (data) {
							if (data.elements && (data.elements.length == 1))
							{
								var u = data.elements[0];
								fn_user_init_my_data(u);
							}
					   },
					   error: function (err) {
						   alert("РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° Рє СЃРµСЂРІРµСЂСѓ");
						   phone.logout(true);
					   }
					 });
				}
			},3600000);
		});
	} : undefined));
}

phone.setState = function(user_state, busy_status, timeout){
	if (!phone.apiSessionID) return;
	var elem = phone.ui.panelPhone.userStatus;
	if (elem.prop("disabled")) return;
	elem.attr('disabled', 'disabled');
    if (busy_status === undefined) busy_status = "";
	var classes =  elem.attr("class").split(' ');		
	for (var i in classes){
		var cls = classes[i];
		if (cls.indexOf("phone-status-list-") === 0){
			elem.removeClass(cls);
		}
	}
	
	var fn_set_state = function(){	
		phone.ws.send(JSON.stringify({
			"method": "User.Update",
				"filter": {
					"id": phone.userId
			},
			"data": {
				"availStatus": user_state,
				"busyStatus": busy_status
			}		
		}));
		elem.removeAttr('disabled');
	}
	if (timeout === undefined)
	{
		fn_set_state();
	}
	else
	{
		setTimeout(fn_set_state, timeout);
	}
	
}


phone.setStateView = function(user_state, busy_status){
	if ((!busy_status)||(busy_status == '_')) busy_status = user_state;
	phone.ui.panelPhone.userStatus.val(user_state+"_"+busy_status);
	//ico 
	if (user_state == "avail"){
		$("#favicon").attr("href","favicon.ico");
		document.title="Call-С†РµРЅС‚СЂ";
	}
	else
	{
		$("#favicon").attr("href","favicon_"+user_state+".ico");
		document.title=phone.const_display.user_avail_states[user_state]+" Call-С†РµРЅС‚СЂ";
	}
	
	//select view
	var elem = phone.ui.panelPhone.userStatus;
	var classes =  elem.attr("class").split(' ');
		
	for (var i in classes){
		var cls = classes[i];
		if (cls.indexOf("phone-status-list-") === 0){
			elem.removeClass(cls);
		}
	}
	elem.addClass("phone-status-list-"+user_state);
}


phone.callGroupsInitView = function() {
	phone.ui.view.groupsCheckboxesUl.empty();
	phone.ui.usersList.empty();
	phone.ui.callList.empty();
	
	var groupIDS = Object.keys(phone.call_groups);
	
	groupIDS.sort(function(groupID1, groupID2){
		var n1 = phone.call_groups[groupID1].commonName || phone.call_groups[groupID1].name;
		var n2 = phone.call_groups[groupID2].commonName || phone.call_groups[groupID2].name;
		if (n1 < n2) return -1;
		if (n1 > n2) return 1;
		return 0;
	})
	
	
	/*groups vw*/
	for (var groupID of groupIDS)
	{
		
		var g = phone.call_groups[groupID];
		
		var li = phone.ui.view.groupsCheckboxesUl.find("li[data-vw-group-name="+groupID+"]");
		if (li.length == 0){
			
			li = $("<li></li>");
			lb = $("<label></label>");
			li.append(lb);
			li.attr('data-vw-group-name', groupID);
			var chk_box = $('<input type="checkbox" />');
			chk_box.attr('data-vw-group-name', groupID);
			chk_box.prop("checked", !(phone.vw.current.userListgroup[groupID] === false));
			
			
			lb.append(chk_box);			
			lb.append(" ");
			
			var n_order = $('<input type="number" />');
			n_order.attr('min', 0);
			n_order.attr('max', 99);
			n_order.attr('data-vw-group-order-name', groupID);
			n_order.attr('title', 'РџРѕСЂСЏРґРѕРє РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ');
			if (phone.vw.current.userListgroupOrder[groupID] !== undefined)
			{
				var o = phone.vw.current.userListgroupOrder[groupID];
				n_order.val(o);
				li.css('order', o);
			}
			if (phone.vw.current.userListgroup[groupID] === false){
				n_order.attr("disabled", "disabled");
			}
						
			lb.append(n_order);
			
			lb.append(" ");
			if (g.commonName)
			{
				lb.append(g.commonName);
				lb.append(" ("+g.name+")");
			}
			else
			{
				lb.append(g.name);
			}
			
			phone.ui.view.groupsCheckboxesUl.append(li);
			
			chk_box.change(function(evt){
				var chk_box = $(evt.target);
				var checked = chk_box.prop("checked");
				var groupID = chk_box.data().vwGroupName;
				phone.vw.current.userListgroup[groupID] = checked;
				if (checked) {
					$('[data-vw-group-order-name="'+groupID+'"]').removeAttr("disabled");
				}
				else
				{
					$('[data-vw-group-order-name="'+groupID+'"]').attr("disabled", "disabled");
				}
				
				var action = (checked ? 'show' : 'hide');
				$("[data-phone-users-group-div='"+groupID+"']")[action]();
				$("[data-phone-call-list-group-div='"+groupID+"']")[action]();
			});
			
			n_order.change(function(evt){
				var n_order = $(evt.target);
				
				var groupID = n_order.data().vwGroupOrderName;
				var o = n_order.val();
				if (o) {
					phone.vw.current.userListgroupOrder[groupID] = o;
					$("[data-phone-users-group-div='"+groupID+"']").css('order', o);
					$("[data-phone-call-list-group-div='"+groupID+"']").css('order', o);
				}
				else
				{
					delete phone.vw.current.userListgroupOrder[groupID];
					$("[data-phone-users-group-div='"+groupID+"']").css('order', '');
					$("[data-phone-call-list-group-div='"+groupID+"']").css('order', '');
				}
			});
			
		}
		
		
	}
	//end groups vw
	
	/* USERS */
	for (var groupID of groupIDS)
	{		
		var g = phone.call_groups[groupID];
		
		g_div =$('<div></div>');
		g_div.attr("data-phone-users-group-div", groupID);			
		if (phone.vw.current.userListgroupOrder[groupID] !== undefined)
		{
			g_div.css('order', phone.vw.current.userListgroupOrder[groupID]);
		}
			
		phone.ui.usersList.append(g_div);
			
		var g_h_descr = $("<h5></h5>");
		var btn_collapse = $('<span></span>');
		btn_collapse.addClass("btn").addClass("btn-default").addClass("btn-xs").addClass("glyphicon").attr("data-toggle","collapse");
		g_h_descr.append(btn_collapse);
			
		g_span_descr = $("<span></span>");
		g_span_descr.attr("data-phone-users-group-title", groupID);
		g_h_descr.append(g_span_descr);
			
			
		g_div.append(g_h_descr);			
		g_h_descr.attr("data-phone-users-group-h", groupID);
			
		var g_users = $("<div></div>");
		g_div.append(g_users);
		g_users.addClass("collapse").addClass("in");
		g_users.attr("id", "phone-users-group-div-table-"+groupID);
		btn_collapse.attr("data-target","#"+g_users.attr("id"));
			
		g_div[(!(phone.vw.current.userListgroup[groupID] === false) ? 'show' : 'hide')]();
			
		var g_numbers = $("<span></span>");
		g_h_descr.append(" ");
		g_h_descr.append(g_numbers);
		g_numbers.attr("data-phone-users-group-numbers", groupID);
		
		table_users = $("<table></table>");
		table_users.addClass("phone-table");
		
		g_users.append(table_users);			
		table_users.attr("data-phone-users-group-table", groupID);
			
		table_users_body = $("<tbody></tbody>");			
		table_users.append(table_users_body);
		table_users_body.attr("data-phone-users-group-table-body",groupID);
		
		g_span_descr.text((g.commonName ? g.commonName :"")+" ");
		g_span_descr.append($("<i></i>").text(g.name));
		
		var numbers = []
		
		if (g.numbers && (g.numbers.length > 0)){
			
			for (var n of g.numbers){
				numbers.push(n);
			}
		}
		numbers.push(g.name);
		phone.common.appendNumbersButton(g_numbers, numbers, g.commonName || g.name);
		
	}
	/* END USERS */
	
	
	/*CALL LIST*/
	
	for (var groupID of groupIDS)
	{		
		var g = phone.call_groups[groupID];
		
		
		var g_div =  $('<div></div>');
		g_div.attr("data-phone-call-list-group-div",groupID);
		if (phone.vw.current.userListgroupOrder[groupID] !== undefined)
		{
			g_div.css('order', phone.vw.current.userListgroupOrder[groupID]);
		}
		
		var g_h = $("<h5></h5>");
			
		var btn_collapse = $('<span></span>');
		btn_collapse.addClass("btn").addClass("btn-default").addClass("btn-xs").addClass("glyphicon").attr("data-toggle","collapse");
		g_h.append(btn_collapse);
		g_h.append(g.commonName);			
		g_h.append(" ");
		g_h.append($("<i></i>").text(g.name));
		g_div.append(g_h);
		var g_users = $("<div></div>");
		g_div.append(g_users);
		g_users.addClass("collapse").addClass("in");
		g_users.attr("id", "phone-call-group-group-div-table-"+groupID);
		btn_collapse.attr("data-target","#"+g_users.attr("id"));
			
		table_users = $("<table></table>");
		table_users.addClass("phone-table");
	
		table_users.attr("data-phone-call-list-group-table",groupID);
		g_users.append(table_users);

		phone.ui.callList.each(function(i,e){
			var d = (i == phone.ui.callList.length-1 ? g_div : g_div.clone());
			d[(!(phone.vw.current.userListgroup[groupID] === false) ? 'show' : 'hide')]();
			
			$(e).append(d);
			
		});		
	}	
}


phone.updateUserList = function(elements){
	if (elements === undefined)
	{
		elements = Object.values(phone.users);
	}
	for (var groupID in phone.call_groups)
	{
		var g = phone.call_groups[groupID];
		var table_users = $("[data-phone-users-group-table='"+groupID+"']");
		var table_users_body = $("[data-phone-users-group-table-body='"+groupID+"']");
		
		var has_changed = false;
		for (var u of elements){
			if (g.agents[u.id] === undefined) continue;			
			var tr_user = $("[data-phone-users-name-tr='"+u.id+"'][data-phone-users-group-tr='"+groupID+"']");
			
			if (!u.adminStatus){
				if (tr_user.length > 0){
					tr_user.remove();
					has_changed = true;
					continue;
				}
			}
			
			var g_admin_status = g.agents[u.id].adminStatus;
			var g_agent_status = g.agents[u.id].status;
			var g_agent_status_last_modified = g.agents[u.id].lastModifiedStatus;
			
			var is_new_row = false;
			if (tr_user.length == 0){
				
				tr_user = $("<tr></tr>");			
				table_users_body.append(tr_user);
				tr_user.attr("data-phone-users-name-tr", u.id);
				tr_user.attr("data-phone-users-group-tr", groupID);

				tr_user.attr("data-admin-status", g_admin_status);
				tr_user.data("adminStatus", g_admin_status);
				is_new_row = true;
				has_changed = true;
			}
			else
			{				
				tr_user.removeClass();
				tr_user.show();

				if (parseInt(tr_user.data().adminStatus) != g_admin_status)
				{
					tr_user.attr("data-admin-status", g_admin_status);
					tr_user.data("adminStatus", g_admin_status);
					has_changed = true;
				}
				
			}
			
			if (u.availStatus)
			{
				tr_user.addClass("phone-user-tr-user-avail-state-"+u.availStatus);
			}
			
			if (u.busyCount)
			{
				tr_user.addClass("phone-user-tr-user-busy");
			}
			
			
			tr_user.addClass("phone-user-tr-user-network-status-"+u.networkStatus);
			tr_user.addClass("phone-user-tr-user-admin-status-"+g_admin_status);
			
			var td_busy_status;
			var span_busy_status;
			var td_user_state;
			var td_conn_state;
			var td_group_agent_state;
			if (is_new_row){
				td_busy_status = $("<td></td>").addClass("phone-user-td-phone-busy-status").attr("data-busy-status", (u.busyStatus || ""));
				span_busy_status = $("<span></span>");
				if ((u.busyStatus)&&(u.busyStatus != "_"))
				{
					span_busy_status.addClass("glyphicon").addClass("glyphicon-globe");
					td_busy_status.attr("title", "Р’РµР±-РєР»РёРµРЅС‚ Р°РєС‚РёРІРµРЅ");
				}
				td_busy_status.append(span_busy_status);
				tr_user.append(td_busy_status)
				
				tr_user.append($("<td></td>").attr("data-full-name", u.commonName || u.name).addClass("phone-user-td-full-name").text(u.commonName || u.name));
				
				var phone_nums_tr=$("<td></td>").attr("data-phone-num", (u.numbers ? JSON.stringify(u.numbers) :"")).addClass("phone-user-td-phone-num");
				var numbers = [];
				if (u.numbers){
					for (var i=0; i<u.numbers.length ; i++ ){
						numbers.push(u.numbers[i]);
					}
				}
				numbers.push(u.name);
				phone.common.appendNumbersButton(phone_nums_tr, numbers, u.commonName || u.name);
				tr_user.append(phone_nums_tr);
				
				td_user_state = $("<td></td>").addClass("phone-user-td-user-state");
				tr_user.append(td_user_state);
				td_conn_state = $("<td></td>").addClass("phone-user-td-cn-state");
				tr_user.append(td_conn_state);				
				td_group_agent_state = $("<td></td>");
				tr_user.append(td_group_agent_state);
				
				if (phone.userManageTags && ((phone.userManageTags.indexOf("administrator") >=0) || (phone.userManageTags.indexOf("supervisor")>=0)))
				{
					var btn_group_clear_agent_state = $('<button class="btn btn-xs btn-default glyphicon glyphicon-refresh"></button>');
					btn_group_clear_agent_state.attr("title", "РЎР±СЂРѕСЃРёС‚СЊ СЃРѕСЃС‚РѕСЏРЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ");
					btn_group_clear_agent_state.data("id", u.id);
					btn_group_clear_agent_state.data("name", u.commonName || u.name);
					tr_user.append($("<td></td>").append(btn_group_clear_agent_state));
					
					btn_group_clear_agent_state.click(function(evt){
						var data = $(evt.target).data();
						if (!confirm("Р’С‹ РґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕ С…РѕС‚РёС‚Рµ СЃР±СЂРѕСЃРёС‚СЊ СЃРѕСЃС‚РѕСЏРЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ '"+data.name+"'")) return; 
						phone.userClearState(data.id);
					});					
				}				
			}
			else
			{	
				td_busy_status = tr_user.find("[data-busy-status]");
				span_busy_status = td_busy_status.find("span");
				td_user_state = tr_user.find("[data-user-state]");
				td_conn_state = tr_user.find("[data-user-busy]");
				td_group_agent_state = tr_user.find("[data-group-agent-state]");
			}
						
			
			if ((u.availStatus || (u.networkStatus <= 0)) && (is_new_row || (td_busy_status.data().busyStatus != u.busyStatus) || (td_user_state.data().userState != u.availStatus) || (td_user_state.data().networkStatus != u.networkStatus))) {
				has_changed = true;
				
				
				td_user_state.empty();
				td_user_state.attr("data-user-state", u.availStatus);				
				td_user_state.data("userState", u.availStatus);
				td_user_state.attr("data-network-status", u.networkStatus);
				td_user_state.data("networkStatus", u.networkStatus);
				
				td_user_state.append($("<span></span>").addClass("hidden-xs").addClass("hidden-sm").text((u.networkStatus > 0 ?  ((u.busyStatus && (u.busyStatus != "_")) ? phone.const_display.user_busy_states[u.busyStatus] : phone.const_display.user_avail_states[u.availStatus]) : phone.const_display.user_network_states[u.networkStatus])));				
				td_user_state.append($("<span></span>").addClass("phone-span-state-duration").attr("data-time", Math.max(u.lastModifiedNetworkStatus, u.lastModifiedAvailStatus)*1000));
			}
			
			if (td_busy_status.data().busyStatus != u.busyStatus)
			{
				td_busy_status.attr("data-busy-status", (u.busyStatus || ""));
				td_busy_status.data("busyStatus", u.busyStatus);
				if (u.busyStatus && (u.busyStatus != '_'))
				{
					span_busy_status.addClass("glyphicon").addClass("glyphicon-globe");
					td_busy_status.attr("title", "Р’РµР±-РєР»РёРµРЅС‚ Р°РєС‚РёРІРµРЅ");
				}
				else
				{
				
					span_busy_status.removeClass("glyphicon").removeClass("glyphicon-globe")
					td_busy_status.removeAttr("title");
				}
			}
			
			if (is_new_row || (!td_conn_state.data()) ||(td_conn_state.data().userBusy != u.busyCount)) {
				has_changed = true;			
				td_conn_state.empty();
				td_conn_state.attr("data-user-busy", u.busyCount);
				td_conn_state.data("userBusy", u.busyCount);
				td_conn_state.append($("<span></span>").addClass("hidden-xs").addClass("hidden-sm").text((u.busyCount ? "Р—Р°РЅСЏС‚": "РќРµ СЂР°Р·Рі.")));				
				td_conn_state.append($("<span></span>").addClass("phone-span-state-duration").attr("data-time", Math.max(u.lastModifiedNetworkStatus, u.lastModifiedBusyCount)*1000));
			}
			
			if (is_new_row || (!td_group_agent_state.data()) ||(td_group_agent_state.data().groupAgentState != g_agent_status)) {
				has_changed = true;	
				
				td_group_agent_state.empty();
				td_group_agent_state.removeClass();
				td_group_agent_state.attr("data-group-agent-state", g_agent_status);
				td_group_agent_state.data("groupAgentState", g_agent_status);
				if (g_agent_status_last_modified)
				{
					td_group_agent_state.append($("<span></span>").addClass("phone-span-state-duration").attr("data-time", g_agent_status_last_modified*1000));
				}
				
				td_group_agent_state.addClass("phone-user-td-user-call-group-agent-state");
				td_group_agent_state.addClass("phone-user-td-user-call-group-agent-state-"+g_agent_status);
				td_group_agent_state.attr("title", phone.const_display.call_group_agent_states[g_agent_status]);
			}
		}
		
		if (has_changed)
		{
			var rows = table_users_body.find("tr").detach();
			rows.sort(function(elem1, elem2){
				
				var e1 = $(elem1);
				var e2 = $(elem2);
				var orders = {
					userState: ["avail","direct","dnd","away"],
					networkStatus:[1, 0, -1],
					adminStatus:[1, 0]
				};		
				
				var data =[
					[	
						orders.adminStatus.indexOf(e1.data().adminStatus),
						orders.networkStatus.indexOf(e1.find("[data-user-state]").data().networkStatus),
						orders.userState.indexOf(e1.find("[data-user-state]").data().userState),
						((e1.find("[data-user-busy]").data().userBusy > 0) ? 0 : 1),
						e1.find("[data-full-name]").data().fullName
					],
					[
						orders.adminStatus.indexOf(e2.data().adminStatus),
						orders.networkStatus.indexOf(e2.find("[data-user-state]").data().networkStatus),
						orders.userState.indexOf(e2.find("[data-user-state]").data().userState),
						((e2.find("[data-user-busy]").data().userBusy > 0) ? 0 : 1),
						e2.find("[data-full-name]").data().fullName
					]
				];
				for (i=0; i<data[0].length; i++){
					if (data[0][i]<data[1][i]) return -1;
					if (data[0][i]>data[1][i]) return 1;
				}
				return 0;
			});
			table_users_body.append(rows);
		}
	}
	
	if (phone.vw.current.userListHideUnavail){
		$(".phone-user-tr-user-network-status--1,.phone-user-tr-user-network-status-0,.phone-user-tr-user-admin-status-0").hide();
	}
	else
	{
		$(".phone-user-tr-user-network-status--1,.phone-user-tr-user-network-status-0,.phone-user-tr-user-admin-status-0").show();
	}	
}

	
phone.updateBundleState = function()
{	
	
	
	var call_states;
	phone.ui.phoneStatusTableBody.empty();
	
	if (phone.bundle_state === undefined) return;

	for (var st of phone.bundle_state)
	{
		if (st.type != "Call"){
			if (phone.bundle_state.length > 1) continue;
		}
		if (st.callState == 4) continue;
		var tr =$("<tr></tr>");
		var td_caller_number = $("<td></td>");
		
		
		
		if (st["caller.commonNumber"] && st["caller.commonNumber"].length > 6)
		{
			var a_caller = $("<a></a>");
			a_caller.attr("href", "javascript:void(null);");
			a_caller.attr("data-caller-number-crm", st["caller.commonNumber"]);
			a_caller.attr("title", "РћС‚РєСЂС‹С‚СЊ РІ CRM");
			a_caller.click(function(evt){
				phone.crmGoto($(evt.target).data().callerNumberCrm);
			})
			a_caller.text(st["caller.commonNumber"]);
			td_caller_number.append(a_caller);
		}
		else
		{
			td_caller_number.text(st["caller.commonNumber"]);
		}
		tr.append(td_caller_number);
		
		var td_caller_name =  $("<td></td>").text(st["caller.commonName"] || st["caller.userName"]);		
		tr.append(td_caller_name);
		
		if ((st["redirg.id"]!== undefined)&&(st["caller.userID"] != st["redirg.userID"]))
		{
			if (st["redirg.commonNumber"] !== undefined){
				td_caller_number.append("<br>");
				if (st["redirg.commonNumber"].length > 6)
				{
					var a_caller = $("<a></a>");
					a_caller.attr("href", "javascript:void(null);");
					a_caller.attr("data-caller-number-crm", st["redirg.commonNumber"]);
					a_caller.attr("title", "РћС‚РєСЂС‹С‚СЊ РІ CRM");
					a_caller.click(function(evt){
						phone.crmGoto($(evt.target).data().callerNumberCrm);
					})
					a_caller.text(st["redirg.commonNumber"]);
					a_caller.addClass("phone-user-span-bundle-state-redirg");
					td_caller_number.append(a_caller);
				}
				else
				{
					td_caller_number.append($("<span></span>").addClass("phone-user-span-bundle-state-redirg").text(st["redirg.commonNumber"]));
				}
				td_caller_number.append($("<i></i>").addClass("glyphicon").addClass("glyphicon-hand-right"));
			}
			td_caller_name.append("<br>");
			td_caller_name.append($("<span></span>").addClass("phone-user-span-bundle-state-redirg").attr("title", "РџРµСЂРµРЅР°РїСЂР°РІР»СЏРµРјР°СЏ СЃС‚РѕСЂРѕРЅР° РІС‹РІРѕР·Р°").text((st["redirg.commonName"] || st["redirg.userName"])));
		}
		
		
		var td_callee_number = $("<td></td>").text(st["callee.commonNumber"]);
		tr.append(td_callee_number);
		
		var td_callee_name = $("<td></td>").text(st["callee.commonName"] || st["callee.userName"]);
		tr.append(td_callee_name);
		
		if ((st["xferor.id"]!== undefined)&&(st["caller.userID"] != st["xferor.userID"]))
		{
			if (st["xferor.commonNumber"] !== undefined){
				td_callee_number.append("<br>");
				td_callee_number.append($("<span></span>").addClass("phone-user-span-bundle-state-xferor").text(st["xferor.commonNumber"]));
				td_callee_number.append($("<i></i>").addClass("glyphicon").addClass("glyphicon-hand-left"));
			}
			td_callee_name.append("<br>");
			td_callee_name.append($("<span></span>").addClass("phone-user-span-bundle-state-xferor").attr("title", "РџРµСЂРµРЅР°РїСЂР°РІР»СЏСЋС‰Р°СЏ СЃС‚РѕСЂРѕРЅР° РІС‹РІРѕР·Р°").text((st["xferor.commonName"] || st["xferor.userName"])));
		}
		
		/*
			CallState
			Down = 0
			Ringing = 1
			Early = 2
			Answered = 3
			Hangup = 4
		*/
		tr.append($("<td></td>").text(phone.const_display.bundle_call_states[st.callState]));
		tr.append($("<td></td>").text(st.ocdpn));
		var td_answered_time = $("<td></td>");
		if (st.answeredTime) {
			var t = Math.floor(st.answeredTime / 1000);
			td_answered_time.attr("data-time", t);
		}		
		tr.append(td_answered_time);
		
		tr.addClass("phone-user-tr-bundle-state-"+st.connState);
		if ((st["callee.userID"] == phone.userId)||(st["caller.userID"] == phone.userId)){
			tr.addClass("phone-user-tr-bundle-curr-user");
		}
		
		
		var btn_clear = $('<button class="btn btn-xs btn-default glyphicon glyphicon-remove"></button>');
		btn_clear.attr("title", "РџСЂРµСЂРІР°С‚СЊ РІС‹Р·РѕРІ");
		btn_clear.data("user_id", phone.userId);
		btn_clear.data("bundle_id", st.bundleID);
		tr.append($("<td></td>").append(btn_clear));
		
		btn_clear.click(function(evt){
			var data = $(evt.target).data();
			phone.userClearState(data.user_id, data.bundle_id);
		});
		
		phone.ui.phoneStatusTableBody.append(tr);
		if (st["caller.commonNumber"] && st.connState == "bridged" && phone.curr_call && phone.curr_call.direction == $.verto.enum.direction.inbound && phone.curr_call.params.caller_id_number != st["caller.commonNumber"] && st["callee.userID"] == phone.userId)
		{			
			phone.curr_call.params.caller_id_name = st["caller.commonName"] || st["caller.userName"];
			phone.curr_call.params.caller_id_number = st["caller.commonNumber"];
			phone.ui.panelPhone.talking.talkingName.text(phone.curr_call.params.caller_id_name);
			phone.ui.panelPhone.talking.talkingNumber.text(phone.curr_call.params.caller_id_number);	

			phone.crmGoto(st["caller.commonNumber"]);		
		}
	}
	phone.ui.fn.resizeFrames();
}

phone.updateCallList = function(groupID){
	
	var g = phone.call_groups[groupID];
	if (g === undefined) return;
	
	var table_users = $('[data-phone-call-list-group-table="'+groupID+'"]');
	table_users.empty();
	for (var q of g.queue)
	{
		var tr_user = $("<tr></tr>");
		tr_user.append($("<td></td>").addClass("phone-user-td-phone").text(q.cidNumber));
		tr_user.append($("<td></td>").addClass("phone-user-td-interval").attr("data-time", q.enqueuedTimeSec*1000));
		tr_user.append($("<td></td>").addClass("phone-user-td-full-name").text(q.cidName));
		
		if (phone.userManageTags && ((phone.userManageTags.indexOf("administrator") >=0) || (phone.userManageTags.indexOf("supervisor")>=0)))
		{
			var btn_dequeue = $('<button class="btn btn-xs btn-default glyphicon glyphicon-remove"></button>');
			btn_dequeue.attr("title", "РЈРґР°Р»РёС‚СЊ РёР· РѕС‡РµСЂРµРґРё");
			btn_dequeue.data("id", q.id);
			tr_user.append($("<td></td>").append(btn_dequeue));
			btn_dequeue.click(function(evt){
				if (!confirm("Р’С‹ РґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕ С…РѕС‚РёС‚Рµ СѓРґР°Р»РёС‚СЊ РІС‹Р·РѕРІ РёР· РѕС‡РµСЂРµРґРё")) return; 
				$.ajax({
					url: '/api',
					type: "POST",
					dataType: "json",
					contentType: "application/json; charset=utf-8",
					data: JSON.stringify({
						"method": "Cmd.CallgroupDequeue",
							"params": {
								"id": $(evt.target).data().id
							}
					}),
					success: function (data) {
						if (data.error !== undefined){
							alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° "+ data.error + ": "+data.message);
						}
					},
					error: function (err) {
						alert("РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° Рє СЃРµСЂРІРµСЂСѓ");
					}
				});
			});
		}
		
		
		
		if (q.blocked)
		{
			tr_user.addClass("phone-call-queue-tr-blocked");
		}
		
		table_users.each(function(i,e){
			var tr = (i == table_users.length-1 ? tr_user : tr_user.clone(true));
			$(e).append(tr);
		});
		
	}
}

phone.login = function()
{
	if (phone.verto){
		
		phone.verto = null;
	}
	phone.ui.auth.error.text("");
	
	
	phone.verto = new $.verto({
			login: phone.ui.auth.login.val().toLowerCase() + "@" + phone.ui.auth.hostName.val(),
			passwd: phone.ui.auth.password.val(),
			socketUrl: phone.ui.auth.wsURL.val(),
			//tag: phone.ui.webCamTag,
			//ringFile: phone.ui.ringFile,		
			audioParams: {
				googAutoGainControl: false,
				googNoiseSuppression: false,
				googHighpassFilter: false
			}
			//iceServers: false
		},
		{
			onMessage: (function(phone){
				return function(verto, dialog, msg, data) {		
					if (window.debugMode) console.log(verto, dialog, msg, data);
				}
			})(phone),
				
			onDialogState: (function(phone){
				return function(d) {
					
					switch (d.state) {
						case $.verto.enum.state.ringing:
						    // Р—Р°РїСЂРµС‚ РїСЂРёРЅСЏС‚РёСЏ РІС‚РѕСЂРѕРіРѕ РІС‹Р·РѕРІР°
							if (phone.curr_call && (d.callID != phone.curr_call.callID))
							{
								d.hangup();
								return;
							}
							//phone.ui.panelPhone.callStatus.text("Р’С‹Р·РѕРІ: " + d.cidString());							
							phone.ui.panelPhone.incoming.name.text((d.params.caller_id_name ? d.params.caller_id_name : "<РќРµС‚ РґР°РЅРЅС‹С…>"));
							phone.ui.panelPhone.incoming.number.text((d.params.caller_id_number ? d.params.caller_id_number : "<РќРµС‚ РґР°РЅРЅС‹С…>"));
							
							phone.ui.panelPhone.panelClass.hide();
							phone.ui.panelPhone.incoming.panel.show();
							
							
							
							if ((Notification.permission.toLowerCase() == "granted") && phone.sw){
								phone.sw.showNotification('Call-С†РµРЅС‚СЂ '+document.location.host,
								{
									body : "Р’С‹Р·РѕРІ: " + d.cidString(),										  
									requireInteraction: true,
									icon: "./img/phone.jpg",
									data: {
										"url": document.location.href
									},
									
									actions:[
										{action: "answer;"+d.callID, title:"РџСЂРёРЅСЏС‚СЊ"},
										{action: "decline;"+d.callID, title:"РћС‚РјРµРЅР°"}
									],
									
									tag: "phone-notification-"+d.callID
								});							
							}

							phone.ui.numberPopup.buttonCall.hide();
							phone.ui.numberPopup.buttonTransfer.hide();
							phone.ui.numberPopup.buttonTransfer2.hide();
							phone.crmGoto(d.params.caller_id_number);
							phone.curr_call = d;
							
						break;
						
						case $.verto.enum.state.trying:
							//phone.ui.panelPhone.callStatus.text("Р’С‹Р·РѕРІ: " + d.cidString());
							phone.ui.panelPhone.panelClass.hide();
							phone.ui.panelPhone.outgoing.panel.show();
							phone.curr_call = d;
							
							
						break;
						
						case $.verto.enum.state.early:
							//phone.ui.panelPhone.callStatus.text("Р’С‹Р·РѕРІ: " + d.cidString());
						break;	
							
						case $.verto.enum.state.active:				
							phone.ui.panelPhone.panelClass.hide();
							phone.ui.panelPhone.talking.number.val("");
							
							var caller_id_name = d.params.caller_id_name;
							var caller_id_number = d.params.caller_id_number || d.params.destination_number;
							
							phone.ui.panelPhone.talking.talkingName.text(caller_id_name ? caller_id_name: "");
							phone.ui.panelPhone.talking.talkingNumber.text(caller_id_number ? caller_id_number : "<РќРµС‚ РґР°РЅРЅС‹С…>");
							
							
							if (phone.sw){
								phone.sw.getNotifications().then(
									(function(call_id){
										return function(NotificationsList){
											for (var n of NotificationsList)
											{
												if (n.tag == "phone-notification-"+call_id)
												{
													n.close();
												}
											}
										}										
									})(d.callID))
								
							}
							phone.ui.numberPopup.buttonCall.hide();
							phone.ui.numberPopup.buttonTransfer.show();
							phone.ui.numberPopup.buttonTransfer2.show();
							
							phone.ui.panelPhone.talking.panel.show();
							phone.curr_call = d;
						break;
						
						case $.verto.enum.state.hangup:
							//phone.ui.panelPhone.callStatus.text("Р Р°Р·РіРѕРІРѕСЂ Р·Р°РІРµСЂС€С‘РЅ: " + d.cause);
							if (phone.curr_call)
							{
								if (phone.curr_call.callID != d.callID) return;
								if (d.cause != "NO_ROUTE_DESTINATION" && d.time){
									phone.history.push(d);
								}
								phone.sounds.play("endCall");
								
								phone.ui.panelPhone.panelClass.hide();
								
								phone.ui.numberPopup.buttonCall.show();
								phone.ui.numberPopup.buttonTransfer.hide();
								phone.ui.numberPopup.buttonTransfer2.hide();
								
								phone.ui.panelPhone.default.panel.show();
							}
							
						break;
						
						case $.verto.enum.state.destroy:
							
							
							if (phone.sw){
								phone.sw.getNotifications().then(
									(function(call_id){
										return function(NotificationsList){
											for (var n of NotificationsList)
											{
												if (n.tag == "phone-notification-"+call_id)
												{
													n.close();
												}
											}
										}										
									})(d.callID))
							}
							
							if (phone.curr_call && phone.curr_call.callID == d.callID)
							{
								phone.curr_call = null;
								phone.ui.panelPhone.panelClass.hide();
								phone.mute(false);
								phone.ui.panelPhone.default.panel.show();
								return;
							}
						break;
						
						case $.verto.enum.state.held:
						case $.verto.enum.state.purge:
						break;
						default:
							phone.curr_call = d;
						break;
					}
				}
			})(phone),
			
			onWSLogin: (function(phone){
				return function(v, success) {
					
					if (success)
					{	
						phone.verto = v;
						
						phone.ui.numberPopup.buttonCall.show();
						phone.settings.load();
						phone.vw.load();
						phone.history.load();						
						
						phone.timerHandler = setInterval(phone.timer, 500);
						
						phone.firstLoad(true);
						
						phone.ui.auth.dialog.hide();
						phone.ui.page.show();
						phone.ui.auth.error.text("");
						phone.isLogout = false;
					}
					else
					{
						phone.ui.auth.error.text("РћС€РёР±РєР° Р°РІС‚РѕСЂРёР·Р°С†РёРё");
					}
				}
			})(phone),
						
			onWSClose: (function(phone){
				return function(v) {
					
					if (phone.verto && (!phone.isLogout) && (!phone.verto.isLogout))
					{
						phone.logout(false);
						phone.ui.auth.error.text("РЎРѕРµРґРёРЅРµРЅРёРµ РїСЂРµСЂРІР°РЅРѕ");
					}
				}
			})(phone),

			onEvent: (function(phone){
				return function(v, e) {
					
				}
			})(phone)	
	});	
	
}

phone.crmInit = function()
{
	$(".phone-crm-a").remove();
	$(".phone-crm-li").remove();	
	$(".phone-crm-frame-div").remove();
	
	if ((!phone.userCrm) || (!phone.userCrm[0])) 
	{
		delete phone.userCrm;
		return;
	}
		
	
	for (var i=0; i<phone.userCrm.length ; i++ ){
		var crm = phone.crm[phone.userCrm[i]];
		var li =$("<li></li>");
		li.addClass("phone-crm-li");
		
		var a = $("<a data-toggle='tab'></a>");
		a.addClass("phone-crm-a");
		li.append(a);
		
		a.append($("<span> </span>").addClass("glyphicon").addClass("glyphicon-tasks").attr("title",crm.name));
		a.append($("<span></span>").addClass("hidden-sm").addClass("hidden-md").text(" "+crm.name+" "));
		
		
		a.on('shown.bs.tab', function (e) {
			phone.ui.fn.resizeFrames();
		});
		
		var div = $("<div></div>").attr("id","phone-tab-"+phone.userCrm[i]);
		
		div.addClass("tab-pane");
		div.addClass("fade");
		div.addClass("phone-crm-frame-div");
		a.attr("href","#"+div.attr("id"));
		var iframe=$("<iframe src='' frameborder='1'></iframe>");
		iframe.attr("src", crm.url());
		div.append(iframe);
		
		phone.ui.tabs.navbarUi.append(li);
		phone.ui.tabs.tabs.append(div);
		
		crm.ui = {
			frame: iframe,
			tabbutton : a
		}
		var span = $("<span></span>");
		span.addClass("glyphicon");
		span.addClass("glyphicon-export");
		span.css('float','right');
		span.attr("title", "Р©С‘Р»РєРЅРёС‚Рµ РґРІР°Р¶РґС‹ РґР»СЏ РѕС‚РєСЂС‹С‚РёСЏ РІ РЅРѕРІРѕРј РѕРєРЅРµ");
		span.dblclick((function(iframe){
			return function(){
				window.open(iframe.attr('src'))
			};
		})(iframe));
		
		a.append(span);
		
	}
}


phone.viewStatesDuration = function(){
	$('.phone-span-state-duration').each(function(i,elem){
		var e = $(elem);
		var d = e.data();		
		if (d.sdate){
			var sdate = parseInt(d.sdate);
			var diff_sec = Math.round(((new Date).valueOf()-sdate)/1000);
			e.text(phone.common.secondsToString(diff_sec));
			
		}			
		
	});
}


phone.history = {	
	calls:[],
	numbersTransfer:[],
	maxCountCalls: 400,
	maxCountNumbersTransfer: 20,
	load: function(){
		try
		{
			phone.history.calls = [];
			if (localStorage.getItem("history:"+phone.verto.options.login) != null)
			{
				phone.history.calls = JSON.parse(localStorage.getItem("history:"+phone.verto.options.login));
			}
		}
		catch (e)
		{			
		}
		
		phone.ui.history.missedCallsCount.text("");
		phone.ui.history.tableBody.empty();
		
		for (var i in phone.history.calls){
			var row = phone.history.calls[i];
			phone.history.view(row);
		}
		
		try
		{
			phone.history.numbersTransfer =[]
			if (localStorage.getItem("historyNumbersTransfer:"+phone.verto.options.login) != null)
			{
				phone.history.numbersTransfer = JSON.parse(localStorage.getItem("historyNumbersTransfer:"+phone.verto.options.login));
			}
		}
		catch (e)
		{			
		}
		
		for (var i in phone.history.numbersTransfer){
			var num = phone.history.numbersTransfer[i];
			phone.history.viewNumberTransfer(num);
		}
	},
	
	
	push: function(c){
		var row = {
			id: c.params.callID,
			number: c.params.caller_id_number || c.params.destination_number,
			name: c.params.caller_id_name ? c.params.caller_id_name: "",
			direction: c.direction.name,
			time: c.time
		}
		phone.history.calls.push(row);
		phone.history.calls.splice(0, phone.history.calls.length-phone.history.maxCountCalls);

		
		phone.history.view(row, {addToMissedCall: true});
		phone.history.save();
		
	},
	
	view: function(row, opt){
		
		var tr =$("<tr></tr>");
		tr.append($("<td></td>").text(phone.common.formatDate(new Date(row.time.create))));
		tr.append($("<td></td>").text(row.time.start ? phone.common.formatTime(new Date(row.time.start)) : ""));
		
		var td_num = $("<td></td>");
		tr.append(td_num);
		
		var number = row.number;
		
		phone.common.appendNumbersButton(td_num, [number], row.name);
		tr.append($("<td></td>").text(row.name));
		
		
		var direction="";
		if (row.direction == "outbound"){
			direction = "РСЃС…РѕРґСЏС‰РёР№";
		}
		if (row.direction == "inbound"){
			if (row.time.start)
			{			
				direction = "Р’С…РѕРґСЏС‰РёР№";
			}else
			{
				direction = "РџСЂРѕРїСѓС‰РµРЅРЅС‹Р№";
				tr.addClass("phone-history-td-missed");				
				if (opt && opt.addToMissedCall){
					var count = phone.ui.history.missedCallsCount.text();
					if (count == "") count = 0;
					++count;
					phone.ui.history.missedCallsCount.text(count);
				}
			}
		}
		tr.append($("<td></td>").text(direction));
		
		var duration = "";		
		if (row.time.start && row.time.end)
		{
			duration = phone.common.secondsToString(Math.round((new Date(row.time.end) - new Date(row.time.start))/1000 ))
		}		
		tr.append($("<td></td>").text(duration));
		
		phone.ui.history.tableBody.prepend(tr);
	},
	
	save: function(){
		localStorage.setItem("history:"+phone.verto.options.login, JSON.stringify(phone.history.calls));
	},
	
	pushNumberTransfer: function(num){
		var num_pos = phone.history.numbersTransfer.indexOf(num);
		if (num_pos>=0){
			phone.history.numbersTransfer.splice(num_pos,1);
		}
		
		phone.history.numbersTransfer.push(num);
		phone.history.numbersTransfer.splice(0, phone.history.numbersTransfer.length-phone.history.maxCountNumbersTransfer);
		
		phone.history.viewNumberTransfer(num,{removeRepeat:(num_pos>=0)});
		phone.history.saveNumbersTransfer();
		
	},
	viewNumberTransfer: function(num, o){
		opt=$('<option></option>');
		opt.val(num);
		
		if (o && o.removeRepeat){
			phone.ui.panelPhone.talking.numberDataList.find('option[value='+JSON.stringify(num)+']').remove()
		}	
		phone.ui.panelPhone.talking.numberDataList.prepend(opt);
		
	},
	saveNumbersTransfer: function(){
		localStorage.setItem("historyNumbersTransfer:"+phone.verto.options.login, JSON.stringify(phone.history.numbersTransfer));
	}
	
}

phone.ui.history.linkTab.click(function(){
	phone.ui.history.missedCallsCount.text("");
});


phone.crmGoto = function(phoneNum){
	
	if (!phone.userCrm) return;
	//temp code
	if (phoneNum.length<=6) return;
	
	if ((phone.crmLastPhoneNum !== undefined) && (phone.crmLastPhoneNum == phoneNum)) return;
	
	for (var i=0; i<phone.userCrm.length; i++){
		crm_name = phone.userCrm[i];
		var crm = phone.crm[crm_name];
		
		crm.ui.frame.attr("src", crm.url(phoneNum));
		if (i==0){
			crm.ui.tabbutton.click();
		}
	}
	phone.crmLastPhoneNum = phoneNum;
}

phone.logout = function(success){

	if (phone.isLogout) return;
	
	if (phone.curr_call)
	{
		phone.curr_call.hangup();
	}
	
	if (success)
	{
		phone.isLogout = true;
	}
	
	var fn_logout = function(terminate){
		clearInterval(phone.timerHandler);
		if (phone.HTTPHeartbeatHandler)
		{
			clearInterval(phone.HTTPHeartbeatHandler);
			phone.HTTPHeartbeatHandler = null;
		}
		if (phone.wsReloadHandler) clearTimeout(phone.wsReloadHandler);
		phone.userCrm = undefined;


		$("#favicon").attr("href","favicon.ico");
		if (success){
			document.title="Р’С‹С…РѕРґ: Call-С†РµРЅС‚СЂ";
		}
		else
		{
			document.title="Call-С†РµРЅС‚СЂ";
		}
		phone.ui.reconnection.modal('hide');
		phone.ui.auth.dialog.show();
		phone.ui.page.hide();

		if (success){
			phone.wsClose();

			if (phone.verto && (!phone.verto.isLogout))
			{
				phone.verto.logout();			
				phone.verto = null;
			}
		}
	}
	
	// РІС‹РїРѕР»РЅРёС‚СЊ Terminate РїРµСЂРµРґ РІС‹С…РѕРґРѕРј
	if (success && phone.apiSessionID) {
		$.ajax({
			url: '/api',
			type: "POST",
			dataType: "json",
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({
				"method": "Terminate",
			}),
			success: function (result) {
				phone.userId = null;
				phone.apiSessionID = null;
				fn_logout();
			},
			error: function (err) {
				fn_logout();
			}
		});		
	}
	else
	{
		fn_logout();
	}
}



phone.logoutWithStatus = function() {
	if (phone.userId && phone.ws && (phone.ws.readyState == 1))
	{
		phone.ws.send(JSON.stringify({
			"method": "User.Update",
			"filter": {
				"id": phone.userId
			},
			"data": {
				"availStatus": (phone.users[phone.userId] && phone.users[phone.userId].availStatus ? phone.users[phone.userId].availStatus: "away"),
				"busyStatus": "_"
			}		
		}));
	}
	phone.logout(true);
	
}


/*temp code for convert localStorage*/
if (localStorage.getItem("settings")!= null){
	var s = JSON.parse(localStorage.getItem("settings"));
	localStorage.removeItem("settings");
	for (var u in s){
		localStorage.setItem("settings:"+u, JSON.stringify(s[u]));
	}
}

phone.settings = {
	default:{
		ring: "apple_ring.mp3",
		useStun: true,
		playSoundEndCall: true,
		excludeNetworks: null,
		ringVolume: 1
	},
	current:{},
	view:function(){
		var o = phone.settings.current;
		for (var key in o){
			var val = o[key];
			if (phone.ui.settings[key] !== undefined) {
				phone.ui.settings[key].set(val);
			}			
		}
		
	},	
	load: function(){
		try
		{
			phone.settings.current = {};
			if (localStorage.getItem("settings:"+phone.verto.options.login) != null)
			{
				phone.settings.current = JSON.parse(localStorage.getItem("settings:"+phone.verto.options.login));
			}
		}
		catch (e)
		{			
		}
		
		for (var key in phone.settings.default){
			if (phone.settings.current[key] === undefined){
				phone.settings.current[key] = phone.settings.default[key];
			}
		}
		localStorage.setItem("settings:"+phone.verto.options.login, JSON.stringify(phone.settings.current));
		phone.settings.submit();
		phone.settings.view();
	},
	save: function(){
		for (var key in phone.settings.current){
			if (phone.ui.settings[key] !== undefined) phone.settings.current[key] = phone.ui.settings[key].get();
		}		
		localStorage.setItem("settings:"+phone.verto.options.login, JSON.stringify(phone.settings.current));
		phone.settings.submit();
	},
	submit:function(){
		var o = phone.settings.current;
		phone.verto.ringFile("./sounds/"+o.ring, {volume: o.ringVolume});
		phone.sounds.enable = o.playSoundEndCall;
		phone.verto.iceServers(o.useStun ? [{url:'stun:94.141.32.110:3478'}]: [] );
		phone.verto.excludeNetworks(o.excludeNetworks);
	}
}

phone.muted = false; 
phone.mute = function(val){
	if (val === undefined){
		phone.muted = !phone.muted;
	}else{
		phone.muted = val;
	}
	phone.ui.panelPhone.talking.buttonMute.removeClass("phone-panel-mute-on");
	phone.ui.panelPhone.talking.buttonMute.removeClass("phone-panel-mute-off");	
	phone.ui.panelPhone.talking.buttonMute.addClass("phone-panel-mute-"+(phone.muted ? 'on': 'off'));
	phone.ui.panelPhone.talking.buttonMute.attr("title", (phone.muted ? 'Р’РєР»СЋС‡РёС‚СЊ': 'РћС‚РєР»СЋС‡РёС‚СЊ')+' РјРёРєСЂРѕС„РѕРЅ');	
	
	
	if (phone.curr_call)
	{
		var tracks = phone.curr_call.rtc.localStream.getTracks();
		for (var i=0; i<tracks.length; i++){
			tracks[i].enabled = !phone.muted;
		}
	}
}


phone.userGroupsMembersLoad = function(){
	phone.ui.userGroupsMembers.empty();
	if (!phone.apiSessionID) return;
	
	//phone.ui.userGroupsClearAgentState.attr("disabled", "disabled");
	
	$.ajax({
		url: '/api' , 
		type: "POST",
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		data: JSON.stringify({
			"method": "Config.CallGroupAgent.Search",
			"filter": {
				"userID": phone.userId
			}
		}),
		success: function (data) {
			if (data.error !== undefined){
				    alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° "+ data.error + ": "+data.message);
					return;
			}
			
			var call_group_agents = data.elements;
			//if (call_group_agents.length > 0) phone.ui.userGroupsClearAgentState.removeAttr("disabled");
			
			for (var g_agent of call_group_agents){
				var g = phone.call_groups[g_agent.callGroupID];
				
				if (g){
					var g_div=$('<div></div>');
					var fieldset = $('<fieldset data-role="controlgroup"></fieldset>');
					g_div.append(fieldset);
						
					var i_chk = $('<input type="checkbox" />');	

					i_chk.attr('data-call-group-agent-checkbox', g.id);
					i_chk.attr('id', 'call-group-agent-checkbox-'+g.id);
					i_chk.css("cursor", "pointer");
					
					i_chk.prop("checked", !!g_agent.status);
					i_chk.data("callGroupID", g.id);
						
					fieldset.append(i_chk);
					var i_label = $('<label></label>').text(g.commonName ? g.commonName + " ("+ g.name + ")" :g.name )
					i_label.css("margin-left", "1em");
					i_label.css("cursor", "pointer");
					i_label.attr("for", i_chk.attr('id'));
					
					
					fieldset.append(i_label);						
					phone.ui.userGroupsMembers.append(g_div);
					
					
					// temp code
					var disable_rel_call_group_ids = [];
					var disable_matrix = {
						"ic_out": ["ic_customers_service"],
						"ic_customers_service": ["ic_out"],
						"ic_support ": ["ic_support3", "ic_support_duty"],
						"ic_support3": ["ic_support", "ic_support_duty"],
						"ic_support_duty": ["ic_support", "ic_support3"]
					}
					
					if (disable_matrix[g.name] !== undefined){
						var disable_groups = disable_matrix[g.name];
						for (var g_agent2 of call_group_agents){
							var g2 = phone.call_groups[g_agent2.callGroupID];
							if (g2 && (disable_groups.indexOf(g2.name) >= 0))
							{
								disable_rel_call_group_ids.push(g_agent2.callGroupID);
							}
						}
					}					
					i_chk.data("disableRelCallGroupIds", disable_rel_call_group_ids);
					
					
					i_chk.change(function(evt){
						var v = evt.target.checked;						
						if (v) {
							var _disable_rel_call_group_ids = $(evt.target).data().disableRelCallGroupIds;
							if (_disable_rel_call_group_ids) {
								for (var callGroup2ID of _disable_rel_call_group_ids)
								{
									phone.userGroupMemberSet(callGroup2ID, false);
								}
							}
						}
						phone.userGroupMemberSet($(evt.target).data().callGroupID, v);
					})
				}					
			}
		},
		error: function (err) {
			alert("РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° Рє СЃРµСЂРІРµСЂСѓ");
		}
	});		

}


phone.userGroupMemberSet = function(group_id, status){
	if (!phone.apiSessionID) return;
	
	$.ajax({
	   url: '/api' , 
	   type: "POST",
	   dataType: "json",
	   contentType: "application/json; charset=utf-8",
	   data: JSON.stringify({
			"method": "Config.CallGroupAgent.Update",
			"filter": {
				"callGroupID": group_id,
				"userID": phone.userId
			},
			"data": {
				"status": status ? 1: 0
			}
			
	   }),
	   success: function (data) {
		   if (data.error !== undefined){
				alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° "+ data.error + ": "+data.message);
				return;
		   }		   
	   },
	   error: function (err) {
		   alert("РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° Рє СЃРµСЂРІРµСЂСѓ");
	   }		
	 });	
}


phone.userClearState = function(user_id, bundle_id){
	if (!phone.apiSessionID) return;
	
	var params = {
		"method": "Cmd.ResetUserState",
		"params": {
			"userID": (user_id !== undefined ? user_id : phone.userId)
		}			
	}
	if (bundle_id !== undefined) {
		params["params"]["bundleID"] = bundle_id;
	}
	
	$.ajax({
	   url: '/api' , 
	   type: "POST",
	   dataType: "json",
	   contentType: "application/json; charset=utf-8",
	   data: JSON.stringify(params),
	   success: function (data) {
		   if (data.error !== undefined){
				alert("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° "+ data.error + ": "+data.message);
				return;
		   }		   
	   },
	   error: function (err) {
		   alert("РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° Рє СЃРµСЂРІРµСЂСѓ");
	   }		
	 });	
}


phone.ui.panelPhone.talking.buttonMute.click(function(){
	phone.mute();
});


window.onbeforeunload = function(){
	if (phone.verto && (!phone.isLogout) &&(!phone.verto.isLogout)){
		return "Р’С‹ РЅРµ СЃРјРѕР¶РµС‚Рµ РїСЂРёРЅРёРјР°С‚СЊ Р·РІРѕРЅРєРё. Р—Р°РєСЂС‹С‚СЊ СЃС‚СЂР°РЅРёС†Сѓ ?"
	}
};


window.onresize = function(){
	phone.ui.fn.resizeFrames();
}


window.onpagehide = function(){
	if (phone.verto && (!phone.isLogout) && (!phone.verto.isLogout)){
		phone.vw.save();
		phone.logoutWithStatus();
	}
}
//Р“РѕСЂСЏС‡РёРµ РєР»Р°РІРёС€Рё

window.onkeydown = function(evt){	
	
	if ( phone.verto && (!phone.isLogout) && (!phone.verto.isLogout)){
		if (evt.keyCode == 13)
		{
			if (phone.curr_call && (!phone.curr_call.answered))
			{
				phone.curr_call.answer();
			}
		}
		if (evt.keyCode == 27)
		{				
			if (phone.curr_call)
			{
				phone.curr_call.hangup();
			}
			evt.stopPropagation();
			return false;
		}
		if (evt.keyCode == 113){ //F2
			phone.setState("away", "away");
			
		}

		
		if (evt.keyCode == 115){ //F4
			phone.setState("dnd", ((phone.userManageTags.indexOf("ic_support")>=0) ? "lunch-break" : "dnd"));
			
		}
		if (evt.keyCode == 118){ //F7
			phone.setState("avail", "avail");
			
		}
		if (evt.keyCode == 37){ //в†ђ
			phone.ui.panelPhone.talking.buttonTransferCancel.click();
			event.stopPropagation();
			return false;
		}
		//в†‘ в†“
		if ((evt.keyCode == 38) || (evt.keyCode == 39) || (evt.keyCode == 40)){
			event.stopPropagation();
			return false;
		}
	}	
}


$(document).ready(function() {	
	phone.ui.auth.dialog.show();
	phone.ui.page.hide();	
	Notification.requestPermission();
});
