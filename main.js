//Data tools
function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}

const parseNA = string => (string === 'NA' ? undefined : string);
function type(d) {
    return {
        title: parseNA(d.title),
        artist: parseNA(d.artist),
        top_genre: parseNA(d.top_genre),
        year_released: +d.year_released,
        added: d.added,
        bpm: +d.bpm,
        nrgy: +d.nrgy,
        dnce: +d.dnce,
        dB: +d.dB,
        live: +d.live,
        val: +d.val,
        dur: +d.dur,
        acous: +d.acous,
        spch: +d.spch,
        pop: +d.pop,
        top_year: +d.top_year,
        artist_type: parseNA(d.artist_type)
    }
}



function filterData(d) {
    // 初步除去有空值、以及在2000年前發行的歌
    const result = d.filter(
        d => {
            return (
                d.title &&
                d.artist &&
                d.top_genre &&
                d.pop > 0 &&
                d.year_released > 2000 
                //&&d.title && d.artist && d.top_genre === categories  //分類(之後測試)
            )
        }
    )
    return result;
}



function listMaker(dataClean) {
    // 為了建立 artist_type 和 year_released 列表而生

    // 產生藝術家類型列表 artistTypeList
    const artistTypeSet = new Set();
    dataClean.forEach(d => {
        artistTypeSet.add(d.artist_type);
    })
    const artistTypeList = Array.from(artistTypeSet);
    console.log("藝術家類型列表", artistTypeList)


    // 產生發行年份列表 yearReleasedList
    const yearReleasedSet = new Set();
    dataClean.forEach(d => {
        yearReleasedSet.add(d.year_released);
    })
    const yearReleasedList = Array.from(yearReleasedSet).sort();
    console.log("發行年份列表", yearReleasedList)

    return [artistTypeList, yearReleasedList];
}



function classify(data, basis) {
    // 選擇分類條件：0代表使用曲風區分；1代表使用藝術家區分；2代表不分類(單曲排行)

    // basis = 2 代表不分類，直接依單曲作人氣排行
    if (basis == 2) {
        return data;
    }

    // basis = 0代表使用曲風區分；1代表使用藝術家區分    //x軸 popularity y軸曲風 藝術家 單曲
    var dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.pop),
        d => basis ? d.artist : d.top_genre
    )
    const dataArray = Array.from(dataMap, d => ({ basis: d[0], pop: d[1] }));
    return dataArray;
}

