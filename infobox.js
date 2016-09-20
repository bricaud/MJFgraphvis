var infobox = (function(){
	"use strict";

	//private variables
	var _side_DB_info = {};
	var _side_summary = {};
	var _side_image = {};
	var _bottom_info = {};
	//console.log("infobox loaded.");

	////////////////////////
	// Public function
	function create(label_side,label_bottom){
		var side_bar = d3.select("#details");
		var bottom_bar= d3.select("#Wiki_details");
		_side_DB_info = side_bar.append("table").attr("id","tabledetails");
		_side_summary = side_bar.append("p").attr("id","psummary");
		_side_image = side_bar.select("svg").append("svg:image");
		_bottom_info = bottom_bar.append("p").attr("id","pwiki");
	}

	function display_info(node_data){
		_display_DBinfo(node_data,_side_DB_info);
		_display_WIKIinfo(node_data,_side_summary,_side_image,_bottom_info);
	    console.log('Node ID: '+node_data.MJFid);
	}

	//////////////////////
	// Private functions
	function _display_DBinfo(d,_side_DB_info){
		// remove previous info
	  	_side_DB_info.select("tbody").remove();
	  	// create the new table
	  	var tbodyD = _side_DB_info.append("tbody");
	  	var ligne1 = tbodyD.append("tr");
	  	ligne1.append("td").text(d.labelV);
	  	if (d.labelV=="Concert"){
	  		ligne1.append("td").text(d.name);
	  		var ligne2 = tbodyD.append("tr");
	  		ligne2.append("td").text("Date");
	  		ligne2.append("td").text(d.Date);
		}
		else if (d.labelV=="Artist"){
	  		ligne1.append("td").text(d.Firstname + " " + d.Lastname);
	  	}
	  	else if (d.labelV=="Band"){
	 		ligne1.append("td").text(d.name);
	 	}
	  	var ligne3 = tbodyD.append("tr");
	  	ligne3.append("td").text("ID");
	  	ligne3.append("td").text(d.MJFid);
	  	var ligne4 = tbodyD.append("tr");
	  	ligne4.append("td").text("Genre");
	  	ligne4.append("td").text(d.genre);
	  	var ligne5 = tbodyD.append("tr");
	  	ligne5.append("td").text("GenreW");
	  	ligne5.append("td").text(d.genreW);
	  	var ligne6 = tbodyD.append("tr");
	  	ligne6.append("td").text("GenreF");
	  	ligne6.append("td").text(d.genreF);
	  	var ligne7 = tbodyD.append("tr");
	  	ligne7.append("td").text("GenreT");
	  	ligne7.append("td").text(d.genreT);
	  	//concertDate = new Date(d.Date);
	  	//console.log(d.Date+' converted to '+concertDate+ ' YEAR '+concertDate.getFullYear());
	}

	// Wiki part
	function _display_WIKIinfo(d,_side_summary,_side_image,_bottom_info){
		
	  	//var summary = d3.select("#psummary");
	  	var summary = _side_summary;
	  	//var bottom_info = d3.select("#pwiki");
	  	var bottom_info = _bottom_info;
	  	//var img = d3.select("#details").select("svg").select("image");
	  	var img = _side_image;
	  	// clear previous info
	  	summary.text('');
	  	bottom_info.text('');
	  	img.attr("xlink:href",'')
	    	.attr("width", "200")
	    	.attr("height", "200");
	    var node_id = +d.MJFid;
	    if (d.labelV!="Artist"){
	    	var json_file=null;
	    	if (d.labelV=="Concert") json_file = JSON_CONCERTS;
	    	else if (d.labelV=="Band") json_file = JSON_BANDS;
	  		$.getJSON(json_file, function(json) {
	                //console.log(concert_id);
	                //console.log(+artist_id);
	                //console.log('read json file')
	                //console.log(json[node_id]);
	                //sumD = d3.select("#psummary").text(json[concert_id].summary);
	                summary.text(json[node_id].summary);
	                //pw = d3.select("#pwiki");
	                bottom_info.text('Wiki name: '+json[node_id].searchQ + ',  Wiki suggestion: ' + json[node_id].sug_searchQ + ',  Wiki categories: ' + json[node_id].categories);
	                //var img = d3.select("#details").select("svg").select("image");
	                img.attr("xlink:href",json[node_id].image)
	                    .attr("width", "200")
	                    .attr("height", "200");

	                }); 
		}
	}


	return {
		create : create,
		display_info : display_info
	};

})();