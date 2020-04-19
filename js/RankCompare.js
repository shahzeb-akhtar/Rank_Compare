/*
Creates an interactive Rank Compare Chart
	input - objConfig with the following properties:
		divElement - d3 selection of div in which to creat chart
		dataArr - data to be charted
			'Name', 'Current', and 'Next' are required columns.
		title - Title for the chart
		topN - number of names to show - even if data contains more than topN values
		titleLeft,
		titleRight,
		format - options - int, float, percent
*/
function RankCompare(configObj){
	console.log(configObj);
	let resizeTimer,
		mouseTimer,
		wSvg,
		hSvg,
		svgElem,
		isMobile = false,
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
		maxVal = 0,
		topTextElem,
		marginPercent = {top:0.075, right:0.05, bottom:0.15, left:0.025};
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		isMobile = true;
	}	
	let divElement = configObj.divElement, // required 
			dataArr = configObj.dataArr, // required 
			title = 'Rank Comparison Chart', 
			topN = 10,
			leftTitle,
			rightTitle,
			format;
			
			if(configObj.title){
				title = configObj.title;
			}
			if(configObj.topN){
				topN = configObj.topN;
			}
			if(configObj.leftTitle){
				leftTitle = configObj.leftTitle;
			}
			if(configObj.title){
				rightTitle = configObj.rightTitle;
			}
			if(configObj.format){
				switch(configObj.format){
					case 'int':
						format = d3.format(",d");
						break;
					case 'float':
						format = d3.format(".2f");
						break;
					case 'percent':
						format = d3.format(".2%");
						break;
				}
			}
			
	const colors10 = d3.schemeCategory10,
			greenColor = colors10[2],
			redColor = colors10[3],
			lightGreenColor = colors10[8],
			lighterRedColor = colors10[6],
			greyColor = colors10[7]
			// colors from Chroma.js Color Palette Helper
			//https://gka.github.io/palettes/#/5|d|185d4f,96ffea,c6c6a9|ffffe0,ef3863,aa0a00|1|1
			//divergingColors = ['#005a74', '#68afb1', '#ffffe0', '#ff978d', '#ce3600']
			//divergingColors = ['#005a74', '#5da5aa', '#e9e9cb', '#ff978d', '#ce3600'],
			//divergingColors = ['#035d57', '#58a598', '#e6e6c7', '#fc7f7b', '#aa0a00'],
			divergingColors = ['#185d4f', '#4c9685', '#c6c6a9', '#f3857d', '#aa0a00'];
	
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
		let w = divElement.node().clientWidth,
			h = divElement.node().clientHeight,
			titleFontSize = h/25;
		
		if(titleFontSize > 32){
			titleFontSize = 32;
		}
		// append title
		let titleElement = divElement.append("h2").style("font-size", titleFontSize).text(title);
		
		// calculate width and height of svg
		wSvg = w;
		hSvg = h - titleElement.node().scrollHeight;

		if(wSvg < 100){
			wSvg = 100;
		}
		if(hSvg < 100){
			hSvg = 100;
		}
		if(hSvg > wSvg){
			hSvg = wSvg;
		}
		
		
		scaleLeftX.range([marginPercent.left*wSvg + 0.45*wSvg*(1 - marginPercent.left - marginPercent.right), marginPercent.left*wSvg]);
		scaleRightX.range([marginPercent.left*wSvg + 0.55*wSvg*(1 - marginPercent.left - marginPercent.right), wSvg*(1 -  marginPercent.right)]);
		scaleY.range([marginPercent.top*hSvg, hSvg - (marginPercent.bottom*hSvg)]);
		createChart();
	}
	
	function understandData(){
		dataArr.forEach(function(dd, di){
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
		if(isMobile && mouseTimer){
			clearTimeout(mouseTimer);
		}
		let textToShow = '',
			rankGain = namesByCurrentRank.indexOf(d.name) - namesByNextRank.indexOf(d.name);
		if(rankGain === 0){
			textToShow = '&hArr;'
		}else if(rankGain > 0){
			textToShow = '&uArr; ' + rankGain;
		}else{
			textToShow = '&dArr; ' + Math.abs(rankGain);
		}
		svgElem.selectAll("g.viz_g").each(function(dIn){
			if(dIn.name === d.name){
				d3.select(this).raise()
					.style("opacity", 1);
			}else{
				d3.select(this).style("opacity", 0.1);
			}
		});
		svgElem.selectAll("g.legend_g").each(function(dIn){
			if(dIn.color === d.color){
				d3.select(this).style("opacity", 1);
			}else{
				d3.select(this).style("opacity", 0.1);
			}
		});
		topTextElem.html(textToShow);
		if(isMobile){
			mouseTimer = setTimeout(namesMouseOut, 2000);
		}
	}
	
	function namesMouseOut(d){
		svgElem.selectAll("g.viz_g").style("opacity", 0.8);
		svgElem.selectAll("g.legend_g").style("opacity", 0.8);
		topTextElem.text("");
	}
	
	function createChart(){
		let strokeWidth = (hSvg*0.05)/bottomRank,
			rectHeight = hSvg/(bottomRank * 3),
			fontSize = hSvg/(4 * bottomRank),
			color,
			rectTextXAdjust, // it would we +/-5
			rectTextAnchor; // start/end
		
		if(fontSize > 24){
			fontSize = 24;
		}
		if(fontSize < 6){
			fontSize = 6;
		}
		
		svgElem = divElement.append("svg").attr("width", wSvg).attr("height", hSvg);
		namesByCurrentRank.forEach(function(nc, ni){
			let nn = namesByNextRank.indexOf(nc); // index in namesByNextRank
			if(nn === ni){
				color = divergingColors[2];
			}else{
				if(Math.abs(nn - ni) < 3){
					if(nn > ni){
						color = divergingColors[3];
					}else{
						color = divergingColors[1];
					}
				}else{
					if(nn > ni){
						color = divergingColors[4];
					}else{
						color = divergingColors[0];
					}
				}
			}
			
			// to avoid making the connecting lines go over legend on mouse over raise
			let nonLegendG = svgElem.append("g");
			
			// dont' go beyond bottomRank
			if(ni > bottomRank - 1 && nn > bottomRank - 1) return;
			let g = nonLegendG.append("g")
							.attr("class", "viz_g")
							.datum({"name":nc, "color":color})
							.style("opacity", 0.8)
							.on("mouseover", namesMouseOver)
							.on("mouseout", namesMouseOut);
							
			// create left side bar with name
			if(ni <= bottomRank - 1){
				g.append("text")
					.attr("x", scaleLeftX(0))
					.attr("y", scaleY(ni + 1) - (hSvg * 0.01))
					.attr("text-anchor", "end")
					.style("font-size", fontSize)
					.text(nc);
					
				g.append("rect")
					.attr("x", scaleLeftX(nameValueObj[nc][0]))
					.attr("y", scaleY(ni + 1))
					.attr("width", scaleLeftX(0) - scaleLeftX(nameValueObj[nc][0]))
					.attr("height", rectHeight)
					.style("fill", color);
				
				if(nameValueObj[nc][0] > maxVal/2){
					rectTextXAdjust = +5;
					rectTextAnchor = "start";
				}else{
					rectTextXAdjust = -5;
					rectTextAnchor = "end";
				}				
				g.append("text")
					.attr("x", scaleLeftX(nameValueObj[nc][0]) + rectTextXAdjust)
					.attr("y", scaleY(ni + 1) + rectHeight/2)
					.attr("text-anchor", rectTextAnchor)
					.style("font-size", fontSize/1.5)
					.attr("dominant-baseline", "central")
					.text(format(nameValueObj[nc][0]));	
			}
			
			// create line
			g.append("line")
				.attr("x1", scaleLeftX(0))
				.attr("x2", scaleRightX(0))
				.attr("y1", scaleY(ni + 1) + rectHeight/2)
				.attr("y2", scaleY(nn + 1) + rectHeight/2)
				.attr("stroke-width", strokeWidth)
				.attr("stroke", color);
			
			// create right side bar with name
			if(nn <= bottomRank - 1){
				g.append("text")
					.attr("x", scaleRightX(0))
					.attr("y", scaleY(nn + 1) - (hSvg * 0.01))
					.style("font-size", fontSize)
					.text(nc);
					
				g.append("rect")
					.attr("x", scaleRightX(0))
					.attr("y", scaleY(nn + 1))
					.attr("width", scaleRightX(nameValueObj[nc][1]) - scaleRightX(0))
					.attr("height", rectHeight)
					.style("fill", color);
					
				if(nameValueObj[nc][1] > maxVal/2){
					rectTextXAdjust = -5;
					rectTextAnchor = "end";
				}else{
					rectTextXAdjust = +5;
					rectTextAnchor = "start";
				}
				
				g.append("text")
					.attr("x", scaleRightX(nameValueObj[nc][1]) + rectTextXAdjust)
					.attr("y", scaleY(nn + 1) + rectHeight/2)
					.attr("text-anchor", rectTextAnchor)
					.style("font-size", fontSize/1.5)
					.attr("dominant-baseline", "central")
					.text(format(nameValueObj[nc][1]));
			}
			
			// create circles
			g.append("circle")
				.attr("cx", scaleLeftX(0))
				.attr("cy", scaleY(ni + 1) + rectHeight/2)
				.attr("r", rectHeight/2.1)
				.attr("stroke-width", strokeWidth)
				.attr("stroke", color)
				.style("fill", "white");
			
			g.append("circle")
				.attr("cx", scaleRightX(0))
				.attr("cy", scaleY(nn + 1) + rectHeight/2)
				.attr("r", rectHeight/2.1)
				.attr("stroke-width", strokeWidth)
				.attr("stroke", color)
				.style("fill", "white");				
			
		});
		//create titles
		if(leftTitle){
			svgElem.append("text")
					.attr("x", scaleLeftX(0))
					.attr("y", (hSvg*marginPercent.top)/2)
					.attr("text-anchor", "end")
					.style("font-size", fontSize)
					.style("font-weight", "bold")
					.text(leftTitle);
		}
		if(rightTitle){
			svgElem.append("text")
					.attr("x", scaleRightX(0))
					.attr("y", (hSvg*marginPercent.top)/2)
					.style("font-size", fontSize)
					.style("font-weight", "bold")
					.text(rightTitle);
		}
		// create legend
		let legendG = svgElem.append("g")
								.attr("transform", "translate(0, " + (hSvg*(1 - marginPercent.bottom + 0.01) + rectHeight) + ")");
		legendG.append("rect")
				.attr("width", wSvg)
				.attr("height", hSvg*marginPercent.bottom)
				.style("fill", "white");
		
		let legendLabels = ["Rank up by 3+", "Rank up by 1 or 2", "Rank not changed", "Rank down by 1 or 2", "Rank down by 3+"],
			legendGap = wSvg/5,
			legendStart = legendGap/3,
			legendRectSize = hSvg*0.02,
			legendTextGap = wSvg*0.005;
			
		divergingColors.forEach(function(dc, di){
			let g = legendG.append("g")
							.attr("transform", "translate(" + (legendStart + (legendGap*di)) + "," + (hSvg * marginPercent.bottom * 0.4) + ")")
							.attr("class", "legend_g")
							.datum({"color":dc})
							.style("opacity", 0.8);
			g.append("rect")
				.attr("width", legendRectSize)
				.attr("height", legendRectSize)
				.style("fill", dc);
				
			g.append("text")
					.attr("x", legendRectSize + legendTextGap)
					.attr("y", legendRectSize/2)
					.style("font-size", fontSize/1.25)
					.attr("dominant-baseline", "central")
					.text(legendLabels[di]);
		});
		topTextElem = svgElem.append("text")
								.attr("x", wSvg*(marginPercent.left + (1 - marginPercent.left - marginPercent.right)/2))
								.attr("y", (hSvg*marginPercent.top)/2)
								.attr("text-anchor", "middle")
								.style("font-size", fontSize)
								.style("fill", "gray")
								.style("font-weight", "bold")
								//.attr("dominant-baseline", "central");
							
	}
	understandData();
	resize();
}