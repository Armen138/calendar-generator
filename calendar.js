var Import = function (vcal) {
	var cal = vcal.split('\n'),
		getDepth = function (o) {
			var d = 0;
			while(o.parent) {
				d++;
				o = o.parent;
			}
			return d;
		},
		stripCyclic = function (o) {
			if(typeof o != "object") {
				return;
			}
			for(var p in o) {
				if(typeof o[p] == "object") {							
					if(p == "parent") {
						delete o[p];
					}
					stripCyclic(o[p]);
				}
			}			
		},
		getObject = function () {
			var i, d,
				object = {},
				inside = object,
				node = "",
				nodeName = "",
				sectionName = "",
				depth = 0;
			if(vcal == "") {
				return null;
			}	
			for(i = 0; i < cal.length; i++) {
				node = cal[i].split(':');
				nodeName = node[0].replace("value", "").replace(";", "").replace("=", "_").replace(/-/g, "_").toLowerCase();
				depth = getDepth(inside);
				for(d = 0; d < depth; d++) {
					debugText += "&nbsp;&nbsp;&nbsp;&nbsp;";
				}
				debugText += nodeName + " = " + node[1] + "<br/>";
				switch(nodeName) {
				case "begin":
					sectionName = node[1].toLowerCase();
					if(!inside[sectionName]) {
						inside[sectionName] = [];						
					}
					inside[sectionName].push({ parent: inside });
					inside = inside[sectionName][inside[sectionName].length - 1];				
					break;
				case "end":
					if(inside.parent) {
						inside = inside.parent;
					} else {
						alert("ran out of calendar");
					}
					break;
				default:
					inside[nodeName] = node[1];
					break;
				}
			}
			stripCyclic(object);
			return object;
		};
	this.debug = function() {
		$(document.body).html(JSON.stringify(getObject()));
	}
	this.ical = function() {
		return getObject();
	}
};

var Calendar = function (target, year, ical) {
	var pretty = {
			day : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			month : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
		},
		i,
		findEvent = function(ical, date) {
			var c = ical.vcalendar[0].vevent;
			for(i = 0; i < c.length; i++) {
				if(c[i].dtstart){					
					var ds = c[i].dtstart.split("t")[0];					
					if(ds == date) {
						//alert(ds + "==" + date);
						return c[i].summary;
					}
				}
			}
			return "";
		},
		drawHead = function(idx) {
			var h = "",
				title = " " + year;
			if(ical) {
				title = " " + ical.vcalendar[0].x_wr_calname + " " + year;
			}
			h += "<div class='monthhead'>" + pretty.month[idx] + title + "</div>";
			for(i = 0; i < 7; i++) {
				h += "<div class='dayhead'>" + pretty.day[i] + "</div>";
			}
			target.append(h);
		},
		drawMonth = function(idx) {
			var d = new Date(year, idx, 1),
				dayCount = 32 - new Date(year, idx, 32).getDate(),
				box = "";
			for(i = 0; i < d.getDay(); i++) {
				box += "<div class='noday'/>";
			}
			for(i = 1; i < dayCount + 1; i++) {
				var ds = year + "" + (idx + 1 < 10 ? "0" : "") + (idx + 1) + "" + (i < 10 ? "0" : "") + i;			
				box += "<div class='day' id='date" + ds + "'>" + i + "</div>"
			}
			target.append(box);
		};
	this.draw = function(idx) {
		drawHead(idx);
		drawMonth(idx);
	}
};

var Year = function(year, ical) {		
		drawYear = function(horiz, verti) {
			$(document.body).html("");
			var pages = Math.ceil(12 / (horiz * verti));
			for(var i = 0; i < pages; i++) {
				var page = $("<div class='page'/>");
				for(p = 0; p < Math.floor(12 / pages); p++) {
					var box = $("<div class='calendar' />");
					box.css("width", Math.floor(100.0 / horiz) + "%");
					box.css("height", Math.floor(100.0 / verti) + "%");		
					page.append(box);
					new Calendar(box, year, ical).draw(p + i * Math.floor(12 / pages));
				}
				$(document.body).append(page);		
				
			}	
		};
	this.draw = function(h, v) {
		drawYear(h, v);
		if(ical) {
			var events = ical.vcalendar[0].vevent;
			for(i = 0; i < events.length; i++) {
				if(events[i].dtstart) {
					var dayId = "date" + events[i].dtstart.split("T")[0];
					if($('#' + dayId)) {
						$('#' + dayId).append("<br/>" + events[i].summary);
					}
				}
			}
		}
	}
};

$(function() {
	$(document.body).html("<div class='init'>Year<br/><input type='text' id='yearinput' /><br/>\
	Horizontal months per page <br/><input type='text' id='horizinput' /><br/>\
	Vertical months per page <br/><input type='text' id='vertiinput' /><br/>\
	ICAL data<br/><textarea value='vcal' id='vcal'></textarea><br/><a href='#' id='get'>generate</a></div>");
	$("#get").live("click", function() {
		var val = $("#vcal").val(),
			vcal = new Import(val);
			happy = new Year(parseInt($("#yearinput").val(), 10), vcal.ical());
			happy.draw(parseInt($("#horizinput").val(), 10), parseInt($("#vertiinput").val(), 10));		
	});	
});
