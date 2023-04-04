export default Object.freeze({
    screens: {
        loadingScreen: document.querySelector('.loading'),
        serachingScreen: document.querySelector('.searching'),
        mainScreen: document.querySelector('.main-screen'),
        gameScreen: document.querySelector('.game-screen'),
        winScreen: document.querySelector('.win-screen'),
        loseScreen: document.querySelector('.lose-screen')
    },
    menus: {
        home: document.querySelector('.home'),
        createRoom: document.querySelector('.create-room'),
    },
    text: {
        roomID: document.querySelector('.room-id'),
    },
    buttons: {
        play: document.querySelector('.play-btn'),
        join: document.querySelector('.join-game-btn'),
        create: document.querySelector('.create-game-btn'),
        back: document.querySelectorAll('.back-btn'),
        start: document.querySelector('.start-game-btn'),
    },
    input: {
        username: document.querySelector('.username-input'),
        roomID: document.querySelector('.room-id-input'),
    },
    gameUI: {
        promoteOptionsContainer: document.querySelector('.promote-options'),
        promoteOptions: document.querySelectorAll('.options-list .option'),
    },
    background: document.querySelector('.background'),
    options: document.querySelector('.options'),
    userList: document.querySelector('.users'),
});