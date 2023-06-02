//Data tools
function formatTicks(d){
    return d3.format('.2s')(d)
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
        const dataArray = Array.from(data, d => ({ basis: d.title, pop: d.pop}));
        return dataArray;
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


function pieChart(data){
    var width = 400;
    var height = 400;
    var radius = Math.min(width, height) / 2;
    var this_svg = d3.select('.chart-cotainer')
                     .attr("width", width)
                     .attr("height", height)
                     .append("g")
                     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    var pie = d3.pie()
                .value(function(d){
                    return  d.pop;
                }).sort(null);
    
}

// 所有跟畫面有關的
function setupCanvas(ChartData){
    let metric = "pop";
    const thisData = chooseData(metric, ChartData);  

    function click(){
        metric = this.dataset.name;   
        console.log(metric)  
        if (metric == "dark") return;
        

        if (metric == "pie") {
            const thisData = chooseData("pop", ChartData);  
            pieChart(thisData);
            return
        }
        /*隨著使用者按按鈕換分頁 再呼叫一次chooseData*/
        const thisData = chooseData(metric, ChartData);  
        
        update(thisData);
    }

    d3.selectAll('button').on('click',click);


    // function pieChart(data){}
    //     var width = 400;
    //     var height = 400;
    //     var radius = Math.min(width, height) / 2;

    //     var this_svg = d3.select('.chart-cotainer').append('svg')
    //     .attr('width',svg_width).attr('height',svg_height)
    //     .append('g')
    //     .attr('transform',"translate(" + width / 2 + "," + height / 2 + ")");
    // }

    function update(data){
        console.log(data);
        //Update Scale
        xMax = d3.max(data, d=>d.pop);
        console.log(xMax);
        
        xScale_v3 = d3.scaleLinear([0,xMax],[0,chart_width]);

        // 前15筆資料
        yScale = d3.scaleBand().domain(data.map(d=>d.basis).slice(0, 15))
                                .rangeRound([0,chart_height])
                                .paddingInner(0.25).paddingOuter(0);
          
        //Transition settings
        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update header
        header.select('tspan').text(`Top 15 ${metric} music in Spotify`)
            .style('fill','#1ED760')
       
        //Update Bar
        bars.selectAll('.bar')
        .data(data.slice(0, 15), d => d.basis)
        .join(
            enter=>{
                enter.append('rect').attr('class','bar')
                .attr('x',0).attr('y',d=>yScale(d.basis))
                .attr('height',yScale.bandwidth())
                .style('fill','#000000')
                .transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('width',d=>xScale_v3(d.pop))
                .style('fill','#1ED760')
            },
            update =>{
                update.transition(transitionDelay)
                      .delay((d,i)=> i*20)
                      .attr('y',d=> yScale(d.basis))
                      .attr('width',d=>xScale_v3(d.pop))
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                    .style('fill-opacity',0)
                    .remove()
            },
        )

        

        //interactive 互動處理
        const tip = d3.select('.tooltip');

        function mouseover(e){
            //get data
            const thisBarData = d3.select(this).data()[0];
            const bodyData = [
                ['Title', thisBarData.title],
                ['Artist', thisBarData.artist],
                ['Top Genre', thisBarData.top_genre],
                ['Year Release', thisBarData.year_released]
            ];


            // console.log(thisBarData);

            tip.style('left',(e.clientX+15)+'px')
               .style('top',e.clientY+'px')
               .transition()
               .style('opacity',0.98)
 
            //    d.title &&
            //     d.artist &&
            //     d.top_genre &&
            //     d.pop > 0 &&
            //     d.year_released > 2000 
            // console.log(thisBarData);
            tip.select('h3').html(`${thisBarData.basis}: <br>${thisBarData.pop} view(s)`);


            d3.select('.tip-body').selectAll('p').data(bodyData)
                .join('p').attr('class', 'tip-info')
                .html(d=>`${d[0]}:${d[1]}`);
        }

        function mousemove(e){
            tip.style('left',(e.clientX+15)+'px')
               .style('top',e.clientY+'px')
        }

        function mouseout(e){
            tip.transition()
               .style('opacity',0)
        }

        // 點擊事件處理程序
        function handleClick(d, i) {
            const thisBarData = d3.select(this).data()[0];   
            var pop = d.pop;
            // console.log("點擊的柱形資訊：", thisBarData.basis);
            // console.log("柱形的數值：", thisBarData.pop);
            

            // 搜尋歌曲
            var songName = thisBarData.basis;
            searchMusic(songName);
        }
        //interactive 新增監聽
        d3.selectAll('.bar')
            .on('mouseover',mouseover)
            .on('mousemove',mousemove)
            .on('mouseout',mouseout)
            .on('click',handleClick);
    }
   

    const svg_width = 600;
    const svg_height = 500;
    const chart_margin = {top:100,right:40,bottom:40,left:190}; //留空間
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

    var this_svg = d3.select('.chart-cotainer').append('svg')
                    .attr('width',svg_width).attr('height',svg_height)
                    .append('g')
                    .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);
    //Find min & max
    const xExtent = d3.extent(ChartData,d=>d.pop);
    //debugger;
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width]);    
    //only max
    let xMax = d3.max(ChartData, d=>d.pop);
    let xScale_v2 = d3.scaleLinear().domain([0,xMax]).range([0, chart_width]);
    //簡潔一點
    let xScale_v3 = d3.scaleLinear([0,xMax],[0, chart_width]);
    


    // y-axis
    let yScale = d3.scaleBand().domain(ChartData.map(d=>d.basis).slice(0, 15))
                                .rangeRound([0,chart_height])
                                .paddingInner(0.30);
    console.log(yScale.bandwidth());

    
    const bars = this_svg.append('g').attr('class', 'bars')
                         //.on('click',handleClick); // 添加點擊事件監聽器
                        //  .selectAll('.bar')
                        //  .data(ChartData)
                        //  .enter()
                        //  .append('rect')
                        //  .attr('class', 'bar')
                        //  .attr('x', 0)
                        //  .attr('y', d=>yScale(d.basis))
                        //  .attr('width',d=>xScale_v3(d.pop))
                        //  .attr('height', yScale.bandwidth())
                        //  .style('fill', 'red')
                         
    let header = this_svg.append('g').attr('class','bar-header')
                            .attr('transform',`translate(0,${-chart_margin.top/2})`)
                            .append('text');

    header.append('tspan').text('Top 10 XXX songs')
        .style('fill','#1ED760')
    header.append('tspan').text('Years:Since 2000')
        .attr('x',0)
        .attr('y',20).style('font-size','0.8em').style('fill','#1ED760');

    let xAxis = d3.axisTop(xScale_v3).ticks(5)    
                    .tickFormat(formatTicks)
                    .tickSizeInner(-chart_height)
                    .tickSizeOuter(0);
    // const xAxisDraw = this_svg.append('g')
    //                 .attr('class','x axis')
    //                 .call(xAxis);
    const xAxisDraw = this_svg.append('g').attr('class','x axis');

    let yAxis = d3.axisLeft(yScale).tickSize(0);
    // const yAxisDraw = this_svg.append('g')
    //                 .attr('class','y axis')
    //                 .call(yAxis);
    let yAxisDraw = this_svg.append('g').attr('class','y axis');
    yAxisDraw.selectAll('text').attr('dx','-0.6em');
    update(thisData);

    // const tip = d3.select('.tooltip');

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



