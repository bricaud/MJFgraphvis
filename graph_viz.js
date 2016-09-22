var graph_viz = (function(){
	"use strict";

	var _svg = {};
	var _nodes = {};
	var _links = {};
	var simulation = {};
	var _Nodes = [];
	var _Links = [];





	function init(label,width,height){
		if (!d3.select(label).select("svg"))
			_svg = d3.select(label).append("svg").attr("width",width).attr("height",height);
		else 
			_svg = d3.select(label).select("svg");
			//width = +svg.attr("width");
		    //height = +svg.attr("height");
	}

	function svg_handle(){
		return _svg;
	}

	function nodes(){
		return _nodes;
	}

	function nodes_data(){
		return _Nodes;
	}

	function links(){
		return _links;
	}

	function links_data(){
		return _Links;
	}
	
	///////////////////////////////////////
	// Remove force layout and data
	function clear(){
    	simulation.stop();
    	simulation.nodes([]);
  		simulation.force("link").links([]);
  		//var svg = d3.select("svg");
  		//var svg_graph = d3.select("#main").select("svg").select("g");
  		_svg.selectAll("*").remove();
  		_Nodes = [],_Links =[];
  		layers.clear_old();
  		simulation = {};
	}


	function addzoom (){
  		_svg.append("rect")
    		.attr("width", width).attr("height", height)
    		.style("fill", "none").style("pointer-events", "all")
    		.call(d3.zoom().scaleExtent([1 / 2, 4]).on("zoom", zoomed));
    	_svg = _svg.append("g");

    	function zoomed() {
			_svg.attr('transform', d3.event.transform);
		}
    	return _svg;
	}

	//////////////////////////////////////////////////////////////
	var layers = (function(){

		var nb_layers = 1;
		var old_Nodes = [];
		var old_Links = [];

		function set_nb_layers(nb){
			nb_layers = nb;
		}

		function depth(){
			return nb_layers;
		}

		function push_layers(){
			// old links and nodes become older
			// and move to the next layer
	  		for (var k=nb_layers;k>0;k--) {
	    		var kp=k-1;
	    		_svg.selectAll(".old_links"+kp).attr("class","old_links"+k);
	    		_svg.selectAll(".old_node"+kp).attr("class","old_node"+k);
	  		};
		}

		function clear_old(){
			old_Nodes = [];
			old_Links = [];
		}

		function update_data(d){
			// Save the data
			var previous_nodes =  _svg.selectAll("g").filter(".node");
			var previous_nodes_data = previous_nodes.data();
			old_Nodes = updateAdd(old_Nodes,previous_nodes_data);
			var previous_links =  _svg.selectAll(".links");
			var previous_links_data = previous_links.data();
			old_Links = updateAdd(old_Links,previous_links_data);

			// handle the pinned nodes
		  	var pinned_Nodes = _svg.selectAll("g").filter(".pinned");
		  	var pinned_nodes_data = pinned_Nodes.data(); 
		  	// get the node data and merge it with the pinned nodes
		  	_Nodes = d.nodes;
		  	_Nodes = updateAdd2(_Nodes,pinned_nodes_data);
		  	// add coordinates to the new active nodes that already existed in the previous step
		  	_Nodes = transfer_coordinates(_Nodes,old_Nodes);
		  	// retrieve the links between nodes and pinned nodes
		  	_Links = d.links.concat(previous_links_data); // first gather the links
		  	_Links = find_active_links(_Links,_Nodes); // then find the ones that are between active nodes

		}

		///////////////////////////////////////////////////////////////////////////
		//update lines of array1 with the ones of array2 when the elements' id match
		// and add elements of array2 to array1 when they do not exist in array1
		function updateAdd(array1,array2){
		  var arraytmp = array2.slice(0);
		  var removeValFromIndex = [];
		  array1.forEach(function(d,index,thearray){ 
		    for(var i=0;i<arraytmp.length;i++){
		      if (d.id == arraytmp[i].id){
		        //console.log(d.id);
		        thearray[index] = arraytmp[i];
		        removeValFromIndex.push(i);
		        //console.log('Found existing one!')
		      }
		    }
		  });
		  // remove the already updated values (in reverse order, not to mess up the indices)
		  removeValFromIndex.sort();
		  for (var i = removeValFromIndex.length -1; i >= 0; i--)
		    arraytmp.splice(removeValFromIndex[i],1);
		  return array1.concat(arraytmp);
		}

		////////////////////////////////////////////////////////////////////////////
		//update lines of array1 with the ones of array2 when the elements' id match
		// and add elements of array2 to array1 when they do not exist in array1
		function updateAdd2(array1,array2){
		  var arraytmp = array2.slice(0);
		  var removeValFromIndex = [];
		  array1.forEach(function(d,index,thearray){ 
		    for(var i=0;i<arraytmp.length;i++){
		      if (d.id == arraytmp[i].id){
		        //console.log(d.id);
		        thearray[index] = arraytmp[i];
		        removeValFromIndex.push(i);
		        //console.log('Found existing one!')
		      }
		    }
		  });
		  // remove the already updated values (in reverse order, not to mess up the indices)
		  removeValFromIndex.sort();
		  //console.log('nb to remove: '+removeValFromIndex.length);
		  //console.log(removeValFromIndex);
		  for (var i = removeValFromIndex.length -1; i >= 0; i--){
		    arraytmp.splice(removeValFromIndex[i],1);
		    //console.log(i,removeValFromIndex[i]);
		    }
		  //console.log('nb of new nodes: '+ arraytmp.length)
		  return array1.concat(arraytmp);
		}

		///////////////////////////////////////////////////////////////////
		function find_active_links(list_of_links,active_nodes){
		  // find the links in the list_of_links that are between the active nodes and discard the others
		  var active_links = [];
		  list_of_links.forEach(function (row) {
		    //console.log('search for:')
		    //console.log(row)
		    //console.log(row.source,row.target)
		    for(var i=0; i < active_nodes.length; i++ ) {
		      for(var j=0; j < active_nodes.length; j++ ) {
		        if (active_nodes[i].id==row.source.id && active_nodes[j].id==row.target.id) {
		          //console.log('found match!',_Nodes[i].id,_Nodes[j].id);
		          var L_data={source:row.source.id, target:row.target.id, type:row.type, value:row.value, id:row.id};
		          active_links=active_links.concat(L_data);
		        }
		        else if (active_nodes[i].id==row.source && active_nodes[j].id==row.target) {
		          //console.log('found match!',_Nodes[i].id,_Nodes[j].id);
		          var L_data=row;
		          active_links=active_links.concat(L_data);
		        }
		      }
		    }
		  });
		  // the active links are in active_links but the can be some duplicates
		  // remove duplicates links
		  var dic = {};
		  for ( var i=0; i < active_links.length; i++ )
		    dic[active_links[i].id]=active_links[i]; // this will remove the duplicate links (with same id)
		  var list_of_active_links = [];
		  for (var key in dic)
		    list_of_active_links.push(dic[key]);
		  return list_of_active_links;
		} 

		//////////////////////////////////////////////////////////////////
		// transfer coordinates from old_nodes to the nodes, for the nodes 
		// that already existed in old_nodes
		function transfer_coordinates(Nodes, old_Nodes){
		  for ( var i=0; i < old_Nodes.length; i++ ) {
		    var exists = 0;
		    for(var j=0; j < Nodes.length; j++ ) {
		      if (Nodes[j].id==old_Nodes[i].id) {
		        Nodes[j].x = old_Nodes[i].x;
		        Nodes[j].y = old_Nodes[i].y;
		        Nodes[j].fx = old_Nodes[i].x;
		        Nodes[j].fy = old_Nodes[i].y;
		        Nodes[j].vx = old_Nodes[i].vx;
		        Nodes[j].vy = old_Nodes[i].vy;
		        //console.log(old_Nodes[i].x,old_Nodes[i].y);
		        //console.log(Nodes[j].x,Nodes[j].y);
		      }
		    }
		  }
		  return Nodes;
		}


//		function remove_duplicates(){
			// remove all the duplicate nodes and links among the old_nodes and old_links
	  	function remove_duplicates(elem_class,elem_class_old){
	  		d3.selectAll(elem_class).each(function(d){
	    		var ID=d.id;
	    		for(var n=0;n<nb_layers;n++){
	      			var list_old_elements = d3.selectAll(elem_class_old+n);
	      			//list_old_nodes_data = list_old_nodes.data();
	      			list_old_elements.each(function(d){
	        			if(d.id==ID){
	          				d3.select(this).remove();
	          				//console.log('Removed!!')
	        			}
	      			})
	    		}
	  		});
	  	}
//		}

		return{
			set_nb_layers : set_nb_layers,
			depth:depth,
			push_layers : push_layers,
			clear_old:clear_old,
			update_data : update_data,
			remove_duplicates : remove_duplicates
		}
	})();

	////////////////////////////////////////////////////////////////////////////////////
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

	var graph_events = (function (){
		//////////////////////////////////
  		// Handling mouse events

  		function dragstarted(d) {
  			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  			d.fx = d.x;
  			d.fy = d.y;
    	/*
    	svg.selectAll(".old_node").each(function(d){
    	  if (d3.select(this).attr("ID")== +d.id) {d3.select(this).remove(); console.log('removed!')};
    	});
    	svg.selectAll(".old_links").each(function(d){
    	  if (d3.select(this).attr("target_ID")== +d.id) {d3.select(this).remove(); console.log('removed!')};
    	});
    	svg.selectAll(".old_links").each(function(d){
    	  if (d3.select(this).attr("source_ID")== +d.id) {d3.select(this).remove(); console.log('removed!')};
  		});*/
		}

		function dragged(d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		function dragended(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
	    	// d.fx = null;
	    	// d.fy = null;
		}

		function clicked(d) {
			d3.select(".Active").remove();
	    	//d3.select(this)
	    	//  .append("circle").classed("Active",true)
	    	//  .attr("r", 4)
	    	//  .attr("transform", function(d) { return "translate(-12,-12)"; })
	    	//  .attr("fill", function(d) { return color(d.labelV); });
	    	var input = document.getElementById ("freeze-in");
	    	var isChecked = input.checked;
	    	if (isChecked) infobox.display_info(d);
	    	else {
	    		simulation.stop();
	    		_svg.selectAll(".old_node"+layers.depth()).remove();
	    		_svg.selectAll(".old_links"+layers.depth()).remove();
	    		infobox.display_info(d);
	    		click_query(d);              
	    		//d3.select(this).attr("class","active_node");
	    		console.log('event!!')
			}
		}


		function pin_it(d){
			d3.event.stopPropagation();
			var node_pin = d3.select(this);
			var pinned_node = d3.select(this.parentNode);
			//console.log('Pinned!')
		    //console.log(pinned_node.classed("node"));
		    if (pinned_node.classed("node")){
		    	if (!pinned_node.classed("pinned")){
		    		pinned_node.classed("pinned",true);
		    		console.log('Pinned!');
		    		node_pin.attr("fill", "#000");
		    		pinned_node.moveToFront();
		    	}
		    	else {
		    		pinned_node.classed("pinned",false);
		    		console.log('Unpinned!');
		    		node_pin.attr("fill", function(d) { return color(d.labelV); });
		    	}
		    }
		}
		return {
			dragstarted:dragstarted,
			dragged:dragged,
			dragended:dragended,
			clicked:clicked,
			pin_it:pin_it
		}

	})();

	return {
		svg_handle : svg_handle,
		nodes : nodes,
		links : links,
		nodes_data : nodes_data,
		links_data : links_data,
		init : init,
		addzoom : addzoom,
		clear : clear,
		simulation : simulation,
		simulation_start : simulation_start,
		layers : layers,
		graph_events : graph_events
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