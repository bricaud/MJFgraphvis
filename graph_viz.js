var graph_viz = (function(){
	"use strict";

	var svg = {};
	var nodes = {};
	var links = {};
	var simulation = {};

	function init(label,width,height){
		if (!d3.select(label).select("svg"))
			svg = d3.select(label).append("svg").attr("width",width).attr("height",height);
		else 
			svg = d3.select(label).select("svg");
			//width = +svg.attr("width");
		    //height = +svg.attr("height");
	}

	function svg_handle(){
		return svg;
	}

	///////////////////////////////////////
	// Remove force layout and data
	function clear(){
    	simulation.stop();
    	simulation.nodes([]);
  		simulation.force("link").links([]);
  		//var svg = d3.select("svg");
  		var svg_graph = d3.select("#main").select("svg").select("g");
  		svg_graph.selectAll("*").remove();
  		old_Links = [],old_Nodes = [],Nodes = [],Links =[];
  		simulation = {};
	}


	function addzoom (){
  		svg.append("rect")
    		.attr("width", width).attr("height", height)
    		.style("fill", "none").style("pointer-events", "all")
    		.call(d3.zoom().scaleExtent([1 / 2, 4]).on("zoom", zoomed));
    	svg = svg.append("g");

    	function zoomed() {
			svg.attr('transform', d3.event.transform);
		}
    	return svg;
	}

	

	function simulation_start(center_f){
		simulation = d3.forceSimulation()
			.force("charge", d3.forceManyBody().strength(-100))
			.force("link", d3.forceLink().strength(0.5).id(function(d) { return d.id; }));

		if (center_f == 1){
			var artist_fy=0.1,band_fy=0.1+0.01,concert_fy=0.1-0.01;
			var artist_fx=0.1,band_fx=0.1,concert_fx=function(concertDate){return (0.1+0.1*Math.atan((1991-concertDate.getFullYear())/50.0));};
			simulation.force("center", d3.forceCenter(width / 2, height / 2));
		}
		else {
			var artist_fy=0,band_fy=0.01,concert_fy=-0.01;
			var artist_fx=0,band_fx=0,concert_fx=function(concertDate){return Math.atan((1991-concertDate.getFullYear())/50.0)/3;};
		}
		simulation.force("y",d3.forceY().strength(function(d){
			if (d.labelV === "Artist") return artist_fy;
			else if (d.labelV === "Band") return band_fy;
			else if (d.labelV === "Concert") return concert_fy;
		}))
		.force("x",d3.forceX().strength(function(d){
			if (d.labelV === "Artist") return artist_fx;
			else if (d.labelV === "Band") return band_fx; 
			else if (d.labelV === "Concert")   { var concertDate = new Date(d.Date); return concert_fx(concertDate);};
		}));
		return simulation;
	}

	return {
		svg_handle : svg_handle,
		nodes : nodes,
		links : links,
		init : init,
		addzoom : addzoom,
		clear : clear,
		simulation : simulation,
		simulation_start : simulation_start
	};

})();

////////////////////////////////////
var utils = (function (){
	//////////////////////////////////////////////
	function show_names(){
  		var text_to_show = d3.selectAll(".text_details");
  		var input = document.getElementById ("showName");
  		var isChecked = input.checked;
  		if (isChecked) text_to_show.style("visibility", "visible");
  		else {text_to_show.style("visibility", "hidden");}
	}	
	return {show_names:show_names};
})();