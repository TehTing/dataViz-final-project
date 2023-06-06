//Data tools
function formatTicks(d) {
    return d3.format('.2s')(d)
        .replace('M', 'mil')
        .replace('G', 'bil')
        .replace('T', 'tri')
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

    // 去除空值、以及在2000年前發行的歌
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
    
    // 去除重複值
    var uniqueTitles = new Set();
    var filteredData = [];
    for (var i = 0; i < result.length; i++) {
        var currentData = result[i];
        
        if (!uniqueTitles.has(currentData.title)) {
          uniqueTitles.add(currentData.title);
          filteredData.push(currentData);
        }
      }

    return filteredData;
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
        // dataset = new Set(data);
        const dataArray = Array.from(data, d => ({ basis: d.title, pop: d.pop, top_genre: d.top_genre, year_released: d.year_released, artist: d.artist }));
        console.log("basis2", dataArray);
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



/*無法顯示，待修理*/
function playMusic(songs) {
    var width = 560;
    var height = 315;

    var container = d3.select("#youtube-container");

    function playNextSong(index) {
        if (index >= songs.length) {
            console.log("No more songs to play");
            return;
        }

        // 影片連結部署
        const videoLink = d3.select("#videoLink");
        videoLink.on("click", function () {
            window.open(songs[index].url);
        });
        // 影片圖像部署
        const thumbnailImg = d3.select("#thumbnail");
        thumbnailImg.attr("src", songs[index].pictureUrl);

        // youtube 影片部署
        var iframe = container.append("iframe")
            .attr("width", width)
            .attr("height", height)
            .attr("src", "https://www.youtube.com/embed/" + songs[index].videoId)
            .attr("frameborder", 0)
            .attr("allow", "autoplay; encrypted-media")
            .attr("allowfullscreen", true)
            .on("error", function () {
                console.log("Error loading YouTube video, trying next song");
                iframe.remove(); // 移除當前的 iframe

                // 撥放下一首歌曲
                playNextSong(index + 1);
            });

        container.attr("class", "youtube-container");
        iframe.attr("class", "youtube-iframe");
    }
    // 開始播放第一首歌曲
    playNextSong(0);
}



// 所有跟畫面有關的
function setupCanvas(ChartData) {
    let metric = "pop";
    let preMetric = "";
    const thisData = chooseData(metric, ChartData);


    function click() {
        preMetric = metric;
        metric = this.dataset.name;
        if (metric == "dark") return;

        /*隨著使用者按按鈕換分頁 再呼叫一次chooseData*/
        const thisData = chooseData(metric, ChartData);

        if (metric == "switch") {
            if (metric == "switch") metric = "artist";

            var chartType = d3.select("#chart").attr("data-chart-type");
            var switchButton = document.getElementById("switchButton");
            // 根據當前名稱進行切換
            console.log("new chart is " + chartType);
            if (chartType == "pie") {
                switchButton.innerHTML = "Pie Chart";
            } else if (chartType == "bar") {
                switchButton.innerHTML = "Bar Chart";
            }

            switchChart(thisData);
            return;
        }


        // 如果是pie chart 直接返回
        var chartType = d3.select("#chart").attr("data-chart-type");
        if (chartType == "pie") {
            // console.log(metric);
            createPieChart(thisData);
            return;
        }
        update(thisData);
    }

    d3.selectAll('button').on('click', click);
    if (metric == "switch") return;

    // 建立canvas
    const svg_width = 1100;
    const svg_height = 500;
    const chart_margin = { top: 120, right: 80, bottom: 40, left: 230 }; //留空間
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

    var this_svg;

    // 初始顯示bar chart，隱藏pie chart
    // createBarChart(thisData);


    // 切換事件
    function switchChart(thisData) {
        var chartType = d3.select("#chart").attr("data-chart-type");

        // 清除前一個圖形
        d3.selectAll("svg").remove();

        // 切換圖形
        if (chartType === "pie") {
            d3.select("#chart").attr("data-chart-type", "bar");
            // createBarChart(thisData);   
            setupCanvas(ChartData);
            console.log("do bar");
            return

        } else {
            d3.select("#chart").attr("data-chart-type", "pie");
            createPieChart(thisData);
            console.log("do pie");
            return
        }
    }


    // 創建Bar Chart
    this_svg = d3.select('.chart-cotainer').append('svg')
        .attr('width', svg_width).attr('height', svg_height)
        .append('g')
        .attr('transform', `translate(${chart_margin.left},${chart_margin.top})`)
        .attr("data-chart-type", "bar");

    function update(data) {
        //Update Scale
        xMax = d3.max(data, d => d.pop);
        // console.log(xMax);

        xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width]);

        // 前15筆資料
        // yScale = d3.scaleBand().domain(data.map(d=>d.basis).slice(0, 15))
        yScale = d3.scaleBand().domain(data.map(d => d.basis))
            .rangeRound([0, chart_height])
            .paddingInner(0.25).paddingOuter(0);

        //Transition settings
        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update header
        header.select('tspan').text(`Top ${yScale.domain().length} ${metric} music in Spotify`)
            .style('fill', '#1ED760')

        //Update Bar
        // bars.selectAll('.bar')
        // .data(data.slice(0, 15), d => d.basis)
        bars.selectAll('.bar')
            .data(data, d => d.basis)
            .join(
                enter => {
                    enter.append('rect').attr('class', 'bar')
                        .attr('x', 0).attr('y', d => yScale(d.basis))
                        .attr('height', yScale.bandwidth())
                        .style('fill', '#000000')
                        .transition(transitionDelay)
                        .delay((d, i) => i * 20)
                        .attr('width', d => xScale_v3(d.pop))
                        .style('fill', '#1ED760')
                },
                update => {
                    update.transition(transitionDelay)
                        .delay((d, i) => i * 20)
                        .attr('y', d => yScale(d.basis))
                        .attr('width', d => xScale_v3(d.pop))
                },
                exit => {
                    exit.transition().duration(defaultDelay / 2)
                        .style('fill-opacity', 0)
                        .remove()
                },
            )



        //interactive 互動處理
        const tip = d3.select('.tooltip');

        function mouseover(e) {
            //get data
            const thisBarData = d3.select(this).data()[0];

            var bodyData;
            if (metric == "pop") {
                bodyData = [
                    ['Title', " " + thisBarData.basis],
                    ['Artist', " " + thisBarData.artist],
                    ['Top Genre', " " + thisBarData.top_genre],
                    ['Year Release', " " + thisBarData.year_released]
                ];
            } else {
                bodyData = [
                    ['Title', thisBarData.basis],
                ];
            }



            // console.log(thisBarData);

            tip.style('left', (e.clientX + 15) + 'px')
                .style('top', e.clientY + 'px')
                .transition()
                .style('opacity', 0.98)

            //    d.title &&
            //     d.artist &&
            //     d.top_genre &&
            //     d.pop > 0 &&
            //     d.year_released > 2000 
            // console.log(thisBarData);
            tip.select('h3').html(`${thisBarData.basis}: <br>${thisBarData.pop} view(s)`);


            d3.select('.tip-body').selectAll('p').data(bodyData)
                .join('p').attr('class', 'tip-info')
                .html(d => `${d[0]}:${d[1]}`);
        }

        function mousemove(e) {
            tip.style('left', (e.clientX + 15) + 'px')
                .style('top', e.clientY + 'px')
        }

        function mouseout(e) {
            tip.transition()
                .style('opacity', 0)
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
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout)
            .on('click', handleClick);
    }



    //Find min & max
    const xExtent = d3.extent(ChartData, d => d.pop);
    //debugger;
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width]);
    //only max
    let xMax = d3.max(ChartData, d => d.pop);
    let xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0, chart_width]);
    //簡潔一點
    let xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width]);



    // y-axis
    // let yScale = d3.scaleBand().domain(ChartData.map(d => d.basis).slice(0, 15))
    let yScale = d3.scaleBand().domain(ChartData.map(d => d.basis))
        .rangeRound([0, chart_height])
        .paddingInner(0.30);
    console.log("yScale.bandwidth",yScale.bandwidth());


    const bars = this_svg.append('g').attr('class', 'bars')

    let header = this_svg.append('g').attr('class', 'bar-header')
        .attr('transform', `translate(0,${-chart_margin.top / 2})`)
        .append('text');

    header.append('tspan').text('Top 10 XXX songs')
        .style('fill', '#1ED760').style('font-size', '1.5em')
    header.append('tspan').text('Years: since 2000')
        .attr('x', 0)
        .attr('y', 28).style('font-size', '1em').style('fill', '#1ED760');

    let xAxis = d3.axisTop(xScale_v3).ticks(5)
        .tickFormat(formatTicks)
        .tickSizeInner(-chart_height)
        .tickSizeOuter(0);
    // const xAxisDraw = this_svg.append('g')
    //                 .attr('class','x axis')
    //                 .call(xAxis);
    const xAxisDraw = this_svg.append('g').attr('class', 'x axis');

    let yAxis = d3.axisLeft(yScale).tickSize(0);
    // const yAxisDraw = this_svg.append('g')
    //                 .attr('class','y axis')
    //                 .call(yAxis);
    let yAxisDraw = this_svg.append('g').attr('class', 'y axis');
    yAxisDraw.selectAll('text').attr('dx', '-0.6em');
    d3.select("#chart").attr("data-chart-type", "bar");
    update(thisData);

    // 創建Pie Chart
    function createPieChart(dataset) {
        // 清除前一個圖形
        d3.selectAll("svg").remove();

        console.log(dataset);
        // 更新SVG元素，並進行平移
        this_svg = d3
            .select(".chart-cotainer")
            .append("svg")
            .attr("width", svg_width)
            .attr("height", svg_height)

        // 定義平移的位移量
        var translateX = svg_width / 2;
        var translateY = svg_height / 2;

        // 創建pie的容器並進行平移
        var pieContainer = this_svg.append("g")
            .attr("transform", "translate(" + translateX + "," + translateY + ")");



        // 定義餅圖的半徑
        var radius = Math.min(svg_width, svg_height) / 2.5;

        // 用D3的餅圖生成器來生成路徑
        var pie = d3.pie().value(function (d) {
            return d.pop;
        });

        // 創建餅圖的弧形生成器
        var arc = d3.arc().innerRadius(0).outerRadius(radius);

        // 將資料連結到圖形元素
        var arcs = pieContainer
            .selectAll("arc")
            .data(pie(dataset))
            .enter()
            .append("g")
            .attr("class", "arc");


        // 使用ColorBrewer 的配色方案
        var colorScale = d3.scaleOrdinal()
            .domain(dataset.map(function (d) { return d.pop; }))
            .range(d3.schemeSet3); // 使用 ColorBrewer 的 Set3 方案

        // 使用D3.js比例尺
        // var colorScale = d3.scaleOrdinal()
        // .domain(dataset.map(function(d) { return d.basis; }))
        // .range(d3.schemeCategory10); // 使用 D3 內建的十種顏色

        // 繪製弧形路徑
        var arcPaths = arcs.append("path")
            .attr("d", arc)
            .attr("fill", function (d, i) {

                // 隨機生成填充顏色
                return colorScale(d.data.basis);
            })
            .attr("stroke", "white")
            .style("stroke-width", "2px");


        // pie chart添加標籤
        if(metric!="genre"){
            var offset = 1.7;
            arcs.append("text")
                .attr("transform", function (d) {
                    // 計算弧形中心點的位置
                    var centroid = arc.centroid(d);

                    // 計算文字偏移量
                    var offsetX = centroid[0] * offset; // 調整偏移量的倍數
                    var offsetY = centroid[1] * offset; // 調整偏移量的倍數
                    return "translate(" + offsetX + "," + offsetY + ")";
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d.data.basis;
                });
        }


        // 創建資訊提示框
        var tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // 設置滑鼠事件處理器
        arcPaths.on("mouseover", function (event, d) {
            // 顯示資訊提示框
            tooltip.style("opacity", 1).html(d.data.basis + ": " + d.data.pop);
        })
            .on("mousemove", function (event) {
                // 設置資訊提示框的位置
                tooltip
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY / 0.95 + "px");
            })
            .on("mouseout", function (d) {
                // 隱藏資訊提示框
                tooltip.style("opacity", 0);
            }).on("click", function (event, d) {
                // 滑鼠點擊 pie 觸發的事件處理邏輯
                console.log("Pie clicked:", d);
                // 在這裡可以添加你想要觸發的其他操作或事件處理邏輯

                // 搜尋歌曲
                var songName = d.data.basis;
                console.log(songName);
                searchMusic(songName);

            });


        // 設定餅圖標題的位置和樣式
        const header = this_svg.append("g")
            .attr("class", "pie-chart-header")
            .attr("transform", `translate(50, 60)`); // 移到左上角的座標


        header.append("text")
            .attr("text-anchor", "left-top")
            .style("fill", "#1ED760")
            .style("font-size", "1.5em")
            .selectAll("tspan")
            .data([`Top ${dataset.length} ${metric} songs`])
            .enter()
            .append("tspan")
            .attr("x", 0)
            .attr("dy", (d, i) => i * 30)
            .text(d => d)
            .append("tspan")
            .text("Years: since 2000")
            .attr("x", 0)
            .attr("y", 35)
            .style("font-size", "0.7em");

        // 添加扇形展开动画
        arcPaths.transition()
            .duration(800)
            .attrTween("d", function (d) {
                var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function (t) {
                    return arc(interpolate(t));
                };
            });


        // 添加扇形展开动画
        arcs.selectAll("text")
            .attr("opacity", 0)
            .transition()
            .delay(1000)
            .duration(500)
            .attr("opacity", 1);
    }
}

