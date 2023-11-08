import "./translations"

import {
	DOTAGameUIState,
	Entity,
	EventsSDK,
	GameState,
	Player,
	Team
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class {
	protected readonly GUI = new GUIHelper()

	private readonly hpThreshold = 50
	private readonly menu = new MenuManager()
	private readonly players = new Set<Player>()

	public Draw() {
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}
		if (!this.menu.State.value || !this.GUI.IsReady || this.GUI.IsGameInProgress) {
			return
		}
		for (const player of this.players) {
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

	public EntityCreated(entity: Entity) {
		if (entity instanceof Player && !entity.IsSpectator) {
			this.players.add(entity)
		}
	}

	public EntityDestroyed(entity: Entity) {
		if (entity instanceof Player) {
			this.players.delete(entity)
		}
	}

	public EntityTeamChanged(entity: Entity) {
		if (!(entity instanceof Player) || entity.IsSpectator) {
			return
		}
		if (entity.IsValid) {
			this.players.add(entity)
			return
		}
		this.players.delete(entity)
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("EntityCreated", entity => bootstrap.EntityCreated(entity))

EventsSDK.on("EntityDestroyed", entity => bootstrap.EntityDestroyed(entity))

EventsSDK.on("EntityTeamChanged", entity => bootstrap.EntityTeamChanged(entity))
