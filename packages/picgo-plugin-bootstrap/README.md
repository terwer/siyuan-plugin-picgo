# picgo-plugin-bootstrap

picgo plugin bootstrap for siyuan-note

## Shell UX

- The normal topbar/settings entry opens a singleton DOM-mounted popup shell near the PicGo topbar button.
- Repeated entry clicks reuse the same shell iframe and focus/reposition it instead of creating more SiYuan dialogs.
- Closing the popup removes the shell DOM and listeners; plugin unload also destroys the shell.

## Legacy dialog fallback

The old SiYuan `Dialog` + iframe path is kept only as a temporary compatibility/debug fallback:

- implementation: `src/dialog.ts#showDialogPage`
- plugin debug command: `openPicgoDialogFallback`

Do not use the dialog path as the normal PicGo entry unless the mounted popup shell needs emergency debugging.