function searchMusic(songName) {
    // 設定 YouTube Data API 金鑰
    var apiKey = "AIzaSyC6rf7uoC_Ps9V8NBJUPfsyFJYV1iZtp2Y";


    function searchSong(songName, numResults) {
        const encodedSongName = encodeURIComponent(songName);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${numResults}&q=${encodedSongName}&type=video&key=${apiKey}`;

        // 使用d3.json發起API請求
        d3.json(url)
            .then(function (response) {

                //建立傳送陣列來存放取得資訊
                var songs = [];

                // 確保只取得指定數量的結果
                const items = response.items;

                // 使用Set來儲存不重複的影片ID
                const uniqueVideos = new Set();

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    // 取得ID、歌曲名，歌手名、預覽圖片、影片連結
                    const videoId = item.id.videoId;
                    const songTitle = item.snippet.title;
                    const artistName = item.snippet.channelTitle;
                    const thumbnailUrl = item.snippet.thumbnails.default.url;
                    const videoLink = `https://www.youtube.com/watch?v=${videoId}`;

                    // 檢查影片ID是否已存在，若不存在則將影片資訊加入songs陣列
                    if (!uniqueVideos.has(videoId)) {
                        uniqueVideos.add(videoId);
                        songs.push({
                            name: songTitle,
                            artist: artistName,
                            url: videoLink,
                            pictureUrl: thumbnailUrl,
                            videoId: videoId,
                        });
                    }

                    // 若已搜尋到足夠數量的不同連結，則停止搜尋
                    if (songs.length >= numResults) {
                        break;
                    }
                }
                console.log('song list:\n', songs);
                playMusic(songs);
            })
            .catch(function (error) {
                console.error('Error:', error);
            });
    }

    // 搜索歌曲並獲取連結(暫時設定為5個)
    searchSong(songName, 1);
}



