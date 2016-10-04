


function post_cypherquery() {
  // Neo4j CYPHER query
  var input_string = $('#cypher-in').val();
  var filtered_string = input_string.replace(/[^a-zA-Z]+/g, ''); //refuse any character not in the alphabet
  if (filtered_string.length>30) filtered_string = filtered_string.substring(0,30); // shorten long strings
  // save the query in a file using PHP
  user_action = "user_action=query&request="+filtered_string;
  request = $.ajax({
    url: "/monitor.php",
    type: "POST",
    //contentType:"text/plain; charset=utf-8",
    data: user_action
  });
  // Callback handler that will be called on success
  request.done(function (response, textStatus, jqXHR){
    // Log a message to the console
    console.log("Hooray, it worked!");
  });

  // call the graph database
  if ($('#n_type').val()==1){
    var neo_query = "MATCH path = (n:Artist)--(m:Concert) WHERE (n.firstname =~ '(?i)"+filtered_string+".*' OR n.lastname =~ '(?i)"+filtered_string+".*') RETURN n,m,path ";}
  else if ($('#n_type').val()==2){
    var neo_query = "MATCH path = (n:Artist)--(m:Band) WHERE (n.firstname =~ '(?i)"+filtered_string+".*' OR n.lastname =~ '(?i)"+filtered_string+".*') RETURN n,m,path ";}
  else if ($('#n_type').val()==3){
    var neo_query = "MATCH path = (n:Artist)--(m) WHERE (n.firstname =~ '(?i)"+filtered_string+".*' OR n.lastname =~ '(?i)"+filtered_string+".*') RETURN n,m,path ";}

  // while busy, show we're doing something in the messageArea.
  $('#messageArea').html('<h3>(loading)</h3>');

  var post_request = {"statements":[{"statement": neo_query,"resultDataContents":["graph"]}]};

  // get the data from neo4j
  $.ajax({
    type: "POST",
    accept: "application/json",
    contentType:"application/json; charset=utf-8",
    url: GRAPH_DATABASE_URL,
    headers: GRAPH_DATABASE_AUTH,
    Timeout: 2000,
    data: JSON.stringify(post_request),
    success: function(data, textStatus, jqXHR){
      //console.log(data,data.results[0].data.length);
      //if (!jQuery.isEmptyObject(data)){
      if (data.results[0].data.length>0){
        $('#outputArea').html("<p>Query: name starting with '"+ filtered_string +"'</p>");
        $('#messageArea').html('');
        //console.log(data);
        Data = data;
        graph = arrange_data(Data);
        //console.log(graph);
        //Nodes = graph.nodes;
        //Links = graph.links;
        //Nodes.push(graph.nodes);
        //Links.push(graph.links);
        refresh_data(graph,center_f=1,active_node=null); //center_f=0 mean no attraction to the center for the nodes
      }
      else {
        $('#outputArea').html("<p>Query '"+ filtered_string +"' not found</p>");
        $('#messageArea').html('');
      }
    },
    failure: function(msg){
      console.log("failed",msg);
      $('#outputArea').html("<p> Can't access database </p>");
      $('#messageArea').html('');
    }
  });
}


function click_query(d) {
  // Neo4j query
  if (d.labelV === "Artist") 
    var neo_query = "MATCH path = (n:Artist)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path ";
  else if (d.labelV === "Concert") 
    var neo_query = "MATCH path = (n:Concert)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path ";
  else if (d.labelV === "Band") 
    var neo_query = "MATCH path = (n:Band)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path "; 
  //console.log(neo_query)
  //var neo_query = "MATCH path = (n)--(m) WHERE (n.id = "+d.MJFid+") RETURN m,path "; 
  // while busy, show we're doing something in the messageArea.
  $('#messageArea').html('<h3>(loading)</h3>');

  var post_request = {"statements":[{"statement": neo_query,"resultDataContents":["graph"]}]};

  // get the data from neo4j
  $.ajax({
    type: "POST",
    accept: "application/json",
    contentType:"application/json; charset=utf-8",
    url: GRAPH_DATABASE_URL,
    headers: GRAPH_DATABASE_AUTH,
    Timeout:2000,
    data: JSON.stringify(post_request),
    success: function(data, textStatus, jqXHR){
      //console.log(graph);
      //console.log(data);
      //Data.results[0].data = Data.results[0].data.concat(data.results[0].data);
      //console.log(Data);
      Data = data;
      graph = arrange_data(Data);
      refresh_data(graph,center_f=0,active_node=d.id); //center_f=0 mean no attraction to the center for the nodes              
    },
    failure: function(msg){
      console.log("failed");
      $('#outputArea').html("<p> Can't access database </p>");
      $('#messageArea').html('');
    }
  });
  $('#outputArea').html("<p>Query ID: "+ d.MJFid +"</p>");
  $('#messageArea').html('');
}