// 所有跟畫面有關的
function setupCanvas(barChartData){
    // let metric = 'genre';

    // function click(){
    //     metric = this.dataset.name;     /*隨著使用者按按鈕換分頁 再呼叫一次chooseData*/
    //     const thisData = chooseData(metric, dataClean);
    //     update(thisData);
    // }

    // d3.selectAll('button').on('click',click);

    // function update(data){
    //     console.log(data);
    //     //Update Scale
    //     xMax = d3.max(data, d=>d[metric]);
    //     xScale_v3 = d3.scaleLinear([0,xMax],[0,chart_width]);
    //     yScale = d3.scaleBand().domain(data.map(d=>d.top_genre))
    //                             .rangeRound([0,chart_height])
    //                             .paddingInner(0.25);
    //     //Transition settings
    //     const defaultDelay = 1000;
    //     const transitionDelay = d3.transition().duration(defaultDelay);

    //     //Update axis
    //     xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
    //     yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

    //     //Update header
    //     header.select('tspan').text(`Top 15 ${metric} movies ${metric === 'pop' ? '' : 'in $US'}`);

    //     //Update Bar
    //     bars.selectAll('.bar').data(data, d=>d.top_genre).join(
    //         enter=>{
    //             enter.append('rect').attr('class','bar')
    //             .attr('x',0).attr('y',d=>yScale(d.top_genre))
    //             .attr('height',yScale.bandwidth())
    //             .style('fill','lightcyan')
    //             .transition(transitionDelay)
    //             .delay((d,i)=>i*20)
    //             .attr('width',d=>xScale_v3(d[metric]))
    //             .style('fill','dodgerblue');
    //         },
    //         update =>{
    //             update.transition(transitionDelay)
    //                   .delay((d,i)=> i*20)
    //                   .attr('y',d=> yScale(d.artist))
    //                   .attr('width',d=>xScale_v3(d[metric]))
    //         },
    //         exit => {
    //             exit.transition().duration(defaultDelay/2)
    //                 .style('fill-opacity',0)
    //                 .remove()
    //         },
    //     );

    //     d3.selectAll('.bar')
    //         .on('mouseover',mouseover)
    //         .on('mousemove',mousemove)
    //         .on('mouseout',mouseout);
    // }
    const svg_width = 700;
    const svg_height = 500;
    const chart_margin = {top:80,right:40,bottom:40,left:80}; //留空間
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

    const this_svg = d3.select('.bar-chart-cotainer').append('svg')
                    .attr('width',svg_width).attr('height',svg_height)
                    .append('g')
                    .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);
    //Find min & max
    const xExtent = d3.extent(barChartData,d=>d.pop);
    //debugger;
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width]);    
    //only max
    let xMax = d3.max(barChartData, d=>d.pop);
    let xScale_v2 = d3.scaleLinear().domain([0,xMax]).range([0, chart_width]);
    //簡潔一點
    let xScale_v3 = d3.scaleLinear([0,xMax],[0, chart_width]);
    


    // y-axis
    const yScale = d3.scaleBand().domain(barChartData.map(d=>d.basis))
                                .rangeRound([0,chart_height])
                                .paddingInner(0.15);
    console.log(yScale.bandwidth());

    
    const bars = this_svg.selectAll('.bar')
                         .data(barChartData)
                         .enter()
                         .append('rect')
                         .attr('class', 'bar')
                         .attr('x', 0)
                         .attr('y', d=>yScale(d.basis))
                         .attr('width',d=>xScale_v3(d.pop))
                         .attr('height', yScale.bandwidth())
                         .style('fill', 'red')
                         
    const header = this_svg.append('g').attr('class','bar-header')
                            .attr('transform',`translate(0,${-chart_margin.top/2})`)
                            .append('text');

    header.append('tspan').text('Top 10 xxx artist');
    header.append('tspan').text('Years:2000-2009')
        .attr('x',0)
        .attr('y',20).style('font-size','0.8em').style('fill','#555');

    const xAxis = d3.axisTop(xScale_v3).ticks(5)    
                    .tickFormat(formatTicks)
                    .tickSizeInner(-chart_height)
                    .tickSizeOuter(0);
    const xAxisDraw = this_svg.append('g')
                    .attr('class','x axis')
                    .call(xAxis);

    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const yAxisDraw = this_svg.append('g')
                    .attr('class','y axis')
                    .call(yAxis);

    yAxisDraw.selectAll('text').attr('dx','-0.6em');
    // update(barChartData);

    const tip = d3.select('.tooltip');

    // function mouseover(e){ //tip的位置

    //     //get data
    //     const thisBarData = d3.select(this).data()[0];
    //     //debugger;


    //     // bodyData(之後想...)
    //     // const bodyData = [
    //     //     ['Budget',formatTicks(thisBarData.budget)],
    //     //     ['Revenue',formatTicks(thisBarData.revenue)],
    //     //     ['Profit',formatTicks(thisBarData.revenue - thisBarData.budget)],
    //     //     ['TMDB Popularity',Math.round(thisBarData.popularity)],
    //     //     ['IMDB Rating', thisBarData.vote_average],
    //     //     ['Genres',thisBarData.genres.join(', ')],
    //     // ];



    //     tip.style('left',e.clientX+'px')    //e.clientX、Y是跟著滑鼠的位置
    //        .style('top',e.clientY+'px')
    //        .transition()
    //        .style('opacity',0.98)
            
    //        tip.select('h3').html(`${thisBarData.top_genre}, ${thisBarData.release_year}`);
    //        tip.select('h4').html(`${thisBarData.tagline}, ${thisBarData.runtime} min.`);
    //         d3.select('.tip-body').selectAll('p').data(bodyData)
    //         .join('p').attr('class','tip-info')
    //         .html(d=>`${d[0]} :${d[1]}`);
    // }

    // function mousemove(e){                      //較平順
    //     tip.style('left',(e.clientX+15)+'px')
    //        .style('top',e.clientY+'px')
    // }

    // function mouseout(e){
    //     tip.transition()
    //         .style('opacity',0);
    // }

    
}

//Main//readyFunction
// 產業分類功能(之後試能不能跑...)
// var categories = "其他";
function process(music) {

    // var button = document.querySelector('.prompttest');
    // var showtxt = document.querySelector('.show');

    // function popup(e) {
    //     var typecategory = window.prompt('請輸入欲查詢音樂類別');
    //     if (typeCategory == null || "") {
    //         showtxt.innerHTML = '您已取消輸入'
    //         }
    //         else{
    //             categories = typeCategory;
    //             showtxt.innerHTML = "目前查詢的音樂類別為: " + typeCategory;
    //         }
    //         const dataClean = filterData(d);
    //         setupCanvas(dataClassified);
    //     }
    //     button.addEventListener('click',popup); //產業分類功能
    
    // filter()初步除去有空值、以及在2000年前發行的歌
    let dataClean = filterData(music);

    // 呼叫listmaker()，產生藝術家類型列表及發行年份列表
    const Lists = listMaker(dataClean);
    const artistTypeList = Lists[0];
    const yearReleasedList = Lists[1];

    // year 和 artist_t 是用來指定發行年份和藝術家類型的，可以自行更改
    year = yearReleasedList[1];     // 這兩行可自己改
    artist_t = artistTypeList[1];   // 這兩行可自己改
    dataClean = dataClean.filter(d => d.year_released == year && d.artist_type == artist_t)


    // classify()第二個參數：0代表使用曲風區分；1代表使用藝術家區分；2代表不分類(單曲排行)
    const dataClassified = classify(dataClean, 0).sort(     // 參數可自己改
        (a, b) => {
            return d3.descending(a.pop, b.pop);
        }
    );
    setupCanvas(dataClassified);
    console.log("raw data", music);
    console.log("filtered", dataClean);
    console.log("classified", dataClassified);
    return dataClassified;
}

function chooseData(metric, dataClean){
    const thisData = dataClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<10);
    return thisData;
}

d3.csv('data/spotify.csv', type).then(
    res => {
        process(res);
    }
);

// 暗黑模式
function darkmode() {
    var element = document.body;
    element.classList.toggle("dark");
}
