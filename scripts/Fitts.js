// set the dimensions and margins of the graph
var margin = {top: 30, right: 40, bottom: 30, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg2 = d3.select("#visualisation")
    .append("svg")
    .attr("style","margin : 1em")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + width/2 + "," + height/2 + ")");

var groups;
var xScale;
var yScale;
var xAxis;
var yAxis;

var file = [];
var result = [];
var graphData = [];
var headers = [];
var toDisplay;

$('input#file').change(() => {
    file = $('#file')[0].files[0];
    if(!file.type || file.type !== "application/vnd.ms-excel") {
        // set error message
        $('#message').text("File to analyse need to be a CSV file");

        // disable graph
        $('#visualisation').fadeOut();
    }else {
        // clear error message
        $('#message').text("");

        // enable graph
        $('#visualisation').fadeIn();

        // Read file data
        readFile();
    }
});

function readFile() {
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            result = formatData(evt.target.result);

            headers = result[0];
            setSelector(headers);

            result.shift();
            graphData = getGraphData(result);

            toDisplay = graphData[0];
            draw();
        }
        reader.onerror = function (evt) {
            $('#message').text("error when trying to read file");
        }
    }
}

function setSelector(data) {
    $('#dataSelector').append("<option class=\"mdl-menu__item\" value=\"" + data.difficulty +"\">" + data.difficulty +"</option>");
    $('#dataSelector').append("<option class=\"mdl-menu__item\" value=\"" + data.time +"\">" + data.time +"</option>");
    $('#dataSelector').append("<option class=\"mdl-menu__item\" value=\"" + data.x +"\">" + data.x +"</option>");
    $('#dataSelector').append("<option class=\"mdl-menu__item\" value=\"" + data.y +"\">" + data.y +"</option>");
}

function formatData(str) {
    var array = str.replaceAll('\n', ',').split(',');

    var res = [];
    for(let i=0; i<array.length - 1; i = i+7) {
        res.push(new Data(array[i], array[i+1], array[i+2], array[i+3], array[i+4], array[i+5], array[i+6]));
    }

    return res;
}

function getGraphData(array) {
    let res = [];
    res.push(getDifficultyData(array));
    res.push(getTimeData(array));
    res.push(getXData(array));
    res.push(getYData(array));

    return res;
}

function getDifficultyData(array) {
    let res = [];
    array.forEach((data) => {
        res.push({name: data.trial, result: data.difficulty});
    })

    return res;
}

function getTimeData(array) {
    let res = [];
    array.forEach((data) => {
        res.push({name: data.trial, result: data.time});
    })

    return res;
}

function getXData(array) {
    let res = [];
    array.forEach((data) => {
        res.push({name: data.trial, result: Math.abs((data.x - data.destX) / data.destX)});
    })

    return res;
}

function getYData(array) {
    let res = [];
    array.forEach((data) => {
        res.push({name: data.trial, result: Math.abs((data.y - data.destY) / data.destY)});
    })

    return res;
}

function calculThroughput() {
    return 1;
}

function draw() {
    xScale = d3.scaleBand().domain(toDisplay.map(d => d.name)).range([margin.left, width]);
    yScale = d3.scaleLinear().domain([0,d3.max(toDisplay, d => d.result)]).range([height - margin.bottom, margin.top]);
    xAxis = g => g.attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(xScale).tickSizeOuter(0));
    yAxis = g => g.attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yScale));

    var myGroups = svg2.selectAll('g').data(toDisplay);

    groups = myGroups
        .enter()
        .append('g');
    bars = groups
        .append("rect")
        .style("fill", (d,i) =>d3.schemeCategory10[i])
        .attr('opacity','.80')
        .attr("Reponses",d => d.result )
        .attr("name",d => d.name )
        .attr("y",d => {return yScale(+d.result) - height/2})
        .attr("height",d => {return yScale(0) - yScale(+d.result)})
        .attr("width", xScale.bandwidth() - 2)
        .attr("x", d => xScale(d.name) - width/2)

    text = groups.append("text")
        .attr("x", d => (xScale(d.name) - width/2) + xScale.bandwidth()/15)
        .attr("y", d => {return yScale(+d.result) - height/2})
        .attr("color", "black")
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .text(d => {return parseFloat(d.result).toFixed(4)});


    abscisses = d3.select("#visualisation").select("svg").append("g").call(xAxis);
    ordonnees = d3.select("#visualisation").select("svg").append("g").call(yAxis);


    $("rect").on("mouseover",(d) => {
        d.target.style.cursor = "hand";

    });
}

$('#dataSelector').on('change', function (e) {
    let filter = 0;
    if($("#dataSelector").val().trim() === "Time") {
        filter = 1;
    }else if($("#dataSelector").val().trim() === "X") {
        filter = 2;
    }else if($("#dataSelector").val().trim() === "Y") {
        filter = 3;
    }

    toDisplay = graphData[filter];
    console.log(toDisplay);
    svg2.selectAll("rect")
        .data(toDisplay);

    svg2.selectAll("text")
        .data(toDisplay);

    yScale = d3.scaleLinear().domain([0,d3.max(toDisplay, d => d.result)]).range([height - margin.bottom, margin.top]);
    yAxis = g => g.attr("transform", `translate(${margin.left} ,0)`).call(d3.axisLeft(yScale));

    ordonnees.transition().duration(1000).delay(500).call(yAxis);

    bars.transition().duration(1000).delay(500)
        .attr("y",d => {return yScale(+d.result) - height/2})
        .attr("height", d => {return yScale(0) - yScale(+d.result);});
    text.transition().duration(1000).delay(500)
        .attr("y",d => {return yScale(+d.result) - height/2})
        .attr("color", "black")
        .attr("font-weight", "bold")
        .text(d => {return parseFloat(d.result).toFixed(4)});
});