function searchMusic(songName){
    // 設定 YouTube Data API 金鑰
    var apiKey = "YOUR_YOUTUBE_API_KEY";
    
    
    function searchSong(songName) {
        var apiUrl = "https://www.googleapis.com/youtube/v3/search";
        var params = {
            part: "snippet",
            q: songName,
            key: apiKey,
            maxResults: 1,
            type: "video"
        };
        console.log(params);
        // d3.json(apiUrl)
        //   .header("X-Requested-With", "XMLHttpRequest")
        //   .get(params)
        //   .then(function(response) {
        //         var videoId = response.items[0].id.videoId;
        //         var videoUrl = "https://www.youtube.com/watch?v=" + videoId;
        //         console.log("歌曲名稱：" + songName);
        //         console.log("歌曲連結：" + videoUrl);
        //     })
        //   .catch(function(error) {
        //     console.log("發生錯誤：" + error);
        //  });
    }

    // 搜索歌曲並獲取連結
    searchSong(songName);
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


    
    const dataClassified = chooseData("pop", dataClean);

    setupCanvas(dataClean);
    console.log("raw data", music);
    console.log("filtered", dataClean);
    console.log("classified", dataClassified);
    return dataClassified;
}

function chooseData(metric, dataClean){
    // classify()第二個參數：0代表使用曲風區分；1代表使用藝術家區分；2代表不分類(單曲排行)
    var num = -1;
    if (metric == "genre"){
        num = 0;
    }else if (metric == "artist")
    {
        num = 1;
    }else if (metric == "pop"){
        num = 2;
    }
    // console.log(num);
    const dataClassified = classify(dataClean, num).sort(     // 參數可自己改
        (a, b) => {
            return d3.descending(a.pop, b.pop);
        }
    ).filter((d,i)=>i<15);
    return dataClassified;
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
