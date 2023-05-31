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



function process(music) {
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

    console.log("raw data", music);
    console.log("filtered", dataClean);
    console.log("classified", dataClassified)
    return dataClassified;
}



d3.csv('data/spotify.csv', type).then(
    res => {
        process(res);
    }
);