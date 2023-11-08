import {
	Color,
	DOTAGameState,
	GameRules,
	GUIInfo,
	ImageData,
	LaneSelection,
	Menu,
	Player,
	Rectangle,
	RendererSDK,
	Team,
	Vector2
} from "github.com/octarine-public/wrapper/index"

export class GUIHelper {
	private readonly inGameColor = new Color(0xcf, 0xcf, 0xcf)
	private readonly inSelectionColor = new Color(0xaa, 0xaa, 0xaa)

	private readonly roleLocalizationNames = [
		"DOTA_TopBar_LaneSelectionSafelane",
		"DOTA_TopBar_LaneSelectionOfflane",
		"DOTA_TopBar_LaneSelectionMidlane",
		"DOTA_TopBar_LaneSelectionSupport",
		"DOTA_TopBar_LaneSelectionHardSupport"
	]

	public get IsReady() {
		return GUIInfo !== undefined && GUIInfo.TopBar !== undefined
	}

	public get IsGameInProgress() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS
	}

	private get color() {
		return this.isPreGame ? this.inGameColor : this.inSelectionColor
	}

	private get gameState() {
		return GameRules?.GameState ?? DOTAGameState.DOTA_GAMERULES_STATE_INIT
	}

	private get isPreGame() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_PRE_GAME
	}

	private get isShowCase() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_TEAM_SHOWCASE
	}

	private get isSelection() {
		return (
			this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_HERO_SELECTION ||
			this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_PLAYER_DRAFT ||
			this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_STRATEGY_TIME
		)
	}

	public Draw(player: Player) {
		if (this.isShowCase) {
			return
		}

		const laneSelections = player.LaneSelections
		const rolePosition = this.getPosition(player.Team, player.TeamSlot)?.Clone()
		if (rolePosition === undefined) {
			return
		}

		const size = rolePosition.Height
		const roleImageSize = new Vector2(size, size)

		if (this.isPreGame) {
			const length = laneSelections.length / 10
			const count = 2 - length
			rolePosition.Height *= count
			roleImageSize.MultiplyScalarForThis(count)
		}

		if (laneSelections.length === 1) {
			this.drawOnlyOneRole(rolePosition, roleImageSize, laneSelections[0])
			return
		}

		// render multiple tier icons from center
		const xPosition = rolePosition.x + rolePosition.Size.x / 2
		for (let index = laneSelections.length - 1; index > -1; index--) {
			const lane = laneSelections[index]
			const iconTier = ImageData.GetRank(lane)
			const position = new Vector2(xPosition, rolePosition.y + 1)
				.AddScalarX(index * roleImageSize.x)
				.SubtractScalarX((roleImageSize.x * laneSelections.length) / 2)
			RendererSDK.Image(iconTier, position, -1, roleImageSize, this.color)
		}
	}

	private getPosition(team: Team, slotId: number): Nullable<Rectangle> {
		if (this.isSelection) {
			return team === Team.Dire
				? GUIInfo.PreGame.DirePlayersRoles[slotId]
				: GUIInfo.PreGame.RadiantPlayersRoles[slotId]
		}
		return team === Team.Dire
			? GUIInfo.TopBar.DirePlayersManabars[slotId]
			: GUIInfo.TopBar.RadiantPlayersManabars[slotId]
	}

	private getRoleName(role: LaneSelection) {
		return Menu.Localization.Localize(this.roleLocalizationNames[role] ?? "No role")
	}

	private drawOnlyOneRole(
		rolePosition: Rectangle,
		roleImageSize: Vector2,
		lane: LaneSelection
	) {
		const roleName = this.getRoleName(lane)
		const iconTier = ImageData.GetRank(lane)

		const scaletextSize = !this.isPreGame ? 11 : 8
		const textSize = GUIInfo.ScaleHeight(scaletextSize)
		const getTextSize = this.getTextSize(roleName, textSize)

		const center = rolePosition.x + rolePosition.Size.x / 2
		const position = new Vector2(center, rolePosition.y)

		const textPosition = position
			.Clone()
			.SubtractScalarX(getTextSize.x / 2)
			.RoundForThis()

		if (!this.isPreGame) {
			const iconTierPosition = textPosition.SubtractScalarX(roleImageSize.x)
			RendererSDK.Image(iconTier, iconTierPosition, -1, roleImageSize, this.color)
		}

		if (roleName.length < 10 || !this.isPreGame) {
			if (this.isSelection) {
				textPosition.AddScalarX(roleImageSize.x)
			}
			this.drawText(roleName, textPosition, textSize)
			return
		}

		const names = roleName.split(" ")
		const gap = GUIInfo.ScaleHeight(13)

		for (const newName of names) {
			const newTextSize = this.getTextSize(newName, textSize)
			const newPosition = position.Clone().SubtractScalarX(newTextSize.x / 2)
			this.drawText(newName, newPosition, textSize)
			position.AddScalarY(gap)
		}
	}

	private getTextSize(name: string, size: number) {
		return RendererSDK.GetTextSize(name, RendererSDK.DefaultFontName, size, 600)
	}

	private drawText(name: string, position: Vector2, size: number) {
		RendererSDK.Text(
			name,
			position,
			this.color,
			RendererSDK.DefaultFontName,
			size,
			600
		)
	}
}
