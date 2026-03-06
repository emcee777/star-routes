// ============================================================
// Star Routes - Main Game Configuration
// ============================================================

import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { NewGameScene } from './scenes/NewGameScene';
import { StationScene } from './scenes/StationScene';
import { TravelScene } from './scenes/TravelScene';
import { GameOver } from './scenes/GameOver';
import { VictoryScene } from './scenes/VictoryScene';
import { AUTO, Game } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#' + COLORS.background.toString(16).padStart(6, '0'),
    scene: [
        Boot,
        Preloader,
        MainMenu,
        NewGameScene,
        StationScene,
        TravelScene,
        GameOver,
        VictoryScene,
    ],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