///////////////////////////////////////////////////
function idIndex(a,id) {
  // find the element in a with id id
  // return its index or null if there is no
  for (var i=0;i<a.length;i++) {
    if (a[i].id == id) return i;
  }
  return null;
}  

/////////////////////////////////////////////////////////////
function arrange_data(data) {
  // Extracting node and edges from the data
  // to create the graph object
  var nodes=[], links=[];
  data.results[0].data.forEach(function (row) {
    row.graph.nodes.forEach(function (n) {
      if (idIndex(nodes,n.id) == null)
        nodes.push({id:n.id,labelV:n.labels[0],Firstname:n.properties.firstname,Lastname:n.properties.lastname, MJFid:n.properties.id, name:n.properties.name, Date:n.properties.date,
        genre:n.properties.genre,genreW:n.properties.genreW,genreT:n.properties.genreT,genreF:n.properties.genreF,degree:n.properties.degree});
    });
    links = links.concat( row.graph.relationships.map(function(r) {
      //return {source:idIndex(nodes,r.startNode),target:idIndex(nodes,r.endNode),type:r.type, value:1, id:r.id};
      return {source:r.startNode,target:r.endNode,type:r.type, value:1, id:r.id};
    }));
  });
  graph = {nodes:nodes, links:links};
  return graph;
}


