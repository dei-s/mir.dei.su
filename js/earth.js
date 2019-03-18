var width = 800;
var height = 800;
var sens = 0.25;
var focused;

var w = document.getElementById("earth").clientWidth;
if (w > 600) w = Math.floor(w/2);
width = w;
height = w;
var scale1 = Math.floor(280*w/600);

// Setting projection

var projection = d3.geo.orthographic()
	.scale(scale1)
	.rotate([0, 0])
	.translate([width / 2, height / 2])
	.clipAngle(90);

var path = d3.geo.path()
	.projection(projection);

// SVG container

var maindiv = d3.select("body").select("#earth");

var svg = maindiv.append("svg")
	.attr("class", 'earth-svg')
	.attr("width", width)
	.attr("height", height);

// Adding water

svg.append("path")
	.datum({type: "Sphere"})
	.attr("class", "water")
	.attr("d", path);

maindiv.append("br");
var countryTooltip = maindiv.append("div").attr("class", "countryTooltip");
maindiv.append("br");
var countryList = maindiv.append("select").attr("name", "countries");


queue()
	.defer(d3.json, "world-110m.json")
	.defer(d3.tsv, "world-110m-country-names.tsv")
	.await(ready);

// Main function

function ready(error, world, countryData) {
	var countryById = {},
	countries = topojson.feature(world, world.objects.countries).features;

	// Adding countries to select

	countryData.forEach(function(d) {
		countryById[d.id] = d.name;
		option = countryList.append("option");
		option.text(d.name);
		option.property("value", d.id);
	});

	// Drawing countries on the globe

	var world = svg.selectAll("path.land")
		.data(countries)
		.enter().append("path")
		.attr("class", "land")
		.attr("d", path)

	// Drag event

	.call(d3.behavior.drag()
		.origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
		.on("drag", function() {
			var rotate = projection.rotate();
			projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
			svg.selectAll("path.land").attr("d", path);
			svg.selectAll(".focused").classed("focused", focused = false);
		}))

	// Mouse events

	.on("mouseover", function(d) {
		countryTooltip.text(countryById[d.id])
		.style("left", (d3.event.pageX + 7) + "px")
		.style("top", (d3.event.pageY - 15) + "px")
		.style("display", "block")
		.style("opacity", 1);
	})
	.on("mouseout", function(d) {
		countryTooltip.style("opacity", 0)
		.style("display", "none");
	})
	.on("mousemove", function(d) {
		countryTooltip.style("left", (d3.event.pageX + 7) + "px")
		.style("top", (d3.event.pageY - 15) + "px");
	});

	// Country focus on option select

	d3.select("select").on("change", function() {
		var rotate = projection.rotate(),
		focusedCountry = country(countries, this),
		p = d3.geo.centroid(focusedCountry);

		svg.selectAll(".focused").classed("focused", focused = false);

	// Globe rotating

	(function transition() {
		d3.transition()
		.duration(2500)
		.tween("rotate", function() {
			var r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
			return function(t) {
				projection.rotate(r(t));
				svg.selectAll("path").attr("d", path)
				.classed("focused", function(d, i) { return d.id == focusedCountry.id ? focused = d : false; });
			};
		})
		})();
	});

	function country(cnt, sel) { 
		for(var i = 0, l = cnt.length; i < l; i++) {
			if(cnt[i].id == sel.value) {return cnt[i];}
		}
	};
};

/* https://habr.com/post/186532 */
