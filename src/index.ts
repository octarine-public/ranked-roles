import "./translations"

import {
	ArrayExtensions,
	DOTAGameUIState,
	EventsSDK,
	GameState,
	PlayerCustomData,
	Team
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class {
	private readonly hpThreshold = 50
	private readonly GUI = new GUIHelper()
	private readonly menu = new MenuManager()
	private readonly playersData: PlayerCustomData[] = []

	public Draw() {
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}
		if (!this.menu.State.value || !this.GUI.IsReady || this.GUI.IsGameInProgress) {
			return
		}
		for (let index = this.playersData.length - 1; index > -1; index--) {
			const player = this.playersData[index]
			if (!player.LaneSelections.length) {
				continue
			}
			// hide roles with low % health (if used top panel and any scripts enabled)
			if (player.Hero !== undefined && player.Hero.HPPercent < this.hpThreshold) {
				continue
			}
			if (player.Team !== Team.DraftPool) {
				this.GUI.Draw(player)
			}
		}
	}

	public PlayerCustomDataUpdated(entity: PlayerCustomData) {
		if (!entity.IsValid || entity.IsSpectator || !entity.IsEnemy()) {
			ArrayExtensions.arrayRemove(this.playersData, entity)
			return
		}
		if (this.GUI.IsGameInProgress) {
			return
		}
		if (this.playersData.every(x => x.PlayerID !== entity.PlayerID)) {
			this.playersData.push(entity)
		}
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("PlayerCustomDataUpdated", entity =>
	bootstrap.PlayerCustomDataUpdated(entity)
)
