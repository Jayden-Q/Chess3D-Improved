import DOMElements from './DOMElements.js';
import { Game, Background } from './Game/Game.js';
import Socket from './Socket.js';
import Loader from './Game/Loader.js';
import Assets from './Game/Assets.js';

const socket = new Socket();

let GAME = null;

const displayBanner = () => {
    console.log(`
 _____  _                     ____  _____  
/ ____ | |                   |___ \\|  __ \\ 
| |    | |__   ___  ___ ___    __) | |  ||
| |    | '_ \\ / _ \\/ __/ __|  |__ <| |  ||
| |____| | | |  __/\\__ \\__ \\  ___) | |__||
\\_____ |_| |_|\\___||___/___/ |____/|_____/ 
    `);
};

displayBanner();

const setVisible = (element, isVisible) => {
    isVisible
    ? element.classList.remove('hidden')
    : element.classList.add('hidden');
};

const getUsernameInput = () => {
    return DOMElements.input.username.value.trim() == '' ? 'Guest' : DOMElements.input.username.value.trim();
}

const OnLeaveCustomRoom = () => {
    setVisible(DOMElements.menus.home, true);
    setVisible(DOMElements.menus.createRoom, false);

    DOMElements.userList.innerHTML = '';
}

/////////////////
/* LOAD MODELS */
/////////////////
new Loader().LoadAll(Assets.models, res => {
    for (let i = 0; i < res.length; i++) {
        Assets.models[i].data = res[i];
        Assets.models[i].data.scale.multiplyScalar(0.04);
    }

    console.log('Finished loading assets.');
    console.log(Assets);

    const background = new Background(DOMElements.background);

    setVisible(DOMElements.screens.loadingScreen, false);
});

/* Host starts the game */
const OnStartGame = (side) => {
    GAME == null
    ? GAME = new Game(DOMElements.screens.gameScreen)
    : GAME.ResetGame();

    GAME.SetPlayerSide(side);

    setVisible(DOMElements.screens.mainScreen, false);
    setVisible(DOMElements.screens.serachingScreen, false);
    setVisible(DOMElements.screens.gameScreen, true);

    GAME.Resize();  
}

/* When the client wins the game */
const OnWinGame = () => {
    setVisible(DOMElements.screens.winScreen, true);
}

/* When the client loses the game */
const OnLoseGame = () => {
    setVisible(DOMElements.screens.loseScreen, true);
}

/* Server sends the custom room's ID */
const OnGetCustomRoomID = (ID) => {
    DOMElements.text.roomID.innerText = `${ID}`;
}

/* When a player joins the custom room */
const OnPlayerJoinRoom = (player) => {
    DOMElements.userList.insertAdjacentHTML('beforeend', `<p id='player-${player.ID}'>${player.username}</p>`);
}

/* When a player leaves the custom room */
const OnPlayerLeaveRoom = (player) => {
    DOMElements.userList.querySelector(`#player-${player.ID}`)?.remove();
}

/* When the client successfully joins a custom room */
const OnJoinCustomRoom = () => {
    setVisible(DOMElements.menus.home, false);
    setVisible(DOMElements.menus.createRoom, true);
    setVisible(DOMElements.buttons.start, false);
    setVisible(DOMElements.options, false);
}

Socket.instance.AddListener('game:start', OnStartGame);
Socket.instance.AddListener('game:win', OnWinGame);
Socket.instance.AddListener('game:lose', OnLoseGame);
Socket.instance.AddListener('room:id', OnGetCustomRoomID);
Socket.instance.AddListener('room:player_join', OnPlayerJoinRoom);
Socket.instance.AddListener('room:player_leave', OnPlayerLeaveRoom);
Socket.instance.AddListener('room:join', OnJoinCustomRoom);
Socket.instance.AddListener('room:remove', OnLeaveCustomRoom);

/* INPUT FILTERING */
const FilterRoomID = (e) => e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/, '');

/* PLAY BUTTON */
const OnPlayButtonClicked = () => {
    setVisible(DOMElements.screens.serachingScreen, true);

    Socket.instance.EmitEvent('username', getUsernameInput());
    Socket.instance.EmitEvent('game:search');
}

/* CREATE BUTTON */
const OnCreateButtonClicked = () => {
    setVisible(DOMElements.menus.home, false);
    setVisible(DOMElements.menus.createRoom, true);
    setVisible(DOMElements.options, true);
    setVisible(DOMElements.buttons.start, true);

    Socket.instance.EmitEvent('username', getUsernameInput());
    Socket.instance.EmitEvent('room:create');
}

/* JOIN BUTTON */
const OnJoinButtonClicked = () => {
    Socket.instance.EmitEvent('username', getUsernameInput());
    Socket.instance.EmitEvent('room:join', DOMElements.input.roomID.value);
}

/* BACK BUTTON */
const OnBackButtonClicked = () => {
    Socket.instance.EmitEvent('room:leave');
    setVisible(DOMElements.screens.winScreen, false);
    setVisible(DOMElements.screens.loseScreen, false);
    setVisible(DOMElements.screens.gameScreen, false);
    setVisible(DOMElements.screens.mainScreen, true);
    setVisible(DOMElements.menus.home, true);
    setVisible(DOMElements.menus.createRoom, false);
    DOMElements.userList.innerHTML = '';

    Background.instance.Resize();
}

/* START BUTTON */
const OnStartButtonClicked = () => {
    Socket.instance.EmitEvent('game:start');
}

DOMElements.input.roomID.addEventListener('input', FilterRoomID);
DOMElements.buttons.play.addEventListener('click', OnPlayButtonClicked);
DOMElements.buttons.create.addEventListener('click', OnCreateButtonClicked);
DOMElements.buttons.join.addEventListener("click", OnJoinButtonClicked);
DOMElements.buttons.back.forEach(button => button.addEventListener("click", OnBackButtonClicked));
DOMElements.buttons.start.addEventListener("click", OnStartButtonClicked);