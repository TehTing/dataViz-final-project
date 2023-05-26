const parseNA = string => (string === 'NA' ? undefined : string);
function type(d){
    return {
        title : parseNA(d.title),
        artist : parseNA(d.artist),
        top_genre : parseNA(d.top_genre),
        year_released : +d.year_released,
        added :d.added,
        bpm : +d.bpm,
        nrgy : +d.nrgy,
        dnce : +d.dnce,
        dB : +d.dB,
        live : +d.live,
        val : +d.val,
        dur : +d.dur, 
        acous : +d.acous,
        spch : +d.spch,
        pop : +d.pop,
        top_year : +d.top_year,
        artist_type : parseNA(d.artist_type)
    }
}

function process(music){
    //const moviesClean = filterData(music);
    console.log(music);
}
d3.csv('data/spotify.csv',type).then(
    res=>{
        process(res);
        
    }
)