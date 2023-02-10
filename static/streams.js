const APP_ID = "10610abcf4d0446693bcce9c8035355c";
const CHANNEL = sessionStorage.getItem("room");
// change every 24h
const TOKEN = sessionStorage.getItem("token");

const agoraEngine = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const UID = sessionStorage.getItem("uid");
const USERNAME = sessionStorage.getItem("name");

let channelParameters = {
    // A variable to hold a local video  and audio track.
    // [0] -> audio
    // [1] -> video
    localTrack: null,
    // A variable to hold a remote audio track.
    remoteTrack: null,
    remoteUsers: null,
};

function checkForControlButtons() {
    const videosGrid = document.querySelector(".videos-grid");
    const controlButtons = document.querySelector(".control-buttons");
    console.log(videosGrid.innerHTML, "jkj");
    if (!videosGrid.innerHTML) {
        controlButtons.style.display = "none";
    }
}

const joinAndDisplayLocalStream = async () => {
    // checkForControlButtons();
    agoraEngine.on("user-published", handleUserJoin);
    agoraEngine.on("user-unpublished", handleUserLeave);

    // Room Name :
    document.querySelector(".room-name").innerText = CHANNEL;

    try {
        const member = await createMember();

        await agoraEngine.join(APP_ID, CHANNEL, TOKEN, null);
        channelParameters.localTrack =
            await AgoraRTC.createMicrophoneAndCameraTracks();

        let player = `
        <div class="video-container" id="user-container-${UID}">
            <div class="participant-name">${member.username}</div>
            <div class="video-player" id="user-${UID}"></div>
        </div>`;

        const videoGrid = document.querySelector(".video-grid");
        videoGrid.insertAdjacentHTML("beforeend", player);

        channelParameters.localTrack[0].play(`#user-${UID}`);
        channelParameters.localTrack[1].play(`#user-${UID}`);

        await agoraEngine.publish([
            channelParameters.localTrack[0],
            channelParameters.localTrack[1],
        ]);
    } catch (error) {
        console.log("there was no session", error);
        window.open("/", "_self");
    }
};

const handleUserJoin = async (user, mediaType) => {
    channelParameters.remoteUsers[user.uid] = user;

    const member = await getMember(user);
    await agoraEngine.subscribe(user, mediaType);

    if (mediaType == "video") {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player) {
            player.remove();
        }
        player = `
        <div class="video-container" id="user-container-${user.uid}">
            <div class="participant-name">${member.username}</div>
            <div class="video-player" id="user-${user.uid}"></div>
        </div>`;

        const videoGrid = document.querySelector(".video-grid");
        videoGrid.insertAdjacentHTML("beforeend", player);

        channelParameters.remoteTrack[0] = user.audioTrack;
        channelParameters.remoteTrack[1] = user.videoTrack;

        channelParameters.remoteTrack[1].play(`#user-${user.uid.toString()}`);
    }
    if (mediaType == "audio") {
        // Get the RemoteAudioTrack object in the AgoraRTCRemoteUser object.
        channelParameters.remoteTrack[0] = user.audioTrack;
        // Play the remote audio track. No need to pass any DOM element.
        channelParameters.remoteTrack[0].play(`#user-${user.uid.toString()}`);
    }
};

const handleUserLeave = async (user) => {
    await deleteMember();
    delete channelParameters.remoteUsers[user.uid];
    document.getElementById(`.user-container-${user.uid}`).remove();
};

document.getElementById("video-btn").addEventListener("click", toggleCamera);

document.getElementById("mic-btn").addEventListener("click", toggleMic);

document
    .getElementById("leave-btn")
    .addEventListener("click", leaveAndRemoveLocalStream);

async function leaveAndRemoveLocalStream() {
    for (let i = 0; i < channelParameters.localTrack.length; i++) {
        channelParameters.localTrack[i].stop();
        channelParameters.localTrack[i].close();
    }
    await agoraEngine.leave();
    window.open("/", "_self");
}

async function toggleCamera() {
    if (channelParameters.localTrack[1].muted) {
        await channelParameters.localTrack[1].setMuted(false);
        // change icon
    } else {
        await channelParameters.localTrack[1].setMuted(true);
        // change icon
    }
}

async function toggleMic() {
    if (channelParameters.localTrack[0].muted) {
        await channelParameters.localTrack[0].setMuted(false);
        // change icon
    } else {
        await channelParameters.localTrack[0].setMuted(true);
        // change icon
    }
}

const createMember = async () => {
    const res = await fetch("create_member", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: USERNAME, room: CHANNEL, UID: UID }),
    });
};

const getMember = async (user) => {
    const res = await fetch(`get_member/?UID=${user.uid}&room=${CHANNEL}`);

    return await res.json();
};

const deleteMember = async () => {
    const res = await fetch("delete_member", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: USERNAME, room: CHANNEL, UID: UID }),
    });
    return await res.json();
};

window.addEventListener("beforeunload", deleteMember);

window.onload = joinAndDisplayLocalStream;
