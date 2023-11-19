import "./translations"

import {
	DOTAGameUIState,
	EventsSDK,
	GameState,
	PlayerCustomData,
	Team
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class {
	protected readonly GUI = new GUIHelper()

	private readonly hpThreshold = 50
	private readonly menu = new MenuManager()
	private readonly playersData = new Set<PlayerCustomData>()

	public Draw() {
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}
		if (!this.menu.State.value || !this.GUI.IsReady || this.GUI.IsGameInProgress) {
			return
		}
		for (const player of this.playersData) {
			if (!player.IsEnemy() || !player.LaneSelections.length) {
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
		if (!entity.IsValid || entity.IsSpectator) {
			this.playersData.delete(entity)
			return
		}
		if (!this.playersData.has(entity)) {
			this.playersData.add(entity)
		}
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("PlayerCustomDataUpdated", entity =>
	bootstrap.PlayerCustomDataUpdated(entity)
)
