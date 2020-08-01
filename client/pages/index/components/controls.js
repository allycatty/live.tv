import h from "stage0";

const View = h`
<div>
    <section class="modal" #modal>
        <div class="container unmute-modal">
            <h1>click anywhere to unmute this stream</h1>
        </div>
    </section>
    <section class="hidden flex control-panel" #panel>
        <div class="audio-panel">
            <button class="unmute-button" #mute>
                <svg class="svg"><use xlink:href="#svg-speaker"></use></svg>
            </button>
            <input class="slider" type="range"
                step="1" value="33" min="0" max="100"
                #volume>
        </div>
        <button class="fullscreen-button" #fullscreen>
            <svg class="svg"><use xlink:href="#svg-fullscreen"></use></svg>
        </button>
        <button class="hidden fullscreen-button" #unfullscreen>
            <svg class="svg"><use xlink:href="#svg-unfullscreen"></use></svg>
        </button>
    </section>
</div>
`;

const video = document.querySelector("#video");
const screen = document.querySelector("#screen");
const {modal, panel, volume, mute, fullscreen, unfullscreen} = View.collect(View);

let inModal = true;
modal.onclick = () => {
    inModal = false;
    modal.classList = "hidden";
    mute.classList = "mute-button";
    volume.value = 33
    video.muted = false;
    video.volume = volume.value / 100;
};

let inPanel = false;
panel.onmouseover = () => inPanel = true;
panel.onmouseout = () => inPanel = false;
document.body.onmousemove = () => {
    if (inModal) return;
    panel.classList.remove("hidden");
    setTimeout(() => {
        if (!inPanel) panel.classList.add("hidden");
    }, 1500);
}

mute.onclick = () => {
    video.muted = !video.muted;
    if (video.muted) {
        mute.classList = "unmute-button";
    } else {
        mute.classList = "mute-button";
        if (volume.value == 0) volume.value = 33
        video.volume = volume.value / 100;
    }
};

function setVolume() {
    video.volume = volume.value / 100;
    if (video.volume == 0) {
        video.muted = true;
        mute.classList = "unmute-button";
    } else {
        video.muted = false;
        mute.classList = "mute-button";
    }
}
volume.onchange = setVolume;
volume.oninput = setVolume;

fullscreen.onclick = () => {
    fullscreen.classList.add("hidden");
    unfullscreen.classList.remove("hidden");
    if (screen.requestFullscreen) {
        screen.requestFullscreen();
    } else if (screen.mozRequestFullScreen) {
        screen.mozRequestFullScreen();
    } else if (screen.webkitRequestFullscreen) {
        screen.webkitRequestFullscreen();
    } else if (screen.msRequestFullscreen) {
        screen.msRequestFullscreen();
    }
};

unfullscreen.onclick = () => {
    unfullscreen.classList.add("hidden");
    fullscreen.classList.remove("hidden");
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
};

export default View;
