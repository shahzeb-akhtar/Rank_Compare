/*
Creates an interactive Rank Compare Chart
	inputs:
		divElement - d3 selection of div in which to creat chart
		dataArr - data to be charted
			'Name', 'Current', and 'Next' are required columns.
		title - Title for the chart
		topN - number of names to show - even if data contains more than topN values
*/
function RankCompare(divElement, dataArr, title = 'Rank Comparison Chart', topN = 10){
	let resizeTimer,
		wSvg,
		hSvg,
		svgElem,
		allNames = [],
		namesByCurrentRank = [],
		namesByNextRank = [],
		nameValueObj = {},
		topRank = 1,
		bottomRank = 0,
		scaleLeftX = d3.scaleLinear(),
		scaleRightX = d3.scaleLinear(),
		scaleY = d3.scaleLinear(),
		parentResizeFunction,
		marginPercent = {top:0.025, right:0.05, bottom:0.05, left:0.025};
		
	const colors10 = d3.schemeCategory10,
			greenColor = colors10[2],
			redColor = colors10[3],
			lightGreenColor = d3.color(greenColor).brighter(1),
			lighterRedColor = d3.color(redColor).brighter(1),
			greyColor = colors10[7];
	
	divElement.style('font-family', 'Helvetica');
	
	// check if there is already a resize function
	if(d3.select(window).on('resize')){
		parentResizeFunction = d3.select(window).on('resize');
	}
	
	d3.select(window).on('resize', function(){
		if(resizeTimer){
			clearTimeout(resizeTimer);
		}
		resizeTimer = setTimeout(resize, 100);
		if(parentResizeFunction){
			parentResizeFunction();
		}
	});
	
	function resize(){
		// remove previous chart, if any
		divElement.selectAll("*").remove();
		
		// append title
		let titleElement = divElement.append("h2").text(title);
		
		// calculate width and height of svg
		wSvg = divElement.node().clientWidth;
		hSvg = divElement.node().clientHeight - titleElement.node().scrollHeight;
		if(hSvg < 100){
			hSvg = 100;
		}
		if(wSvg < 100){
			wSvg = 100;
		}
		scaleLeftX.range([marginPercent.left*wSvg + 0.4*wSvg*(1 - marginPercent.left - marginPercent.right), marginPercent.left*wSvg]);
		scaleRightX.range([marginPercent.left*wSvg + 0.6*wSvg*(1 - marginPercent.left - marginPercent.right), wSvg*(1 -  marginPercent.right)]);
		scaleY.range([marginPercent.top*hSvg, hSvg - (marginPercent.bottom*hSvg)]);
		createChart();
	}
	
	function understandData(){
		let maxVal = 0;
		data.forEach(function(dd, di){
			if(allNames.indexOf(dd.Name) < 0){
				allNames.push(dd.Name);
				namesByCurrentRank.push(dd.Name);
				namesByNextRank.push(dd.Name);
			}
			if(dd.Current > maxVal){
				maxVal = dd.Current;
			}
			if(dd.Next > maxVal){
				maxVal = dd.Next;
			}
			nameValueObj[dd.Name] = [dd.Current, dd.Next];
		});
		namesByCurrentRank.sort(function(a,b){
			return nameValueObj[b][0] - nameValueObj[a][0];
		});
		namesByNextRank.sort(function(a,b){
			return nameValueObj[b][1] - nameValueObj[a][1];
		});
		if(allNames.length < topN){
			bottomRank = allNames.length;
		}else{
			bottomRank = topN;
		}
		scaleLeftX.domain([0, maxVal]);
		scaleRightX.domain([0, maxVal]);
		scaleY.domain([topRank - 0.5, bottomRank]);
	}
	
	function namesMouseOver(d){
		svgElem.selectAll("g.viz_g").each(function(dIn, di){
			if(dIn.name === d.name){
				d3.select(this).raise()
					.style("opacity", 1);
				d3.select(this).selectAll(".hidden_text").style("display", null);
			}else{
				d3.select(this).style("opacity", 0.1);
			}
		});
		if(otherNamesArr.indexOf(d.name) >= 0){
			// show name
			otherGElem.select("text").text(d.name);
			otherGElem.style("opacity", 1).style("display", null);
		}
	}
	
	function namesMouseOut(d){
		svgElem.selectAll("g.viz_g").each(function(dIn, di){
			d3.select(this).style("opacity", 0.8);
			d3.select(this).selectAll(".hidden_text").style("display", "none");
		});
		otherGElem.style("display", "none");
	}
	
	function createChart(){
		let strokeWidth = (hSvg*0.15)/bottomRank;
		let rectHeight = hSvg/(bottomRank * 2.5);
		let fontSize = hSvg/40;
		svgElem = divElement.append("svg").attr("width", wSvg).attr("height", hSvg);
		namesByCurrentRank.forEach(function(nc, ni){
			let nn = namesByNextRank.indexOf(nc); // index in namesByNextRank
			console.log(nn);
			// dont' go beyond bottomRank
			if(ni > bottomRank - 1 && nn > bottomRank - 1) return;
			let g = svgElem.append("g")
							.attr("class", "g_viz")
							.datum({"name":nc});
							
			// create left side bar with name
			if(ni <= bottomRank - 1){
				g.append("text")
					.attr("x", scaleLeftX(0))
					.attr("y", scaleY(ni + 1) - 5)
					.attr("text-anchor", "end")
					.style("font-size", fontSize)
					.text(nc);
					
				g.append("rect")
					.attr("x", scaleLeftX(nameValueObj[nc][0]))
					.attr("y", scaleY(ni + 1))
					.attr("width", scaleLeftX(0) - scaleLeftX(nameValueObj[nc][0]))
					.attr("height", rectHeight)
					.style("fill", colors10[0])
			}
			
			// create line
			g.append("line")
				.attr("x1", scaleLeftX(0))
				.attr("x2", scaleRightX(0))
				.attr("y1", scaleY(ni + 1))
				.attr("y2", scaleY(nn + 1))
				.attr("stroke", function(){
					if(nn === ni){
						return greyColor;
					}
					if(Math.abs(nn - ni) < 3){
						if(nn > ni){
							return lighterRedColor;
						}else{
							return lightGreenColor;
						}
					}else{
						if(nn > ni){
							return redColor;
						}else{
							return greenColor;
						}
					}
				});
			
			// create right side bar with name
			if(nn <= bottomRank - 1){
				g.append("text")
					.attr("x", scaleRightX(0))
					.attr("y", scaleY(nn + 1) - 5)
					.style("font-size", fontSize)
					.text(nc);
					
				g.append("rect")
					.attr("x", scaleRightX(0))
					.attr("y", scaleY(nn + 1))
					.attr("width", scaleRightX(nameValueObj[nc][1]) - scaleRightX(0))
					.attr("height", rectHeight)
					.style("fill", colors10[0])
			}
			
		});
	}
	understandData();
	resize();
}