//Main//readyFunction
// 產業分類功能(之後試能不能跑...)
// var categories = "其他";
function process(music) {

    // filter()初步除去有空值、以及在2000年前發行的歌
    let dataClean = filterData(music);

    // 呼叫listmaker()，產生藝術家類型列表及發行年份列表
    // const Lists = listMaker(dataClean);
    // const artistTypeList = Lists[0];
    // const yearReleasedList = Lists[1];

    // year 和 artist_t 是用來指定發行年份和藝術家類型的，可以自行更改
    // year = yearReleasedList[1];     // 這兩行可自己改classify
    // artist_t = artistTypeList[1];   // 這兩行可自己改
    //不確定是否有要篩選這只篩到2010 跟標題有點不符 By yi-dien所以我註解掉了
    //dataClean = dataClean.filter(d => d.year_released == year && d.artist_type == artist_t)



    const dataClassified = chooseData("pop", dataClean);

    setupCanvas(dataClean);
    console.log("raw data", music);
    console.log("filtered", dataClean);
    console.log("classified", dataClassified);
    return dataClassified;
}

function chooseData(metric, dataClean) {
    // classify()第二個參數：0代表使用曲風區分；1代表使用藝術家區分；2代表不分類(單曲排行)
    var num = -1;
    if (metric == "genre") {
        num = 0;
    } else if (metric == "artist") {
        num = 1;
    } else if (metric == "pop") {
        num = 2;
    }
    // console.log(num);
    const dataClassified = classify(dataClean, num).sort(     // 參數可自己改
        (a, b) => {
            return d3.descending(a.pop, b.pop);
        }
    ).filter((d, i) => i < 10);
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