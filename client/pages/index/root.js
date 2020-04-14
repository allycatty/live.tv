import HLS from "util/hls.js/hls";
import Controls from "index/components/controls"

const video = document.querySelector("#video");
const screen = document.querySelector("#screen");
const streamURL = "https://live.tv/hls/stream.m3u8";

let hls;

function sleep_Async(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getSyncTime_Async(startTime) {
    return fetch("/sync", {})
        .then((response) => response.text())
        .then((txt) => isNaN(txt) ? 0 : Number(txt))
        // -15 is halfway through a 30 second playlist
        .then((time) => Math.round((time - 15.0) - (startTime / 1000.0)));
}

function getTitle_Async() {
    return fetch("/title", {}).then((response) => response.text());
}

function init() {
    hls = new HLS({
        defaultAudioCodec: "mp4a.40.2",
        autoStartLoad: false
    });
    hls.attachMedia(video);
    hls.on(HLS.Events.ERROR, async (event, data) => {
        if (data.fatal) {
            switch(data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
                if (data.details === "manifestLoadError" || data.details === "levelLoadError") {
                    await sleep_Async(1000);
                    hls.loadSource(streamURL);
                } else {
                    console.log(`NETWORK ERROR: ${data.type} -- ${data.details}`);
                    hls.destroy();
                }
                break;
            case HLS.ErrorTypes.MEDIA_ERROR:
                console.log(`MEDIA ERROR: ${data.type} -- ${data.details}`);
                hls.destroy();
                break;
            default:
                console.log(`DEFAULT ERROR: ${data.type} -- ${data.details}`);
                hls.destroy();
            }
        } else {
            console.log(`NON-FATAL ERROR: ${data.type} -- ${data.details}`);
            // Tolerate slight drift, but consider anything more serious as
            // cause to destroy & resync
            if (data.details !== "bufferStalledError") hls.destroy();
        }
    });
    hls.on(HLS.Events.MANIFEST_LOADED, async (event, data) => {
        document.title = await getTitle_Async();
        const startTime = Number(data.networkDetails.response
                .match(/stream-[0-9]+.ts/)[0]
                .match(/[0-9]+/)[0]);
        const syncTime = await getSyncTime_Async(startTime);
        hls.startLoad(syncTime);
    });
    hls.on(HLS.Events.BUFFER_CODECS, async (event, data) => {
        document.title = await getTitle_Async()
    });
    hls.on(HLS.Events.DESTROYING, (event, data) => init());
    hls.loadSource(streamURL);
}

screen.appendChild(Controls);
init();