/////////////////////////////////////////////////////////////
// decorate the node
function decorate_node(node,with_active_node){
  // the node layout is defined here
  // function for drawing the node size according to the node degree
  
  var color_scale = d3.scaleOrdinal(d3.schemeCategory10);
  var color_list = {"Artist": "#E81042", "Concert": "#80e810", "Band": "#10DDE8"};
  var color_list = {"Artist": "blue", "Concert": "green", "Band": "orange"};
  var color_list = {"Artist": color_scale(1), "Band": color_scale(2), "Concert": color_scale(3)};
  //var color_list = {"Artist": color_scale(7), "Band": color_scale(8), "Concert": color_scale(9)};
  //color assignment
  //var get_color = {"gpe": "#E81042", "person": "#80e810", "org": "#10DDE8"};

  function node_size(d){
    return (2*Math.sqrt(d.degree)+8);
  }
  node.moveToFront();

  var node_base_circle = node.append("circle").classed("base_circle",true)
      //.attr("r", 12)
      .attr("r",node_size)
      //.attr("fill", function(d) { return color(d.group); })
      .style("stroke-width", function(d) {
        var returnWidth;
        if (d.labelV === "Artist") { returnWidth = 1;
        } else if (d.labelV === "Concert") { returnWidth = 2;
        } else if (d.labelV === "Band") { returnWidth = 2; }
        return returnWidth;})
      .style("stroke","black")
      .attr("fill", function(d) { return color_list[d.labelV]; });

  //node_base_circle.transition();

  node_base_circle.append("title")
    .text(function(d) { 
      var returnName;
      if (d.labelV === "Artist") { returnName = d.Firstname + " " + d.Lastname;
      } else if (d.labelV === "Concert") { returnName = d.name + "\n"+ d.Date;
      } else if (d.labelV === "Band") { returnName = d.name; }
      return returnName;
    });


  var icone = node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .style('font-family', 'FontAwesome')
    .style('font-size', '14px')
    .style('display','inline')
    .text(function(d) { var returnico;
      if (d.labelV === "Artist") { returnico = '\uf007';} 
      else if (d.labelV === "Band") { returnico = '\uf0c0';} 
      else if (d.labelV === "Concert") { returnico = '\uf001';} 
      return returnico;});
 

  var text_name = node.append("text").classed("text_details",true)
    //.attr("x", 12)
    .attr("x",function(d){return node_size(d)+2;})
    //.attr("y", ".31em")
    .text(function(d) { 
      var returnName;
      if (d.labelV === "Artist") { returnName = d.Firstname + " " + d.Lastname;
      } else if (d.labelV === "Concert") { returnName = d.name ;
      } else if (d.labelV === "Band") { returnName = d.name; }
      return returnName;
    })
    .style("visibility", "hidden");

  var text_date = node.append("text").classed("text_details",true)
    //.attr("x", 12)
    //.attr("y", 15)
    .attr("x",function(d){return node_size(d)+2;})
    .attr("y",node_size)
    .text(function(d) { 
      var returnName;
      if (d.labelV === "Concert") { returnName = d.Date;} 
      return returnName;
    })
    .style("visibility", "hidden");

//  var node_pin = node.append("circle").classed("Pin",true)
//      .attr("r", node_size)
//      .attr("transform", function(d) { return "translate("+node_size(d)/2+","+(-node_size(d)/2)+")"; })
//      .attr("fill", function(d) { return color(d.labelV); })
//      .moveToBack()
  
  var node_pin = node.append("circle").classed("Pin",true)
      .attr("r", function(d){return node_size(d)/2;})
      .attr("transform", function(d) { return "translate("+(node_size(d)*3/4)+","+(-node_size(d)*3/4)+")"; })
      .attr("fill", function(d) { return color_list[d.labelV]; })
      .moveToBack()
      .style("visibility", "hidden");

  // spot the active node and draw a circle around it
  if(with_active_node){
    d3.selectAll(".node").each(function(d){
      if(d.id==with_active_node){
        n_radius = Number(d3.select(this).select(".base_circle").attr("r"))+6;
        console.log(d3.select(this).select("circle").attr("r"))
        console.log(n_radius)
        d3.select(this)
          .append("circle").classed("Active",true)
          .attr("r", n_radius)
          .attr("fill", function(d) { return color_list[d.labelV]; })
          .attr("opacity",0.3)
          .moveToBack();
          //.attr("transform", function(d) { return "translate(-12,-12)"; })
          //.attr("fill", function(d) { return color(d.labelV); });
          //.append("circle").classed("Active",true)
          //.attr("r", 4)
          //.attr("transform", function(d) { return "translate(-12,-12)"; })
          //.attr("fill", function(d) { return color(d.labelV); });
      }
    });
  }
}

///////////////////////////////////////
// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() {
  // move the selection to the front  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
////////////////////////////////////
d3.selection.prototype.moveToBack = function() {
  // move the selection to the back  
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  });
};



/*
////////////////////////////////////////////
// force directed with D3 V3
function draw_forced_directory(data){

    var graph = arrange_data(data);
    // force layout setup
    var width = 800, height = 800;
    var force = d3.layout.force()
    .charge(-300).linkDistance(50).size([width, height]);

    // setup svg div
    var svg = d3.select("#graph").append("svg")
    .attr("width", "100%").attr("height", "100%")
    .attr("pointer-events", "all");

    // load graph (nodes,links) json from /graph endpoint
    force.nodes(graph.nodes).links(graph.links).start();

    // render relationships as lines
    var link = svg.selectAll(".link")
        .data(graph.links).enter()
        .append("line").attr("class", "link");

    //color assignment
    var get_color = {"gpe": "#E81042", "person": "#80e810", "org": "#10DDE8"};

    // render nodes as circles, css-class from label
    var node = svg.selectAll(".node")
        .data(graph.nodes).enter()
        .append("circle")
        .attr("class", function (d) { return "node "+d.label })
        .attr("r", 10)
        .attr("fill", function (d){return get_color[d.label]})
        .call(force.drag);

    // html title attribute for title node-attribute
    node.append("title")
        .text(function (d) { return d.lastname; })

    // force feed algo ticks for coordinate computation
    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
         .attr("stroke", "#999")
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
         .attr("cy", function(d) { return d.y; });
    });

  };*/